import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Vector3} from 'three';
import {CINEMA_BLOCK as B,CINEMA_PLACES} from '../src/cinema-config.js';
import {createCinemaGeometry,cinemaAxes,cinemaStreetPoint} from '../src/cinema-geometry.js';
import {CollisionWorld} from '../src/collision.js';
import {Player,FIXED_STEP} from '../src/player.js';
import {makeStreetLayout} from '../src/street-layout.js';
import {createSidewalkGeometry,createSignalGeometry} from '../src/street-detail-geometry.js';
import {createStreetscapeGeometry} from '../src/streetscape-geometry.js';
import {createBusGeometry} from '../src/bus-geometry.js';
import {createLyricGeometry} from '../src/lyric-geometry.js';
import {createPortAuthorityGeometry} from '../src/port-authority-geometry.js';
import {ATTRACTIONS,ATTRACTION_PLACES} from '../src/attractions-config.js';
import {createAttractionsGeometry} from '../src/attractions-geometry.js';
import {FIVE_TIMES,FIVE_TIMES_PLACE} from '../src/five-times-config.js';
import {createFiveTimesGeometry} from '../src/five-times-geometry.js';
import {ThirdPersonCamera} from '../src/camera.js';
import {toLocal} from '../src/coordinates.js';
const json=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url)));
globalThis.fetch=async p=>new Response(await readFile(new URL('../public'+p,import.meta.url)));
const world=new CollisionWorld((await json('public/data/nyc/manifest.json')).files),g=createCinemaGeometry(),attractions=createAttractionsGeometry(),fiveTimes=createFiveTimesGeometry();
const layout=makeStreetLayout(await json('public/data/streets-osm.json'));
const poles=new Map((await json('public/data/street-details.json')).poles.map(p=>[p.id,p.position]));layout.signals=layout.signals.filter(s=>poles.has(s.id));for(const s of layout.signals)s.position.fromArray(poles.get(s.id));
for(const [id,data]of [['cinemas',g],['attractions',attractions],['sidewalks',createSidewalkGeometry(layout)],['signals',createSignalGeometry(layout)],['streetscape',createStreetscapeGeometry()],['buses',createBusGeometry()],['lyric',createLyricGeometry()],['terminal',createPortAuthorityGeometry()]])world.addStatic(id,data.collision);
world.addStatic('five-times-corner',fiveTimes.collision);
world.radius=650;await world.stream(new Vector3(...B.origin));
const horizontal=(a,b)=>a.clone().sub(b).setZ(0).length();
function walk(points,run){
 const player=new Player(world,{bounded:false});player.position.copy(points[0]);
 for(const target of points.slice(1)){
  let steps=0;while(horizontal(player.position,target)>.14&&steps++<2800){const d=target.clone().sub(player.position);player.update(FIXED_STEP,new Set(run?['ArrowUp','ShiftLeft']:['ArrowUp']),Math.atan2(d.x,d.y));}
  assert(horizontal(player.position,target)<.16,`blocked from ${points[0].toArray()} to ${target.toArray()} at ${player.position.toArray()}, running=${run}`);
  assert(player.position.z<.4,'stay at pavement level');
 }
}
test('all cinema and office elevations fit real source walls at their full height',()=>{
 for(const f of [...B.facades,...ATTRACTIONS.facades,...FIVE_TIMES.facades]){const {p,n}=cinemaAxes(f);for(const x of [-.48,0,.48])for(const z of [f.bottom+.12,f.bottom+f.height/2,f.bottom+f.height-.05]){
  const probe=f.fitProbeStartOffset??2,hit=world.ray(p(x*f.width,probe,z),n.clone().negate(),probe+1,true);assert(hit&&Math.abs(hit.distance-probe-.16)<.07,`${f.id} source fit at ${x},${z}: ${hit?.distance}`);
 }}
 for(const batches of [g.batches,g.paving,g.emissive,attractions.batches,attractions.paving,attractions.emissive,fiveTimes.batches,fiveTimes.paving,fiveTimes.emissive])for(const values of batches.values())assert(values.every(Number.isFinite));
 for(const f of [...g.labels,...g.posters,...g.landscape,...attractions.labels,...attractions.posters,...attractions.landscape,...fiveTimes.labels,...fiveTimes.posters])if(f.normal.z<.5)assert(new Vector3(-f.normal.y,f.normal.x,0).dot(f.right)>.999,'no mirrored lettering');
});
test('both sidewalks and the W42 street remain walkable in both directions, including Shift running',()=>{
 for(const route of [...g.routes,...attractions.routes,...fiveTimes.routes])for(const run of [false,true])for(const reverse of [false,true])walk(reverse?[...route.points].reverse():route.points,run);
});
test('cinema and attraction visit shortcuts start clear and reach their frontage through barrier openings',()=>{
 for(const place of [...CINEMA_PLACES,...ATTRACTION_PLACES,FIVE_TIMES_PLACE]){
  const spawn=new Vector3(...place.view.position),front=new Vector3(...place.center),normal=new Vector3(...place.normal);
  assert(!world.ray(spawn.clone().setZ(700),new Vector3(0,0,-1),701,true),`${place.id} starts outside original building`);
  assert(horizontal(spawn,world.resolve(spawn.clone()))<.02,`${place.id} starts clear of furniture`);
  const arrival=front.addScaledVector(normal,1.30).setZ(.18);
  walk([spawn,arrival],false);walk([arrival,spawn],true);
 }
 // Walk from the southwest Eighth Avenue crossing into the cinema block.
 walk([cinemaStreetPoint(15,0),cinemaStreetPoint(30,0)],true);
});
test('theater/store doors and colored concrete barriers are physical obstacles',()=>{
 for(const door of [...g.doors,...attractions.doors,...fiveTimes.doors]){
  const player=new Player(world,{bounded:false}),p=door.position;player.position.copy(p).addScaledVector(door.normal,2.0);
  let closest=Infinity;
  for(let i=0;i<70;i++){player.update(FIXED_STEP,new Set(['ArrowUp','ShiftLeft']),Math.atan2(-door.normal.x,-door.normal.y));closest=Math.min(closest,player.position.clone().sub(p).dot(door.normal));}
  assert(closest>.27,`closed door stops sprint at ${p.toArray()} (separation ${closest})`);
 }
 const props=new CollisionWorld([]);props.addStatic('cinemas',g.collision);props.addStatic('attractions',attractions.collision);props.addStatic('five-times',fiveTimes.collision);
 for(const barrier of [...g.barriers,...attractions.barriers,...fiveTimes.barriers]){
  const player=new Player(props,{bounded:false}),p=barrier.position;player.position.copy(p).addScaledVector(barrier.normal,1.6);
  for(let i=0;i<40;i++)player.update(FIXED_STEP,new Set(['ArrowUp','ShiftLeft']),Math.atan2(-barrier.normal.x,-barrier.normal.y));
  assert(player.position.clone().sub(p).dot(barrier.normal)>(barrier.depth??.71)/2+.29,'barrier stops sprint at its physical face');
 }
});

test('Madame Tussauds and neighboring stainless posts remain solid beside the clear sidewalk',()=>{
 const props=new CollisionWorld([]);props.addStatic('attractions',attractions.collision);props.addStatic('five-times',fiveTimes.collision);
 for(const post of [...attractions.bollards,...fiveTimes.bollards]){
  const player=new Player(props,{bounded:false});player.position.copy(post.position).addScaledVector(post.normal,1.3);let closest=Infinity;
  for(let i=0;i<45;i++){player.update(FIXED_STEP,new Set(['ArrowUp','ShiftLeft']),Math.atan2(-post.normal.x,-post.normal.y));closest=Math.min(closest,horizontal(player.position,post.position));}
  assert(closest>.435&&closest<.49,'silver post stops a running capsule');
 }
});

test('5 Times Square scaffold roofs and posts preserve headroom, crosswalks and the subway approach',()=>{
 for(const s of FIVE_TIMES.scaffolds){
  const player=new Player(world,{bounded:false});player.position.fromArray(s.center).setZ(.18);
  let observed;const camera=new ThirdPersonCamera({camera:{frustum:{},setView(view){observed=toLocal(view.destination);}}},world);camera.pitch=1.15;camera.yaw=Math.atan2(s.normal[0],s.normal[1]);camera.update(player);
  assert(observed.z<s.height-.05,'camera must retract below scaffold deck');
  const pole=new Vector3(...s.center).addScaledVector(new Vector3(...s.along),-s.length/2).addScaledVector(new Vector3(...s.normal),s.width/2).setZ(.17),probe=pole.clone().addScaledVector(new Vector3(...s.normal),.10);world.resolve(probe);assert(horizontal(probe,pole)>.37,'steel upright must stop player');
 }
 const m=FIVE_TIMES.mta72,approach=new Vector3(...m.walk.point).setZ(.18),mouth=new Vector3(...m.position).setZ(.18);walk([approach,mouth],false);walk([mouth,approach],true);
 const bridge=FIVE_TIMES.bridges[0],roof=world.ray(new Vector3(...bridge.center).setZ(1.9),new Vector3(0,0,1),6);assert(roof&&roof.point.z>=5.19,'subway approach has overhead-only bridge');
 const corner=new Vector3(...FIVE_TIMES.corner.world),near=layout.crossings.filter(c=>c.points[0].clone().lerp(c.points.at(-1),.5).distanceTo(corner)<23);
 assert(near.length>0);for(const c of near)for(const reverse of [false,true])walk(reverse?[...c.points].reverse():c.points,true);
 const wrap=fiveTimes.screens.filter(s=>s.kind==='tower');assert.equal(wrap.length,2);assert(wrap[0].corners[0].distanceTo(wrap[1].corners[1])<.01,'billboard corner wrap joins without moving the original source walls');
});
test('the camera retracts beneath the curved Madame Tussauds canopy',()=>{
 const place=ATTRACTION_PLACES.find(p=>p.id==='madame-tussauds'),n=new Vector3(...place.normal),player=new Player(world,{bounded:false});
 player.position.fromArray(place.center).addScaledVector(n,2.2).setZ(.18);
 let checked=0;
 const camera=new ThirdPersonCamera({camera:{frustum:{},setView(view){const p=toLocal(view.destination);assert(p.z<attractions.canopy.underside-.10);checked++;}}},world);
 camera.pitch=1.15;camera.yaw=Math.atan2(n.x,n.y);camera.update(player);
 assert(camera.distanceToPlayer<7.5&&checked===1,'overhead canopy shortens camera boom');
});
