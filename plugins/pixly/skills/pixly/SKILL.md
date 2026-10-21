---
name: pixly
description: Manage the user's Pixly Minecraft servers through the Pixly tools - create, start, stop, configure, add mods or plugins, read the console, and back up or restore worlds. Use when the user asks about their Pixly servers or wants a Minecraft server hosted on Pixly.
---

# Pixly

Pixly hosts Minecraft servers. The user signs in to their own Pixly account, and every tool acts only on that account's servers.

## Finding a server

Call `listServers` first and refer to servers by the name the user knows. Use the returned server id in later calls. If two servers match the name, ask which one.

## Server lifecycle

- `createServer` creates a server that is asleep. It does not start it. Call `runServerAction` with `start` when the user wants to play now.
- A sleeping server also wakes by itself when a player connects to its address, and goes back to sleep after it has been idle for a while.
- `keepServerAwake` postpones the idle sleep while the owner is actively working on the server.
- Starting takes a few minutes. After `start`, check `listServers` again instead of assuming the server is online.

## Settings, mods and plugins

- Change settings with `updateServer`, sending only the fields the user asked to change.
- Add mods, plugins and modpacks without pinning a release unless the user names a specific version or gives a file link. Pixly picks a release that matches the server's Minecraft version and loader.
- Use `getLoaderVersions` to check which Minecraft versions a loader supports before changing a server's type or version.
- Changing the server type or Minecraft version can make an existing world or its mods incompatible. Say so and suggest `createBackup` first.

## Console and troubleshooting

`getConsoleLogs` returns recent console output. Read it before suggesting fixes for crashes or failed starts, and quote the relevant lines.

## Backups and uploads

- `createBackup` saves the current world. `listBackups` shows existing backups.
- Upload tools (`startWorldUpload`, `startAssetUpload`, `startModpackUpload`) return upload URLs that the file bytes must be sent to before the matching complete call. Only use them when you can actually send the file, for example from a local shell. Otherwise tell the user to upload the file on pixly.gg.

## Confirm before acting

Ask the user to confirm, naming the server, before any of these:

- `deleteServer`, `resetServer`, `restoreBackup`, `deleteBackup`, `deleteAsset`, `deleteModpack`
- stopping or restarting a server that has players online
- an `updateServer` call that changes the server type or Minecraft version

Never perform one of these as a side effect of a different request.

## Account and billing

Running servers use the balance in the user's Pixly account. These tools cannot add funds or change plans. If a call fails because of the account balance, tell the user to manage their account on pixly.gg.
