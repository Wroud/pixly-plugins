import assert from "node:assert/strict";
import { before, describe, test } from "node:test";
import { mcpConfig, review } from "../plugin.mjs";

const HINTS = ["readOnlyHint", "destructiveHint", "openWorldHint"];
const MIN_DESCRIPTION_LENGTH = 40;

const [server] = Object.values(mcpConfig.mcpServers);

async function rpc(id, method, params) {
  const response = await fetch(server.url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
  });
  assert.equal(response.status, 200, `${method} answered ${response.status}`);
  const message = await response.json();
  assert.equal(message.error, undefined, JSON.stringify(message.error));
  return message.result;
}

describe(`tools served by ${server.url}`, () => {
  let tools;

  before(async () => {
    await rpc(1, "initialize", {
      protocolVersion: "2025-11-25",
      capabilities: {},
      clientInfo: { name: "pixly-plugins-test", version: "0.0.0" },
    });
    tools = (await rpc(2, "tools/list", {})).tools;
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
});
