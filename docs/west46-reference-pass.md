# West 46th Street reference pass

Uses the seven supplied October 18 screenshots (6:09:41–6:10:59 PM). Maison / modern entrance / Picnic / Paramount Hotel are on the corrected south side; construction and the Imperial / Richard Rodgers theatre approach are opposite on the north side. Paramount Hotel here is distinct from the Paramount office building at Broadway and 45th.

Original NYC survey mesh is preserved. The new material shader covers street walls, upper floors, recesses, and returns without a height cap; the survey roof geometry sets actual heights. Source-fitted detail panels are derived by prepare-west46.mjs. Open construction sheds are separately aligned to the sidewalk because the survey's surviving construction-site walls are recessed. All new detail geometry uses local metres, with collision on structural elements and sidewalk clearance checks.

Reference details: silver restaurant columns and glazing, food photo menus, closed red/navy umbrellas, charcoal shrub planters, suspended metal entrance canopy, orange Picnic and coffee signage, yellow furniture, hotel arch mouldings and relief ornaments, projecting blue hotel sign, projecting theatre signs and canopy, steel scaffold braces, tube lights, hoarding, and orange/white barriers. Existing restaurant/menu photos are reused from the project's bundled assets.

Extent: Eighth Avenue east through the photographed block approach to Broadway. Addresses and appearance beyond the provided views are not independently surveyed. No claim of pixel-exact reconstruction: live WebGL browser QA was unavailable in this environment. Node checks cover source attachment, source material coverage, walking, side assignments and real Cesium initialization.


## October 18 side correction

The initial reading of screenshot camera orientation assigned the two street sides in reverse. After the supplied 6:48–6:49 PM references and user correction, all four hospitality frontages were refitted onto source triangles across the street. The shader's material side, full-height finishes, physical details, lighting, construction shed, theatre identifiers and visit directions were corrected together. Original city mesh positions are unchanged. An additional test checks the actual emitted textured faces and signs against the street centerline, plus readable UV orientation and view directions.

## Continuation and scenic parking

The 7:10–7:11 PM references extend the frontage sequence through Scientology, Bond 45 / Hotel Edison, Lunt-Fontanne, Richard Rodgers, Marquis Theatre, Marriott entrance, American Eagle and T-Mobile. Boundaries were refitted along the same source block so each entrance has its own frontage, with no extra building mass. Original Maison / Platinum / Picnic ordering and corrected side assignments are retained.

Added 26 stationary civilian vehicles: dark, burgundy and silver sedans/SUVs on one curb and yellow taxis on the opposite curb. Vehicle bodies use detailed wheel, glazing, handle, grille and bumper geometry derived from the existing vehicle construction, with all NYPD markings, light bars and transport interaction excluded. Preparation rejects sidewalk footprints, original walls, existing buses/patrols and authored facade furniture. Tests check source fit, side assignments, clear street-center and sidewalk walking, visit positions and solid car collisions. Live WebGL visual verification remains unavailable.
