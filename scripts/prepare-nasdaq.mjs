import {readFile,writeFile} from 'node:fs/promises';
import {Vector3} from 'three';
import {CollisionWorld} from '../src/collision.js';

// Derive the MarketSite wrap from the original NYC mesh. This is a facade
// dressing pass, not a substitute cylinder or a new building footprint.
globalThis.fetch=async url=>new Response(await readFile('public'+url));
const city=new CollisionWorld(JSON.parse(await readFile('public/data/nyc/manifest.json')).files);
const inside=new Vector3(-34,-192,2);await city.stream(inside);
const planes=[];
for(let angle=70;angle<=175;angle+=.25){
 const d=new Vector3(Math.cos(angle*Math.PI/180),Math.sin(angle*Math.PI/180),0);
 const h=city.ray(inside,d,60,true);if(!h)throw Error('Missing original MarketSite podium');
 const n=h.face.normal.clone().setZ(0).normalize();if(n.dot(d)<0)n.negate();
 if(planes.length&&n.dot(planes.at(-1).n)>.999999)continue;
 planes.push({n,p:h.point.setZ(0)});
}
function intersection(a,b){
 const det=a.n.x*b.n.y-a.n.y*b.n.x,da=a.n.dot(a.p),db=b.n.dot(b.p);
 if(Math.abs(det)<.001)throw Error('Degenerate facade join');
 return new Vector3((da*b.n.y-a.n.y*db)/det,(a.n.x*db-da*b.n.x)/det,0);
}
const joints=planes.slice(1).map((p,i)=>intersection(planes[i],p));
const first=planes[0],last=planes.at(-1),northAlong=new Vector3(-first.n.y,first.n.x,0),westAlong=new Vector3(-last.n.y,last.n.x,0);
const start=joints[0].clone().addScaledVector(northAlong,-1.0),end=joints.at(-1).clone().addScaledVector(westAlong,1.0);
const points=[start,...joints,end];let distance=0;
const wrap=planes.map((p,i)=>{const a=points[i],b=points[i+1],length=a.distanceTo(b),s=distance;distance+=length;return {id:`curve-${i}`,a:a.toArray(),b:b.toArray(),normal:p.n.toArray(),length,s0:s,s1:distance};});
function facade(id,a,b,n,height){return {id,center:a.clone().lerp(b,.5).toArray(),normal:n.toArray(),a:a.toArray(),b:b.toArray(),width:a.distanceTo(b),height};}
// The south portion of this same wall belongs to the H&M reference frontage.
// Avenue now dresses it independently; retain the MarketSite corner return.
const northEnd=start.clone().addScaledVector(northAlong,-30.6),westEnd=end.clone().addScaledVector(westAlong,8.75);
const returns=[facade('west-43rd',northEnd,start,first.n,42.8),facade('broadway',end,westEnd,last.n,38.8)];
const surfaces=[...wrap.map(f=>({...f,width:f.length,height:46.8,center:new Vector3(...f.a).lerp(new Vector3(...f.b),.5).toArray()})),...returns];
if(process.argv.includes('--probe')){
 for(const f of surfaces){const c=new Vector3(...f.center),n=new Vector3(...f.normal),r=new Vector3(-n.y,n.x,0),heights=[];
  for(const x of [-.47,0,.47]){let top=0;for(let z=1;z<55;z+=.5){const h=city.ray(c.clone().addScaledVector(r,x*f.width).addScaledVector(n,2).setZ(z),n.clone().negate(),3,true);if(h&&Math.abs(h.distance-2)<.1)top=z;}heights.push(top);}
  console.log(f.id,heights,f.center);
 }process.exit(0);
}
for(const f of surfaces){
 const c=new Vector3(...f.center),n=new Vector3(...f.normal),r=new Vector3(-n.y,n.x,0);
 for(const x of [-.47,0,.47])for(const z of [1,10,20,33,f.height]){
  const hit=city.ray(c.clone().addScaledVector(r,x*f.width).addScaledVector(n,2).setZ(z),n.clone().negate(),3,true);
  if(!hit||Math.abs(hit.distance-2)>.095)throw Error(`${f.id}: detail extends beyond source at ${x},${z}, distance ${hit?.distance}`);
 }
}
const middle=wrap[Math.floor(wrap.length*.65)],normal=new Vector3(...middle.normal),center=new Vector3(...middle.a).lerp(new Vector3(...middle.b),.5);
const position=center.clone().addScaledVector(normal,17).setZ(.17);
if(city.ray(position.clone().setZ(700),new Vector3(0,0,-1),701,true))throw Error('Nasdaq view is inside a source building');
const config={
 id:'nasdaq',name:'Nasdaq MarketSite',address:'151 W 42nd Street · Broadway / W 43rd Street',
 description:'Reference-inspired Nasdaq exterior fitted to the original NYC 3D podium; not a current advertisement or construction survey.',
 sources:['https://www.nasdaq.com/contact-us','https://www.nasdaq.com/marketsite/welcome-to-times-square','https://www.nasdaq.com/marketsite/advertising'],
 center:center.toArray(),normal:normal.toArray(),view:{position:position.toArray(),yaw:Math.atan2(-normal.x,-normal.y),pitch:-.18},
 wrap,length:distance,returns,glassTop:11.4,fasciaBottom:11.5,fasciaTop:15.0,screenBottom:15.1,screenTop:46.8,
 scaffold:{width:3.5,inner:.30,height:3.35,grade:.075},
};
await writeFile('public/data/nasdaq.json',JSON.stringify(config,null,2)+'\n');
console.log({panels:wrap.length,wrapMeters:distance,returns:returns.map(f=>[f.id,f.width]),view:config.view});
