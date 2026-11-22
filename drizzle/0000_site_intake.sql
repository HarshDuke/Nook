CREATE TABLE IF NOT EXISTS `site_submissions` (
 `id` text PRIMARY KEY NOT NULL,
 `created_at` integer NOT NULL,
 `contact_name` text NOT NULL,
 `email` text NOT NULL,
 `company` text NOT NULL,
 `site_name` text NOT NULL,
 `location` text NOT NULL,
 `country` text NOT NULL,
 `site_type` text NOT NULL,
 `site_control` text NOT NULL,
 `available_power` text NOT NULL,
 `power_status` text NOT NULL,
 `timeline` text NOT NULL,
 `details` text NOT NULL,
 `phone` text NOT NULL,
 `consent_version` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `submissions_email_created` ON `site_submissions` (`email`, `created_at`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `intake_rate_limits` (
 `key` text PRIMARY KEY NOT NULL,
 `expires_at` integer NOT NULL,
 `count` integer NOT NULL
);
