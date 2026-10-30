#!/usr/bin/env bash
set -euo pipefail

name=$(jq -er '.name | @uri' server.json)
version=$(jq -er '.version | @uri' server.json)
response="$RUNNER_TEMP/mcp-registry-version.json"
status=$(curl --silent --show-error --retry 3 --max-time 30 \
  --output "$response" --write-out '%{http_code}' \
  "https://registry.modelcontextprotocol.io/v0.1/servers/$name/versions/$version")

case "$status" in
  200)
    if ! jq --exit-status --slurpfile expected server.json '.server == $expected[0]' "$response" > /dev/null; then
      echo '::error::This version already exists with different metadata. Bump the version in server.json.'
      exit 1
    fi
    echo 'This version is already published with identical metadata.'
    echo 'publish=false' >> "$GITHUB_OUTPUT"
    ;;
  404)
    echo 'publish=true' >> "$GITHUB_OUTPUT"
    ;;
  *)
    echo "::error::Registry lookup failed with HTTP $status."
    exit 1
    ;;
esac
