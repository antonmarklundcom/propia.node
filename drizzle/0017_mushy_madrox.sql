CREATE TABLE `admin_events` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`actor_user_id` bigint unsigned NOT NULL,
	`action` varchar(60) NOT NULL,
	`target_type` varchar(30) NOT NULL,
	`target_id` bigint unsigned NOT NULL,
	`detail_json` json,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `admin_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lead_assignments` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`lead_id` bigint unsigned NOT NULL,
	`agency_id` bigint unsigned NOT NULL DEFAULT 0,
	`agent_id` bigint unsigned NOT NULL DEFAULT 0,
	`assigned_by_user_id` bigint unsigned NOT NULL,
	`note` varchar(280),
	`state` enum('pending','accepted','declined','contacted','closed') NOT NULL DEFAULT 'pending',
	`state_at` datetime,
	`revoked_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `lead_assignments_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_lead_target` UNIQUE(`lead_id`,`agency_id`,`agent_id`)
);
--> statement-breakpoint
CREATE INDEX `idx_target` ON `admin_events` (`target_type`,`target_id`);--> statement-breakpoint
CREATE INDEX `idx_created` ON `admin_events` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_agency` ON `lead_assignments` (`agency_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_agent` ON `lead_assignments` (`agent_id`,`created_at`);