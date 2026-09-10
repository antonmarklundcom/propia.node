CREATE TABLE `lead_matches` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`lead_id` bigint unsigned NOT NULL,
	`agent_id` bigint unsigned NOT NULL,
	`status` enum('proposed','sent','accepted','declined') NOT NULL DEFAULT 'proposed',
	`note` varchar(280),
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`sent_at` datetime,
	CONSTRAINT `lead_matches_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_lead_agent` UNIQUE(`lead_id`,`agent_id`)
);
--> statement-breakpoint
ALTER TABLE `agents` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `agents` ADD `license_no` varchar(60);--> statement-breakpoint
ALTER TABLE `agents` ADD `years_active` smallint unsigned;--> statement-breakpoint
ALTER TABLE `agents` ADD `zones` json;--> statement-breakpoint
CREATE INDEX `idx_lead` ON `lead_matches` (`lead_id`);