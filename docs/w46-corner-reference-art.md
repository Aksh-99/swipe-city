# Eagle and T-Mobile corner reconstruction

References: supplied October 18 screenshots at 7:15:18 and 7:15:31 PM, showing August 2022 Street View. These visual references guide the requested composition; they are not claims about current tenants or campaigns.

Architecture: fitted street and Broadway return facets of the original city geometry, with external billboard racks above the existing low podium roofs. Eagle has two framed fashion screen tiers, warm entrance lights and an extruded bird. T-Mobile has phone-store glass, brushed-metal panels, a magenta wrap and a black-and-white upper campaign. Original city vertices are not moved.

Built-in image generation created `public/billboards/w46-eagle-tmobile-atlas.png`; it is a reference-guided approximation of the campaigns rather than exact source photography.

## Final prompt

Use case: ads-marketing. Asset type: 2 by 2 atlas of four equally sized billboard texture cells for a real Times Square game corner. Input images are reference images of American Eagle and T-Mobile corner displays, not edit targets. Generate a clean flat orthographic texture atlas, no architecture, no perspective, no sky, no Google Maps UI. Exact 2x2 layout: TOP LEFT is American Eagle upper digital fashion advertisement: six adjacent vertical editorial photos of diverse adult models wearing blue jeans and casual shirts, blue-white and lilac studio backgrounds, natural retail photography, slim black gutters, no lettering. TOP RIGHT is American Eagle lower digital fashion advertisement: six adjacent vertical editorial images alternating close views of denim seams, blue jeans and adults wearing blue denim, pale green and blue background, slim black gutters, no lettering. BOTTOM LEFT is the T-Mobile screen: saturated fuchsia magenta #e00082, a light pink diagonal luminous beam, white T logo toward upper left, large white outlined '5G' and smaller white 'MORE 5G' centered. BOTTOM RIGHT is the tall black Pandora jewelry campaign: black-and-white fashion portrait of a blonde adult woman with jewelry in left half, black right half with white delicate 'PANDORA' logo, editorial clean luxury photography. No borders around the four cells, no extra text, no mockup frame, no watermarks. All cells aligned exactly to quadrants. Match the broad colors and composition of the supplied street references for use on separate physical billboard meshes.


## Live-game correction after the screenshot review

The supplied game screenshot identified the previously magenta corner as the intended American Eagle frontage. The two corner identities were corrected and refitted to the source planes: Eagle now occupies the return centered at approximately [8.90, 113.36] in local metres, with its 46th Street face, both fashion-screen tiers, silver bird, warm glazing, dark entry frames and lighting. T-Mobile occupies the opposite corner. This changes actual game geometry/material configuration and the landmark camera, rather than displaying a standalone generated mockup. A regression test anchors the correction to that particular source facade.
