CREATE TABLE `listing_duplicates` (
	`listing_id` bigint unsigned NOT NULL,
	`group_id` bigint unsigned NOT NULL,
	`marked_by_user_id` bigint unsigned NOT NULL,
	`marked_at` datetime NOT NULL,
	CONSTRAINT `listing_duplicates_listing_id` PRIMARY KEY(`listing_id`)
);
--> statement-breakpoint
CREATE INDEX `idx_group` ON `listing_duplicates` (`group_id`);