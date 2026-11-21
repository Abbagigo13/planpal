import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const plans = mysqlTable("plans", {
  id: varchar("id", { length: 36 }).primaryKey(),
  ownerUserId: int("ownerUserId"),
  mission: mysqlEnum("mission", ["date_night", "weekend_adventure", "birthday_plan", "food_crawl"]).notNull(),
  location: varchar("location", { length: 160 }).notNull(),
  dateTime: varchar("dateTime", { length: 80 }).notNull(),
  budgetCents: int("budgetCents").notNull(),
  vibe: varchar("vibe", { length: 120 }).notNull(),
  status: mysqlEnum("status", ["researching", "ready", "limited", "failed"]).default("researching").notNull(),
  accessTier: mysqlEnum("accessTier", ["premium", "limited"]).default("limited").notNull(),
  title: varchar("title", { length: 180 }),
  totalCents: int("totalCents"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const planItems = mysqlTable("planItems", {
  id: int("id").autoincrement().primaryKey(),
  planId: varchar("planId", { length: 36 }).notNull(),
  sortOrder: int("sortOrder").notNull(),
  startTime: varchar("startTime", { length: 16 }).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  place: varchar("place", { length: 180 }).notNull(),
  detail: text("detail").notNull(),
  costCents: int("costCents").notNull(),
  link: varchar("link", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const agentStatusSnapshots = mysqlTable("agentStatusSnapshots", {
  id: int("id").autoincrement().primaryKey(),
  planId: varchar("planId", { length: 36 }).notNull(),
  agentId: varchar("agentId", { length: 180 }).notNull(),
  verificationStatus: mysqlEnum("verificationStatus", ["verified", "unverified", "stale", "missing"]).notNull(),
  proofFreshUntil: timestamp("proofFreshUntil"),
  checkedAt: timestamp("checkedAt").defaultNow().notNull(),
  failureCode: varchar("failureCode", { length: 120 }),
  premiumEligible: int("premiumEligible").default(0).notNull(),
  source: mysqlEnum("source", ["demo", "self_agent_id"]).default("demo").notNull(),
});

export const paymentReceipts = mysqlTable("paymentReceipts", {
  id: int("id").autoincrement().primaryKey(),
  planId: varchar("planId", { length: 36 }).notNull(),
  provider: mysqlEnum("provider", ["x402", "demo"]).default("demo").notNull(),
  status: mysqlEnum("status", ["quoted", "authorized", "settled", "failed", "uncertain", "skipped"]).notNull(),
  token: varchar("token", { length: 24 }).notNull(),
  amountCents: int("amountCents").notNull(),
  payTo: varchar("payTo", { length: 180 }),
  quoteId: varchar("quoteId", { length: 180 }),
  transactionHash: varchar("transactionHash", { length: 180 }),
  attributionTag: varchar("attributionTag", { length: 80 }).notNull(),
  liveTransaction: int("liveTransaction").default(0).notNull(),
  failureCode: varchar("failureCode", { length: 120 }),
  settledAt: timestamp("settledAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Plan = typeof plans.$inferSelect;
export type InsertPlan = typeof plans.$inferInsert;
export type PlanItem = typeof planItems.$inferSelect;
export type InsertPlanItem = typeof planItems.$inferInsert;
export type AgentStatusSnapshot = typeof agentStatusSnapshots.$inferSelect;
export type PaymentReceipt = typeof paymentReceipts.$inferSelect;
