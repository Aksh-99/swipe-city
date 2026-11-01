import {readFile,writeFile} from 'node:fs/promises';
import {Vector3} from 'three';
import {CollisionWorld} from '../src/collision.js';
import {localPoint,makeStreetLayout,nearestSegment} from '../src/street-layout.js';

// The source mesh supplies all building mass. Fit thin architectural layers to
// its actual walls; never extrude a replacement terminal from a guessed box.
globalThis.fetch=async u=>new Response(await readFile('public'+u));
const world=new CollisionWorld(JSON.parse(await readFile('public/data/nyc/manifest.json')).files);
world.radius=330;
const intersection=localPoint({lat:40.7572335,lon:-73.9897914});
const avenue=new Vector3(.485751767508309,.8740968026268908,0),east=new Vector3(avenue.y,-avenue.x,0);
await world.stream(intersection);
function wall(at,normal){const h=world.ray(at.clone().setZ(8),normal.clone().negate(),25,true);if(!h)throw new Error('Terminal wall missing');const n=h.face.normal.clone().setZ(0).normalize();if(n.dot(normal)<0)n.negate();return {point:h.point,normal:n};}
const e=wall(intersection.clone().addScaledVector(avenue,-40),east),n=wall(intersection.clone().addScaledVector(east,-40),avenue);
const b=e.normal.dot(e.point),c=n.normal.dot(n.point),det=e.normal.x*n.normal.y-e.normal.y*n.normal.x;
const corner=new Vector3((b*n.normal.y-e.normal.y*c)/det,(e.normal.x*c-b*n.normal.x)/det,0);
const er=new Vector3(-e.normal.y,e.normal.x,0),nr=new Vector3(-n.normal.y,n.normal.x,0);
const facades=[];
function fit(id,start,length,normal,along,walkLength=length){
 const hit=wall(start.clone().addScaledVector(along,length/2).addScaledVector(normal,10),normal),nn=hit.normal,rr=new Vector3(-nn.y,nn.x,0);
 const center=hit.point.clone().setZ(0).addScaledVector(nn,.18);
 let maxError=0;
 for(const x of [-.485,-.25,0,.25,.485])for(const z of [1.5,8,19,26.0]){
  const h=world.ray(center.clone().addScaledVector(rr,x*length).addScaledVector(nn,2).setZ(z),nn.clone().negate(),3,true);
  if(!h||Math.abs(h.distance-2.18)>.07)throw new Error(`${id}: source-wall fit failed at ${x}, ${z}: ${h?.distance}`);
  maxError=Math.max(maxError,Math.abs(h.distance-2.18));
 }
 facades.push({id,center:center.toArray(),normal:nn.toArray(),width:length,height:26.15,walkLength,cornerEnd:along.dot(rr)>0?-1:1,maxFitError:maxError});
}
fit('eighth-north',corner,64,e.normal,er.clone().negate());
fit('forty-second',corner,112,n.normal,nr,70);
fit('eighth-south',corner.clone().addScaledVector(er,-78),57,e.normal,er.clone().negate());
const viewDirection=e.normal.clone().add(n.normal).normalize(),view=corner.clone().addScaledVector(viewDirection,13.5).setZ(.17);
const layout=makeStreetLayout(JSON.parse(await readFile('public/data/streets-osm.json')));
const poles=JSON.parse(await readFile('public/data/street-details.json')).poles;
const bollards=[];
for(const f of facades){const nn=new Vector3(...f.normal),rr=new Vector3(-nn.y,nn.x,0),cc=new Vector3(...f.center),sign=-f.cornerEnd;
 for(let station=4;station<f.walkLength-2;station+=2.25){
  const entry=f.id==='forty-second'?47:f.id==='eighth-north'?43:28;
  if(Math.abs(station-entry)<2.1)continue;
  const q=cc.clone().addScaledVector(rr,f.cornerEnd*f.width/2+sign*station).addScaledVector(nn,4.25).setZ(.18);
  if((nearestSegment(q.clone().setZ(0),layout.crossings)?.distance??99)<3.1)continue;
  if(poles.some(p=>new Vector3(...p.position).setZ(.18).distanceTo(q)<1.2))continue;
  if(world.ray(q.clone().setZ(200),new Vector3(0,0,-1),200,true))continue;
  bollards.push({position:q.toArray(),normal:f.normal,facade:f.id});
 }
}
const data={id:'port-authority',name:'Port Authority Bus Terminal',address:'625 Eighth Avenue · West 42nd Street',center:corner.toArray(),normal:viewDirection.toArray(),view:{position:view.toArray(),yaw:Math.atan2(-viewDirection.x,-viewDirection.y),pitch:-.10},facades,bollards,description:'Reference-guided exterior layers on unchanged NYC3D source walls. The screenshot guides the North Wing wrap, steel bracing, canopies and street furniture. Heights are constrained by the source roof; detail dimensions and south-wing finish are approximate. Interiors are not modeled.',sources:['https://www.panynj.gov/bus-terminals/en/index.html','https://github.com/JoeThunyathep/NYC3D_CesiumJS'],osmSidewalks:[1035187233,1035187237,1035187257]};
await writeFile('public/data/port-authority.json',JSON.stringify(data,null,2)+'\n');
console.log({corner:corner.toArray(),facades:facades.map(f=>({id:f.id,width:f.width,maxFitError:f.maxFitError})),bollards:bollards.length,view:data.view});
