CREATE TABLE `analytics_daily` (
	`day` date NOT NULL,
	`vertical` varchar(20) NOT NULL,
	`event` enum('page_view','wa_click','lead_submit') NOT NULL,
	`dim` varchar(20) NOT NULL,
	`value` varchar(191) NOT NULL,
	`count` int unsigned NOT NULL DEFAULT 0,
	`uniques` int unsigned NOT NULL DEFAULT 0,
	CONSTRAINT `analytics_daily_day_vertical_event_dim_value_pk` PRIMARY KEY(`day`,`vertical`,`event`,`dim`,`value`)
);
--> statement-breakpoint
CREATE TABLE `analytics_events` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`ts` datetime NOT NULL,
	`day` date NOT NULL,
	`vertical` varchar(20) NOT NULL,
	`event` enum('page_view','wa_click','lead_submit') NOT NULL,
	`path` varchar(255) NOT NULL,
	`listing_id` bigint unsigned,
	`referrer_host` varchar(120),
	`utm_source` varchar(60),
	`utm_medium` varchar(60),
	`utm_campaign` varchar(100),
	`device` enum('mobile','tablet','desktop') NOT NULL,
	`visitor_hash` char(16) NOT NULL,
	CONSTRAINT `analytics_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deals` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`lead_id` bigint unsigned NOT NULL,
	`listing_id` bigint unsigned,
	`agency_id` bigint unsigned NOT NULL DEFAULT 0,
	`agent_id` bigint unsigned NOT NULL DEFAULT 0,
	`stage` enum('open','viewing','offer','reserved','won','lost') NOT NULL DEFAULT 'open',
	`lost_reason` enum('unavailable','price','financing','slow_response','bought_elsewhere','not_serious','other'),
	`sale_price_usd` decimal(14,2),
	`commission_pct` decimal(5,2),
	`my_share_pct` decimal(5,2),
	`my_share_usd` decimal(14,2),
	`paid_at` datetime,
	`note` text,
	`created_by_user_id` bigint unsigned NOT NULL,
	`stage_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `deals_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_lead` UNIQUE(`lead_id`)
);
--> statement-breakpoint
ALTER TABLE `lead_assignments` ADD `partner_note` text;--> statement-breakpoint
ALTER TABLE `lead_assignments` ADD `reminded_at` datetime;--> statement-breakpoint
ALTER TABLE `users` ADD `telegram_chat_id` varchar(40);--> statement-breakpoint
CREATE INDEX `idx_day` ON `analytics_events` (`day`,`vertical`,`event`);--> statement-breakpoint
CREATE INDEX `idx_listing` ON `analytics_events` (`listing_id`,`day`);--> statement-breakpoint
CREATE INDEX `idx_stage` ON `deals` (`stage`,`stage_at`);--> statement-breakpoint
CREATE INDEX `idx_agency` ON `deals` (`agency_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_agent` ON `deals` (`agent_id`,`created_at`);