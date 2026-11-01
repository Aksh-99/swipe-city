"""Subset the upstream spatial hierarchy; retain original b3dm bytes and transforms."""
import json, math, pathlib, urllib.request, concurrent.futures
ROOT = pathlib.Path(__file__).resolve().parents[1]
BBOX = [-73.9918, 40.7538, -73.9802, 40.7639]
box = [math.radians(x) for x in BBOX]
source = json.loads((ROOT / 'scripts/source-tileset.json').read_text())
uris = []
def intersects(r):
    return not (r[2] < box[0] or r[0] > box[2] or r[3] < box[1] or r[1] > box[3])
def prune(node):
    if not intersects(node['boundingVolume']['region']): return None
    node = dict(node)
    if 'content' in node:
        bounds = node['content'].get('boundingVolume', node['boundingVolume'])['region']
        if intersects(bounds): uris.append(node['content']['uri'])
        else: del node['content']
    if 'children' in node: node['children'] = [v for c in node['children'] if (v := prune(c))]
    return node if node.get('content') or node.get('children') else None
source['root'] = prune(source['root'])
dest = ROOT / 'public/data/nyc'
dest.mkdir(parents=True, exist_ok=True)
(dest/'tileset.json').write_text(json.dumps(source))
def download(uri):
    path = dest/uri
    path.parent.mkdir(parents=True, exist_ok=True)
    if not path.exists():
        urllib.request.urlretrieve('https://raw.githubusercontent.com/JoeThunyathep/NYC3D_CesiumJS/df20a24582520dd856e56e99ae44e3ff43ab3269/public/3dtile_nyc/'+uri, path)
    return {'uri':uri,'bytes':path.stat().st_size}
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool: files=list(pool.map(download,uris))
(dest/'manifest.json').write_text(json.dumps({'sourceCommit':'df20a24582520dd856e56e99ae44e3ff43ab3269','bounds':BBOX,'files':files},indent=2))
print(json.dumps({'tiles':len(files),'bytes':sum(f['bytes'] for f in files)}))
