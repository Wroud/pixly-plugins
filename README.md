# Pixly plugins

Plugin package for [Pixly](https://pixly.gg), the Minecraft server host, for Claude, ChatGPT and Codex. It connects the Pixly MCP server at `https://pixly.gg/api/mcp` and ships a skill that teaches the assistant how Pixly servers behave. Every action runs as the signed-in Pixly user; you sign in with your Pixly account when you first use it.

## Install in Claude Code

```
/plugin install pixly --marketplace Wroud/pixly-plugins
```

On claude.ai, add Pixly from the connector directory, or add `https://pixly.gg/api/mcp` as a custom connector.

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
.claude-plugin/marketplace.json    Claude Code marketplace listing the same plugins
plugins/pixly/
  .codex-plugin/plugin.json        manifest, directory listing and review test cases
  .claude-plugin/plugin.json       Claude manifest; shares name, version and description with the Codex one
  README.md                        the Claude directory listing text
  .mcp.json                        the remote Pixly MCP server
  skills/pixly/SKILL.md            how to use the Pixly tools
  assets/                          logo and composer icon
tests/                             package checks (offline)
tests/live/                        contract checks against the live MCP server
```

## Develop

```bash
npm test             # package layout, listing limits, skills, review cases, secret scan
npm run test:live    # tool annotations and descriptions served by pixly.gg/api/mcp
npm run package      # dist/pixly.zip for the OpenAI portal, from the committed plugins/pixly tree: only `.codex-plugin`, `.mcp.json`, `skills` and `assets`
```

The `publish` CI job unpacks that ZIP into the `pixly-plugin` artifact, so the downloaded artifact ZIP has the same contents and can be uploaded instead.

To try local changes, add the checkout as a marketplace: `codex plugin marketplace add ./` or `claude plugin marketplace add ./`. Check the Claude side with `claude plugin validate --strict ./plugins/pixly` and `claude plugin validate --strict .`; the Claude directory reads the repository itself, so it needs no ZIP.

## Public repository rules

Nothing secret belongs here: no API keys, OAuth client secrets, reviewer credentials, internal hostnames or personal contact details. Reviewer credentials and any OAuth client configuration are entered in the submission portal, never committed. `npm test` scans every tracked and untracked file and fails on credentials, credential files, AWS identifiers, private network addresses, internal hostnames and email addresses. PNG assets must carry no metadata chunks.

## Support

[pixly.gg/legal/contact](https://pixly.gg/legal/contact/) · [Privacy](https://pixly.gg/legal/privacy/) · [Terms](https://pixly.gg/legal/terms/)
