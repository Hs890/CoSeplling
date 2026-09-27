CREATE TABLE IF NOT EXISTS `sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`startedAt` integer NOT NULL,
	`endedAt` integer,
	`durationPlannedSec` integer NOT NULL,
	`durationActualSec` integer,
	`intervalSec` integer NOT NULL,
	`category` text NOT NULL,
	`difficulty` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `session_words` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sessionId` integer NOT NULL,
	`position` integer NOT NULL,
	`word` text NOT NULL,
	`spokenAt` integer NOT NULL,
	`mark` text
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `session_words_session_idx` ON `session_words` (`sessionId`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
