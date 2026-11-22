import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { agentStatusSnapshots, paymentReceipts, planItems, plans } from "../../drizzle/schema";
import { verifySelfAgentRequest, type AgentPolicyResult, type AgentRequest } from "./agent-policy";
import { buildCeloPaymentRequest, settleCeloPayment, type X402Receipt } from "./x402";

export type PlanInput = {
  mission: "date_night" | "weekend_adventure" | "birthday_plan" | "food_crawl";
  location: string;
  dateTime: string;
  budgetCents: number;
  vibe: string;
};

export type PlanItemResult = {
  startTime: string;
  title: string;
  place: string;
  detail: string;
  costCents: number;
  link: string | null;
};

export type PlanResult = PlanInput & {
  id: string;
  status: "ready" | "limited";
  accessTier: "premium" | "limited";
  title: string;
  totalCents: number;
  items: PlanItemResult[];
  agent: AgentPolicyResult;
  payment: X402Receipt;
};

const memoryPlans = new Map<string, PlanResult>();

function makeItinerary(input: PlanInput, premium: boolean): PlanItemResult[] {
  const place = input.location.trim() || "your neighborhood";
  const fullPlan: PlanItemResult[] = [
    { startTime: "18:30", title: "Sunset walk", place: `${place} viewpoint`, detail: "A calm first stop to ease into the evening and leave room for a good conversation.", costCents: 0, link: null },
    { startTime: "20:00", title: "Dinner with a view", place: "A well-loved local table", detail: `A ${input.vibe.toLowerCase()} dinner stop selected to keep the evening inside your budget.`, costCents: 3400, link: null },
    { startTime: "21:45", title: "A little encore", place: "A nearby live spot", detail: "One last small moment of sparkle, with an easy exit if the night is already perfect.", costCents: 1200, link: null },
  ];
  return premium ? fullPlan : fullPlan.slice(0, 1);
}

function makeLimitedPayment(): X402Receipt {
  const quote = buildCeloPaymentRequest("limited", 0);
  return { ...quote, status: "skipped", provider: "demo", transactionHash: null, liveTransaction: false, settledAt: null, failureCode: "premium_access_required" };
}

async function persistPlan(result: PlanResult, ownerUserId?: number) {
  const db = await getDb();
  if (!db) return;

  try {
    await db.insert(plans).values({
      id: result.id,
      ownerUserId: ownerUserId ?? null,
      mission: result.mission,
      location: result.location,
      dateTime: result.dateTime,
      budgetCents: result.budgetCents,
      vibe: result.vibe,
      status: result.status,
      accessTier: result.accessTier,
      title: result.title,
      totalCents: result.totalCents,
    });
    if (result.items.length > 0) {
      await db.insert(planItems).values(result.items.map((item, index) => ({
        planId: result.id,
        sortOrder: index,
        startTime: item.startTime,
        title: item.title,
        place: item.place,
        detail: item.detail,
        costCents: item.costCents,
        link: item.link,
      })));
    }
    await db.insert(agentStatusSnapshots).values({
      planId: result.id,
      agentId: result.agent.agentId,
      verificationStatus: result.agent.status,
      proofFreshUntil: result.agent.proofFreshUntil,
      checkedAt: result.agent.checkedAt,
      failureCode: result.agent.failureCode,
      premiumEligible: result.agent.premiumEligible ? 1 : 0,
      source: result.agent.source,
    });
    await db.insert(paymentReceipts).values({
      planId: result.id,
      provider: result.payment.provider === "x402" ? "x402" : "demo",
      status: result.payment.status,
      token: result.payment.token,
      amountCents: result.payment.amountCents,
      payTo: result.payment.payTo,
      quoteId: result.payment.quoteId,
      transactionHash: result.payment.transactionHash,
      attributionTag: result.payment.attributionTag,
      liveTransaction: result.payment.liveTransaction ? 1 : 0,
      failureCode: result.payment.failureCode,
      settledAt: result.payment.settledAt,
    });
  } catch (error) {
    // Preview and tests may run before migrations are applied. Keep the demo usable
    // while making the database failure visible for integration work.
    console.warn("[PlanPal] Persistence unavailable; using in-memory plan:", error);
  }
}

async function persistRefinement(result: PlanResult) {
  const db = await getDb();
  if (!db) return;

  try {
    await db.update(plans).set({ title: result.title, totalCents: result.totalCents, updatedAt: new Date() }).where(eq(plans.id, result.id));
    await db.delete(planItems).where(eq(planItems.planId, result.id));
    if (result.items.length > 0) {
      await db.insert(planItems).values(result.items.map((item, index) => ({
        planId: result.id,
        sortOrder: index,
        startTime: item.startTime,
        title: item.title,
        place: item.place,
        detail: item.detail,
        costCents: item.costCents,
        link: item.link,
      })));
    }
  } catch (error) {
    console.warn("[PlanPal] Refinement persistence unavailable:", error);
  }
}

export async function createPlan(input: PlanInput, ownerUserId?: number, request?: AgentRequest): Promise<PlanResult> {
  const id = crypto.randomUUID();
  const agent = await verifySelfAgentRequest(request);
  const payment = agent.premiumEligible
    ? await settleCeloPayment(id, buildCeloPaymentRequest(id))
    : makeLimitedPayment();
  const premium = agent.premiumEligible && payment.status === "settled";
  const items = makeItinerary(input, premium);
  const totalCents = items.reduce((sum, item) => sum + item.costCents, 0);
  const result: PlanResult = {
    ...input,
    id,
    status: premium ? "ready" : "limited",
    accessTier: premium ? "premium" : "limited",
    title: premium ? "Golden hour to goodnight" : "A gentle first step",
    totalCents,
    items,
    agent,
    payment,
  };
  memoryPlans.set(id, result);
  await persistPlan(result, ownerUserId);
  return result;
}

export async function getPlan(id: string): Promise<PlanResult | null> {
  const memoryResult = memoryPlans.get(id);
  if (memoryResult) return memoryResult;

  const db = await getDb();
  if (!db) return null;
  try {
    const [plan] = await db.select().from(plans).where(eq(plans.id, id)).limit(1);
    if (!plan) return null;
    const [agent] = await db.select().from(agentStatusSnapshots).where(eq(agentStatusSnapshots.planId, id)).limit(1);
    const [payment] = await db.select().from(paymentReceipts).where(eq(paymentReceipts.planId, id)).limit(1);
    if (!agent || !payment) return null;
    const storedItems = await db.select().from(planItems).where(eq(planItems.planId, id));
    const hydrated: PlanResult = {
      id: plan.id,
      mission: plan.mission,
      location: plan.location,
      dateTime: plan.dateTime,
      budgetCents: plan.budgetCents,
      vibe: plan.vibe,
      status: plan.status === "ready" ? "ready" : "limited",
      accessTier: plan.accessTier,
      title: plan.title ?? "A thoughtful plan",
      totalCents: plan.totalCents ?? 0,
      items: storedItems.sort((a, b) => a.sortOrder - b.sortOrder).map(item => ({
        startTime: item.startTime,
        title: item.title,
        place: item.place,
        detail: item.detail,
        costCents: item.costCents,
        link: item.link,
      })),
      agent: {
        agentId: agent.agentId,
        status: agent.verificationStatus,
        premiumEligible: agent.premiumEligible === 1,
        proofFreshUntil: agent.proofFreshUntil,
        checkedAt: agent.checkedAt,
        source: agent.source,
        failureCode: agent.failureCode,
        note: agent.premiumEligible === 1 ? "Premium recommendations are available." : "This plan has limited recommendations.",
      },
      payment: {
        quoteId: payment.quoteId ?? "",
        amountCents: payment.amountCents,
        token: "USDC",
        payTo: payment.payTo ?? "",
        chainId: 42220,
        attributionTag: payment.attributionTag,
        expiresAt: payment.settledAt ?? new Date(),
        status: payment.status,
        provider: payment.provider,
        transactionHash: payment.transactionHash,
        liveTransaction: payment.liveTransaction === 1,
        settledAt: payment.settledAt,
        failureCode: payment.failureCode,
      },
    };
    memoryPlans.set(id, hydrated);
    return hydrated;
  } catch (error) {
    console.warn("[PlanPal] Failed to read plan:", error);
    return null;
  }
}

export async function refinePlan(id: string, change: "cheaper" | "exciting"): Promise<PlanResult | null> {
  const plan = await getPlan(id);
  if (!plan) return null;

  if (change === "cheaper") {
    const items = plan.items.slice(0, 2);
    const updated = { ...plan, items, totalCents: items.reduce((sum, item) => sum + item.costCents, 0), title: "A little lighter, still lovely" };
    memoryPlans.set(id, updated);
    await persistRefinement(updated);
    return updated;
  }

  const extraItem: PlanItemResult = { startTime: "22:30", title: "Late-night sweet treat", place: "A tiny dessert stop", detail: "A flexible final stop for when the evening deserves one more good story.", costCents: 800, link: null };
  const updated = { ...plan, items: [...plan.items, extraItem], totalCents: plan.totalCents + extraItem.costCents, title: "Golden hour to goodnight, with an encore" };
  memoryPlans.set(id, updated);
  await persistRefinement(updated);
  return updated;
}

export function getCurrentAgentStatus(request?: AgentRequest) {
  return verifySelfAgentRequest(request);
}
