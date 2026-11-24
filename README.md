# PlanPal

PlanPal is a human-backed AI concierge for plans worth leaving the house for. A user shares a place, time, budget, and mood; PlanPal turns that small idea into a practical itinerary with activities, timing, estimated costs, reasons, and easy refinement actions.

## What we are building

The first product is a budget-aware Saturday date-night planner. It is designed for people who want a memorable evening but do not want to spend an hour comparing maps, event pages, menus, and social posts. The experience starts with a warm three-step planner and ends with a timeline that feels ready to use.

Underneath the friendly interface is an accountable agent workflow. PlanPal checks whether a fresh human-backed agent is eligible for premium recommendations, pays only for the information it needs, and shows the user a compact trust and payment receipt. The technical details are available without making crypto knowledge a requirement.

## Why we are building it

Recommendation systems often optimize for more links rather than a better decision. PlanPal is built around the opposite outcome: help a person decide, leave the house, and have a good experience. The project also explores how autonomous agents can become more trustworthy when human-backed identity and per-request payment are treated as product behavior rather than hidden infrastructure.

## Who PlanPal is for

PlanPal serves everyday people planning date nights, weekend adventures, birthdays, and food crawls. It also serves agent operators who need to demonstrate a useful real-world job, premium information providers that want accountable agent traffic, and builders evaluating human-backed agent payments.

## Current product status

The landing page, responsive planner, documentation surface, backend procedures, database persistence, demo agent policy, and refinement flow are implemented. The planner UI calls typed tRPC procedures and stores plans, itinerary items, agent status snapshots, and payment receipts in the managed MySQL database.

The current Self and x402 integrations are implemented behind explicit safety gates. PlanPal's existing agent key is verified on Celo mainnet as Self Agent ID `215`. Demo mode remains the default. Self mode can read the configured PlanPal agent from the Self registry or verify signed inbound requests, while x402 can construct and verify a Celo USDC payment and settle through the hosted facilitator. `ENABLE_LIVE_CELO_TX=false` keeps the live path disabled, so the normal prototype still returns receipts marked `provider: "demo"` and `liveTransaction: false`. ERC-8004 registration and live x402 settlement still require separate review and approval.

## Hackathon direction

PlanPal targets the **Self Agent ID: Verified Agent Payments** track. The project also plans to satisfy the ERC-8004 requirement. Applicable Celo transaction construction uses the registered attribution tag:

```text
celo_e667c914009d
```

The existing PlanPal agent-key wallet is the intended ERC-8004 registration signer and must hold CELO for gas. Hosted x402 settlement is submitted and gas-funded by the facilitator, so PlanPal cannot currently append its own on-chain attribution suffix to that separate facilitator transaction.

The Celo target is mainnet, chain ID `42220`. Every direct PlanPal Celo transaction must use the official attribution-tagged wallet client with the tag above. Live transaction execution remains disabled with:

```text
ENABLE_LIVE_CELO_TX=false
```

## Project documentation

The complete documentation index is in [`docs/README.md`](./docs/README.md).

| Document | Purpose |
|---|---|
| [PRD](./docs/PRD.md) | Product problem, users, goals, requirements, and acceptance criteria |
| [DESIGN](./docs/DESIGN.md) | Visual identity, layout, interaction, states, and mobile behavior |
| [ARCHITECTURE](./docs/ARCHITECTURE.md) | Frontend, server, policy, payment, and persistence boundaries |
| [DATABASE](./docs/DATABASE.md) | Tables, privacy rules, money representation, and migrations |
| [API](./docs/API.md) | Typed tRPC procedures, inputs, outputs, and errors |
| [AGENTS](./docs/AGENTS.md) | Agent policy, human-backed identity, payment, and privacy contract |
| [Project Implementation](./docs/PROJECT_IMPLEMENTATION.md) | Current stack, delivered slices, and next implementation phases |
| [Setup](./docs/SETUP.md) | Installation, environment, demo modes, migrations, and checks |
| [Feature Development](./docs/FEATURE_DEVELOPMENT.md) | How to add missions, providers, server behavior, and UI features |
| [Authentication & Security](./docs/AUTHENTICATION_SECURITY.md) | Sessions, secrets, identity validation, payment safety, and data minimization |
| [MCP Connection](./docs/MCP_CONNECTION.md) | Secure external-provider boundary and connection pattern |
| [Integrations](./docs/INTEGRATIONS.md) | Self Agent ID, x402, Celo, ERC-8004, and recommendation providers |
| [ERC-8004 registration draft](./docs/ERC8004_REGISTRATION.DRAFT.json) | Reviewed metadata draft; not published or registered yet |
| [Testing](./docs/TESTING.md) | Automated checks, database verification, manual QA, and launch validation |

The original implementation and design plan remains in [`plan.md`](./plan.md), and the active delivery checklist is in [`TODO.md`](./TODO.md).

## Local development

```bash
pnpm install
pnpm dev
```

Run the standard validation suite:

```bash
pnpm check
pnpm test
pnpm build
```

For demo policy states:

```bash
PLANPAL_DEMO_AGENT_STATUS=verified pnpm dev
PLANPAL_DEMO_AGENT_STATUS=stale pnpm dev
```

## Safety and privacy

Never commit `.env`, wallet private keys, seed phrases, or provider credentials. Do not store passports or personal identity documents. Keep credentials server-side and use secure project configuration. Use a dedicated low-balance wallet for any future demonstration. Do not enable live Celo transactions until the wallet, Self, x402, ERC-8004, attribution, spending cap, and uncertain-settlement behavior have been reviewed together.

## Recent checkpoints

- `e75961a` — wired guarded Self Agent ID and Celo x402 adapters; live settlement remains disabled.
- `c13c9bd` — recorded the reviewed database migration and persistence verification.
- `64ea149` — connected the planner UI to backend procedures.
- `52258ab` — added the guarded backend foundation.
