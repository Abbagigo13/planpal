# PlanPal Delivery Checklist

## Project eligibility and compliance

- [ ] Register and maintain a public GitHub repository for PlanPal.
- [ ] Register the PlanPal agent with ERC-8004 before the submission deadline.
- [x] Configure the guarded direct-transaction wallet to apply attribution tag `celo_e667c914009d` to every applicable Celo transaction.
- [ ] Fund and approve CELO gas for the existing PlanPal agent-key wallet before ERC-8004 registration.
- [ ] Register the x402 seller PayTo address if PlanPal operates a paid endpoint.
- [ ] Keep counted activity on Celo mainnet; clearly label any testnet-only development references.
- [x] Register PlanPal with Self Agent ID for the Self Agent ID track; mainnet Agent ID is `215`.
- [ ] Keep the agent key and all payment/provider credentials server-side.

## Product experience

- [ ] User can choose Date Night and enter location, date/time, budget, and vibe.
- [ ] User sees a clear working timeline while PlanPal researches.
- [ ] PlanPal returns a useful itinerary with times, activities, estimated costs, reasons, and links.
- [ ] User can make the plan cheaper, more exciting, or replace an activity.
- [ ] Mobile flow is designed for touch, not a squeezed desktop layout.
- [ ] Loading, empty, success, verification failure, payment failure, and over-budget states are designed.
- [ ] Technical trust/payment details are available without overwhelming the primary user flow.

## Self Agent ID track behavior

- [ ] Service verifies the Self-signed agent request rather than trusting an identity header alone.
- [ ] Fresh human-backed agents receive premium live recommendations.
- [ ] Unverified or stale agents are refused or given a clearly limited response.
- [ ] Replay, timestamp, tampering, and missing-header failures are handled.
- [ ] The UI shows proof status without exposing passport or personal identity data.

## Backend foundation

- [x] Define Drizzle tables and a generated migration for plans, itinerary items, agent status snapshots, and payment receipts.
- [x] Add typed tRPC procedures for creating, reading, and refining plans plus reading agent and payment status.
- [x] Add a server-controlled demo policy: verified agents receive premium recommendations; stale, unverified, or missing agents receive a limited response.
- [x] Keep simulated payment receipts explicitly marked as demo/non-live and include the configured Celo attribution tag.
- [x] Apply the reviewed migration to the managed database.
- [x] Connect the planner UI to the tRPC procedures and replace its local-only result state.

## x402 payment behavior

- [ ] A paid endpoint returns `402 Payment Required` with an explicit quote.
- [ ] Agent checks the spending cap before signing.
- [ ] Agent retries with the x402 payment authorization.
- [ ] Service verifies and settles the payment before releasing paid data.
- [ ] UI shows token, amount, status, settlement receipt, and transaction hash.
- [ ] Over-cap, insufficient-balance, failed, and uncertain-settlement states do not blindly retry.

## Real-world validation and submission

- [ ] At least one independent user outside the team completes a real planning job.
- [ ] The submission names the user/job without exposing private information.
- [ ] Mainnet transaction hashes and agent identity links are documented.
- [ ] README includes overview, architecture, Self integration, x402 integration, setup, API, FAQ, and known limitations.
- [ ] Demo video shows the complete user journey and at least one rejected policy/payment case.
- [ ] `pnpm check`, `pnpm test`, and `pnpm build` pass before submission.
