# Dev UI redesign plan

## Scope confirmed

- Work only in Dev. PS is not part of this redesign until the user explicitly asks to deploy an accepted version.
- Do not modify API behavior, business rules, calculations, database schema, database data, images, product selection, shipment behavior, pagination, or lazy-loading behavior.
- Primary users: the owner/operator and personal shoppers.
- Primary workflow: Shopping Live.
- Required qualities: readable typography, color-blind-friendly status cues, strong light/dark contrast, comfortable buttons, and purposeful effects.

## Design direction

Use Apple Design as a source of principles, not a visual copy:

- calm hierarchy and generous touch targets;
- translucent material only for navigation and compact control layers;
- opaque, readable content cards for client, product, money, and shipment information;
- system-like typography, larger readable text, and optical spacing;
- immediate, restrained feedback for taps and saves;
- support for reduced motion, reduced transparency, and increased contrast.

## Recovery checkpoint

- Baseline Dev frontend build: `f22dafe`.
- Baseline repository/backend revision: `45de9bc`.
- Local Git tags: `dev-frontend-before-ui-20260914` and `dev-before-ui-20260914`.
- Full details: `docs/dev-ui-checkpoint-20260914.md`.
- A UI rollback restores only the Dev frontend build. It never involves a database restore, copy, or migration.

## Working sequence

### Phase 1 — Home / Shopping Live audit

1. Run Impeccable critique and audit on Home without editing it.
2. Inspect Home on mobile and desktop, in light and dark modes.
3. List issues by priority: type sizes, contrast, action clarity, status cues, density, and focus/touch targets.

### Phase 2 — Home visual proposal

1. Define shared visual tokens for type, spacing, surfaces, borders, focus rings, status indicators, and buttons.
2. Build one representative Home/Shopping Live card and its toolbar in Dev.
3. Preserve all handlers, data reads, loads, calculations, and current ordering.
4. Review the representative version with the user before extending it.

### Phase 3 — Home implementation in Dev

1. Apply the accepted visual system across Home/Shopping Live.
2. Verify desktop and mobile together, both themes, and accessibility preferences.
3. Build and deploy only the Dev frontend. Do not rebuild the backend or run migrations.
4. User tests the workflow in Dev.

### Phase 4 — Clients, then Shipments

Repeat Phases 1–3 for Clients, then Shipments. Keep their existing pagination, on-demand expansion, balances, status ordering, and product-selection behavior intact.

### Phase 5 — Production only after approval

1. Validate the approved Dev frontend one last time.
2. Deploy only the frontend to PS after an explicit user request.
3. Verify PS. No database operation is part of this UI deployment.

## Installed design tools

- `apple-design`: design and interaction guidance, installed globally for Codex.
- `impeccable`: installed in `.agents/skills/impeccable`; its local hook can review UI edits after it is approved in Codex's `/hooks` view.

## Resume instruction

If this conversation is interrupted, say: `Continúa el plan de rediseño Dev, fase <n>, de docs/dev-ui-redesign-plan.md`. Read that file and `PRODUCT.md` before continuing.

## Current local state

- Dev frontend has the shared visual system and the Shopping Live, Clients, Shipments, gallery, and modal foundation deployed through commit `28a7964`.
- Production and every database remain untouched by this redesign.
- Next: finish Shopping Live accessibility/states, then redesign Stock, Missions, Expenses, Calculator, Reports, and Profile using the same system.
- A non-integrated local draft remains under `frontend/src/components/ui/`; it is not used by the app.
