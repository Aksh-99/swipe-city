import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Vector3} from 'three';
import {CollisionWorld} from '../src/collision.js';
import {Player,FIXED_STEP} from '../src/player.js';
import {AVENUE as A} from '../src/avenue-config.js';
import {createAvenueGeometry,avenuePoint} from '../src/avenue-geometry.js';
import {createNasdaqGeometry} from '../src/nasdaq-geometry.js';
import {createNypdPlazaGeometry} from '../src/nypd-plaza-geometry.js';
import {createStreetVendorGeometry} from '../src/street-vendor-geometry.js';
import {createStreetscapeGeometry} from '../src/streetscape-geometry.js';
import {createSidewalkGeometry,createSignalGeometry} from '../src/street-detail-geometry.js';
import {makeStreetLayout} from '../src/street-layout.js';
const json=async p=>JSON.parse(await readFile('public'+p));
globalThis.fetch=async u=>new Response(await readFile('public'+u));
const world=new CollisionWorld((await json('/data/nyc/manifest.json')).files),g=createAvenueGeometry(),nasdaq=createNasdaqGeometry();
world.radius=300;await world.stream(new Vector3(...A.center));
const layout=makeStreetLayout(await json('/data/streets-osm.json')),poles=new Map((await json('/data/street-details.json')).poles.map(p=>[p.id,p.position]));
layout.signals=layout.signals.filter(s=>poles.has(s.id));for(const s of layout.signals)s.position.fromArray(poles.get(s.id));
for(const [id,geometry]of [['avenue',g],['nasdaq',nasdaq],['nypd',createNypdPlazaGeometry()],['vendors',createStreetVendorGeometry()],['streetscape',createStreetscapeGeometry()],['sidewalks',createSidewalkGeometry(layout)],['signals',createSignalGeometry(layout)]])world.addStatic(id,geometry.collision);
const horizontal=(a,b)=>a.clone().sub(b).setZ(0).length();
function travel(route,run){const p=new Player(world);p.position.copy(route[0]);for(const target of route.slice(1)){let frames=0;const budget=Math.ceil(horizontal(p.position,target)/(run?8:3.2)*60)+120;while(horizontal(p.position,target)>.15&&frames++<budget){const d=target.clone().sub(p.position);p.update(FIXED_STEP,new Set(run?['ArrowUp','ShiftLeft']:['ArrowUp']),Math.atan2(d.x,d.y));}assert(horizontal(p.position,target)<.16,`route blocked at ${target.toArray()}; player ${p.position.toArray()}`);assert(p.position.z<.4);}return p;}
test('Avenue curved fascia preserves original NYC wall and real screen proportions',()=>{
 assert(Math.abs(A.screen.to-A.screen.from-32.9184)<.0001);assert(Math.abs(A.screen.top-A.screen.bottom-12.8016)<.0001);
 for(const f of g.screens)for(const u of [.04,.5,.96])for(const v of [.02,.5,.98]){
  const p=f.corners[0].clone().lerp(f.corners[1],u).lerp(f.corners[3].clone().lerp(f.corners[2],u),v),n=f.normal,hit=world.ray(p.clone().addScaledVector(n,2),n.clone().negate(),3,true);
  assert(hit&&Math.abs(hit.distance-2.47)<.045,'billboard must be a thin skin on the source facade');
  assert(f.corners[1].clone().sub(f.corners[0]).dot(f.right)>0,'artwork reads left-to-right around the corner');
 }
 const main=g.screens.filter(f=>f.from===A.screen.from);for(let i=1;i<main.length;i++)assert(main[i-1].corners[1].distanceTo(main[i].corners[0])<1e-6,'continuous wrap, without facet gaps');
 for(const vertices of g.batches.values())assert(vertices.every(Number.isFinite));
});
test('Avenue visit and rounded sidewalk can be walked/run in both directions',()=>{
 const spawn=new Vector3(...A.view.position);assert(!world.ray(spawn.clone().setZ(700),new Vector3(0,0,-1),701,true));assert(horizontal(spawn,world.resolve(spawn.clone()))<.025);
 for(const run of [false,true])for(const reverse of [false,true])travel(reverse?[...g.walkway].reverse():g.walkway,run);
 travel([spawn,avenuePoint(43,2.08,.17).point],false);
 // The rebuilt corner connects to the unchanged MarketSite sidewalk.
 travel([nasdaq.walkway.at(-1),g.walkway[0]],true);
});
test('Avenue doors and silver bollards remain physical; entrance canopy has headroom',()=>{
 for(const d of g.doors){const p=new Player(world);p.position.copy(d.point).addScaledVector(d.normal,1.3);for(let i=0;i<25;i++)p.update(FIXED_STEP,new Set(['ArrowUp','ShiftLeft']),Math.atan2(-d.normal.x,-d.normal.y));assert(p.position.clone().sub(d.point).dot(d.normal)>.06);}
 const props=new CollisionWorld([]);props.addStatic('avenue',g.collision);for(const post of g.posts){const p=post.position.clone().addScaledVector(post.normal,.2);props.resolve(p);assert(horizontal(p,post.position)>.48);}
 const p=avenuePoint(43,.95,1.8).point,ceiling=world.ray(p,new Vector3(0,0,1),3);assert(ceiling&&ceiling.point.z>3.6&&ceiling.point.z<4.2);
});
