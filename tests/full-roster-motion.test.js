import './helpers/loaded-rigs.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {EntityCollection,Event,Matrix4,JulianDate} from 'cesium';
import {CHARACTER_DESIGNS} from '../src/character-designs.js';
import {createAvatar} from '../src/avatar.js';
for(const {id} of CHARACTER_DESIGNS) for(const character of ['explorer','pedestrian']) {
 test(`${id} ${character} uses its own walk/run and car-hit-only angry clip`,()=>{
  const key=id+(character==='pedestrian'?'_officer':'');
  const data=JSON.parse(fs.readFileSync(`public/data/${key}-motion.json`));
  const arm=Object.keys(data.nodes).find(name=>name.endsWith('LeftForeArm'));
  const p={position:{x:0,y:0,z:0},poseWeight:1,runBlend:0,gaitPhase:0,animationTime:0,carHitAt:-1};
  const viewer={entities:new EntityCollection(),scene:{preRender:new Event()},camera:{inverseViewMatrix:Matrix4.IDENTITY}};
  const avatar=createAvatar(viewer,()=>p,{designId:id,characterId:character});
  try {
   assert.match(avatar.entity.model.uri.getValue(),new RegExp('/'+key+'-meshy\\.glb'));
   const pose=()=>avatar.entity.model.nodeTransformations.getValue(JulianDate.now())[arm].rotation;
   const walking=pose();p.gaitPhase=Math.PI;assert.notDeepEqual(pose(),walking);
   p.runBlend=1;const running=pose();p.runBlend=0;assert.notDeepEqual(pose(),running);
   p.poseWeight=0;const idle=pose();p.animationTime=2;assert.deepEqual(pose(),idle);
   p.carHitAt=1.5;assert.notDeepEqual(pose(),idle);p.animationTime=6;assert.deepEqual(pose(),idle);
  } finally {avatar.destroy();}
 });
}
