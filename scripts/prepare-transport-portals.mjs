// Generate a small shared route manifest against the real playable colliders.
// Runtime clients still stream city tiles; this offline authoring pass loads
// the bounded district once to validate every doorway and separated exit.
import {readFile,writeFile} from 'node:fs/promises';
import {Vector3} from 'three';
import {CollisionWorld} from '../src/collision.js';
import {Player,FIXED_STEP} from '../src/player.js';
import {BUS_STOPS} from '../src/bus-config.js';
import {POLICE_VEHICLES} from '../src/police-vehicle-config.js';
import {makeStreetLayout} from '../src/street-layout.js';
import {createSidewalkGeometry,createSignalGeometry} from '../src/street-detail-geometry.js';
import {createCurbBollardGeometry} from '../src/curb-bollard-geometry.js';
import {nearTransportDoor} from '../src/transport-rules.js';
const json=async path=>JSON.parse(await readFile(path));
globalThis.fetch=async path=>new Response(await readFile('public'+path));
const world=new CollisionWorld((await json('public/data/nyc/manifest.json')).files);world.radius=850;await world.stream(new Vector3());
for(const id of ['plaza','streetscape','storefront','nypd-plaza','nasdaq','street-vendor','hard-rock-food','recruiting','lyric','bus','police-vehicle','port-authority','cinema','attractions','avenue','north42','south42-transit','five-times','east42','broadway-retail','district']){
 const module=await import(`../src/${id}-geometry.js`),create=Object.entries(module).find(([name])=>/^create.*Geometry$/.test(name))[1];world.addStatic(id,create().collision);
}
const layout=makeStreetLayout(await json('public/data/streets-osm.json')),poles=new Map((await json('public/data/street-details.json')).poles.map(p=>[p.id,p.position]));
layout.signals=layout.signals.filter(s=>poles.has(s.id));for(const s of layout.signals)s.position.fromArray(poles.get(s.id));
world.addStatic('sidewalks',createSidewalkGeometry(layout).collision);world.addStatic('signals',createSignalGeometry(layout).collision);world.addStatic('bollards',createCurbBollardGeometry(layout).collision);
function safe(point){
 const p=point.clone().setZ(.17),building=world.ray(p.clone().setZ(650),new Vector3(0,0,-1),650,true);
 if(building||!world.ready(p))return null;
 p.z=world.ground(p,.32);if(p.z>.40||p.z<-.01||world.resolve(p.clone()).distanceTo(p)>.025)return null;
 return p;
}
function doorway(vehicle,side,y,id){
 const normal=new Vector3(...vehicle.right).multiplyScalar(side),tangent=new Vector3(...vehicle.forward),surface=new Vector3(...vehicle.center).addScaledVector(normal,vehicle.width/2+.07).addScaledVector(tangent,y).setZ(0);
 const door={id,position:surface.toArray(),normal:normal.toArray(),tangent:tangent.toArray(),ground:0};
 // Check an actual controller can approach this physical door. Never weaken
 // the vehicle's collider to make a portal appear reachable.
 for(const offset of [0,.3,-.3,.5,-.5]){
  const approach=safe(surface.clone().addScaledVector(normal,1.25).addScaledVector(tangent,offset));if(!approach)continue;
  door.ground=approach.z;const player=new Player(world,{bounded:false});player.position.copy(approach);
  for(let i=0;i<40;i++)player.update(FIXED_STEP,new Set(['ArrowUp']),Math.atan2(-normal.x,-normal.y));
  if(nearTransportDoor(player.position.toArray(),door,{entering:true}))return {...door,approach:approach.toArray()};
 }
 return null;
}
function exits(door){
 const surface=new Vector3(...door.position),normal=new Vector3(...door.normal),tangent=new Vector3(...door.tangent),points=[];
 for(const out of [1.2,2.2,3.2])for(const along of [-.55,.55,-1.45,1.45,0]){
  const p=safe(surface.clone().addScaledVector(normal,out).addScaledVector(tangent,along));
  if(p&&points.every(q=>q.distanceTo(p)>.85)){points.push(p);if(points.length===4)return points.map(position=>({position:position.toArray(),heading:Math.atan2(normal.x,normal.y)}));}
 }
 throw new Error('No four safe transport exits for '+door.id);
}
const portals=[];
for(const [kind,vehicles]of [['bus',BUS_STOPS],['police',POLICE_VEHICLES]])for(const [index,vehicle]of vehicles.entries()){
 const number=index+1,id=`${kind}:${vehicle.id}`,doorY=kind==='bus'?vehicle.length/2-(vehicle.kind==='coach'?1.04:vehicle.kind==='tour'?1.08:1.13):vehicle.type==='van'?.65:.30;
 const sides=kind==='bus'?[1]:[vehicle.side===-1?1:-1,vehicle.side===-1?-1:1];
 const doors=sides.map(side=>doorway(vehicle,side,doorY,`${id}:${side===1?'right':'left'}`)).filter(Boolean);
 if(!doors.length)throw new Error('No accessible vehicle door for '+id);
 portals.push({id,kind,number,name:kind==='bus'?`Bus ${number}`:`NYPD vehicle ${number}`,location:kind==='bus'?vehicle.name:vehicle.road,doors,exits:exits(doors[0])});
}
for(const kind of ['bus','police']){const route=portals.filter(p=>p.kind===kind);route.forEach((p,i)=>p.nextId=route[(i+1)%route.length].id);}
await writeFile('public/data/transport-portals.json',JSON.stringify({version:1,notes:'Prototype portal routes using the existing parked vehicle placements. Not real transit routes.',portals},null,2)+'\n');
console.log(`Validated ${portals.length} vehicle portals, ${portals.reduce((n,p)=>n+p.doors.length,0)} doors and ${portals.length*4} separated exits.`);
