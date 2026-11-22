# PlanPal Integrations

## Self Agent ID

**Purpose:** decide whether the requesting agent has fresh human-backed proof.

**Current state:** server-controlled demo policy only. `PLANPAL_DEMO_AGENT_STATUS` selects verified, stale, unverified, or missing behavior.

**Next step:** configure and review signed-request validation, freshness, replay protection, and registration details through secure project configuration.

## x402

**Purpose:** pay for premium information per request.

**Current state:** PlanPal creates a quote-shaped object and a clearly marked simulated receipt. No payment authorization or live settlement occurs.

**Next step:** configure the buyer wallet, spending cap, seller PayTo address, quote verification, settlement confirmation, and uncertain-state handling.

## Celo

The target chain is Celo mainnet, chain ID `42220`, with RPC `https://forno.celo.org`. The registered attribution tag is `celo_e667c914009d`. It must be applied in transaction-building code before any counted transaction is sent.

Live transactions remain disabled.

## ERC-8004

ERC-8004 registration is required by the hackathon for every entry. PlanPal should publish registration metadata and link the resulting identity only after the agent description, wallet, and deployment details are reviewed.

## Recommendation providers

Live place/event data is intentionally behind an adapter boundary. A provider should return normalized activities with title, place, time, cost, reason, and link. Provider outages should produce a transparent limited/error state rather than fabricated live claims.
