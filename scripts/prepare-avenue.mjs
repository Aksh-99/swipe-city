import {readFile,writeFile} from 'node:fs/promises';
import {Vector3} from 'three';
import {CollisionWorld} from '../src/collision.js';

// OSM identifies 1472 Broadway on 4 Times Square. The historic NYC mesh,
// rather than the modern OSM outline, determines every architectural face.
globalThis.fetch=async u=>new Response(await readFile('public'+u));
const world=new CollisionWorld(JSON.parse(await readFile('public/data/nyc/manifest.json')).files);
const inside=new Vector3(-42,-230,2);await world.stream(inside);const planes=[];
for(let angle=140;angle<=290;angle+=.25){
 const d=new Vector3(Math.cos(angle*Math.PI/180),Math.sin(angle*Math.PI/180),0),hit=world.ray(inside,d,80,true);
 if(!hit)throw Error('Missing source retail corner');
 const n=hit.face.normal.clone().setZ(0).normalize();if(n.dot(d)<0)n.negate();
 if(planes.length&&n.dot(planes.at(-1).n)>.999999)continue;
 planes.push({n,p:hit.point.setZ(0)});
}
const joins=planes.slice(1).map((b,i)=>{
 const a=planes[i],det=a.n.x*b.n.y-a.n.y*b.n.x,da=a.n.dot(a.p),db=b.n.dot(b.p);
 if(Math.abs(det)<.001)throw Error('Degenerate facade join');
 return new Vector3((da*b.n.y-a.n.y*db)/det,(a.n.x*db-da*b.n.x)/det,0);
});
const along=n=>new Vector3(-n.y,n.x,0);
const points=[joins[0].clone().addScaledVector(along(planes[0].n),-31.2),...joins,joins.at(-1).clone().addScaledVector(along(planes.at(-1).n),16)];
let length=0,maxFitResidual=0;
const wrap=planes.map((p,i)=>{
 const a=points[i],b=points[i+1],distance=a.distanceTo(b),s0=length;length+=distance;
 for(const u of [.03,.25,.5,.75,.97])for(const z of [1,6,14,26.4,38.8]){
  const hit=world.ray(a.clone().lerp(b,u).addScaledVector(p.n,2).setZ(z),p.n.clone().negate(),3,true);
  if(!hit||Math.abs(hit.distance-2)>.055)throw Error(`Retail facade ${i} off source at ${u},${z}`);
  maxFitResidual=Math.max(maxFitResidual,Math.abs(hit.distance-2));
 }
 return {id:`avenue-${i}`,a:a.toArray(),b:b.toArray(),normal:p.n.toArray(),length:distance,s0,s1:length};
});
const f=wrap[12],normal=new Vector3(...f.normal),center=new Vector3(...f.a).lerp(new Vector3(...f.b),.5),position=center.clone().addScaledVector(normal,13).setZ(.17);
if(world.ray(position.clone().setZ(700),new Vector3(0,0,-1),701,true))throw Error('Avenue visit is inside a source building');
const data={id:'avenue',name:'Avenue fashion corner',address:'1472 Broadway · West 42nd Street',center:center.toArray(),normal:normal.toArray(),view:{position:position.toArray(),yaw:Math.atan2(-normal.x,-normal.y),pitch:-.20},wrap,length,height:38.8,maxFitResidual,screen:{from:24.2,to:24.2+108*.3048,bottom:13.6,top:13.6+42*.3048},broadwayScreen:{width:78*.3048,height:60*.3048},source:'docs/source-data/avenue-osm.json',description:'Fictional Avenue retail branding on the real H&M / 4 Times Square source building. Reference-guided facade, not a surveyed reconstruction.'};
await writeFile('public/data/avenue.json',JSON.stringify(data,null,2)+'\n');console.log({facets:wrap.length,length,maxFitResidual,view:data.view});
