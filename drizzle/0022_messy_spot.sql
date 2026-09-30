CREATE TABLE `saved_searches` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`email` varchar(190) NOT NULL,
	`vertical` varchar(40) NOT NULL,
	`locale` varchar(2) NOT NULL DEFAULT 'es',
	`operation` varchar(20) NOT NULL,
	`property_type` varchar(20),
	`city_slug` varchar(140),
	`barrio_slug` varchar(140),
	`price_min` int,
	`price_max` int,
	`min_bedrooms` int,
	`criteria_hash` varchar(64) NOT NULL,
	`token` varchar(48) NOT NULL,
	`confirmed_at` datetime,
	`last_sent_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `saved_searches_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_token` UNIQUE(`token`),
	CONSTRAINT `uq_email_search` UNIQUE(`email`,`vertical`,`criteria_hash`)
);
--> statement-breakpoint
CREATE INDEX `idx_confirmed` ON `saved_searches` (`confirmed_at`);