import './helpers/loaded-rigs.js';
import{designModelUri}from'../src/character-designs.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {EntityCollection,Event,JulianDate,Matrix4,Quaternion,Color} from 'cesium';
import {PLAYER_COLORS} from '../src/multiplayer-debug.js';
import {Vector3} from 'three';
import {createAvatar} from '../src/avatar.js';
import {CHARACTERS} from '../src/characters.js';
import {DEFAULT_ROOM_STATE} from '../src/room-protocol.js';
import {toLocal} from '../src/coordinates.js';
import {createPlayerSession} from '../src/player-session.js';

test('four real Cesium avatar adapters preserve independent positions, joints and shaders',()=>{
 const viewer={entities:new EntityCollection(),scene:{preRender:new Event()},camera:{inverseViewMatrix:Matrix4.IDENTITY}};
 const states=CHARACTERS.map((c,i)=>({...DEFAULT_ROOM_STATE,position:new Vector3(i*3,0,.17),heading:i*.4,poseWeight:1,gaitPhase:i*.5}));
 const avatars=CHARACTERS.map((c,i)=>createAvatar(viewer,()=>states[i],{characterId:c.id,...(i?{name:'Guest '+i,slot:i}:{})}));
 const time=JulianDate.now();
 try{
  assert.equal(viewer.entities.values.length,7);assert.equal(viewer.scene.preRender.numberOfListeners,4);
  assert.equal(new Set(avatars.map(a=>a.lighting.shader)).size,4);
  for(let i=0;i<4;i++){
   const entity=avatars[i].entity,position=toLocal(entity.position.getValue(time));
   assert(Math.abs(position.x-i*3)<1e-8);assert.equal(entity.model.uri.getValue(time),designModelUri('white_male',CHARACTERS[i].id==='pedestrian'));
   const rotation=entity.model.nodeTransformations.getValue(time).LeftLeg.rotation;
   assert(Object.values(rotation).every(Number.isFinite));
   avatars[i].setDebugPlayer(i);assert.equal(avatars[i].label.label.text.getValue(time),`Player ${i+1}`);assert(Color.equals(entity.model.color.getValue(time),Color.fromCssColorString(PLAYER_COLORS[i])));
  }
  assert.equal(viewer.entities.values.length,8,'four original models with four debug labels');
  const unchanged=avatars[1].entity.model.nodeTransformations.getValue(time).LeftLeg.rotation;
  states[0].position.x=15;states[0].gaitPhase=1.5;
  assert(Math.abs(toLocal(avatars[0].entity.position.getValue(time)).x-15)<1e-8);
  assert(Quaternion.equals(unchanged,avatars[1].entity.model.nodeTransformations.getValue(time).LeftLeg.rotation));
  const standingKnee=avatars[0].entity.model.nodeTransformations.getValue(time).LeftKnee.rotation;
  states[0].airBlend=1;
  assert(!Quaternion.equals(standingKnee,avatars[0].entity.model.nodeTransformations.getValue(time).LeftKnee.rotation),'a stationary jump updates joints even when the walk phase/time is unchanged');
  viewer.scene.preRender.raiseEvent();
  avatars[0].select('tourist');assert.equal(avatars[0].entity.model.uri.getValue(time),designModelUri('white_male',false));
  assert.equal(avatars[2].entity.model.uri.getValue(time),designModelUri('white_male',true));
 }finally{for(const avatar of avatars)avatar.destroy();}
 assert.equal(viewer.entities.values.length,0);assert.equal(viewer.scene.preRender.numberOfListeners,0);
});

test('normal play has no floating player number or debug tint; explicit debug mode still provides both',async()=>{
 const viewer={entities:new EntityCollection(),scene:{preRender:new Event()},camera:{inverseViewMatrix:Matrix4.IDENTITY}},state={...DEFAULT_ROOM_STATE,position:new Vector3(0,0,.17)};
 const avatar=createAvatar(viewer,()=>state),self={id:'self',slot:3,number:4,characterId:'commuter'};
 const options={localAvatar:avatar,remotePlayers:{sync(){}},prepareSpawn:async()=>{}};
 try{
  const normal=createPlayerSession(options);await normal.onJoin(self,{matchPhase:'waiting'});assert.equal(avatar.label,null);assert(Color.equals(avatar.entity.model.color.getValue(JulianDate.now()),Color.WHITE));assert.equal(avatar.entity.model.colorBlendAmount.getValue(),0);
  await createPlayerSession({...options,debugPlayers:true}).onJoin(self,{matchPhase:'waiting'});assert.equal(avatar.label.label.text.getValue(), 'Player 4');assert.equal(avatar.label.label.show.getValue(),true);
  normal.onSnapshot({players:[self]},'self');assert.equal(avatar.label.label.show.getValue(),false);assert.equal(avatar.entity.model.colorBlendAmount.getValue(),0);
 }finally{avatar.destroy();}
});
