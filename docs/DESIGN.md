# PlanPal Design Specification

## Design movement

PlanPal uses **Warm Civic Concierge**: an editorial travel app combined with a friendly civic utility. It should feel like a capable local friend, not a crypto dashboard.

## Principles

- **Warm clarity:** every technical event is translated into plain language.
- **Playful guidance:** the interface rewards exploration without making the user learn a workflow.
- **Visible trust:** verification and payment are available as a compact receipt.
- **Low cognitive load:** one decision per step, with a strong primary action.

## Visual identity

| Role | Color | Use |
|---|---|---|
| Cream | `#FFF9F0` | Page background and warmth |
| Ink navy | `#172033` | Type, primary actions, confidence |
| Citrus lime | `#D9F85A` | Progress, success, primary brand accent |
| Coral | `#FF8066` | Human action, emphasis, warmth |
| Lavender | `#B9B7FF` | Secondary discovery and identity moments |
| Slate | `#687083` | Supporting copy and metadata |
| Success | `#35B77B` | Verified and healthy states |

Headings use Space Grotesk; body copy uses DM Sans; technical values use a monospace face. The PlanPal mark is a compass-spark inside a citrus tile.

## Layout architecture

- `/` is the landing page with the promise, mission cards, trust explanation, and entry actions.
- `/app` is a guided three-step planner.
- The result view uses a vertical timeline with a right-side trust receipt and preference summary.
- `/docs` and `/docs/api` provide a separate documentation canvas with persistent navigation.

The layout is intentionally not a dense dashboard. It uses stacked cards, generous whitespace, and a timeline to make a plan feel actionable.

## Interaction design

- Planner steps advance with one clear CTA.
- The loading state uses a staged activity rail rather than a generic spinner.
- Result cards use small lift and color changes on hover.
- Refinement buttons disable while the server mutation is pending.
- Trust details expand in place so technical information does not interrupt the primary flow.
- Reduced-motion users receive a static version of the same hierarchy.

## States

- **Empty:** the planner starts with a friendly location prompt and sensible defaults.
- **Loading:** PlanPal shows understanding, research, budget checking, and itinerary-building steps.
- **Success:** the returned server plan displays timeline items, totals, status, and receipt details.
- **Limited:** stale or unverified agents see a limited plan and an explicit explanation.
- **Error:** server failure returns a retryable message without losing the user's inputs.
- **Payment:** demo receipts say `demo receipt`; live settlement language is reserved for a verified live adapter.

## Mobile behavior

The planner is touch-first: large controls, one-column cards, readable timeline rows, and no dependence on hover. The documentation sidebar collapses behind a menu. Result actions become full-width controls on narrow screens.
