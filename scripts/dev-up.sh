#!/bin/sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
PROJECT_NAME="${COMPOSE_PROJECT_NAME:-personal-shopper-dev}"
ENV_FILE="${DEV_ENV_FILE:-dev.env}"
DOCKER_BIN="${DOCKER_BIN:-/usr/local/bin/docker}"

if [ ! -x "$DOCKER_BIN" ]; then
  DOCKER_BIN="$(command -v docker || true)"
fi

if [ ! -f "$ROOT_DIR/$ENV_FILE" ]; then
  echo "Missing $ROOT_DIR/$ENV_FILE"
  echo "Create it from dev.env.example before starting the dev stack."
  exit 1
fi

if [ -z "${DOCKER_BIN:-}" ] || [ ! -x "$DOCKER_BIN" ]; then
  echo "Docker binary not found."
  echo "Set DOCKER_BIN or ensure docker is installed."
  exit 1
fi

cd "$ROOT_DIR"
if [ -z "${VITE_COMMIT_SHA:-}" ]; then
  VITE_COMMIT_SHA="$(git rev-parse --short HEAD 2>/dev/null || printf unknown)"
  if [ -n "$(git status --porcelain --untracked-files=no 2>/dev/null)" ]; then
    VITE_COMMIT_SHA="$VITE_COMMIT_SHA-dirty.$(date +%Y%m%d%H%M%S)"
  fi
  export VITE_COMMIT_SHA
fi
"$DOCKER_BIN" compose -p "$PROJECT_NAME" --env-file "$ENV_FILE" up -d --build
