import json,struct,io,sys
from pathlib import Path
from PIL import Image,ImageDraw
import numpy as np
root=Path(__file__).resolve().parents[1]
for p in (root/'public/characters').glob('*.glb'):
 if len(sys.argv)>1 and p.stem not in sys.argv[1:]:continue
 b=p.read_bytes();n=struct.unpack_from('<I',b,12)[0];g=json.loads(b[20:20+n]);blob=b[28+n:];old=[blob[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']] for v in g['bufferViews']]
 # Bake tiny front-view pictures once, so the picker never downloads 3D models.
 if not p.stem.endswith('_officer') and not p.with_suffix('.webp').exists():
  def arr(idx):
   a=g['accessors'][idx];v=g['bufferViews'][a['bufferView']];dtype={5126:'<f4',5125:'<u4',5123:'<u2',5121:'u1'}[a['componentType']];return np.frombuffer(old[a['bufferView']],dtype=dtype,offset=a.get('byteOffset',0),count=a['count']*{'VEC3':3,'VEC2':2,'SCALAR':1}[a['type']]).reshape(a['count'],-1)
  pr=g['meshes'][0]['primitives'][0];pos=arr(pr['attributes']['POSITION']);uv=arr(pr['attributes']['TEXCOORD_0']);faces=arr(pr['indices']).reshape(-1,3);mat=g['materials'][pr.get('material',0)];ti=mat['pbrMetallicRoughness']['baseColorTexture']['index'];im=g['images'][g['textures'][ti]['source']];tex=np.asarray(Image.open(io.BytesIO(old[im['bufferView']])).convert('RGB'))
  scale=250/(pos[:,1].max()-pos[:,1].min());xy=np.column_stack((120+(pos[:,0]-(pos[:,0].min()+pos[:,0].max())/2)*scale,265-(pos[:,1]-pos[:,1].min())*scale));pic=Image.new('RGB',(240,280),'#152937');draw=ImageDraw.Draw(pic)
  for f in faces[np.argsort(pos[faces,2].mean(axis=1))]:
   pts=xy[f];q=uv[f].mean(axis=0);x=int(q[0]*tex.shape[1])%tex.shape[1];y=int(q[1]*tex.shape[0])%tex.shape[0];color=tuple(int(v*.88) for v in tex[y,x]);draw.polygon([tuple(v) for v in pts],fill=color)
  pic.save(p.with_suffix('.webp'),quality=88)
 for im in g.get('images',[]):
  image=Image.open(io.BytesIO(old[im['bufferView']]));image.thumbnail((1024,1024),Image.Resampling.LANCZOS);out=io.BytesIO();image.convert('RGB').save(out,format='JPEG',quality=88);im['mimeType']='image/jpeg';old[im['bufferView']]=out.getvalue()
 binary=bytearray()
 for v,data in zip(g['bufferViews'],old):
  binary.extend(b'\0'*((-len(binary))%4));v['byteOffset']=len(binary);v['byteLength']=len(data);binary.extend(data)
 binary.extend(b'\0'*((-len(binary))%4));g['buffers'][0]['byteLength']=len(binary);j=json.dumps(g,separators=(',',':')).encode();j+=b' '*((-len(j))%4);p.write_bytes(struct.pack('<4sII',b'glTF',2,28+len(j)+len(binary))+struct.pack('<II',len(j),0x4e4f534a)+j+struct.pack('<II',len(binary),0x004e4942)+binary);print(p.name,len(b),'->',p.stat().st_size,flush=True)
