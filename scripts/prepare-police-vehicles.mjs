// Author and validate bounded scenic parking against the same NYC triangles,
// sidewalk/curb geometry and furniture used by the playable controller.
// This runs offline; the client imports the resulting small placement JSON.
import {readFile,writeFile} from 'node:fs/promises';
import {Vector3} from 'three';
import {CollisionWorld} from '../src/collision.js';
import {Player,FIXED_STEP} from '../src/player.js';
import {DetailMesh} from '../src/detail-mesh.js';
import {makeStreetLayout,nearestSegment,segmentProjection} from '../src/street-layout.js';
import {createSidewalkGeometry,createSignalGeometry} from '../src/street-detail-geometry.js';
import {createCurbBollardGeometry} from '../src/curb-bollard-geometry.js';
import {POLICE_VEHICLE_TYPES} from '../src/police-vehicle-types.js';
import {NYPD_STATION} from '../src/nypd-plaza-config.js';
import {STEPS_VIEW} from '../src/plaza-layout.js';
const json=async p=>JSON.parse(await readFile(p)),up=new Vector3(0,0,1),down=up.clone().negate();
globalThis.fetch=async p=>new Response(await readFile('public'+p));
const layout=makeStreetLayout(await json('public/data/streets-osm.json'));
const poles=new Map((await json('public/data/street-details.json')).poles.map(p=>[p.id,p.position]));
layout.signals=layout.signals.filter(s=>poles.has(s.id));for(const s of layout.signals)s.position.fromArray(poles.get(s.id));
const world=new CollisionWorld((await json('public/data/nyc/manifest.json')).files);world.radius=850;await world.stream(new Vector3());
const modules=['plaza','streetscape','storefront','nypd-plaza','nasdaq','street-vendor','hard-rock-food','recruiting','lyric','bus','port-authority','cinema','attractions','avenue','north42','south42-transit','five-times','east42','broadway-retail','district'];
for(const id of modules){const module=await import(`../src/${id}-geometry.js`),create=Object.entries(module).find(([name])=>/^create.*Geometry$/.test(name))[1];world.addStatic(id,create().collision);}
world.addStatic('sidewalks',createSidewalkGeometry(layout).collision);world.addStatic('signals',createSignalGeometry(layout).collision);world.addStatic('bollards',createCurbBollardGeometry(layout).collision);
const protectedPoints=[STEPS_VIEW,new Vector3(...NYPD_STATION.view.position),new Vector3(),...[-1.5,1.5].flatMap(x=>[-1.5,1.5].map(y=>new Vector3(x,y,.17)))];
for(const id of ['storefront','nypd-plaza','nasdaq','street-vendor','recruiting','lyric','bus','port-authority','cinema','attractions','avenue','north42','south42-transit','five-times','east42','broadway-retail','district']){
 const module=await import(`../src/${id}-config.js`);
 const scan=o=>{if(!o||typeof o!=='object')return;if(o.view?.position)protectedPoints.push(new Vector3(...o.view.position));if(o.walkway)for(const p of o.walkway)protectedPoints.push(new Vector3(...p));for(const [key,v]of Object.entries(o))if(!['view','walkway'].includes(key)&&v&&typeof v==='object')scan(v);};
 scan(module);
}
const parked=[];
const axes=(c,f)=>({r:new Vector3(f.y,-f.x,0),point:(x,y,z)=>c.clone().addScaledVector(new Vector3(f.y,-f.x,0),x).addScaledVector(f,y).setZ(z)});
function clear(c,f,type,{station=false}={}){
 const {r,point}=axes(c,f),w=type.width/2+.25,l=type.length/2+.30;
 // Separate cars, existing visit spawns and the four multiplayer spawns.
 if(protectedPoints.some(p=>{const d=p.clone().sub(c);return Math.abs(d.dot(r))<w+1.15&&Math.abs(d.dot(f))<l+1.15;}))return false;
 for(const car of parked){const d=c.clone().sub(new Vector3(...car.center));if(Math.abs(d.dot(f))<(type.length+car.length)/2+1.4&&Math.abs(d.dot(r))<(type.width+car.width)/2+1.3)return false;}
 for(let y=-l;y<=l+.001;y+=.35)for(const x of [-w,0,w]){
  const p=point(x,y,0);
  const across=p.x*.848-p.y*.53,along=p.x*.53+p.y*.848;
  if(Math.abs(across)>300||along < -520||along>555)return false;
  if(world.ray(p.clone().setZ(650),down,650,true))return false;
  if(nearestSegment(p,layout.crossings)?.distance<3.25)return false;
  const floor=world.ray(p.clone().setZ(.27),down,.27);if(floor?.point.z>(station?.19:.075))return false;
  for(const z of [.31,.85,1.4,type.height-.08]){
   const q=p.clone().setZ(z);if(world.resolve(q.clone(),.13,.40).distanceTo(q)>.005)return false;
  }
 }
 return true;
}
function walkingFits(c,f,type,paths,view){
 const {r}=axes(c,f),hull=new DetailMesh();hull.box(c.clone().setZ(type.height/2+.02),r,f,type.width,type.length,type.height,null,true);
 world.addStatic('candidate-car',new Float32Array(hull.collision));
 try{
  if(world.resolve(view.clone()).clone().sub(view).setZ(0).length()>.02)return false;
  for(const path of paths)for(const reverse of [false,true]){
   const points=reverse?[...path].reverse():path,player=new Player(world,{bounded:false});player.position.copy(points[0]);
   if(world.resolve(player.position.clone()).clone().sub(player.position).setZ(0).length()>.02)return false;
   for(const target of points.slice(1)){
    let ticks=0;while(player.position.clone().sub(target).setZ(0).length()>.14&&ticks++<450){const delta=target.clone().sub(player.position);player.update(FIXED_STEP,new Set(reverse?['ArrowUp','ShiftLeft']:['ArrowUp']),Math.atan2(delta.x,delta.y));}
    if(player.position.clone().sub(target).setZ(0).length()>.16||player.position.z>.40)return false;
   }
  }
  return true;
 }finally{world.loaded.get('candidate-car').geometry.dispose();world.loaded.delete('candidate-car');}
}
function entry(spec,c,f,type,extra={}){
 const {r}=axes(c,f),view=c.clone().addScaledVector(r,-(type.width/2+2.7)).addScaledVector(f,1.2).setZ(.17);
 return {...spec,...type,center:c.toArray(),forward:f.toArray(),right:r.toArray(),fleet:String(4100+parked.length*37),view:{position:view.toArray(),yaw:Math.atan2(c.x-view.x,c.y-view.y),pitch:.03},...extra};
}
const suffix=n=>n===41?'st':n===42?'nd':n===43?'rd':'th';
const specs=Array.from({length:11},(_,i)=>({id:`w${40+i}`,road:`West ${40+i}${suffix(40+i)} Street`,type:['sedan','suv','sedan','van','suv'][i%5]}));
specs.push(...['6th Avenue','7th Avenue','8th Avenue','Broadway'].map((road,i)=>({id:road.toLowerCase().replace(/\W+/g,'-'),road,type:i%2?'sedan':'suv'})));
for(const spec of specs){
 const roads=layout.roadPaths.filter(p=>p.tags.name===spec.road),type=POLICE_VEHICLE_TYPES[spec.type];
 if(!roads.length)throw new Error('Missing mapped road: '+spec.road);
 const seed=nearestSegment(new Vector3(),roads);let chosen=null;
 // Search both curbs on this same mapped street. Keep clear of the junction
 // rather than placing at the nearest centreline intersection itself.
 for(const shift of [22,-22,35,-35,50,-50,65,-65,85,-85,105,-105,130,-130,155,-155]){
  if(chosen)break;
  const road=nearestSegment(seed.point.clone().addScaledVector(seed.direction,shift),roads),f=road.direction.clone();if(road.path.tags.oneway==='-1')f.negate();
  const r=new Vector3(f.y,-f.x,0),anchor=road.point;
  for(const side of [1,-1]){
   if(chosen)break;let walk=null;
   for(const path of layout.sidewalks)for(let j=1;j<path.points.length;j++){
    const a=path.points[j-1],b=path.points[j],d=b.clone().sub(a).normalize();if(Math.abs(d.dot(f))<.96)continue;
    const hit=segmentProjection(anchor.clone().addScaledVector(r,side*9),a,b),v=hit.point.clone().sub(anchor),lateral=v.dot(r)*side;
    if(lateral<3.4||lateral>18||Math.abs(v.dot(f))>1.2)continue;
    if(!walk||hit.distance<walk.distance)walk={...hit,path,d,lateral};
   }
   if(!walk)continue;
   const sideN=new Vector3(-walk.d.y,walk.d.x,0),edges=layout.sidewalkEdges(walk.point,walk.d,walk.path.width),toward=anchor.clone().sub(walk.point).dot(sideN),inner=edges[toward>0?0:1],curb=walk.lateral-inner;
   for(const gap of [.55,.85,1.15,1.45]){
    const c=anchor.clone().addScaledVector(r,side*(curb-type.width/2-gap)).setZ(.025);
    if(!clear(c,f,type))continue;
    const walkway=[-type.length/2-1.9,type.length/2+1.9].map(y=>walk.point.clone().addScaledVector(f,y).setZ(.17).toArray());
    const candidate=entry(spec,c,f,type,{roadId:road.path.id,sidewalkId:walk.path.id,curbGap:gap,side,walkway}),{point}=axes(c,f);
    const roadPath=[point(-side*(type.width/2+1.05),-type.length/2-1.1,.17),point(-side*(type.width/2+1.05),type.length/2+1.1,.17)];
    if(!walkingFits(c,f,type,[walkway.map(p=>new Vector3(...p)),roadPath],new Vector3(...candidate.view.position)))continue;
    chosen=candidate;break;
   }
  }
 }
 if(!chosen)throw new Error('No clear curb for '+spec.road);
 parked.push(chosen);console.log(spec.road,spec.type,chosen.center.map(v=>+v.toFixed(2)).join(', '));
}
const stationFront=NYPD_STATION.facades.find(f=>f.id==='front'),front=new Vector3(...stationFront.center),normal=new Vector3(...stationFront.normal),along=new Vector3(normal.y,-normal.x,0);
for(const [i,typeId]of ['suv','van'].entries()){
 const type=POLICE_VEHICLE_TYPES[typeId];let chosen=null;
 for(const distance of [7,9,11,13,15])for(const lateral of [6,8,10,12,-6,-8,-10,-12]){
  if(chosen)break;const c=front.clone().addScaledVector(normal,distance).addScaledVector(along,lateral*(i? -1:1)).setZ(.025);
  if(clear(c,along,type,{station:true}))chosen=entry({id:`station-${i+1}`,road:'NYPD Times Square station',type:typeId,station:true},c,along,type,{frontDistance:distance});
 }
 if(!chosen)throw new Error('No clear parking position in front of the station');
 parked.push(chosen);console.log(chosen.id,typeId,chosen.center.map(v=>+v.toFixed(2)).join(', '));
}
await writeFile('public/data/police-vehicles.json',JSON.stringify({description:'Authored stationary NYPD patrol exteriors. Parking is fitted to bundled OSM streets and original NYC model/furniture collisions; it does not represent actual current police deployment.',sources:['https://www.nyc.gov/site/nypd/about/about-nypd/equipment-tech/police-vehicles.page','https://www.nyc.gov/assets/dcas/downloads/pdf/fleet/NYC-Fleet-Newsletter-312-July-15-2020-Every-New-NYPD-Police-Car-Is-an-Electric-Hybrid-in-FY20.pdf'],vehicles:parked},null,2)+'\n');
