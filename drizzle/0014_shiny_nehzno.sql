CREATE TABLE `ops_runs` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`job` varchar(60) NOT NULL,
	`dry` boolean NOT NULL DEFAULT true,
	`started_by_user_id` bigint unsigned,
	`started_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`finished_at` datetime,
	`ok` boolean,
	`result_json` json,
	CONSTRAINT `ops_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `site_settings` (
	`key` varchar(60) NOT NULL,
	`value` text,
	`updated_at` datetime,
	`updated_by` bigint unsigned,
	CONSTRAINT `site_settings_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
ALTER TABLE `posts` ADD `locale` enum('es','en') DEFAULT 'es' NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_job_started` ON `ops_runs` (`job`,`started_at`);--> statement-breakpoint
CREATE INDEX `idx_started` ON `ops_runs` (`started_at`);