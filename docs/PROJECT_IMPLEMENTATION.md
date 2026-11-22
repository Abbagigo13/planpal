# PlanPal Project Implementation

## Current stack

- React 19 + TypeScript + Vite
- Express + tRPC + Zod
- Drizzle ORM + MySQL
- Wouter routing
- Tailwind CSS v4 plus custom visual system
- Vitest for tests

## Repository layout

```text
client/src/pages/       product and documentation pages
client/src/components/   shared UI components
client/src/lib/          client tRPC and helpers
server/                  routers, database helpers, tests
server/services/         planning, agent policy, x402 boundaries
drizzle/                 schema and migrations
shared/                  constants and shared exports
docs/                    developer and product documentation
client/public/           route manifest and public assets
```

## Delivered slices

1. Warm Civic Concierge landing page and planner flow.
2. Responsive documentation surface.
3. Database schema and applied migration.
4. Server policy, x402 demo receipt, and tRPC procedures.
5. Planner UI connected to create and refinement procedures.

## Next implementation slices

1. Replace the demo Self adapter with verified signed-request validation.
2. Add production x402 quote, authorization, and settlement handling.
3. Add dynamic `/app/plan/:id` loading and shareable plans.
4. Add live recommendation providers behind explicit interfaces.
5. Complete ERC-8004/Self registration and independent-user validation.

## Delivery discipline

Keep slices small, test the affected behavior, update the docs and checklist, and checkpoint only after `pnpm check`, `pnpm test`, and `pnpm build` pass.
