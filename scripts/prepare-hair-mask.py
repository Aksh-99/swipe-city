"""Add a hair-only vertex mask to the existing authored GLBs. No source uploads change."""
import io,json,struct
from pathlib import Path
import numpy as np
from PIL import Image
root=Path(__file__).resolve().parents[1]
for filename in ['public/player.glb','public/characters/tourist.glb','public/characters/commuter.glb','public/characters/pedestrian.glb']:
 p=root/filename;raw=p.read_bytes();n=struct.unpack_from('<I',raw,12)[0];doc=json.loads(raw[20:20+n]);binary=bytearray(raw[28+n:]);prim=doc['meshes'][0]['primitives'][0]
 if '_HAIR' in prim['attributes']:continue
 def acc(i):
  a=doc['accessors'][i];b=doc['bufferViews'][a['bufferView']];dims={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}[a['type']];dt={5121:'u1',5123:'<u2',5125:'<u4',5126:'<f4'}[a['componentType']];arr=np.frombuffer(binary,dtype=dt,count=a['count']*dims,offset=b.get('byteOffset',0)+a.get('byteOffset',0)).reshape(-1,dims);return arr
 attrs=prim['attributes'];pos=acc(attrs['POSITION']);uv=acc(attrs['TEXCOORD_0']);joints=acc(attrs['JOINTS_0']);weights=acc(attrs['WEIGHTS_0']);surface=acc(attrs['_SURFACE']);tex=doc['materials'][prim['material']]['pbrMetallicRoughness']['baseColorTexture']['index'];image=doc['images'][doc['textures'][tex]['source']];b=doc['bufferViews'][image['bufferView']];im=Image.open(io.BytesIO(binary[b.get('byteOffset',0):b.get('byteOffset',0)+b['byteLength']])).convert('RGB');pixels=np.asarray(im);colors=pixels[(uv[:,1]*im.height).astype(int).clip(0,im.height-1),(uv[:,0]*im.width).astype(int).clip(0,im.width-1)].astype(float)/255
 head=(weights*(joints==2)).sum(1);dark=colors.max(1)<.33;not_skin=surface[:,2]<80
 mask=(dark & not_skin & ((head>.6)|((pos[:,1]>1.48)&(abs(pos[:,0])<.17)))).astype('uint8')
 # Keep facial features below the scalp out of recoloring.
 mask[(pos[:,1]<1.51)&(pos[:,2]>.055)&(abs(pos[:,0])<.065)]=0
 mask*=255
 binary=bytearray(bytes(binary));offset=len(binary);binary.extend(mask.tobytes());doc['bufferViews'].append({'buffer':0,'byteOffset':offset,'byteLength':len(mask),'target':34962});doc['accessors'].append({'bufferView':len(doc['bufferViews'])-1,'componentType':5121,'count':len(mask),'type':'SCALAR','normalized':True});attrs['_HAIR']=len(doc['accessors'])-1
 binary.extend(b'\0'*((-len(binary))%4));doc['buffers'][0]['byteLength']=len(binary);js=json.dumps(doc,separators=(',',':')).encode();js+=b' '*((-len(js))%4);p.write_bytes(struct.pack('<4sII',b'glTF',2,28+len(js)+len(binary))+struct.pack('<I4s',len(js),b'JSON')+js+struct.pack('<I4s',len(binary),b'BIN\0')+binary)
 print(filename, 'hair vertices',int((mask>0).sum()),'of',len(mask))
