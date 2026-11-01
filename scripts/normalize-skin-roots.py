"""Keep skin geometry at a unit scene root for Cesium's rigid inverse path.

Joint hierarchy, inverse bind matrices, animations, and vertex buffers stay intact.
glTF skin positions are defined by joint-world * inverse-bind, independent of the
mesh-node parent. Cesium uses inverseTransformation (rigid inverse) for that node,
so a centimetre-scaled mesh parent shrinks the rendered mesh by 10,000 times.
"""
import json
import pathlib
import struct
import sys


def normalize_skin_roots(gltf):
    meshes = [i for i, node in enumerate(gltf['nodes']) if 'skin' in node and 'mesh' in node]
    for scene in gltf['scenes']:
        reachable = set()

        def visit(index):
            reachable.add(index)
            for child in gltf['nodes'][index].get('children', []):
                visit(child)

        for index in scene['nodes']:
            visit(index)
        for index in meshes:
            if index not in reachable:
                continue
            for node in gltf['nodes']:
                if index in node.get('children', []):
                    node['children'].remove(index)
            node = gltf['nodes'][index]
            for key in ('matrix', 'translation', 'rotation', 'scale'):
                node.pop(key, None)
            if index not in scene['nodes']:
                scene['nodes'].append(index)


if __name__ == '__main__':
    for name in sys.argv[1:]:
        path = pathlib.Path(name)
        original = path.read_bytes()
        length = struct.unpack_from('<I', original, 12)[0]
        gltf = json.loads(original[20:20 + length])
        normalize_skin_roots(gltf)
        document = json.dumps(gltf, separators=(',', ':')).encode()
        document += b' ' * (-len(document) % 4)
        tail = original[20 + length:]
        path.write_bytes(struct.pack('<5I', 0x46546c67, 2, 20 + len(document) + len(tail),
                                     len(document), 0x4e4f534a) + document + tail)
