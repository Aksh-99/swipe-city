import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Vector3 } from 'three';
import { CollisionWorld } from '../src/collision.js';
import { Player,movement,FIXED_STEP } from '../src/player.js';
const manifest=JSON.parse(await readFile(new URL('../public/data/nyc/manifest.json',import.meta.url)));
const nativeFetch=globalThis.fetch;
globalThis.fetch=async url=>new Response(await readFile(new URL('../public'+url,import.meta.url)));
const collision=new CollisionWorld(manifest.files);
await collision.stream(new Vector3());
test('real Times Square spawn is open, with nearby source colliders ready',()=>{
  assert(collision.ready(new Vector3()));
  assert.equal(collision.ray(new Vector3(0,0,700),new Vector3(0,0,-1),701),null);
  assert(collision.loaded.size>0&&collision.loaded.size<manifest.files.length);
});
test('diagonal input preserves walk speed and camera-relative directions',()=>{
  assert(Math.abs(movement(new Set(['KeyW','KeyD']),0).length()-1)<1e-10);
  assert(Math.abs(movement(new Set(['KeyW']),Math.PI/2).x-1)<1e-10);
});
test('walking, running, gravity and reset have expected metre-scale behavior',()=>{
  const open={ready:()=>true,resolve:()=>{},ground:()=>0};
  const player=new Player(open);
  for(let i=0;i<60;i++)player.update(FIXED_STEP,new Set(['KeyW']),0);
  assert(player.position.y>2.9&&player.position.y<3.2);assert(Math.abs(player.speed-3.2)<.001);assert.equal(player.position.z,0);
  player.reset();for(let i=0;i<60;i++)player.update(FIXED_STEP,new Set(['KeyW','ShiftLeft']),0);
  assert(player.position.y>6.5&&player.position.y<8);assert(Math.abs(player.speed-8)<.001);
  player.position.z=2;for(let i=0;i<120;i++)player.update(FIXED_STEP,new Set(),0);
  assert.equal(player.position.z,0);assert(player.grounded);player.reset();assert.deepEqual(player.position.toArray(),[0,0,.05]);
});
test('capsule blocks an actual NYC wall and does not tunnel while running',()=>{
  let direction,hit;
  for(let i=0;i<64;i++){
    const d=new Vector3(Math.sin(i*Math.PI/32),Math.cos(i*Math.PI/32),0);
    const h=collision.ray(new Vector3(0,0,1),d,100);
    if(h&&(!hit||h.distance<hit.distance)){hit=h;direction=d;}
  }
  assert(hit,'Source must contain a real wall near Times Square');
  const player=new Player(collision);const yaw=Math.atan2(direction.x,direction.y);
  for(let i=0;i<240;i++)player.update(FIXED_STEP,new Set(['KeyW','ShiftLeft']),yaw);
  // Sliding along an oblique facade is allowed; penetrating its footprint is not.
  assert.equal(collision.ray(player.position.clone().setZ(700),new Vector3(0,0,-1),699),null);
  for(let i=0;i<64;i++){
    const d=new Vector3(Math.sin(i*Math.PI/32),Math.cos(i*Math.PI/32),0);
    const contact=collision.ray(player.position.clone().setZ(1),d,.30);
    assert.equal(contact,null,'Capsule center entered a real source wall');
  }
  assert(player.position.z<.3,'No wall-climbing or roof teleport');
});
test('movement pauses before entering a region whose collider is not ready',()=>{
  const player=new Player({ready:()=>false});player.update(FIXED_STEP,new Set(['KeyW']),0);
  assert.deepEqual(player.position.toArray(),[0,0,.05]);assert.equal(player.speed,0);
});
