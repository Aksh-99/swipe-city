import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {Vector3} from 'three';
import {CollisionWorld} from '../src/collision.js';import {Player,FIXED_STEP} from '../src/player.js';
import {DISTRICT} from '../src/district-config.js';import {createDistrictGeometry,districtAxes} from '../src/district-geometry.js';
import {east44Facade,EAST44_VISITS} from '../src/east44-reference.js';import {EAST44_TRUCKS} from '../src/east44-props.js';
import {makeStreetLayout,nearestSegment} from '../src/street-layout.js';import {createSidewalkGeometry} from '../src/street-detail-geometry.js';import {createPoliceVehicleGeometry} from '../src/police-vehicle-geometry.js';import {createBusGeometry} from '../src/bus-geometry.js';
const json=async p=>JSON.parse(await readFile('public'+p));globalThis.fetch=async p=>new Response(await readFile('public'+p));
const world=new CollisionWorld((await json('/data/nyc/manifest.json')).files);world.radius=550;await world.stream(new Vector3(50,-120,0));
const layout=makeStreetLayout(await json('/data/streets-osm.json')),g=createDistrictGeometry();
for(const [id,geo] of [['sidewalks',createSidewalkGeometry(layout)],['police',createPoliceVehicleGeometry()],['buses',createBusGeometry()]])world.addStatic(id,geo.collision);
const distance=(a,b)=>a.clone().sub(b).setZ(0).length();
const clearWorld=new CollisionWorld(world.files);clearWorld.loaded=new Map(world.loaded);
test('two scenic food trucks fit road edges without occupying source buildings, curbs, crossings or transport',()=>{
 assert.equal(EAST44_TRUCKS.length,2);assert.equal(g.east44Props.trucks.length,2);assert(g.foodMenus.length>=16);
 for(const t of EAST44_TRUCKS){const c=new Vector3(...t.center),f=new Vector3(...t.forward),r=new Vector3(...t.right);assert((nearestSegment(c,layout.crossings)?.distance??99)>7);
  for(const y of [-t.length/2,0,t.length/2])for(const x of [-t.width/2,0,t.width/2]){const p=c.clone().addScaledVector(f,y).addScaledVector(r,x);assert(!clearWorld.ray(p.clone().setZ(500),new Vector3(0,0,-1),499.7,true));const curb=clearWorld.ray(p.clone().setZ(.3),new Vector3(0,0,-1),.29);assert(!curb||curb.point.z<.05);assert(distance(p,clearWorld.resolve(p.clone()))<.03);}
 }
});
world.addStatic('all-district-details',g.collision);
test('east W44 fronts retain actual source extents and all three new visits are clear',()=>{
 const fronts=DISTRICT.facades.map(east44Facade).filter(f=>f.east44);assert.equal(fronts.length,26);
 for(const f of fronts){const old=DISTRICT.facades.find(v=>v.id===f.id);for(const k of ['center','normal','width','top','bottom'])assert.deepEqual(f[k],old[k]);}
 for(const place of EAST44_VISITS){const p=new Vector3(...place.view.position);assert(!world.ray(p.clone().setZ(700),new Vector3(0,0,-1),699.5,true),place.name+' outdoor');assert(distance(p,world.resolve(p.clone()))<.04,place.name+' clear');}
 for(const array of [g.collision,...g.batches.values(),...g.bulbs.values()])assert(array.every(Number.isFinite));
});
test('all eastern reference frontages including souvenir shed support walk/sprint in both directions',()=>{
 for(const f of DISTRICT.facades.map(east44Facade).filter(f=>f.east44))for(const sprint of [false,true])for(const sign of [-1,1]){
  const a=districtAxes(f),p=new Player(world,{bounded:false}),target=a.p(sign*f.width*.38,1.5,.17);p.position.copy(a.p(-sign*f.width*.38,1.5,.17));let frames=0,limit=Math.ceil(f.width/(sprint?8:3.2)*60)+150;
  while(distance(p.position,target)>.15&&frames++<limit){const d=target.clone().sub(p.position);p.update(FIXED_STEP,new Set(sprint?['ArrowUp','ShiftLeft']:['ArrowUp']),Math.atan2(d.x,d.y));}
  assert(distance(p.position,target)<.16,f.id+' '+(sprint?'sprint':'walk')+' clear');assert(p.position.z<.45);
 }
});
test('food truck hulls and souvenir table remain physical obstacles',()=>{
 const props=new CollisionWorld([]);props.addStatic('details',g.collision);
 for(const t of EAST44_TRUCKS){const c=new Vector3(...t.center),r=new Vector3(...t.right),p=c.clone().addScaledVector(r,t.width/2+.13);props.resolve(p);assert(p.clone().sub(c).dot(r)>t.width/2+.28);}
 const p=new Vector3(...g.east44Props.souvenir.position);assert(distance(p,props.resolve(p.clone()))>.2);
});
