import { randomUUID } from "node:crypto";
import {
  CHAIN_IDS,
  NETWORKS,
  SelfAgent,
  SelfAgentVerifier,
  buildWalletFreeRegisterUserDataAscii,
  signRegistrationChallenge,
} from "@selfxyz/agent-sdk";
import { getUniversalLink, SelfAppBuilder } from "@selfxyz/qrcode";
import { createPublicClient, http, parseAbi } from "viem";

export type VerificationStatus = "verified" | "unverified" | "stale" | "missing";

export type AgentPolicyResult = {
  agentId: string;
  status: VerificationStatus;
  premiumEligible: boolean;
  proofFreshUntil: Date | null;
  checkedAt: Date;
  source: "demo" | "self_agent_id";
  failureCode: string | null;
  note: string;
};

export type AgentRequest = {
  method: string;
  url?: string;
  originalUrl?: string;
  rawBody?: string;
  headers: Record<string, string | string[] | undefined>;
};

export type SelfRegistrationLink = {
  network: SelfNetwork;
  chainId: number;
  registryAddress: string;
  agentAddress: string;
  nonce: string;
  mode: "wallet-free-existing-key";
  scanUrl: string;
};

type SelfNetwork = "mainnet" | "testnet";

function getSelfNetwork(): SelfNetwork {
  return process.env.SELF_AGENT_NETWORK === "mainnet" ? "mainnet" : "testnet";
}

function getSelfRpcUrl(network: SelfNetwork) {
  if (network === "mainnet") return process.env.CELO_RPC_URL ?? "https://forno.celo.org";
  return process.env.CELO_TESTNET_RPC_URL ?? "https://forno.celo-sepolia.celo-testnet.org";
}

/**
 * Build a Self app link for the human to scan. This is deliberately opt-in:
 * scanning the link starts a real Self registration flow for the configured
 * agent key. The private key is used only in this server process to sign the
 * registration challenge and is never included in the returned payload.
 */
export async function buildSelfRegistrationLink(): Promise<SelfRegistrationLink> {
  if (process.env.PLANPAL_SELF_REGISTRATION_ENABLED !== "true") {
    throw new Error("Self registration flow is disabled.");
  }

  const privateKey = process.env.AGENT_PRIVATE_KEY ?? process.env.SELF_AGENT_PRIVATE_KEY;
  if (!privateKey) throw new Error("AGENT_PRIVATE_KEY is not configured.");

  const network = getSelfNetwork();
  const networkConfig = NETWORKS[network];
  const agent = new SelfAgent({ privateKey, network, rpcUrl: getSelfRpcUrl(network) });
  const info = await agent.getInfo();
  if (info.agentId > 0n) {
    throw new Error("The configured Self agent is already registered; use proof refresh instead.");
  }

  const publicClient = createPublicClient({ transport: http(networkConfig.rpcUrl) });
  const nonce = await publicClient.readContract({
    address: networkConfig.registryAddress as `0x${string}`,
    abi: parseAbi(["function agentNonces(address) view returns (uint256)"]),
    functionName: "agentNonces",
    args: [agent.address as `0x${string}`],
  });
  const signed = await signRegistrationChallenge(privateKey, {
    humanIdentifier: agent.address,
    chainId: CHAIN_IDS[network],
    registryAddress: networkConfig.registryAddress,
    nonce,
  });
  const userDefinedData = buildWalletFreeRegisterUserDataAscii({
    agentAddress: agent.address,
    signature: { r: signed.r, s: signed.s, v: signed.v },
    disclosures: { minimumAge: 0, ofac: false },
  });
  const selfApp = new SelfAppBuilder({
    version: 2,
    appName: "PlanPal",
    scope: "self-agent-id",
    endpoint: networkConfig.registryAddress,
    endpointType: network === "mainnet" ? "celo" : "staging_celo",
    userId: agent.address,
    userIdType: "hex",
    userDefinedData,
    disclosures: { minimumAge: 0, ofac: false },
  }).build();

  return {
    network,
    chainId: CHAIN_IDS[network],
    registryAddress: networkConfig.registryAddress,
    agentAddress: agent.address,
    nonce: nonce.toString(),
    mode: "wallet-free-existing-key",
    scanUrl: getUniversalLink(selfApp),
  };
}

function headerValue(request: AgentRequest | undefined, name: string) {
  const value = request?.headers[name];
  return Array.isArray(value) ? value[0] : value;
}

function hasSignedAgentHeaders(request: AgentRequest | undefined) {
  return Boolean(
    headerValue(request, "x-self-agent-signature") &&
      headerValue(request, "x-self-agent-timestamp"),
  );
}

function makeDemoResult(): AgentPolicyResult {
  const checkedAt = new Date();
  const agentId = process.env.PLANPAL_DEMO_AGENT_ID ?? "planpal-demo-agent";
  const requestedStatus = process.env.PLANPAL_DEMO_AGENT_STATUS ?? "verified";
  const status: VerificationStatus = ["verified", "unverified", "stale", "missing"].includes(requestedStatus)
    ? (requestedStatus as VerificationStatus)
    : "verified";
  const proofFreshUntil = status === "verified" ? new Date(checkedAt.getTime() + 60 * 60 * 1000) : null;
  const premiumEligible = status === "verified";

  return {
    agentId,
    status,
    premiumEligible,
    proofFreshUntil,
    checkedAt,
    source: "demo",
    failureCode: premiumEligible ? null : `agent_${status}`,
    note: premiumEligible
      ? "Demo proof is fresh. Premium recommendations are available."
      : "This demo agent is not eligible for premium recommendations.",
  };
}

function makeSelfResult(
  checkedAt: Date,
  agentId: string,
  premiumEligible: boolean,
  proofFreshUntil: Date | null,
  failureCode: string | null,
  note: string,
): AgentPolicyResult {
  const status: VerificationStatus = premiumEligible
    ? "verified"
    : proofFreshUntil && proofFreshUntil.getTime() <= checkedAt.getTime()
      ? "stale"
      : agentId
        ? "unverified"
        : "missing";

  return {
    agentId: agentId || "self-agent-not-registered",
    status,
    premiumEligible,
    proofFreshUntil,
    checkedAt,
    source: "self_agent_id",
    failureCode: premiumEligible ? null : failureCode ?? `agent_${status}`,
    note,
  };
}

/**
 * Resolve PlanPal's own Self Agent ID status. The private key is used only to
 * derive the agent address and read the public registry; it is never returned.
 */
async function readConfiguredSelfAgent(checkedAt: Date): Promise<AgentPolicyResult> {
  const privateKey = process.env.AGENT_PRIVATE_KEY ?? process.env.SELF_AGENT_PRIVATE_KEY;
  if (!privateKey) {
    return makeSelfResult(
      checkedAt,
      "",
      false,
      null,
      "self_agent_key_missing",
      "Self Agent ID is selected, but AGENT_PRIVATE_KEY is not configured.",
    );
  }

  try {
    const network = getSelfNetwork();
    const agent = new SelfAgent({
      privateKey,
      network,
      rpcUrl: getSelfRpcUrl(network),
    });
    const info = await agent.getInfo();
    const proofFreshUntil = info.proofExpiresAt > 0n ? new Date(Number(info.proofExpiresAt) * 1000) : null;
    const agentId = info.agentId > 0n ? info.agentId.toString() : agent.address;
    return makeSelfResult(
      checkedAt,
      agentId,
      info.isVerified,
      proofFreshUntil,
      info.hasHumanProof ? "self_proof_stale" : "self_proof_missing",
      info.isVerified
        ? "Self Agent ID proof is registered and fresh. Premium recommendations are available."
        : "Self Agent ID is configured, but its human proof is missing or stale.",
    );
  } catch {
    return makeSelfResult(
      checkedAt,
      "",
      false,
      null,
      "self_registry_unavailable",
      "Self Agent ID could not be read from the configured registry. Premium recommendations are disabled.",
    );
  }
}

/**
 * Verify an inbound signed request when Self headers are present. This is
 * fail-closed: the recovered signer, timestamp, replay state, registry entry,
 * proof freshness, and Self proof provider are checked by the official SDK.
 */
async function verifyInboundSelfRequest(request: AgentRequest, checkedAt: Date): Promise<AgentPolicyResult> {
  try {
    const network = getSelfNetwork();
    const verifier = SelfAgentVerifier.create()
      .network(network)
      .rpc(getSelfRpcUrl(network))
      .requireSelfProvider()
      .sybilLimit(1)
      .replayProtection(true)
      .maxAge(5 * 60 * 1000)
      .build();
    const result = await verifier.verify({
      signature: headerValue(request, "x-self-agent-signature") ?? "",
      timestamp: headerValue(request, "x-self-agent-timestamp") ?? "",
      method: request.method,
      url: request.originalUrl ?? request.url ?? "/",
      body: request.rawBody ?? "",
      keytype: headerValue(request, "x-self-agent-keytype"),
      agentKey: headerValue(request, "x-self-agent-key"),
    });
    const proofFreshUntil = result.proofExpiresAt ?? null;
    const agentId = result.agentId > 0n ? result.agentId.toString() : result.agentAddress;
    return makeSelfResult(
      checkedAt,
      agentId,
      result.valid,
      proofFreshUntil,
      result.valid ? null : "self_signed_request_rejected",
      result.valid
        ? "Signed Self Agent ID request is valid and fresh. Premium recommendations are available."
        : "The Self Agent ID request was rejected. Premium recommendations are disabled.",
    );
  } catch {
    return makeSelfResult(
      checkedAt,
      "",
      false,
      null,
      "self_verifier_error",
      "Self Agent ID request verification failed closed. Premium recommendations are disabled.",
    );
  }
}

/**
 * Policy boundary for the planner. Demo mode remains the default so the public
 * prototype stays usable. Set PLANPAL_AGENT_POLICY_MODE=self to read the
 * configured PlanPal agent, or to verify an inbound signed request when one is
 * present. No client-provided status assertion is trusted.
 */
export async function verifySelfAgentRequest(request?: AgentRequest): Promise<AgentPolicyResult> {
  if (process.env.PLANPAL_AGENT_POLICY_MODE !== "self") return makeDemoResult();

  const checkedAt = new Date();
  if (request && hasSignedAgentHeaders(request)) {
    return verifyInboundSelfRequest(request, checkedAt);
  }
  return readConfiguredSelfAgent(checkedAt);
}

export function makeVerificationSnapshotId() {
  return randomUUID();
}
