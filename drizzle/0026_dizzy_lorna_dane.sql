CREATE TABLE `listing_exclusives` (
	`listing_id` bigint unsigned NOT NULL,
	`until` date,
	`note` varchar(280),
	`set_by_user_id` bigint unsigned NOT NULL,
	`set_at` datetime NOT NULL,
	CONSTRAINT `listing_exclusives_listing_id` PRIMARY KEY(`listing_id`)
);
