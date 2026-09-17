#!/usr/bin/env bash
# Run a command inside the pinned Playwright/Node container.
# node_modules lives in a named volume so Linux binaries never land on the host.
set -euo pipefail
IMAGE="mcr.microsoft.com/playwright:v1.63.0-noble@sha256:eff16c30e6f3f4af0a03fa4b706120d5e9b0891c344a27d64559aff5900a4a27"
HERE="$(cd "$(dirname "$0")" && pwd)"
PORT_ARGS=()
if [[ "${EXPOSE_PORT:-}" != "" ]]; then PORT_ARGS=(-p "${EXPOSE_PORT}:${EXPOSE_PORT}"); fi
exec docker run --rm -e NPM_CONFIG_UPDATE_NOTIFIER=false ${DOCKER_RUN_ARGS:-} "${PORT_ARGS[@]+"${PORT_ARGS[@]}"}" \
  -v "$HERE":/app \
  -v spa-slides-spike-node-modules:/app/node_modules \
  -w /app \
  "$IMAGE" "$@"
