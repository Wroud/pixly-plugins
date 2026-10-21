import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { before, describe, test } from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import { fetchJson, readJson, repoRoot } from "./files.mjs";

const PLUGIN_DIR = "plugins/pixly";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_PX = 4096;
const MIN_ICON_PX = 48;

const manifest = readJson(`${PLUGIN_DIR}/plugin.json`);
const mcpConfig = readJson(`${PLUGIN_DIR}/mcp.json`);
const marketplace = readJson(".agents/plugins/marketplace.json");
const openai = manifest.extensions["com.openai"];
const listing = openai.interface;

function pluginPath(path) {
  assert.match(path, /^\.\//, `${path} must start with ./`);
  const absolute = resolve(repoRoot, PLUGIN_DIR, path);
  const inside = relative(join(repoRoot, PLUGIN_DIR), absolute);
  assert.ok(!inside.startsWith(".."), `${path} escapes the plugin root`);
  assert.ok(existsSync(absolute), `${path} does not exist`);
  return absolute;
}

function imageSize(absolute) {
  const bytes = readFileSync(absolute);
  if (absolute.endsWith(".png")) {
    assert.equal(bytes.toString("ascii", 12, 16), "IHDR");
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  }
  if (absolute.endsWith(".svg")) {
    const viewBox = bytes.toString("utf8").match(/viewBox="([^"]+)"/);
    assert.ok(viewBox, `${absolute} has no viewBox`);
    const [, , width, height] = viewBox[1].trim().split(/[\s,]+/).map(Number);
    return { width, height, vector: true };
  }
  assert.fail(`${absolute} is not a PNG or SVG`);
}

describe("manifests match the Agent Plugins schemas", () => {
  let ajv;

  before(async () => {
    ajv = new Ajv2020({ allErrors: true, strict: false });
    for (const kind of ["plugin", "mcp"]) {
      ajv.addSchema(
        await fetchJson(`https://agent-plugins.org/schemas/1.0.0/${kind}.schema.json`),
      );
    }
  });

  for (const [kind, document] of [
    ["plugin", manifest],
    ["mcp", mcpConfig],
  ]) {
    test(`${kind}.json`, () => {
      const validate = ajv.getSchema(
        `https://agent-plugins.org/schemas/1.0.0/${kind}.schema.json`,
      );
      assert.ok(validate(document), JSON.stringify(validate.errors, null, 2));
    });
  }
});

describe("OpenAI listing limits", () => {
  test("text fields fit the directory limits", () => {
    assert.ok(listing.displayName.length <= 30);
    assert.ok(listing.shortDescription.length <= 30);
    assert.ok(listing.longDescription.length <= 4000);
    assert.ok(listing.capabilities.length <= 20);
    for (const capability of listing.capabilities) {
      assert.ok(capability.length <= 120);
    }
    assert.ok(listing.defaultPrompt.length <= 3);
    for (const prompt of listing.defaultPrompt) {
      assert.ok(prompt.length <= 128, prompt);
    }
  });

  test("the display name is a brand, not a technology label", () => {
    assert.doesNotMatch(listing.displayName, /\b(mcp|plugin|server)\b/i);
  });

  test("listing copy carries no pricing or promotion", () => {
    const copy = [
      manifest.description,
      listing.shortDescription,
      listing.longDescription,
      ...listing.defaultPrompt,
    ].join(" ");
    assert.doesNotMatch(
      copy,
      /\$|€|\bprice|\bpricing|\bfree\b|\btrial|\bdiscount|\bsubscri|\bcheap|\bbest\b/i,
    );
  });

  test("review URLs are public HTTPS links", () => {
    for (const key of [
      "websiteURL",
      "supportURL",
      "privacyPolicyURL",
      "termsOfServiceURL",
    ]) {
      assert.match(listing[key], /^https:\/\//, key);
    }
  });

  test("icons are square and within the image limits", () => {
    for (const key of ["logo", "composerIcon"]) {
      const absolute = pluginPath(listing[key]);
      assert.ok(statSync(absolute).size <= MAX_IMAGE_BYTES, key);
      const { width, height, vector } = imageSize(absolute);
      assert.equal(width, height, `${key} is not square`);
      if (!vector) {
        assert.ok(width >= MIN_ICON_PX && width <= MAX_IMAGE_PX, key);
      }
    }
    for (const screenshot of listing.screenshots) {
      const absolute = pluginPath(screenshot);
      assert.ok(statSync(absolute).size <= MAX_IMAGE_BYTES, screenshot);
      const { width, height } = imageSize(absolute);
      assert.ok(width <= MAX_IMAGE_PX && height <= MAX_IMAGE_PX, screenshot);
    }
  });

  test("the package declares nothing the public directory rejects", () => {
    assert.equal(openai.hooks, undefined);
    assert.equal(openai.apps, undefined);
    assert.ok(!existsSync(join(repoRoot, PLUGIN_DIR, "hooks")));
    assert.ok(!existsSync(join(repoRoot, PLUGIN_DIR, ".app.json")));
  });
});

describe("MCP server", () => {
  const servers = Object.values(mcpConfig.mcpServers);

  test("exactly one remote HTTPS server with no headers", () => {
    assert.equal(servers.length, 1);
    const [server] = servers;
    assert.equal(server.type, "streamable-http");
    assert.equal(new URL(server.url).protocol, "https:");
    assert.equal(server.headers, undefined);
  });
});

describe("marketplace", () => {
  test("every entry points at a plugin of the same name", () => {
    assert.ok(marketplace.plugins.length > 0);
    for (const entry of marketplace.plugins) {
      assert.equal(entry.source.source, "local");
      assert.match(entry.source.path, /^\.\/plugins\//);
      const entryManifest = readJson(join(entry.source.path, "plugin.json"));
      assert.equal(entryManifest.name, entry.name);
      assert.ok(
        ["AVAILABLE", "INSTALLED_BY_DEFAULT", "NOT_AVAILABLE"].includes(
          entry.policy.installation,
        ),
      );
      assert.ok(entry.policy.authentication);
      assert.ok(entry.category);
    }
  });
});

describe("skills", () => {
  const skillsDir = join(repoRoot, PLUGIN_DIR, "skills");
  const skills = readdirSync(skillsDir);

  test("the plugin ships at least one skill", () => {
    assert.ok(skills.length > 0);
  });

  for (const skill of skills) {
    test(`${skill} has matching frontmatter`, () => {
      const body = readFileSync(join(skillsDir, skill, "SKILL.md"), "utf8");
      const frontmatter = body.match(/^---\n([\s\S]*?)\n---\n/);
      assert.ok(frontmatter, "SKILL.md has no frontmatter");
      const fields = Object.fromEntries(
        frontmatter[1].split("\n").map((line) => {
          const colon = line.indexOf(":");
          return [line.slice(0, colon).trim(), line.slice(colon + 1).trim()];
        }),
      );
      assert.equal(fields.name, skill);
      assert.ok(fields.description.length > 0 && fields.description.length <= 1024);
    });
  }
});
