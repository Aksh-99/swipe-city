import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {Vector3} from 'three';import {CollisionWorld} from '../src/collision.js';import {Player,FIXED_STEP} from '../src/player.js';
import {createStorefrontGeometry} from '../src/storefront-geometry.js';import {STOREFRONTS} from '../src/storefront-config.js';
import {makeStreetLayout} from '../src/street-layout.js';
import {createSidewalkGeometry} from '../src/street-detail-geometry.js';
import {createCurbBollardGeometry} from '../src/curb-bollard-geometry.js';
import {createBroadwayRetailGeometry} from '../src/broadway-retail-geometry.js';
const manifest=JSON.parse(await readFile(new URL('../public/data/nyc/manifest.json',import.meta.url)));
const layout=makeStreetLayout(JSON.parse(await readFile(new URL('../public/data/streets-osm.json',import.meta.url))));
const poles=new Map(JSON.parse(await readFile(new URL('../public/data/street-details.json',import.meta.url))).poles.map(p=>[p.id,p.position]));
layout.signals=layout.signals.filter(s=>poles.has(s.id));for(const s of layout.signals)s.position.fromArray(poles.get(s.id));
globalThis.fetch=async url=>new Response(await readFile(new URL('../public'+url,import.meta.url)));
const world=new CollisionWorld(manifest.files),geometry=createStorefrontGeometry();world.addStatic('shops',geometry.collision);
world.addStatic('reference-retail',createBroadwayRetailGeometry().collision);
const bollards=createCurbBollardGeometry(layout);
world.addStatic('curb-bollards',bollards.collision);world.addStatic('sidewalks',createSidewalkGeometry(layout).collision);
test('shop facades and closed doors remain solid with original NYC buildings loaded',async()=>{
 for(const id of ['grand-slam','times-pizza','duffy-deli','mms']){
  const f=STOREFRONTS.find(f=>f.id===id),center=new Vector3(...f.center),normal=new Vector3(...f.normal),p=new Player(world);
  await world.stream(center);p.position.copy(center.clone().addScaledVector(normal,5).setZ(.17));
  for(let i=0;i<120;i++)p.update(FIXED_STEP,new Set(['ArrowUp','ShiftLeft']),Math.atan2(-normal.x,-normal.y));
  assert(p.position.clone().sub(center).dot(normal)>.3,`${id}: must stop outside the building`);
 }
});
test('both M&M’s glass faces retain solid walls and a clear sidewalk route',async()=>{
 for(const f of STOREFRONTS.find(f=>f.id==='mms').facades){
  const center=new Vector3(...f.center),normal=new Vector3(...f.normal),right=new Vector3(-normal.y,normal.x,0),p=new Player(world);
  await world.stream(center);p.position.copy(center.clone().addScaledVector(normal,5).setZ(.17));
  for(let i=0;i<120;i++)p.update(FIXED_STEP,new Set(['ArrowUp','ShiftLeft']),Math.atan2(-normal.x,-normal.y));
  assert(p.position.clone().sub(center).dot(normal)>.30,'glass frontage must remain solid');
  p.position.copy(center.clone().addScaledVector(normal,2.6).addScaledVector(right,-5).setZ(.17));
  for(let i=0;i<220;i++)p.update(FIXED_STEP,new Set(['ArrowUp']),Math.atan2(right.x,right.y));
  assert(p.position.clone().sub(center).dot(right)>5,'slim facade must leave the sidewalk passable');
 }
});
test('display boards leave a pedestrian route along the deli frontage',async()=>{
 const f=STOREFRONTS.find(f=>f.id==='duffy-deli'),center=new Vector3(...f.center),normal=new Vector3(...f.normal),right=new Vector3(-normal.y,normal.x,0),p=new Player(world);
 await world.stream(center);p.position.copy(center.clone().addScaledVector(normal,2.5).addScaledVector(right,-f.width/2).setZ(.17));
 for(let i=0;i<Math.ceil((f.width+1)/3.2/FIXED_STEP);i++)p.update(FIXED_STEP,new Set(['ArrowUp']),Math.atan2(right.x,right.y));
 assert(p.position.clone().sub(center).dot(right)>f.width/2,'sidewalk must remain passable beside the display board');
});
test('Hershey’s rounded glass blocks entry and leaves a route around the corner',async()=>{
 const store=STOREFRONTS.find(f=>f.id==='hersheys'),corner=new Vector3(...store.corner),normals=store.facades.map(f=>new Vector3(...f.normal));
 await world.stream(corner);
 for(const n of [normals[0],normals[0].clone().add(normals[1]).normalize(),normals[1]]){
  const p=new Player(world);p.position.copy(corner).addScaledVector(n,4).setZ(.17);
  for(let i=0;i<100;i++)p.update(FIXED_STEP,new Set(['ArrowUp']),Math.atan2(-n.x,-n.y));
  assert(p.position.clone().sub(corner).dot(n)>store.radius+.25,'rounded glass should stop the player outside the skin');
 }
 const p=new Player(world),a0=Math.atan2(normals[0].y,normals[0].x);let a1=Math.atan2(normals[1].y,normals[1].x);while(a1<a0)a1+=Math.PI*2;
 for(let a=a0;a<=a1;a+=.04){const wanted=corner.clone().add(new Vector3(Math.cos(a)*3,Math.sin(a)*3,.17));p.position.copy(wanted);world.resolve(p.position);assert(p.position.distanceTo(wanted)<.05,'pedestrians need a clear route outside the curved corner');}
});
test('Disney and its neighboring shops stay solid with clear door approaches and sidewalk paths',async()=>{
 for(const f of STOREFRONTS.filter(f=>f.retailGroup==='disney-block')){
  const center=new Vector3(...f.center),normal=new Vector3(...f.normal),right=new Vector3(-normal.y,normal.x,0),p=new Player(world);
  await world.stream(center);
  const doorX=f.id==='disney'?f.width/2-3.15:0;
  p.position.copy(center.clone().addScaledVector(right,doorX).addScaledVector(normal,6).setZ(.17));
  for(let i=0;i<200;i++)p.update(FIXED_STEP,new Set(['ArrowUp']),Math.atan2(-normal.x,-normal.y));
  const wallDistance=p.position.clone().sub(center).dot(normal);
  assert(wallDistance>.3&&wallDistance<1.3,`${f.id}: approach must be open but closed shop doors must remain solid`);
  p.position.copy(center.clone().addScaledVector(normal,2.05).addScaledVector(right,-f.width/2+.3).setZ(.17));
  for(let i=0;i<Math.ceil(f.width/3.2/FIXED_STEP);i++)p.update(FIXED_STEP,new Set(['ArrowUp']),Math.atan2(right.x,right.y));
  assert(p.position.clone().sub(center).dot(right)>f.width/2-.4,`${f.id}: the route inside the bollard line must remain clear`);
 }
});
test('silver curb posts stop a running player while the gaps remain walkable',async()=>{
 assert(bollards.posts.length>=20,'the curb row must span the retail block');
 assert(bollards.posts.filter(p=>p.row==='hard-rock').length>=20,'Hard Rock needs its own silver curb row');
 for(const post of bollards.posts){
  await world.stream(post.position);
  const p=new Player(world),n=post.normal;
  let nearest=Infinity;
  p.position.copy(post.position).addScaledVector(n,1.4);
  // Allow the sprint acceleration ramp before checking physical post contact.
  for(let i=0;i<28;i++){
   p.update(FIXED_STEP,new Set(['ArrowUp','ShiftLeft']),Math.atan2(-n.x,-n.y));
   const delta=p.position.clone().sub(post.position).setZ(0);
   nearest=Math.min(nearest,delta.length());
   assert(delta.length()>=post.radius+.32-.015,'running must not penetrate a steel cylinder');
  }
  assert(nearest<post.radius+.36,'the player must actually reach the post before sliding around it');
 }
 for(let i=1;i<bollards.posts.length;i++){
  const a=bollards.posts[i-1],b=bollards.posts[i],mid=a.position.clone().lerp(b.position,.5),p=new Player(world);
  if(a.row!==b.row)continue;
  p.position.copy(mid).addScaledVector(a.normal,1.2);
  for(let k=0;k<64;k++)p.update(FIXED_STEP,new Set(['ArrowUp']),Math.atan2(-a.normal.x,-a.normal.y));
  assert(p.position.clone().sub(mid).dot(a.normal)<-1,'walking through each gap must reach the sidewalk');
 }
});
test('Hard Rock and the reference restaurant doors are solid and the marquee route stays open',async()=>{
 for(const id of ['hard-rock','harbor-shrimp']){
  const f=STOREFRONTS.find(s=>s.id===id),center=new Vector3(...f.center),n=new Vector3(...f.normal),p=new Player(world);
  await world.stream(center);p.position.copy(center).addScaledVector(n,10).setZ(.17);
  for(let i=0;i<220;i++)p.update(FIXED_STEP,new Set(['ArrowUp']),Math.atan2(-n.x,-n.y));
  const distance=p.position.clone().sub(center).dot(n);
  assert(distance>.5&&distance<1.25,`${id}: clear approach to a physically closed entrance`);
 }
 const f=STOREFRONTS.find(s=>s.id==='hard-rock'),center=new Vector3(...f.center),n=new Vector3(...f.normal),right=new Vector3(-n.y,n.x,0),p=new Player(world);
 p.position.copy(center).addScaledVector(n,2.3).addScaledVector(right,-10).setZ(.17);
 for(let i=0;i<400;i++)p.update(FIXED_STEP,new Set(['ArrowUp']),Math.atan2(right.x,right.y));
 assert(p.position.clone().sub(center).dot(right)>10,'the full sidewalk below the marquee must remain walkable');
 const canopy=world.ray(center.clone().addScaledVector(n,2.3).setZ(3),new Vector3(0,0,1),7);
 assert(canopy&&canopy.point.z>5&&canopy.point.z<7,'projecting marquee must have a real overhead collision surface');
 const spawn=new Vector3(...f.view.position),overhead=world.ray(spawn.clone().setZ(700),new Vector3(0,0,-1),701,true);
 assert(!overhead||overhead.point.z<.45,'Visit Hard Rock must start in the open street');
});
