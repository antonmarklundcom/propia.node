ALTER TABLE `leads` MODIFY COLUMN `lead_type` enum('buyer','renter','seller','valuation','developer','agent_signup','landlord','question') NOT NULL;--> statement-breakpoint
ALTER TABLE `leads` ADD `status` enum('new','contacted','closed') DEFAULT 'new' NOT NULL;--> statement-breakpoint
ALTER TABLE `leads` ADD `note` text;