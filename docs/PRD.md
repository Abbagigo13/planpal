# PlanPal Product Requirements Document

## 1. Product summary

PlanPal is a human-backed AI concierge for plans worth leaving the house for. It turns a short natural-language request into a practical real-world itinerary with activities, timing, estimated costs, reasons, and refinement actions.

The MVP is a budget-aware Saturday date-night planner. The primary hackathon target is Self Agent ID: Verified Agent Payments, with x402/Celo used for per-request payments and ERC-8004 used for agent registration.

## 2. Problem

People often want to do something memorable but lose the moment to search fatigue. Recommendations are fragmented across maps, social posts, event pages, menus, and booking sites. Autonomous agents can reduce this work, but users and service providers still need answers to two trust questions:

1. Is there a real human-backed agent behind this request?
2. Did the agent actually pay for the premium information it received?

PlanPal makes the user experience warm and non-technical while exposing a compact trust receipt for people who want to inspect the underlying proof and payment.

## 3. Target users

### Primary user

A person or couple planning a Saturday evening who has a location, a budget, and a mood but does not want to research every option manually.

### Secondary users

- An agent operator who wants to demonstrate a human-backed autonomous service.
- A premium information provider that wants to serve verified agents and receive per-request payment.
- A hackathon reviewer evaluating real-world usefulness, identity, payment, and on-chain compliance.

## 4. Goals

- Produce a useful date-night itinerary in under a minute.
- Keep recommendations inside a user-selected budget.
- Make identity and payment status understandable without crypto knowledge.
- Give fresh, human-backed agents access to premium recommendations.
- Give stale or unverified agents a safe, clearly limited response.
- Keep private identity documents and payment credentials out of the browser and database.
- Preserve a safe demo mode until real Self, x402, ERC-8004, wallet, and attribution setup is reviewed.

## 5. Non-goals for the MVP

- Full restaurant or event booking.
- Custody of user funds or agent funds.
- Storing passports, identity documents, or biometric data.
- Supporting every city and every planning category at launch.
- Automatically enabling mainnet transactions.

## 6. Core user journey

1. The user chooses Date Night.
2. The user enters a location, date/time, budget, and vibe.
3. PlanPal shows a friendly working state.
4. The server evaluates the agent policy.
5. A verified demo agent receives a premium itinerary; an unverified or stale agent receives a limited itinerary.
6. PlanPal records a demo x402-style receipt while live settlement is disabled.
7. The user can make the plan cheaper or more exciting.
8. The user can expand the trust receipt to inspect verification and payment details.

## 7. Acceptance criteria

- The planner is usable on mobile and desktop.
- Create, retrieve, and refine plan procedures are typed and server-owned.
- Plan, itinerary, agent snapshot, and payment receipt records persist in MySQL after migration.
- Demo payment receipts clearly indicate that they are not live transactions.
- No client input can assert its own verified status.
- `pnpm check`, `pnpm test`, and `pnpm build` pass.

## 8. Success measures

- An independent user completes a real planning task without assistance.
- The user can explain the resulting plan and why it fits the budget.
- A reviewer can reproduce both verified/premium and stale/limited policy outcomes.
- The demo can show a complete journey without exposing secrets or implying a fake mainnet hash.
