import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createPlan, refinePlan } from "./services/planpal";

const originalStatus = process.env.PLANPAL_DEMO_AGENT_STATUS;
const originalLive = process.env.ENABLE_LIVE_CELO_TX;
const originalDatabase = process.env.DATABASE_URL;

beforeEach(() => {
  delete process.env.DATABASE_URL;
});

afterEach(() => {
  if (originalStatus === undefined) delete process.env.PLANPAL_DEMO_AGENT_STATUS;
  else process.env.PLANPAL_DEMO_AGENT_STATUS = originalStatus;
  if (originalLive === undefined) delete process.env.ENABLE_LIVE_CELO_TX;
  else process.env.ENABLE_LIVE_CELO_TX = originalLive;
  if (originalDatabase === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = originalDatabase;
});

describe("PlanPal policy-backed planning", () => {
  it("gives a fresh demo agent premium recommendations and a simulated receipt", async () => {
    process.env.PLANPAL_DEMO_AGENT_STATUS = "verified";
    process.env.ENABLE_LIVE_CELO_TX = "false";

    const plan = await createPlan({
      mission: "date_night",
      location: "Lagos",
      dateTime: "Saturday 18:30",
      budgetCents: 6000,
      vibe: "Relaxed & memorable",
    });

    expect(plan.status).toBe("ready");
    expect(plan.accessTier).toBe("premium");
    expect(plan.items).toHaveLength(3);
    expect(plan.payment.status).toBe("settled");
    expect(plan.payment.provider).toBe("demo");
    expect(plan.payment.liveTransaction).toBe(false);
    expect(plan.payment.attributionTag).toBe("celo_e667c914009d");
    expect(plan.payment.transactionHash).toMatch(/^demo_tx_/);
  });

  it("limits stale agents and skips premium payment", async () => {
    process.env.PLANPAL_DEMO_AGENT_STATUS = "stale";
    process.env.ENABLE_LIVE_CELO_TX = "false";

    const plan = await createPlan({
      mission: "date_night",
      location: "Lagos",
      dateTime: "Saturday 18:30",
      budgetCents: 6000,
      vibe: "Relaxed & memorable",
    });

    expect(plan.status).toBe("limited");
    expect(plan.accessTier).toBe("limited");
    expect(plan.items).toHaveLength(1);
    expect(plan.agent.premiumEligible).toBe(false);
    expect(plan.payment.status).toBe("skipped");
    expect(plan.payment.transactionHash).toBeNull();
  });

  it("supports a safe refinement without changing payment state", async () => {
    process.env.PLANPAL_DEMO_AGENT_STATUS = "verified";
    process.env.ENABLE_LIVE_CELO_TX = "false";

    const plan = await createPlan({
      mission: "date_night",
      location: "Lagos",
      dateTime: "Saturday 18:30",
      budgetCents: 6000,
      vibe: "Relaxed & memorable",
    });
    const refined = await refinePlan(plan.id, "cheaper");

    expect(refined?.title).toContain("lighter");
    expect(refined?.items).toHaveLength(2);
    expect(refined?.payment.transactionHash).toBe(plan.payment.transactionHash);
  });
});
