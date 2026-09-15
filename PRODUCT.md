# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary user is the owner/operator of the personal-shopping service. Personal shoppers also use the system while working with clients.

## Product Purpose

The system supports the live personal-shopping workflow: managing clients, recording products as they are found, reviewing items, coordinating purchases, payments, and shipments.

## Operating Context

Shopping Live is the most important work surface. It is used while a shopping is in progress, where the operator needs to quickly see and act on client products and their current state.

## Capabilities and Constraints

- The existing calculation, business, shipment, pagination, lazy-loading, and data logic is authoritative and must be preserved during the UI redesign.
- All UI work and validation happen only in Dev until the user explicitly requests a production deployment.
- Production data and the PS database are never modified, copied into, restored, or overwritten as part of UI work.

## Brand Commitments

The interface should feel modern, clear, calm, and practical, with inspiration from Apple's current design language without copying it literally.

Apple Design principles are binding for the redesign: clear hierarchy, restrained materials used for navigation and controls, solid readable content surfaces, system-like typography, immediate feedback, and motion only when it clarifies an action. The interface must honor reduced-motion, reduced-transparency, and increased-contrast preferences.

## Product Principles

1. Make Shopping Live fast to scan and operate while work is happening.
2. Keep important client, product, balance, review, and shipment information immediately legible.
3. Preserve familiar workflows and existing functionality while improving the visual system.
4. Use motion and effects only when they clarify feedback or an action.

## Accessibility & Inclusion

- Maintain clear, readable type sizes and strong contrast in light and dark modes.
- Do not communicate meaning with color alone; statuses and balances need text, icons, or other visible cues.
- Provide comfortable touch targets and clear focus states for controls.
