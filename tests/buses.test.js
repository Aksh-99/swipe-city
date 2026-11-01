import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Vector3} from 'three';
import {BUS_STOPS} from '../src/bus-config.js';
import {createBusGeometry,busAxes} from '../src/bus-geometry.js';
import {CollisionWorld} from '../src/collision.js';
import {Player,FIXED_STEP} from '../src/player.js';
import {makeStreetLayout,nearestSegment} from '../src/street-layout.js';
import {createSidewalkGeometry,createSignalGeometry} from '../src/street-detail-geometry.js';
import {createCurbBollardGeometry} from '../src/curb-bollard-geometry.js';
import {createStorefrontGeometry} from '../src/storefront-geometry.js';
import {createStreetscapeGeometry} from '../src/streetscape-geometry.js';
import {createNypdPlazaGeometry} from '../src/nypd-plaza-geometry.js';
import {createNasdaqGeometry} from '../src/nasdaq-geometry.js';
import {createStreetVendorGeometry} from '../src/street-vendor-geometry.js';
import {createHardRockFoodGeometry} from '../src/hard-rock-food-geometry.js';
import {createRecruitingGeometry} from '../src/recruiting-geometry.js';
import {createLyricGeometry} from '../src/lyric-geometry.js';
import {createPlazaGeometry} from '../src/plaza-geometry.js';
const json=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url)));
globalThis.fetch=async p=>new Response(await readFile(new URL('../public'+p,import.meta.url)));
const world=new CollisionWorld((await json('public/data/nyc/manifest.json')).files),g=createBusGeometry(),layout=makeStreetLayout(await json('public/data/streets-osm.json'));
const poles=new Map((await json('public/data/street-details.json')).poles.map(p=>[p.id,p.position]));layout.signals=layout.signals.filter(s=>poles.has(s.id));for(const s of layout.signals)s.position.fromArray(poles.get(s.id));
for(const [id,geometry]of [['buses',g],['sidewalks',createSidewalkGeometry(layout)],['signals',createSignalGeometry(layout)],['posts',createCurbBollardGeometry(layout)],['stores',createStorefrontGeometry()],['streetscape',createStreetscapeGeometry()],['plaza',createPlazaGeometry()],['nypd',createNypdPlazaGeometry()],['nasdaq',createNasdaqGeometry()],['vendors',createStreetVendorGeometry()],['hard-rock-food',createHardRockFoodGeometry()],['recruiting',createRecruitingGeometry()],['lyric',createLyricGeometry()]])world.addStatic(id,geometry.collision);
world.radius=800;await world.stream(new Vector3());
const horizontal=(a,b)=>a.clone().sub(b).setZ(0).length();
function walk(points,run){
 const player=new Player(world);player.position.copy(points[0]);
 for(const target of points.slice(1)){let steps=0;while(horizontal(player.position,target)>.14&&steps++<1600){const d=target.clone().sub(player.position);player.update(FIXED_STEP,new Set(run?['ArrowUp','ShiftLeft']:['ArrowUp']),Math.atan2(d.x,d.y));}
  assert(horizontal(player.position,target)<.16,`blocked en route to ${target.toArray()}, actual ${player.position.toArray()}, run=${run}`);assert(player.position.z<.4,'stay at street level');
 }
}
test('seven parked buses remain outside real buildings, sidewalks and crosswalks',()=>{
 assert.equal(BUS_STOPS.length,7);
 for(const b of BUS_STOPS){const {p,f,r}=busAxes(b);
  const road=layout.roadPaths.find(path=>path.id===b.roadId);assert(road,'source road exists');assert.equal(road.tags.name,b.road);
  if(b.direction==='south')assert(f.y<-.8);else assert(b.direction==='east'?f.x>.8:f.x<-.8);
  for(let y=-b.length/2;y<=b.length/2;y+=.5)for(const x of [-b.width/2,0,b.width/2]){
   const q=p(x,y,0);assert(!world.ray(q.clone().setZ(650),new Vector3(0,0,-1),650,true),`${b.id} intersects original building`);
   assert(nearestSegment(q.clone().setZ(0),layout.sidewalks).distance>1.92,'bus stays off raised pavement');
   assert(nearestSegment(q.clone().setZ(0),layout.crossings).distance>2.7,'crosswalk remains clear');
  }
  const pole=new Vector3(...b.pole),delta=pole.clone().sub(new Vector3(...b.center));assert(delta.dot(r)>b.width/2+.5,'pole on boarding side');assert(Math.abs(delta.dot(f)-(b.length/2-1.4))<.02,'front door aligns with stop');
 }
});
test('every visit spawn and waiting sidewalk supports walking and running past the bus',()=>{
 for(const b of BUS_STOPS){
  const spawn=new Vector3(...b.view.position);assert(horizontal(spawn,world.resolve(spawn.clone()))<.02,`${b.id} safe visit`);
  const route=b.walkway.map(p=>new Vector3(...p));walk(route,false);walk([...route].reverse(),true);walk([spawn,route[0]],true);walk([spawn,new Vector3(...b.boardingApproach)],false);
 }
});
test('bus bodies and stop poles are physical obstacles, including closed boarding doors',()=>{
 const props=new CollisionWorld([]);props.addStatic('buses',g.collision);
 for(const b of BUS_STOPS){const {p,f,r}=busAxes(b);
  for(const side of [-1,1]){
   const player=new Player(props);player.position.copy(p(side*(b.width/2+1),b.length/2-1.4,0));
   for(let i=0;i<60;i++)player.update(FIXED_STEP,new Set(['ArrowUp','ShiftLeft']),Math.atan2(-side*r.x,-side*r.y));
   assert(player.position.clone().sub(new Vector3(...b.center)).dot(r)*side>b.width/2+.28,'bus doors and sides stop sprinting');
  }
  for(const sign of [-1,1]){
   const player=new Player(props);player.position.copy(p(0,sign*(b.length/2+1.2),0));
   for(let i=0;i<60;i++)player.update(FIXED_STEP,new Set(['ArrowUp','ShiftLeft']),Math.atan2(-sign*f.x,-sign*f.y));
   assert(player.position.clone().sub(new Vector3(...b.center)).dot(f)*sign>b.length/2+.20,'front/rear stop sprinting');
  }
  const pole=new Vector3(...b.pole),q=pole.clone().addScaledVector(r,.10);assert(horizontal(q,props.resolve(q.clone()))>.2,'stop pole collision');
 }
});
test('neighboring crossings remain runnable and sign faces read outward without mirroring',()=>{
 const selected=new Set();for(const b of BUS_STOPS)selected.add(nearestSegment(new Vector3(...b.pole),layout.crossings).path);
 for(const c of selected){const path=c.points.map(p=>p.clone().setZ(.17));walk(path,false);walk([...path].reverse(),true);}
 for(const label of g.labels)assert(new Vector3(-label.normal.y,label.normal.x,0).dot(label.right)>.999,'labels need consistent outward reading direction');
 for(const [css,values]of g.batches)assert(values.every(Number.isFinite),css);assert([...g.collision].every(Number.isFinite));
});
