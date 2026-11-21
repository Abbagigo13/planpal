import { randomUUID } from "node:crypto";

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

/**
 * Safe boundary for Self Agent ID.
 *
 * The real signed-request verifier will replace this adapter once Self credentials
 * and registration are configured. Demo status is intentionally controlled by a
 * server environment variable, never by a client-provided identity header.
 */
export function verifySelfAgentRequest(): AgentPolicyResult {
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

export function makeVerificationSnapshotId() {
  return randomUUID();
}
