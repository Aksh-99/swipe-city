import test from 'node:test';
import {createStreetVendorGeometry} from '../src/street-vendor-geometry.js';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Vector3} from 'three';
import {CollisionWorld} from '../src/collision.js';
import {Player,FIXED_STEP} from '../src/player.js';
import {createNypdPlazaGeometry} from '../src/nypd-plaza-geometry.js';
import {createNasdaqGeometry} from '../src/nasdaq-geometry.js';
import {createAvenueGeometry} from '../src/avenue-geometry.js';
import {NYPD_PLAZA} from '../src/nypd-plaza-config.js';
import {createStreetscapeGeometry} from '../src/streetscape-geometry.js';
import {createSidewalkGeometry} from '../src/street-detail-geometry.js';
import {makeStreetLayout,nearestSegment} from '../src/street-layout.js';
import {SUBWAY_ENTRANCES} from '../src/streetscape-config.js';
import {insideEntrance,entrancePoint,entranceCoordinates} from '../src/ground-cutouts.js';

const manifest=JSON.parse(await readFile(new URL('../public/data/nyc/manifest.json',import.meta.url)));
globalThis.fetch=async url=>new Response(await readFile(new URL('../public'+url,import.meta.url)));
const world=new CollisionWorld(manifest.files),geometry=createNypdPlazaGeometry();
const layout=makeStreetLayout(JSON.parse(await readFile(new URL('../public/data/streets-osm.json',import.meta.url))));
world.addStatic('vendors',createStreetVendorGeometry().collision);world.addStatic('nypd',geometry.collision);world.addStatic('nasdaq',createNasdaqGeometry().collision);world.addStatic('sidewalks',createSidewalkGeometry(layout).collision);world.addStatic('streetscape',createStreetscapeGeometry().collision);
world.addStatic('avenue',createAvenueGeometry().collision);
world.groundBase=p=>{const e=SUBWAY_ENTRANCES.find(e=>insideEntrance(e,p));return e?-e.depth:0;};
await world.stream(new Vector3(...NYPD_PLAZA.station.center));
const horizontal=(a,b)=>a.clone().sub(b).setZ(0).length();

test('NYPD detail uses the real pavilion and a safe visit position; closed doors stop running',()=>{
 for(const f of NYPD_PLAZA.station.facades){
  const c=new Vector3(...f.center),n=new Vector3(...f.normal),r=new Vector3(-n.y,n.x,0);
  for(const x of [-.45,0,.45]){
   const hit=world.ray(c.clone().addScaledVector(r,x*f.width).addScaledVector(n,2).setZ(2),n.clone().negate(),3,true);
   assert(hit&&Math.abs(hit.distance-2.075)<.08,'cladding must stay attached to the original source wall');
  }
 }
 const f=NYPD_PLAZA.station.facades[0],c=new Vector3(...f.center),n=new Vector3(...f.normal),p=new Player(world);
 p.position.copy(c).addScaledVector(n,3).setZ(.17);
 for(let i=0;i<70;i++)p.update(FIXED_STEP,new Set(['ArrowUp','ShiftLeft']),Math.atan2(-n.x,-n.y));
 const distance=p.position.clone().sub(c).dot(n);assert(distance>.38&&distance<.60,'door approach must stay clear and the doors solid');
 const spawn=new Vector3(...NYPD_PLAZA.station.view.position),roof=world.ray(spawn.clone().setZ(700),new Vector3(0,0,-1),701,true);
 assert(!roof||roof.point.z<.45,'visit must not place the player in a roof footprint');
 assert(horizontal(world.resolve(spawn.clone()),spawn)<.02,'visit must not overlap a prop');
});
test('station scaffold routes and the open Broadway retail connection remain walkable',()=>{
 for(const s of NYPD_PLAZA.scaffolds){
  const c=new Vector3(...s.center),a=new Vector3(...s.along),p=new Player(world);
  p.position.copy(c).addScaledVector(a,-s.length/2+.25).setZ(.17);
  const yaw=Math.atan2(a.x,a.y),steps=Math.ceil((s.length-.5)/3.2/FIXED_STEP);
  for(let i=0;i<steps;i++)p.update(FIXED_STEP,new Set(['ArrowUp']),yaw);
  assert(p.position.clone().sub(c).dot(a)>s.length/2-.45,`${s.id}: the covered walkway must stay open`);
  assert(p.position.z<.30,`${s.id}: player must stay at street level`);
  // The old opposite-Broadway shed was replaced by the curved MarketSite
  // shed plus Avenue's open retail frontage. Its street route remains open;
  // the actual curved canopy is covered in nasdaq.test.js.
  if(s.id!=='opposite-broadway'){const ceiling=world.ray(c.clone().setZ(1.8),new Vector3(0,0,1),4);assert(ceiling&&ceiling.point.z>3.0,'shed must have clear headroom and a physical canopy');}
 }
});
test('plaza retains a four-metre central corridor and space around umbrella seating',()=>{
 for(const q of NYPD_PLAZA.route)for(const x of [-2,-1,0,1,2]){
  const p=new Vector3(...q).add(new Vector3(x,0,0)),resolved=world.resolve(p.clone());
  assert(horizontal(p,resolved)<.02,`central plaza path blocked at ${p.toArray()}`);
 }
 for(const table of NYPD_PLAZA.tables){
  const center=new Vector3(...table.position);
  assert((nearestSegment(center,layout.crossings)?.distance??Infinity)>3.4,'furniture must leave crossing approaches open');
  for(let angle=0;angle<Math.PI*2;angle+=Math.PI/16){const p=center.clone().add(new Vector3(Math.cos(angle)*1.85,Math.sin(angle)*1.85,0));p.z=.17;assert(horizontal(p,world.resolve(p.clone()))<.04,`table ${table.side} / ${center.y}, angle ${angle}, point ${p.toArray()}: chairs must leave room to walk around each table`);}
 }
});
test('metal barricades and silver posts stop the capsule without closing the doorway',()=>{
 const props=new CollisionWorld([]);props.addStatic('nypd',geometry.collision);
 for(const b of geometry.barriers){
  const p=new Player(props);p.position.copy(b.center).addScaledVector(b.normal,1.0);
  for(let i=0;i<18;i++)p.update(FIXED_STEP,new Set(['ArrowUp','ShiftLeft']),Math.atan2(-b.normal.x,-b.normal.y));
  assert(p.position.clone().sub(b.center).dot(b.normal)>.30,'metal rails should stop a running player');
 }
 for(const b of geometry.posts){const p=b.position.clone().addScaledVector(b.normal,.2),resolved=props.resolve(p.clone());assert(horizontal(resolved,b.position)>.48,'silver bollards must have physical collision');}
 const door=NYPD_PLAZA.station.facades[0],c=new Vector3(...door.center),n=new Vector3(...door.normal);
 for(let distance=.7;distance<3;distance+=.1){const p=c.clone().addScaledVector(n,distance).setZ(.17);assert(horizontal(p,world.resolve(p.clone()))<.02,'no barricade may span the station entrance');}
});
test('umbrella seating and construction leave the Times Square subway entrance usable',()=>{
 const e=SUBWAY_ENTRANCES.find(e=>e.id==='mta-82'),p=new Player(world),yaw=Math.atan2(e.direction[0],e.direction[1]);
 p.position.copy(entrancePoint(e,0,-2,.17));
 for(let i=0;i<205;i++)p.update(FIXED_STEP,new Set(['ArrowUp']),yaw);
 assert(p.position.z<-2.85&&entranceCoordinates(e,p.position).y>e.length,'new props must not cover or block the stairwell');
 for(let i=0;i<220;i++)p.update(FIXED_STEP,new Set(['ArrowDown']),yaw);
 assert(p.position.z>=0&&entranceCoordinates(e,p.position).y<-1,'subway exit must remain open');
});
