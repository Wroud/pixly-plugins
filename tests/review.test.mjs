import assert from "node:assert/strict";
import { test } from "node:test";
import { readJson } from "./files.mjs";

const review = readJson("plugins/pixly/.codex-plugin/plugin.json").extensions["com.openai"].review;
const cases = review.test_cases;

test("exactly five positive cases with every review field", () => {
  assert.equal(cases.positive.length, 5);
  for (const testCase of cases.positive) {
    assert.ok(testCase.description);
    assert.ok(testCase.prompt);
    assert.equal(typeof testCase.tools_triggered, "string", testCase.prompt);
    assert.ok(testCase.tools_triggered.length > 0, testCase.prompt);
    assert.ok(testCase.expected_behavior);
  }
});

test("exactly three negative cases with an expected fallback", () => {
  assert.equal(cases.negative.length, 3);
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

test("the package carries no reviewer credentials or instructions", () => {
  assert.equal(review.test_credentials, undefined);
  assert.equal(review.reviewer_instructions, undefined);
});

test("commerce is declared", () => {
  assert.equal(typeof review.commerce, "boolean");
  assert.ok(review.commerce_description);
});
