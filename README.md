# Pixly: Minecraft server hosting plugin for Claude, ChatGPT and Codex

The Pixly plugin lets Claude, ChatGPT and Codex create and manage Minecraft servers on [Pixly](https://pixly.gg) through the Pixly MCP server at `https://pixly.gg/api/mcp`. Ask in plain language and the assistant runs the action on your own Pixly account.

## What you can ask

- "Which of my Pixly Minecraft servers are running right now?"
- "Create a Paper survival server called Weekend SMP for players in Germany."
- "Show me the latest console output from Creative Build."
- "Back up Creative Build before I change its mods."

The tools cover creating, starting, stopping and restarting servers; settings, mods, plugins and modpacks; console logs; backups, restores and world uploads; custom domain checks; Pixly prices compared with other hosts; and your balance and monthly spending. A server sleeps when nobody is playing, and a player joining starts it again.

## Install

**Claude Code**

```
/plugin install pixly --marketplace Wroud/pixly-plugins
```

**Codex**

```bash
codex plugin marketplace add wroud/pixly-plugins
```

Then enable `pixly@pixly` in the plugin list.

**claude.ai or another MCP client with OAuth support:** add `https://pixly.gg/api/mcp` as a remote MCP server (streamable HTTP).

## Sign-in and permissions

The first time a tool needs your account, you sign in to Pixly in the browser and approve access. Every action then runs as you, on your servers only. Before deleting, resetting or restoring, the assistant asks you to name the exact server or backup. The tools cannot add funds or change plans; for those, the assistant links you to your [Pixly dashboard](https://pixly.gg/dashboard/).

## Development

```bash
npm test                  # offline checks: manifests, listing limits, skill, review cases, secret scan
npm run test:live         # checks the live MCP server's tools through the MCP Inspector CLI
npm run inspect           # MCP Inspector web UI connected to the plugin's MCP server
npm run inspect:cli -- --method tools/list
npm run package           # dist/pixly.zip for the OpenAI plugin portal
claude plugin validate --strict ./plugins/pixly
```

To try local changes, add the checkout as a marketplace with `claude plugin marketplace add ./` or `codex plugin marketplace add ./`.

## Support

[Contact](https://pixly.gg/legal/contact/) · [Privacy policy](https://pixly.gg/legal/privacy/) · [Terms](https://pixly.gg/legal/terms/)
