"""Extract exact triangle positions from pinned NYC b3dm, in local ENU metres.
Cesium's GLTF Y-up -> tile Z-up conversion is (x, -z, y).
No building footprints, height inference, or substitute geometry are used.
"""
import pathlib, json, struct, math
import numpy as np
ROOT=pathlib.Path(__file__).resolve().parents[1]
lon,lat=map(math.radians,[-73.9855,40.7580]);a=6378137.;e2=6.69437999014e-3
n=a/math.sqrt(1-e2*math.sin(lat)**2)
origin=np.array([n*math.cos(lat)*math.cos(lon),n*math.cos(lat)*math.sin(lon),n*(1-e2)*math.sin(lat)])
rot=np.array([[-math.sin(lon),math.cos(lon),0],[-math.sin(lat)*math.cos(lon),-math.sin(lat)*math.sin(lon),math.cos(lat)],[math.cos(lat)*math.cos(lon),math.cos(lat)*math.sin(lon),math.sin(lat)]])
manifest=json.loads((ROOT/'public/data/nyc/manifest.json').read_text())
for tile in manifest['files']:
    b=(ROOT/'public/data/nyc'/tile['uri']).read_bytes();h=struct.unpack('<7I',b[:28]);ft=json.loads(b[28:28+h[3]])
    glb=b[28+sum(h[3:]):];length=struct.unpack('<I',glb[12:16])[0];gl=json.loads(glb[20:20+length]);binary=glb[28+length:]
    def read(i):
        acc=gl['accessors'][i];view=gl['bufferViews'][acc['bufferView']];dtype={5123:'<u2',5125:'<u4',5126:'<f4'}[acc['componentType']]
        width={'SCALAR':1,'VEC3':3}[acc['type']]
        return np.frombuffer(binary,dtype=dtype,count=acc['count']*width,offset=view.get('byteOffset',0)+acc.get('byteOffset',0)).reshape(acc['count'],width)
    triangles=[]
    # This pinned source has one untransformed mesh node per tile; fail rather than silently corrupt another source.
    assert all(not any(k in node for k in ['matrix','translation','rotation','scale']) for node in gl['nodes'])
    for mesh in gl['meshes']:
        for p in mesh['primitives']:
            assert p.get('mode',4)==4
            pos=read(p['attributes']['POSITION']);ecef=pos[:,[0,2,1]]*np.array([1,-1,1])+np.array(ft['RTC_CENTER'])
            local=(ecef-origin)@rot.T
            indices=read(p['indices']).flatten() if 'indices' in p else np.arange(len(pos))
            triangles.append(local[indices].astype('<f4'))
    data=np.concatenate(triangles)
    out=ROOT/'public/data/collision'/(tile['uri']+'.bin');out.parent.mkdir(parents=True,exist_ok=True);out.write_bytes(data.tobytes())
    tile['collision']='/data/collision/'+tile['uri']+'.bin'
    tile['bounds']=[float(v) for v in np.concatenate([data.min(0),data.max(0)])]
manifest['origin']={'longitude':-73.9855,'latitude':40.7580,'height':0}
(ROOT/'public/data/nyc/manifest.json').write_text(json.dumps(manifest,indent=2))
print('Exact colliders:',len(manifest['files']), 'tiles')
print('Height minima:',[round(f['bounds'][2],2) for f in manifest['files']])
