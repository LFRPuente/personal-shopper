# Dev Phase 4 - Payment Flow Responsiveness

Date: 2026-06-15
Environment: dev only (`https://dev.servidorfs.com`)

## Goal

Make payment saving feel faster without changing payment rules, totals, entries, or realtime behavior.

## Changes

- Backend payment create/update now returns a hydrated payment response with products and entries ready for the UI.
- Payment entry edit/delete reloads the payment through the optimized payment queryset before serializing.
- Payment validation now reuses a set of selected product IDs instead of rebuilding a list during conflict checks.
- Frontend payment actions no longer block on full `/clients/` and `/shoppings/` refreshes after saving.
- Frontend now queues the same core/client refreshes in the background, preserving eventual live sync for AV and shopper.

## Validation

- `python manage.py check`: passed.
- Frontend production build: passed.
- Temporary API probe created and cleaned a client, shopping, product, payment, and payment entry.

Payment probe:

- Create payment: status 201, 0.068s, 843 bytes, 1 entry, 1 product
- Patch payment entry: status 200, 0.026s, 844 bytes, amount 130.00
- Delete payment: status 204, 0.015s

Core endpoint check after deploy:

- `/api/clients/`: 0.376s, 966,811 bytes, 40 records
- `/api/shoppings/`: 0.227s, 700,151 bytes, 50 records
- `/api/shipments/`: 0.014s, 22,150 bytes, 35 records
- `/api/payments/`: 0.155s, 299,771 bytes, 211 records

## Notes

Realtime broadcasts are still sent for payments and clients. The difference is that the initiating user is no longer forced to wait for the full refresh before the action finishes. Other sessions still receive websocket-driven updates and queued refreshes.
