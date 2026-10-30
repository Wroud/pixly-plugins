#!/usr/bin/env bash
set -euo pipefail

: "${MCP_PRIVATE_KEY:?MCP_PRIVATE_KEY is not configured}"

install_dir="$RUNNER_TEMP/mcp-publisher"
mkdir -p "$install_dir"
archive="$install_dir/mcp-publisher_linux_amd64.tar.gz"
base_url="https://github.com/modelcontextprotocol/registry/releases/download/$MCP_PUBLISHER_VERSION"

curl --fail --location --silent --show-error --retry 3 --max-time 60 \
  --output "$archive" "$base_url/mcp-publisher_linux_amd64.tar.gz"
curl --fail --location --silent --show-error --retry 3 --max-time 60 \
  --output "$archive.sigstore.json" "$base_url/mcp-publisher_linux_amd64.tar.gz.sigstore.json"
cosign verify-blob \
  --bundle "$archive.sigstore.json" \
  --certificate-identity "https://github.com/modelcontextprotocol/registry/.github/workflows/release.yml@refs/tags/$MCP_PUBLISHER_VERSION" \
  --certificate-oidc-issuer "https://token.actions.githubusercontent.com" \
  "$archive"
tar xzf "$archive" -C "$install_dir" mcp-publisher

"$install_dir/mcp-publisher" validate server.json
"$install_dir/mcp-publisher" login dns --domain pixly.gg --private-key "$MCP_PRIVATE_KEY"
"$install_dir/mcp-publisher" publish server.json

name=$(jq -er '.name | @uri' server.json)
version=$(jq -er '.version | @uri' server.json)
response="$RUNNER_TEMP/mcp-registry-published.json"

curl --fail --silent --show-error --retry 3 --max-time 30 \
  --output "$response" \
  "https://registry.modelcontextprotocol.io/v0.1/servers/$name/versions/$version"
jq --exit-status --slurpfile expected server.json \
  '.server == $expected[0] and ._meta["io.modelcontextprotocol.registry/official"].status == "active"' \
  "$response" > /dev/null
