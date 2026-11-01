ALTER TABLE `ts_rooms` ADD COLUMN `host_id` text;
--> statement-breakpoint
ALTER TABLE `ts_rooms` ADD COLUMN `phase` text NOT NULL DEFAULT 'waiting' CHECK (`phase` IN ('waiting','playing'));
--> statement-breakpoint
ALTER TABLE `ts_rooms` ADD COLUMN `match_id` text;
--> statement-breakpoint
ALTER TABLE `ts_rooms` ADD COLUMN `started_at` integer NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `ts_members` ADD COLUMN `ready` integer NOT NULL DEFAULT 0 CHECK (`ready` IN (0,1));
--> statement-breakpoint
ALTER TABLE `ts_members` ADD COLUMN `state_revision` integer NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `ts_members` ADD COLUMN `pose_at` integer NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `ts_members` ADD COLUMN `movement_credit` real NOT NULL DEFAULT 1.5;
