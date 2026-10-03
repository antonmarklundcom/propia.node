CREATE TABLE `reviews` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`lead_id` bigint unsigned NOT NULL,
	`agency_id` bigint unsigned NOT NULL DEFAULT 0,
	`agent_id` bigint unsigned NOT NULL DEFAULT 0,
	`rating` int unsigned NOT NULL,
	`body` varchar(2000),
	`author_name` varchar(80) NOT NULL,
	`locale` varchar(5) NOT NULL DEFAULT 'es',
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`moderated_by_user_id` bigint unsigned,
	`moderated_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_lead_target` UNIQUE(`lead_id`,`agency_id`,`agent_id`)
);
--> statement-breakpoint
CREATE INDEX `idx_agency_status` ON `reviews` (`agency_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_agent_status` ON `reviews` (`agent_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_status` ON `reviews` (`status`,`created_at`);