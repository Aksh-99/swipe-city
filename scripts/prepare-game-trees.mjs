// Derive runtime assets from the user's Meshy originals; preserve baked UVs/textures.
import fs from 'node:fs';
import {groundTreeGeometry} from './ground-tree-geometry.mjs';
import {spawnSync} from 'node:child_process';
const uploads=process.argv[2]??'../upload';
import {MeshoptSimplifier as S} from 'meshoptimizer';
await S.ready;
fs.mkdirSync('public/trees',{recursive:true});
for(const [key,file] of [['maple','Midnight_Maple_1026144559'],['green','Lone_Green_Tree_1026145646']]){
 const bytes=fs.readFileSync(uploads+'/Meshy_AI_'+file+'_texture.glb'),n=bytes.readUInt32LE(12),g=JSON.parse(bytes.subarray(20,20+n)),bin=bytes.subarray(28+n),p=g.meshes[0].primitives[0];
 const sizes={SCALAR:1,VEC2:2,VEC3:3,VEC4:4},types={5126:Float32Array,5125:Uint32Array,5123:Uint16Array};
 const read=id=>{const a=g.accessors[id],v=g.bufferViews[a.bufferView],T=types[a.componentType];return new T(bin.buffer,bin.byteOffset+(v.byteOffset||0)+(a.byteOffset||0),a.count*sizes[a.type]);};
 const pos=read(p.attributes.POSITION),indices=Uint32Array.from(read(p.indices));
 console.log(key,'simplifying',indices.length/3,'triangles');
 let [idx,error]=S.simplify(indices,pos,3,90000,.012,['Permissive']);
 if(idx.length>180000)[idx,error]=S.simplifySloppy(idx,pos,3,null,90000,.025);
 const [remap,count]=S.compactMesh(idx),outIdx=idx,parts=[],views=[],accessors=[];let offset=0;
 const put=data=>{const pad=-offset&3;parts.push(Buffer.alloc(pad));offset+=pad;const id=views.length;views.push({buffer:0,byteOffset:offset,byteLength:data.byteLength});parts.push(Buffer.from(data.buffer,data.byteOffset,data.byteLength));offset+=data.byteLength;return id;};
 const attrs={};let min,max;
 for(const [semantic,id] of Object.entries(p.attributes)){
  const a=g.accessors[id],source=read(id),size=sizes[a.type],out=new types[a.componentType](count*size);
  for(let i=0;i<remap.length;i++)if(remap[i]<count)for(let c=0;c<size;c++)out[remap[i]*size+c]=source[i*size+c];
  if(semantic==='POSITION'){
   // glTF Y-up: centre trunk at ground, retain the original tree silhouette.
   const midX=(a.min[0]+a.max[0])/2,midZ=(a.min[2]+a.max[2])/2,h=a.max[1]-a.min[1];
   min=[Infinity,Infinity,Infinity];max=[-Infinity,-Infinity,-Infinity];
   for(let i=0;i<out.length;i+=3){out[i]=(out[i]-midX)/h;out[i+1]=(out[i+1]-a.min[1])/h;out[i+2]=(out[i+2]-midZ)/h;for(let c=0;c<3;c++){min[c]=Math.min(min[c],out[i+c]);max[c]=Math.max(max[c],out[i+c]);}}
  }
  if(semantic==='POSITION')({min,max}=groundTreeGeometry(out));
  attrs[semantic]=accessors.length;accessors.push({bufferView:put(out),componentType:a.componentType,count,type:a.type,...(semantic==='POSITION'?{min,max}:{})});
 }
 const indexId=accessors.length;accessors.push({bufferView:put(outIdx),componentType:5125,count:outIdx.length,type:'SCALAR'});
 const images=g.images.map(img=>{const v=g.bufferViews[img.bufferView],raw=bin.subarray(v.byteOffset||0,(v.byteOffset||0)+v.byteLength);const r=spawnSync('python',['-c',"from PIL import Image;import sys,io;im=Image.open(io.BytesIO(sys.stdin.buffer.read()));im.thumbnail((1024,1024));im.save(sys.stdout.buffer,format='JPEG',quality=88)"],{input:raw,maxBuffer:16*1024*1024});if(r.status!==0)throw new Error(r.stderr.toString());return {mimeType:'image/jpeg',bufferView:put(r.stdout)};});
 parts.push(Buffer.alloc(-offset&3));const binary=Buffer.concat(parts);
 const out={asset:{version:'2.0',generator:'Swipe City Meshy tree runtime derivative'},scene:0,scenes:[{nodes:[0]}],nodes:[{mesh:0}],meshes:[{primitives:[{attributes:attrs,indices:indexId,material:0}]}],materials:g.materials,textures:g.textures,samplers:g.samplers,images,buffers:[{byteLength:binary.length}],bufferViews:views,accessors};
 out.buffers[0].uri=key+'.bin';
 fs.writeFileSync('public/trees/'+key+'.bin',binary);fs.writeFileSync('public/trees/'+key+'.json',JSON.stringify(out));
 console.log(key,{triangles:idx.length/3,vertices:count,bytes:binary.length,error});
}
