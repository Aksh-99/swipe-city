import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Vector3} from 'three';
import {RECRUITING_STATION as S,HARD_ROCK_FOOD_ROW as ROW} from '../src/recruiting-config.js';
import {createRecruitingGeometry} from '../src/recruiting-geometry.js';
import {createHardRockFoodGeometry} from '../src/hard-rock-food-geometry.js';
import {createStreetVendorGeometry} from '../src/street-vendor-geometry.js';
import {createStorefrontGeometry} from '../src/storefront-geometry.js';
import {createNypdPlazaGeometry} from '../src/nypd-plaza-geometry.js';
import {createNasdaqGeometry} from '../src/nasdaq-geometry.js';
import {createStreetscapeGeometry} from '../src/streetscape-geometry.js';
import {createSidewalkGeometry,createSignalGeometry} from '../src/street-detail-geometry.js';
import {createCurbBollardGeometry} from '../src/curb-bollard-geometry.js';
import {makeStreetLayout,localPoint,nearestSegment} from '../src/street-layout.js';
import {CollisionWorld} from '../src/collision.js';
import {Player,FIXED_STEP} from '../src/player.js';
import {NYPD_STATION} from '../src/nypd-plaza-config.js';
import {SUBWAY_ENTRANCES} from '../src/streetscape-config.js';
import {insideEntrance} from '../src/ground-cutouts.js';

const json=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url)));
globalThis.fetch=async p=>new Response(await readFile(new URL('../public'+p,import.meta.url)));
const world=new CollisionWorld((await json('public/data/nyc/manifest.json')).files),food=createHardRockFoodGeometry(),station=createRecruitingGeometry();
const layout=makeStreetLayout(await json('public/data/streets-osm.json'));
const poles=new Map((await json('public/data/street-details.json')).poles.map(p=>[p.id,p.position]));
layout.signals=layout.signals.filter(s=>poles.has(s.id));for(const s of layout.signals)s.position.fromArray(poles.get(s.id));
for(const [id,g]of [['food',food],['station',station],['vendors',createStreetVendorGeometry()],['shops',createStorefrontGeometry()],['nypd',createNypdPlazaGeometry()],['nasdaq',createNasdaqGeometry()],['streetscape',createStreetscapeGeometry()],['sidewalks',createSidewalkGeometry(layout)],['signals',createSignalGeometry(layout)],['curb-posts',createCurbBollardGeometry(layout)]])world.addStatic(id,g.collision);
world.groundBase=p=>{const e=SUBWAY_ENTRANCES.find(e=>insideEntrance(e,p));return e?-e.depth:0;};
await world.stream(new Vector3(...S.center));
const horizontal=(a,b)=>a.clone().sub(b).setZ(0).length();
const walk=(route,run=false)=>{
 const p=new Player(world);p.position.copy(route[0]);const keys=new Set(run?['ArrowUp','ShiftLeft']:['ArrowUp']);
 for(const target of route.slice(1)){
  let i=0;while(horizontal(p.position,target)>.14&&i++<600){const d=target.clone().sub(p.position);p.update(FIXED_STEP,keys,Math.atan2(d.x,d.y));}
  assert(horizontal(p.position,target)<.16,`blocked at ${target.toArray()}, actual ${p.position.toArray()}, run=${run}`);
  assert(p.position.z<.4,'routes stay on the pavement, not a prop or roof');
 }return p;
};

test('pavilion uses its real OSM footprint and height, outside all existing NYC geometry',async()=>{
 const osm=await json('docs/source-data/recruiting-osm.json'),way=osm.elements.find(e=>e.type==='way'),nodes=new Map(osm.elements.filter(e=>e.type==='node').map(n=>[n.id,n]));
 assert.equal(S.height,+way.tags.height);
 for(let i=0;i<4;i++)assert(new Vector3(...S.footprint[i]).distanceTo(localPoint(nodes.get(way.nodes[i])))<.001);
 for(const f of S.facades){
  const c=new Vector3(...f.center),n=new Vector3(...f.normal),r=new Vector3(-n.y,n.x,0);
  for(const x of [-.40,0,.40]){
   const q=c.clone().addScaledVector(r,x*f.width).addScaledVector(n,.2);
   assert(!world.ray(q.clone().setZ(700),new Vector3(0,0,-1),701,true),'source building must not be replaced or overlapped');
  }
 }
 const roof=world.ray(new Vector3(...S.center).setZ(9),new Vector3(0,0,-1),8);
 assert(roof&&Math.abs(roof.point.z-S.height)<.03,'camera and player use the actual pavilion roof height');
 for(const g of [food,station]){for(const v of g.batches.values())assert(v.every(Number.isFinite));assert([...g.collision].every(Number.isFinite));}
});

test('both visit buttons start on clear pavement; flag walls and north entrance stop running',()=>{
 for(const target of [S,ROW]){
  const p=new Vector3(...target.view.position);assert(!world.ray(p.clone().setZ(700),new Vector3(0,0,-1),701,true));
  assert(horizontal(p,world.resolve(p.clone()))<.02,'visit must not place a player in a cart or bollard');
 }
 for(const f of S.facades){
  const c=new Vector3(...f.center),n=new Vector3(...f.normal),p=new Player(world);p.position.copy(c).addScaledVector(n,1.0).setZ(.17);
  for(let i=0;i<35;i++)p.update(FIXED_STEP,new Set(['ArrowUp','ShiftLeft']),Math.atan2(-n.x,-n.y));
  assert(p.position.clone().sub(c).dot(n)>.30,'all sides, including closed entrance, need solid collision');
 }
});

test('Hard Rock sidewalk is walkable and runnable in both directions behind the food row',()=>{
 for(const reverse of [false,true])for(const run of [false,true])walk(reverse?[...food.walkway].reverse():food.walkway,run);
 walk([new Vector3(...ROW.view.position),food.walkway.at(-1),food.walkway[0]],true);
 for(const strip of ROW.paving)for(const a of [strip.a,strip.b]){
  const p=new Vector3(...a).setZ(0);assert(nearestSegment(p,layout.roadPaths).distance>4.95,'apron stays out of W43 lanes');
  assert(!world.ray(p.clone().setZ(700),new Vector3(0,0,-1),701,true),'apron stays outside Paramount source footprint');
 }
});

test('food carts and all new silver bollards are solid with room for customers',()=>{
 for(const c of food.carts){
  const p=new Player(world);p.position.copy(c.position).addScaledVector(c.normal,1.05);
  for(let i=0;i<32;i++)p.update(FIXED_STEP,new Set(['ArrowUp','ShiftLeft']),Math.atan2(-c.normal.x,-c.normal.y));
  assert(p.position.clone().sub(c.position).dot(c.normal)>.73,'running must stop at the counter');
  const q=c.position.clone().addScaledVector(c.normal,1.03);assert(horizontal(q,world.resolve(q.clone()))<.02,'counter approach stays open');
  // Probe below the chassis. A normal player-ground probe from inside the
  // cart can hit its low axle/base, which is correctly also a solid surface.
  const floor=world.ray(c.position.clone().add(new Vector3(0,0,.06)),new Vector3(0,0,-1),.12);
  assert(floor&&Math.abs(floor.point.z-c.position.z)<.02,'cart wheels touch pavement');
 }
 const props=new CollisionWorld([]);props.addStatic('food',food.collision);props.addStatic('station',station.collision);
 for(const post of [...food.posts,...station.posts]){const q=post.position.clone().addScaledVector(post.normal,.20);props.resolve(q);assert(horizontal(q,post.position)>.48,'silver post must block the capsule');}
});

test('station perimeter, mapped north entrance and the crossings opposite NYPD remain reachable',()=>{
 const c=new Vector3(...S.center),n=new Vector3(...S.facades.find(f=>f.id==='north').normal),r=new Vector3(-n.y,n.x,0);
 const at=(x,y)=>c.clone().addScaledVector(r,x).addScaledVector(n,y).setZ(.17);
 const perimeter=[at(-4.2,-8.0),at(-4.2,8.0),at(4.2,8.0),at(4.2,-8.0),at(-4.2,-8.0)];
 for(const reverse of [false,true])walk(reverse?[...perimeter].reverse():perimeter,true);
 walk([at(0,10),at(0,6.8)],false);
 for(const id of [702543822,702543826,1117680750]){
  const crossing=layout.crossings.find(c=>c.id===id),route=crossing.points.map(p=>p.clone().setZ(.17));
  walk(route,false);walk([...route].reverse(),true);
 }
 // North median and station can be reached from the NYPD visit point via
 // the marked W43 crossing, without cutting through either real pavilion.
 const crossing=layout.crossings.find(c=>c.id===1117680750);
 walk([new Vector3(...NYPD_STATION.view.position),...crossing.points.slice().reverse().map(p=>p.clone().setZ(.17)),at(0,-8.0)],false);
});
