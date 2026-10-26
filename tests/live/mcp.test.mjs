import assert from "node:assert/strict";
import { before, describe, test } from "node:test";
import { mcpConfig, review } from "../plugin.mjs";
import { inspect } from "./inspector.mjs";

const HINTS = ["readOnlyHint", "destructiveHint", "openWorldHint"];
const MIN_DESCRIPTION_LENGTH = 40;
const PUBLIC_TOOLS = ["getPricingCatalog", "getBedrockRange", "getLoaderVersions"];
const EXIT_AUTH_REQUIRED = 3;

const [server] = Object.values(mcpConfig.mcpServers);

describe(`tools served by ${server.url}`, () => {
  let tools;

  before(async () => {
    const listing = await inspect("--method", "tools/list");
    assert.equal(listing.code, 0, JSON.stringify(listing.error));
    tools = listing.result.tools;
  });

  test("the server initializes with instructions", async () => {
    const { code, result, error } = await inspect("--method", "initialize");
    assert.equal(code, 0, JSON.stringify(error));
    assert.ok(result.capabilities.tools);
    assert.match(result.instructions ?? "", /\S/);
  });

  test("tool schemas carry no error-severity portability problem", async () => {
    const { code, schemaFindings } = await inspect("--method", "tools/list", "--strict");
    const errors = (schemaFindings ?? []).flatMap((tool) =>
      tool.findings
        .filter((finding) => finding.severity === "error")
        .map((finding) => `${tool.toolName} ${finding.schema}.${finding.path}: ${finding.rule}`),
    );
    assert.deepEqual(errors, []);
    assert.equal(code, 0);
  });

  test("tool names are unique", () => {
    const names = tools.map((tool) => tool.name);
    assert.equal(new Set(names).size, names.length);
  });

  test("every tool sets all three hints explicitly", () => {
    const missing = tools.flatMap((tool) =>
      HINTS.filter((hint) => typeof tool.annotations?.[hint] !== "boolean").map(
        (hint) => `${tool.name}.${hint}`,
      ),
    );
    assert.deepEqual(missing, []);
  });

  test("read-only tools are never marked destructive", () => {
    const contradictory = tools
      .filter((tool) => tool.annotations?.readOnlyHint === true)
      .filter((tool) => tool.annotations?.destructiveHint === true)
      .map((tool) => tool.name);
    assert.deepEqual(contradictory, []);
  });

  test("every tool has a description that says what it does and when to use it", () => {
    const thin = tools
      .filter((tool) => (tool.description ?? "").length < MIN_DESCRIPTION_LENGTH)
      .map((tool) => `${tool.name}: ${JSON.stringify(tool.description ?? "")}`);
    assert.deepEqual(thin, []);
  });

  test("every tool named in the review cases exists", () => {
    const names = new Set(tools.map((tool) => tool.name));
    const unknown = review.test_cases.positive
      .flatMap((testCase) => testCase.tools_triggered.split(",").map((name) => name.trim()))
      .filter((name) => !names.has(name));
    assert.deepEqual(unknown, []);
  });

  test("public read-only tools answer without signing in", async () => {
    for (const name of PUBLIC_TOOLS) {
      const { code, result, error } = await inspect("--method", "tools/call", "--tool-name", name);
      assert.equal(code, 0, `${name}: ${JSON.stringify(error)}`);
      assert.notEqual(result.isError, true, name);
    }
  });

  test("account tools ask the client to sign in", async () => {
    const { code, error } = await inspect("--method", "tools/call", "--tool-name", "listServers");
    assert.equal(code, EXIT_AUTH_REQUIRED, JSON.stringify(error));
    assert.equal(error.code, "auth_required");
  });
});
