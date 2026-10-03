CREATE INDEX `idx_routed_status` ON `leads` (`routed_to`,`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_owner` ON `listings` (`owner_user_id`,`agency_id`);--> statement-breakpoint
CREATE INDEX `idx_updated` ON `listings` (`updated_at`);--> statement-breakpoint
CREATE INDEX `idx_job_id` ON `ops_runs` (`job`,`id`);