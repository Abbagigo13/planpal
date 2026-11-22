# PlanPal Testing

## Automated checks

```bash
pnpm check
pnpm test
pnpm build
```

The current suite covers the starter platform behavior and PlanPal policy flows. The PlanPal tests verify:

- Verified agents receive premium recommendations.
- Premium demo receipts are settled-shaped but non-live.
- Stale agents receive a limited response and no premium payment.
- Refinement changes the itinerary without changing the payment receipt.

## Database verification

After a reviewed migration, verify the expected tables and run one API-created plan through the database. A complete persistence check should find one plan row, its itinerary item rows, one agent snapshot, and one payment receipt.

## Manual product checks

1. Open `/` and enter `/app`.
2. Complete the three planner steps.
3. Confirm the loading rail appears while the server request is pending.
4. Confirm the result uses server-generated title, items, costs, and trust receipt.
5. Try both refinement buttons.
6. Set `PLANPAL_DEMO_AGENT_STATUS=stale` and confirm the limited result.
7. Inspect the trust receipt and confirm demo/non-live wording.
8. Repeat at a narrow mobile viewport.

## Integration checks before launch

- Verify Self signatures, timestamps, replay protection, and failure cases.
- Verify x402 quote, spending cap, authorization, settlement, and uncertain states.
- Verify Celo attribution tag and mainnet chain ID.
- Verify ERC-8004 identity metadata.
- Complete a real job with an independent user and document it without private information.

## Safety rule

Never use a fake transaction hash as evidence of mainnet activity. Demo hashes and simulated receipts must stay explicitly labeled.
