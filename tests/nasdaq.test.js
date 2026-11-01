import test from 'node:test';
import {createStreetVendorGeometry} from '../src/street-vendor-geometry.js';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Vector3} from 'three';
import {NASDAQ} from '../src/nasdaq-config.js';
import {createNasdaqGeometry,nasdaqPoint} from '../src/nasdaq-geometry.js';
import {createNypdPlazaGeometry} from '../src/nypd-plaza-geometry.js';
import {createSidewalkGeometry,createSignalGeometry} from '../src/street-detail-geometry.js';
import {createStreetscapeGeometry} from '../src/streetscape-geometry.js';
import {makeStreetLayout} from '../src/street-layout.js';
import {CollisionWorld} from '../src/collision.js';
import {Player,FIXED_STEP} from '../src/player.js';
import {SUBWAY_ENTRANCES} from '../src/streetscape-config.js';
import {insideEntrance} from '../src/ground-cutouts.js';

const json=async path=>JSON.parse(await readFile(new URL('../public'+path,import.meta.url)));
globalThis.fetch=async url=>new Response(await readFile(new URL('../public'+url,import.meta.url)));
const world=new CollisionWorld((await json('/data/nyc/manifest.json')).files),g=createNasdaqGeometry();
world.addStatic('vendors',createStreetVendorGeometry().collision);
const layout=makeStreetLayout(await json('/data/streets-osm.json'));
const positions=new Map((await json('/data/street-details.json')).poles.map(p=>[p.id,p.position]));
layout.signals=layout.signals.filter(s=>positions.has(s.id));for(const s of layout.signals)s.position.fromArray(positions.get(s.id));
for(const [id,geometry]of [['nasdaq',g],['nypd',createNypdPlazaGeometry()],['sidewalks',createSidewalkGeometry(layout)],['signals',createSignalGeometry(layout)],['streetscape',createStreetscapeGeometry()]])world.addStatic(id,geometry.collision);
world.groundBase=p=>{const e=SUBWAY_ENTRANCES.find(e=>insideEntrance(e,p));return e?-e.depth:0;};
await world.stream(new Vector3(...NASDAQ.center));
const horizontal=(a,b)=>a.clone().sub(b).setZ(0).length();

test('Nasdaq curved screen and return facades stay on the original building at real scale',()=>{
 for(const f of [...g.screens,...g.fascia])for(const u of [.04,.5,.96])for(const v of [.02,.5,.98]){
  const p=f.corners[0].clone().lerp(f.corners[1],u).lerp(f.corners[3].clone().lerp(f.corners[2],u),v),n=f.normal;
  const hit=world.ray(p.clone().addScaledVector(n,2),n.clone().negate(),3,true);
  assert(hit&&Math.abs(hit.distance-(g.screens.includes(f)?2.265:2.245))<.055,'screen must remain a thin source-aligned skin, not a replacement building');
 }
 for(const f of NASDAQ.returns){const n=new Vector3(...f.normal),r=new Vector3(-n.y,n.x,0),c=new Vector3(...f.center);
  for(const x of [-.47,0,.47])for(const z of [1,20,f.height]){
   const hit=world.ray(c.clone().addScaledVector(r,x*f.width).addScaledVector(n,2).setZ(z),n.clone().negate(),3,true);
   assert(hit&&Math.abs(hit.distance-2)<.095,'return facade must not extend beyond source mesh');
  }
 }
 for(const vertices of g.batches.values())assert(vertices.every(Number.isFinite),'no invalid coordinates may reach Cesium');
});

test('Visit Nasdaq spawns in open space and its route to the corner is clear',()=>{
 const spawn=new Vector3(...NASDAQ.view.position),roof=world.ray(spawn.clone().setZ(700),new Vector3(0,0,-1),701,true);
 assert(!roof||roof.point.z<.45,'visit may not start on a roof or inside a building');
 assert(horizontal(spawn,world.resolve(spawn.clone()))<.02,'visit may not overlap another landmark, pole, or prop');
 const target=nasdaqPoint(NASDAQ.length*.55,5,.17).point,p=new Player(world);p.position.copy(spawn);
 for(let i=0;i<300&&horizontal(p.position,target)>.12;i++){const d=target.clone().sub(p.position);p.update(FIXED_STEP,new Set(['ArrowUp']),Math.atan2(d.x,d.y));}
 assert(horizontal(p.position,target)<.15,'the frontage must be reachable from the visit position');
});

test('the covered corner can be walked and run in both directions without snagging',()=>{
 for(const reverse of [false,true])for(const run of [false,true]){
  const route=reverse?[...g.walkway].reverse():g.walkway,p=new Player(world);p.position.copy(route[0]);
  const keys=new Set(run?['ArrowUp','ShiftLeft']:['ArrowUp']);
  for(const target of route.slice(1)){
   let frame=0;
   while(horizontal(p.position,target)>.15&&frame++<100){const d=target.clone().sub(p.position);p.update(FIXED_STEP,keys,Math.atan2(d.x,d.y));}
   assert(horizontal(p.position,target)<.16,`covered route blocked near ${target.toArray()}, reverse=${reverse}, run=${run}`);
   assert(p.position.z<.31,'walking may not snap to a scaffold canopy or ledge');
  }
 }
 for(const p of g.walkway){const ceiling=world.ray(p.clone().setZ(1.8),new Vector3(0,0,1),4);assert(ceiling&&ceiling.point.z>=3.1,'covered route needs physical canopy and full headroom');}
});

test('curved studio walls and W43 entrance stop running; silver bollards remain solid',()=>{
 for(const s of [2,5,8,11,14]){
  const {point,normal}=nasdaqPoint(s,0,.17),p=new Player(world);p.position.copy(point).addScaledVector(normal,1.4);
  for(let i=0;i<25;i++)p.update(FIXED_STEP,new Set(['ArrowUp','ShiftLeft']),Math.atan2(-normal.x,-normal.y));
  assert(p.position.clone().sub(point).dot(normal)>.45,'closed studio glazing must stop the capsule');
 }
 for(const d of g.doors){const p=new Player(world);p.position.copy(d.point).addScaledVector(d.normal,2.5);
  for(let i=0;i<40;i++)p.update(FIXED_STEP,new Set(['ArrowUp','ShiftLeft']),Math.atan2(-d.normal.x,-d.normal.y));
  assert(p.position.clone().sub(d.point).dot(d.normal)>.18,'entrance stays solid');
 }
 const props=new CollisionWorld([]);props.addStatic('nasdaq',g.collision);
 for(const post of g.posts){const p=post.position.clone().addScaledVector(post.normal,.2);props.resolve(p);assert(horizontal(p,post.position)>.48,'steel cylinder must block the capsule');}
 const f=NASDAQ.returns[0],c=new Vector3(...f.center),n=new Vector3(...f.normal),r=new Vector3(-n.y,n.x,0);
 for(let x=-f.width/2+.5;x<f.width/2-.5;x+=.5){const p=c.clone().addScaledVector(r,x).addScaledVector(n,2.05).setZ(.17);assert(horizontal(p,world.resolve(p.clone()))<.025,'W43 sidewalk must stay clear alongside protection posts');}
});
