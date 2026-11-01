import {readFile,writeFile} from 'node:fs/promises';
import {Vector3} from 'three';
import {CollisionWorld} from '../src/collision.js';
import {makeStreetLayout,localPoint,nearestSegment} from '../src/street-layout.js';
import {createSidewalkGeometry} from '../src/street-detail-geometry.js';
import {createStreetscapeGeometry} from '../src/streetscape-geometry.js';
import {STOREFRONTS} from '../src/storefront-config.js';
import {SUBWAY_ENTRANCES} from '../src/streetscape-config.js';
import {insideEntrance} from '../src/ground-cutouts.js';

globalThis.fetch=async u=>new Response(await readFile('public'+u));
const osm=JSON.parse(await readFile('docs/source-data/recruiting-osm.json'));
const way=osm.elements.find(e=>e.type==='way'&&e.id===258646144);
const nodes=new Map(osm.elements.filter(e=>e.type==='node').map(e=>[e.id,e]));
// Four actual mapped corners; the fifth node is the north entrance.
const footprint=way.nodes.slice(0,4).map(id=>localPoint(nodes.get(id)));
const center=footprint.reduce((c,p)=>c.add(p),new Vector3()).multiplyScalar(.25);
const world=new CollisionWorld(JSON.parse(await readFile('public/data/nyc/manifest.json')).files);
await world.stream(center);
const layout=makeStreetLayout(JSON.parse(await readFile('public/data/streets-osm.json')));
world.addStatic('sidewalks',createSidewalkGeometry(layout).collision);
world.addStatic('streetscape',createStreetscapeGeometry().collision);
const down=new Vector3(0,0,-1),open=p=>!world.ray(p.clone().setZ(700),down,701,true);
// This specific small pavilion is absent in this revision of NYC3D. Its
// source is explicitly OSM, not an invented box or a replacement city mesh.
for(const p of [...footprint,center])if(!open(p))throw Error('Mapped pavilion now overlaps source geometry; re-survey before authoring');
const facades=footprint.map((a,i)=>{
 const b=footprint[(i+1)%4],r=b.clone().sub(a).normalize(),n=new Vector3(r.y,-r.x,0),c=a.clone().lerp(b,.5);
 if(n.dot(c.clone().sub(center))<0)n.negate();
 const width=a.distanceTo(b),id=width>8?(n.x>0?'east':'west'):(n.y>0?'north':'south');
 return {id,center:c.toArray(),normal:n.toArray(),width};
});
const front=facades.find(f=>f.id==='south'),normal=new Vector3(...front.normal),right=new Vector3(-normal.y,normal.x,0);
const view=center.clone().addScaledVector(normal,14.4).addScaledVector(right,9).setZ(.17),look=center.clone().sub(view).normalize();
if(!open(view))throw Error('Recruiting visit view is inside a source building');
const posts=[];
for(const f of facades){
 const c=new Vector3(...f.center),n=new Vector3(...f.normal),r=new Vector3(-n.y,n.x,0);
 const xs=f.width>8?[-4.6,-1.55,1.55,4.6]:[-2.15,2.15];
 for(const x of xs){const p=c.clone().addScaledVector(r,x).addScaledVector(n,f.width>8?1.05:1.0);p.z=world.ground(p);
  if(nearestSegment(p.clone().setZ(0),layout.crossings).distance<2.5||SUBWAY_ENTRANCES.some(e=>insideEntrance(e,p,1.5))||posts.some(q=>p.distanceTo(new Vector3(...q.position))<1.1))continue;
  posts.push({position:p.toArray(),normal:n.toArray()});
 }
}
const station={id:'recruiting',name:'U.S. Air Force & Space Force Recruiting',address:'200 W 43rd St',center:center.toArray(),normal:normal.toArray(),footprint:footprint.map(p=>p.toArray()),height:Number(way.tags.height),grade:.075,facades,entrance:localPoint(nodes.get(10224024754)).toArray(),posts,view:{position:view.toArray(),yaw:Math.atan2(look.x,look.y),pitch:-.07},source:{type:'OpenStreetMap building footprint',way:way.id,url:'https://www.openstreetmap.org/way/258646144',heightTag:way.tags.height,reason:'Pavilion absent from the bundled older NYC3D mesh'},references:['https://www.aro.net/u-s-armed-forces-recruiting-station/','https://www.defense.gov/News/News-Stories/Article/Article/1369340/times-square-recruiting-station-reopens-after-renovation/']};
await writeFile('public/data/recruiting-station.json',JSON.stringify(station,null,2)+'\n');

const f=STOREFRONTS.find(s=>s.id==='hard-rock').facades.find(f=>f.kind==='43rd'),c=new Vector3(...f.center),n=new Vector3(...f.normal),r=new Vector3(-n.y,n.x,0);
const p=(x,out,z=.17)=>c.clone().addScaledVector(r,x).addScaledVector(n,out).setZ(z);
const carts=[[-11,'hotdog',1.76,.88],[-4.7,'grill',3.1,1.10],[1.6,'hotdog',1.76,.88],[8,'kiosk',2.05,1.10]].map(([x,kind,width,depth],i)=>({id:`hard-rock-cart-${i}`,kind,colors:'blue-yellow',position:p(x,2.7).toArray(),normal:n.toArray(),width,depth,canopyRadius:1.48}));
for(const item of carts)for(const x of [-item.width/2-.16,item.width/2+.16])for(const y of [-.82,.66]){
 const q=new Vector3(...item.position).addScaledVector(r,x).addScaledVector(n,y);if(!open(q))throw Error('Cart overlaps original Paramount footprint');
}
const curbPosts=[];
for(let x=-14.5;x<=14.5;x+=2.65){const q=p(x,3.88),near=nearestSegment(q.clone().setZ(0),layout.crossings);if(near.distance<2.65||carts.some(cart=>{const d=q.clone().sub(new Vector3(...cart.position));return Math.abs(d.dot(r))<cart.width/2+.35;}))continue;curbPosts.push({position:q.toArray(),normal:n.toArray()});}
const walkway=[];for(let x=-15;x<=15;x+=1)walkway.push(p(x,1.05).toArray());
// Keep the supplied open, stone-paved pavement. A short outer apron supports
// the curb posts, clipped well behind the mapped street's 4.95 m half width.
const paving=[];
for(let x=-15.8;x<=15.8+.01;x+=.79){const a=p(x,.43),b=p(x,4.02);if(nearestSegment(b.clone().setZ(0),layout.roadPaths).distance<4.95)throw Error('Vendor apron enters W43 traffic lanes');paving.push({a:a.toArray(),b:b.toArray()});}
const vendorView=p(14.4,2.3),target=p(1,2.7).sub(vendorView).normalize();
const foodRow={id:'hard-rock-food',name:'Hard Rock food carts',address:'West 43rd Street',center:c.toArray(),normal:n.toArray(),facade:f,carts,posts:curbPosts,paving,walkway,view:{position:vendorView.toArray(),yaw:Math.atan2(target.x,target.y),pitch:-.07},description:'Reference-inspired stationary carts and curb bollards on the mapped West 43rd Street side of the source-fitted Paramount / Hard Rock facade. Authored vendor arrangement, not a present-day vending survey.'};
await writeFile('public/data/hard-rock-food-row.json',JSON.stringify(foodRow,null,2)+'\n');
console.log({station:{center:station.center,height:station.height,facades:facades.map(f=>[f.id,f.width]),posts:posts.length},hardRock:{carts:carts.length,posts:curbPosts.length,walkwayMeters:30}});
