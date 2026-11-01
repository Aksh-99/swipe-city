import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Vector3} from 'three';
import {CollisionWorld} from '../src/collision.js';
import {Player,FIXED_STEP} from '../src/player.js';
import {ThirdPersonCamera} from '../src/camera.js';
import {toLocal} from '../src/coordinates.js';
import {SOUTH42_TRANSIT as B,OPPOSITE_SUBWAY} from '../src/south42-transit-config.js';
import {createSouth42TransitGeometry,south42Axes} from '../src/south42-transit-geometry.js';
import {createNorth42Geometry} from '../src/north42-geometry.js';
import {createFiveTimesGeometry} from '../src/five-times-geometry.js';
import {createEast42Geometry} from '../src/east42-geometry.js';
import {createNypdPlazaGeometry} from '../src/nypd-plaza-geometry.js';
import {createNasdaqGeometry} from '../src/nasdaq-geometry.js';
import {createAvenueGeometry} from '../src/avenue-geometry.js';
import {createRecruitingGeometry} from '../src/recruiting-geometry.js';
import {createStreetscapeGeometry} from '../src/streetscape-geometry.js';
import {createSidewalkGeometry,createSignalGeometry} from '../src/street-detail-geometry.js';
import {createBusGeometry} from '../src/bus-geometry.js';
import {makeStreetLayout} from '../src/street-layout.js';
import {SUBWAY_ENTRANCES} from '../src/streetscape-config.js';
import {entrancePoint,entranceCoordinates,insideEntrance} from '../src/ground-cutouts.js';
const json=async p=>JSON.parse(await readFile('public'+p));
globalThis.fetch=async p=>new Response(await readFile('public'+p));
const world=new CollisionWorld((await json('/data/nyc/manifest.json')).files),g=createSouth42TransitGeometry();
world.radius=350;await world.stream(new Vector3(...B.corner));
const layout=makeStreetLayout(await json('/data/streets-osm.json')),poles=new Map((await json('/data/street-details.json')).poles.map(p=>[p.id,p.position]));
layout.signals=layout.signals.filter(s=>poles.has(s.id));for(const s of layout.signals)s.position.fromArray(poles.get(s.id));
for(const [id,data]of [['south42',g],['north42',createNorth42Geometry()],['nypd',createNypdPlazaGeometry()],['nasdaq',createNasdaqGeometry()],['avenue',createAvenueGeometry()],['recruiting',createRecruitingGeometry()],['streetscape',createStreetscapeGeometry()],['sidewalks',createSidewalkGeometry(layout)],['signals',createSignalGeometry(layout)],['buses',createBusGeometry()]])world.addStatic(id,data.collision);
world.addStatic('five-times-corner',createFiveTimesGeometry().collision);
world.addStatic('east42-bryant-frontage',createEast42Geometry().collision);
world.groundBase=p=>{const e=SUBWAY_ENTRANCES.find(e=>insideEntrance(e,p));return e?-e.depth:0;};
const horizontal=(a,b)=>a.clone().sub(b).setZ(0).length();
function walk(points,run){const p=new Player(world,{bounded:false});p.position.copy(points[0]);
 for(const target of points.slice(1)){let frames=0;const budget=Math.ceil(horizontal(p.position,target)/(run?8:3.2)*60)+180;
  while(horizontal(p.position,target)>.15&&frames++<budget){const d=target.clone().sub(p.position);p.update(FIXED_STEP,new Set(run?['ArrowUp','ShiftLeft']:['ArrowUp']),Math.atan2(d.x,d.y));}
  assert(horizontal(p.position,target)<.16,`blocked at ${p.position.toArray()} toward ${target.toArray()} (run=${run})`);assert(p.position.z<.4,'stay at pavement level');
 }return p;
}
test('opposite subway and facing One Times Square details follow the unchanged real source walls',()=>{
 for(const f of [...B.facades,...B.oneTimesFacades]){
  const a=south42Axes(f);for(const x of [-.48,0,.48])for(const z of [.35,5.1,13.2,25.1,33.6]){
   const hit=world.ray(a.p(x*f.width,2,z),a.n.clone().negate(),3,true);assert(hit&&Math.abs(hit.distance-2.16)<.04,`${f.id} fit at ${x},${z}: ${hit?.distance}`);
  }
 }
 assert.equal(B.entranceMode,'exterior');assert.deepEqual(B.mta.map(e=>e.index),[76,78,79]);
 for(const f of [...g.labels,...g.glass,...g.posters,...g.stripeScreens])assert(new Vector3(-f.normal.y,f.normal.x,0).dot(f.right)>.999,'lettering must face outward');
 for(const batches of [g.batches,g.paving,g.emissive])for(const v of batches.values())assert(v.every(Number.isFinite));
});
test('both red-frontage sidewalks, corner turn and scaffold passages support walking and running',()=>{
 for(const route of g.routes)for(const run of [false,true])for(const reverse of [false,true])walk(reverse?[...route.points].reverse():route.points,run);
 const a=south42Axes(B.facades[0]),b=south42Axes(B.facades[1]),curve=g.routes.find(r=>r.id==='red-subway-corner').points;
 walk([a.p(B.facades[0].width/2-.8,2.85,.18),...curve,b.p(-B.facades[1].width/2+.8,2.85,.18)],true);
});
test('opposite-subway arrival and approaches stay outside buildings and clear of poles',()=>{
 const spawn=new Vector3(...OPPOSITE_SUBWAY.view.position),front=south42Axes(B.facades[0]);
 assert(!world.ray(spawn.clone().setZ(700),new Vector3(0,0,-1),701,true));assert(horizontal(spawn,world.resolve(spawn.clone()))<.025);
 walk([spawn,front.p(B.facades[0].entryX,1.15,.18)],false);
 for(const f of B.facades){const a=south42Axes(f);walk([a.p(f.entryX,5.8,.18),a.p(f.entryX,1.0,.18)],true);}
 // The existing crosswalk between 7 Times Square and the covered north side
 // remains usable with the new structure and all surrounding poles loaded.
 const nearby=layout.crossings.filter(c=>c.points[0].clone().lerp(c.points.at(-1),.5).distanceTo(new Vector3(...B.corner))<24);
 assert(nearby.length>0);for(const c of nearby)for(const reverse of [false,true])walk(reverse?[...c.points].reverse():c.points,true);
});
test('red entry glazing, silver bollards and scaffold poles remain physical; camera stays below roofs',()=>{
 for(const door of g.doors){const p=new Player(world,{bounded:false});p.position.copy(door.position).addScaledVector(door.normal,1.5);
  for(let i=0;i<40;i++)p.update(FIXED_STEP,new Set(['ArrowUp','ShiftLeft']),Math.atan2(-door.normal.x,-door.normal.y));
  assert(p.position.clone().sub(door.position).dot(door.normal)>.08,'closed source-aligned entrance must stop the player');
 }
 const props=new CollisionWorld([]);props.addStatic('south42',g.collision);
 for(const b of g.bollards){const p=b.position.clone().addScaledVector(b.normal,.20);props.resolve(p);assert(horizontal(p,b.position)>.46,'steel posts stay solid');}
 for(const s of g.scaffolds){const p=new Vector3(...s.center).addScaledVector(new Vector3(...s.along),-s.length/2).addScaledVector(new Vector3(...s.normal),s.width/2).setZ(.17),probe=p.clone().addScaledVector(new Vector3(...s.normal),.07);props.resolve(probe);assert(horizontal(probe,p)>.32,'scaffold support stops capsule');}
 for(const point of [...g.canopies.map(c=>c.position),...B.scaffolds.map(s=>new Vector3(...s.center).setZ(.18))]){
  const p=new Player(world,{bounded:false});p.position.copy(point);const roof=world.ray(point.clone().setZ(1.9),new Vector3(0,0,1),5);assert(roof&&roof.point.z>3.0,'headroom and physical roof');
  let observed;const cam=new ThirdPersonCamera({camera:{frustum:{},setView(v){observed=toLocal(v.destination);}}},world);cam.yaw=0;cam.pitch=1.15;cam.update(p);assert(observed.z<roof.point.z-.02,'camera must remain under the roof');
 }
});
test('nearby Broadway and plaza subway stairs still descend and return with the new exterior loaded',()=>{
 for(const id of ['mta-77','mta-82']){const e=SUBWAY_ENTRANCES.find(e=>e.id===id),p=new Player(world,{bounded:false}),yaw=Math.atan2(e.direction[0],e.direction[1]);p.position.copy(entrancePoint(e,0,-1,.17));
  for(let i=0;i<170;i++)p.update(FIXED_STEP,new Set(['ArrowUp']),yaw);
  assert(p.grounded&&p.position.z<-e.depth+.15,`${id} stairway remains open`);assert(entranceCoordinates(e,p.position).y>e.length);
  for(let i=0;i<190;i++)p.update(FIXED_STEP,new Set(['ArrowDown']),yaw);
  assert(p.position.z>=0&&entranceCoordinates(e,p.position).y<0,`${id} return to street: ${p.position.toArray()}, entry ${JSON.stringify(entranceCoordinates(e,p.position))}, grounded ${p.grounded}`);
 }
});
