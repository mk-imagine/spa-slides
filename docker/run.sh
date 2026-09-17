#!/usr/bin/env bash
# Runs a command from the repo root inside the pinned Node + Playwright container.
# node_modules live in named volumes, so Linux binaries never land on the host.
#
#   docker/run.sh npm ci
#   docker/run.sh npm run build
#   EXPOSE_PORT=5173 docker/run.sh npm run dev -w git-workshop-deck
set -euo pipefail

IMAGE="mcr.microsoft.com/playwright:v1.63.0-noble@sha256:eff16c30e6f3f4af0a03fa4b706120d5e9b0891c344a27d64559aff5900a4a27"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

PORT_ARGS=()
if [[ -n "${EXPOSE_PORT:-}" ]]; then
  PORT_ARGS=(-p "${EXPOSE_PORT}:${EXPOSE_PORT}")
fi

exec docker run --rm \
  -e NPM_CONFIG_UPDATE_NOTIFIER=false \
  "${PORT_ARGS[@]+"${PORT_ARGS[@]}"}" \
  -v "$ROOT":/repo \
  -v spa-slides-root-node-modules:/repo/node_modules \
  -v spa-slides-lib-node-modules:/repo/packages/spa-slides/node_modules \
  -v spa-slides-example-node-modules:/repo/examples/git-workshop/node_modules \
  -w /repo \
  "$IMAGE" "$@"
