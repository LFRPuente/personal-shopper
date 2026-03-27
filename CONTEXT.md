# Project Context

This file is the current project context and the working agreement for this repo as of 2026-03-26.

## Current product state

- Public domain: `https://ps.servidorfs.com/`
- Primary stack: `frontend`, `backend`, `postgres`, `redis`
- Public surface now uses `shopping` / `shoppings`
- Internal Django model names still keep `Mission` / `mission` in some places for DB compatibility
- Desktop web mode exists and is stored per user profile as a layout preference
- Payments by client and by shopping are already implemented
- Overpayments are treated as client credit
- Public `share/client/...` shows only positive net credit, never debt
- Public `share/client/...` no longer shows tickets
- Public shipment share supports DHL and Estafeta tracking links

## Recent deployed changes

Latest known production commits:

- `0527432` Expose net client credit on public share
- `a3286ae` Show overpayments as client credit
- `f5597ca` Fix clients card action layout
- `76a9b1b` Tighten clients action buttons
- `e413b52` Fix payment modal init order
- `f1bfc25` Add shopping mission metadata migration
- `7788ebd` Add shopping payment tracking
- `d2d0602` Rename app missions to shoppings
- `eb4c083` Tighten desktop home layout
- `a5d00a0` Refine desktop home layout

## Working model

The source of truth is the local Windows repo. The Mac Mini is the deploy target.

1. Make code changes locally in:
   - `C:\Users\luis_\Desktop\personal_shopper`
2. Validate locally before pushing:
   - Frontend changes: `npm.cmd run build`
   - Backend changes: `python -m py_compile <files>`
3. Commit locally.
4. Push from Windows to GitHub:
   - `git push new-origin main`
5. SSH from Windows into the Mac Mini through Cloudflare Access.
6. On the Mac Mini, pull the latest code:
   - `git pull origin main`
7. Rebuild only the affected services with Docker Compose.
8. Run migrations if needed.
9. Validate the stack, NPM reachability, the public domain, and the legacy services.

Do not edit production code directly on the Mac Mini unless the user explicitly asks for that.

## Repos, remotes, and paths

### Windows

- Repo path: `C:\Users\luis_\Desktop\personal_shopper`
- Push remote: `new-origin`
- `new-origin` URL: `https://github.com/LFRPuente/personal-shopper.git`

### Mac Mini

- Repo path: `/Users/homeserver/Documents/personal-shopper`
- Pull remote: `origin`
- Current `origin` URL:
  - `git@github.com-personal-shopper:LFRPuente/personal-shopper.git`
- Docker binary:
  - `/usr/local/bin/docker`

## Deploy references

These two files are the canonical operational references and should be read before any deploy:

- [deploy.md](C:/Users/luis_/Desktop/personal_shopper/.agents/workflows/deploy.md)
- [DOCKER_AGENT_GUIDE.md](C:/Users/luis_/Desktop/personal_shopper/DOCKER_AGENT_GUIDE.md)

## Credentials and tooling

Credentials are not stored in this repo and should not be committed here. The repo contains docs and helper scripts, not secrets.

### Windows prerequisites

- `git`
- `OpenSSH` client
- `cloudflared.exe`
- Local SSH key for the `homeserver` account on the Mac Mini

Expected local paths:

- `C:\PROGRA~2\cloudflared\cloudflared.exe`
- `C:\Users\luis_\.ssh\id_ed25519`
- `C:\Users\luis_\.ssh\id_ed25519.pub`

### Mac Mini prerequisites

- SSH access for user `homeserver`
- Repo already cloned at `/Users/homeserver/Documents/personal-shopper`
- GitHub SSH access configured for the remote alias `github.com-personal-shopper`
- Docker available at `/usr/local/bin/docker`

## Agent SSH bootstrap for the Mac Mini

This section is written for the agent to execute, not just as reference text.

Before any remote deploy, the agent must ensure Windows can SSH to `homeserver@ssh.servidorfs.com` through Cloudflare Access.

If any required bootstrap step cannot be completed safely, the agent must stop and tell the user exactly what is missing.

### Agent gate before first remote action

Run these checks on Windows:

```powershell
Test-Path C:\PROGRA~2\cloudflared\cloudflared.exe
Test-Path C:\Users\luis_\.ssh\id_ed25519
Test-Path C:\Users\luis_\.ssh\id_ed25519.pub
ssh -V
```

The agent must follow these rules:

- if `cloudflared.exe` is missing, install it or stop and report that Cloudflare Tunnel is missing
- if `OpenSSH` is missing, install it or stop and report that the Windows SSH client is missing
- if `id_ed25519` or `id_ed25519.pub` is missing, generate the SSH keypair
- if Windows has a keypair but the Mac Mini does not accept it, stop and tell the user that the public key must be installed in `/Users/homeserver/.ssh/authorized_keys`
- the agent must never invent credentials, fabricate access, or write secrets into the repo

### 1. Install the required tools on Windows

You need:

- `OpenSSH` client
- `cloudflared.exe`

Install OpenSSH if needed:

```powershell
Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0
```

Then verify:

```powershell
ssh -V
Test-Path C:\PROGRA~2\cloudflared\cloudflared.exe
```

### 2. Generate your local SSH key

If the key does not exist yet, create it:

```powershell
ssh-keygen -t ed25519 -C "personal-shopper-windows"
```

Accept the default path unless there is a reason not to:

- `C:\Users\luis_\.ssh\id_ed25519`

This should create:

- `C:\Users\luis_\.ssh\id_ed25519`
- `C:\Users\luis_\.ssh\id_ed25519.pub`

### 3. Copy your public key

Show the public key:

```powershell
Get-Content C:\Users\luis_\.ssh\id_ed25519.pub
```

Only the `.pub` content should be shared for installation on the server.
Never commit or paste the private key into this repo.

### 4. Add the public key to the Mac Mini

The public key must be appended to:

- `/Users/homeserver/.ssh/authorized_keys`

If you already have another admin path into the Mac Mini, add it there.

If you do not have any access to the Mac Mini yet, this is the bootstrap rule the agent must follow:

- someone who already has access must add your public key to `/Users/homeserver/.ssh/authorized_keys`
- or they must securely provide you with an approved existing private key outside the repo

The repo alone cannot grant first-time server access.
If this is the blocker, the agent must stop and report it instead of continuing.

Correct permissions on the Mac Mini:

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

### 5. Re-authenticate Cloudflare Access on Windows

Run:

```powershell
C:\PROGRA~2\cloudflared\cloudflared.exe access login https://ssh.servidorfs.com
```

If the browser downloads a certificate instead of saving it automatically, move it manually to:

- `C:\Users\luis_\.cloudflared\cert.pem`

### 6. Test the SSH connection

Use the actual project SSH command:

```powershell
ssh -o BatchMode=yes -o ConnectTimeout=20 -o StrictHostKeyChecking=no -o ProxyCommand="C:\PROGRA~2\cloudflared\cloudflared.exe access ssh --hostname %h" homeserver@ssh.servidorfs.com
```

If login works, do a minimal sanity check:

```powershell
$script = @'
whoami
pwd
ls /Users/homeserver/Documents
'@

$script | ssh -o BatchMode=yes -o ConnectTimeout=20 -o StrictHostKeyChecking=no -o ProxyCommand="C:\PROGRA~2\cloudflared\cloudflared.exe access ssh --hostname %h" homeserver@ssh.servidorfs.com "tr -d '\r' | /bin/zsh"
```

Expected outcome:

- remote user is `homeserver`
- the repo parent path exists

If SSH still fails here, the agent must not continue to deploy.

### 7. Test project access on the Mac Mini

After SSH works, verify the repo and Git remote:

```powershell
$script = @'
cd /Users/homeserver/Documents/personal-shopper
pwd
git remote -v
'@

$script | ssh -o BatchMode=yes -o ConnectTimeout=20 -o StrictHostKeyChecking=no -o ProxyCommand="C:\PROGRA~2\cloudflared\cloudflared.exe access ssh --hostname %h" homeserver@ssh.servidorfs.com "tr -d '\r' | /bin/zsh"
```

Expected remote:

- `origin -> git@github.com-personal-shopper:LFRPuente/personal-shopper.git`

### 8. First real pull test

Once the previous checks pass:

```powershell
$script = @'
cd /Users/homeserver/Documents/personal-shopper
git pull origin main
'@

$script | ssh -o BatchMode=yes -o ConnectTimeout=20 -o StrictHostKeyChecking=no -o ProxyCommand="C:\PROGRA~2\cloudflared\cloudflared.exe access ssh --hostname %h" homeserver@ssh.servidorfs.com "tr -d '\r' | /bin/zsh"
```

If this fails, the likely missing piece is GitHub SSH access on the Mac Mini, not Windows SSH access. In that case, follow the GitHub SSH setup in the next section.
If the agent cannot fix that setup safely, it must stop and report the exact missing step.

## SSH command used from Windows

```powershell
ssh -o BatchMode=yes -o ConnectTimeout=20 -o StrictHostKeyChecking=no -o ProxyCommand="C:\PROGRA~2\cloudflared\cloudflared.exe access ssh --hostname %h" homeserver@ssh.servidorfs.com
```

For multi-step remote commands, use the pattern we are already using:

```powershell
$script = @'
cd /Users/homeserver/Documents/personal-shopper
git pull origin main
/usr/local/bin/docker compose ps
'@

$script | ssh -o BatchMode=yes -o ConnectTimeout=20 -o StrictHostKeyChecking=no -o ProxyCommand="C:\PROGRA~2\cloudflared\cloudflared.exe access ssh --hostname %h" homeserver@ssh.servidorfs.com "tr -d '\r' | /bin/zsh"
```

## Setup guide if something is missing

### If Windows cannot SSH into the Mac Mini yet

The agent must follow the full `Agent SSH bootstrap for the Mac Mini` section above.

That is the single canonical procedure for:

- installing `cloudflared.exe`
- installing the Windows SSH client
- generating `id_ed25519`
- getting the public key into `/Users/homeserver/.ssh/authorized_keys`
- re-authenticating Cloudflare Access
- proving SSH works before any deploy

### If the Mac Mini cannot pull from GitHub

The Mac Mini uses this remote form:

- `git@github.com-personal-shopper:LFRPuente/personal-shopper.git`

That means the Mac Mini needs its own SSH key and alias config for GitHub.

Create a dedicated key on the Mac Mini if needed:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_personal_shopper -C "personal-shopper-mac-mini"
```

Add this SSH config on the Mac Mini:

```sshconfig
Host github.com-personal-shopper
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_personal_shopper
  IdentitiesOnly yes
```

Then add the Mac Mini public key as a deploy key or repo key in GitHub and test:

```bash
ssh -T git@github.com-personal-shopper
cd /Users/homeserver/Documents/personal-shopper
git pull origin main
```

### If Docker builds fail in SSH due to a credential helper

Current remote Docker config does not expose a `credsStore`, but if someone adds one later, SSH builds can fail with a missing helper error.

Safe temporary workaround on the Mac Mini:

1. Backup `~/.docker/config.json`
2. Remove the `credsStore` key
3. Run the required `docker compose` command
4. Restore the original config if it was needed for another workflow

Do not commit or copy any Docker auth material into this repo.

## Local validation before push

Typical commands:

```powershell
cd C:\Users\luis_\Desktop\personal_shopper
npm.cmd run build
python -m py_compile backend/api/views.py backend/api/serializers.py backend/api/models.py backend/api/urls.py
git status --short
```

Use only the validations that match the files you changed.

## Remote deploy summary

The deploy is:

1. `git push new-origin main`
2. SSH to `homeserver@ssh.servidorfs.com`
3. `cd /Users/homeserver/Documents/personal-shopper`
4. `git pull origin main`
5. Rebuild only what changed:
   - frontend: `/usr/local/bin/docker compose up -d --build frontend`
   - backend: `/usr/local/bin/docker compose up -d --build backend`
   - both: `/usr/local/bin/docker compose up -d --build backend frontend`
6. Run migrations if needed:
   - `/usr/local/bin/docker compose exec -T backend python manage.py migrate`
7. Validate:
   - `/usr/local/bin/docker compose ps`
   - reachability from `npm-app-1` to `ps-frontend`
   - `https://ps.servidorfs.com/`
   - `https://ps.servidorfs.com/api/`
   - `home.servidorfs.com`, `n8n.servidorfs.com`, `chat.servidorfs.com`

## Non-negotiable rules

- Do not use `docker compose down` as the normal deploy path.
- Do not publish new host ports unless the user explicitly asks for that.
- Do not connect `backend`, `postgres`, or `redis` to `npm_default`.
- NPM for this project must point to `ps-frontend:80`.
- Do not swap NPM to fixed IPs for this app.
- Do not touch unrelated Docker stacks while deploying `personal-shopper`.
- Do not print or commit secrets.
