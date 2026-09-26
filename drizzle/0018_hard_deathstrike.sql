CREATE TABLE `email_attachments` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`email_id` bigint unsigned NOT NULL,
	`filename` varchar(255) NOT NULL,
	`content_type` varchar(127) NOT NULL,
	`size_bytes` int unsigned NOT NULL,
	`r2_key` varchar(255),
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `email_attachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_messages` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`mailbox` varchar(190) NOT NULL,
	`direction` enum('in','out') NOT NULL,
	`from_address` varchar(254) NOT NULL,
	`from_name` varchar(190),
	`reply_to` varchar(254),
	`to_addresses` text,
	`cc_addresses` text,
	`subject` varchar(500) NOT NULL DEFAULT '',
	`text_body` mediumtext,
	`html_body` mediumtext,
	`message_id` varchar(512),
	`in_reply_to` varchar(512),
	`references_header` text,
	`thread_key` varchar(64) NOT NULL,
	`lead_id` bigint unsigned,
	`dedup_key` char(64),
	`sent_by_user_id` bigint unsigned,
	`send_error` varchar(120),
	`read_at` datetime,
	`archived_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `email_messages_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_dedup` UNIQUE(`dedup_key`)
);
--> statement-breakpoint
CREATE INDEX `idx_email` ON `email_attachments` (`email_id`);--> statement-breakpoint
CREATE INDEX `idx_thread` ON `email_messages` (`thread_key`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_lead` ON `email_messages` (`lead_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_mailbox` ON `email_messages` (`mailbox`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_message_id` ON `email_messages` (`message_id`);--> statement-breakpoint
CREATE INDEX `idx_unread` ON `email_messages` (`direction`,`read_at`);