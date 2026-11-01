import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {Vector3} from 'three';import {CollisionWorld} from '../src/collision.js';import {Player,FIXED_STEP} from '../src/player.js';
import {createStreetscapeGeometry} from '../src/streetscape-geometry.js';import {createSidewalkGeometry} from '../src/street-detail-geometry.js';import {makeStreetLayout} from '../src/street-layout.js';
import {FEATURED_SUBWAY,SUBWAY_ENTRANCES,SCAFFOLDS} from '../src/streetscape-config.js';import {entrancePoint,entranceCoordinates,insideEntrance} from '../src/ground-cutouts.js';
import {ThirdPersonCamera} from '../src/camera.js';import {toLocal} from '../src/coordinates.js';
const streets=JSON.parse(await readFile(new URL('../public/data/streets-osm.json',import.meta.url))),manifest=JSON.parse(await readFile(new URL('../public/data/nyc/manifest.json',import.meta.url)));
globalThis.fetch=async url=>new Response(await readFile(new URL('../public'+url,import.meta.url)));
const world=new CollisionWorld(manifest.files);world.addStatic('details',createStreetscapeGeometry().collision);world.addStatic('sidewalks',createSidewalkGeometry(makeStreetLayout(streets)).collision);world.groundBase=p=>{const e=SUBWAY_ENTRANCES.find(e=>insideEntrance(e,p));return e?-e.depth:0;};await world.stream(new Vector3(...FEATURED_SUBWAY.origin));
test('subway stairs descend below the street to a landing and return outside',()=>{
 const e=FEATURED_SUBWAY,p=new Player(world);p.position.copy(entrancePoint(e,0,-1,.17));const yaw=Math.atan2(e.direction[0],e.direction[1]);
 for(let i=0;i<170;i++)p.update(FIXED_STEP,new Set(['ArrowUp']),yaw);
 assert(p.position.z<-e.depth+.15,'street collision must not seal the stairwell');assert(p.grounded);assert(entranceCoordinates(e,p.position).y>e.length);
 for(let i=0;i<190;i++)p.update(FIXED_STEP,new Set(['ArrowDown']),yaw);
 assert(p.position.z>=0,'must return to street grade');assert(entranceCoordinates(e,p.position).y<0);
});
test('stairwell walls prevent falling sideways and running through the landing wall',()=>{
 const e=FEATURED_SUBWAY,p=new Player(world),yaw=Math.atan2(e.direction[0],e.direction[1]);p.position.copy(entrancePoint(e,0,e.length*.6,.17-(e.depth+.17)*.6));
 for(let i=0;i<60;i++)p.update(FIXED_STEP,new Set(['ArrowRight','ShiftLeft']),yaw);
 assert(Math.abs(entranceCoordinates(e,p.position).x)<e.width/2-.25);
 p.position.copy(entrancePoint(e,0,e.length+.5,-e.depth));for(let i=0;i<60;i++)p.update(FIXED_STEP,new Set(['ArrowUp','ShiftLeft']),yaw);
 assert(entranceCoordinates(e,p.position).y<e.length+e.landing-.25);assert(p.position.z>-e.depth-.1);
});
test('camera remains inside the stairwell when orbiting next to its landing wall',()=>{
 const e=FEATURED_SUBWAY,p=new Player(world),yaw=Math.atan2(e.direction[0],e.direction[1]);p.position.copy(entrancePoint(e,0,e.length+.5,-e.depth));
 for(let i=0;i<60;i++)p.update(FIXED_STEP,new Set(['ArrowUp']),yaw);
 let position;const viewer={camera:{setView:view=>position=new Vector3().copy(toLocal(view.destination)),frustum:{}}},camera=new ThirdPersonCamera(viewer,world);camera.yaw=yaw+Math.PI;camera.pitch=.08;camera.update(p);
 assert(insideEntrance(e,position),'camera must not cross the landing wall');assert(position.z<0,'camera must remain below the street');
 const target=p.position.clone().add(new Vector3(0,0,1.6)),direction=position.clone().sub(target).normalize();assert(!world.ray(target,direction,position.distanceTo(target)-.02),'camera boom must have clear sight of the player');
});
test('player can traverse beneath a sidewalk shed with source buildings present',async()=>{
 const s=SCAFFOLDS.find(s=>s.name==='West 45th Street / sidewalk shed')||SCAFFOLDS[0],center=new Vector3(...s.center),along=new Vector3(...s.along),p=new Player(world);await world.stream(center);
 p.position.copy(center.clone().addScaledVector(along,-s.length/2-1).setZ(.17));
 for(let i=0;i<Math.ceil((s.length+2)/3.2/FIXED_STEP);i++)p.update(FIXED_STEP,new Set(['ArrowUp']),Math.atan2(along.x,along.y));
 assert(p.position.clone().sub(center).dot(along)>s.length/2,'roof and supports must leave the central passage open');assert(p.position.z<.3);
});
