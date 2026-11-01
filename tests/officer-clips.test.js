import './helpers/loaded-rigs.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {EntityCollection,Event,Matrix4,JulianDate} from 'cesium';
import {createAvatar} from '../src/avatar.js';
import {usesSkeletalRig} from '../src/skeletal-motion.js';

for(const design of ['indian','asian','bald','irish']){
 test(`${design} uploaded officer walks and runs while civilian keeps its own model and gait`,()=>{
  const model=fs.readFileSync(`public/characters/${design}_officer-meshy.glb`);
  const g=JSON.parse(model.subarray(20,20+model.readUInt32LE(12)));
  assert.equal(g.skins.length,1);
  assert.deepEqual(g.animations.map(a=>a.name),['Running','Walking','Stand_Talking_Angry']);
  const data=JSON.parse(fs.readFileSync(`public/data/${design}_officer-motion.json`));
  const arm=Object.keys(data.nodes).find(name=>name.endsWith('LeftForeArm'));
  const player={position:{x:0,y:0,z:0},gaitPhase:0,poseWeight:1,runBlend:0,animationTime:0};
  const viewer={entities:new EntityCollection(),scene:{preRender:new Event()},camera:{inverseViewMatrix:Matrix4.IDENTITY}};
  const avatar=createAvatar(viewer,()=>player,{designId:design,characterId:'pedestrian'});
  try{
   const pose=()=>avatar.entity.model.nodeTransformations.getValue(JulianDate.now());
   assert(usesSkeletalRig(design,'pedestrian'));assert.equal(usesSkeletalRig(design,'explorer'),true);
   assert.match(avatar.entity.model.uri.getValue(),new RegExp(design+'_officer-meshy'));
   const walk=pose()[arm].rotation;player.runBlend=1;
   assert.notDeepEqual(pose()[arm].rotation,walk);
   player.poseWeight=0;const idle=pose()[arm].rotation;player.animationTime=2;
   assert.deepEqual(pose()[arm].rotation,idle,'normal idle never plays angry standing');
   avatar.select('explorer');viewer.scene.preRender.raiseEvent();
   assert.equal(avatar.entity.model.customShader.getValue().uniforms.u_skeletal.value,1);
   assert.match(avatar.entity.model.uri.getValue(),new RegExp('/'+design+'-meshy'+'\\.glb'));
   avatar.select('pedestrian');viewer.scene.preRender.raiseEvent();
   assert.equal(avatar.entity.model.customShader.getValue().uniforms.u_skeletal.value,1);
   assert.deepEqual(pose()[arm].rotation,idle);
  }finally{avatar.destroy();}
 });
}
