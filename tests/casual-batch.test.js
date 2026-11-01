import './helpers/loaded-rigs.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {EntityCollection,Event,Matrix4,JulianDate} from 'cesium';
import {createAvatar} from '../src/avatar.js';
import {skeletalPose} from '../src/skeletal-motion.js';

test('latest casual bald and hoodie models use their own clips and switch safely to uniforms',()=>{
 for(const design of ['bald','white_male']){
  const p={position:{x:0,y:0,z:0},gaitPhase:0,poseWeight:1,runBlend:0,animationTime:0};
  const viewer={entities:new EntityCollection(),scene:{preRender:new Event()},camera:{inverseViewMatrix:Matrix4.IDENTITY}};
  const a=createAvatar(viewer,()=>p,{designId:design,characterId:'explorer'});
  try{
   const pose=()=>a.entity.model.nodeTransformations.getValue(JulianDate.now());
   const arm='mixamorig:LeftForeArm',walk=pose()[arm].rotation;
   p.runBlend=1;assert.notDeepEqual(pose()[arm].rotation,walk);
   p.poseWeight=0;const idle=pose()[arm].rotation;p.animationTime=2;
   assert.deepEqual(pose()[arm].rotation,idle);
   p.carHitAt=1.5;assert.notDeepEqual(pose()[arm].rotation,idle);
   p.animationTime=6;assert.deepEqual(pose()[arm].rotation,idle);
   a.select('pedestrian');viewer.scene.preRender.raiseEvent();
   assert.equal(a.entity.model.customShader.getValue().uniforms.u_skeletal.value,1);
   assert.deepEqual(Object.values(pose()[arm].rotation),skeletalPose(p,design,'pedestrian')[arm].rotation);
   a.select('explorer');assert.deepEqual(pose()[arm].rotation,idle);
  }finally{a.destroy();}
 }
});
