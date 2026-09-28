CREATE TABLE `whatsapp_contacts` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`phone` varchar(20) NOT NULL,
	`name` varchar(140),
	`last_inbound_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime,
	CONSTRAINT `whatsapp_contacts_id` PRIMARY KEY(`id`),
	CONSTRAINT `whatsapp_contacts_phone_unique` UNIQUE(`phone`)
);
--> statement-breakpoint
CREATE TABLE `whatsapp_messages` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`wa_message_id` varchar(128),
	`direction` enum('in','out') NOT NULL,
	`from_phone` varchar(20) NOT NULL,
	`to_phone` varchar(20) NOT NULL,
	`contact_phone` varchar(20) NOT NULL,
	`phone_number_id` varchar(40) NOT NULL,
	`lead_id` bigint unsigned,
	`body` text,
	`type` varchar(20) NOT NULL,
	`media_r2_key` varchar(255),
	`media_mime` varchar(127),
	`media_filename` varchar(255),
	`status` enum('sent','delivered','read','failed'),
	`error` varchar(500),
	`sent_by_user_id` bigint unsigned,
	`auto_kind` varchar(20),
	`read_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `whatsapp_messages_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_wa_message` UNIQUE(`wa_message_id`)
);
--> statement-breakpoint
CREATE INDEX `idx_contact` ON `whatsapp_messages` (`contact_phone`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_lead` ON `whatsapp_messages` (`lead_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_unread` ON `whatsapp_messages` (`direction`,`read_at`);