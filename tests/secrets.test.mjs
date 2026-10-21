import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { test } from "node:test";
import { repoFiles, repoRoot } from "./files.mjs";

const SECRET_PATTERNS = [
  ["AWS access key", /\b(AKIA|ASIA)[0-9A-Z]{16}\b/],
  ["AWS ARN", /\barn:aws[a-z-]*:/],
  ["AWS endpoint", /\.amazonaws\.com\b/],
  ["private key", /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ["Stripe key", /\b[rsp]k_(live|test)_[0-9A-Za-z]{10,}/],
  ["GitHub token", /\bgh[pousr]_[0-9A-Za-z]{30,}\b/],
  ["Slack token", /\bxox[abprs]-[0-9A-Za-z-]{10,}/],
  ["Google API key", /\bAIza[0-9A-Za-z_-]{35}\b/],
  ["OpenAI key", /\bsk-(proj-)?[0-9A-Za-z_-]{20,}/],
  ["Anthropic key", /\bsk-ant-[0-9A-Za-z_-]{20,}/],
  ["JWT", /\beyJ[0-9A-Za-z_-]{10,}\.eyJ[0-9A-Za-z_-]{10,}\.[0-9A-Za-z_-]{10,}/],
  ["client secret field", /client_?secret"?\s*[:=]\s*"[^"]+"/i],
  ["password field", /pass(word)?"?\s*[:=]\s*"[^"]+"/i],
  ["bearer credential", /\bBearer\s+[0-9A-Za-z._~+/-]{20,}/],
  ["private network address", /\b(10|192\.168|172\.(1[6-9]|2\d|3[01]))(\.\d{1,3}){2,3}\b/],
  ["internal hostname", /\.(local|internal|lan)\b/],
  ["email address", /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/],
];

const FORBIDDEN_NAMES = [/^\.env(\..*)?$/, /\.pem$/, /\.p12$/, /\.key$/, /^id_[a-z0-9]+$/];

const files = repoFiles();

test("no credential files are present", () => {
  const offenders = files.filter((file) =>
    FORBIDDEN_NAMES.some((pattern) => pattern.test(basename(file))),
  );
  assert.deepEqual(offenders, []);
});

test("no file contains a credential, internal address or personal email", () => {
  const findings = [];
  for (const file of files) {
    const bytes = readFileSync(join(repoRoot, file));
    if (bytes.includes(0)) {
      continue;
    }
    const text = bytes.toString("utf8");
    for (const [label, pattern] of SECRET_PATTERNS) {
      if (pattern.test(text)) {
        findings.push(`${file}: ${label}`);
      }
    }
  }
  assert.deepEqual(findings, []);
});
