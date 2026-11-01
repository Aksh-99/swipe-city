# 199 W 47th Street · TSX / Tempo / Palace

Reference reconstruction of the southeast Seventh Avenue / W47 corner, opposite Hershey’s. Uses the four supplied screenshots (9:38:41, 9:38:58, 9:39:28 and 9:39:42 PM). Geography verified against the architect and developer pages:
- https://www.perkinseastman.com/projects/tsx-broadway/
- https://www.llgroup.com/portfolio/tsx-broadway/

Original NYC3D building positions, footprint and setbacks are retained. `prepare-tsx47.mjs` surveys source wall planes and extracts clipped source-triangle cladding. The LED assembly is a separate supported sign structure with a visible stage portal. Ground details include Tempo and Palace signage, marquee/ticket cases, reflective storefront glazing, green subway globe posts and visible entrance treads, Sabrett carts and opposite halal stall, photo menus, silver branched scaffolding, signal mast/cable coil and signs, valet signs, bins, cones, rails, bicycle and taxi minivans.

The campaigns are newly recreated imagery rather than exact original campaign assets. The game button toggles the coral Refreshers and emerald Genshin campaigns seen at different moments in the reference. The anime and Lost Boys displays remain separate. Photographic people, moving traffic, exact reflection content and transient street positions are interpreted rather than duplicated pixel for pixel. The subway mouth is scenic; this change adds no subway transport mechanic. Live browser visual QA is unavailable in this environment; source-plane, collision-route and real Cesium initialization checks cover geometry and setup.

## Billboard flow correction

Replaced the independently textured survey facets with one continuous rounded LED assembly. The visible display uses shared corner vertices, outward-facing winding and one arc-length UV range over a 24-segment corner. It sits on a shallow sign envelope outside the retained building footprint; it does not move the building. A new two-strip panoramic campaign atlas matches the display proportions. LED exposure is 0.87, matching the existing Hershey's screen treatment; neighboring recreated screens are restrained to 0.82. The earlier open black stage portal and duplicate custom traffic mast were removed; the existing mapped signal is reused. A geometry-only software projection was inspected to verify continuity, color preservation and reading direction. This is not a live Cesium browser screenshot.
