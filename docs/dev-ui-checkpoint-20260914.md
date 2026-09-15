# Dev checkpoint before the UI redesign — 2026-09-14

The user paused implementation to agree on the steps and model first. No UI changes have been deployed. PS must remain untouched.

## Verified baseline on the Mac Mini

- Repository/backend revision: `45de9bc9b05a3976acde9ec683a5b180f6164a81`.
- Frontend build stamp: `f22dafe` (verified in the running Dev ProfileSection asset).
- Dev frontend image: `sha256:34b4661ed2dad08129d4b821cec4cab492e67f594c58d15818f6df04e92de3a6`.
- Dev backend image: `sha256:3e353856aa72f6aed3c565e43df4e19627947867e43fe2455bdfb3960ec3c215`.

The frontend and backend intentionally have different build revisions because the later sorting correction only rebuilt the backend. A visual rollback must restore the frontend at `f22dafe` and leave the backend/data intact. Rebuilding everything from the repository HEAD is not an exact rollback of the deployed UI.

## Proposed steps (not yet approved to resume)

1. Preserve these Git revisions before continuing. Pin/save the running Dev frontend image before the first UI deployment.
2. Agree on a readable Apple-inspired direction: restrained glass on controls, solid content cards, larger type and touch targets, light/dark variants.
3. Start with a single representative client/shipment card and toolbar for visual review.
4. Apply the accepted design to Clients and Shipments with separate shared components/styles; keep calculations, API calls, lazy loading and pagination unchanged.
5. Check phone/desktop layouts, contrast, keyboard navigation and existing actions; deploy only the Dev frontend with `--no-deps` and an exact commit stamp.
6. Review in Dev. If rejected, restore only the saved Dev frontend image/build; never restore or copy a database as part of a UI rollback.

## Local draft

Before the pause, Lucide was installed locally and two unconnected draft files were created: `frontend/src/components/ui/SectionToolbar.jsx` and `frontend/src/styles/modern-ui.css`. They are not imported by any live section, have not been tested or committed, and have not been deployed. Do not describe them as a completed UI or automatically continue implementation while the user is still discussing the plan.
