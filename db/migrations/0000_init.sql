CREATE TABLE `attempts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sessionId` integer NOT NULL,
	`wordId` integer NOT NULL,
	`typed` text NOT NULL,
	`isCorrect` integer NOT NULL,
	`category` text NOT NULL,
	`difficulty` text NOT NULL,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `mistakes` (
	`wordId` integer PRIMARY KEY NOT NULL,
	`lastWrongSpelling` text NOT NULL,
	`wrongCount` integer DEFAULT 1 NOT NULL,
	`correctCount` integer DEFAULT 0 NOT NULL,
	`lastPracticedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`startedAt` integer NOT NULL,
	`endedAt` integer,
	`durationPlannedSec` integer NOT NULL,
	`durationActualSec` integer,
	`category` text NOT NULL,
	`difficulty` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`correct` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `words` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`word` text NOT NULL,
	`category` text NOT NULL,
	`difficulty` text NOT NULL,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `words_word_unique` ON `words` (`word`);