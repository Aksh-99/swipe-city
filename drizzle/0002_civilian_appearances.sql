-- Preserve active player IDs, tokens, poses and leases while renaming the two
-- historical model IDs. Appearance has no gameplay-role constraint or default.
CREATE TABLE `ts_members_appearance` (
 `token_hash` text PRIMARY KEY NOT NULL,
 `player_id` text NOT NULL UNIQUE,
 `room_code` text NOT NULL REFERENCES `ts_rooms`(`code`) ON DELETE CASCADE,
 `slot` integer NOT NULL CHECK (`slot` BETWEEN 0 AND 3),
 `avatar` text NOT NULL CHECK (`avatar` IN ('explorer','tourist','pedestrian','commuter')),
 `name` text NOT NULL,
 `joined_at` integer NOT NULL,
 `last_seen` integer NOT NULL,
 `sequence` integer NOT NULL DEFAULT 0,
 `state` text NOT NULL,
 `presence_until` integer NOT NULL DEFAULT 0,
 UNIQUE (`room_code`,`slot`),
 UNIQUE (`room_code`,`avatar`)
);
--> statement-breakpoint
INSERT INTO `ts_members_appearance` (`token_hash`,`player_id`,`room_code`,`slot`,`avatar`,`name`,`joined_at`,`last_seen`,`sequence`,`state`,`presence_until`)
 SELECT `token_hash`,`player_id`,`room_code`,`slot`,
  CASE `avatar` WHEN 'officer' THEN 'pedestrian' WHEN 'courier' THEN 'commuter' ELSE `avatar` END,
  `name`,`joined_at`,`last_seen`,`sequence`,`state`,`presence_until` FROM `ts_members`;
--> statement-breakpoint
DROP TABLE `ts_members`;
--> statement-breakpoint
ALTER TABLE `ts_members_appearance` RENAME TO `ts_members`;
--> statement-breakpoint
CREATE INDEX `ts_members_room_seen` ON `ts_members` (`room_code`,`last_seen`);
