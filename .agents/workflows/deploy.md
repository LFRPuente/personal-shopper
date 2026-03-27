---
description: Deploy personal-shopper from Windows to the remote Mac Mini through SSH, GitHub, and Docker Compose
---

# Deploy: Windows -> Mac Mini

This is the current production workflow.

## Core rule

Work locally on Windows, push to GitHub, SSH into the Mac Mini, pull there, rebuild only what changed, and validate the stack.

Do not treat the Mac Mini as the editing source of truth unless the user explicitly asks for direct hotfix work there.

## Read first

Before any deploy, read:

- `DOCKER_AGENT_GUIDE.md`
- `CONTEXT.md`

## Important paths and remotes

### Windows

- Repo path: `C:\Users\luis_\Desktop\personal_shopper`
- Push remote: `new-origin`
- URL: `https://github.com/LFRPuente/personal-shopper.git`

### Mac Mini

- Repo path: `/Users/homeserver/Documents/personal-shopper`
- Pull remote: `origin`
- URL: `git@github.com-personal-shopper:LFRPuente/personal-shopper.git`
- Docker binary: `/usr/local/bin/docker`

## SSH access from Windows

Single command:

```powershell
ssh -o BatchMode=yes -o ConnectTimeout=20 -o StrictHostKeyChecking=no -o ProxyCommand="C:\PROGRA~2\cloudflared\cloudflared.exe access ssh --hostname %h" homeserver@ssh.servidorfs.com
```

If this is a first-time machine setup, the agent must follow the SSH bootstrap section in `CONTEXT.md` before trying to deploy.

## Agent SSH bootstrap gate

Before the first remote action on a machine, the agent must verify:

```powershell
Test-Path C:\PROGRA~2\cloudflared\cloudflared.exe
Test-Path C:\Users\luis_\.ssh\id_ed25519
Test-Path C:\Users\luis_\.ssh\id_ed25519.pub
ssh -V
```

The agent must follow these rules:

1. If `cloudflared.exe` is missing, install it or stop and report that Cloudflare Tunnel is missing.
2. If the Windows SSH client is missing, install it or stop and report that OpenSSH is missing.
3. If the local keypair is missing, generate it as documented in `CONTEXT.md`.
4. If the keypair exists but the Mac Mini rejects it, stop and report that the public key must be added to `/Users/homeserver/.ssh/authorized_keys`.
5. If the machine cannot authenticate to Cloudflare Access, run the access login flow from `CONTEXT.md`.
6. The agent must never invent credentials or continue to deploy without confirmed SSH access.

Recommended pattern for multi-line remote scripts:

```powershell
$script = @'
cd /Users/homeserver/Documents/personal-shopper
git pull origin main
/usr/local/bin/docker compose ps
'@

$script | ssh -o BatchMode=yes -o ConnectTimeout=20 -o StrictHostKeyChecking=no -o ProxyCommand="C:\PROGRA~2\cloudflared\cloudflared.exe access ssh --hostname %h" homeserver@ssh.servidorfs.com "tr -d '\r' | /bin/zsh"
```

## Local flow on Windows

### 1. Make the changes locally

Edit code in:

- `C:\Users\luis_\Desktop\personal_shopper`

### 2. Validate locally

Frontend changes:

```powershell
cd C:\Users\luis_\Desktop\personal_shopper
npm.cmd run build
```

Backend changes:

```powershell
cd C:\Users\luis_\Desktop\personal_shopper
python -m py_compile backend/api/views.py backend/api/serializers.py backend/api/models.py backend/api/urls.py
```

Adjust the file list if only some backend modules changed.

### 3. Commit and push

```powershell
cd C:\Users\luis_\Desktop\personal_shopper
git add -A
git commit -m "Describe the change"
git push new-origin main
```

## Remote deploy on the Mac Mini

### 4. Capture the current Docker state before rebuilding

This is mandatory. If any required service is already down, stop and tell the user.

```powershell
$script = @'
/usr/local/bin/docker ps --format '"'"'table {{.Names}}\t{{.Status}}'"'"' | grep -E '"'"'npm-app-1|n8n|homarr|chatwoot|personal-shopper|NAMES'"'"'
'@

$script | ssh -o BatchMode=yes -o ConnectTimeout=20 -o StrictHostKeyChecking=no -o ProxyCommand="C:\PROGRA~2\cloudflared\cloudflared.exe access ssh --hostname %h" homeserver@ssh.servidorfs.com "tr -d '\r' | /bin/zsh"
```

### 5. Pull the latest code

```powershell
$script = @'
cd /Users/homeserver/Documents/personal-shopper
git pull origin main
'@

$script | ssh -o BatchMode=yes -o ConnectTimeout=20 -o StrictHostKeyChecking=no -o ProxyCommand="C:\PROGRA~2\cloudflared\cloudflared.exe access ssh --hostname %h" homeserver@ssh.servidorfs.com "tr -d '\r' | /bin/zsh"
```

### 6. Rebuild only the affected services

Do not use `docker compose down` as a normal deploy step.

Frontend only:

```powershell
$script = @'
cd /Users/homeserver/Documents/personal-shopper
/usr/local/bin/docker compose up -d --build frontend
'@
```

Backend only:

```powershell
$script = @'
cd /Users/homeserver/Documents/personal-shopper
/usr/local/bin/docker compose up -d --build backend
'@
```

Frontend and backend:

```powershell
$script = @'
cd /Users/homeserver/Documents/personal-shopper
/usr/local/bin/docker compose up -d --build backend frontend
'@
```

If `Dockerfile`, Python dependencies, frontend dependencies, `nginx.conf`, or `docker-compose.yml` changed, rebuild the affected side or both services accordingly.

Run the selected script with:

```powershell
$script | ssh -o BatchMode=yes -o ConnectTimeout=20 -o StrictHostKeyChecking=no -o ProxyCommand="C:\PROGRA~2\cloudflared\cloudflared.exe access ssh --hostname %h" homeserver@ssh.servidorfs.com "tr -d '\r' | /bin/zsh"
```

### 7. Run migrations if needed

```powershell
$script = @'
cd /Users/homeserver/Documents/personal-shopper
/usr/local/bin/docker compose exec -T backend python manage.py migrate
'@

$script | ssh -o BatchMode=yes -o ConnectTimeout=20 -o StrictHostKeyChecking=no -o ProxyCommand="C:\PROGRA~2\cloudflared\cloudflared.exe access ssh --hostname %h" homeserver@ssh.servidorfs.com "tr -d '\r' | /bin/zsh"
```

## Required post-deploy validation

### Layer 1: personal-shopper stack

```powershell
$script = @'
cd /Users/homeserver/Documents/personal-shopper
/usr/local/bin/docker compose ps
'@
```

Expected `Up` services:

- `frontend`
- `backend`
- `postgres`
- `redis`

### Layer 2: NPM reachability to `ps-frontend`

```powershell
$script = @'
/usr/local/bin/docker exec npm-app-1 node -e "const http=require('http');const req=http.request({host:'ps-frontend',port:80,path:'/',method:'HEAD',timeout:4000},res=>{console.log(res.statusCode);res.resume();});req.on('error',e=>{console.error(e.code||e.message);process.exit(1)});req.end();"
'@
```

Expected result: `200`

### Layer 3: public domain

```powershell
$script = @'
curl -sI --resolve ps.servidorfs.com:443:127.0.0.1 https://ps.servidorfs.com/ | head -1
curl -sI --resolve ps.servidorfs.com:443:127.0.0.1 https://ps.servidorfs.com/api/ | head -1
'@
```

Expected result: `HTTP/1.1 200 OK` for both.

Run each validation script with:

```powershell
$script | ssh -o BatchMode=yes -o ConnectTimeout=20 -o StrictHostKeyChecking=no -o ProxyCommand="C:\PROGRA~2\cloudflared\cloudflared.exe access ssh --hostname %h" homeserver@ssh.servidorfs.com "tr -d '\r' | /bin/zsh"
```

## Non-interference checks

After each deploy, verify the shared services still respond.

Service state:

```powershell
$script = @'
/usr/local/bin/docker ps --format '"'"'table {{.Names}}\t{{.Status}}'"'"' | grep -E '"'"'npm-app-1|n8n|homarr|chatwoot|personal-shopper|NAMES'"'"'
'@
```

Domains:

```powershell
$script = @'
curl -sI --resolve home.servidorfs.com:443:127.0.0.1 https://home.servidorfs.com/ | head -1
curl -sI --resolve n8n.servidorfs.com:443:127.0.0.1 https://n8n.servidorfs.com/ | head -1
curl -sI --resolve chat.servidorfs.com:443:127.0.0.1 https://chat.servidorfs.com/ | head -1
'@
```

If any of these checks fails, stop and report it immediately.

## Rules that must not be broken

1. Do not use `docker compose down` as the normal deploy path.
2. Do not publish new host ports unless the user explicitly asks for it.
3. Do not connect `backend`, `postgres`, or `redis` to `npm_default`.
4. NPM for this app must point to `ps-frontend:80`.
5. Do not replace the app upstream with a fixed LAN IP.
6. Do not touch unrelated Docker stacks while deploying this app.
7. Do not print or commit credentials.

## Rollback

Preferred rollback is a Git rollback plus rebuild, not a stack teardown.

Inspect recent commits:

```powershell
$script = @'
cd /Users/homeserver/Documents/personal-shopper
git log --oneline -5
'@
```

If needed, revert the bad commit and rebuild:

```powershell
$script = @'
cd /Users/homeserver/Documents/personal-shopper
git revert HEAD
/usr/local/bin/docker compose up -d --build backend frontend
'@
```

Run either script with the same `ssh ... "tr -d '\r' | /bin/zsh"` pattern.
