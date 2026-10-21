import { readJson } from "./files.mjs";

export const PLUGIN_DIR = "plugins/pixly";
export const manifest = readJson(`${PLUGIN_DIR}/.codex-plugin/plugin.json`);
export const mcpConfig = readJson(`${PLUGIN_DIR}/.mcp.json`);
export const review = manifest.extensions["com.openai"].review;
