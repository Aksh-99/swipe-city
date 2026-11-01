// Convert the four supplied static Meshy GLBs into bounded, skinned glTFs for
// the existing Cesium node-driven gait. This is an authoring command, not part
// of the client/build. npm ci; Python 3 with Pillow/numpy/scipy; then:
// node scripts/import-meshy-characters.mjs /absolute/path/to/source-folder
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,basename} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {MeshoptSimplifier} from 'meshoptimizer';

const sourceFolder=process.argv[2];
if(!sourceFolder)throw new Error('Provide the folder containing the four original Meshy GLBs.');
const sources=[
 {id:'explorer',file:'Meshy_AI_New_York_Explorer_1005023328_texture.glb',output:'public/player.glb',bareLegs:true},
 {id:'tourist',file:'Meshy_AI_Woman_in_Blue_Dress_1005023139_texture.glb',output:'public/characters/tourist.glb',bareLegs:true,dress:true},
 {id:'pedestrian',file:'Meshy_AI_Officer_Mason_1005023047_texture.glb',output:'public/characters/pedestrian.glb'},
 {id:'commuter',file:'Meshy_AI_Elegant_Executive_Fig_1005023428_texture.glb',output:'public/characters/commuter.glb'}
];
const HEIGHT=1.79,TARGET_TRIANGLES=48000;
const smooth=(a,b,v)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);};
const encode=a=>Buffer.from(a.buffer,a.byteOffset,a.byteLength).toString('base64');
await MeshoptSimplifier.ready;
mkdirSync('public/characters',{recursive:true});

for(const source of sources){
 const input=readFileSync(resolve(sourceFolder,source.file));
 if(input.readUInt32LE(0)!==0x46546c67||input.readUInt32LE(4)!==2)throw new Error('Expected a glTF 2 binary.');
 const jsonSize=input.readUInt32LE(12),gltf=JSON.parse(input.subarray(20,20+jsonSize)),bin=input.subarray(28+jsonSize);
 if(gltf.meshes.length!==1||gltf.meshes[0].primitives.length!==1||gltf.skins?.length)throw new Error('Expected one unrigged Meshy primitive.');
 const primitive=gltf.meshes[0].primitives[0];
 function read(index,width,Ctor=Float32Array){
  const a=gltf.accessors[index],v=gltf.bufferViews[a.bufferView];
  if(v.byteStride||a.sparse)throw new Error('Interleaved/sparse input is not supported by this authoring importer.');
  return new Ctor(bin.buffer,bin.byteOffset+(v.byteOffset??0)+(a.byteOffset??0),a.count*width).slice();
 }
 let positions=read(primitive.attributes.POSITION,3),normals=read(primitive.attributes.NORMAL,3),uv=read(primitive.attributes.TEXCOORD_0,2);
 const ia=gltf.accessors[primitive.indices],sourceIndices=new Uint32Array(read(primitive.indices,1,ia.componentType===5123?Uint16Array:Uint32Array));
 const bounds=gltf.accessors[primitive.attributes.POSITION],scale=HEIGHT/(bounds.max[1]-bounds.min[1]),centerX=(bounds.min[0]+bounds.max[0])/2;
 for(let i=0;i<positions.length;i+=3){positions[i]=(positions[i]-centerX)*scale;positions[i+1]=(positions[i+1]-bounds.min[1])*scale;positions[i+2]*=scale;}
 const attributes=new Float32Array(positions.length/3*5);
 for(let i=0;i<attributes.length/5;i++)attributes.set([...normals.subarray(i*3,i*3+3),...uv.subarray(i*2,i*2+2)],i*5);
 // UVs/normals are part of the error metric; seam boundaries remain intact.
 let [indices,error]=MeshoptSimplifier.simplifyWithAttributes(sourceIndices,positions,3,attributes,5,[.1,.1,.1,1,1],null,TARGET_TRIANGLES*3,.004,['Prune','RegularizeLight']);
 const [remap,compactCount]=MeshoptSimplifier.compactMesh(indices);let count=compactCount;
 const compact=(array,width)=>{const out=new array.constructor(count*width);for(let i=0;i<remap.length;i++)if(remap[i]!==0xffffffff)out.set(array.subarray(i*width,i*width+width),remap[i]*width);return out;};
 positions=compact(positions,3);normals=compact(normals,3);uv=compact(uv,2);
 for(let i=0;i<count;i++){const length=Math.hypot(...normals.subarray(i*3,i*3+3));for(let j=0;j<3;j++)normals[i*3+j]/=length||1;}

 const sourceMaterial=gltf.materials[primitive.material],pbr=sourceMaterial.pbrMetallicRoughness;
 const images=[['base',pbr.baseColorTexture.index],['surface',pbr.metallicRoughnessTexture.index],['normal',sourceMaterial.normalTexture.index]].map(([role,texture])=>{
  const image=gltf.images[gltf.textures[texture].source],view=gltf.bufferViews[image.bufferView];
  return {role,bytes:bin.subarray(view.byteOffset??0,(view.byteOffset??0)+view.byteLength).toString('base64')};
 });
 const helper=spawnSync('python3',['scripts/character-textures.py'],{input:JSON.stringify({uv:encode(uv),position:encode(positions),indices:encode(indices),bareLegs:!!source.bareLegs,dress:!!source.dress,images}),encoding:'utf8',maxBuffer:24*1024*1024});
 if(helper.status!==0)throw new Error(helper.stderr||'Texture/skin preparation failed');
 const textures=JSON.parse(helper.stdout);let surface=new Uint8Array(Buffer.from(textures.surface,'base64'));
 const floats=key=>{const bytes=Buffer.from(textures[key],'base64');return new Float32Array(bytes.buffer,bytes.byteOffset,bytes.byteLength/4);};
 let armMask=floats('armMask'),skirtMask=floats('skirtMask');
 const labels=new Uint8Array(Buffer.from(textures.faceLabels,'base64')),split=new Map(),originals=[],patches=[],splitIndices=new Uint32Array(indices.length);
 for(let i=0;i<indices.length;i++){
  const vertex=indices[i],label=labels[Math.floor(i/3)],key=vertex*4+label;
  let index=split.get(key);if(index===undefined){index=originals.length;split.set(key,index);originals.push(vertex);patches.push(label);}splitIndices[i]=index;
 }
 const copy=(array,width)=>{const out=new array.constructor(originals.length*width);originals.forEach((vertex,i)=>out.set(array.subarray(vertex*width,vertex*width+width),i*width));return out;};
 positions=copy(positions,3);normals=copy(normals,3);uv=copy(uv,2);surface=copy(surface,3);armMask=copy(armMask,1);skirtMask=copy(skirtMask,1);indices=splitIndices;count=originals.length;
 patches.forEach((label,i)=>{if(label===1){armMask[i]=1;skirtMask[i]=0;}else if(label===2){armMask[i]=0;skirtMask[i]=1;}else if(label===3){armMask[i]=0;skirtMask[i]=0;}});

 const nodes=[{name:'Player',children:[]}],joints=[],rest=[];
 function bone(name,parent,position){
  const index=nodes.length;nodes.push({name,translation:position,children:[]});nodes[parent].children.push(index);
  rest[index]=position.map((v,i)=>v+(rest[parent]?.[i]??0));return index;
 }
 rest[0]=[0,0,0];
 const upper=bone('UpperBody',0,[0,.98,0]),head=bone('Head',upper,[0,.48,0]);
 const limb={};
 for(const [side,sign] of [['Left',-1],['Right',1]]){
  const leg=bone(side+'Leg',0,[sign*.10,.88,0]),knee=bone(side+'Knee',leg,[0,-.35,0]),ankle=bone(side+'Ankle',knee,[0,-.35,0]);
  const arm=bone(side+'Arm',upper,[sign*.215,.40,0]),elbow=bone(side+'Elbow',arm,[sign*.01,-.275,0]);
  limb[side]={leg,knee,ankle,arm,elbow};
 }
 for(let i=0;i<nodes.length;i++)joints.push(i);
 const skinJoints=new Uint16Array(count*4),weights=new Float32Array(count*4);
 for(let i=0;i<count;i++){
  const [x,y,z]=positions.subarray(i*3,i*3+3),values=new Map();
  const add=(joint,w)=>{if(w>0)values.set(joint,(values.get(joint)??0)+w);};
  const headWeight=smooth(1.385,1.515,y);
  const armWeight=armMask[i]*(1-smooth(1.375,1.49,y))*(1-headWeight);
  const torso=1-headWeight-armWeight;
  const legWeight=(1-smooth(.79,.98,y))*torso;
  const bodyUpper=smooth(.83,1.06,y);
  add(head,headWeight);add(upper,(torso-legWeight)*bodyUpper);add(0,(torso-legWeight)*(1-bodyUpper));
  const armSide=x<0?'Left':'Right',armUpper=smooth(1.035,1.145,y);
  add(limb[armSide].arm,armWeight*armUpper);add(limb[armSide].elbow,armWeight*(1-armUpper));
  const seam=source.dress?.09:.025+.045*smooth(.66,.88,y);
  const right=smooth(-seam,seam,x),thigh=smooth(.475,.60,y),foot=1-smooth(.12,.22,y);
  // A continuous skirt follows the pelvis with a restrained thigh influence;
  // it is never split into two rigid mesh halves.
  const legAmount=legWeight*(1-skirtMask[i]*.80);
  add(0,legWeight-legAmount);
  for(const [side,sideWeight] of [['Left',1-right],['Right',right]]){
   add(limb[side].leg,legAmount*sideWeight*thigh);
   add(limb[side].knee,legAmount*sideWeight*(1-thigh)*(1-foot));
   add(limb[side].ankle,legAmount*sideWeight*(1-thigh)*foot);
  }
  const chosen=[...values].sort((a,b)=>b[1]-a[1]).slice(0,4),total=chosen.reduce((sum,[,w])=>sum+w,0);
  if(!total)throw new Error('Unweighted vertex');
  chosen.forEach(([joint,w],j)=>{skinJoints[i*4+j]=joint;weights[i*4+j]=w/total;});
 }
 const views=[],accessors=[],chunks=[];let length=0;
 function append(bytes,target){const data=Buffer.from(bytes);const offset=length;chunks.push(data);length+=data.length;const padding=(4-length%4)%4;if(padding){chunks.push(Buffer.alloc(padding));length+=padding;}views.push({buffer:0,byteOffset:offset,byteLength:data.length,...(target?{target}:{})});return views.length-1;}
 function accessor(array,type,componentType,target,extra={}){const bufferView=append(Buffer.from(array.buffer,array.byteOffset,array.byteLength),target);accessors.push({bufferView,componentType,count:array.length/({VEC2:2,VEC3:3,VEC4:4,MAT4:16,SCALAR:1}[type]),type,...extra});return accessors.length-1;}
 const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];for(let i=0;i<count;i++)for(let j=0;j<3;j++){min[j]=Math.min(min[j],positions[i*3+j]);max[j]=Math.max(max[j],positions[i*3+j]);}
 const attrs={POSITION:accessor(positions,'VEC3',5126,34962,{min,max}),NORMAL:accessor(normals,'VEC3',5126,34962),TEXCOORD_0:accessor(uv,'VEC2',5126,34962),JOINTS_0:accessor(skinJoints,'VEC4',5123,34962),WEIGHTS_0:accessor(weights,'VEC4',5126,34962),_SURFACE:accessor(surface,'VEC3',5121,34962,{normalized:true})};
 const shortIndices=count<65536,indexAccessor=accessor(shortIndices?new Uint16Array(indices):indices,'SCALAR',shortIndices?5123:5125,34963);
 const inverseBind=new Float32Array(joints.length*16);joints.forEach((node,i)=>{inverseBind.set([1,0,0,0,0,1,0,0,0,0,1,0,-rest[node][0],-rest[node][1],-rest[node][2],1],i*16);});
 const bindAccessor=accessor(inverseBind,'MAT4',5126);
 const preparedImages=textures.images.map(image=>({mimeType:'image/jpeg',bufferView:append(Buffer.from(image.bytes,'base64'))}));
 const meshNode=nodes.length;nodes.push({name:'MeshySurface',mesh:0,skin:0});nodes[0].children.push(meshNode);
 for(const node of nodes)if(node.children?.length===0)delete node.children;
 const sha256=createHash('sha256').update(input).digest('hex');
 const asset={asset:{version:'2.0',generator:'Times Square Meshy importer 1',extras:{sourceFile:basename(source.file),sourceSha256:sha256,appearanceId:source.id,heightMetres:HEIGHT,sourceTriangles:sourceIndices.length/3,triangles:indices.length/3,simplificationError:error,rig:'prototype linear-blend skin; existing procedural gait'}},scene:0,scenes:[{nodes:[0]}],nodes,skins:[{name:'TimesSquareLocomotion',joints,skeleton:0,inverseBindMatrices:bindAccessor}],meshes:[{name:'UploadedCharacter',primitives:[{attributes:attrs,indices:indexAccessor,material:0}]}],materials:[{name:'OriginalMeshyTexture',pbrMetallicRoughness:{baseColorFactor:[1,1,1,1],baseColorTexture:{index:0},metallicFactor:1,roughnessFactor:1,metallicRoughnessTexture:{index:1}},normalTexture:{index:2,scale:.7},doubleSided:false}],textures:preparedImages.map((_,source)=>({source,sampler:0})),samplers:[{magFilter:9729,minFilter:9987,wrapS:33071,wrapT:33071}],images:preparedImages,accessors,bufferViews:views,buffers:[{byteLength:length}]};
 let json=Buffer.from(JSON.stringify(asset));json=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,0x20)]);const binary=Buffer.concat(chunks),output=Buffer.alloc(28+json.length+binary.length);
 output.writeUInt32LE(0x46546c67,0);output.writeUInt32LE(2,4);output.writeUInt32LE(output.length,8);output.writeUInt32LE(json.length,12);output.writeUInt32LE(0x4e4f534a,16);json.copy(output,20);output.writeUInt32LE(binary.length,20+json.length);output.writeUInt32LE(0x004e4942,24+json.length);binary.copy(output,28+json.length);writeFileSync(source.output,output);
 console.log(`${source.id}: ${count} vertices, ${indices.length/3} triangles, ${(output.length/1e6).toFixed(2)} MB, ${HEIGHT} m`);
}
