CREATE TABLE `agentStatusSnapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planId` varchar(36) NOT NULL,
	`agentId` varchar(180) NOT NULL,
	`verificationStatus` enum('verified','unverified','stale','missing') NOT NULL,
	`proofFreshUntil` timestamp,
	`checkedAt` timestamp NOT NULL DEFAULT (now()),
	`failureCode` varchar(120),
	`premiumEligible` int NOT NULL DEFAULT 0,
	`source` enum('demo','self_agent_id') NOT NULL DEFAULT 'demo',
	CONSTRAINT `agentStatusSnapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `paymentReceipts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planId` varchar(36) NOT NULL,
	`provider` enum('x402','demo') NOT NULL DEFAULT 'demo',
	`status` enum('quoted','authorized','settled','failed','uncertain','skipped') NOT NULL,
	`token` varchar(24) NOT NULL,
	`amountCents` int NOT NULL,
	`payTo` varchar(180),
	`quoteId` varchar(180),
	`transactionHash` varchar(180),
	`attributionTag` varchar(80) NOT NULL,
	`liveTransaction` int NOT NULL DEFAULT 0,
	`failureCode` varchar(120),
	`settledAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `paymentReceipts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `planItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planId` varchar(36) NOT NULL,
	`sortOrder` int NOT NULL,
	`startTime` varchar(16) NOT NULL,
	`title` varchar(180) NOT NULL,
	`place` varchar(180) NOT NULL,
	`detail` text NOT NULL,
	`costCents` int NOT NULL,
	`link` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `planItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `plans` (
	`id` varchar(36) NOT NULL,
	`ownerUserId` int,
	`mission` enum('date_night','weekend_adventure','birthday_plan','food_crawl') NOT NULL,
	`location` varchar(160) NOT NULL,
	`dateTime` varchar(80) NOT NULL,
	`budgetCents` int NOT NULL,
	`vibe` varchar(120) NOT NULL,
	`status` enum('researching','ready','limited','failed') NOT NULL DEFAULT 'researching',
	`accessTier` enum('premium','limited') NOT NULL DEFAULT 'limited',
	`title` varchar(180),
	`totalCents` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `plans_id` PRIMARY KEY(`id`)
);
