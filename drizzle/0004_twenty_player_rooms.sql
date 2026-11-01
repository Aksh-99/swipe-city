-- Preserve existing sessions while widening slots and allowing shared uniforms.
CREATE TABLE `ts_members_twenty` (
 `token_hash` text PRIMARY KEY NOT NULL,
 `player_id` text NOT NULL UNIQUE,
 `room_code` text NOT NULL REFERENCES `ts_rooms`(`code`) ON DELETE CASCADE,
 `slot` integer NOT NULL CHECK (`slot` BETWEEN 0 AND 19),
 `avatar` text NOT NULL CHECK (`avatar` IN ('explorer','tourist','pedestrian','commuter')),
 `name` text NOT NULL,
 `joined_at` integer NOT NULL,
 `last_seen` integer NOT NULL,
 `sequence` integer NOT NULL DEFAULT 0,
 `state` text NOT NULL,
 `presence_until` integer NOT NULL DEFAULT 0,
 `ready` integer NOT NULL DEFAULT 0 CHECK (`ready` IN (0,1)),
 `state_revision` integer NOT NULL DEFAULT 0,
 `pose_at` integer NOT NULL DEFAULT 0,
 `movement_credit` real NOT NULL DEFAULT 1.5,
 UNIQUE (`room_code`,`slot`)
);
--> statement-breakpoint
INSERT INTO `ts_members_twenty` SELECT * FROM `ts_members`;
--> statement-breakpoint
DROP TABLE `ts_members`;
--> statement-breakpoint
ALTER TABLE `ts_members_twenty` RENAME TO `ts_members`;
--> statement-breakpoint
CREATE INDEX `ts_members_room_seen` ON `ts_members` (`room_code`,`last_seen`);
