# Project Context

This file is the current project context and the working agreement for this repo as of 2026-04-04.

## Current product state

- Public domain: `https://ps.servidorfs.com/`
- Primary stack: `frontend`, `backend`, `postgres`, `redis`
- Public surface now uses `shopping` / `shoppings`
- Internal Django model names still keep `Mission` / `mission` in some places for DB compatibility
- Desktop web mode exists and is stored per user profile as a layout preference
- Payments by client and by shopping are already implemented
- Overpayments are treated as client credit
- UI copy now prefers `a favor` instead of `credito`
- Public `share/client/...` shows only positive net credit, never debt
- Public `share/client/...` no longer shows tickets
- Public shipment share supports DHL and Estafeta tracking links
- Frontend is no longer a single monolithic section tree:
  - main app sections are split into lazy-loaded section chunks
  - major overlays and modals are split into lazy-loaded component chunks
  - app routes now exist for section-level views such as `/home`, `/clients`, `/shipments`, `/shoppings`, `/calculator`, `/profile`
  - deep link support exists for `home` client views such as `/home/clients/:slug`
- WebSocket updates are now scoped by active section instead of always running everywhere
- Firefox-specific startup mitigations are in place:
  - non-blocking Google Fonts loading
  - reduced compositor-heavy transitions
  - temporary `ff-loading` class during startup
  - no realtime websocket on Firefox

## Recent deployed changes

Latest known production commits:

- `d838f05` Centralize Firefox loading class bootstrap
- `2c12a5b` Restore confirm dialog and tune Firefox startup
- `d12be2d` Fix shipments section media resolver
- `55f5ba7` Fix hook order crash on app boot
- `1b89c4a` Fix split runtime references in app boot
- `171dd99` Fix root boot crash after frontend split
- `64d28fe` Fix clients section phone display crash
- `4d6ca14` Split remaining app overlays and drop dead sections
- `4e9ad6a` Extract product and review overlays
- `d9191cd` Extract client payment modal
- `39e1e80` Extract input dialog and fullscreen image overlays
- `e7f5754` Add section routes and lazy home clients views

## Current frontend split status

The frontend refactor is already in production and is the current base state.

- `frontend/src/App.jsx` was reduced significantly and now coordinates:
  - auth/session bootstrap
  - section routing
  - shared state/context
  - lazy section and modal mounts
- Extracted section chunks currently include:
  - `frontend/src/sections/HomeSection.jsx`
  - `frontend/src/sections/ClientsSection.jsx`
  - `frontend/src/sections/MissionsSection.jsx`
  - `frontend/src/sections/ShipmentsSection.jsx`
  - `frontend/src/sections/CalculatorSection.jsx`
  - `frontend/src/sections/ProfileSection.jsx`
- Extracted overlay/modal chunks currently include:
  - `frontend/src/components/ProductModal.jsx`
  - `frontend/src/components/PaymentModal.jsx`
  - `frontend/src/components/ClientPaymentModal.jsx`
  - `frontend/src/components/ShipmentModal.jsx`
  - `frontend/src/components/ShipmentProductPickerModal.jsx`
  - `frontend/src/components/HomeClientOverlay.jsx`
  - `frontend/src/components/ConfirmDialog.jsx`
  - `frontend/src/components/InputDialog.jsx`
  - `frontend/src/components/FullscreenImageModal.jsx`
  - mission/client/review dialogs extracted during the split
- Shared app helpers/context live in:
  - `frontend/src/utils.js`
  - `frontend/src/AppContext.jsx`

## Current troubleshooting notes

- If the app goes blank after a refactor deploy, check browser console first for runtime chunk errors from extracted sections before touching backend.
- The Cloudflare beacon error:
  - `https://static.cloudflareinsights.com/beacon.min.js ... ERR_ADDRESS_INVALID`
  is external noise and not the primary app crash signal.
- During frontend deploys, `https://ps.servidorfs.com/api/` may return a brief `502` while containers are being recreated; recheck after services settle.
- For rollback, these commits are important recent restore points:
  - `55f5ba7` stable boot fix after split
  - `d12be2d` shipments lazy chunk crash fix
  - `d838f05` current production Firefox/startup baseline

## Working model

The source of truth is the local Windows repo. The Mac Mini is the deploy target.

For a parallel `dev` stack, keep the same compose file and change only the environment values per stack:

- `COMPOSE_PROJECT_NAME` or `docker compose -p` to isolate containers, networks, and volumes
- `NPM_UPSTREAM_HOST` to the stack-specific upstream alias, for example `dev-frontend`
- `FRONTEND_BIND_PORT` to a different host port if you want direct host access
- `DJANGO_ALLOWED_HOSTS` to include the matching domain
- `DJANGO_CSRF_TRUSTED_ORIGINS` to include the matching `https://` domain
- `PUBLIC_SHARE_BASE_URL` to the matching public base URL

1. Make code changes locally in:
   - `C:\Users\luis_\OneDrive\Desktop\personal-shopper`
2. Validate locally before pushing:
   - Frontend changes: `npm.cmd run build` or `npx vite build`
   - Backend changes: `python -m py_compile <files>`
3. Commit locally.
4. Push from Windows to GitHub using the active remote for this clone:
   - usually `git push origin main`
5. SSH from Windows into the Mac Mini through Cloudflare Access.
6. On the Mac Mini, pull the latest code:
   - `git pull origin main`
7. Rebuild only the affected services with Docker Compose.
8. Run migrations if needed.
9. Validate the stack, NPM reachability, the public domain, and the legacy services.

Do not edit production code directly on the Mac Mini unless the user explicitly asks for that.

## Repos, remotes, and paths

### Windows

- Repo path: `C:\Users\luis_\OneDrive\Desktop\personal-shopper`
- Active push remote in this clone: `origin`
- `origin` URL:
  - `https://github.com/LFRPuente/personal-shopper.git`

### Mac Mini

- Repo path: `/Users/homeserver/Documents/personal-shopper`
- Pull remote: `origin`
- Current `origin` URL:
  - `git@github.com-personal-shopper:LFRPuente/personal-shopper.git`
- Docker binary:
  - `/usr/local/bin/docker`

## Deploy references

These two files are the canonical operational references and should be read before any deploy:

- [deploy.md](C:/Users/luis_/OneDrive/Desktop/personal-shopper/.agents/workflows/deploy.md)
- [DOCKER_AGENT_GUIDE.md](C:/Users/luis_/OneDrive/Desktop/personal-shopper/DOCKER_AGENT_GUIDE.md)

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
cd C:\Users\luis_\OneDrive\Desktop\personal-shopper
npm.cmd run build
python -m py_compile backend/api/views.py backend/api/serializers.py backend/api/models.py backend/api/urls.py
git status --short
```

Use only the validations that match the files you changed.

## Remote deploy summary

The deploy is:

1. `git push origin main`
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
