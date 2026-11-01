import {readFile,writeFile} from 'node:fs/promises';
import {Vector3} from 'three';
import {CollisionWorld} from '../src/collision.js';
import {CINEMA_BLOCK as B} from '../src/cinema-config.js';
const origin=new Vector3(...B.origin),east=new Vector3(...B.east),north=new Vector3(...B.north);
globalThis.fetch=async u=>new Response(await readFile('public'+u));
const world=new CollisionWorld(JSON.parse(await readFile('public/data/nyc/manifest.json')).files);world.radius=300;await world.stream(origin);
const facades=[];
function fit(id,start,end,bottom,top,kind){
 const hit=world.ray(origin.clone().addScaledVector(east,(start+end)/2).setZ((bottom+top)/2),north.clone().negate(),60,true);
 if(!hit)throw new Error(id+' missing source wall');
 const n=hit.face.normal.clone().setZ(0).normalize();if(n.dot(north)<0)n.negate();
 const r=new Vector3(-n.y,n.x,0),width=(end-start)/Math.abs(r.dot(east)),center=hit.point.clone().setZ(0).addScaledVector(n,.16);let maxFitError=0;
 for(const x of [-.49,-.25,0,.25,.49])for(const z of [bottom+.1,bottom+(top-bottom)/2,top-.05]){
  const point=center.clone().addScaledVector(r,x*width).addScaledVector(n,2).setZ(z),h=world.ray(point,n.clone().negate(),3,true);
  if(!h||Math.abs(h.distance-2.16)>.065)throw new Error(`${id} off source at ${x},${z}: ${h?.distance}`);
  maxFitError=Math.max(maxFitError,Math.abs(h.distance-2.16));
 }
 facades.push({id,start,end,bottom,height:top-bottom,width,center:center.toArray(),normal:n.toArray(),kind,maxFitError});
}
fit('dave-applebees',101.4,130.3,.18,46.65,'dave');
fit('liberty-lower',130.8,137.2,.18,5.85,'liberty');
fit('liberty-upper',130.8,137.2,7.1,46.6,'liberty-upper');
fit('tussauds-west',138.0,147.35,.18,39.1,'tussauds');
fit('tussauds-tower',148.0,154.35,.18,49.1,'tussauds');
fit('tussauds-east',155.0,158.8,.18,38.8,'tussauds');
fit('tussauds-end',159.9,167.1,.18,22.5,'tussauds');
const places=[{id:'dave-busters',shortName:'Dave & Buster’s',name:'Dave & Buster’s',address:'234 West 42nd Street · Third floor',station:123.2,facade:'dave-applebees',viewStation:122.0,viewOffset:-6.2,pitch:-.13},{id:'madame-tussauds',shortName:'Madame Tussauds',name:'Madame Tussauds New York',address:'234 West 42nd Street',station:151.3,facade:'tussauds-tower',viewStation:146.0,viewOffset:-4.5,pitch:-.22}].map(p=>{
 const f=facades.find(f=>f.id===p.facade),center=new Vector3(...f.center),r=new Vector3(-f.normal[1],f.normal[0],0);center.addScaledVector(r,(p.station-center.clone().sub(origin).dot(east))/r.dot(east));
 const position=origin.clone().addScaledVector(east,p.viewStation).addScaledVector(north,p.viewOffset).setZ(.18),toward=center.clone().sub(position);
 return {...p,center:center.toArray(),normal:f.normal,view:{position:position.toArray(),yaw:Math.atan2(toward.x,toward.y),pitch:p.pitch}};
});
await writeFile('public/data/42nd-attractions.json',JSON.stringify({description:'Dave & Buster’s and Madame Tussauds reference-guided exterior layers, fitted to unchanged original NYC walls. Tenant order follows OSM footprints; detail dimensions interpret user photos.',facades,places,source:'docs/source-data/42nd-attractions-osm.json'},null,2)+'\n');
console.log(facades.map(f=>({id:f.id,width:+f.width.toFixed(2),top:f.bottom+f.height,residual:+f.maxFitError.toFixed(4)})));
