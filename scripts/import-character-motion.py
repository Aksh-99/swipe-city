import json,struct,pathlib,shutil,sys,importlib
normalize_skin_roots=importlib.import_module("normalize-skin-roots").normalize_skin_roots
root=pathlib.Path(sys.argv[1]); design=sys.argv[2]; remesh_task=sys.argv[3]; rig_task=sys.argv[4]
def read(p):
 b=p.read_bytes();n=struct.unpack_from('<I',b,12)[0];return json.loads(b[20:20+n]),b[28+n:]
def accessor(g,b,i):
 a=g['accessors'][i];v=g['bufferViews'][a['bufferView']];count=a['count'];cols={'SCALAR':1,'VEC3':3,'VEC4':4}[a['type']];off=v.get('byteOffset',0)+a.get('byteOffset',0);vals=struct.unpack_from('<'+'f'*(count*cols),b,off);return [[round(x,7)for x in vals[j:j+cols]]for j in range(0,len(vals),cols)] if cols>1 else [round(x,7)for x in vals]
clips={};nodes={}
for kind in ['walking','running']:
 g,b=read(root/(design+'-'+kind+'.glb'));tracks={};duration=0
 for ch in g['animations'][0]['channels']:
  ni=ch['target']['node'];n=g['nodes'][ni];name=n['name'];nodes[name]={k:n.get(k,default)for k,default in [('translation',[0,0,0]),('rotation',[0,0,0,1]),('scale',[1,1,1])]};sm=g['animations'][0]['samplers'][ch['sampler']];times=accessor(g,b,sm['input']);values=accessor(g,b,sm['output']);duration=max(duration,max(times));tracks.setdefault(name,{})[ch['target']['path']]={'times':times,'values':values}
 clips[kind]={'duration':duration,'tracks':tracks}
pathlib.Path('public/data/'+design+'-motion.json').write_text(json.dumps({'sourceTasks':{'remesh':remesh_task,'rigging':rig_task},'nodes':nodes,'clips':clips},separators=(',',':'))+'\n');shutil.copyfile(root/(design+'-running.glb'),'public/characters/'+design+'-meshy.glb')
# Pack game textures without modifying the downloaded Meshy source.
import io
from PIL import Image
g,b=read(root/(design+'-running.glb'));normalize_skin_roots(g);image_views={im['bufferView']:im for im in g['images']};chunks=[];offset=0
for i,v in enumerate(g['bufferViews']):
 raw=b[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']]
 if i in image_views:
  im=Image.open(io.BytesIO(raw));im.thumbnail((1024,1024));out=io.BytesIO()
  if i==g['images'][0]['bufferView']:im.convert('RGB').save(out,format='JPEG',quality=92);image_views[i]['mimeType']='image/jpeg'
  else:im.save(out,format='PNG',optimize=True)
  raw=out.getvalue()
 pad=(-offset)%4;chunks.append(b'\0'*pad);offset+=pad;v['byteOffset']=offset;v['byteLength']=len(raw);chunks.append(raw);offset+=len(raw)
binbytes=b''.join(chunks);binbytes+=b'\0'*((-len(binbytes))%4);g['buffers'][0]['byteLength']=len(binbytes);jb=json.dumps(g,separators=(',',':')).encode();jb+=b' '*((-len(jb))%4);glb=struct.pack('<5I',0x46546c67,2,28+len(jb)+len(binbytes),len(jb),0x4e4f534a)+jb+struct.pack('<2I',len(binbytes),0x004e4942)+binbytes;pathlib.Path('public/characters/'+design+'-meshy.glb').write_bytes(glb)
