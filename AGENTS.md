# Pixly plugins agent instructions

This repository is public. Never commit API keys, OAuth client secrets, reviewer credentials, internal hostnames or personal contact details, including in commit metadata. Reviewer credentials and OAuth client settings are entered in the submission portals only. `npm test` scans every tracked and untracked file for these and fails on a match. PNG assets must carry no metadata chunks.

- `plugins/pixly/.codex-plugin/plugin.json` is the source manifest. The Claude manifest repeats its fields, and `npm test` keeps the two equal.
- `npm run package` builds the OpenAI portal ZIP from the committed tree, so commit before packaging. The `publish` CI job uploads the same contents as the `pixly-plugin` artifact, and that download can be uploaded instead.
- The MCP Inspector version is pinned once, in `config.inspector` in `package.json`, and runs through `npx`. There is no lockfile: the secret scan's private-address pattern matches lockfile version strings.
- `npm run test:live` covers only what a client sees before sign-in. A tool that needs an account must answer `auth_required`.
