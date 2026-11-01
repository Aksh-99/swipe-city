"""Import a user's multi-clip GLB without regenerating geometry or animations."""
import importlib
import io
import json
import pathlib
import struct
import sys

import numpy as np
from PIL import Image

source = pathlib.Path(sys.argv[1])
design = sys.argv[2]
original = source.read_bytes()
length = struct.unpack_from('<I', original, 12)[0]
g = json.loads(original[20:20 + length])
binary = original[28 + length:]


def accessor(index):
    a = g['accessors'][index]
    v = g['bufferViews'][a['bufferView']]
    columns = {'SCALAR': 1, 'VEC3': 3, 'VEC4': 4}[a['type']]
    offset = v.get('byteOffset', 0) + a.get('byteOffset', 0)
    return np.ndarray((a['count'], columns), dtype='<f4', buffer=binary, offset=offset,
                      strides=(v.get('byteStride', columns * 4), 4))


nodes, clips = {}, {}
animation_names = {animation['name'] for animation in g['animations']}
standing_name = next(name for name in ('Stand_Talking_Angry', 'Shouting_Angrily') if name in animation_names)
selection = {'walking': 'Walking', 'running': 'Running', 'standing': standing_name}
for kind, name in selection.items():
    animation = next(a for a in g['animations'] if a['name'] == name)
    tracks, duration = {}, 0
    for channel in animation['channels']:
        node = g['nodes'][channel['target']['node']]
        node_name = node['name']
        nodes[node_name] = {key: node.get(key, default) for key, default in
                            [('translation', [0, 0, 0]), ('rotation', [0, 0, 0, 1]), ('scale', [1, 1, 1])]}
        sampler = animation['samplers'][channel['sampler']]
        assert sampler.get('interpolation', 'LINEAR') == 'LINEAR'
        times = accessor(sampler['input']).reshape(-1)
        values = accessor(sampler['output'])
        if len(times) > 2 and np.all(np.abs(values - values[0]) < 1e-7):
            times, values = times[[0, -1]], values[[0, -1]]
        duration = max(duration, float(times[-1]))
        tracks.setdefault(node_name, {})[channel['target']['path']] = {
            'times': np.round(times.astype(float), 7).tolist(),
            'values': np.round(values.astype(float), 7).tolist()}
    clips[kind] = {'name': name, 'duration': duration, 'tracks': tracks}

# A neutral average of the walk returns the arms to rest without using the T-pose.
idle = {}
for name, rest in nodes.items():
    tracks = clips['walking']['tracks'][name]
    rotations = np.array(tracks.get('rotation', {'values': [rest['rotation']]})['values'])
    rotations *= np.where(rotations @ rotations[0] < 0, -1, 1)[:, None]
    rotation = rotations.mean(axis=0)
    rotation /= np.linalg.norm(rotation)
    translations = np.array(tracks.get('translation', {'values': [rest['translation']]})['values'])
    idle[name] = {'rotation': rotation.tolist(), 'translation': translations.mean(axis=0).tolist()}

result = {'sourceFile': source.name, 'nodes': nodes, 'clips': clips, 'idle': idle,
          'availableClips': list(selection.values())}
pathlib.Path('public/data/' + design + '-motion.json').write_text(json.dumps(result, separators=(',', ':')) + '\n')

g['animations'] = [a for a in g['animations'] if a['name'] in selection.values()]
importlib.import_module('normalize-skin-roots').normalize_skin_roots(g)
color_images = {g['textures'][m['pbrMetallicRoughness']['baseColorTexture']['index']]['source']
                for m in g['materials'] if 'baseColorTexture' in m.get('pbrMetallicRoughness', {})}
images = {im['bufferView']: (index, im) for index, im in enumerate(g['images'])}
chunks, offset = [], 0
for index, view in enumerate(g['bufferViews']):
    raw = binary[view.get('byteOffset', 0):][:view['byteLength']]
    if index in images:
        image_index, descriptor = images[index]
        im = Image.open(io.BytesIO(raw))
        im.thumbnail((1024, 1024))
        out = io.BytesIO()
        if image_index in color_images:
            im.convert('RGB').save(out, format='JPEG', quality=92)
            descriptor['mimeType'] = 'image/jpeg'
        else:
            im.save(out, format='PNG', optimize=True)
        raw = out.getvalue()
    pad = -offset % 4
    chunks.append(b'\0' * pad)
    offset += pad
    view['byteOffset'], view['byteLength'] = offset, len(raw)
    chunks.append(raw)
    offset += len(raw)
body = b''.join(chunks)
body += b'\0' * (-len(body) % 4)
g['buffers'][0]['byteLength'] = len(body)
document = json.dumps(g, separators=(',', ':')).encode()
document += b' ' * (-len(document) % 4)
glb = struct.pack('<5I', 0x46546c67, 2, 28 + len(document) + len(body), len(document), 0x4e4f534a)
glb += document + struct.pack('<2I', len(body), 0x004e4942) + body
pathlib.Path('public/characters/' + design + '-meshy.glb').write_bytes(glb)
