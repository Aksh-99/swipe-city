import './helpers/loaded-rigs.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {EntityCollection,Event,Matrix4,JulianDate} from 'cesium';
import {createAvatar} from '../src/avatar.js';
import {skeletalPose} from '../src/skeletal-motion.js';

test('uploaded civilians and officers use independent clips and preserve paired designs',()=>{
 for(const [design,character] of [['asian','explorer'],['african','pedestrian'],['african_fem','pedestrian']]){
  const p={position:{x:0,y:0,z:0},gaitPhase:0,poseWeight:1,runBlend:0,animationTime:0};
  const viewer={entities:new EntityCollection(),scene:{preRender:new Event()},camera:{inverseViewMatrix:Matrix4.IDENTITY}};
  const a=createAvatar(viewer,()=>p,{designId:design,characterId:character});
  try{
   const pose=()=>a.entity.model.nodeTransformations.getValue(JulianDate.now());
   const name='mixamorig:LeftForeArm',walk=pose()[name].rotation;
   p.runBlend=1;assert.notDeepEqual(pose()[name].rotation,walk);
   p.poseWeight=0;const idle=pose()[name].rotation;p.animationTime=2;
   assert.deepEqual(pose()[name].rotation,idle);
   p.carHitAt=1.5;assert.notDeepEqual(pose()[name].rotation,idle);
   p.animationTime=6;assert.deepEqual(pose()[name].rotation,idle);
   const other=character==='pedestrian'?'explorer':'pedestrian';a.select(other);
   viewer.scene.preRender.raiseEvent();assert.equal(a.entity.model.customShader.getValue().uniforms.u_skeletal.value,1);
   assert.deepEqual(Object.values(pose()[name].rotation),skeletalPose(p,design,other)[name].rotation);
   a.select(character);assert.deepEqual(pose()[name].rotation,idle);
  }finally{a.destroy();}
 }
});
