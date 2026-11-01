import './helpers/loaded-rigs.js';
import test from 'node:test';import assert from 'node:assert/strict';
import {EntityCollection,Event,Matrix4} from 'cesium';import {createAvatar} from '../src/avatar.js';import {CHARACTER_DESIGNS,designModelUri} from '../src/character-designs.js';
test('all twenty uploaded designs receive independent changing run uniforms and settle on stopping',()=>{
 const viewer={entities:new EntityCollection(),scene:{preRender:new Event()},camera:{inverseViewMatrix:Matrix4.IDENTITY}};
 for(const d of CHARACTER_DESIGNS)for(const officer of [false,true]){
  const p={position:{x:0,y:0,z:0},poseWeight:1,runBlend:1,gaitPhase:Math.PI/2};
  const a=createAvatar(viewer,()=>p,{designId:d.id,characterId:officer?'pedestrian':'explorer'});
  try{assert.equal(a.entity.model.uri.getValue(),designModelUri(d.id,officer));viewer.scene.preRender.raiseEvent();const s=a.entity.model.customShader.getValue();assert(s.vertexShaderText.includes('vsOutput.positionMC=p'));
   const first=s.uniforms.u_leftLeg.value.x;assert(Math.abs(first)>.5);assert(first*s.uniforms.u_rightLeg.value.x<0);
   p.gaitPhase+=Math.PI;viewer.scene.preRender.raiseEvent();assert(first*s.uniforms.u_leftLeg.value.x<0);
   p.poseWeight=0;p.runBlend=0;viewer.scene.preRender.raiseEvent();assert.equal(s.uniforms.u_leftLeg.value.x,0);assert.equal(s.uniforms.u_leftLeg.value.y,0);
  }finally{a.destroy();}
 }
 assert.equal(viewer.scene.preRender.numberOfListeners,0);
});
