import {readFile,writeFile} from 'node:fs/promises';
import {Vector3} from 'three';
import {CollisionWorld} from '../src/collision.js';
import {Player,FIXED_STEP} from '../src/player.js';
import {makeStreetLayout,localPoint,nearestSegment,segmentProjection} from '../src/street-layout.js';
import {createSidewalkGeometry,createSignalGeometry} from '../src/street-detail-geometry.js';
import {createCurbBollardGeometry} from '../src/curb-bollard-geometry.js';
import {createStorefrontGeometry} from '../src/storefront-geometry.js';
import {createStreetscapeGeometry} from '../src/streetscape-geometry.js';
import {createNypdPlazaGeometry} from '../src/nypd-plaza-geometry.js';
import {createNasdaqGeometry} from '../src/nasdaq-geometry.js';
import {createStreetVendorGeometry} from '../src/street-vendor-geometry.js';
import {createHardRockFoodGeometry} from '../src/hard-rock-food-geometry.js';
import {createRecruitingGeometry} from '../src/recruiting-geometry.js';
import {createLyricGeometry} from '../src/lyric-geometry.js';
import {createPlazaGeometry} from '../src/plaza-geometry.js';
const json=async path=>JSON.parse(await readFile(path));
globalThis.fetch=async u=>new Response(await readFile('public'+u));
const layout=makeStreetLayout(await json('public/data/streets-osm.json')),gtfs=(await json('docs/source-data/times-square-bus-stops.json')).stops;
const poles=new Map((await json('public/data/street-details.json')).poles.map(p=>[p.id,p.position]));layout.signals=layout.signals.filter(s=>poles.has(s.id));for(const s of layout.signals)s.position.fromArray(poles.get(s.id));
const world=new CollisionWorld((await json('public/data/nyc/manifest.json')).files);world.radius=800;await world.stream(new Vector3());
for(const [id,g]of [['sidewalks',createSidewalkGeometry(layout)],['signals',createSignalGeometry(layout)],['posts',createCurbBollardGeometry(layout)],['stores',createStorefrontGeometry()],['streetscape',createStreetscapeGeometry()],['plaza',createPlazaGeometry()],['nypd',createNypdPlazaGeometry()],['nasdaq',createNasdaqGeometry()],['vendors',createStreetVendorGeometry()],['hard-rock-food',createHardRockFoodGeometry()],['recruiting',createRecruitingGeometry()],['lyric',createLyricGeometry()]])world.addStatic(id,g.collision);
const seeds=[
 {id:'new-victory',name:'OurBus / Urban Sherpa',address:'209 W 42nd Street · New Victory Theater',kind:'coach',routes:['OurBus','Urban Sherpa'],destination:'CATSKILLS ADVENTURE',seed:[-207.732,-163.239,0],road:'West 42nd Street',direction:'west',provenance:'Urban Sherpa official pickup address; authored curb fit. OurBus label retained from the requested scene list.'},
 {id:'big-bus',name:'Big Bus Tours',address:'7th Avenue / W 48th Street · 723 7th Ave area',kind:'tour',routes:['Big Bus'],destination:'DOWNTOWN LOOP',seed:[132,247,0],road:'7th Avenue',direction:'south',provenance:'Operator identifies Stop 1 outside M&M’s at 7th / W48; 723 7th Avenue is its listed business address.'},
 {id:'mta-44',name:'M7 / M20 · W 44th',address:'1501 Broadway area · 7th Avenue curb',kind:'city',routes:['M7','M20','M104'],destination:'M7  DOWNTOWN',route:'M7',gtfsId:'405297',road:'7th Avenue',direction:'south'},
 {id:'mta-42',name:'M7 / M20 · Times Square–42 St',address:'1471 Broadway area · 7th Avenue curb',kind:'city',routes:['M7','M20'],destination:'M20  SOUTH FERRY',route:'M20',seed:[-109.777,-172.125,0],road:'7th Avenue',direction:'south',provenance:'User-requested scenic stop area. Current GTFS places M7/M20 at 7 Av / W41 (450045), and M104 at 7 Av / W42 (404153). This scene pole is not a verified current stop.'},
 {id:'mta-47',name:'M20 / M104 · W 47th',address:'Duffy Square / 1585 Broadway area · 7th Avenue curb',kind:'city',routes:['M20','M104'],destination:'M104  41 STREET',route:'M104',seed:[63,112,0],road:'7th Avenue',direction:'south',provenance:'User-requested scenic stop near Duffy Square. No current W47 stop for these routes in the retrieved MTA GTFS. Placed on the 7th Avenue vehicle corridor, outside the Broadway pedestrian plaza.'},
 {id:'m42-seventh',name:'M42 · 7th Avenue',address:'201 W 42nd Street area · westbound curb',kind:'city',routes:['M42'],destination:'M42  WEST SIDE PIER',route:'M42',gtfsId:'405549',road:'West 42nd Street',direction:'west'},
 {id:'m42-broadway',name:'M42 · Broadway',address:'143 W 42nd Street area · Knickerbocker',kind:'city',routes:['M42'],destination:'M42  EAST SIDE U N',route:'M42',gtfsId:'403241',road:'West 42nd Street',direction:'east'},
];
const placed=[];
function clearCapsule(p){return world.resolve(p.clone()).sub(p).setZ(0).length()<.025;}
function clearWalkSegment(a,b){
 for(const reverse of [false,true]){const from=reverse?b:a,target=reverse?a:b,player=new Player(world,{bounded:false});player.position.copy(from);let steps=0;
  while(player.position.clone().sub(target).setZ(0).length()>.14&&steps++<450){const d=target.clone().sub(player.position);player.update(FIXED_STEP,new Set(['ArrowUp','ShiftLeft']),Math.atan2(d.x,d.y));}
  if(player.position.clone().sub(target).setZ(0).length()>.16)return false;
 }return true;
}
function clearVehicle(center,forward,right,length,width,height){
 const down=new Vector3(0,0,-1),corners=[];
 for(const x of [-width/2,width/2])for(const y of [-length/2,length/2])corners.push(center.clone().addScaledVector(right,x).addScaledVector(forward,y));
 for(let y=-length/2-.15;y<=length/2+.16;y+=.55)for(const x of [-width/2-.12,0,width/2+.12]){
  const p=center.clone().addScaledVector(right,x).addScaledVector(forward,y);
  if(world.ray(p.clone().setZ(600),down,600,true))return false;
  const curb=world.ray(p.clone().setZ(.3),down,.28);if(curb&&curb.point.z>.08)return false;
  for(const z of [.65,1.5,2.6,height-.05])if(!clearCapsule(p.clone().setZ(z)))return false;
  if(nearestSegment(p,layout.crossings)?.distance<2.8)return false;
 }
 for(const b of placed){const d=center.clone().sub(new Vector3(...b.center));if(Math.abs(d.dot(forward))<(length+b.length)/2+1.2&&Math.abs(d.dot(right))<(width+b.width)/2+.8)return false;}
 return true;
}
for(const spec of seeds){
 const raw=spec.gtfsId?gtfs.find(s=>s.stop_id===spec.gtfsId):null;
 const target=raw?localPoint({lat:+raw.stop_lat,lon:+raw.stop_lon}):new Vector3(...spec.seed),road=nearestSegment(target,layout.roadPaths.filter(p=>p.tags.name===spec.road));
 const forward=road.direction.clone();if((spec.direction==='east'&&forward.x<0)||(spec.direction==='west'&&forward.x>0)||(spec.direction==='south'&&forward.y>0))forward.negate();
 const right=new Vector3(forward.y,-forward.x,0),length=spec.kind==='coach'?13.7:spec.kind==='tour'?12.0:12.2,width=2.55,height=spec.kind==='coach'?3.72:spec.kind==='tour'?4.18:3.35;
 const candidatePaths=layout.sidewalks.filter(s=>s.points.some(p=>p.distanceTo(target)<65));let chosen=null;
 // Start at the requested anchor and try short moves along the same curb.
 // The model's front boarding door aligns with the stop pole, not its centre.
 for(const shift of [0,-4,4,-8,8,-12,12,-16,16,-20,20,-26,26]){
  if(chosen)break;const anchor=road.point.clone().addScaledVector(forward,shift);
  let sidewalk=null;
  for(const path of candidatePaths)for(let i=1;i<path.points.length;i++){
   const a=path.points[i-1],b=path.points[i],d=b.clone().sub(a).normalize();if(Math.abs(d.dot(forward))<.96)continue;
   const h=segmentProjection(anchor.clone().addScaledVector(right,10),a,b),v=h.point.clone().sub(anchor),lateral=v.dot(right),along=v.dot(forward);
   if(lateral<4.5||lateral>16||Math.abs(along)>2.0)continue;
   if(!sidewalk||h.distance<sidewalk.distance)sidewalk={...h,path,lateral};
  }
  if(!sidewalk)continue;const curb=sidewalk.lateral-sidewalk.path.width/2;
  for(const standOff of [.38,.65,.95,1.30]){
   for(const waitOffset of spec.id==='mta-47'?[0,2.2]:[0]){
   const center=anchor.clone().addScaledVector(right,curb-width/2-standOff).addScaledVector(forward,-length/2+1.40).setZ(.055);
   const pole=anchor.clone().addScaledVector(right,curb+.50).setZ(layout.sidewalkHeight(sidewalk.point));
   const walkway=sidewalk.point.clone().addScaledVector(right,waitOffset).setZ(.18),view=walkway.clone().addScaledVector(forward,2.8),boarding=pole.clone().addScaledVector(forward,1.05),testPoints=[walkway,view,...[-length-1,2.6].map(y=>walkway.clone().addScaledVector(forward,y))];
   if(!clearVehicle(center,forward,right,length,width,height)||!clearCapsule(pole)||testPoints.some(p=>!clearCapsule(p))||!clearWalkSegment(testPoints[2],testPoints[3])||!clearWalkSegment(view,testPoints[2])||!clearWalkSegment(view,boarding)||nearestSegment(pole,layout.crossings)?.distance<2.8)continue;
   chosen={...spec,gtfs:raw?{id:raw.stop_id,name:raw.stop_name,latitude:+raw.stop_lat,longitude:+raw.stop_lon,routes:raw.routes}:null,center:center.toArray(),forward:forward.toArray(),right:right.toArray(),normal:right.toArray(),length,width,height,pole:pole.toArray(),curb,standOff,roadId:road.path.id,sidewalkId:sidewalk.path.id,sourceAnchor:target.toArray(),placementShift:shift,view:{position:view.toArray(),yaw:Math.atan2(center.x-view.x,center.y-view.y),pitch:-.02},walkway:testPoints.slice(2).map(p=>p.toArray()),boardingApproach:boarding.toArray()};break;
   }if(chosen)break;
  }
 }
 if(!chosen)throw new Error(`No clear curb fit for ${spec.id}`);placed.push(chosen);console.log(spec.id,chosen.center.map(v=>+v.toFixed(2)),`shift ${chosen.placementShift} m, curb ${chosen.curb.toFixed(2)} m`);
}
await writeFile('public/data/bus-stops.json',JSON.stringify({description:'Seven requested scenic bus-stop areas; stationary authored vehicle exteriors. GTFS identifies verified stop references where available. Other requested route/address pairs are explicitly marked as scenic placements, not live transit guidance.',sources:['https://www.mta.info/developers','https://rrgtfsfeeds.s3.amazonaws.com/gtfs_m.zip','https://urbansherpatravel.com/trip-schedule/','https://www.bigbustours.com/en/new-york/routes'],stops:placed},null,2)+'\n');
