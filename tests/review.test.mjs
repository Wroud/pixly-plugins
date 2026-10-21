import assert from "node:assert/strict";
import { test } from "node:test";
import { readJson } from "./files.mjs";

const cases = readJson("review/test-cases.json");

test("at least five positive cases with every review field", () => {
  assert.ok(cases.positive.length >= 5);
  for (const testCase of cases.positive) {
    assert.ok(testCase.description);
    assert.ok(testCase.prompt);
    assert.ok(testCase.tools_triggered.length > 0, testCase.prompt);
    assert.ok(testCase.expected_behavior);
  }
});

test("at least three negative cases with an expected fallback", () => {
  assert.ok(cases.negative.length >= 3);
  for (const testCase of cases.negative) {
    assert.ok(testCase.description);
    assert.ok(testCase.prompt);
    assert.ok(testCase.expected_behavior);
    assert.equal(testCase.tools_triggered, undefined);
  }
});

test("prompts are unique", () => {
  const prompts = [...cases.positive, ...cases.negative].map((c) => c.prompt);
  assert.equal(new Set(prompts).size, prompts.length);
});
