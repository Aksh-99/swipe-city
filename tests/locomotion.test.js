import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {Box3,Vector3} from 'three';
import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {Player,FIXED_STEP} from '../src/player.js';import {locomotionPose} from '../src/locomotion-pose.js';
// Geometry/bind checks only; image payloads and shader compatibility are
// checked separately. This is not a browser/WebGL render.
globalThis.self??=globalThis;
globalThis.createImageBitmap??=async()=>({width:2048,height:2048,close(){}});
const world={ready:()=>true,resolve:p=>p,ground:()=>0};
test('model exposes articulated ankles, torso and head without changing the physics height',async()=>{
 const b=await readFile('public/player.glb'),g=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString());const names=new Set(g.nodes.map(n=>n.name));for(const name of ['Player','UpperBody','Head','LeftAnkle','RightAnkle','LeftLeg','RightArm'])assert(names.has(name),name);
 assert.equal(g.nodes.find(n=>n.name==='LeftLeg').translation[1],.88);
});
test('gait has opposing arm/leg motion, finite poses and restrained upper-body movement',()=>{
 for(const run of [0,1])for(let phase=0;phase<Math.PI*2;phase+=.1){const pose=locomotionPose({poseWeight:1,runBlend:run,gaitPhase:phase});
  assert(pose.angles.LeftLeg*pose.angles.LeftArm<=.07,'arms counterbalance legs');assert(Math.abs(pose.angles.LeftLeg+pose.angles.RightLeg)<1e-8);
  assert(Math.abs(pose.rotations.UpperBody[0])<.16);assert(Math.abs(pose.translations.Player[1])<.025);
  assert([...Object.values(pose.angles),...Object.values(pose.rotations).flat(),...Object.values(pose.translations).flat()].every(Number.isFinite));
 }
});
test('start, sprint and stop poses blend continuously and settle while gait stops',()=>{
 const p=new Player(world);let prior=locomotionPose(p);
 for(let i=0;i<240;i++){const keys=new Set(i<60?['ArrowUp']:i<150?['ArrowUp','ShiftLeft']:[]);p.update(FIXED_STEP,keys,0);const pose=locomotionPose(p);for(const key of Object.keys(pose.angles))assert(Math.abs(pose.angles[key]-prior.angles[key])<.35,`${key} transition continuity`);prior=pose;}
 assert.equal(p.speed,0);assert.equal(p.poseWeight,0);const phase=p.gaitPhase;p.update(FIXED_STEP,new Set(),0);assert.equal(p.gaitPhase,phase);assert.equal(locomotionPose(p).angles.LeftLeg,0);
});

test('human asset retains metre scale, skin detail and bounded render batches',async()=>{
 const b=await readFile('public/player.glb'),gltf=await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');gltf.scene.updateMatrixWorld(true);
 const bounds=new Box3().setFromObject(gltf.scene),size=bounds.getSize(new Vector3());assert(size.y>1.7&&size.y<1.82,'human height fits the controller');assert(bounds.min.y>=-.00001&&bounds.min.y<.02,'shoe sole meets the feet datum');assert(size.x<.65,'standing body fits capsule width');
 let meshes=0;gltf.scene.traverse(n=>{if(n.isMesh){meshes++;assert(n.geometry.attributes.position.array.every(Number.isFinite));}});assert.equal(meshes,1,'one skinned surface preserves the supplied model');assert(b.byteLength<4_000_000,'bounded textured character download');
});
