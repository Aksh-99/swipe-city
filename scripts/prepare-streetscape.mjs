import {readFile,writeFile} from 'node:fs/promises';
import {Vector3} from 'three';
import {CollisionWorld} from '../src/collision.js';
import {makeStreetLayout,localPoint,nearestSegment,insideSection} from '../src/street-layout.js';
const read=async p=>JSON.parse(await readFile(p));
const osm=await read('public/data/streets-osm.json'),mta=await read('public/data/subway-entrances-mta.json'),manifest=await read('public/data/nyc/manifest.json');
globalThis.fetch=async url=>new Response(await readFile('public'+url));
const city=new CollisionWorld(manifest.files);city.radius=900;await city.stream(new Vector3());
const layout=makeStreetLayout(osm),up=new Vector3(0,0,1);
const steps=osm.elements.filter(w=>w.tags?.highway==='steps'&&(!w.tags.level||w.tags.level.includes('0'))&&!w.tags.name&&w.geometry?.length>1).map(w=>({id:w.id,tags:w.tags,points:w.geometry.map(localPoint)}));
const entrances=[],scaffolds=[],lamps=[];
function open(p,margin=.2){
 const hit=city.ray(p.clone().setZ(800),new Vector3(0,0,-1),801);if(hit&&hit.point.z>.5)return false;
 for(const dir of [[1,0],[-1,0],[0,1],[0,-1]])if(city.ray(p.clone().setZ(1.5),new Vector3(...dir,0),margin))return false;
 return true;
}
for(let i=0;i<mta.entrances.length;i++){
 const entry=mta.entrances[i],origin=localPoint({lat:+entry.entrance_latitude,lon:+entry.entrance_longitude});
 if(entry.entrance_type!=='Stair'||entry.entry_allowed!=='YES'||!insideSection(origin)||!open(origin))continue;
 const mapped=nearestSegment(origin,steps),walk=nearestSegment(origin,layout.sidewalks);if(!walk)continue;
 const main=i===82,width=main?4.57:2.15,length=main?7.2:5.9,landing=1.3,depth=main?3.0:2.55;
 let direction=walk.direction.clone(),source='MTA entrance coordinate; sidewalk-aligned authored stair direction';
 if(mapped?.distance<12){
  const first=mapped.path.points[0],last=mapped.path.points.at(-1),nearestFirst=origin.distanceTo(first)<origin.distanceTo(last);
  direction=(nearestFirst?last.clone().sub(first):first.clone().sub(last)).normalize();source=`MTA entrance coordinate; OSM stair way ${mapped.path.id}`;
 }
 const options=[direction,direction.clone().negate()].map(d=>{
  const side=new Vector3(d.y,-d.x,0);let clear=0,roadDistance=0;
  for(const y of [1,length*.5,length+landing])for(const x of [-width/2,width/2]){const p=origin.clone().addScaledVector(d,y).addScaledVector(side,x);if(open(p,.12)&&insideSection(p))clear++;roadDistance+=nearestSegment(p,layout.roadPaths)?.distance??0;}
  return {d,clear,roadDistance};
 });
 options.sort((a,b)=>b.clear-a.clear||b.roadDistance-a.roadDistance);
 const best=options[0];if(best.clear<6)continue;
 // Keep separate nearby entrances from producing intersecting stairwells.
 const center=origin.clone().addScaledVector(best.d,(length+landing)/2);
 if(entrances.some(e=>new Vector3(...e.origin).addScaledVector(new Vector3(...e.direction),(e.length+e.landing)/2).distanceTo(center)<5))continue;
 entrances.push({id:`mta-${i}`,station:entry.constituent_station_name,complex:entry.stop_name,routes:entry.daytime_routes,latitude:+entry.entrance_latitude,longitude:+entry.entrance_longitude,origin:origin.toArray(),direction:best.d.toArray(),width,length,landing,depth,steps:main?18:16,covered:main,source});
}
function nearEntrance(p,r=7){return entrances.some(e=>{const start=new Vector3(...e.origin),end=start.clone().addScaledVector(new Vector3(...e.direction),e.length+e.landing);return nearestSegment(p,[{points:[start,end]}]).distance<r;});}
function scaffold(name,from,dir,length){
 const direction=new Vector3(...dir,0).normalize(),hit=city.ray(new Vector3(...from,2.3),direction,75);if(!hit||Math.abs(hit.face.normal.z)>.1)return;
 const normal=hit.face.normal.clone().setZ(0).normalize();if(normal.dot(direction)>0)normal.negate();
 const along=new Vector3().crossVectors(up,normal).normalize();
 for(const len of [length,length*.75]){
  const center=hit.point.clone().setZ(0).addScaledVector(normal,1.85);
  const supported=[-.5,0,.5].every(t=>{const at=center.clone().addScaledVector(along,len*t),h=city.ray(at.clone().setZ(2.3),normal.clone().negate(),4);return h&&Math.abs(h.face.normal.z)<.15&&h.distance>1.0&&!nearEntrance(at,6);});
  if(!supported||scaffolds.some(s=>new Vector3(...s.center).distanceTo(center)<len*.8))continue;
  const sidewalk=nearestSegment(center,layout.sidewalks);if(!sidewalk||sidewalk.distance>4.5)continue;
  scaffolds.push({name,center:center.toArray(),normal:normal.toArray(),along:along.toArray(),length:len,width:3.25,height:3.3,levels:name.includes('46th')?3:2});return;
 }
}
for(const s of [
 ['Broadway / east 44th–45th',[-8,-25],[.87,-.493],25],
 ['Broadway / west 45th',[2,17],[-.87,.493],22],
 ['Broadway / east 46th',[23,65],[.87,-.493],24],
 ['Broadway / west 48th',[62,195],[-.87,.493],25],
 ['West 45th Street theater frontage',[-89,45],[-.493,-.87],27],
 ['West 46th Street theater frontage',[-72,125],[-.493,-.87],24],
 ['West 47th Street frontage',[115,115],[.493,.87],20],
 ['West 42nd Street frontage',[-27,-265],[.493,.87],23],
 ['Eighth Avenue / 44th',[-279,22],[-.87,.493],24],
])scaffold(...s);
const shedCandidates=[];
for(const path of layout.sidewalks)for(let i=1;i<path.points.length;i++){
 const a=path.points[i-1],b=path.points[i],length=a.distanceTo(b);if(length<28)continue;
 for(const t of [.3,.65]){const p=a.clone().lerp(b,t),road=nearestSegment(p,layout.roadPaths);if(!road)continue;const away=p.clone().sub(road.point).setZ(0).normalize();shedCandidates.push({p,away,length:Math.min(19,length*.55),name:road.path.tags.name||'Times Square'});}
}
for(const c of shedCandidates.sort((a,b)=>a.p.length()-b.p.length())){
 if(scaffolds.length>=8)break;scaffold(c.name+' / sidewalk shed',[c.p.x,c.p.y],[c.away.x,c.away.y],c.length);
}
const poles=(await read('public/data/street-details.json')).poles.map(p=>new Vector3(...p.position));
for(const path of layout.sidewalks)for(let i=1;i<path.points.length;i++){
 const a=path.points[i-1],b=path.points[i],length=a.distanceTo(b);if(length<25)continue;
 const along=b.clone().sub(a).normalize(),count=Math.max(1,Math.round(length/43));
 for(let j=0;j<count;j++){
  const base=a.clone().lerp(b,(j+.5)/count),road=nearestSegment(base,layout.roadPaths);if(!road)continue;
  const curb=road.point.clone().sub(base).setZ(0).normalize(),at=base.clone().addScaledVector(curb,1.2);
  if(!insideSection(at)||!open(at,.45)||nearEntrance(at,5)||poles.some(p=>p.distanceTo(at)<5)||lamps.some(l=>new Vector3(...l.position).distanceTo(at)<25))continue;
  if(scaffolds.some(s=>{const delta=at.clone().sub(new Vector3(...s.center));return Math.abs(delta.dot(new Vector3(...s.along)))<s.length/2+2&&Math.abs(delta.dot(new Vector3(...s.normal)))<3;}))continue;
  lamps.push({position:at.toArray(),towardRoad:curb.toArray(),sidewalk:base.toArray()});
 }
}
await writeFile('public/data/streetscape.json',JSON.stringify({description:'MTA-coordinate subway entrances; modeled street stairs, facade-fitted temporary scaffolding and OSM-sidewalk street lamps. Underground landings are authored prototype spaces, not surveyed station interiors.',mtaSource:mta.dataset,entrances,scaffolds,lamps},null,2)+'\n');
console.log(JSON.stringify({entrances:entrances.map(e=>({id:e.id,station:e.station,covered:e.covered})),scaffolds:scaffolds.map(s=>s.name),lamps:lamps.length},null,2));
