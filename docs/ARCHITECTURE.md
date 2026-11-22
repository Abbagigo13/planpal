# PlanPal Architecture

## System overview

```text
Browser
  React + Wouter + tRPC client
        |
        v
Express / tRPC server
  plan router -> orchestration service -> policy adapter
        |                       |
        |                       +--> Self Agent ID boundary (demo today)
        |                       +--> x402/Celo boundary (demo today)
        v
Drizzle ORM / MySQL
  plans, planItems, agentStatusSnapshots, paymentReceipts
```

## Frontend

The React client owns presentation state: current planner step, input values, loading/error state, and the currently displayed result. It does not own identity verification, payment signing, private keys, or policy decisions.

`client/src/pages/Home.tsx` calls the typed tRPC client for `plans.create` and `plans.refine`. The trust receipt renders the server response and labels non-live payment receipts as demo data.

## Server

The server exposes an Express health endpoint and a tRPC API. The current routers are:

- `plans.create`: validates input and creates a plan.
- `plans.get`: retrieves a plan by UUID.
- `plans.refine`: applies a cheaper or more exciting refinement.
- `agent.status`: reports the current server-controlled demo policy status.
- `payments.get`: returns the receipt attached to a plan.

`server/services/planpal.ts` orchestrates itinerary creation and persistence. `agent-policy.ts` and `x402.ts` are provider boundaries, not browser-facing integrations.

## Policy flow

1. Validate the planner request with Zod.
2. Evaluate the server-controlled agent status.
3. Select premium or limited itinerary depth.
4. Build a quote with the Celo chain ID and attribution tag.
5. Settle a simulated receipt while live transactions are disabled.
6. Persist the plan and all audit records.
7. Return a complete result to the client.

## Persistence fallback

When `DATABASE_URL` is unavailable, the service uses an in-memory map for local tests and preview resilience. When the database is available, plan creation writes the durable records. Database failures are visible in server logs and do not turn a demo receipt into a real payment claim.

## Deployment and safety

The project runs through the managed Webdev runtime on port 3000. Live Celo execution is gated by `ENABLE_LIVE_CELO_TX=false`. All future provider credentials must remain server-side and be requested through secure project configuration.
