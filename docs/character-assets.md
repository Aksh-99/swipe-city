# Supplied Meshy character designs

The four appearances now use the user's uploaded 3D meshes and texture maps.
Existing room appearance IDs are retained so saved sessions and slot assignment
continue working. Officer Manson now has prototype police-car and dispatch permissions; civilian appearances do not identify future thief roles.

| Appearance | Stable ID | Uploaded source | Game asset |
| --- | --- | --- | --- |
| New York Explorer | `explorer` | `Meshy_AI_New_York_Explorer_1005023328_texture.glb` | `public/player.glb` |
| Woman in Blue Dress | `tourist` | `Meshy_AI_Woman_in_Blue_Dress_1005023139_texture.glb` | `public/characters/tourist.glb` |
| Officer Manson | `pedestrian` | `Meshy_AI_Officer_Mason_1005023047_texture.glb` | `public/characters/pedestrian.glb` |
| Executive | `commuter` | `Meshy_AI_Elegant_Executive_Fig_1005023428_texture.glb` | `public/characters/commuter.glb` |

Each original contained one static mesh, three 2048px JPEG texture maps and no
skeleton/animation. The authoring importer keeps the supplied geometry,
silhouette, UVs and texture artwork. It scales the whole figure uniformly to
1.79 m with feet at zero, simplifies with UV/normal error constraints to about
48,000 triangles, keeps 2048px base color, and reduces secondary maps to 1024px.
Prepared downloads are 2.99–3.63 MB each (about 13 MB combined versus 70 MB of
originals), with one skinned primitive per character. GLB extras record the
source filename/hash and simplification information. Uploaded originals are
unchanged.

A basic linear-blend skeleton connects to the existing node-driven procedural
walk/sprint pose; no additional player controller or per-frame network bones
are required. Head, torso, shoulder/elbow, hip/knee/ankle pivots share the
existing animation API. A continuous dress mesh uses restrained pelvis/thigh
weights; cloth simulation is not implemented. These automatically assigned
weights are a prototype rig, not professionally authored mocap animation, and
should be reviewed in the live game at the shoulder, skirt and knee joints.
Neutral poses have hands resting against hips/clothing. Surface-distance
weights and separated animation boundaries keep those areas from producing
long stretched strips when the hands move. Small seam/cloth artifacts may
remain; production rigging and cloth simulation are later work.

![Prepared models, offline asset preview](meshy-character-preview.png)

This is an offline preview of the actual prepared assets, not a game screenshot.

The existing billboard/night shader uses the imported surface/normal maps.
Normal play preserves the original outfit colors and hides floating player
numbers. Development mode (`?dev=1`) retains 18% red/blue/green/yellow tints
and Player 1–4 labels for networking checks. Descriptions for witness reports
come from these visible outfits, with no secret-role information.
The lobby, server IDs, spawns, smoothing, camera and collision capsule are
unchanged. Officer Manson is the police character for car travel and 911 dispatch; the original asset geometry and textures are unchanged.

## Authoring

The generated game GLBs are committed and require no authoring tools to play
or build the Site. To re-import the original files:

```sh
npm ci
python3 -m pip install numpy scipy Pillow
node scripts/import-meshy-characters.mjs /absolute/path/to/originals
```

This invokes `scripts/character-textures.py` for texture preparation and surface
distance weights only during authoring. The older
`scripts/player-model.mjs` generates superseded procedural characters and
should not be used to regenerate the current supplied designs.

Tests load the skinned GLBs with the real glTF loader, check foot datum/scale,
self-contained texture payloads, inverse bind matrices, normalized weights,
and deformation under the actual walking/sprinting pose, including severe edge
stretching during sprinting. The real Cesium custom-shader pipeline and existing
four-client controller tests are also covered.
Offline asset pose inspection supplements these checks. Browser/WebGL visual
appearance and frame rate remain unverified because the cloud preview URL was
blocked in this session.
