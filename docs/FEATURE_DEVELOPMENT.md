# PlanPal Feature Development

## Add a planner capability

1. Define the user outcome and acceptance criteria in `docs/PRD.md`.
2. Add or update the input/output type at the server boundary.
3. Add validation in the tRPC procedure with Zod.
4. Implement orchestration in `server/services/planpal.ts` or a focused service.
5. Persist new durable fields through Drizzle and generate a migration.
6. Connect the UI through `client/src/lib/trpc.ts`.
7. Add success, loading, empty, limited, and error states.
8. Add tests before checkpointing.

## Add a new mission

Update the mission enum in `drizzle/schema.ts`, the planner input validation, the itinerary generator, the landing-page mission cards, and the docs. Generate and review a migration because mission values are part of the database contract.

## Add a provider

Create an adapter under `server/services/`. The adapter should expose a typed interface and return provider-neutral data. Keep secrets and network calls server-side. The planner service should decide when the adapter is eligible to run and how failures affect the user-facing result.

## UI rules

- Keep the primary task understandable without crypto knowledge.
- Make server state visible through human-readable progress copy.
- Never hardcode a live transaction claim.
- Keep technical receipt details expandable.
- Support touch layouts and reduced motion.
