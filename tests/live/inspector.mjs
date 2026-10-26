import { execFile } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { readJson, repoRoot } from "../files.mjs";
import { PLUGIN_DIR } from "../plugin.mjs";

const run = promisify(execFile);
const { inspector } = readJson("package.json").config;
const storageDir = mkdtempSync(join(tmpdir(), "pixly-inspector-"));

export async function inspect(...args) {
  const argv = [
    "-y",
    inspector,
    "--cli",
    "--config",
    `${PLUGIN_DIR}/.mcp.json`,
    "--server",
    "pixly",
    "--stored-auth-only",
    "--format",
    "json",
    "-q",
    ...args,
  ];
  const env = {
    ...process.env,
    MCP_STORAGE_DIR: storageDir,
    MCP_INSPECTOR_SECRET_STORE: "memory",
    MCP_AUTO_OPEN_ENABLED: "false",
  };
  try {
    const { stdout } = await run("npx", argv, { cwd: repoRoot, env, maxBuffer: 64 * 1024 * 1024 });
    return { code: 0, ...JSON.parse(stdout) };
  } catch (failure) {
    if (typeof failure.code !== "number") {
      throw failure;
    }
    const envelope = failure.stderr.trim().split("\n").at(-1);
    return { code: failure.code, stdout: failure.stdout, ...JSON.parse(envelope) };
  }
}
