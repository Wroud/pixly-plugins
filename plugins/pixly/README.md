# Pixly

[Pixly](https://pixly.gg) hosts Minecraft servers. This plugin lets Claude, ChatGPT and Codex manage the servers in your Pixly account: list them, create a server in the region your players need, start or stop it, change its settings, mods and plugins, read the console, back up and restore worlds, and show your balance and this month's spending. Servers sleep when nobody is playing and wake when a player joins.

## Install in Claude Code

```
/plugin install pixly --marketplace Wroud/pixly-plugins
```

## What it connects to

The plugin adds one remote MCP server, `https://pixly.gg/api/mcp`, and a skill that explains how Pixly servers behave. It runs no local code. The first time a tool needs your account, you sign in to Pixly in your browser and approve access; every action then runs as you, on your own servers only. You can sign out by removing the connector.

The plugin cannot add funds, take payments or change plans. For anything the tools cannot do, it links you to your Pixly dashboard.

## Privacy and support

Pixly receives the requests the tools make and stores your servers' data as described in the [privacy policy](https://pixly.gg/legal/privacy/). Questions and problems: [pixly.gg/legal/contact](https://pixly.gg/legal/contact/).
