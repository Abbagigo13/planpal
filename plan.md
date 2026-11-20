# PlanPal — Implementation and Design Plan

## Product direction

PlanPal is a human-backed AI concierge for plans worth leaving the house for. A user describes a date night, weekend activity, birthday plan, or food crawl; PlanPal researches live options, pays for one premium information service through x402 on Celo, applies a budget policy, and returns a polished itinerary.

The primary hackathon target is **Self Agent ID: Verified Agent Payments**. Self Agent ID is part of the product policy: a fresh, human-backed agent receives premium live recommendations; an unverified or stale agent receives a limited demo response. Every entry also needs ERC-8004, and counted Celo activity needs the registered attribution tag.

## Scope for the first implementation

The MVP focuses on one city and one main job: **build a Saturday date-night plan under a user-selected budget**. The user experience must work without crypto knowledge. The technical trust layer appears as an expandable receipt showing human-backed status, proof freshness, payment amount, token, and Celo settlement.

Required flow:

1. User chooses Date Night, enters location, time, budget, and vibe.
2. PlanPal shows a friendly working timeline.
3. The agent checks Self Agent ID status and the local policy.
4. The agent requests a premium paid data/service endpoint.
5. The endpoint returns `402 Payment Required`; the agent checks its cap and retries with x402.
6. The service verifies Self-signed agent authentication and payment settlement.
7. PlanPal returns a timeline itinerary with cost estimates, reasons, links, and refinement actions.

Live mainnet transactions remain disabled until the wallet, attribution, ERC-8004 registration, Self registration, and x402 seller PayTo requirements are explicitly configured and reviewed.

## Design system

**Chosen style: Warm Civic Concierge.** PlanPal should feel like a delightful lifestyle product rather than a crypto dashboard.

- **Design movement:** editorial travel app meets friendly civic utility.
- **Core principles:** warm clarity, playful guidance, visible trust, low cognitive load.
- **Color philosophy:** cream creates approachability; ink navy adds confidence; citrus lime signals energy and progress; coral marks human actions; lavender supports secondary discovery.
- **Palette:** cream `#FFF9F0`, ink `#172033`, citrus `#D9F85A`, coral `#FF8066`, lavender `#B9B7FF`, muted slate `#687083`, success `#35B77B`.
- **Layout paradigm:** a guided canvas with stacked mission cards and a vertical plan timeline, not a dense grid dashboard.
- **Signature elements:** mission cards with small illustrated tokens, a live agent activity rail, and a compact Trust & Payment receipt.
- **Interaction philosophy:** every technical event is translated into a human-readable progress step; animation confirms progress without delaying the task.
- **Animation:** soft card lift on hover, 180–240ms transitions, pulsing activity dots, staged checklist completion, reduced-motion fallback.
- **Typography:** Space Grotesk or Plus Jakarta Sans for headings; DM Sans or Inter for body; JetBrains Mono for hashes and technical values.
- **Brand essence:** a human-backed AI concierge that turns an everyday idea into a useful plan. Personality: warm, capable, reassuring.
- **Brand voice:** direct, optimistic, and non-technical. Example: “Tell us what you’re in the mood for.” “Your agent paid for live details; your identity stayed private.”
- **Wordmark:** PlanPal wordmark paired with a compass-spark mark, suggesting a plan becoming actionable.
- **Signature brand color:** citrus lime `#D9F85A`.

## Information architecture

- `/` — product landing page and entry point.
- `/app` — mission selection and plan builder.
- `/app/plan/:id` — generated plan and refinement actions.
- `/docs` — overview, how it works, features, architecture, getting started, FAQ.
- `/docs/api` — API reference for plan, agent, and payment endpoints.

`client/public/manus-routes.json` must stay synchronized with this route set.

## Technical architecture

- **Frontend:** React, TypeScript, Wouter, Tailwind, Radix/shadcn components, Framer Motion where useful.
- **Backend:** Express, tRPC, Zod, database-backed plan and payment records.
- **Database:** Drizzle/MySQL tables for plans, plan items, agent status snapshots, and payment receipts.
- **Agent orchestration:** server-side policy layer with a provider adapter; no private keys in browser code.
- **Identity:** Self Agent ID request signing and service-side verification; ERC-8004 registration is documented and linked from the submission.
- **Payments:** x402 buyer integration for the first paid service; a seller endpoint may be added for the PlanPal premium service if needed.
- **Celo:** mainnet only for counted activity; attribution tag `celo_e667c914009d` is applied in transaction-building code before any transaction is sent.
- **Security:** dedicated wallet, low spending cap, server-side secrets, no passport/PII persistence, explicit settlement confirmation, no blind retry after uncertain settlement.

## Project structure

```text
client/src/pages/        product pages and documentation pages
client/src/components/    reusable UI and PlanPal-specific components
client/src/lib/           client helpers and typed data
server/                   tRPC routers, agent policy, payment adapters
server/services/          Self, x402, Celo and planning integrations
shared/                   shared constants and schemas
drizzle/                  database schema and migrations
docs/                     developer-facing documentation
client/public/            static route manifest and public assets
```

## Delivery approach

Build in thin vertical slices: first the polished mock flow, then persisted plans, then Self verification, then x402 payment, then mainnet compliance and the independent-user demo. Keep all live credentials and transaction execution behind explicit configuration. Validate with `pnpm check`, `pnpm test`, `pnpm build`, and a complete end-to-end demo before submission.
