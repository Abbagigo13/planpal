import { createHash, randomUUID } from "node:crypto";
import {
  CELO_ATTRIBUTION_TAG,
  CELO_MAINNET_CHAIN_ID,
  CELO_RPC_URL,
  LIVE_CELO_TX_ENABLED,
  assertLiveCeloTransactionsEnabled,
} from "@shared/hackathon";

export type X402Quote = {
  quoteId: string;
  amountCents: number;
  token: "USDC";
  payTo: string;
  chainId: number;
  attributionTag: string;
  expiresAt: Date;
};

export type X402Receipt = X402Quote & {
  status: "quoted" | "authorized" | "settled" | "failed" | "uncertain" | "skipped";
  provider: "demo" | "x402";
  transactionHash: string | null;
  liveTransaction: boolean;
  settledAt: Date | null;
  failureCode: string | null;
};

export function buildCeloPaymentRequest(planId: string, amountCents = 2): X402Quote {
  return {
    quoteId: `quote_${randomUUID()}`,
    amountCents,
    token: "USDC",
    payTo: process.env.X402_PAYTO_ADDRESS ?? "demo-payto-not-configured",
    chainId: CELO_MAINNET_CHAIN_ID,
    attributionTag: CELO_ATTRIBUTION_TAG,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  };
}

/**
 * Simulate the x402 buyer retry while live transactions are disabled.
 * This is a demo receipt, not an on-chain transaction and must never be shown
 * as a real settlement hash.
 */
export function settleCeloPayment(planId: string, quote: X402Quote): X402Receipt {
  if (LIVE_CELO_TX_ENABLED) {
    assertLiveCeloTransactionsEnabled();
    throw new Error("Live x402 settlement adapter is not configured yet.");
  }

  const digest = createHash("sha256").update(`${planId}:${quote.quoteId}:${CELO_RPC_URL}`).digest("hex").slice(0, 16);
  return {
    ...quote,
    status: "settled",
    provider: "demo",
    transactionHash: `demo_tx_${digest}`,
    liveTransaction: false,
    settledAt: new Date(),
    failureCode: null,
  };
}
