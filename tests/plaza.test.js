import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {Vector3} from 'three';import {CollisionWorld} from '../src/collision.js';import {Player,FIXED_STEP} from '../src/player.js';
import {createPlazaGeometry} from '../src/plaza-geometry.js';import {STEPS,STEPS_HEADING,BARRIERS,plazaPoint,plazaCoordinates} from '../src/plaza-layout.js';
import {makeStreetLayout} from '../src/street-layout.js';import {createSidewalkGeometry} from '../src/street-detail-geometry.js';
const manifest=JSON.parse(await readFile(new URL('../public/data/nyc/manifest.json',import.meta.url)));globalThis.fetch=async url=>new Response(await readFile(new URL('../public'+url,import.meta.url)));
const world=new CollisionWorld(manifest.files);world.addStatic('plaza',createPlazaGeometry().collision);await world.stream(STEPS.origin);
const streets=JSON.parse(await readFile(new URL('../public/data/streets-osm.json',import.meta.url)));world.addStatic('sidewalks',createSidewalkGeometry(makeStreetLayout(streets)).collision);
function playerAt(x,y,z=0){const p=new Player(world);p.position.copy(plazaPoint(x,y,z));return p;}
test('player walks up to the top of the real-position TKTS staircase, then back down',()=>{
 const p=playerAt(-1.2,-2);for(let i=0;i<370;i++)p.update(FIXED_STEP,new Set(['ArrowUp']),STEPS_HEADING);
 assert(p.position.z>4.55,'must reach the upper steps');assert(p.position.z<5.1);assert(p.grounded);
 for(let i=0;i<410;i++)p.update(FIXED_STEP,new Set(['ArrowDown']),STEPS_HEADING);
 assert(p.position.z<.15,'must return to plaza grade');assert(plazaCoordinates(p.position).y<0);
});
test('running cannot pass through barricades or the upper stair guardrail',()=>{
 const b=BARRIERS[2],p=playerAt(b.x+2,b.y);const heading=STEPS_HEADING-Math.PI/2;
 for(let i=0;i<60;i++)p.update(FIXED_STEP,new Set(['ArrowUp','ShiftLeft']),heading);
 assert(plazaCoordinates(p.position).x>b.x+.30,'barricade must block the body');
 const top=playerAt(-1.2,STEPS.length-2,STEPS.base+STEPS.height-0.6);
 for(let i=0;i<120;i++)top.update(FIXED_STEP,new Set(['ArrowUp','ShiftLeft']),STEPS_HEADING);
 assert(plazaCoordinates(top.position).y<STEPS.length-.25,'rear rail must stop the player');assert(top.position.z>4.5);
});
test('stair side rail blocks walking off the staircase',()=>{
 const p=playerAt(3.5,STEPS.length*.6,STEPS.base+STEPS.height*.6);
 for(let i=0;i<120;i++)p.update(FIXED_STEP,new Set(['ArrowRight']),STEPS_HEADING);
 assert(plazaCoordinates(p.position).x<4.75);assert(p.position.z>2.5);
});
