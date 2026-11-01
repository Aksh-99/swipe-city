import test from 'node:test';
import assert from 'node:assert/strict';
import {Vector3} from 'three';
import {CollisionWorld} from '../src/collision.js';
import {DetailMesh} from '../src/detail-mesh.js';
import {Player,FIXED_STEP,turnToward} from '../src/player.js';
import {ThirdPersonCamera} from '../src/camera.js';
import {toLocal} from '../src/coordinates.js';
const flat=()=>({ready:()=>true,resolve:p=>p,ground:()=>0});
const forward=new Set(['ArrowUp']),sprint=new Set(['ArrowUp','ShiftLeft']);
const ticks=(p,n,keys,yaw=0)=>{for(let i=0;i<n;i++)p.update(FIXED_STEP,keys,yaw);};
test('speed ramps, brakes promptly, and sprint blends into a walk on release',()=>{
 const p=new Player(flat());p.update(FIXED_STEP,forward,0);assert(p.speed>0&&p.speed<1);
 ticks(p,30,forward);assert(Math.abs(p.speed-3.2)<1e-8);
 ticks(p,30,sprint);assert(Math.abs(p.speed-8)<1e-8);assert.equal(p.runBlend,1);
 ticks(p,15,forward);assert(Math.abs(p.speed-3.2)<1e-8);assert.equal(p.runBlend,0);
 const start=p.position.clone();ticks(p,15,new Set());assert.equal(p.speed,0);assert(p.position.distanceTo(start)<.20,'short walk braking distance');
 ticks(p,30,sprint);const stop=p.position.clone();ticks(p,20,new Set());assert.equal(p.speed,0);assert(p.position.distanceTo(stop)<1.1,'sprint brakes within about a metre');
});
test('turns use the shortest angle and directional input stays camera-relative',()=>{
 assert(Math.abs(turnToward(Math.PI-.03,-Math.PI+.03,.02)-(Math.PI-.01))<1e-8);
 const p=new Player(flat());ticks(p,30,forward);const old=p.heading,position=p.position.clone();p.update(FIXED_STEP,new Set(['ArrowRight']),0);
 assert(p.heading>old&&p.heading<Math.PI/2);assert(p.position.x>position.x);assert(Math.abs(p.position.y-position.y)<1e-8);
 ticks(p,20,new Set(['ArrowRight']));assert(Math.abs(p.heading-Math.PI/2)<1e-8);
});
test('blocked movement does not animate a full-speed run and wall sliding stays solid',()=>{
 const mesh=new DetailMesh(),world=new CollisionWorld([]);mesh.box(new Vector3(0,3,2),new Vector3(1,0,0),new Vector3(0,1,0),30,.04,4,null,true);world.addStatic('wall',new Float32Array(mesh.collision));
 const p=new Player(world);ticks(p,120,sprint);assert(p.position.y<2.67);assert(p.speed<.05);assert.equal(p.running,false);const gait=p.gaitPhase;ticks(p,30,sprint);assert(Math.abs(p.gaitPhase-gait)<.02);
 const before=p.position.clone();ticks(p,60,new Set(['ArrowUp','ArrowRight','ShiftLeft']));assert(p.position.x>before.x+4);assert(p.position.y<2.67);assert(p.position.z<.03);
});
test('streaming pause and reset clear motion rather than carrying sprint inertia',()=>{
 let ready=true;const world={...flat(),ready:()=>ready},p=new Player(world);ticks(p,30,sprint);ready=false;const start=p.position.clone();ticks(p,30,sprint);assert(p.position.equals(start));assert.equal(p.commandSpeed,0);
 ready=true;p.update(FIXED_STEP,sprint,0);assert(p.speed<1);p.grounded=false;p.reset();assert(p.grounded);assert.equal(p.commandSpeed,0);assert.equal(p.runBlend,0);
});
test('camera volume sees off-center poles and eases out after collision clears',()=>{
 const mesh=new DetailMesh(),world=new CollisionWorld([]);mesh.box(new Vector3(.13,-2,1.6),new Vector3(1,0,0),new Vector3(0,1,0),.08,.10,1,null,true);world.addStatic('pole',new Float32Array(mesh.collision));
 const target=new Vector3(0,0,1.6),direction=new Vector3(0,-1,0);assert.equal(world.ray(target,direction,6),null);assert(world.cameraCast(target,direction,6,.16));
 let observed;const camera=new ThirdPersonCamera({camera:{frustum:{},setView:v=>observed=toLocal(v.destination)}},world);camera.yaw=0;camera.pitch=0;camera.update({position:new Vector3()});assert(observed.y>-1.9);
 const close=camera.distanceToPlayer;world.loaded.delete('pole');camera.update({position:new Vector3()});assert(camera.distanceToPlayer>close&&camera.distanceToPlayer<camera.distance);
 for(let i=0;i<120;i++)camera.update({position:new Vector3()});assert(Math.abs(camera.distanceToPlayer-camera.distance)<.001);
 camera.zoom(-10000);assert.equal(camera.distance,2.5);camera.zoom(10000);assert.equal(camera.distance,9.5);
});
