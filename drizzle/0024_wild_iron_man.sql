CREATE TABLE `listing_financing` (
	`listing_id` bigint unsigned NOT NULL,
	`enabled` boolean NOT NULL DEFAULT false,
	`entity` varchar(120),
	`rate` varchar(120),
	`term` varchar(120),
	`down_payment` varchar(120),
	`notes` varchar(500),
	`updated_by_user_id` bigint unsigned NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `listing_financing_listing_id` PRIMARY KEY(`listing_id`)
);
--> statement-breakpoint
CREATE TABLE `partner_terms` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`agency_id` bigint unsigned NOT NULL DEFAULT 0,
	`agent_id` bigint unsigned NOT NULL DEFAULT 0,
	`commission_pct` decimal(5,2),
	`my_share_pct` decimal(5,2),
	`note` varchar(500),
	`updated_by_user_id` bigint unsigned NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `partner_terms_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_partner` UNIQUE(`agency_id`,`agent_id`)
);
