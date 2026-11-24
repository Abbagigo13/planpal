import { withAttribution } from "@celo/attribution-tags";
import { createWalletClient, http } from "viem";
import { celo } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import {
  CELO_ATTRIBUTION_TAG,
  CELO_MAINNET_CHAIN_ID,
  CELO_RPC_URL,
  assertLiveCeloTransactionsEnabled,
} from "@shared/hackathon";

export const CELO_ERC8004_IDENTITY_REGISTRY =
  "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432" as const;

/**
 * Create the only wallet client allowed to submit direct PlanPal Celo
 * transactions. The existing PlanPal agent key is the registration wallet;
 * it must hold CELO for gas unless an explicitly reviewed fee currency is
 * selected on the individual transaction.
 *
 * The client is live-transaction guarded and applies the registered
 * ERC-8021 attribution suffix to sendTransaction/writeContract calls.
 * Hosted x402 facilitator settlements do not use this client: the facilitator
 * submits those transactions and pays their gas.
 */
export function createGuardedAttributedCeloWalletClient() {
  assertLiveCeloTransactionsEnabled();

  const privateKey = process.env.AGENT_PRIVATE_KEY ?? process.env.SELF_AGENT_PRIVATE_KEY;
  if (!privateKey) throw new Error("AGENT_PRIVATE_KEY is not configured.");

  const account = privateKeyToAccount(
    (privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`) as `0x${string}`,
  );

  if (CELO_MAINNET_CHAIN_ID !== celo.id) {
    throw new Error("Celo mainnet chain configuration is inconsistent.");
  }

  return createWalletClient({
    account,
    chain: celo,
    transport: http(CELO_RPC_URL),
  }).extend(withAttribution(CELO_ATTRIBUTION_TAG));
}
