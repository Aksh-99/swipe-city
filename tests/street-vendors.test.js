import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Vector3} from 'three';
import {STREET_VENDORS} from '../src/street-vendor-config.js';
import {createStreetVendorGeometry} from '../src/street-vendor-geometry.js';
import {createNasdaqGeometry} from '../src/nasdaq-geometry.js';
import {createNypdPlazaGeometry} from '../src/nypd-plaza-geometry.js';
import {createSidewalkGeometry,createSignalGeometry} from '../src/street-detail-geometry.js';
import {createStreetscapeGeometry} from '../src/streetscape-geometry.js';
import {makeStreetLayout,nearestSegment} from '../src/street-layout.js';
import {CollisionWorld} from '../src/collision.js';
import {Player,FIXED_STEP} from '../src/player.js';
import {NASDAQ} from '../src/nasdaq-config.js';

const json=async path=>JSON.parse(await readFile(new URL('../public'+path,import.meta.url)));
globalThis.fetch=async path=>new Response(await readFile(new URL('../public'+path,import.meta.url)));
const layout=makeStreetLayout(await json('/data/streets-osm.json'));
const positions=new Map((await json('/data/street-details.json')).poles.map(p=>[p.id,p.position]));
layout.signals=layout.signals.filter(s=>positions.has(s.id));for(const s of layout.signals)s.position.fromArray(positions.get(s.id));
const world=new CollisionWorld((await json('/data/nyc/manifest.json')).files),g=createStreetVendorGeometry();
for(const [id,geometry]of [['vendors',g],['nasdaq',createNasdaqGeometry()],['nypd',createNypdPlazaGeometry()],['sidewalks',createSidewalkGeometry(layout)],['signals',createSignalGeometry(layout)],['streetscape',createStreetscapeGeometry()]])world.addStatic(id,geometry.collision);
await world.stream(new Vector3(...NASDAQ.center));
const horizontal=(a,b)=>a.clone().sub(b).setZ(0).length();

test('vendor forecourt stays outside the original buildings and behind the mapped street curb',()=>{
 for(const strip of STREET_VENDORS.paving)for(const point of [strip.a,strip.b]){
  const p=new Vector3(...point),roof=world.ray(p.clone().setZ(700),new Vector3(0,0,-1),701,true);
  assert(!roof||roof.point.z<.45,'pavement must not cover a building footprint');
  assert(nearestSegment(p.clone().setZ(0),layout.roadPaths).distance>4.93,'new paving may not cover the W43 traffic lanes');
 }
 for(const cart of g.carts){
  for(const x of [-1.18,0,1.18])for(const y of [-.78,.55]){
   const p=cart.position.clone().addScaledVector(cart.right,x).addScaledVector(cart.normal,y);
   assert(!world.ray(p.setZ(700),new Vector3(0,0,-1),701,true),'cart must be outside the real building');
  }
 }
 for(const vertices of g.batches.values())assert(vertices.every(Number.isFinite));
});

test('each cart stops a running player and has a clear customer position under its umbrella',()=>{
 for(const c of g.carts){
  const p=new Player(world);p.position.copy(c.position).addScaledVector(c.normal,1.8);
  for(let i=0;i<40;i++)p.update(FIXED_STEP,new Set(['ArrowUp','ShiftLeft']),Math.atan2(-c.normal.x,-c.normal.y));
  const distance=p.position.clone().sub(c.position).dot(c.normal);
  assert(distance>.74&&distance<1.05,'cart and serving counter must be physical obstacles');
  const customer=c.position.clone().addScaledVector(c.normal,1.12);
  assert(horizontal(customer,world.resolve(customer.clone()))<.025,'customer side needs standing/walking room');
  const top=world.ray(customer.clone().setZ(1.9),new Vector3(0,0,1),2);
  assert(top&&top.point.z>2.3,'fabric canopy should stop the camera while leaving headroom');
  const floor=world.ground(c.position.clone());assert(Math.abs(floor-c.position.z)<.015,'cart wheels must rest on the forecourt');
 }
});

test('silver posts and recycling stations are solid, with an unobstructed signal crossing',()=>{
 const props=new CollisionWorld([]);props.addStatic('vendors',g.collision);
 for(const post of g.posts){const p=post.position.clone().addScaledVector(post.normal,.2);props.resolve(p);assert(horizontal(p,post.position)>.48,'collared silver post must have collision');}
 for(const b of STREET_VENDORS.bins){
  const center=new Vector3(...b.position),n=new Vector3(...b.normal),p=new Player(world);p.position.copy(center).addScaledVector(n,1.6);
  for(let i=0;i<30;i++)p.update(FIXED_STEP,new Set(['ArrowUp','ShiftLeft']),Math.atan2(-n.x,-n.y));
  assert(p.position.clone().sub(center).dot(n)>.65,'bins must stop the player');
 }
 const crossing=layout.crossings.find(c=>c.id===1117680764),a=crossing.points[0],b=crossing.points.at(-1),direction=b.clone().sub(a).normalize();
 for(const reverse of [false,true])for(const running of [false,true]){
  const start=a.clone().addScaledVector(direction,-1.0).setZ(.17),end=b.clone().addScaledVector(direction,2.4).setZ(.17),p=new Player(world),target=reverse?start:end;
  p.position.copy(reverse?end:start);const keys=new Set(running?['ArrowUp','ShiftLeft']:['ArrowUp']);
  for(let i=0;i<400&&horizontal(p.position,target)>.15;i++){const d=target.clone().sub(p.position);p.update(FIXED_STEP,keys,Math.atan2(d.x,d.y));}
  assert(horizontal(p.position,target)<.16,'bollards, pole base and carts must leave the W43 crossing open');
 }
});
