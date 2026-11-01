import {readFile,writeFile} from 'node:fs/promises';
import {Vector3} from 'three';
import {nasdaqPoint} from '../src/nasdaq-geometry.js';
import {NASDAQ} from '../src/nasdaq-config.js';
import {NYPD_PLAZA} from '../src/nypd-plaza-config.js';
import {makeStreetLayout,nearestSegment} from '../src/street-layout.js';
import {CollisionWorld} from '../src/collision.js';
import {createNasdaqGeometry} from '../src/nasdaq-geometry.js';
import {createNypdPlazaGeometry} from '../src/nypd-plaza-geometry.js';
import {createSidewalkGeometry} from '../src/street-detail-geometry.js';
import {createStreetscapeGeometry} from '../src/streetscape-geometry.js';
import {SUBWAY_ENTRANCES} from '../src/streetscape-config.js';
import {insideEntrance} from '../src/ground-cutouts.js';

globalThis.fetch=async u=>new Response(await readFile('public'+u));
const layout=makeStreetLayout(JSON.parse(await readFile('public/data/streets-osm.json')));
const world=new CollisionWorld(JSON.parse(await readFile('public/data/nyc/manifest.json')).files);
await world.stream(new Vector3(...NASDAQ.center));
for(const [id,g]of [['nasdaq',createNasdaqGeometry()],['nypd',createNypdPlazaGeometry()],['sidewalks',createSidewalkGeometry(layout)],['streetscape',createStreetscapeGeometry()]])world.addStatic(id,g.collision);
const unobstructed=p=>!world.ray(p.clone().setZ(700),new Vector3(0,0,-1),701,true);
const open=p=>unobstructed(p)&&world.resolve(p.clone()).sub(p).setZ(0).length()<.02;
const carts=[['hot-dog-blue',5.2,5.65,'hotdog','blue-yellow'],['roasted-nuts',7.45,6.25,'nuts','red-white'],['hot-dog-red',12.8,6,'hotdog','red-yellow']].map(([id,s,offset,kind,colors])=>{
 const {point,normal}=nasdaqPoint(s,offset,.17);
 if(!open(point)||(nearestSegment(point,layout.roadPaths)?.distance??0)<5.8)throw Error('Vendor location must be in clear pedestrian space');
 if(NYPD_PLAZA.tables.some(t=>point.distanceTo(new Vector3(...t.position))<3.9))throw Error('Umbrella would overlap existing cafe seating');
 return {id,kind,colors,position:point.toArray(),normal:normal.toArray(),width:1.76,depth:.88,canopyRadius:1.48};
});
// Fill only the open corner forecourt, following the NYC wall on the inside
// and clipping each radial edge behind the mapped W43 curb on the outside.
const paving=[];
for(let i=0;i<=44;i++){
 const s=i/44*NASDAQ.length;let lo=.42,hi=12;
 for(let j=0;j<20;j++){const mid=(lo+hi)/2,p=nasdaqPoint(s,mid,0).point;if((nearestSegment(p,layout.roadPaths)?.distance??0)>4.95)lo=mid;else hi=mid;}
 const a=nasdaqPoint(s,.42,.17).point,b=nasdaqPoint(s,lo,.17).point;
 if(!unobstructed(a)||!unobstructed(b))throw Error('Corner paving overlaps an original building');
 paving.push({a:a.toArray(),b:b.toArray()});
}
const posts=[];
for(const [id,start,end]of [[1117680735,66,83],[1117680759,0,28]]){
 const path=layout.sidewalks.find(p=>p.id===id);let covered=0;
 for(let i=1;i<path.points.length;i++){
  const a=path.points[i-1],b=path.points[i],length=a.distanceTo(b);
  for(let d=Math.ceil(Math.max(start,covered)/2.7)*2.7;d<Math.min(end,covered+length);d+=2.7){
   const q=a.clone().lerp(b,(d-covered)/length),road=nearestSegment(q,layout.roadPaths),n=road.point.clone().sub(q).normalize(),p=q.clone().addScaledVector(n,1.12).setZ(.17);
   if((nearestSegment(p,layout.crossings)?.distance??0)<2.65||carts.some(c=>p.distanceTo(new Vector3(...c.position))<2.05)||SUBWAY_ENTRANCES.some(e=>insideEntrance(e,p,2.1))||!open(p))continue;
   posts.push({position:p.toArray(),normal:n.toArray(),sidewalkId:id});
  }covered+=length;
 }
}
const f=NYPD_PLAZA.station.facades.find(f=>f.id==='east'),n=new Vector3(...f.normal),r=new Vector3(-n.y,n.x,0),center=new Vector3(...f.center).addScaledVector(n,3.1).addScaledVector(r,-2.0).setZ(.075);
const bins=['trash','bottles','paper'].map((kind,i)=>({kind,position:center.clone().addScaledVector(r,(i-1)*.81).toArray(),normal:n.toArray()}));
for(const b of bins)if(!open(new Vector3(...b.position)))throw Error('Waste bin conflicts with existing scene');
const poleId='corner-1117680764-1',pole=JSON.parse(await readFile('public/data/street-details.json')).poles.find(p=>p.id===poleId);
const heading=layout.signals.find(s=>s.id===poleId).pedestrians[0].normal;
const result={description:'Reference-inspired street vending and furniture at the Nasdaq corner. Buildings and curb geometry remain from NYC / OSM; cart positions and signage are authored, not a live vendor survey.',carts,posts,paving,bins,pole:{id:poleId,position:pole.position,normal:heading.toArray()}};
await writeFile('public/data/street-vendors.json',JSON.stringify(result,null,2)+'\n');
console.log({carts:carts.map(c=>({id:c.id,position:c.position})),bandedBollards:posts.length,bins:bins.length,pavingStrips:paving.length-1,pole:poleId});
