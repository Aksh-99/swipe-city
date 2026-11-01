import './helpers/loaded-rigs.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {EntityCollection,Event,Matrix4,JulianDate} from 'cesium';
import {createAvatar} from '../src/avatar.js';
import {skeletalPose} from '../src/skeletal-motion.js';

test('blonde civilian uses weighted skeletal walk/run, with safe switches to hoodie and officer',()=>{
 const bytes=fs.readFileSync('public/characters/blonde-meshy.glb');
 const g=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)));
 assert.equal(g.skins.length,1);
 assert(g.meshes[0].primitives.every(p=>'WEIGHTS_0' in p.attributes && 'JOINTS_0' in p.attributes));
 assert(bytes.length<16_000_000);
 const player={position:{x:0,y:0,z:0},poseWeight:1,runBlend:1,gaitPhase:0};
 const viewer={entities:new EntityCollection(),scene:{preRender:new Event()},camera:{inverseViewMatrix:Matrix4.IDENTITY}};
 const avatar=createAvatar(viewer,()=>player,{designId:'blonde',characterId:'explorer'});
 try{
  const time=JulianDate.now(),pose=()=>avatar.entity.model.nodeTransformations.getValue(time);
  assert.match(avatar.entity.model.uri.getValue(),/blonde-meshy/);
  const first=pose()['mixamorig:LeftForeArm'].rotation;
  player.gaitPhase=Math.PI;
  assert.notDeepEqual(pose()['mixamorig:LeftForeArm'].rotation,first);
  const running=pose()['mixamorig:LeftLeg'].rotation;
  player.runBlend=0;
  assert.notDeepEqual(pose()['mixamorig:LeftLeg'].rotation,running);
  avatar.setDesign('white_male');
  const hoodie=skeletalPose(player,'white_male')['mixamorig:Hips'].translation;
  assert.deepEqual(Object.values(pose()['mixamorig:Hips'].translation),hoodie);
  avatar.setDesign('blonde');
  const blonde=skeletalPose(player,'blonde')['mixamorig:Hips'].translation;
  assert.deepEqual(Object.values(pose()['mixamorig:Hips'].translation),blonde);
  player.poseWeight=0;
  assert.deepEqual(Object.values(pose()['mixamorig:LeftForeArm'].rotation),skeletalPose(player,'blonde')['mixamorig:LeftForeArm'].rotation);
  viewer.scene.preRender.raiseEvent();
  assert.equal(avatar.entity.model.customShader.getValue().uniforms.u_skeletal.value,1);
  avatar.select('pedestrian');
  viewer.scene.preRender.raiseEvent();
  assert.match(avatar.entity.model.uri.getValue(),/blonde_officer/);
  assert.equal(avatar.entity.model.customShader.getValue().uniforms.u_skeletal.value,1);
 }finally{avatar.destroy();}
});
