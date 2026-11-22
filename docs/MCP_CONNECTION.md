# PlanPal MCP Connection

## What MCP is used for

MCP is an execution and integration boundary for agent tools. PlanPal's runtime should treat any MCP-connected capability as an external provider with explicit input/output contracts, timeouts, and failure handling.

## Current state

The current PlanPal product does not require a live external MCP provider to run its demo planner. The managed Webdev runtime provides the project environment and preview. Planning, policy, and payment behavior are implemented as server-side adapters so they can later connect to approved providers without changing the browser contract.

## Connection pattern

1. Discover the provider and read its schema.
2. Keep credentials in secure project configuration.
3. Wrap provider calls in a server service under `server/services/`.
4. Normalize the response into PlanPal's provider-neutral types.
5. Add timeout, retry, rate-limit, and uncertain-result behavior.
6. Persist only the minimum audit metadata required.
7. Add a mock adapter for tests and demos.

## Safety rules

- Do not expose MCP credentials in client bundles.
- Do not trust raw provider identity headers.
- Do not turn provider output into a payment claim without settlement verification.
- Do not silently retry a request after uncertain payment or identity state.
- Label demo and live results separately.

## Future connections

Potential providers include live places/events data, Self Agent ID verification, x402 payment services, and an ERC-8004 registration workflow. Each connection will be added only after its official contract and credential requirements are reviewed.
