"""Match exposed skin with linear glTF vertex colour; never tint the uniform.

Run after importing the uploaded model. Textures, geometry, joints and clips
remain byte-for-byte unchanged; only a new COLOR_0 stream is appended.
"""
import io
import json
import pathlib
import struct
import sys
import numpy as np
from PIL import Image


def load(path):
    b = pathlib.Path(path).read_bytes()
    length = struct.unpack_from('<I', b, 12)[0]
    g = json.loads(b[20:20 + length])
    raw = b[28 + length:]
    pr = g['meshes'][0]['primitives'][0]

    def attribute(name, columns):
        a = g['accessors'][pr['attributes'][name]]
        v = g['bufferViews'][a['bufferView']]
        return np.ndarray((a['count'], columns), dtype='<f4', buffer=raw,
                          offset=v.get('byteOffset', 0) + a.get('byteOffset', 0),
                          strides=(v.get('byteStride', columns * 4), 4))

    positions, uv = attribute('POSITION', 3), attribute('TEXCOORD_0', 2)
    material = g['materials'][pr.get('material', 0)]
    texture = material['pbrMetallicRoughness']['baseColorTexture']['index']
    image = g['images'][g['textures'][texture]['source']]
    view = g['bufferViews'][image['bufferView']]
    pixels = np.asarray(Image.open(io.BytesIO(raw[view.get('byteOffset', 0):][:view['byteLength']])).convert('RGB')) / 255
    rgb = pixels[np.clip((uv[:, 1] * pixels.shape[0]).astype(int), 0, pixels.shape[0] - 1),
                 np.clip((uv[:, 0] * pixels.shape[1]).astype(int), 0, pixels.shape[1] - 1)]
    saturation = 1 - rgb.min(axis=1) / np.maximum(rgb.max(axis=1), 1e-5)
    warm = (rgb[:, 0] > rgb[:, 1] * 1.01) & (rgb[:, 1] > rgb[:, 2] * 1.01)
    warm &= (saturation > .08) & (rgb.mean(axis=1) > .12)
    face = (np.abs(positions[:, 0]) < .09) & (positions[:, 1] > 1.42)
    face &= (positions[:, 1] < 1.60) & (positions[:, 2] > .04) & warm
    assert face.sum() > 50, 'Insufficient visible face samples to match the reference'
    return g, raw, pr, positions, rgb, warm, face


def linear(rgb):
    return np.where(rgb <= .04045, rgb / 12.92, ((rgb + .055) / 1.055) ** 2.4)


target, reference = sys.argv[1:3]
g, raw, pr, positions, rgb, warm, face = load(target)
assert 'COLOR_0' not in pr['attributes'], 'Import a fresh source before reapplying'
_, _, _, _, ref_rgb, _, ref_face = load(reference)
source_tone = np.median(rgb[face], axis=0)
target_tone = np.median(ref_rgb[ref_face], axis=0)
factor = np.clip(linear(target_tone) / linear(source_tone), 0, 1)
head = (positions[:, 1] > 1.36) & (np.abs(positions[:, 0]) < .23)
hands = (np.abs(positions[:, 0]) > .65) & (positions[:, 1] > 1.1) & (positions[:, 1] < 1.45)
skin = (head | hands) & warm & (rgb.mean(axis=1) > .20)
assert skin.sum() > 300
assert np.any(skin & head) and np.any(skin & hands)
colors = np.ones((len(positions), 4), dtype='<f4')
colors[skin, :3] = factor
offset = len(raw)
view_index = len(g['bufferViews'])
g['bufferViews'].append({'buffer': 0, 'byteOffset': offset, 'byteLength': colors.nbytes, 'target': 34962})
pr['attributes']['COLOR_0'] = len(g['accessors'])
g['accessors'].append({'bufferView': view_index, 'componentType': 5126, 'count': len(colors), 'type': 'VEC4'})
g.setdefault('extras', {})['complexionMatch'] = {
    'reference': pathlib.Path(reference).name,
    'sourceMedianSRGB': source_tone.tolist(), 'targetMedianSRGB': target_tone.tolist(),
    'linearSkinMultiplier': factor.tolist(), 'skinVertexCount': int(skin.sum())}
raw += colors.tobytes()
g['buffers'][0]['byteLength'] = len(raw)
document = json.dumps(g, separators=(',', ':')).encode()
document += b' ' * (-len(document) % 4)
result = struct.pack('<5I', 0x46546c67, 2, 28 + len(document) + len(raw), len(document), 0x4e4f534a)
result += document + struct.pack('<2I', len(raw), 0x004e4942) + raw
pathlib.Path(target).write_bytes(result)
print(json.dumps(g['extras']['complexionMatch']))
