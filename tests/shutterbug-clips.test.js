import './helpers/loaded-rigs.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {EntityCollection,Event,Matrix4,JulianDate} from 'cesium';
import {createAvatar} from '../src/avatar.js';
import motion from '../public/data/indian_fem-motion.json' with {type:'json'};

test('Shutterbug uses uploaded movement, neutral idle and car-hit-only angry reaction; officer keeps its own model',()=>{
 const b=fs.readFileSync('public/characters/indian_fem-meshy.glb');
 const g=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)));
 assert.equal(g.skins.length,1);
 assert.deepEqual(g.animations.map(a=>a.name),['Running','Walking','Stand_Talking_Angry']);
 const arm=Object.keys(motion.nodes).find(name=>name.endsWith('LeftForeArm'));
 const player={position:{x:0,y:0,z:0},poseWeight:1,runBlend:0,gaitPhase:0,animationTime:0};
 const viewer={entities:new EntityCollection(),scene:{preRender:new Event()},camera:{inverseViewMatrix:Matrix4.IDENTITY}};
 const avatar=createAvatar(viewer,()=>player,{designId:'indian_fem',characterId:'explorer'});
 try{
  const pose=()=>avatar.entity.model.nodeTransformations.getValue(JulianDate.now());
  assert.match(avatar.entity.model.uri.getValue(),/indian_fem-meshy/);
  const walk=pose()[arm].rotation;player.runBlend=1;
  assert.notDeepEqual(pose()[arm].rotation,walk);
  player.gaitPhase=Math.PI;assert.notDeepEqual(pose()[arm].rotation,walk);
  player.poseWeight=0;const idle=pose()[arm].rotation;
  player.animationTime=2;assert.deepEqual(pose()[arm].rotation,idle);
  player.carHitAt=1.5;assert.notDeepEqual(pose()[arm].rotation,idle);
  player.animationTime=6;assert.deepEqual(pose()[arm].rotation,idle);
  avatar.select('pedestrian');viewer.scene.preRender.raiseEvent();
  assert.match(avatar.entity.model.uri.getValue(),/indian_fem_officer-meshy\.glb/);
  assert.equal(avatar.entity.model.customShader.getValue().uniforms.u_skeletal.value,1);
 }finally{avatar.destroy();}
});
