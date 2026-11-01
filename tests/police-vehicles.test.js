import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Vector3} from 'three';
import {CollisionWorld} from '../src/collision.js';
import {Player,FIXED_STEP} from '../src/player.js';
import {createPoliceVehicleGeometry,policeVehicleAxes} from '../src/police-vehicle-geometry.js';
import {POLICE_VEHICLES} from '../src/police-vehicle-config.js';
import {NYPD_STATION} from '../src/nypd-plaza-config.js';
import {makeStreetLayout,nearestSegment} from '../src/street-layout.js';
import {createSidewalkGeometry,createSignalGeometry} from '../src/street-detail-geometry.js';
import {createCurbBollardGeometry} from '../src/curb-bollard-geometry.js';
import {TRANSPORT_PORTALS} from '../src/transport-config.js';
import {nearTransportDoor} from '../src/transport-rules.js';
import {PLAY_AREA,containsPlayArea} from '../src/play-area.js';
const json=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url)));
globalThis.fetch=async p=>new Response(await readFile(new URL('../public'+p,import.meta.url)));
const g=createPoliceVehicleGeometry(),world=new CollisionWorld((await json('public/data/nyc/manifest.json')).files),layout=makeStreetLayout(await json('public/data/streets-osm.json'));
const poles=new Map((await json('public/data/street-details.json')).poles.map(p=>[p.id,p.position]));layout.signals=layout.signals.filter(s=>poles.has(s.id));for(const s of layout.signals)s.position.fromArray(poles.get(s.id));
for(const id of ['plaza','streetscape','storefront','nypd-plaza','nasdaq','street-vendor','hard-rock-food','recruiting','lyric','bus','port-authority','cinema','attractions','avenue','north42','south42-transit','five-times','east42','broadway-retail','district']){const module=await import(`../src/${id}-geometry.js`),create=Object.entries(module).find(([name])=>/^create.*Geometry$/.test(name))[1];world.addStatic(id,create().collision);}
world.addStatic('sidewalks',createSidewalkGeometry(layout).collision);world.addStatic('signals',createSignalGeometry(layout).collision);world.addStatic('bollards',createCurbBollardGeometry(layout).collision);world.addStatic('police-cars',g.collision);world.radius=850;await world.stream(new Vector3());
const horizontal=(a,b)=>a.clone().sub(b).setZ(0).length();
test('the three open mapped boundary streets remain runnable with real buildings and street furniture loaded',()=>{
 for(const edge of[0,1,3]){
  const a=new Vector3(...PLAY_AREA.intersections[edge].position,0),b=new Vector3(...PLAY_AREA.intersections[(edge+1)%4].position,0),direction=b.clone().sub(a).normalize(),start=a.clone().lerp(b,.5).setZ(.17);
  for(const sign of [-1,1]){
   const p=new Player(world);p.position.copy(start);
   for(let tick=0;tick<150;tick++){p.update(FIXED_STEP,new Set(['ArrowUp','ShiftLeft']),Math.atan2(direction.x*sign,direction.y*sign));assert(containsPlayArea(p.position,.32));assert(p.position.z<.4);}
   assert(horizontal(p.position,start)>15,PLAY_AREA.planes[edge].name+' stays open within the playable boundary');
  }
 }
});
function walk(points,run){
 const player=new Player(world,{bounded:false});player.position.copy(points[0]);
 for(const target of points.slice(1)){let steps=0;while(horizontal(player.position,target)>.14&&steps++<900){const d=target.clone().sub(player.position);player.update(FIXED_STEP,new Set(run?['ArrowUp','ShiftLeft']:['ArrowUp']),Math.atan2(d.x,d.y));}
  assert(horizontal(player.position,target)<.16,`walking route blocked at ${player.position.toArray()}, target ${target.toArray()}, sprint=${run}`);
  assert(player.position.z<.40,'stay on the road/sidewalk');
 }
}
test('17 varied NYPD vehicles cover the bounded streets and station without entering real buildings or crossings',()=>{
 assert.equal(POLICE_VEHICLES.length,17);assert.deepEqual(new Set(POLICE_VEHICLES.map(c=>c.type)),new Set(['sedan','suv','van']));
 const roads=new Set(POLICE_VEHICLES.filter(c=>!c.station).map(c=>c.road));for(let n=40;n<=50;n++)assert(roads.has(`West ${n}${n===41?'st':n===42?'nd':n===43?'rd':'th'} Street`));for(const name of ['6th Avenue','7th Avenue','8th Avenue','Broadway'])assert(roads.has(name));
 for(const car of POLICE_VEHICLES){const {p,f,r}=policeVehicleAxes(car);assert(Math.abs(f.length()-1)<1e-9);assert(Math.abs(r.dot(f))<1e-9);
  if(!car.station){const source=layout.roadPaths.find(path=>path.id===car.roadId);assert.equal(source.tags.name,car.road);assert(car.curbGap>=.55);}
  for(let y=-car.length/2-.15;y<=car.length/2+.15;y+=.35)for(const x of [-car.width/2-.22,0,car.width/2+.22]){
   const q=p(x,y,0);assert(!world.ray(q.clone().setZ(650),new Vector3(0,0,-1),650,true),car.id+' stays outside original buildings');assert(nearestSegment(q.clone().setZ(0),layout.crossings).distance>3.0,car.id+' leaves the crosswalk clear');
  }
 }
 const front=NYPD_STATION.facades.find(f=>f.id==='front');for(const car of POLICE_VEHICLES.filter(c=>c.station)){const d=new Vector3(...car.center).sub(new Vector3(...front.center));assert(d.dot(new Vector3(...front.normal))>5);assert(d.length()<18);}
});
test('roads and sidewalks beside every parked vehicle remain walkable and runnable; station entrance stays open',()=>{
 for(const car of POLICE_VEHICLES){
  const view=new Vector3(...car.view.position);assert(horizontal(view,world.resolve(view.clone()))<.02,car.id+' safe visit');
  if(car.walkway){const path=car.walkway.map(p=>new Vector3(...p));walk(path,false);walk([...path].reverse(),true);}
  const {p}=policeVehicleAxes(car),side=car.side===-1?1:-1,roadPath=[p(side*(car.width/2+1.05),-car.length/2-1.1,.17),p(side*(car.width/2+1.05),car.length/2+1.1,.17)];
  walk(roadPath,false);walk([...roadPath].reverse(),true);
 }
 const front=NYPD_STATION.facades.find(f=>f.id==='front'),p=new Vector3(...front.center),n=new Vector3(...front.normal);walk([p.clone().addScaledVector(n,2.0).setZ(.17),p.clone().addScaledVector(n,15).setZ(.17)],false);walk([p.clone().addScaledVector(n,15).setZ(.17),p.clone().addScaledVector(n,2.0).setZ(.17)],true);
});
test('sedan, SUV and van sides and front/rear bodies stop a sprinting player; camera sees each vehicle',()=>{
 const props=new CollisionWorld([]);props.addStatic('cars',g.collision);
 for(const car of POLICE_VEHICLES){const {p,f,r,c}=policeVehicleAxes(car);
  for(const side of [-1,1]){
   const player=new Player(props,{bounded:false});player.position.copy(p(side*(car.width/2+1.1),0,0));
   for(let tick=0;tick<75;tick++)player.update(FIXED_STEP,new Set(['ArrowUp','ShiftLeft']),Math.atan2(-side*r.x,-side*r.y));
   assert(player.position.clone().sub(c).dot(r)*side>car.width/2+.18,car.id+' blocks its doors');
  }
  for(const end of [-1,1]){
   const player=new Player(props,{bounded:false});player.position.copy(p(0,end*(car.length/2+1.2),0));
   for(let tick=0;tick<75;tick++)player.update(FIXED_STEP,new Set(['ArrowUp','ShiftLeft']),Math.atan2(-end*f.x,-end*f.y));
   assert(player.position.clone().sub(c).dot(f)*end>car.length/2+.18,car.id+' blocks its bumper');
  }
  assert(props.cameraCast(p(car.width/2+2,0,1.0),r.clone().negate(),3,.16),car.id+' camera collision');
 }
});
test('fleet geometry and decal faces stay finite, night shaded and within a bounded rendering budget',()=>{
 const triangles=[...g.batches.values()].reduce((n,v)=>n+v.length/9,0);assert(triangles<190000);assert(g.collision.length/9<4000);assert(g.glass.length>120);assert(g.labels.filter(f=>f.kind==='door').length===34);assert(g.night.lights.length===17);
 for(const [,values]of g.batches)assert(values.every(Number.isFinite));assert([...g.collision].every(Number.isFinite));
 for(const label of g.labels){assert(label.width>0&&label.height>0);assert([...label.normal.toArray(),...label.right.toArray()].every(Number.isFinite));if(label.kind!=='hood')assert(new Vector3().crossVectors(label.right,new Vector3(0,0,1)).dot(label.normal)>.999,'readable outward-facing text');}
});
test('all playable bus/car doors are walkable and runnable; their arrival slots are grounded, outside structures and allow walking away',()=>{
 for(const portal of TRANSPORT_PORTALS){
  for(const door of portal.doors)for(const running of [false,true]){
   const player=new Player(world);player.position.fromArray(door.approach);let reached=false;
   for(let tick=0;tick<45;tick++){
    player.update(FIXED_STEP,new Set(running?['ArrowUp','ShiftLeft']:['ArrowUp']),Math.atan2(-door.normal[0],-door.normal[1]));
    if(nearTransportDoor(player.position.toArray(),door,{entering:true})){reached=true;break;}
   }
   assert(reached,`${door.id} can be entered ${running?'running':'walking'}`);
  }
  for(const exit of portal.exits){
   const p=new Vector3(...exit.position);assert(world.resolve(p.clone()).distanceTo(p)<.025,portal.id+' unobstructed exit');assert(Math.abs(world.ground(p,.32)-p.z)<.025,portal.id+' grounded exit');assert(!world.ray(p.clone().setZ(650),new Vector3(0,0,-1),650,true),portal.id+' outside source building');
   let canLeave=false;
   for(let direction=0;direction<8&&!canLeave;direction++){
    const player=new Player(world);player.position.copy(p);
    for(let tick=0;tick<24;tick++)player.update(FIXED_STEP,new Set(['ArrowUp']),direction*Math.PI/4);
    canLeave=horizontal(player.position,p)>.65;
   }
   assert(canLeave,portal.id+' arrival can walk away');
  }
 }
});
