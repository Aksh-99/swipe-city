import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {EntityCollection,Event,Matrix4} from 'cesium';
import {createAvatar} from '../src/avatar.js';
import {createRigStore,skeletalRigReady,loadSkeletalRig,SKELETAL_BONES} from '../src/skeletal-motion.js';
import {CHARACTER_DESIGNS} from '../src/character-designs.js';
const rig={nodes:{},clips:{walking:{},running:{}}};
const fixture=()=>({entities:new EntityCollection(),scene:{preRender:new Event(),requestRender(){}},camera:{inverseViewMatrix:Matrix4.IDENTITY}});
const player={position:{x:0,y:0,z:0},gaitPhase:0,poseWeight:1,runBlend:0};
test('cold avatar loads only its requested rig, stays hidden until ready, and switches safely to uniform',async()=>{
 for(const {id} of CHARACTER_DESIGNS)for(const role of ['explorer','pedestrian'])assert.equal(skeletalRigReady(id,role),false);
 const avatar=createAvatar(fixture(),()=>player,{designId:'irish'});
 try{
  assert.equal(avatar.entity.model.show.getValue(),false);
  await avatar.ready();assert.equal(avatar.entity.model.show.getValue(),true);
  assert(skeletalRigReady('irish','explorer'));assert.equal(skeletalRigReady('irish','pedestrian'),false);
  for(const {id} of CHARACTER_DESIGNS.filter(d=>d.id!=='irish'))assert.equal(skeletalRigReady(id,'explorer'),false);
  avatar.select('pedestrian');assert.equal(avatar.entity.model.show.getValue(),false);
  await avatar.ready();assert.equal(avatar.entity.model.show.getValue(),true);
  assert.match(avatar.entity.model.uri.getValue(),/irish_officer/);
 }finally{avatar.destroy();}
});
test('distant avatar defers both model and animation until it enters view',async()=>{
 const viewer=fixture();let visible=false;
 const avatar=createAvatar(viewer,()=>player,{designId:'asian',show:()=>visible});
 try{
  viewer.scene.preRender.raiseEvent();await new Promise(r=>setImmediate(r));
  assert.equal(skeletalRigReady('asian','explorer'),false);assert.equal(avatar.entity.model.uri?.getValue(),undefined);
  visible=true;viewer.scene.preRender.raiseEvent();assert.equal(avatar.entity.model.show.getValue(),false);
  await avatar.ready();assert.equal(avatar.entity.model.show.getValue(),true);assert.match(avatar.entity.model.uri.getValue(),/asian-meshy/);
 }finally{avatar.destroy();}
});
test('a destroyed avatar does not revive after an in-flight animation finishes',async()=>{
 const viewer=fixture(),avatar=createAvatar(viewer,()=>player,{designId:'indian_fem'}),ready=avatar.ready();
 avatar.destroy();await ready;assert.equal(viewer.entities.values.length,0);assert.equal(viewer.scene.preRender.numberOfListeners,0);
});
test('duplicate rig requests share a download and cached rigs need no second request',async()=>{
 let calls=0,finish;const store=createRigStore({a:()=>{calls++;return new Promise(r=>finish=r);}});
 const first=store.load('a'),second=store.load('a');assert.equal(first,second);
 await new Promise(r=>setImmediate(r));assert.equal(calls,1);finish({default:rig});await first;
 assert.equal(await store.load('a'),rig);assert.equal(calls,1);
});
test('failed and timed-out rigs can retry without blocking other characters',async()=>{
 let calls=0;const store=createRigStore({a:()=>{if(!calls++)throw new Error('offline');return rig;},b:()=>rig},{concurrency:1});
 await assert.rejects(store.load('a'),/offline/);assert.equal(await store.load('b'),rig);assert.equal(await store.load('a'),rig);
 let hang=true;const timed=createRigStore({a:()=>hang?new Promise(()=>{}):rig,b:()=>rig},{concurrency:1,timeoutMs:5});
 await assert.rejects(timed.load('a'),/timed out/);assert.equal(await timed.load('b'),rig);hang=false;assert.equal(await timed.load('a'),rig);
});
test('animation loading is bounded during a crowd arrival',async()=>{
 let active=0,max=0;const loaders=Object.fromEntries(Array.from({length:20},(_,i)=>[i,async()=>{active++;max=Math.max(max,active);await new Promise(r=>setImmediate(r));active--;return rig;}]));
 const store=createRigStore(loaders);await Promise.all(Object.keys(loaders).map(k=>store.load(k)));assert.equal(max,2);
});
test('small bone manifest covers every original civilian and officer rig',()=>{
 const names=new Set(SKELETAL_BONES);
 for(const {id} of CHARACTER_DESIGNS)for(const suffix of ['', '_officer']){
  const data=JSON.parse(fs.readFileSync(`public/data/${id}${suffix}-motion.json`));
  for(const name of Object.keys(data.nodes))assert(names.has(name),id+suffix+': '+name);
 }
});
