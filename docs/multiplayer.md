# Four-player Times Square prototype

Create/join lobby → waiting room → four ready players → host starts → four
separate spawn points in the existing Times Square world.

Before joining, your selected appearance is visible and solo walking/sprinting/jumping
is available. While waiting, all joined characters are visible at their
separate server-assigned spawn points; room movement remains locked until
START MATCH. Leaving restores solo exploration. Avatar visibility is
independent of match movement permission (apart from hiding the local model
when the collision-aware camera retracts into it).

Each match lasts **10 minutes**. Every phone, including Officer Manson's
dispatch screen and the 911 call screen, shows the same countdown from 10:00.
The server records the start when the host presses START MATCH. The client
uses its corrected server clock, so backgrounding, reloading, reconnecting or
pressing START again does not reset the timer. The final minute turns red.
At 0:00 the phone shows "Time's up", movement and vehicle/911/reset actions
stop, and the remaining clients stay connected with their characters visible.
All players see the same win result. The thief wins at zero only after stealing
$1,000 and remaining free; otherwise police win. An earlier correct arrest
also gives police the win. The host can press REMATCH to reopen the same-code
lobby, then START MATCH at 4/4 for a fresh round. Solo exploration is untimed.

The city, arrow/WASD controller, Shift sprint, mouse orbit,
scroll distance, gravity and building/furniture collision are retained.
Press **Space** to jump (also while walking/sprinting); release before the next
jump. Jump height and the blended airborne pose synchronize with remote
players through the same snapshots. Curbs/stairs provide grounded landings,
and a ceiling collision cancels ascent. No camera data is synchronized.
The playable perimeter follows West 42nd–49th Streets and Sixth–Eighth Avenue,
including their roads/sidewalks. Invisible walls apply to walks, sprints and
jumps. The phone shows that full fixed area. The server corrects outside moves,
recovers older outside saves to their assigned spawn and permits only in-area
vehicle doors/exits. Seven buses and thirteen police vehicles form the active
loops; other existing vehicles remain scenery.
The camera follows only the local player. Player 1 is red, 2 blue, 3 green
and 4 yellow in development mode (`?dev=1`), with temporary labels above the
supplied Meshy models and a subtle tint. Normal play shows the original
outfits and no floating player numbers, so an officer uses a witness's
appearance description to find the person. See
[character asset details](character-assets.md) for the four designs and basic rig.

## 1. Networking architecture

The existing CesiumJS/Vite client uses same-origin HTTP snapshots at up to
10 Hz. Remote positions, heading and gait interpolate with a 150 ms buffer.
Cameras never enter the network protocol. No framework or new networking
dependency was introduced.

Hosted rooms run in the existing Cloudflare Worker with shared D1 storage.
Local rooms run the **same room handler and SQL migrations** in Node.js with
built-in SQLite, behind Vite's `/api` proxy. Four browsers/devices share one
server/database rather than browser-local storage.

The server assigns UUIDs, stable player slots/numbers, host, room membership,
spawn points and pose revisions. A transaction starts a match only when all
four unexpired members are ready. The host transfers to the oldest remaining
member after leaving/expiry. A pedestrian departure lets play continue and a
replacement can claim its free slot and server spawn. If the officer or thief
leaves/expires, the round ends without a winner and the host can open a rematch.

Each client receives its own private connection token. The database stores
only its hash; public snapshots omit tokens and other players' secret roles. A client
can update only the membership bound to that token. Duplicate authenticated
joins resume the same member. Browser tab ownership checks keep copied tabs
from controlling the original player. A fifth player is refused.

A reload retains its saved token and tab ownership during temporary network or
server failures, then uses the existing backoff sync loop to authenticate the
same member. Character/spawn preparation runs before movement unlocks. This
preserves server-owned roles, money and the deadline within the normal lease;
it never adds another slot to an already full room. A genuinely expired member
uses the existing rejoin behavior. An unavailable room clears the stale session
and shows instructions to create another lobby or enter another code. A copied
tab cannot reuse the original token even when its own fresh join is offline.

Movement requires the current match ID and server pose revision. Finite values,
geographic bounds, allowed speed, monotonic sequence and a distance budget
reject malformed/implausible updates. Repeated packets cannot repeatedly spend
the timing allowance. Rejected movement restores the owner's last accepted
pose; stale packets cannot overwrite a new spawn. Collisions are still local;
this is a clean foundation for later server-authoritative game rules, not a
competitive anti-cheat implementation.

Vehicle-door transport uses the same private member token. Officer Manson
alone receives police-car access; the other three characters use buses.
The server derives access from the assigned character, validates door proximity and a
plausible last approach, and selects the next vehicle plus a separated exit
according to the server slot. Transport increments the pose revision and
sequence; stale departure updates and duplicate requests cannot overwrite it.
Only the owner prepares its controller/camera; remotes snap on revision changes.
The permission and cooldown are private server metadata in the existing JSON
state column and never come from client-supplied movement fields.

## 2. Source files

| File | Responsibility |
| --- | --- |
| `server/rooms.js` | Lobby, host/start authorization, readiness, membership, poses, reconnect/leave/respawn |
| `server/match-rules.js` | Four fixed spawn points and movement sanity budget |
| `src/match-time.js`, `src/phone-controls.js` | Shared 10-minute deadline, phone countdown and match expiry |
| `src/play-area.js`, `public/data/play-area.json`, `scripts/prepare-play-area.mjs` | Shared street-fitted perimeter, invisible capsule boundary and server movement limits |
| `src/minimap-layout.js`, `src/minimap.js` | Fixed whole-area phone view and clipped street map with live player marker |
| `server/transport.js`, `src/transport-rules.js`, `src/transport-config.js` | Character-bound car/bus permission, validated entry and canonical next-vehicle routes |
| `server/dispatch.js`, `src/dispatch-rules.js`, `src/phone-controls.js`, `src/minimap.js` | Private sightings/reports, officer dispatch cards and flashing last-seen locations |
| `src/witness-selection.js`, `src/report-location.js`, `public/data/report-streets.json` | Camera sightline/proximity selection and real street names for fixed last-seen points |
| `src/transport-controller.js`, `src/player-transport.js`, `src/transport-ui.js` | Door approach/E interaction, streamed safe arrivals, independent cameras and prompts |
| `public/data/transport-portals.json`, `scripts/prepare-transport-portals.mjs` | Collision-checked door positions and four safe exits per vehicle |
| `server/local.mjs` | Local HTTP API and LAN startup instructions |
| `server/sqlite-store.mjs` | Persistent local SQLite adapter and automatic migrations |
| `drizzle/0003_lobby_match.sql`, `drizzle/meta/_journal.json` | Lobby/match/readiness/revision fields |
| `src/room-client.js` | Connection lifecycle, waiting/start/spawn gating and owner-only synchronization |
| `src/room-panel.js` | Create/join, waiting roster, counts and host Start Match |
| `src/multiplayer-debug.js` | Development connection/room/player/count/HTTP RTT panel and debug colors |
| `src/avatar.js`, `src/main.js`, `src/style.css` | Temporary labels/tints and match integration with the existing scene/controller |
| `vite.config.js`, `package.json`, `.gitignore` | Local API proxy, server command and ignored runtime database |
| `scripts/check-hosted-rooms.mjs` | Hosted lobby/start/movement/reconnect/leave service probe |
| `tests/lobby-match.test.js`, `tests/multiplayer-e2e.test.js` | Authority/race checks and four clients over real HTTP with actual controllers, colliders, Cesium avatars and independent cameras |
| `tests/rooms.test.js`, `tests/room-client.test.js`, `tests/avatar.test.js`, `tests/d1-test-helper.js` | Existing multiplayer regressions updated for the waiting/start flow |

## 3. Start the multiplayer server

Use **Node.js 24.12 or newer**; the local server uses `node:sqlite`.
From the `times-square` checkout:

```sh
npm ci
npm run server
```

The API listens on `0.0.0.0:8787`. Its database is `.local/rooms.sqlite` and is
created/migrated automatically. Keep this terminal open. The server prints
the client URLs, including LAN addresses when the operating system permits
interface enumeration. `MP_PORT` and `MP_DATABASE` can override the defaults.

## 4. Start the client

In a second terminal in the same checkout:

```sh
npm run dev
```

Open `http://localhost:5173/?dev=1`. Vite proxies `/api` to port 8787 while
serving the existing city and Cesium assets. Port 5173 is fixed so all testers
use the same origin. `MP_API_URL` can override the API proxy destination.

The extra multiplayer debug panel appears in development, or with `?dev=1`
on the hosted build. Its Ping is the HTTP request round trip, including server
processing. Existing coordinates/FPS/tile/collision statistics are retained.

## 5. Test four browser windows locally

1. Keep both terminals running. Open **four separate windows** at
   `http://localhost:5173/?dev=1` (use the same hostname in all windows).
2. In A, enter a name and press **Create lobby**. Note the six-character code.
   It shows **Players: 1/4** and **Waiting room**; movement is paused.
3. In B, C and D, enter names and that code, then press **Join**. A's count
   advances through **2/4**, **3/4** and **4/4**. Wait for every client to load.
4. In A, press **START MATCH**. Guests cannot start. All four spawn three
   metres apart near the original Times Square origin with Player 1–4 labels.
5. Click/drag the scene and use arrows/WASD, Shift, mouse orbit and scroll.
   In A walk north; in C walk across the street. Check that each other window
   sees the corresponding colored player move, while its own player/camera
   stays under that window's controls. Leave the windows visible side by side
   if you want to observe movement simultaneously.
6. Use **Leave room** in D. The remaining clients show **3/4**, remove D's
   avatar and continue moving. Rejoin D using the code to refill the free slot.
7. Reload B: it resumes the same membership/position when the lease and tab
   ownership allow it. Open a fifth client: it gets a room-full message.
8. **Reset to Times Square** resets only your own player using its server spawn.
   Landmark teleport shortcuts are disabled inside a match; leave the room to
   use those existing city-development tools.
9. In a fresh room, choose the civilian characters for A/B/D and **Officer
   Manson** for C before joining. Access is assigned automatically. After starting, approach a bus door in A: walk toward
   it or press E to arrive beside the next numbered bus. The other clients see
   A's new position when nearby. C can travel through NYPD doors, including the
   station cars, and gets a restriction message at buses. Check the opposite
   restriction for A, and that each camera continues to follow only its owner.
   Use solo landmark visits to preview and find the door numbers first.
10. In A/B/D, press Esc and click **Call 911**. Each call should appear as a
    flashing red location on C's **NYPD DISPATCH** map, with an alert count and
    Player label. Move the callers apart first to see distinct map locations.
    Walk away after calling: the report stays where it was made. End call
    returns to the civilian map. Reload C and check that unexpired calls return.
    Leaving a caller's room removes that alert. Calls expire after two minutes;
    repeat calls are limited to once per ten seconds.

Open fresh windows or follow the invite link. Duplicating an already joined
tab is also supported; the duplicate claims a new slot, never the original
player's private session.

## 6. Test four computers/phones on the same network

Run the server and Vite **only on one computer**. On all four devices open
`http://SERVER-LAN-IP:5173/?dev=1`, using the server computer's Wi-Fi/Ethernet
IPv4 address (for example, `http://192.168.1.25:5173/?dev=1`). Use that LAN URL
on the server computer too, so invite links point to an address others can reach.
The server prints the appropriate address when available. Allow inbound TCP
5173 in the host firewall if needed; keep devices on the same network and avoid
guest Wi-Fi client isolation. All room traffic uses the Vite same-origin proxy.

Repeat steps 2–8 above. On plain LAN HTTP, mouse pointer lock/clipboard or Web
Locks may be unavailable; drag orbit and manual room codes work. Without Web
Locks, copied credentials are discarded conservatively and a fresh slot is
requested. Computers keep the existing keyboard/mouse controls. Phones can
join/watch and need an external keyboard to walk; touch movement controls are
outside this task. WebGL2 is required on every playing device.

## 7. Verification and limitations

```sh
npm test
npm run build
```

The automated HTTP end-to-end test creates four independent clients, advances
the real controller against the full existing city/furniture collision layer,
checks all remote Cesium entity positions and labels, isolates cameras, and
tests leave, reload, replacement, full rooms and owner-only reset. Other tests
cover host/readiness gating, invalid movement, stale spawn packets, copied
sessions, background suspension and migration of existing rooms.
The same HTTP test now includes a real-controller bus door entry, simultaneous
mixed bus/police arrivals, all four clients observing the new poses, separated
exits and independent camera orbit/zoom. Vehicle collision tests check every
door in both walking/running and all 96 grounded, walkable arrival slots.

The cloud browser's URL policy blocked the internal preview during this task.
**A four-window visual/WebGL playtest has not been certified here.** The HTTP
end-to-end and rendering-object tests are separate evidence; use the exact
window/device steps above to complete that visual acceptance check.

- Leaving removes a member immediately. An abrupt foreground disconnect is
  detected after the 25-second lease/grace; the remote pose freezes meanwhile.
  Background tabs remain idle and retain membership for up to ten minutes so
  switching among four windows does not make players disappear. A successfully
  delivered close notification shortens that to the normal grace period.
- Rooms expire after four hours. A match starts with exactly four players.
  Pedestrian departures can be replaced in a free spawn slot; officer/thief
  departures end the round without a winner.
- Remote avatars render within 200 m. Development labels render within 85 m;
  normal play hides numbers/tints for description-based witness reporting.
- Local collisions are retained. Player-to-player collision, server-side
  geometry simulation and competitive anti-cheat are not implemented.
- The hosted Site's viewer access policy is unchanged; room codes do not grant
  Site access. LAN development testing does not require Site viewer invitations.
- Parked vehicles, restricted door transport, secret roles, stationary NPCs,
  pickpocketing, money, witness reports, arrests, shared win results and rematches
  are implemented. Driving, interiors, voice chat and NPC pathfinding are absent.
  The supplied Meshy appearances remain unchanged.

## Ten-minute round prototype

Create a lobby and join with four separate tabs/windows or authorized devices.
Choose the existing appearances; the unique-appearance lobby guarantees one
Officer Manson. At 4/4 ready players, the host presses **START MATCH**.

The room server keeps Manson as `POLICE`, randomly assigns one civilian `THIEF`,
and assigns the other two `PEDESTRIAN`. Each authenticated client receives only
its own role. The 10-minute deadline is shared and cannot restart on reload.

- **Thief:** Approach another connected human player assigned PEDESTRIAN. Hold **E** for 2.4 seconds while
  standing within 2.2 metres. Releasing, moving, jumping, losing proximity,
  hiding the tab, resetting, or losing the hold heartbeat interrupts it.
  Each human pedestrian starts with a private $1,000 wallet. A successful hold
  transfers a server-chosen $100–$250, capped at the victim's remaining balance.
  Repeated holds can target either pedestrian until their wallet is empty.
  A moving/disconnected victim interrupts the hold without a deduction.
  NPCs, the officer, self and foreign/disconnected players cannot be targets.
  The thief has no reporting UI, R report action or 911 access; the server also
  refuses forged observe/report requests from the thief.
  The private money counter must reach $1,000. The thief must also remain free
  until 0:00; reaching the goal alone does not finish the round.
- **Witness:** Look at a nearby human player, press **R**, review the appearance
  and optional **Suspected pickpocketing** claim, then press **Call 911**.
  A visibly reaching player suggests that claim; the witness can change it.
  The server never verifies a report against the hidden role. Dispatch receives
  the appearance, caller, nearby street, sighting/report ages, and a fixed point.
  No theft automatically creates an alert, icon, sound, or tracking marker.
  Human pedestrians see their own wallet balance on the phone and HUD, with a
  private deduction notice after theft. This includes no thief identifier or
  location. Other clients do not receive the victim's wallet or deduction.
  When a report leads to a completed innocent arrest, that witness loses $100
  (capped at their balance) and cannot move for 10 seconds. Camera and phone
  remain available. The server records recent calls privately and resolves each
  one once; no penalty or correctness indication is sent at report time. Reports
  must predate the arrest start and be less than two minutes old at that point.
  Cancelled holds, unrelated/expired reports, and repeated arrest completion
  requests cannot fine that report again. Reloading retains fines and lock expiry.
- **Officer:** Look at a human player within 2.2 metres and hold **E** for 2 seconds.
  The server checks the target's secret role only after the hold completes.
  A thief arrest ends the round with **POLICE WIN**. An innocent arrest causes a
  private write-up and a server-enforced 10-second movement/arrest lock;
  the innocent remains free and the round continues.
  Jump, reset and car transport cannot bypass the write-up. Camera orbit and
  dispatch remain usable, and other players remain free to move.
- At 0:00 the thief wins if the money target was met and they were not arrested.
  Otherwise police win. All clients show the same result and stop moving.
- At a completed round, the highest civilian balance before bonuses wins
  **Richest Player: +$250**. Each tied player receives $250. Thief earnings count
  toward wealth. Each human pedestrian with a recent report captured at the
  successful thief arrest earns **Police Assist: +$250**; repeated reports cannot
  multiply this bonus. Bonuses stack and the results screen names the winners
  and shows your bonus and final balance. Wallets get credited once; thief bonus
  money stays separate from the $1,000 theft objective. An aborted round pays
  nothing. Rewards are for this round only and reset on rematch.
- The host presses **REMATCH** to reopen the same-code lobby. At 4/4 ready players,
  **START MATCH** starts a fresh 10-minute round with a new secret assignment,
  separate spawns, restored human wallets, zero stolen money, and cleared holds/reports.

WASD/arrows, sprint, jump, orbit, zoom, geometry collision, the phone map, and
Manson-only NYPD car access retain their existing behavior. **E** uses an available
pickpocket/arrest target first and retains vehicle-door entry otherwise.
The on-screen **Hold** button also supports a held pointer/touch action.

### Authority and storage

`server/round.js` stores the private round document in the existing D1 room
`anchor_state`, with compare-and-set updates across Worker isolates. No schema
migration or new dependency is needed. Role IDs, payouts, loot ledger, action
start/completion, wallet balances, money transfers, write-up expiry, result, and rematch generation are server-owned.
`server/round-rewards.js` keeps accepted-report history, adjudication, witness
locks and awards separate from controller/rendering code. Fines and rewards
use the same room-document compare-and-set write as the arrest or round end.
The movement, jump/pose, reset, transport and reporting writes also check the
current lock in SQL, so another Worker cannot bypass a freshly issued fine.
Clients send selected target IDs and hold intent, not awards or role declarations.
Movement continues through the existing bounded/sanity-checked pose protocol.
Accepted nearby poses and matching action heartbeats are rechecked at completion;
actor/target sequence guards prevent awarding against an obsolete pose read.

Snapshots explicitly project each client's own `yourRound`, shared `roundResult`,
and remote **physical reach/arrest pose**. They never project another player's
role, money, wallet balance, victim ID, or private feedback. Dispatch remains an
unverified witness description; it does not identify the thief.

The ambient NPCs use the existing human assets, an idle pose, and solid body colliders.
They are stationary scenery with no pickpocket action. Their positions are checked
against real city, sidewalk, plaza, and furniture geometry by
`node scripts/prepare-npcs.mjs`. Only nearby visible NPCs render (70-metre range).

### Four-window test

1. Start `npm run server` and `npm run dev` in separate terminals; open
   `http://localhost:5173/` in four separate windows.
2. Create in A, join the six-character code in B/C/D, wait for 4/4, then start.
   All clients should see a private role card and the same countdown.
3. Let the thief hold E beside a human pedestrian. A witness should see the subtle
   reaching motion, while Manson receives no automatic notification. Check that
   the victim's private wallet drops by exactly the amount the thief receives.
   NPCs should never offer a theft action, and the thief should have no report controls.
4. Witness the thief, press R, mark suspected pickpocketing, and call 911.
   Move the thief away; Manson's red last-seen point must stay fixed.
5. Have Manson arrest an innocent. Check the 10-second write-up countdown: walk,
   sprint, jump, reset and transport must be locked while other players can move.
   Orbit the camera and read dispatch during the lock. After it expires, arrest
   the thief; all windows should show POLICE WIN.
   First have a pedestrian report that innocent. Verify only the reporter loses
   $100 and freezes alongside the officer. Have a witness then report the thief
   before the correct arrest; the results must show their $250 assist award,
   the richest-player award, and bonuses credited exactly once.
6. Host presses REMATCH, then START MATCH at 4/4. Check fresh money and $1,000 wallets,
   cleared alerts, new private roles, and a new 10:00 timer in the same room.
7. In another round, reach $1,000 and remain free until zero. All windows should
   show THIEF WINS. Reload the thief before zero to confirm money/role persistence.
   Repeat with the connection briefly offline, then restore it within the normal
   reconnect grace: the same player, role and money should return, with 4/4 intact.

For LAN devices use `http://<server-LAN-IP>:5173/` on each device, with the server
and client bound to their existing `0.0.0.0` defaults. The hosted site retains its
existing access settings, so each hosted device needs permission to open it.

Automated coverage includes the actual Node HTTP room service, four independent
controllers/cameras and Cesium avatar adapters, real collision geometry, human
wallet transfers, NPC target rejection, reaching poses, reports, write-ups, both arrest outcomes, reload,
rematch, and timeout escape. It does not certify a WebGL/browser visual playtest.

Current limits: stationary NPCs, polling rather than sockets, no NPC pathfinding,
no arrest prison scene, and client-side city collision/aim checks alongside
server proximity/time/pose sanity checks. This is not competitive anti-cheat.
If the officer or thief leaves/expires, the server ends the round without a winner
and the remaining host can open a rematch; a civilian departure leaves play running.
Reports keep the existing two-minute lifetime/one current report per caller.
