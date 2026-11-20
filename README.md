# PlanPal

PlanPal is a human-backed AI concierge that turns everyday requests into real-world plans. The first experience is a budget-aware Saturday date-night planner that researches live options, pays for premium information through x402 on Celo, and returns a polished itinerary.

## Hackathon track

Primary target: **Self Agent ID: Verified Agent Payments**.

PlanPal uses Self Agent ID to decide which agents may access premium live recommendations, and x402 to pay per request. Every project entry also needs ERC-8004. Applicable Celo transactions use the registered attribution tag:

```text
celo_e667c914009d
```

## Current status

The managed PlanPal web project is initialized with React/Express/tRPC/Drizzle and database support. The product foundation and compliance checklist are being built first. Live Celo transaction execution is disabled by default.

## Safety and privacy

- Never commit `.env` or private keys.
- Use a dedicated low-balance wallet for demonstrations.
- Do not store passport data or personal identity documents.
- Keep `ENABLE_LIVE_CELO_TX=false` until the full wallet, Self, x402, ERC-8004, and attribution setup is reviewed.

## Local development

```bash
pnpm dev
```

Useful checks:

```bash
pnpm check
pnpm test
pnpm build
```

See [plan.md](./plan.md) for the product/design and architecture plan and [TODO.md](./TODO.md) for the implementation checklist.
