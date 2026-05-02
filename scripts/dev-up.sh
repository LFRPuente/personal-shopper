#!/bin/sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
PROJECT_NAME="${COMPOSE_PROJECT_NAME:-personal-shopper-dev}"
ENV_FILE="${DEV_ENV_FILE:-dev.env}"

if [ ! -f "$ROOT_DIR/$ENV_FILE" ]; then
  echo "Missing $ROOT_DIR/$ENV_FILE"
  echo "Create it from dev.env.example before starting the dev stack."
  exit 1
fi

cd "$ROOT_DIR"
docker compose -p "$PROJECT_NAME" --env-file "$ENV_FILE" up -d --build
