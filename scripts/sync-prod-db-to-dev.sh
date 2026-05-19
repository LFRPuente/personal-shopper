#!/bin/sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
SOURCE_PROJECT="${SOURCE_COMPOSE_PROJECT:-personal-shopper}"
TARGET_PROJECT="${TARGET_COMPOSE_PROJECT:-personal-shopper-dev}"
SOURCE_DB_NAME="${SOURCE_POSTGRES_DB:-personal_shopper}"
SOURCE_DB_USER="${SOURCE_POSTGRES_USER:-personal_shopper}"
TARGET_DB_NAME="${TARGET_POSTGRES_DB:-personal_shopper_dev}"
TARGET_DB_USER="${TARGET_POSTGRES_USER:-personal_shopper_dev}"
SOURCE_MEDIA_VOLUME="${SOURCE_MEDIA_VOLUME:-${SOURCE_PROJECT}_personal_shopper_media_data}"
TARGET_MEDIA_VOLUME="${TARGET_MEDIA_VOLUME:-${TARGET_PROJECT}_personal_shopper_media_data}"
TMP_FILE="${TMP_FILE:-/tmp/personal-shopper-dev-sync.dump}"
DOCKER_BIN="${DOCKER_BIN:-/usr/local/bin/docker}"

if [ ! -x "$DOCKER_BIN" ]; then
  DOCKER_BIN="$(command -v docker || true)"
fi

if [ "${CONFIRM_SYNC:-}" != "yes" ]; then
  echo "This will overwrite the dev database with a fresh copy of production."
  echo "Re-run with CONFIRM_SYNC=yes if you really want to continue."
  exit 1
fi

if [ -z "${DOCKER_BIN:-}" ] || [ ! -x "$DOCKER_BIN" ]; then
  echo "Docker binary not found."
  echo "Set DOCKER_BIN or ensure docker is installed."
  exit 1
fi

cd "$ROOT_DIR"

"$DOCKER_BIN" compose -p "$SOURCE_PROJECT" exec -T postgres pg_dump \
  -U "$SOURCE_DB_USER" \
  -d "$SOURCE_DB_NAME" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  > "$TMP_FILE"

"$DOCKER_BIN" compose -p "$TARGET_PROJECT" exec -T postgres psql \
  -U "$TARGET_DB_USER" \
  -d "$TARGET_DB_NAME" \
  < "$TMP_FILE"

rm -f "$TMP_FILE"

"$DOCKER_BIN" run --rm \
  -v "${SOURCE_MEDIA_VOLUME}:/from:ro" \
  -v "${TARGET_MEDIA_VOLUME}:/to" \
  alpine:3.20 sh -eu -c '
    find /to -mindepth 1 -maxdepth 1 -exec rm -rf {} +
    cd /from
    tar cf - . | tar xpf - -C /to
  '
