import test from 'node:test';
import {createDistrictGeometry} from '../src/district-geometry.js';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Vector3} from 'three';
import {CollisionWorld} from '../src/collision.js';
import {Player,FIXED_STEP} from '../src/player.js';
import {ThirdPersonCamera} from '../src/camera.js';
import {toLocal} from '../src/coordinates.js';
import {EAST42 as B} from '../src/east42-config.js';
import {createEast42Geometry,east42Axes} from '../src/east42-geometry.js';
import {createAvenueGeometry} from '../src/avenue-geometry.js';
import {createStreetscapeGeometry} from '../src/streetscape-geometry.js';
import {createSouth42TransitGeometry} from '../src/south42-transit-geometry.js';
import {createSidewalkGeometry,createSignalGeometry} from '../src/street-detail-geometry.js';
import {createBusGeometry} from '../src/bus-geometry.js';
import {makeStreetLayout} from '../src/street-layout.js';
import {SUBWAY_ENTRANCES} from '../src/streetscape-config.js';
import {entrancePoint,insideEntrance} from '../src/ground-cutouts.js';
const json=async p=>JSON.parse(await readFile('public'+p));
globalThis.fetch=async p=>new Response(await readFile('public'+p));
const world=new CollisionWorld((await json('/data/nyc/manifest.json')).files),g=createEast42Geometry();world.radius=400;await world.stream(new Vector3(0,-285,0));
const layout=makeStreetLayout(await json('/data/streets-osm.json')),positions=new Map((await json('/data/street-details.json')).poles.map(p=>[p.id,p.position]));
layout.signals=layout.signals.filter(s=>positions.has(s.id));for(const s of layout.signals)s.position.fromArray(positions.get(s.id));
const streetscape=createStreetscapeGeometry();
for(const [id,geometry]of [['district',createDistrictGeometry()],['east42',g],['avenue',createAvenueGeometry()],['streetscape',streetscape],['south42',createSouth42TransitGeometry()],['sidewalks',createSidewalkGeometry(layout)],['signals',createSignalGeometry(layout)],['buses',createBusGeometry()]])world.addStatic(id,geometry.collision);
world.groundBase=p=>{const e=SUBWAY_ENTRANCES.find(e=>insideEntrance(e,p));return e?-e.depth:0;};
const distance=(a,b)=>a.clone().sub(b).setZ(0).length();
function walk(points,run){const p=new Player(world,{bounded:false});p.position.copy(points[0]);for(const target of points.slice(1)){let frames=0;const budget=Math.ceil(distance(p.position,target)/(run?8:3.2)*60)+120;while(distance(p.position,target)>.15&&frames++<budget){const d=target.clone().sub(p.position);p.update(FIXED_STEP,new Set(run?['ArrowUp','ShiftLeft']:['ArrowUp']),Math.atan2(d.x,d.y));}assert(distance(p.position,target)<.16,`blocked to ${target.toArray()} from ${p.position.toArray()}`);assert(p.position.z<.45,'route stays at street level');}return p;}
test('42nd Street finishes stay against original NYC walls and below their setbacks',()=>{
 for(const f of B.facades){const a=east42Axes(f);for(const x of [-.48,0,.48])for(const z of [f.bottom+.07,(f.bottom+f.top)/2,f.top-.05]){
  const hit=world.ray(a.p(x*f.width,.30,z),a.n.clone().negate(),.55,true);
  assert(hit&&Math.abs(hit.distance-.46)<.025,`${f.id} skin must fit source, z${z}: ${hit?.distance}`);
 }
 assert(f.top<f.sourceRoof,`${f.id} must retain its original roof`);
 }
 for(const list of [g.collision,...g.batches.values(),...g.paving.values()])assert(list.every(Number.isFinite));
 assert(g.collision.length<2_000_000,'bounded collision geometry');
});
test('both 42nd Street sidewalks and covered passages stay traversable with adjacent scenery',()=>{
 for(const route of g.routes)for(const run of [false,true])for(const reverse of [false,true])walk(reverse?[...route.points].reverse():route.points,run);
 for(const place of B.places){const p=new Vector3(...place.view.position);assert(!world.ray(p.clone().setZ(700),new Vector3(0,0,-1),699.5,true),`${place.id} spawn outside buildings`);assert(distance(p,world.resolve(p.clone()))<.04,`${place.id} spawn avoids props`);}
});
test('new storefronts, bollards and scaffold decks remain physical without closing the subway',()=>{
 const props=new CollisionWorld([]);props.addStatic('east42',g.collision);
 for(const b of g.bollards){const p=b.position.clone().addScaledVector(b.normal,.2);props.resolve(p);assert(distance(p,b.position)>.48,'solid silver bollards');}
 for(const door of g.doors){const p=new Player(world,{bounded:false});p.position.copy(door.point).addScaledVector(door.normal,1.4);for(let i=0;i<30;i++)p.update(FIXED_STEP,new Set(['ArrowUp','ShiftLeft']),Math.atan2(-door.normal.x,-door.normal.y));assert(p.position.clone().sub(door.point).dot(door.normal)>.08,`${door.facade} closed shop wall`);}
 for(const s of B.scaffolds){
  const point=new Vector3(...s.center).setZ(.18),hit=props.ray(point.clone().setZ(1.8),new Vector3(0,0,1),4);
  assert(hit&&hit.point.z>3.0&&hit.point.z<4.7,`${s.id} overhead canopy/scaffold clearance`);
  const p=new Player(world,{bounded:false});p.position.copy(point);let observed;
  const camera=new ThirdPersonCamera({camera:{frustum:{},setView(v){observed=toLocal(v.destination);}}},world);camera.pitch=1.15;camera.update(p);
  // The orbit may move beyond a shorter hotel canopy but remains under the
  // wider protective deck. Its sightline must not cross either solid roof.
  assert(observed.z<s.height-.02,`${s.id} camera stays below scaffold deck`);
  const target=point.clone().add(new Vector3(0,0,1.6)),end=new Vector3(observed.x,observed.y,observed.z),delta=end.clone().sub(target);
  assert(!world.ray(target,delta.clone().normalize(),delta.length()),`${s.id} clear camera sightline`);
 }
 const entry=SUBWAY_ENTRANCES.find(e=>e.id==='mta-77');
 for(const y of [.2,1,3,5.6]){const p=entrancePoint(entry,0,y,.18);assert(!props.ray(p,new Vector3(0,0,-1),.3),'Knickerbocker paving must preserve subway aperture');}
});
