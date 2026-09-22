CREATE TABLE `conversations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`employer_id` text NOT NULL,
	`recruiter_name` text DEFAULT '' NOT NULL,
	`note` text NOT NULL,
	`interest` text DEFAULT 'promising' NOT NULL,
	`follow_up_status` text DEFAULT 'pending' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_conversations_user_created` ON `conversations` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_conversations_user_employer` ON `conversations` (`user_id`,`employer_id`);--> statement-breakpoint
CREATE TABLE `employer_progress` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`employer_id` text NOT NULL,
	`starred` integer DEFAULT false NOT NULL,
	`stage` text DEFAULT 'planned' NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_employer_progress_user_employer` ON `employer_progress` (`user_id`,`employer_id`);--> statement-breakpoint
CREATE INDEX `idx_employer_progress_user_stage` ON `employer_progress` (`user_id`,`stage`);--> statement-breakpoint
PRAGMA optimize;
