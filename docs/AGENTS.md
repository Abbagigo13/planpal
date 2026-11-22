# PlanPal Agents

## Agent purpose

PlanPal is an orchestration agent that turns a real-world intention into a useful plan. It is not a wallet custodian and it does not store identity documents.

## Policy modes

The policy boundary is server-controlled. The browser cannot assert a verification status or upgrade itself by adding an identity header.

- `PLANPAL_AGENT_POLICY_MODE=demo` keeps the public prototype deterministic. `PLANPAL_DEMO_AGENT_STATUS` selects `verified`, `stale`, `unverified`, or `missing` behavior.
- `PLANPAL_AGENT_POLICY_MODE=self` reads the configured PlanPal agent from the Self Agent ID registry. If the request contains Self signing headers, the official verifier checks the inbound agent instead.

In Self mode, the official SDK enforces timestamp freshness, signature recovery, replay protection, registry registration, proof freshness, the Self proof provider, and a one-agent-per-human sybil limit. The exact JSON bytes captured by Express are passed into verification so the signed body is not re-serialized.

## Premium access rule

Premium recommendations require both a fresh Self proof and a successfully settled premium payment. If the registry is unavailable, proof is missing or stale, the signed request is rejected, or x402 settlement is failed or uncertain, PlanPal fails closed to the limited itinerary. An uncertain payment is never retried automatically.

## Self Agent ID configuration

The staged testnet configuration is:

```bash
SELF_AGENT_NETWORK=testnet
CELO_TESTNET_RPC_URL=https://forno.celo-sepolia.celo-testnet.org
PLANPAL_AGENT_POLICY_MODE=self
```

The agent private key is read from the protected `AGENT_PRIVATE_KEY` environment value. It is used only to derive the agent address and query the public registry in the planner flow. It is never returned to the client or persisted in the database.

Switch to `SELF_AGENT_NETWORK=mainnet` only after the agent registration, wallet, proof freshness, and deployment details have been reviewed together. Mainnet Self registration requires a real supported identity document; Celo Sepolia is the safer environment for the first end-to-end test.

## Agent payment behavior

When premium access is allowed, PlanPal creates a small USDC x402 requirement, enforces `X402_MAX_AMOUNT_USDC`, verifies the signed payment with Celo's hosted facilitator, and settles once. The live path is guarded by `ENABLE_LIVE_CELO_TX=true`. With the guard off, PlanPal returns an explicit demo receipt with `provider: "demo"` and `liveTransaction: false`.

## Privacy contract

- No passport, identity document, or ZK credential payload is persisted.
- The UI shows proof state, freshness, policy result, and agent identifier, not personal identity data.
- Private keys and facilitator credentials remain server-side.
- `X402_API_KEY` is never sent to the browser.
- Uncertain payment states stop automatic retries.

## Demo controls

```bash
PLANPAL_AGENT_POLICY_MODE=demo PLANPAL_DEMO_AGENT_STATUS=verified pnpm dev
PLANPAL_AGENT_POLICY_MODE=demo PLANPAL_DEMO_AGENT_STATUS=stale pnpm dev
```

These controls are for local/demo policy testing only; they are not a substitute for Self verification.

## ERC-8004

Self Agent ID uses an ERC-8004-compatible identity registry with a proof-of-human extension. PlanPal still needs a separate reviewed ERC-8004 registration-file publication and registration transaction for the hackathon submission. That identity work is not implied by the demo policy and has not been completed yet.
