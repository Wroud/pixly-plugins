import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, test } from "node:test";
import { readJson, repoRoot } from "./files.mjs";
import { PLUGIN_DIR, manifest, mcpConfig } from "./plugin.mjs";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_PX = 4096;
const MIN_ICON_PX = 48;
const PNG_CHUNKS_WITHOUT_METADATA = new Set(["IHDR", "PLTE", "tRNS", "IDAT", "IEND"]);

const marketplace = readJson(".agents/plugins/marketplace.json");
const listing = manifest.interface;

function pluginPath(path) {
  assert.match(path, /^\.\//, `${path} must start with ./`);
  const absolute = resolve(repoRoot, PLUGIN_DIR, path);
  const inside = relative(join(repoRoot, PLUGIN_DIR), absolute);
  assert.ok(!inside.startsWith(".."), `${path} escapes the plugin root`);
  assert.ok(existsSync(absolute), `${path} does not exist`);
  return absolute;
}

function checkedImage(path) {
  const absolute = pluginPath(path);
  assert.ok(statSync(absolute).size <= MAX_IMAGE_BYTES, path);
  return imageSize(absolute);
}

function pngChunks(bytes) {
  const chunks = [];
  for (let offset = 8; offset < bytes.length; offset += 12 + bytes.readUInt32BE(offset)) {
    chunks.push(bytes.toString("ascii", offset + 4, offset + 8));
  }
  return chunks;
}

function luminance(hex) {
  assert.match(hex, /^#[0-9A-Fa-f]{6}$/);
  const [r, g, b] = [1, 3, 5].map((offset) => {
    const channel = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(first, second) {
  const [light, dark] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
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

describe("Codex package layout", () => {
  test("the manifest identifies the plugin", () => {
    assert.match(manifest.name, /^[a-z0-9]+(-[a-z0-9]+)*$/);
    assert.ok(manifest.version);
    assert.ok(manifest.description);
    assert.ok(manifest.author.name);
    pluginPath(manifest.skills);
    pluginPath(manifest.mcpServers);
  });

  test(".codex-plugin holds only the manifest", () => {
    assert.deepEqual(readdirSync(join(repoRoot, PLUGIN_DIR, ".codex-plugin")), ["plugin.json"]);
  });
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

  test("brand colours keep 2:1 contrast against their theme backgrounds", () => {
    assert.ok(contrast(listing.brandColor, "#FFFFFF") >= 2, listing.brandColor);
    if (listing.brandColorDark) {
      assert.ok(contrast(listing.brandColorDark, "#212121") >= 2, listing.brandColorDark);
    }
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
      const { width, height, vector } = checkedImage(listing[key]);
      assert.equal(width, height, `${key} is not square`);
      if (!vector) {
        assert.ok(width >= MIN_ICON_PX && width <= MAX_IMAGE_PX, key);
      }
    }
    for (const screenshot of listing.screenshots) {
      const { width, height } = checkedImage(screenshot);
      assert.ok(width <= MAX_IMAGE_PX && height <= MAX_IMAGE_PX, screenshot);
    }
  });

  test("PNG assets carry no metadata chunks", () => {
    const assetsDir = join(repoRoot, PLUGIN_DIR, "assets");
    for (const file of readdirSync(assetsDir).filter((name) => name.endsWith(".png"))) {
      const extra = pngChunks(readFileSync(join(assetsDir, file))).filter(
        (chunk) => !PNG_CHUNKS_WITHOUT_METADATA.has(chunk),
      );
      assert.deepEqual(extra, [], file);
    }
  });

  test("the package declares nothing the public directory rejects", () => {
    assert.equal(manifest.hooks, undefined);
    assert.equal(manifest.apps, undefined);
    assert.ok(!existsSync(join(repoRoot, PLUGIN_DIR, "hooks")));
    assert.ok(!existsSync(join(repoRoot, PLUGIN_DIR, ".app.json")));
  });
});

describe("MCP server", () => {
  const servers = Object.values(mcpConfig.mcpServers);

  test("exactly one remote HTTPS server with no headers", () => {
    assert.equal(servers.length, 1);
    const [server] = servers;
    assert.equal(server.type, "http");
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
      const entryManifest = readJson(join(entry.source.path, ".codex-plugin", "plugin.json"));
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
