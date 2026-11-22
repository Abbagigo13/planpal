# PlanPal Setup

## Prerequisites

- Node.js compatible with the repository toolchain.
- pnpm 10.
- A configured `DATABASE_URL` for database operations.
- Managed Webdev runtime for the full project experience.

## Install and run

```bash
pnpm install
pnpm dev
```

The development server runs on port 3000 through the managed runtime.

## Environment

Start from `.env.example`. Important values include:

```bash
CELO_ATTRIBUTION_TAG=celo_e667c914009d
CELO_RPC_URL=https://forno.celo.org
ENABLE_LIVE_CELO_TX=false
```

Keep Self, x402, wallet, and provider credentials in secure project configuration. Do not paste secrets into source files or chat.

## Database

```bash
pnpm drizzle-kit generate
pnpm db:migrate
```

The first PlanPal migration has already been applied to the managed database. Review any new migration before applying it because the database is shared.

## Demo policy

```bash
PLANPAL_DEMO_AGENT_STATUS=verified pnpm dev
PLANPAL_DEMO_AGENT_STATUS=stale pnpm dev
```

The default demo status is verified, but the resulting receipt remains non-live.

## Checks

```bash
pnpm check
pnpm test
pnpm build
```
