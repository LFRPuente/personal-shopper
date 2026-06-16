# Dev Phase 1 Baseline

Date: 2026-06-16

Scope: prepare `dev` with production-like data and capture an initial performance baseline before changing business logic.

## Data Sync

- Source stack: `personal-shopper`
- Target stack: `personal-shopper-dev`
- Command used on Mac Mini:

```sh
CONFIRM_SYNC=yes ./scripts/sync-prod-db-to-dev.sh
```

Result: dev database and media volume were overwritten with a fresh production copy.

## Dev Stack Status

After sync, all dev services were running:

- `personal-shopper-dev-backend-1`
- `personal-shopper-dev-frontend-1`
- `personal-shopper-dev-postgres-1`
- `personal-shopper-dev-redis-1`

Media volume:

- Files: 1202
- Size: 1.7 GB

## Database Counts

- Users: 6
- Clients: 40
- Products: 603
- Shoppings: 50
- Open shoppings: 1
- Completed shoppings: 49
- Payments: 211
- Shipments: 35
- Shipment evidence files: 51

## API Baseline

Measured from inside the dev backend container against `127.0.0.1:8000`, using a temporary in-memory JWT.

| Endpoint | Time | Payload | Count |
| --- | ---: | ---: | ---: |
| `/api/clients/` | 1.993s | 966,811 B | 40 |
| `/api/shoppings/` | 1.497s | 700,151 B | 50 |
| `/api/shipments/` | 0.022s | 22,150 B | 35 |
| `/api/payments/` | 0.327s | 299,771 B | 211 |

Main observation: shipment list is already light; clients and shoppings are the heavy list endpoints.

## Shipment Detail Baseline

Largest shipment details by evidence count/product count:

| Shipment | Time | Payload | Products | Evidence |
| --- | ---: | ---: | ---: | ---: |
| 67 | 0.095s | 31,128 B | 64 | 2 |
| 58 | 0.051s | 22,265 B | 44 | 2 |
| 42 | 0.045s | 21,065 B | 41 | 2 |
| 54 | 0.042s | 13,712 B | 26 | 2 |
| 36 | 0.029s | 11,530 B | 21 | 2 |
| 52 | 0.028s | 10,079 B | 18 | 2 |
| 56 | 0.025s | 8,340 B | 14 | 2 |
| 47 | 0.024s | 8,301 B | 14 | 2 |

Main observation: detail JSON is not huge by itself, but each opened shipment can trigger many image/media requests in the browser.

## Evidence Upload Probe

Controlled dev-only test:

- Shipment: 67
- Test file: 1x1 PNG
- Request size: 236 B
- Response time: 0.106s
- Response size: 31,510 B
- Response included: 64 products and 3 evidence items
- Cleanup: test evidence was deleted after measurement

Main observation: even tiny uploads return the full shipment payload. On mobile, the bigger risk is a combination of upload reliability, auth handling, and immediate heavy refresh/render after upload.

## Phase 2 Inputs

Use this baseline to investigate:

- Mobile evidence upload failure and forced logout behavior.
- Whether `401` during upload should immediately clear the local session.
- Whether upload endpoints should return only the new evidence plus a small shipment summary.
- Replacing global refreshes with specific refreshes for products, payments, shoppings, and shipments.
