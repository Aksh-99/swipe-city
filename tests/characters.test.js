import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';import {Box3,Vector3,Quaternion as ThreeQuaternion,Euler} from 'three';
import {Entity,ModelGraphics,JulianDate,Cartesian3} from 'cesium';
import {CHARACTERS,selectCharacter} from '../src/characters.js';
import {APPEARANCES} from '../src/appearances.js';
import ShaderBuilder from '@cesium/engine/Source/Renderer/ShaderBuilder.js';
import CustomShaderPipelineStage from '@cesium/engine/Source/Scene/Model/CustomShaderPipelineStage.js';
import {createCharacterShader} from '../src/character-rendering.js';
import {locomotionPose} from '../src/locomotion-pose.js';
// No browser/WebGL is used here. Image payloads are checked below; this bitmap
// placeholder lets the real loader exercise skin/bind geometry in Node.
globalThis.self??=globalThis;
globalThis.createImageBitmap??=async()=>({width:2048,height:2048,close(){}});
const joints=['Player','Head','UpperBody',...['Left','Right'].flatMap(s=>['Leg','Knee','Ankle','Arm','Elbow'].map(p=>s+p))];
test('all four characters have compatible animated joints, finite geometry and bounded size',async()=>{
 assert.equal(CHARACTERS.length,4);assert.equal(new Set(CHARACTERS.map(c=>c.id)).size,4);
 assert.equal(CHARACTERS,APPEARANCES);assert.deepEqual(APPEARANCES.map(a=>a.name),['New York Explorer','Woman in Blue Dress','Officer Manson','Executive']);
 assert(APPEARANCES.every(a=>!Object.hasOwn(a,'role')&&!Object.hasOwn(a,'gameplayRole')));
 for(const c of CHARACTERS){const bytes=await readFile('public'+c.uri.split('?')[0]);assert(bytes.byteLength<4_000_000,c.id+' download');const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');gltf.scene.updateMatrixWorld(true);const names=new Set(),bounds=new Box3().setFromObject(gltf.scene),size=bounds.getSize(new Vector3());let meshes=0;
  gltf.scene.traverse(n=>{names.add(n.name);if(n.isMesh){meshes++;assert(n.isSkinnedMesh,c.id+' real skinned surface');assert(n.material.map&&n.material.normalMap,c.id+' uploaded texture maps');for(const key of ['position','normal','uv','skinIndex','skinWeight'])assert(n.geometry.attributes[key]?.array.every(Number.isFinite),c.id+' '+key);const surface=n.geometry.attributes._surface;assert(surface?.normalized,c.id+' compact surface attributes');assert.equal(surface.count,n.geometry.attributes.position.count);for(let i=0;i<surface.count;i++)for(let j=0;j<3;j++)assert(surface.getComponent(i,j)>=0&&surface.getComponent(i,j)<=1);}});
  for(const j of joints)assert(names.has(j),c.id+' '+j);assert(Math.abs(size.y-1.79)<.001,c.id+' metre scale within simplification tolerance');assert(bounds.min.y>=-.002&&bounds.min.y<.02,c.id+' foot datum');assert(size.x<.65,c.id+' standing silhouette');assert.equal(meshes,1,c.id+' one skinned draw');
 }
});
test('supplied textured assets preserve their bind pose and deform with the actual walk/sprint gait',async()=>{
 for(const c of CHARACTERS){
  const bytes=await readFile('public'+c.uri.split('?')[0]),json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)));
  assert.equal(json.asset.extras.appearanceId,c.id);assert.match(json.asset.extras.sourceFile,/^Meshy_AI_.*_texture\.glb$/);assert.match(json.asset.extras.sourceSha256,/^[a-f0-9]{64}$/);
  assert.equal(json.skins.length,1);assert.equal(json.images.length,3);assert(json.asset.extras.triangles<=48000);assert(json.asset.extras.simplificationError<.004);
  const binary=bytes.subarray(28+bytes.readUInt32LE(12));for(const image of json.images){const view=json.bufferViews[image.bufferView];assert(view.byteLength>10000);assert.equal(binary.readUInt16BE(view.byteOffset),0xffd8,'self-contained JPEG');}
  const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');gltf.scene.updateMatrixWorld(true);
  let mesh;gltf.scene.traverse(n=>{if(n.isSkinnedMesh)mesh=n;});
  const base=new Map();gltf.scene.traverse(n=>base.set(n.name,{position:n.position.clone(),quaternion:n.quaternion.clone()}));
  const geometry=mesh.geometry,position=geometry.attributes.position,skinWeights=geometry.attributes.skinWeight,skinIndex=geometry.attributes.skinIndex;
  const restVertices=Array.from({length:position.count},(_,i)=>new Vector3().fromBufferAttribute(position,i));
  for(let i=0;i<position.count;i++){
   let sum=0;for(let j=0;j<4;j++){const w=skinWeights.getComponent(i,j);assert(w>=0&&w<=1);sum+=w;assert(skinIndex.getComponent(i,j)<mesh.skeleton.bones.length);}assert(Math.abs(sum-1)<.00001);
  }
  for(let i=0;i<position.count;i+=97){const p=new Vector3().fromBufferAttribute(position,i),rest=mesh.applyBoneTransform(i,p.clone());assert(rest.distanceTo(p)<.00001,c.id+' inverse bind restores geometry');}
  let greatestLegMotion=0;
  for(const runBlend of [0,1])for(const gaitPhase of [0,.8,1.6,2.4,3.2,4,4.8,5.6]){
   const pose=locomotionPose({gaitPhase,runBlend,poseWeight:1,animationTime:1});
   for(const name of joints){const n=gltf.scene.getObjectByName(name),original=base.get(name),r=pose.rotations[name]??[pose.angles[name]??0,0,0];n.position.copy(original.position).add(new Vector3(...(pose.translations[name]??[0,0,0])));n.quaternion.copy(original.quaternion).multiply(new ThreeQuaternion().setFromEuler(new Euler(...r,'ZYX')));}
   gltf.scene.updateMatrixWorld(true);mesh.skeleton.update();
   for(let i=0;i<position.count;i+=47){const p=new Vector3().fromBufferAttribute(position,i),deformed=mesh.applyBoneTransform(i,p.clone());assert([deformed.x,deformed.y,deformed.z].every(Number.isFinite));assert(deformed.length()<2.2,c.id+' bounded skinned pose');if(p.y<.7)greatestLegMotion=Math.max(greatestLegMotion,deformed.distanceTo(p));}
   if(runBlend===1&&(gaitPhase===1.6||gaitPhase===4.8)){
    const deformed=restVertices.map((p,i)=>mesh.applyBoneTransform(i,p.clone())),index=geometry.index;
    for(let t=0;t<index.count;t+=3)for(let edge=0;edge<3;edge++){
     const a=index.getX(t+edge),b=index.getX(t+(edge+1)%3),before=restVertices[a].distanceTo(restVertices[b]),after=deformed[a].distanceTo(deformed[b]);
     assert(after-before<.16,`${c.id}: a small surface edge must not turn into a stretched hand/cloth strip during sprinting`);
    }
   }
  }
  assert(greatestLegMotion>.25,c.id+' legs move instead of remaining a static statue');
 }
});
test('selection changes only the appearance and preserves entity animation and position',()=>{
 const entity=new Entity({position:new Cartesian3(1,2,3),model:new ModelGraphics({uri:CHARACTERS[0].uri,nodeTransformations:{LeftLeg:{}}})}),time=JulianDate.now(),position=entity.position,nodeTransforms=entity.model.nodeTransformations;
 for(const c of CHARACTERS){assert.equal(selectCharacter(entity,c.id),c);assert.equal(entity.model.uri.getValue(time),c.uri);assert.equal(entity.position,position);assert.equal(entity.model.nodeTransformations,nodeTransforms);}
 const prior=entity.model.uri.getValue(time);assert.throws(()=>selectCharacter(entity,'unknown'),RangeError);assert.equal(entity.model.uri.getValue(time),prior);
 assert.equal(selectCharacter(entity,'officer').id,'pedestrian');assert.equal(selectCharacter(entity,'courier').id,'commuter');
});
test('every character primitive enables Cesium custom shading with its real surface accessor',async()=>{
 const shader=createCharacterShader();try{
  for(const c of CHARACTERS){
   const bytes=await readFile('public'+c.uri.split('?')[0]),gltf=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
   for(const mesh of gltf.meshes)for(const primitive of mesh.primitives){
    const accessor=gltf.accessors[primitive.attributes._SURFACE];assert(accessor,c.id+' surface accessor');assert.equal(accessor.type,'VEC3');assert.equal(accessor.componentType,5121);assert.equal(accessor.normalized,true);
    const attributes=Object.entries(primitive.attributes).map(([name,index])=>({name,type:gltf.accessors[index].type,semantic:name.startsWith('_')?undefined:name.split('_')[0],setIndex:name==='TEXCOORD_0'||name==='COLOR_0'?0:undefined}));
    const resources={shaderBuilder:new ShaderBuilder(),model:{customShader:shader},alphaOptions:{},lightingOptions:{},uniformMap:{}};
    CustomShaderPipelineStage.process(resources,{attributes},{});
    assert(resources.shaderBuilder._fragmentShaderParts.defineLines.includes('HAS_CUSTOM_FRAGMENT_SHADER'),c.id+' shader remains enabled');
    const struct=resources.shaderBuilder._structs[CustomShaderPipelineStage.STRUCT_ID_ATTRIBUTES_FS];assert(struct.fields.includes('    vec3 surface;'),c.id+' normalized surface input');
   }
  }
 }finally{shader.destroy();}
});
