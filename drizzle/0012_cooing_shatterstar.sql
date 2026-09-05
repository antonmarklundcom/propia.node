CREATE TABLE `fx_rates` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`quote_currency` varchar(3) NOT NULL,
	`rate` decimal(14,4) NOT NULL,
	`source` varchar(60) NOT NULL,
	`fetched_at` datetime NOT NULL,
	CONSTRAINT `fx_rates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_currency_fetched` ON `fx_rates` (`quote_currency`,`fetched_at`);