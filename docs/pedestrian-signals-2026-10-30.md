# Pedestrian signal audit and fixes

All 122 crossings in the authoritative jaywalking map have at least one live mapped pedestrian head. The placed layout has 232 such heads. Seven additional pedestrian displays at six reference-built corners were frozen painted hands, numbers or glowing boxes; those now use the same live atlas and materials as the mapped heads. Their thirty vehicle lenses also use the shared live phase instead of permanently colored red/green meshes.

The affected authored scenes are Five48, Corner47, Rockefeller48, Sixth47 (two pedestrian displays), Two47 and Biltmore47. Their housing, mast, street-sign and collision geometry stays intact. Five48's live face metadata is reflected along with that scene's other surveyed details. Registration is deduplicated, reset at city startup and batched into two extra draws sharing the existing signal materials. There is no per-head animation loop or new downloaded artwork.

Timing now lives in a small pure `signal-cycle.js` module used by both the display phase and server jaywalking rules. The visual controller reads RoomClient's estimated server clock during multiplayer, with Date.now only before a room exists. Both live head batches receive the same uniforms. WALK is only allowed while the corresponding vehicle approach is red; countdown cells run from 15 down to 1 and then return to solid STOP. A player who entered legally during WALK is still not fined when the signal changes mid-crossing.

Mapped pedestrian and traffic materials now explicitly use the opaque pass, avoiding default translucent depth ordering on small signal faces. Pedestrian atlas samples are inset to prevent neighboring cells bleeding at their borders. Heads retain their crossing IDs so coverage and group assignments can be checked directly.

Verification:
- 28 signal/street/gameplay/traffic checks passed, including all 122 mapped crossings, all 232 mapped and 7 authored pedestrian heads, every WALK/STOP/countdown tile over multiple cycles, crossing-group consistency, real Cesium Material shared uniform updates with an injected authoritative clock, 48-car signal behavior, jaywalking entry rules and collision behavior.
- Nine reference-scene geometry and walking-clearance checks passed for the affected corners.
- Production build passed. Packaging checks retain the lazy-character startup budget.
- Final GPU appearance remains unverified here because this environment previously fails Cesium WebGL initialization. No change claims a real-device visual playtest.

## Messages and performance follow-up
- Added a phone Messages inbox for current-match photo requests, rewards, paid status, and camera shortcuts. Existing arrival pings and camera reward flow remain unchanged.
- Browser QA of the actual phone components verified request cards, scrolling container, Camera shortcut, Apps navigation, and all five home icons fitting within the phone. This isolated UI fixture was removed before packaging.
- Reduced map DOM updates to 10 Hz while visible, skipped idle aim searches, gated debug work to development, and updated brake uniforms only when state changes. Traffic count and visual quality remain unchanged.
- Inbox/performance/phone compatibility suite: 28 passing checks. Production 3D FPS and full multiplayer GPU/audio play remain unverified in this browser.
