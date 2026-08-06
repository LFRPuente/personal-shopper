#!/bin/sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
DOCKER_BIN="${DOCKER_BIN:-/usr/local/bin/docker}"

if [ ! -x "$DOCKER_BIN" ]; then
  DOCKER_BIN="$(command -v docker || true)"
fi

if [ -z "${DOCKER_BIN:-}" ] || [ ! -x "$DOCKER_BIN" ]; then
  echo "Docker binary not found."
  echo "Set DOCKER_BIN or ensure docker is installed."
  exit 1
fi

cd "$ROOT_DIR"
VITE_COMMIT_SHA="$(git rev-parse --short HEAD 2>/dev/null || true)"

if [ -z "$VITE_COMMIT_SHA" ]; then
  echo "Unable to determine the current Git commit; frontend build aborted."
  exit 1
fi

export VITE_COMMIT_SHA
"$DOCKER_BIN" compose up -d --build "$@"
