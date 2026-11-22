# PlanPal API Reference

PlanPal exposes a typed tRPC API under `/api/trpc`. The browser uses the generated client in `client/src/lib/trpc.ts`; private integration work stays on the server.

## `plans.create`

Creates a date-night or future mission plan.

Input:

```json
{
  "mission": "date_night",
  "location": "Lagos",
  "dateTime": "Saturday 18:30",
  "budgetCents": 6000,
  "vibe": "Relaxed & memorable"
}
```

The server validates location length, budget bounds, mission, date/time, and vibe. The response includes `id`, `status`, `accessTier`, `items`, `agent`, and `payment`.

## `plans.get`

Input:

```json
{ "id": "<plan-uuid>" }
```

Returns a hydrated plan from memory or MySQL, including its itinerary, agent snapshot, and payment receipt. Missing plans return `null`.

## `plans.refine`

Input:

```json
{ "id": "<plan-uuid>", "change": "cheaper" }
```

`change` is either `cheaper` or `exciting`. The response is the updated plan. Refinement does not create a second payment receipt.

## `agent.status`

Returns the server-controlled policy status used by the demo adapter. The client cannot provide or override this status.

## `payments.get`

Input:

```json
{ "planId": "<plan-uuid>" }
```

Returns the payment receipt attached to the plan.

## Receipt semantics

The current demo adapter returns `provider: "demo"`, `liveTransaction: false`, and a `demo_tx_...` reference. These values are deliberately not real settlement proofs. Live x402/Celo behavior is not enabled.

## Errors

- Zod validation errors reject malformed planner input.
- Missing plans return `null` for read/refine operations.
- Authentication errors use the starter Manus auth contract where protected procedures are introduced.
- Provider failures must not be retried blindly after uncertain settlement.
