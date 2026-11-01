import{insideVoco48Source}from'../src/voco48-source-mask.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Vector3} from 'three';
import {CollisionWorld} from '../src/collision.js';
import {Player,FIXED_STEP} from '../src/player.js';
import {DISTRICT as D} from '../src/district-config.js';
import {createDistrictGeometry,districtAxes} from '../src/district-geometry.js';
import {makeStreetLayout} from '../src/street-layout.js';
import {createSidewalkGeometry} from '../src/street-detail-geometry.js';
const json=async p=>JSON.parse(await readFile('public'+p));
globalThis.fetch=async p=>new Response(await readFile('public'+p));
const world=new CollisionWorld((await json('/data/nyc/manifest.json')).files);world.radius=750;await world.stream(new Vector3(0,50,0));
const g=createDistrictGeometry();world.addStatic('district',g.collision);world.addStatic('sidewalks',createSidewalkGeometry(makeStreetLayout(await json('/data/streets-osm.json'))).collision);
const distance=(a,b)=>a.clone().sub(b).setZ(0).length();
function walk(points,run){const player=new Player(world,{bounded:false});player.position.copy(points[0]);for(const target of points.slice(1)){let frames=0;const budget=Math.ceil(distance(player.position,target)/(run?8:3.2)*60)+120;while(distance(player.position,target)>.15&&frames++<budget){const d=target.clone().sub(player.position);player.update(FIXED_STEP,new Set(run?['ArrowUp','ShiftLeft']:['ArrowUp']),Math.atan2(d.x,d.y));}assert(distance(player.position,target)<.16,`blocked ${player.position.toArray()} toward ${target.toArray()}`);assert(player.position.z<.45,'stays at street level');}}
test('remaining district skins fit real NYC walls, stay bounded and preserve authored fronts',()=>{
 assert(D.facades.length>250);const names=new Set(D.facades.map(f=>f.street));for(const name of ['6th Avenue','8th Avenue','Broadway','7th Avenue','West 49th Street'])assert(names.has(name));
 const origin=new Vector3(...D.origin),east=new Vector3(...D.east),north=new Vector3(...D.north);
 for(const f of D.facades){const a=districtAxes(f);for(const x of [-.49,0,.49]){
  const p=a.p(x*f.width,0,0),d=p.clone().sub(origin);assert(d.dot(east)>6&&d.dot(east)<544&&d.dot(north)>9&&d.dot(north)<562);
  for(const prior of D.preserved){const n=new Vector3(...prior.normal),delta=p.clone().sub(new Vector3(...prior.center)),r=new Vector3(-n.y,n.x,0);assert(!(Math.abs(n.dot(a.n))>.92&&Math.abs(delta.dot(n))<3&&Math.abs(delta.dot(r))<prior.width/2+1),`${f.id} preserves authored face`);}
  for(const z of [.42,3,5.8,f.top-.1]){if(insideVoco48Source(a.p(x*f.width,-.14,z).toArray()))continue;const h=world.ray(a.p(x*f.width,.4,z),a.n.clone().negate(),.7,true);assert(h&&Math.abs(h.distance-.54)<.045,`${f.id} on source, ${h?.distance}`);}
 }}
 for(const list of [g.collision,...g.batches.values()])assert(list.every(Number.isFinite));assert(g.collision.length<4_000_000,'bounded detail collision');
});
test('new scaffolding has clear walking and running passages in both directions',()=>{
 for(const passage of g.passages)for(const run of [false,true])for(const reverse of [false,true])walk(reverse?[...passage.points].reverse():passage.points,run);
});
test('district visit points remain outdoors and lamps leave mapped walking paths open',()=>{
 for(const place of D.places){const p=new Vector3(...place.view.position);assert(!world.ray(p.clone().setZ(700),new Vector3(0,0,-1),699.5,true),`${place.id} outdoor spawn`);assert(distance(p,world.resolve(p.clone()))<.04,`${place.id} prop clearance`);}
 for(const l of D.lamps){const p=new Vector3(...l.position).addScaledVector(new Vector3(...l.normal),-1.2);assert(distance(p,world.resolve(p.clone()))<.04,'mapped sidewalk lamp clearance');}
});

test('mapped side streets remain traversable through the new scenery',()=>{for(const route of D.routes)for(const run of [false,true])walk(route.points.map(p=>new Vector3(...p)),run);});
