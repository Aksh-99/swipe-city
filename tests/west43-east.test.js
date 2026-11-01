import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Vector3} from 'three';
import {DISTRICT} from '../src/district-config.js';
import {west43Facade} from '../src/west43-reference.js';
import {EAST43_VISIT} from '../src/west43-east-details.js';
import {createDistrictGeometry,districtAxes} from '../src/district-geometry.js';
import {CollisionWorld} from '../src/collision.js';
import {Player,FIXED_STEP} from '../src/player.js';
import {makeStreetLayout} from '../src/street-layout.js';
import {createSidewalkGeometry} from '../src/street-detail-geometry.js';
import {createPoliceVehicleGeometry} from '../src/police-vehicle-geometry.js';
import {createBusGeometry} from '../src/bus-geometry.js';
const json=async p=>JSON.parse(await readFile('public'+p));
globalThis.fetch=async p=>new Response(await readFile('public'+p));
const g=createDistrictGeometry(),world=new CollisionWorld((await json('/data/nyc/manifest.json')).files);
world.radius=350;await world.stream(new Vector3(...EAST43_VISIT.view.position));
world.addStatic('district',g.collision);world.addStatic('sidewalks',createSidewalkGeometry(makeStreetLayout(await json('/data/streets-osm.json'))).collision);world.addStatic('cars',createPoliceVehicleGeometry().collision);world.addStatic('buses',createBusGeometry().collision);
const east=DISTRICT.facades.map(west43Facade).filter(f=>['mexican','townhall','sondheim','glassoffice'].includes(f.referenceStyle));
test('127A continuation keeps source scales, distinguishes both theatres and preserves older fronts',()=>{
 assert.equal(east.length,12);
 assert.equal(east.filter(f=>f.referenceStyle==='townhall').length,2);assert.equal(east.filter(f=>f.referenceStyle==='sondheim').length,2);
 for(const f of east){const original=DISTRICT.facades.find(v=>v.id===f.id);assert.deepEqual(f.center,original.center);assert.equal(f.top,original.top);assert.equal(f.width,original.width);assert(!f.scaffold);}
 for(const [id,kind] of [[109,'diner'],[108,'casablanca'],[106,'tony'],[104,'parking']])assert.equal(west43Facade(DISTRICT.facades.find(f=>f.id===`district-${id}`)).kind,kind);
 assert(g.curtain.length>=6);assert(g.labels.some(f=>f.kind==='pub'));assert(g.labels.some(f=>f.kind==='townhall'&&f.center.z>10));assert(g.labels.some(f=>f.kind==='sondheim'&&f.center.z>3.8));
 for(const array of [...g.batches.values(),...g.bulbs.values(),g.collision])assert(array.every(Number.isFinite));
});
test('127A visit remains outside source buildings and parked transport',()=>{
 const p=new Vector3(...EAST43_VISIT.view.position);assert(!world.ray(p.clone().setZ(700),new Vector3(0,0,-1),699.5,true));assert(p.distanceTo(world.resolve(p.clone()))<.04);
});
test('restaurant, theatre canopies, trees and posts retain walk and sprint passages',()=>{
 for(const f of east)for(const run of [false,true])for(const sign of [-1,1]){
  const a=districtAxes(f),start=a.p(-sign*f.width*.40,1.5,.17),target=a.p(sign*f.width*.40,1.5,.17),player=new Player(world,{bounded:false});player.position.copy(start);
  let frames=0;const budget=Math.ceil(f.width/(run?8:3.2)*60)+150;
  while(player.position.clone().sub(target).setZ(0).length()>.15&&frames++<budget){const d=target.clone().sub(player.position);player.update(FIXED_STEP,new Set(run?['ArrowUp','ShiftLeft']:['ArrowUp']),Math.atan2(d.x,d.y));}
  assert(player.position.clone().sub(target).setZ(0).length()<.16,`${f.id} passage clear ${run?'sprint':'walk'}`);assert(player.position.z<.45);
 }
});
