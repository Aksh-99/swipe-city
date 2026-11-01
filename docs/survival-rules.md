# Survival round

- 4–20 players, ten minutes. Each four players adds one thief and one officer: 4–7 = 1 each, 8–11 = 2 each, 12–15 = 3 each, 16–19 = 4 each, 20 = 5 each. Remaining players are pedestrians. Roles are fixed when the host starts; reconnecting players retain their roles.
- Every player starts each new round with $500, including the officer.
- The thief team wins if at least one thief stays free until the timer expires; police win when all thieves are caught or eliminated. There is no money target.
- Aim at a living player within 12 metres and press E to shoot. One shot per second; no automatic fire. Officers aim and press F to shoot; hold E nearby to arrest. An officer shot catches a thief. Shooting an innocent costs that officer $100 and locks only their movement for 30 seconds.
- A victim with at least $100 before the hit loses $100 to the thief and up to $100 more for surgery. Wallets stop at $0.
- A victim with less than $100 before the hit dies. A fatal hit does not create money for the thief. Exactly $100 survives that hit at $0; a later shot is fatal.
- Every player receives a named notification when anyone dies. Dead players receive a persistent red notice and cannot move, act, report, travel or respawn until the next round. Rejoining does not revive them.
- Existing penalties remain: $40 jaywalking, $200 car medical bill, $120 false report. Officer exemptions and the ten-second wrongful-arrest lock remain.
- Existing pedestrian photo jobs and end-of-round bonuses remain; dead or caught players receive no bonuses.
- The uploaded gunshot plays for each client once per accepted shot. Gain is 1 / (1 + (distance / 110m)^2), silent beyond 600m, updated as the listener moves. At 80m gain is about 0.65; at 240m about 0.17.
- The car-hit male/female voices and angry animations remain available in solo, lobby and match.

## Officer map and travel

The officer phone opens directly to the regular Times Square map. The app grid, MTA, camera and calling screens are unavailable in officer mode. Report markers remain on the map.

Every playable NYPD car is marked. Standing within 4 metres of a car's side door (at street level) enables travel. Press E to open the map, then tap another NYPD car marker or choose it from the destination list and press Travel. Police travel is direct to the selected car; pedestrians keep the bus loop. The server checks the officer's role, accepted position, movement lock and cooldown, and only accepts a different usable NYPD car as the destination.

### Host timer and collision update
- The host chooses a whole number of minutes (1–60, default 10) before starting. The server persists this round's duration and rejects non-host or invalid settings. Repeated start requests and reconnects cannot change the deadline. Movement, police travel, reports and survival settlement use this same deadline.
- During a match the room panel becomes only a Leave game button. Role introductions, feedback and death notices share a central notification stack outside the phone. Photo messages use iPhone banners inside the phone. Duplicate wallet banners are removed. Compact screens temporarily hide side panels while a central notice is visible.
- Officers can press F / Shoot without a target to fire an audible miss. Only accepted server shots broadcast audio, using the existing cooldown and distance attenuation. Misses cause no wallet or damage change. Fresh shots wait for audio readiness instead of being permanently skipped before decode/unlock.
- All parked and moving car bodies block the player capsule. Traffic stops on contact from any side, including while turning, and resumes only after people clear the vehicle.

### Sound activation
The home page now creates one shared sound context before the Play gesture; gameplay reuses it for gunshots and car-hit voices. The top-right sound control can explicitly enable/mute audio or play the actual gunshot clip as a test without a match. File loading failures appear in its status. Touch/click/key gestures and returning to a visible tab can resume interrupted audio. Fresh gunshots tolerate up to five seconds of network/decode delay while old shot IDs remain deduplicated.

### Direct media compatibility
Gunshots and crash voices use preloaded, gesture-primed native audio elements with lossless PCM WAV copies of the supplied clips. This avoids relying on a running Web Audio context to reach the device. Distance gain, shot deduplication, voice replacement and mute still apply. Test sound starts native playback synchronously from the click and exposes the browser's own audio player. The Web Audio implementation remains a fallback for hosts without native Audio support.

### iPhone message restoration
Photo-request messages again appear as iPhone notification banners inside the phone; other game popups remain central. The supplied iphone.mov audio is preserved as decoded PCM in /audio/iphone-message.wav and plays once per displayed new message. Arrivals queue rather than overwrite each other. Each new photo job receives a server-assigned integer reward from $20 through $90 inclusive, saved with the job and shown in requests, task details and receipts. Completion pays that saved amount once, ignoring client-supplied reward values. Existing saved jobs without a reward retain their original $30 payment. Start a new round for newly randomized jobs.

### Scattered match starts
At host start the server saves a fresh randomized spawn for every nonofficer, using 498 validated sidewalk points within the current playable boundary. Players start at least 40 metres apart (60 metres where available), and outside the station's reserved 35-metre area. Up to five officers start in separate slots directly in front of the Times Square NYPD station, facing the recruiting station/US flag. Repeated start requests, reconnects, reset and boundary recovery preserve the saved match spawn. Waiting-room spawns stay unchanged. A new round creates a new distribution. Regenerate scenery-aware points with node scripts/generate-match-spawns.mjs after changing collision geometry.

### Debt, moving-car impacts and running corrections
Wallets and UI amounts are signed. Full fines and surgery costs can take the balance below zero; rewards add normally to that balance. For example $0 minus a $40 jaywalking fine is -$40, then a $50 photo earns a balance of $10. The rule that a victim shot with less than $100 dies still applies.
Parked vehicles and stopped traffic remain solid but cause no medical bill, voice or angry animation. Only a moving traffic impact triggers those effects. A short record of pre-impact motion preserves a genuine impact when traffic immediately stops for the person; medical requests must identify a traffic car with positive impact speed.
Small server position corrections now reconcile physics without resetting the runner, clearing held movement or resetting the chase camera; presentation eases to the accepted position. Large corrections, real spawns and transport still use full placement and collision checks. Server movement limits are unchanged.
The camera app uses a fixed bottom action row for its shutter, a scrolling photo-job list and a flexible viewfinder. Duplicate message history no longer pushes capture controls below the phone screen.
Nearby clients also play crash speech from accepted player carHitAt events, using the impacted player's design to select the female/male clip. Local speech is excluded from the remote listener to avoid echoes. Distant, stale and repeated events are skipped. Message pings remain private to their recipient; gunshots are broadcast to all clients with existing distance-based volume, including officer shots.

### Zoomed aim and square photos
A toggles a zoomed first-person circular scope for officers and thieves; A again or Escape exits. Arrow movement remains available. The on-screen Aim button has the same action. Eye-level camera position and 34-degree field of view ease in and out while preserving normal orbit and camera distance. Own avatar is hidden in scoped view. The permanent plus is removed. While scoped, the selected living player is ringed, and the prompt shows E for thief shooting or F for officers. Weapon targeting uses a tighter visible aim cone, with the existing 12-metre server range and role rules unchanged.
The phone camera has a square live grid and exports a centered 512×512 PNG using the exact same crop as its preview. Photo completion text uses the actual assigned reward. Every new queued photo-request message plays the uploaded iPhone ping once; polling an existing message does not replay it.
