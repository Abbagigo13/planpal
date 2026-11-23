import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { createPlan, getCurrentAgentStatus, getPlan, refinePlan } from "./services/planpal";
import { buildSelfRegistrationLink } from "./services/agent-policy";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  plans: router({
    create: publicProcedure
      .input(z.object({
        mission: z.enum(["date_night", "weekend_adventure", "birthday_plan", "food_crawl"]),
        location: z.string().trim().min(2).max(160),
        dateTime: z.string().trim().min(2).max(80),
        budgetCents: z.number().int().min(2500).max(100000),
        vibe: z.string().trim().min(2).max(120),
      }))
      .mutation(({ input, ctx }) => createPlan(input, ctx.user?.id, ctx.req)),
    get: publicProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(({ input }) => getPlan(input.id)),
    refine: publicProcedure
      .input(z.object({ id: z.string().uuid(), change: z.enum(["cheaper", "exciting"]) }))
      .mutation(({ input }) => refinePlan(input.id, input.change)),
  }),
  agent: router({
    status: publicProcedure.query(({ ctx }) => getCurrentAgentStatus(ctx.req)),
    registrationLink: publicProcedure.query(() => buildSelfRegistrationLink()),
  }),
  payments: router({
    get: publicProcedure
      .input(z.object({ planId: z.string().uuid() }))
      .query(async ({ input }) => (await getPlan(input.planId))?.payment ?? null),
  }),
});

export type AppRouter = typeof appRouter;
