# PlanPal Database

## Storage engine

PlanPal uses MySQL through Drizzle ORM. The schema source is `drizzle/schema.ts`; migrations live in `drizzle/`.

The initial PlanPal migration is `drizzle/0001_late_warpath.sql` and has been reviewed and applied to the managed database.

## Tables

### `plans`

The planning request and current result summary.

- `id`: UUID string primary key.
- `ownerUserId`: optional Manus user reference.
- `mission`: planning category.
- `location`, `dateTime`, `vibe`: user request fields.
- `budgetCents`, `totalCents`: integer money values; never floating point.
- `status`: researching, ready, limited, or failed.
- `accessTier`: premium or limited.
- `title`, `createdAt`, `updatedAt`.

### `planItems`

Timeline items belonging to a plan. Stores ordering, start time, title, place, explanation, cost in cents, and optional link.

### `agentStatusSnapshots`

An audit snapshot of the policy decision at planning time. Stores agent identifier, verification status, proof freshness, check time, failure code, premium eligibility, and source (`demo` or `self_agent_id`). It does not store identity documents.

### `paymentReceipts`

A payment lifecycle record. Stores provider, status, token, amount, PayTo, quote ID, transaction hash, attribution tag, live/non-live flag, failure code, settlement time, and creation time.

## Data rules

- Store money as integer cents.
- Never store passport data, identity documents, private keys, or raw signed credentials.
- Treat transaction hashes as public audit references, not secrets.
- A receipt with `liveTransaction = 0` must not be presented as a mainnet settlement.
- Preserve the attribution tag used to build any counted Celo transaction.

## Migration workflow

```bash
# Generate after reviewing schema changes
DATABASE_URL="$DATABASE_URL" pnpm drizzle-kit generate

# Apply reviewed migrations to the configured database
pnpm db:migrate
```

The managed database is shared by development and production, so migration review is required before applying changes.
