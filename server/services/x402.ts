import { createHash, randomUUID } from "node:crypto";
import { x402Client } from "@x402/core/client";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { isAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  CELO_ATTRIBUTION_TAG,
  CELO_MAINNET_CHAIN_ID,
  CELO_RPC_URL,
  LIVE_CELO_TX_ENABLED,
  assertLiveCeloTransactionsEnabled,
} from "@shared/hackathon";

const CELO_USDC_ADDRESS = "0xcebA9300f2b948710d2653dD7B07f33A8B32118C" as const;
const CELO_X402_FACILITATOR_URL = "https://api.x402.celo.org";
const DEFAULT_RESOURCE_URL = "https://planpal.app/premium-recommendation";

type X402Provider = "demo" | "x402";

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
  provider: X402Provider;
  transactionHash: string | null;
  liveTransaction: boolean;
  settledAt: Date | null;
  failureCode: string | null;
};

export function buildCeloPaymentRequest(_planId: string, amountCents = 2): X402Quote {
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

function makeDemoReceipt(planId: string, quote: X402Quote): X402Receipt {
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

function makeLiveFailure(quote: X402Quote, status: "failed" | "uncertain", failureCode: string): X402Receipt {
  return {
    ...quote,
    status,
    provider: "x402",
    transactionHash: null,
    liveTransaction: false,
    settledAt: null,
    failureCode,
  };
}

function privateKeyWithPrefix(value: string) {
  return value.startsWith("0x") ? value : `0x${value}`;
}

function amountToAtomicUsdc(amountCents: number) {
  return (BigInt(amountCents) * 10_000n).toString();
}

function maxAmountAtomicUsdc() {
  const configured = Number(process.env.X402_MAX_AMOUNT_USDC ?? "0.05");
  const maxUsdc = Number.isFinite(configured) && configured > 0 ? configured : 0.05;
  return BigInt(Math.round(maxUsdc * 1_000_000));
}

/**
 * Live buyer flow for Celo's hosted x402 facilitator. It constructs an exact
 * USDC authorization, verifies it off-chain, and settles once. If settlement
 * times out or returns an indeterminate result, the receipt is marked
 * uncertain and callers must not retry automatically.
 */
async function settleLiveCeloPayment(quote: X402Quote): Promise<X402Receipt> {
  assertLiveCeloTransactionsEnabled();

  const privateKey = process.env.AGENT_PRIVATE_KEY ?? process.env.SELF_AGENT_PRIVATE_KEY;
  if (!privateKey) return makeLiveFailure(quote, "failed", "x402_buyer_key_missing");
  if (!isAddress(quote.payTo)) return makeLiveFailure(quote, "failed", "x402_payto_invalid");

  const amount = BigInt(quote.amountCents) * 10_000n;
  if (amount <= 0n || amount > maxAmountAtomicUsdc()) {
    return makeLiveFailure(quote, "failed", "x402_spending_cap_exceeded");
  }

  try {
    const account = privateKeyToAccount(privateKeyWithPrefix(privateKey) as `0x${string}`);
    const requirements = {
      scheme: "exact" as const,
      network: `eip155:${CELO_MAINNET_CHAIN_ID}` as const,
      amount: amountToAtomicUsdc(quote.amountCents),
      asset: CELO_USDC_ADDRESS,
      payTo: quote.payTo as `0x${string}`,
      maxTimeoutSeconds: 300,
      extra: { name: "USDC", version: "2" },
    };
    const paymentRequired = {
      x402Version: 2 as const,
      resource: {
        url: process.env.X402_RESOURCE_URL ?? DEFAULT_RESOURCE_URL,
        description: "PlanPal premium recommendation context",
        mimeType: "application/json",
      },
      accepts: [requirements],
    };
    const client = x402Client.fromConfig({
      schemes: [
        {
          network: `eip155:${CELO_MAINNET_CHAIN_ID}`,
          client: new ExactEvmScheme(account, { rpcUrl: CELO_RPC_URL }),
        },
      ],
      spendControls: {
        maxAmountPerPayment: "$0.05",
        allowedAssets: [
          {
            network: `eip155:${CELO_MAINNET_CHAIN_ID}`,
            asset: CELO_USDC_ADDRESS,
            maxAmountPerPayment: maxAmountAtomicUsdc().toString(),
          },
        ],
      },
    });
    const paymentPayload = await client.createPaymentPayload(paymentRequired);
    const facilitator = new HTTPFacilitatorClient({
      url: process.env.X402_FACILITATOR_URL ?? CELO_X402_FACILITATOR_URL,
      createAuthHeaders: async () => {
        const apiKey = process.env.X402_API_KEY;
        const headers = apiKey ? { "X-API-Key": apiKey } : undefined;
        return { verify: headers, settle: headers, supported: headers };
      },
    });
    const verification = await facilitator.verify(paymentPayload, requirements);
    if (!verification.isValid) return makeLiveFailure(quote, "failed", "x402_verification_rejected");

    const settlement = await facilitator.settle(paymentPayload, requirements);
    if (!settlement.success) return makeLiveFailure(quote, "failed", "x402_settlement_rejected");

    return {
      ...quote,
      status: "settled",
      provider: "x402",
      transactionHash: settlement.transaction || null,
      liveTransaction: true,
      settledAt: new Date(),
      failureCode: null,
    };
  } catch {
    return makeLiveFailure(quote, "uncertain", "x402_settlement_uncertain");
  }
}

export async function settleCeloPayment(planId: string, quote: X402Quote): Promise<X402Receipt> {
  if (!LIVE_CELO_TX_ENABLED) return makeDemoReceipt(planId, quote);
  return settleLiveCeloPayment(quote);
}
