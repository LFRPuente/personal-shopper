# Dev Phase 5 - Shipments Scalability

Date: 2026-06-16
Environment: dev only (`https://dev.servidorfs.com`)

## Goal

Keep the shipments screen responsive as shipment history, products, and evidence galleries grow.

## Changes

- Shipment list now includes `evidence_count` so the UI can show evidence totals without loading evidence files.
- Shipment list still does not include full evidence payloads.
- Expanded shipment product thumbnails now render in batches of 6 with a "Ver mas productos" control.
- Expanded shipment evidence thumbnails now render in batches of 6 with a "Ver mas evidencia" control.
- Product/evidence images in expanded shipment panels use lazy image loading and async decoding.
- Dev WebSocket channel layer now uses `inmemory` through `dev.env`; `docker-compose.yml` defaults to Redis unless overridden.
- WebSocket consumer now logs and closes gracefully if joining/leaving the updates group fails.

## Validation

- Backend `python manage.py check`: passed.
- Frontend production build: passed.
- `/api/shipments/`: 0.023s, 22,815 bytes, 35 records.
- `/api/shipments/67/`: 0.021s, 31,128 bytes, 64 products, 2 evidence files.
- Shipment list includes `evidence_count`.
- Shipment list does not include `evidence` payload.
- Backend logs after switching dev Channels to `inmemory`: WebSocket connects without Redis timeout traceback.

## Notes

This phase keeps the current detail endpoint intact. The main win is that the list stays summary-only and the expanded UI no longer mounts every product/evidence thumbnail at once. A later larger step could add server-side pagination/search for shipments if the list grows from dozens into hundreds or thousands.
