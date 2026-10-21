# Pixly plugins

Plugin package for [Pixly](https://pixly.gg), the Minecraft server host, for ChatGPT and Codex. It connects the Pixly MCP server at `https://pixly.gg/api/mcp` and ships a skill that teaches the assistant how Pixly servers behave. Every action runs as the signed-in Pixly user; you sign in with your Pixly account when you first use it.

## Install in Codex

```bash
codex plugin marketplace add wroud/pixly-plugins
```

Then enable `pixly@pixly` from the plugin list, or in `.codex/config.toml`:

```toml
[plugins."pixly@pixly"]
enabled = true
```

## Layout

```
.agents/plugins/marketplace.json   Codex marketplace listing this repository's plugins
plugins/pixly/
  plugin.json                      Agent Plugins manifest; OpenAI listing under extensions."com.openai"
  mcp.json                         the remote Pixly MCP server
  skills/pixly/SKILL.md            how to use the Pixly tools
  assets/                          logo and composer icon
review/test-cases.json             positive and negative cases for directory review
tests/                             package checks (offline except schema download)
tests/live/                        contract checks against the live MCP server
```

## Develop

```bash
corepack enable
yarn install
yarn test        # manifests, listing limits, skills, review cases, secret scan
yarn test:live   # tool annotations and descriptions served by pixly.gg/api/mcp
yarn pack        # dist/pixly.zip from the committed plugins/pixly tree
```

To try local changes in Codex, add the checkout as a marketplace: `codex plugin marketplace add ./`.

## Public repository rules

Nothing secret belongs here: no API keys, OAuth client secrets, reviewer credentials, internal hostnames or personal contact details. Reviewer credentials and any OAuth client configuration are entered in the submission portal, never committed. `yarn test` scans every tracked and untracked file and fails on credentials, credential files, AWS identifiers and email addresses.

## Support

[pixly.gg/legal/contact](https://pixly.gg/legal/contact/) · [Privacy](https://pixly.gg/legal/privacy/) · [Terms](https://pixly.gg/legal/terms/)
