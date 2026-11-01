"""Authoring helper: preserve Meshy textures and sample the night-shader surface.

Reads/writes JSON on stdin/stdout. Requires Python 3, numpy, scipy and Pillow; these
are not runtime/client dependencies. Uploaded source files are never modified.
"""
import base64
import io
import json
import sys

import numpy as np
from PIL import Image
from scipy.sparse import csr_matrix
from scipy.sparse.csgraph import dijkstra
from scipy.spatial import cKDTree

request = json.load(sys.stdin)
uv = np.frombuffer(base64.b64decode(request['uv']), dtype='<f4').reshape(-1, 2)
position = np.frombuffer(base64.b64decode(request['position']), dtype='<f4').reshape(-1, 3)
indices = np.frombuffer(base64.b64decode(request['indices']), dtype='<u4').reshape(-1, 3)

sampled = {}
images = []
for item in request['images']:
    image = Image.open(io.BytesIO(base64.b64decode(item['bytes']))).convert('RGB')
    pixels = np.asarray(image)
    x = (uv[:, 0] * image.width).astype(int).clip(0, image.width - 1)
    y = (uv[:, 1] * image.height).astype(int).clip(0, image.height - 1)
    sampled[item['role']] = pixels[y, x]
    limit = 2048 if item['role'] == 'base' else 1024
    image.thumbnail((limit, limit), Image.Resampling.LANCZOS)
    encoded = io.BytesIO()
    image.save(encoded, 'JPEG', quality=90, optimize=True)
    images.append({'bytes': base64.b64encode(encoded.getvalue()).decode(),
                   'width': image.width, 'height': image.height})

mr = sampled['surface'].astype(float) / 255
base = sampled['base'].astype(float) / 255
# The unlit billboard-light shader needs authored roughness/metalness explicitly.
# Restrict diffusion to likely skin on faces/hands/exposed lower legs.
skin_color = ((base[:, 0] > base[:, 1] * 1.08) &
              (base[:, 1] > base[:, 2] * .94) & (base[:, 0] > .18))
x, y, z = position.T
skin_region = ((y > 1.36) | ((abs(x) > .19) & (y < 1.01)) |
               ((y < .64) & request['bareLegs']))
surface = np.column_stack([np.clip(mr[:, 1], .35, 1), mr[:, 2],
                           (skin_color & skin_region) * .65])
teal = np.clip((base[:, 1] + base[:, 2] - 2 * base[:, 0]) /
               np.maximum(base.sum(axis=1), .001) / .22, 0, 1)
skirt = teal * ((y > .38) & (y < .97)) if request['dress'] else np.zeros(len(y))

# Surface distances distinguish hanging hands from nearby hips/thighs. Weld
# coincident UV seams for weights, retaining every original UV in the GLB.
welded, remap = np.unique(np.round(position, 6), axis=0, return_inverse=True)
triangles = remap[indices]
edges = np.concatenate([triangles[:, [0, 1]], triangles[:, [1, 2]], triangles[:, [2, 0]]])
edges = np.unique(np.sort(edges, axis=1), axis=0)
distances = np.linalg.norm(welded[edges[:, 0]] - welded[edges[:, 1]], axis=1)
graph = csr_matrix((np.tile(distances, 2),
                    (np.r_[edges[:, 0], edges[:, 1]], np.r_[edges[:, 1], edges[:, 0]])),
                   shape=(len(welded), len(welded)))
wx, wy, wz = welded.T
welded_skin = np.zeros(len(welded), dtype=bool)
welded_skirt = np.zeros(len(welded), dtype=float)
np.logical_or.at(welded_skin, remap, skin_color)
np.maximum.at(welded_skirt, remap, skirt)
body_seed_mask = (abs(wx) < .13) | (wy < .60) | (welded_skirt > .65)
hand_seeds = welded_skin & (abs(wx) > .205) & (wy > .68) & (wy < 1.02)
sleeve_seeds = (abs(wx) > .24) & (wy > 1.0) & (wy < 1.395)
arm_seeds = np.flatnonzero((hand_seeds | sleeve_seeds) & ~body_seed_mask)
body_seeds = np.flatnonzero(body_seed_mask)
if not len(arm_seeds) or not len(body_seeds):
    raise ValueError('Could not locate arm/body surface seeds')
arm_distance = dijkstra(graph, directed=False, indices=arm_seeds, min_only=True)
body_distance = dijkstra(graph, directed=False, indices=body_seeds, min_only=True)
connected = np.isfinite(arm_distance) & np.isfinite(body_distance)
arm_mask = np.zeros(len(welded), dtype=float)
arm_mask[np.isfinite(arm_distance) & ~np.isfinite(body_distance)] = 1
t = np.clip((body_distance[connected] - arm_distance[connected] + .08) / .18, 0, 1)
arm_mask[connected] = t * t * (3 - 2 * t)
neighbors = graph.copy()
neighbors.data[:] = 1
degree = np.asarray(neighbors.sum(axis=1)).ravel().clip(1)
for _ in range(12):
    arm_mask = .5 * arm_mask + .5 * (neighbors @ arm_mask) / degree
    arm_mask[arm_seeds] = 1
    arm_mask[body_seeds] = 0
known = np.isfinite(arm_distance) | np.isfinite(body_distance)
unresolved = ~known
if unresolved.any():
    # Disconnected finger/accessory islands follow the nearest resolved surface.
    nearest = cKDTree(welded[known]).query(welded[unresolved])[1]
    arm_mask[unresolved] = arm_mask[known][nearest]
arm_mask = arm_mask[remap] * (1 - skirt)
# Some neutral Meshy poses join a hand directly to the skirt/hip surface.
# Keep triangle patches on one side of that animation boundary: duplicating
# boundary vertices preserves the rest mesh without stretching a connecting
# triangle across a moving hand and stationary clothing.
centers = position[indices].mean(axis=1)
hand_color = ((base[:, 0] > base[:, 2] * 1.06) &
              (base[:, 0] > base[:, 1] * .95) & (base[:, 0] > .18))
hand_faces = ((abs(centers[:, 0]) > .18) & (centers[:, 1] > .65) &
              (centers[:, 1] < .98) & (hand_color[indices].mean(axis=1) > .49))
skirt_faces = skirt[indices].mean(axis=1) > .5
face_labels = np.zeros(len(indices), dtype='uint8')
face_labels[hand_faces] = 1
face_labels[skirt_faces] = 2
if request['dress']:
    lower_dress = (centers[:, 1] > .38) & (centers[:, 1] < .97)
    # Classify the complete triangle at the fused hand/skirt boundary. No
    # connecting triangle may mix an elbow with a hip during a sprint.
    moving_hand = ((arm_mask[indices].mean(axis=1) > .45) &
                   (abs(centers[:, 0]) > .16) & (centers[:, 1] > .65)) | hand_faces
    cloth = ((skirt[indices].mean(axis=1) > .3) |
             ((abs(centers[:, 0]) > .18) & (centers[:, 1] > .49)))
    face_labels[lower_dress] = 3  # exposed leg: no arm/cloth contribution
    face_labels[lower_dress & cloth] = 2
    face_labels[lower_dress & moving_hand] = 1
result = {'images': images, 'surface': base64.b64encode(
    np.rint(surface * 255).astype('uint8').tobytes()).decode(),
    'armMask': base64.b64encode(arm_mask.astype('<f4').tobytes()).decode(),
    'skirtMask': base64.b64encode(skirt.astype('<f4').tobytes()).decode(),
    'faceLabels': base64.b64encode(face_labels.tobytes()).decode()}
json.dump(result, sys.stdout)
