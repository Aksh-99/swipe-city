# Startup animation loading

The old static imports pulled all twenty civilian/officer animation packs into the main game's dependency graph. Those packs total 11,093,532 gzip bytes in the current build, excluding the engine, city and GLBs.

The runtime now imports each pack on demand. The static graph includes zero animation packs; a selected character adds 107,118–648,320 gzip bytes. This avoids at least 94% of the former animation download at startup. This is a build measurement, not an end-to-end loading-time benchmark.

The local avatar begins loading immediately and startup waits for its own rig. Joining and spawning prepare the authoritative civilian/officer appearance before allowing movement. Remote characters defer model and animation requests until inside the existing 200-metre visibility range. Their meshes remain hidden while animation data is unavailable. Downloads are shared, at most two animation packs load concurrently, failed requests can retry, and late completion cannot revive destroyed entities. Previously loaded packs stay cached for later switches.

The sampler is separate from the historical hoodie convenience wrapper so that wrapper cannot accidentally pull the white male animation into the main bundle. A small bone-name manifest is validated against all original rigs. Existing gait fixtures explicitly prepare their data; separate cold-start tests verify actual deferred behavior.

Validation:
- 100 focused tests passed, including every civilian/officer walk/run/angry clip, real Cesium entity adapters, cold loading, distant-player deferral, download sharing/limits/failure recovery, room reconnects, photo jobs and a twenty-client room simulation.
- Production build passed.
- `node scripts/check-startup-budget.mjs` verifies no animation pack is in the static main-game dependency graph and prints the gzip totals.
- Browser GPU rendering and actual loading duration on users' devices remain unverified in this environment, which previously failed Cesium WebGL initialization.

The city still streams its nearby 3D tiles and collision data. Engine download, authored scenery construction and texture/GPU preparation remain costs; this change does not claim to eliminate those costs or make the whole game 94% faster.
