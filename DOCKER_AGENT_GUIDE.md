# Docker Agent Guide

This guide documents how `personal-shopper` is mounted today and what rules any agent must follow to deploy safely without breaking other services on the server.

## Current operational state

- Public domain: `https://ps.servidorfs.com/`
- Public proxy: `Nginx Proxy Manager` in `npm-app-1`
- Main stack: `frontend`, `backend`, `postgres`, `redis`
- Traffic still goes through NPM to `ps-frontend:80`
- Local source of truth is the Windows repo
- Production deploy target is the Mac Mini repo

Current repo paths:

- Windows: `C:\Users\luis_\Desktop\personal_shopper`
- Mac Mini: `/Users/homeserver/Documents/personal-shopper`

Current Git remotes:

- Windows push remote: `new-origin -> https://github.com/LFRPuente/personal-shopper.git`
- Mac Mini pull remote: `origin -> git@github.com-personal-shopper:LFRPuente/personal-shopper.git`

Current Docker binary on the Mac Mini:

- `/usr/local/bin/docker`

## Architecture

### Stack

- Compose file: `docker-compose.yml`
- Services:
  - `frontend`
  - `backend`
  - `postgres`
  - `redis`

### Networks

- Internal stack network: `personal-shopper_default`
  - `postgres`, `redis`, `backend`, and `frontend` live here
- Shared NPM network: `npm_default`
  - only `frontend` should touch this network
  - frontend alias on this network: `ps-frontend`

### Traffic flow

- Client -> Cloudflare -> NPM -> `ps-frontend:80` -> `backend:8000`
- Frontend proxies:
  - `/api/` -> `backend:8000/api/`
  - `/media/` -> `backend:8000/media/`
  - `/ws/` -> `backend:8000/ws/`

Key files:

- [docker-compose.yml](C:/Users/luis_/Desktop/personal_shopper/docker-compose.yml)
- [frontend/nginx.conf](C:/Users/luis_/Desktop/personal_shopper/frontend/nginx.conf)
- [backend/backend/settings.py](C:/Users/luis_/Desktop/personal_shopper/backend/backend/settings.py)

## Rules that must not be broken

1. Do not publish new host ports for this stack unless the user explicitly asks for it.
2. Do not connect `backend`, `postgres`, or `redis` to `npm_default`.
3. Only `frontend` should touch `npm_default`.
4. For `personal-shopper`, NPM must point to `ps-frontend:80`.
5. Do not switch this app to a fixed IP in NPM.
6. Do not touch other proxy hosts or stacks unless the task explicitly requires it.
7. Do not edit or print secrets unless the task explicitly requires it.

## NPM state that matters

Correct state for `personal-shopper`:

- domain: `ps.servidorfs.com`
- upstream host: `ps-frontend`
- upstream port: `80`
- websocket upgrade: enabled

Legacy services already depend on their own upstream rules and should not be changed during an app deploy.

Examples that must keep working after each deploy:

- `home.servidorfs.com`
- `n8n.servidorfs.com`
- `chat.servidorfs.com`
- `waha.servidorfs.com`
- `stremio.servidorfs.com`

## Django state that matters

Current settings expectations:

- `ALLOWED_HOSTS` includes `ps.servidorfs.com`
- `CSRF_TRUSTED_ORIGINS` includes `https://ps.servidorfs.com`
- `SECURE_PROXY_SSL_HEADER` is enabled
- `USE_X_FORWARDED_HOST` is enabled
- PostgreSQL runs in Docker for this stack
- Redis runs in Docker for this stack

If the public domain changes, update:

- `DJANGO_ALLOWED_HOSTS`
- `DJANGO_CSRF_TRUSTED_ORIGINS`

## Storage state

Current real storage state:

- the app uses named Docker volumes
- data is not currently mounted on the external 20 TB disk

Current named volumes:

- `personal-shopper_personal_shopper_postgres_data`
- `personal-shopper_personal_shopper_redis_data`
- `personal-shopper_personal_shopper_media_data`
- `personal-shopper_personal_shopper_static_data`

Do not assume app data lives in a normal host folder.

## Current deploy model

The deploy path is:

1. edit locally on Windows
2. validate locally
3. push to GitHub from Windows
4. SSH into the Mac Mini through Cloudflare Access
5. `git pull origin main` in `/Users/homeserver/Documents/personal-shopper`
6. rebuild only the affected services
7. run migrations if needed
8. validate stack, NPM reachability, public domain, and shared services

Do not use direct code edits on the Mac Mini as the default workflow.

Detailed steps live in:

- [deploy.md](C:/Users/luis_/Desktop/personal_shopper/.agents/workflows/deploy.md)
- [CONTEXT.md](C:/Users/luis_/Desktop/personal_shopper/CONTEXT.md)

## Validation minimum after every deploy

### 1. Stack health

```bash
cd /Users/homeserver/Documents/personal-shopper
/usr/local/bin/docker compose ps
```

Expected `Up`:

- `frontend`
- `backend`
- `postgres`
- `redis`

### 2. NPM reachability

```bash
/usr/local/bin/docker exec npm-app-1 node -e "const http=require('http');const req=http.request({host:'ps-frontend',port:80,path:'/',method:'HEAD',timeout:4000},res=>{console.log(res.statusCode);res.resume();});req.on('error',e=>{console.error(e.code||e.message);process.exit(1)});req.end();"
```

Expected result: `200`

### 3. Public checks

```bash
curl -sI --resolve ps.servidorfs.com:443:127.0.0.1 https://ps.servidorfs.com/ | head -1
curl -sI --resolve ps.servidorfs.com:443:127.0.0.1 https://ps.servidorfs.com/api/ | head -1
```

Expected result: `HTTP/1.1 200 OK`

## Non-interference checks

Before and after any significant rebuild, check at least:

```bash
/usr/local/bin/docker ps --format 'table {{.Names}}\t{{.Status}}' | grep -E 'npm-app-1|n8n|homarr|chatwoot|personal-shopper|NAMES'
```

And verify domains:

```bash
curl -sI --resolve home.servidorfs.com:443:127.0.0.1 https://home.servidorfs.com/ | head -1
curl -sI --resolve n8n.servidorfs.com:443:127.0.0.1 https://n8n.servidorfs.com/ | head -1
curl -sI --resolve chat.servidorfs.com:443:127.0.0.1 https://chat.servidorfs.com/ | head -1
```

If any of these checks fail, stop and report the issue.

## SSH and Docker notes

### Windows -> Mac Mini access

Use the Cloudflare Access SSH proxy flow documented in [deploy.md](C:/Users/luis_/Desktop/personal_shopper/.agents/workflows/deploy.md).

Do not hardcode passwords or tokens into repo files.

### Docker credential helper note

The current remote Docker config does not expose a `credsStore`, so SSH-based Docker builds work normally.

If a future change reintroduces a credential helper and remote `docker compose` starts failing, use this temporary workaround:

1. backup `~/.docker/config.json`
2. remove the `credsStore` entry
3. run the required build command
4. restore the original config if it was needed for another workflow

Do not copy Docker auth material into this repo.

## Rollback

Preferred rollback:

1. inspect recent commits
2. revert the bad commit
3. rebuild only the affected services or both app services
4. re-run the full validation set

Example:

```bash
cd /Users/homeserver/Documents/personal-shopper
git log --oneline -5
git revert HEAD
/usr/local/bin/docker compose up -d --build backend frontend
```

Do not use `docker compose down` as the default rollback path.

## Do not do this

- do not run global Docker cleanup commands
- do not run `docker system prune`
- do not use `docker compose down` as the normal deploy path
- do not move data volumes during a normal code deploy
- do not change `personal-shopper`, NPM, Cloudflare, and storage architecture in one step unless the user explicitly asked for that
