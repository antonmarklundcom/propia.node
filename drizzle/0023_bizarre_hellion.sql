CREATE TABLE `mail_sites` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`domain` varchar(190) NOT NULL,
	`display_name` varchar(160) NOT NULL,
	`sending_enabled` boolean NOT NULL DEFAULT false,
	`active` boolean NOT NULL DEFAULT true,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `mail_sites_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_domain` UNIQUE(`domain`)
);
--> statement-breakpoint
CREATE TABLE `mailbox_members` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`mailbox_id` bigint unsigned NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`can_reply` boolean NOT NULL DEFAULT true,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `mailbox_members_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_mailbox_user` UNIQUE(`mailbox_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `mailboxes` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`site_id` bigint unsigned NOT NULL,
	`local_part` varchar(64) NOT NULL,
	`label` varchar(120),
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `mailboxes_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_site_local` UNIQUE(`site_id`,`local_part`)
);
--> statement-breakpoint
CREATE INDEX `idx_user` ON `mailbox_members` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_site` ON `mailboxes` (`site_id`);