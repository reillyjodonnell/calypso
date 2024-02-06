CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`games_won` integer NOT NULL,
	`games_lost` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `weapons` (
	`id` text PRIMARY KEY NOT NULL,
	`weapon_name` text NOT NULL,
	`weapon_damage` text NOT NULL,
	`price` integer NOT NULL,
	`description` text NOT NULL,
	`type` text NOT NULL,
	`emoji` text NOT NULL
);
