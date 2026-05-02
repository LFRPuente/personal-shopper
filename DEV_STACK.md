# Dev Stack

This repo can run a separate development stack alongside production.

## Purpose

- `ps.servidorfs.com` stays as production
- `dev.servidorfs.com` becomes the safe test stack
- production code is not touched until you approve the change
- database copies from production to dev are opt-in only

## Required Cloudflare and NPM values for dev

- public domain: `dev.servidorfs.com`
- NPM upstream host: `dev-frontend`
- NPM upstream port: `80`

Do not point dev to a fixed IP in NPM.

## Local host binding for dev

- host IP: `192.168.3.100`
- host port: `18174`

This host port is only for direct host access and troubleshooting.

## Start dev on the Mac Mini

1. Copy `dev.env.example` to `dev.env`
2. Adjust any secrets or database values if needed
3. Run:

```sh
./scripts/dev-up.sh
```

Or run the compose command directly:

```sh
docker compose -p personal-shopper-dev --env-file dev.env up -d --build
```

## Copy production data into dev

Only do this when you want real test data in dev.

```sh
CONFIRM_SYNC=yes ./scripts/sync-prod-db-to-dev.sh
```

Defaults:

- source project: `personal-shopper`
- target project: `personal-shopper-dev`
- source DB: `personal_shopper`
- target DB: `personal_shopper_dev`

If the database names differ, export `SOURCE_POSTGRES_DB`, `SOURCE_POSTGRES_USER`, `TARGET_POSTGRES_DB`, and `TARGET_POSTGRES_USER` before running the script.
