export const CELO_ATTRIBUTION_TAG =
  process.env.CELO_ATTRIBUTION_TAG ?? "celo_e667c914009d";

export const CELO_MAINNET_CHAIN_ID = 42220;
export const CELO_RPC_URL = process.env.CELO_RPC_URL ?? "https://forno.celo.org";

/** Live transaction execution remains opt-in until the wallet and integrations are reviewed. */
export const LIVE_CELO_TX_ENABLED = process.env.ENABLE_LIVE_CELO_TX === "true";

export function assertLiveCeloTransactionsEnabled() {
  if (!LIVE_CELO_TX_ENABLED) {
    throw new Error(
      "Live Celo transactions are disabled. Set ENABLE_LIVE_CELO_TX=true only after reviewing the wallet and payment configuration.",
    );
  }
}
