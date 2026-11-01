import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Matrix4,Cartesian3,Quaternion} from 'cesium';
import ModelRuntimeNode from '../node_modules/@cesium/engine/Source/Scene/Model/ModelRuntimeNode.js';

for (const [design,height] of [['white_male', 1.7], ['white_male_officer', 1.7], ['bald', 1.7], ['bald_officer', 1.7], ['african', 1.7], ['african_officer', 1.7], ['asian', 1.7], ['asian_officer', 1.7], ['indian', 1.7], ['indian_officer', 1.7], ['african_fem', 1.7], ['african_fem_officer', 1.7], ['asian_fem', 1.7], ['asian_fem_officer', 1.7], ['blonde', 1.7], ['blonde_officer', 1.7], ['indian_fem', 1.7], ['indian_fem_officer', 1.7], ['irish', 1.7], ['irish_officer', 1.7]]) {
 test(`${design} remains human-sized through Cesium's actual joint-matrix update`,()=>{
  const bytes=fs.readFileSync(`public/characters/${design}-meshy.glb`);
  const length=bytes.readUInt32LE(12),g=JSON.parse(bytes.subarray(20,20+length)),bin=bytes.subarray(28+length);
  function accessor(id){
   const a=g.accessors[id],v=g.bufferViews[a.bufferView],columns={VEC3:3,VEC4:4,MAT4:16}[a.type];
   const size={5121:1,5123:2,5126:4}[a.componentType],offset=(v.byteOffset??0)+(a.byteOffset??0);
   return Array.from({length:a.count},(_,i)=>Array.from({length:columns},(_,j)=>{
    const at=offset+i*(v.byteStride??columns*size)+j*size;
    return a.componentType===5126?bin.readFloatLE(at):size===2?bin.readUInt16LE(at):bin.readUInt8(at);
   }));
  }
  const world=new Map();
  function visit(id,parent){
   const n=g.nodes[id],local=n.matrix?Matrix4.fromArray(n.matrix):Matrix4.fromTranslationQuaternionRotationScale(
    Cartesian3.fromArray(n.translation??[0,0,0]),new Quaternion(...(n.rotation??[0,0,0,1])),Cartesian3.fromArray(n.scale??[1,1,1]));
   const matrix=Matrix4.multiply(parent,local,new Matrix4());world.set(id,matrix);
   for(const child of n.children??[])visit(child,matrix);
  }
  for(const root of g.scenes[g.scene??0].nodes)visit(root,Matrix4.IDENTITY);
  const meshId=g.nodes.findIndex(n=>'skin'in n && 'mesh'in n),mesh=g.nodes[meshId],meshWorld=world.get(meshId);
  const skin=g.skins[mesh.skin],binds=accessor(skin.inverseBindMatrices);
  const joints=skin.joints.map((id,i)=>Matrix4.multiply(world.get(id),Matrix4.fromArray(binds[i]),new Matrix4()));
  const runtime={_runtimeSkin:{jointMatrices:joints,updateJointMatrices(){}},_computedJointMatrices:[],transformToRoot:meshWorld,transform:Matrix4.IDENTITY};
  ModelRuntimeNode.prototype.updateJointMatrices.call(runtime);
  const primitive=g.meshes[mesh.mesh].primitives[0],positions=accessor(primitive.attributes.POSITION),weights=accessor(primitive.attributes.WEIGHTS_0),ids=accessor(primitive.attributes.JOINTS_0);
  let min=Infinity,max=-Infinity;
  for(let i=0;i<positions.length;i++){
   const point=Cartesian3.fromArray(positions[i]),rendered=new Cartesian3();
   for(let k=0;k<4;k++){
    const transform=Matrix4.multiply(meshWorld,runtime._computedJointMatrices[ids[i][k]],new Matrix4());
    const p=Matrix4.multiplyByPoint(transform,point,new Cartesian3());
    Cartesian3.add(rendered,Cartesian3.multiplyByScalar(p,weights[i][k],p),rendered);
   }
   assert(Cartesian3.distance(rendered,point)<.0001,'skin retains its authored rest position');
   min=Math.min(min,rendered.y);max=Math.max(max,rendered.y);
  }
  assert(Math.abs(max-min-height)<.001,`visible height ${max-min} metres`);
  // Cesium also derives its unanimated bounds from mesh-world * accessor bounds.
  const a=g.accessors[primitive.attributes.POSITION];
  const top=Matrix4.multiplyByPoint(meshWorld,Cartesian3.fromArray(a.max),new Cartesian3());
  const bottom=Matrix4.multiplyByPoint(meshWorld,Cartesian3.fromArray(a.min),new Cartesian3());
  assert(top.y-bottom.y>1.6,'culling bounds are human-sized too');
 });
}
