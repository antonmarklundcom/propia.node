CREATE TABLE `web_vitals` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`day` date NOT NULL,
	`vertical` varchar(20) NOT NULL,
	`page_type` varchar(20) NOT NULL,
	`metric` enum('LCP','INP','CLS','FCP','TTFB') NOT NULL,
	`value` decimal(10,4) NOT NULL,
	`device` enum('mobile','tablet','desktop') NOT NULL,
	CONSTRAINT `web_vitals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_day_metric` ON `web_vitals` (`day`,`metric`);