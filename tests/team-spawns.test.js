import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {Vector3} from 'three';
import {CollisionWorld} from '../src/collision.js';import {spawnState} from '../server/match-rules.js';
test('all twenty spawn points are separate and clear above walkable ground of real Times Square geometry',async t=>{
 t.mock.method(globalThis,'fetch',async url=>new Response(await readFile(new URL('../public'+url,import.meta.url))));
 const manifest=JSON.parse(await readFile(new URL('../public/data/nyc/manifest.json',import.meta.url))),world=new CollisionWorld(manifest.files);await world.stream(new Vector3());
 for(const id of ['plaza','streetscape','storefront','nypd-plaza','nasdaq','street-vendor','hard-rock-food','recruiting','lyric','district']){const m=await import(`../src/${id}-geometry.js`),create=Object.entries(m).find(([key])=>/^create.*Geometry$/.test(key))[1];world.addStatic(id,create().collision);}
 for(let i=0;i<20;i++){const p=new Vector3(...spawnState(i).position);assert(world.resolve(p.clone(),.34,1.78).distanceTo(p)<.02,'spawn '+i+' is clear');assert(Math.abs(world.ground(p,.34)-p.z)<.35,'spawn '+i+' is grounded');for(let j=0;j<i;j++)assert(p.distanceTo(new Vector3(...spawnState(j).position))>.75);}
});
test('random match spawn pool and all five police station slots are clear of complete authored scenery and vehicles',async()=>{
 const {spawnValidationWorld}=await import('../scripts/spawn-validation-world.mjs'),{RANDOM_SPAWN_POINTS:D}=await import('../server/match-rules.js'),{world}=await spawnValidationWorld();
 for(const [i,position]of [...D.officers,...D.civilian.map(p=>p.position)].entries()){const p=new Vector3(...position);assert(world.resolve(p.clone(),.4,1.78).distanceTo(p)<.02,'clear point '+i);assert(Math.abs(world.ground(p,.34)-p.z)<.02,'ground point '+i);}
 const front=new Vector3(...D.stationFront);for(const position of D.officers)assert(new Vector3(...position).distanceTo(front)<12);assert(D.civilian.length>=100);
});
