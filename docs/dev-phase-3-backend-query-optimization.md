# Dev Phase 3 - Backend Query Optimization

Date: 2026-06-15
Environment: dev only (`https://dev.servidorfs.com`)

## Goal

Speed up the heaviest initial API loads without changing business logic or the JSON shape consumed by the frontend.

## Changes

- Optimized nested product shipment lookup to use prefetched shipment data when available.
- Added shared queryset helpers for products, payments, receipts, shipment evidence, and shipment detail loading.
- Optimized `/api/clients/` to prefetch nested products and payments with their required related data.
- Optimized `/api/shoppings/` to prefetch shopping products directly instead of walking through client products/payments.
- Optimized `/api/payments/` to prefetch products and entries with related users/shoppings.
- Optimized shipment detail/evidence responses to reuse prefetched products/evidence.
- Kept response payload sizes and field contracts unchanged.

## Endpoint Measurements

Baseline from phase 1:

- `/api/clients/`: 1.993s, 966,811 bytes, 40 records
- `/api/shoppings/`: 1.497s, 700,151 bytes, 50 records
- `/api/shipments/`: 0.022s, 22,150 bytes, 35 records
- `/api/payments/`: 0.327s, 299,771 bytes, 211 records

After phase 3:

- `/api/clients/`: 0.470s, 966,811 bytes, 40 records
- `/api/shoppings/`: 0.295s, 700,151 bytes, 50 records
- `/api/shipments/`: 0.017s, 22,150 bytes, 35 records
- `/api/payments/`: 0.085s, 299,771 bytes, 211 records

## Extra Validation

- `python manage.py check`: passed.
- Largest shipment detail probe: shipment `67`, 64 products, 0.075s, 31,128 bytes.
- Controlled evidence upload probe: status 201, 0.265s, 31,498 bytes.
- Probe evidence created as ID `63` and deleted after validation.

## Notes

This phase intentionally did not remove nested data from responses. The frontend still depends on embedded `client.products`, `mission.products`, and payment product details. A later phase can make payloads lighter with dedicated list/detail endpoints or lazy loading, but that should be done together with frontend state changes.
