import './helpers/loaded-rigs.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {EntityCollection,Event,Matrix4,JulianDate} from 'cesium';
import {createAvatar} from '../src/avatar.js';
import motion from '../public/data/african-motion.json' with {type:'json'};

test('Streetheart civilian uses uploaded walk/run, neutral idle and car-hit-only anger; officer stays independent',()=>{
 const b=fs.readFileSync('public/characters/african-meshy.glb');
 const g=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)));
 assert.equal(g.skins.length,1);
 assert.deepEqual(g.animations.map(a=>a.name),['Running','Walking','Stand_Talking_Angry']);
 const arm=Object.keys(motion.nodes).find(n=>n.endsWith('LeftForeArm'));
 const p={position:{x:0,y:0,z:0},poseWeight:1,runBlend:0,gaitPhase:0,animationTime:0};
 const viewer={entities:new EntityCollection(),scene:{preRender:new Event()},camera:{inverseViewMatrix:Matrix4.IDENTITY}};
 const a=createAvatar(viewer,()=>p,{designId:'african',characterId:'explorer'});
 try{
  const pose=()=>a.entity.model.nodeTransformations.getValue(JulianDate.now());
  assert.match(a.entity.model.uri.getValue(),/african-meshy/);
  const walk=pose()[arm].rotation;p.runBlend=1;assert.notDeepEqual(pose()[arm].rotation,walk);
  p.poseWeight=0;const idle=pose()[arm].rotation;p.animationTime=2;
  assert.deepEqual(pose()[arm].rotation,idle);
  p.carHitAt=1.5;assert.notDeepEqual(pose()[arm].rotation,idle);
  p.animationTime=6;assert.deepEqual(pose()[arm].rotation,idle);
  a.select('pedestrian');viewer.scene.preRender.raiseEvent();
  assert.match(a.entity.model.uri.getValue(),/african_officer-meshy\.glb/);
  assert.equal(a.entity.model.customShader.getValue().uniforms.u_skeletal.value,1);
 }finally{a.destroy();}
});
