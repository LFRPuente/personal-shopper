# Dev Phase 2 Mobile Evidence Stabilization

Date: 2026-06-16

Scope: reduce mobile evidence upload failures and avoid false logout behavior while keeping the existing shipment business logic intact.

## Changes

- Added an `apiFetch` option: `skipUnauthorizedLogout`.
- Shipment evidence upload, replace, and delete now use `skipUnauthorizedLogout: true`.
- Evidence `401` responses now show a recoverable error instead of immediately clearing the whole local session.
- If the backend returns `token_not_valid`, the app clears the local session because the browser is holding a stale/invalid JWT.
- Evidence `413` responses now show a file-size-specific error.
- Evidence uploads no longer trigger full core refreshes after every evidence operation.
- Image compression now uses `URL.createObjectURL(file)` instead of base64 `FileReader`, reducing memory pressure on mobile browsers.
- Image resize now limits the largest side, not only width, so portrait phone photos are also resized.
- Multiple evidence files are uploaded one by one instead of being bundled into a single large multipart request.

## Why

The reported mobile bug sounded like a combination of:

- A transient upload/auth failure being treated as a full logout.
- Large mobile photos causing memory pressure before upload.
- A successful evidence operation immediately triggering heavy refresh/render work.

This phase keeps realtime and shipment logic unchanged, but makes evidence operations less fragile on mobile.

## Dev Deployment

Copied modified files to the Mac Mini repo and rebuilt only the dev stack:

```sh
/usr/local/bin/docker compose -p personal-shopper-dev --env-file dev.env up -d --build frontend
```

Production containers remained untouched.

## Validation

- Vite production build passed inside the dev Docker build.
- `personal-shopper-dev` services restarted and are running.
- Production `personal-shopper` services kept their previous uptime.
- Controlled evidence upload test passed on dev:
  - Shipment: 67
  - Status: 201
  - Time: 0.122s
  - Response: 31,510 B
  - Temporary evidence created and then deleted: 59
- Follow-up from mobile screenshot: `Given token not valid for any token type` means the browser had an invalid stored token, so `token_not_valid` now forces a clean re-login instead of leaving the user trapped in the shipment screen.

## Remaining Phase 2 Follow-up

- Test manually from a phone on `https://dev.servidorfs.com/shipments`.
- Watch backend/frontend logs during a real mobile upload.
- If mobile still fails, capture whether the failing response is `401`, `413`, `502`, timeout, or browser memory closure.
