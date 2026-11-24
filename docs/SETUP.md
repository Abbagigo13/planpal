# PlanPal Setup

## Prerequisites

- Node.js compatible with the repository toolchain.
- pnpm 10.
- A configured `DATABASE_URL` for database operations.
- Managed Webdev runtime for the full project experience.
- A dedicated low-balance Celo wallet for staged agent testing.
- The Self app for completing Self Agent ID registration.

## Install and run

```bash
pnpm install
pnpm dev
```

The development server runs on port 3000 through the managed runtime.

## Vercel deployment

PlanPal can run as one Vercel project. The Vite frontend is published from `dist/public`, while `api/index.ts` exposes the Express health, OAuth, and tRPC routes as a Vercel serverless function. `vercel.json` routes `/api/*` to that function and leaves the browser-facing pages on the static frontend.

In Vercel, import the public GitHub repository, keep the repository root as the project root, and use the committed `vercel.json` settings. Add the protected runtime values through Vercel Environment Variables rather than committing them. For the first deployment, keep `PLANPAL_AGENT_POLICY_MODE=demo`, `PLANPAL_SELF_REGISTRATION_ENABLED=false`, and `ENABLE_LIVE_CELO_TX=false`.

After deployment, verify both layers:

```bash
curl https://YOUR-DOMAIN.example/api/health
# {"status":"ok"}
```

Then open `/app` and create a demo plan. A working homepage alone is not sufficient; a Vercel deployment is complete only when `/api/health` and the tRPC routes respond successfully.

## Environment

Start from `.env.example`. Public and non-secret staged values include:

```bash
CELO_ATTRIBUTION_TAG=celo_e667c914009d
SELF_AGENT_NETWORK=testnet
CELO_TESTNET_RPC_URL=https://forno.celo-sepolia.celo-testnet.org
PLANPAL_AGENT_POLICY_MODE=demo
PLANPAL_SELF_REGISTRATION_ENABLED=false
X402_FACILITATOR_URL=https://api.x402.celo.org
X402_MAX_AMOUNT_USDC=0.05
ENABLE_LIVE_CELO_TX=false
```

The protected project values are:

- `AGENT_PRIVATE_KEY`: the dedicated Self Agent ID and x402 buyer key.
- `X402_API_KEY`: the Celo facilitator key created at [x402.celo.org](https://x402.celo.org/).
- `X402_PAYTO_ADDRESS`: the reviewed provider payout address used in the x402 requirement.

Configure protected values through secure project configuration. Do not paste them into source files, shell history, or chat. Do not use a personal seed phrase.

## Self Agent ID registration and staging

1. Real passports and ID cards belong on Celo mainnet. Celo Sepolia accepts mock passports only.
2. For the existing PlanPal key, temporarily set `SELF_AGENT_NETWORK=mainnet`, `PLANPAL_AGENT_POLICY_MODE=self`, and `PLANPAL_SELF_REGISTRATION_ENABLED=true` through managed runtime configuration.
3. Open the guarded `agent.registrationLink` procedure. It returns a Self deep link built from the existing key’s signed registration challenge; it never returns the private key.
4. Scan or open the link in the Self app and approve the registration with the real verified document. This mints the Self Agent ID binding for the current PlanPal key.
5. Set `PLANPAL_SELF_REGISTRATION_ENABLED=false`, call `agent.status`, and confirm `source: "self_agent_id"`, `status: "verified"`, and `premiumEligible: true`.
6. If registration is missing, stale, or the registry cannot be reached, PlanPal intentionally returns limited recommendations.

Use `SELF_AGENT_NETWORK=testnet` only for a separate mock-passport validation path. Do not replace the current `AGENT_PRIVATE_KEY` with a newly generated Self key unless the x402 buyer-wallet implications are reviewed.

## x402 staging

Create the Celo facilitator key at the x402 dashboard, then store it as `X402_API_KEY`. Keep the facilitator URL pointed at the payment API host, not the dashboard. The current code uses Celo mainnet USDC and a small default cap. Live settlement remains disabled until all payment details have been reviewed.

For a safe first check, leave:

```bash
ENABLE_LIVE_CELO_TX=false
```

This keeps receipts simulated. Do not enable live settlement until the wallet has the intended USDC balance, the facilitator account is funded or has available credits, `X402_PAYTO_ADDRESS` is confirmed, and the spending cap is accepted.

## Database

```bash
pnpm drizzle-kit generate
pnpm db:migrate
```

The first PlanPal migration has already been applied to the managed database. Review any new migration before applying it because the database is shared.

## Demo policy

```bash
PLANPAL_AGENT_POLICY_MODE=demo PLANPAL_DEMO_AGENT_STATUS=verified pnpm dev
PLANPAL_AGENT_POLICY_MODE=demo PLANPAL_DEMO_AGENT_STATUS=stale pnpm dev
```

The default demo status is verified, but the resulting receipt remains non-live.

## Checks

```bash
pnpm check
pnpm test
pnpm build
```
