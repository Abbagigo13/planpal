# PlanPal Authentication & Security

## Application authentication

The starter includes Manus OAuth/session handling and a `publicProcedure`/`protectedProcedure` split. Current plan creation is public for the demo experience; protected procedures can be introduced when accounts and ownership are required.

## Secret handling

- Never commit `.env`, private keys, wallet seed phrases, or provider secrets.
- Request protected values through secure project configuration.
- Never send secrets to the browser.
- Use a dedicated low-balance wallet for any future demonstration.

## Agent identity security

The real Self adapter must validate signatures, timestamps, replay protection, required fields, and tamper resistance. An identity header by itself is not proof. The current demo adapter deliberately uses server configuration instead.

## Payment security

The x402 adapter must check a spending cap before signing, verify the quote and PayTo address, preserve the attribution tag, and stop on uncertain settlement. Automatic retries must not occur after an ambiguous payment outcome.

## Data minimization

PlanPal stores planning preferences and audit metadata, not passports or identity documents. Agent snapshots should contain status and freshness only. Payment receipts contain settlement references and amounts, not private signing material.

## Operational safety

`ENABLE_LIVE_CELO_TX=false` is the default safety guard. Turning it on is not sufficient by itself to create a production integration; the wallet, Self registration, x402 PayTo, ERC-8004 metadata, spending cap, and failure handling must all be reviewed first.
