import {readFile,writeFile} from 'node:fs/promises';
import {Vector3} from 'three';
import {CollisionWorld} from '../src/collision.js';
import {localPoint} from '../src/street-layout.js';
globalThis.fetch=async u=>new Response(await readFile('public'+u));
const world=new CollisionWorld(JSON.parse(await readFile('public/data/nyc/manifest.json')).files);world.radius=300;
const origin=localPoint({lat:40.7572335,lon:-73.9897914}),north=new Vector3(.482,.876,0).normalize(),east=new Vector3(north.y,-north.x,0);
await world.stream(origin);
const facades=[];
function fit(id,start,end,direction,into,bottom,top,probeZ,kind){
 const h=world.ray(origin.clone().addScaledVector(direction,(start+end)/2).setZ(probeZ),into,65,true);if(!h)throw new Error(`${id} no source wall`);
 const n=h.face.normal.clone().setZ(0).normalize();if(n.dot(into)>0)n.negate();
 const r=new Vector3(-n.y,n.x,0),width=(end-start)/Math.abs(r.dot(direction)),center=h.point.clone().setZ(0).addScaledVector(n,.16);
 let maxFitError=0;
 for(const u of [-.49,-.25,0,.25,.49])for(const z of [bottom+.12,(bottom+top)/2,top-.05]){
  const p=center.clone().addScaledVector(r,u*width).addScaledVector(n,2).setZ(z),hit=world.ray(p,n.clone().negate(),3,true);
  if(!hit||Math.abs(hit.distance-2.16)>.06)throw new Error(`${id} off source at ${u},${z}: ${hit?.distance}`);
  maxFitError=Math.max(maxFitError,Math.abs(hit.distance-2.16));
 }
 const f={id,kind,start,end,center:center.toArray(),normal:n.toArray(),width,bottom,height:top-bottom,maxFitError};facades.push(f);return f;
}
const down=north.clone().negate();
fit('eleven-west-curve',23.0,30.2,down,east,.18,28.25,8,'eleven');
fit('eleven-west-upper',25.0,30.2,down,east,28.55,172.1,50,'eleven');
fit('eleven-west',32.0,53.5,down,east,.18,172.1,8,'eleven');
fit('eleven-north-podium',24.2,43.6,east,down,.18,28.25,8,'eleven');
fit('eleven-tower',22.3,43.8,east,down,28.55,172.1,50,'eleven');
fit('eleven-link',45.0,54.0,east,down,.18,172.1,8,'eleven');
// The source corner is a chamfer. Fit its real survey plane; trim gives it the
// ribboned appearance in the photo without replacing the source silhouette.
const ch=world.ray(new Vector3(-354.1,-105.0,8),new Vector3(0,-1,0),10,true),cn=ch.face.normal.clone().setZ(0).normalize();
const cc=ch.point.clone().setZ(0).addScaledVector(cn,.16);facades.push({id:'eleven-corner',kind:'eleven',center:cc.toArray(),normal:cn.toArray(),width:6.4,bottom:.18,height:28.07});
fit('amc-empire',57.9,79.9,east,down,.18,26.45,8,'empire');
fit('amc-glass',80.8,100.2,east,down,.18,37.5,8,'amc-glass');
fit('amc-roof-glass',74.2,79.8,east,down,26.8,50.6,38,'amc-glass');
fit('amc-upper-glass',81.0,100.0,east,down,38.0,50.6,45,'amc-glass');
fit('attractions',101.4,130.0,east,down,.18,46.65,8,'attractions');
fit('regal-west',19.1,54.3,east,north,.18,32.4,8,'shops');
fit('regal',54.5,106.7,east,north,.18,32.4,8,'regal');
fit('regal-east',107.0,134.0,east,north,.18,32.4,8,'regal-east');
const stationPoint=(s,y,z=.18)=>origin.clone().addScaledVector(east,s).addScaledVector(north,y).setZ(z);
const places=[
 {id:'amc',shortName:'AMC Empire',name:'AMC Empire 25',address:'234 West 42nd Street',station:67.6,facade:'amc-empire',view:stationPoint(67.6,-8.7),yaw:Math.atan2(-north.x,-north.y),pitch:-.12},
 {id:'regal',shortName:'Regal',name:'Regal Times Square',address:'247 West 42nd Street',station:73.2,facade:'regal',view:stationPoint(73.2,5.8),yaw:Math.atan2(north.x,north.y),pitch:-.22},
 {id:'eleven',shortName:'11 Times Square',name:'11 Times Square',address:'Eighth Avenue / West 42nd Street',station:21,facade:'eleven-corner',view:cc.clone().addScaledVector(cn,13.0).setZ(.17),yaw:Math.atan2(-cn.x,-cn.y),pitch:-.18}
].map(p=>{const {view,yaw,pitch,...rest}=p,f=facades.find(f=>f.id===p.facade);const center=new Vector3(...f.center);if(p.id!=='eleven'){const r=new Vector3(-f.normal[1],f.normal[0],0),delta=(p.station-center.clone().sub(origin).dot(east))/r.dot(east);center.addScaledVector(r,delta);}return {...rest,center:center.toArray(),normal:f.normal,view:{position:view.toArray(),yaw,pitch}};});
const data={description:'Reference-guided W42 exteriors on original NYC3D survey walls. No source building vertices are moved. The model preserves the historical chamfer at 11 Times Square; curved trims interpret the photograph. Advertising is fictional scenery, not current showtimes.',origin:origin.toArray(),east:east.toArray(),north:north.toArray(),facades,places,street:{start:20,end:134,curb:12.1},source:'docs/source-data/cinema-block-osm.json'};
await writeFile('public/data/cinema-block.json',JSON.stringify(data,null,2)+'\n');
console.log(facades.map(f=>({id:f.id,width:+f.width.toFixed(2),top:+(f.bottom+f.height).toFixed(2),error:f.maxFitError})));
