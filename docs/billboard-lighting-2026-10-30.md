# Billboard light and Marriott reference pass

The request was brighter billboards that illuminate the city with soft light, without increased contrast. The follow-up supplied a street photo of the Marriott Marquis and a game screenshot showing oversized, perforated advertising surfaces.

Shared changes:
- Apply a bounded midtone lift to ad emission before rendering, using a common RGB gain to preserve hue and saturation. Black stays black and gain rolls off toward white. The existing images and UV placement remain unchanged outside Marriott.
- All atlas billboards and registered bespoke LED materials use the shared treatment through `addFaces`; the original generic atlas draw path applies it directly.
- Constant-alpha opaque ads explicitly use the opaque render pass. Cesium Material's default translucent pass was allowing billboard depth/order artifacts despite alpha=1 shader output. Cutout/transparent materials retain their authored alpha behavior.
- Replace the previous contrast=100 bloom with a thresholded soft glow: highlight extraction, two-axis blur and a composite that reduces added glow on already-bright artwork. The four-pass budget matches the old bloom. No global exposure, saturation or contrast increase.
- Strengthen the existing approximate colored screen bounce on paving (gain .26 to .36), broaden its across-street falloff (20 to 24 metres), and soften its saturated palette. Carry the existing computed bounce through later building facade finishes as well. No additional lights, textures or CPU light sampling are added.

Marriott:
- Use continuous opaque panels over the original street-facing wall envelope, with shared corners and arc-length UVs. Window recesses and gaps in survey triangles no longer become holes in the LED surface.
- Reference-guided bands: lower screens at 8.8–17.2m and the main display at 18–32.4m, above the existing street-level shops. These are authored proportions informed by the photo, not a new architectural survey.
- Keep the central Sabrina Carpenter/Levi's atlas. The separate silver sneaker campaign occupies the upper W45 return once; it is no longer duplicated into two stacked shoe panels.
- Use Marriott header ribbons instead of repeating the Swatch store logo across the advertising bands.
- Give the existing hotel geometry concrete wings, recessed horizontal atrium glazing and a glazed strip above the main screen. The hotel mesh, collision and street footprint remain intact.

Validation:
- 21 focused checks passed: material color/opacity, actual Cesium Material/Appearance adapters and postprocess stage construction, continuous Marriott corners and UVs, bounds, campaign preservation, facade material contracts, billboard buffers and nearby sidewalk traversability.
- Production build and startup animation-budget check are required in the packaging workflow. The previous lazy character loading is retained.
- Browser preview could reach the menu and character/lobby flow, but the environment again reported “The browser supports WebGL, but initialization failed” before the Cesium scene could initialize. GPU shader compilation and the final night-time appearance could not be visually verified here.

## Stronger light and traffic follow-up

The subsequent screenshot still looked too dim. Current tuning supersedes the initial values above:
- Billboard midtone lift: 1.0 (middle grey .5 becomes .75), with common RGB gain, unchanged black/white endpoints and a smooth highlight roll-off.
- Glow strength .52, threshold .28–.78, sigma 4.0 and blur step 1.8. This is about 2.9 times the previous glow strength, with the same four passes and protected bright artwork.
- Ground spill .72 over a 36m across-street falloff, twice the previous gain and broader/less saturated color pools. Pool accumulation has soft compression to limit clipped paving. The source filter considers a billboard's lower edge so tall, low-reaching displays can contribute. Still at most eighteen grouped sources.
- Nearby facade bounce .32 instead of .18. Night sky and global scene exposure remain unchanged.

Moving traffic increases from 24 to 48 vehicles. The shared `CITY_TRAFFIC_COUNT` is used by both the client simulation and server medical-claim validation. Starting positions are spread over mapped approaches with at least 14m between same-approach spawn slots; routing, signal stops, intersection reservations and yielding/hard stopping for players remain intact. Parked cars and pedestrian NPCs are unaffected. The seven existing small car models are reused, with the existing 230m rendering cutoff. Player positions are read once per traffic frame rather than once for each car visibility callback.

Validation: 42 focused checks passed, including a five-minute 48-car run, safe initial spacing, signals, queues, yielding/contact, vehicle solidity, new vehicle-ID validation, actual Cesium traffic visibility callbacks, lighting and Marriott rendering adapters. Production build passed; packaging also verifies the existing lazy-animation startup budget. Actual GPU appearance and FPS remain unverified due the previously observed preview WebGL initialization failure.
