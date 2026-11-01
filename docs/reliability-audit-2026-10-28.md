# Swipe City reliability audit — 2026-10-28

This pass improves recovery for the existing desktop-browser prototype. It does not certify crash-free play or production capacity.

## Changes

- City metadata and collision downloads have bounded attempts and timeouts. Collision downloads are limited to four concurrent jobs and prioritize the player's current street.
- A failed collision download no longer permanently poisons all movement. Loaded streets remain usable; missing nearby collision still stops movement safely. Successful later downloads restore movement without a page reload.
- A failed distant visual tile no longer rejects an otherwise visible city. Essential collision remains independently enforced.
- Tree scenery loads separately from essential startup, retries temporary metadata failures, and reports missing art without stopping the match. Failed model resources are removed.
- Camera previews cannot throw out of the render callback during a zero-size resize or unavailable 2D context. Taking an actual photograph still reports an explicit failure.
- Leaving or switching rooms cancels obsolete network work and prevents an old synchronization from blocking the next room. Page-exit keepalive requests remain intact.
- Foreground reconnect membership now lasts 90 seconds instead of 25. Explicit Leave still frees the seat immediately. Hidden-tab membership remains ten minutes; match deadlines do not extend during disconnects.

## Verification

87 focused checks passed covering resource failures/retries/timeouts, bounded queues, collision recovery, animation/controller presentation, shooting, audio logic, transport, session ownership, reload, room transitions, and complete four-client rounds/rematches.

The maximum-capacity local test uses 20 real RoomClient instances through the actual HTTP server and SQLite room service. It completed 3,377 HTTP requests with zero server errors, maintained 20 distinct members and five officers/five thieves, recovered from a simulated 45-second outage with identity/role/wallet intact, resumed a saved client without duplicating its membership, and reassigned hosting after explicit host departure. This is a networking/logic simulation, not twenty rendered browser sessions or a Cloudflare/D1 capacity benchmark. Normal server-applied walking fines remain allowed during movement.

The broad baseline was 493 passing / 10 failing tests (503 total). After the initial recovery changes, the broad run was 503 passing / the same 10 failing (513 total). The final two additional recovery checks passed in the 87-check focused run. The older failures remain unreconciled: removed player.glb and former four-character asset metadata/customization checks, former waiting-room/fixed-spawn assumptions, changed billboard image formats/size assertions, and an old witness clothing description. No test was deleted or skipped to create a green result.

Preview main-menu, character selection and lobby form were inspected. The preview browser cannot initialize WebGL, so a rendered multiplayer match, GPU memory behavior, device-specific frame rates and physical speaker output remain unverified. Recent production error logs contained missing browser-icon/robots requests, not room-service crashes in the sampled window; this is not proof of client stability.

## Required real-device playtest before a wider launch

Use at least four independent desktop browsers/devices, including Safari and Chrome. Play a complete round and a rematch. Verify continuous running near streamed building boundaries, car collisions, 20-metre thief/officer shooting, death notifications, phone messages/photo rewards/audio, and both role-specific transport paths. Disconnect one device for 45 seconds and confirm it returns as the same player with the same role and wallet. Check console errors, frame rate and memory during sustained play. Do not infer this result from the local HTTP simulation.
