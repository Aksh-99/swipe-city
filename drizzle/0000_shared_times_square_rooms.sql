CREATE TABLE `ts_rooms` (
 `code` text PRIMARY KEY NOT NULL,
 `created_at` integer NOT NULL,
 `expires_at` integer NOT NULL,
 `anchor_state` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ts_members` (
 `token_hash` text PRIMARY KEY NOT NULL,
 `player_id` text NOT NULL UNIQUE,
 `room_code` text NOT NULL REFERENCES `ts_rooms`(`code`) ON DELETE CASCADE,
 `slot` integer NOT NULL CHECK (`slot` BETWEEN 0 AND 3),
 `avatar` text NOT NULL CHECK (`avatar` IN ('explorer','tourist','officer','courier')),
 `name` text NOT NULL,
 `joined_at` integer NOT NULL,
 `last_seen` integer NOT NULL,
 `sequence` integer NOT NULL DEFAULT 0,
 `state` text NOT NULL,
 UNIQUE (`room_code`,`slot`),
 UNIQUE (`room_code`,`avatar`)
);
--> statement-breakpoint
CREATE INDEX `ts_members_room_seen` ON `ts_members` (`room_code`,`last_seen`);
--> statement-breakpoint
CREATE INDEX `ts_rooms_expiry` ON `ts_rooms` (`expires_at`);
