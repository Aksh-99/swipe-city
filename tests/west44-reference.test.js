import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Vector3} from 'three';
import {DISTRICT} from '../src/district-config.js';
import {west44Facade,WEST44_VISITS,WEST44_TITLES} from '../src/west44-reference.js';
import {createDistrictGeometry,districtAxes} from '../src/district-geometry.js';
import {CollisionWorld} from '../src/collision.js';
import {Player,FIXED_STEP} from '../src/player.js';
import {makeStreetLayout} from '../src/street-layout.js';
import {createSidewalkGeometry} from '../src/street-detail-geometry.js';
import {createPoliceVehicleGeometry} from '../src/police-vehicle-geometry.js';
import {createBusGeometry} from '../src/bus-geometry.js';
import {createBroadwayRetailGeometry} from '../src/broadway-retail-geometry.js';
const json=async p=>JSON.parse(await readFile('public'+p));
globalThis.fetch=async p=>new Response(await readFile('public'+p));
const g=createDistrictGeometry(),retail=createBroadwayRetailGeometry(),world=new CollisionWorld((await json('/data/nyc/manifest.json')).files);world.radius=550;await world.stream(new Vector3(-180,0,0));
for(const [id,geom] of [['district',g],['retail',retail],['sidewalks',createSidewalkGeometry(makeStreetLayout(await json('/data/streets-osm.json')))],['cars',createPoliceVehicleGeometry()],['buses',createBusGeometry()]])world.addStatic(id,geom.collision);
const updated=DISTRICT.facades.map(west44Facade).filter(f=>f.west44);
test('W44 reference sequence preserves every original surveyed span and other streets',()=>{
 assert.equal(updated.length,25);for(const f of updated){const old=DISTRICT.facades.find(v=>v.id===f.id);for(const key of ['center','normal','width','top','bottom'])assert.deepEqual(f[key],old[key]);assert(f.center[0]<-60);assert(!f.scaffold);}
 for(const f of DISTRICT.facades.filter(f=>f.street!=='West 44th Street'))assert.equal(west44Facade(f),f);
 const kinds=new Set(updated.map(f=>f.west44));for(const k of ['pharmacy','majestic','stjames','pizza','sardis','bowl','juniors','carmines','parking'])assert(kinds.has(k));
 const blades=g.labels.filter(f=>f.west44Vertical);assert(blades.length>10);for(const f of blades){assert(f.center.z-f.height/2>3.7);assert(f.variant<WEST44_TITLES.length);assert(new Vector3().crossVectors(f.right,new Vector3(0,0,1)).dot(f.normal)>.99,'blade reads outward without mirroring');}
 for(const vertices of [g.collision,...g.batches.values(),...g.bulbs.values()])assert(vertices.every(Number.isFinite));
 assert(retail.labels.some(f=>f.kind==='ticket-room'&&f.width>40),'preserve full W44 Palladium screen while updating the W45 Paramount corner');
});
test('all three W44 visit positions are outdoors and clear of parked buses/cars',()=>{
 for(const place of WEST44_VISITS){const p=new Vector3(...place.view.position);assert(!world.ray(p.clone().setZ(700),new Vector3(0,0,-1),699.5,true),place.name+' outdoor');assert(p.clone().sub(world.resolve(p.clone())).setZ(0).length()<.04,place.name+' clear');}
});
test('each reference frontage has an unobstructed walking and sprinting passage in both directions',()=>{
 for(const f of updated)for(const sprint of [false,true])for(const sign of [-1,1]){
  const a=districtAxes(f),p=new Player(world,{bounded:false}),target=a.p(sign*f.width*.40,1.5,.17);p.position.copy(a.p(-sign*f.width*.40,1.5,.17));
  let steps=0,limit=Math.ceil(f.width/(sprint?8:3.2)*60)+150;
  while(p.position.clone().sub(target).setZ(0).length()>.15&&steps++<limit){const d=target.clone().sub(p.position);p.update(FIXED_STEP,new Set(sprint?['ArrowUp','ShiftLeft']:['ArrowUp']),Math.atan2(d.x,d.y));}
  assert(p.position.clone().sub(target).setZ(0).length()<.16,f.id+' clear '+(sprint?'sprint':'walk'));assert(p.position.z<.45,'street level');
 }
});
