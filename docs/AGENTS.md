# PlanPal Agents

## Agent purpose

PlanPal is an orchestration agent that turns a real-world intention into a useful plan. It is not a wallet custodian and it does not store identity documents.

## Current policy

The demo policy is server-controlled through `PLANPAL_DEMO_AGENT_STATUS`:

- `verified`: premium itinerary and simulated x402 receipt.
- `stale`: limited itinerary and no premium payment.
- `unverified`: limited itinerary and no premium payment.
- `missing`: limited itinerary and no premium payment.

The browser never submits a status assertion. This prevents a client from upgrading itself by adding an identity header.

## Production policy target

The production adapter will verify a Self-signed request, including signature, timestamp freshness, replay protection, and required agent identity fields. Only a successful verification with fresh proof can unlock premium recommendations.

ERC-8004 registration is a separate agent identity requirement for the hackathon. Registration metadata and identity links will be documented before submission.

## Agent payment behavior

When premium access is allowed, the agent requests a quote, checks its spending cap, and retries the paid request through x402. The current implementation simulates the result and records an explicit non-live receipt.

## Privacy contract

- No passport or identity document is persisted.
- The UI shows proof state, freshness, and policy result, not personal identity data.
- Private keys and provider credentials remain server-side.
- Uncertain payment states must stop automatic retries.

## Demo controls

```bash
PLANPAL_DEMO_AGENT_STATUS=verified pnpm dev
PLANPAL_DEMO_AGENT_STATUS=stale pnpm dev
```

These controls are for local/demo policy testing only; they are not a substitute for Self verification.
