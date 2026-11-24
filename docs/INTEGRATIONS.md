# PlanPal Integrations

## Self Agent ID

**Purpose:** establish that PlanPal is backed by a real human proof and, when applicable, verify signed inbound agent requests.

**Implemented:** the official `@selfxyz/agent-sdk` is wired behind `PLANPAL_AGENT_POLICY_MODE=self`. PlanPal's existing agent key is now registered and verified on Celo mainnet as **Self Agent ID `215`**. The adapter can read PlanPal's own agent status from the Self Agent ID registry using the protected `AGENT_PRIVATE_KEY`, or verify `x-self-agent-*` request headers using the official verifier. Freshness, replay protection, registry status, Self proof provider, and sybil limits are enforced by the SDK.

**Mainnet:** Celo mainnet (`SELF_AGENT_NETWORK=mainnet`), chain ID `42220`, with `https://forno.celo.org`. Testnet remains available only for mock-passport development. No passport data is stored by PlanPal.

## x402

**Purpose:** pay for premium recommendation information per request.

**Implemented:** the official x402 client, exact EVM scheme, Celo USDC requirements, facilitator verification, one-shot settlement, pay-to allowlisting, and an amount cap are wired behind `settleCeloPayment`. Failed and uncertain outcomes are recorded without automatic retries.

**Facilitator:** mainnet uses `https://api.x402.celo.org`; settlement requires the protected `X402_API_KEY`. The provider payout address is the protected `X402_PAYTO_ADDRESS`. The API key must never reach the browser.

**Safety:** `ENABLE_LIVE_CELO_TX=false` remains the default. With the guard off, the app returns a clearly labeled simulated receipt. Turning the guard on is a separate, high-impact step and requires confirming the buyer wallet, facilitator balance, pay-to address, USDC asset, spending cap, and uncertain-settlement behavior.

## Celo

The target counted chain is Celo mainnet, chain ID `42220`, with RPC `https://forno.celo.org`. The registered attribution tag is `celo_e667c914009d`.

PlanPal now includes a guarded wallet factory using Celo's official `@celo/attribution-tags` SDK. Every direct PlanPal `sendTransaction` or `writeContract` call must use that client, which appends the ERC-8021 suffix automatically. This covers the future ERC-8004 `register` and `setAgentURI` calls.

The existing PlanPal agent key is the intended ERC-8004 registration signer and owner. Its wallet must be funded with enough **CELO for gas** before any approved registration transaction. The default fee currency is CELO; any alternative fee currency requires a separate review of the adapter address, balance, and exact transaction request. The gas fee is part of the tagged registration transaction; it is not a separate attribution transaction.

The PlanPal x402 flow uses Celo's hosted facilitator. The buyer signs the payment authorization, but the facilitator submits the settlement transaction and pays its gas. Current Celo x402 documentation does not expose a PlanPal-controlled way to append our attribution suffix to that facilitator-submitted transaction. PlanPal therefore retains the attribution tag in quote and receipt metadata without falsely claiming that the hosted settlement is on-chain tagged. If the hackathon requires the x402 settlement itself to carry the tag, we must use a facilitator or settlement path that explicitly supports ERC-8021 before enabling live settlement.

## ERC-8004

ERC-8004 registration is required by the hackathon for every entry. A non-published draft is in [`ERC8004_REGISTRATION.DRAFT.json`](./ERC8004_REGISTRATION.DRAFT.json). It intentionally has an empty `registrations` array because the ERC-8004 identity registration has not yet been submitted; the stable endpoint, registration wallet, CELO gas balance, metadata URI, and exact tagged transaction still require review.

The Celo mainnet Identity Registry is `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`. The safe sequence is: publish the reviewed file at a stable HTTPS or IPFS URI, simulate `register(agentURI)`, inspect the tagged calldata, signer, CELO gas estimate, fee currency, and destination, obtain explicit approval, submit through the guarded attributed wallet, read the `Registered` event from the mined receipt, then update the file with the resulting `agentId` and `agentRegistry` entry. If the URI changes after that update, call `setAgentURI` through the same tagged wallet so the on-chain URI and file remain aligned. Self Agent ID's registry and ERC-8004's identity registry are separate deployments; the final submission must document both identities.

## Recommendation providers

Live place/event data remains behind an adapter boundary. A provider should return normalized activities with title, place, time, cost, reason, and link. Provider outages should produce a transparent limited/error state rather than fabricated live claims. The x402 buyer adapter is ready to call a real provider once a provider endpoint and its pay-to address are reviewed.

## Official sources

- [Self Agent ID overview](https://docs.self.xyz/docs/agent-id/overview/)
- [Celo Self Agent ID guide](https://docs.celo.org/build/agents/self-agent-id)
- [Celo x402 guide](https://docs.celo.org/build/agents/x402)
- [Celo ERC-8004 guide](https://docs.celo.org/build/agents/8004)
- [ERC-8004 specification](https://eips.ethereum.org/EIPS/eip-8004)
- [Celo attribution-tag builder guide](https://github.com/celo-org/attribution-tags/blob/main/BUILDERS.md)
