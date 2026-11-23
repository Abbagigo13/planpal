# PlanPal Integrations

## Self Agent ID

**Purpose:** establish that PlanPal is backed by a real human proof and, when applicable, verify signed inbound agent requests.

**Implemented:** the official `@selfxyz/agent-sdk` is wired behind `PLANPAL_AGENT_POLICY_MODE=self`. The adapter can read PlanPal's own agent status from the Self Agent ID registry using the protected `AGENT_PRIVATE_KEY`, or verify `x-self-agent-*` request headers using the official verifier. Freshness, replay protection, registry status, Self proof provider, and sybil limits are enforced by the SDK.

**Staged network:** Celo Sepolia (`SELF_AGENT_NETWORK=testnet`) with `https://forno.celo-sepolia.celo-testnet.org`. Mainnet remains an explicit later choice.

**Remaining:** complete Self registration through the Self app, confirm the agent is registered and fresh, then validate a signed request or own-agent registry read in the deployed environment. No passport data is stored by PlanPal.

## x402

**Purpose:** pay for premium recommendation information per request.

**Implemented:** the official x402 client, exact EVM scheme, Celo USDC requirements, facilitator verification, one-shot settlement, pay-to allowlisting, and an amount cap are wired behind `settleCeloPayment`. Failed and uncertain outcomes are recorded without automatic retries.

**Facilitator:** mainnet uses `https://api.x402.celo.org`; settlement requires the protected `X402_API_KEY`. The provider payout address is the protected `X402_PAYTO_ADDRESS`. The API key must never reach the browser.

**Safety:** `ENABLE_LIVE_CELO_TX=false` remains the default. With the guard off, the app returns a clearly labeled simulated receipt. Turning the guard on is a separate, high-impact step and requires confirming the buyer wallet, facilitator balance, pay-to address, USDC asset, spending cap, and uncertain-settlement behavior.

## Celo

The target counted chain is Celo mainnet, chain ID `42220`, with RPC `https://forno.celo.org`. The registered attribution tag is `celo_e667c914009d`.

The PlanPal x402 flow uses Celo's hosted facilitator. Current Celo x402 documentation notes that facilitator-side attribution tagging for x402 settlements is not live yet, so the attribution tag is retained in PlanPal's quote and receipt metadata but should not be represented as an on-chain x402 tag until the facilitator supports it. Any separate counted transaction builder must still apply the tag directly.

## ERC-8004

ERC-8004 registration is required by the hackathon for every entry. A non-published draft is in [`ERC8004_REGISTRATION.DRAFT.json`](./ERC8004_REGISTRATION.DRAFT.json). It intentionally has an empty `registrations` array because the final agent ID does not exist yet; the public endpoint and wallet still require review.

The Celo mainnet Identity Registry is `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`. The safe sequence is: publish the reviewed file at a stable HTTPS or IPFS URI, simulate `register(agentURI)`, review the exact transaction and fee currency, submit only after explicit approval, read the `Registered` event from the mined receipt, then update the file with the resulting `agentId` and `agentRegistry` entry. If the URI changes after that update, call `setAgentURI` so the on-chain URI and file remain aligned. Self Agent ID's registry and ERC-8004's identity registry are separate deployments; the final submission must document both identities.

## Recommendation providers

Live place/event data remains behind an adapter boundary. A provider should return normalized activities with title, place, time, cost, reason, and link. Provider outages should produce a transparent limited/error state rather than fabricated live claims. The x402 buyer adapter is ready to call a real provider once a provider endpoint and its pay-to address are reviewed.

## Official sources

- [Self Agent ID overview](https://docs.self.xyz/docs/agent-id/overview/)
- [Celo Self Agent ID guide](https://docs.celo.org/build/agents/self-agent-id)
- [Celo x402 guide](https://docs.celo.org/build/agents/x402)
- [Celo ERC-8004 guide](https://docs.celo.org/build/agents/8004)
- [ERC-8004 specification](https://eips.ethereum.org/EIPS/eip-8004)
- [Celo attribution-tag builder guide](https://github.com/celo-org/attribution-tags/blob/main/BUILDERS.md)
