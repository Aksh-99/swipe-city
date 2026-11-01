import {readFile,writeFile} from 'node:fs/promises';
import {Vector3} from 'three';
import {CollisionWorld} from '../src/collision.js';

// W43 stationing starts at the OSM Broadway intersection, increasing west.
// Every decorative frontage is independently checked against original NYC3D
// triangles. OSM way 266034050 identifies the theatre; it is not extruded.
globalThis.fetch=async u=>new Response(await readFile('public'+u));
const world=new CollisionWorld(JSON.parse(await readFile('public/data/nyc/manifest.json')).files);
await world.stream(new Vector3(-172,-100,0));
const origin=new Vector3(-80.89715,-143.25305,0),west=new Vector3(-.8735,.4868,0).normalize(),north=new Vector3(.4868,.8735,0).normalize();
function fit(id,start,end,height,side=1){
 const mid=(start+end)/2,guess=north.clone().multiplyScalar(side);
 const hit=world.ray(origin.clone().addScaledVector(west,mid).setZ(7),guess.clone().negate(),25,true);
 if(!hit)throw new Error(`${id}: original wall missing`);
 const n=hit.face.normal.clone().setZ(0).normalize();if(n.dot(guess)<0)n.negate();
 const right=new Vector3(-n.y,n.x,0),center=hit.point.clone().setZ(0).addScaledVector(n,.12),width=end-start;
 for(const x of [-.48,-.25,0,.25,.48])for(const z of [1,5,12,height]){
  const h=world.ray(center.clone().addScaledVector(right,x*width).addScaledVector(n,2).setZ(z),n.clone().negate(),3,true);
  if(!h||Math.abs(h.distance-2.12)>.06)throw new Error(`${id}: skin off source wall (${x},${z}) ${h?.distance}`);
 }
 return {id,center:center.toArray(),normal:n.toArray(),width,height,start,end};
}
const facades=[fit('historic',67.6,98.5,23.5),fit('service',98.6,131.0,21.8),fit('east-neighbor',20,59,23.0),fit('deli',51.8,79.8,18.0,-1),fit('north-construction',83,163,25.8,-1)];
const front=facades[0],center=new Vector3(...front.center),normal=new Vector3(...front.normal),right=new Vector3(-normal.y,normal.x,0);
const entrance=center.clone().addScaledVector(right,-3.0);
const view=entrance.clone().addScaledVector(normal,7.4).setZ(.17);
const data={id:'lyric',name:'Lyric Theatre',address:'214 West 43rd Street',description:'Architectural detail fitted to the real NYC3D theatre and adjoining W43 walls. Temporary construction placement is interpreted from the user’s October 3, 2026 reference screenshots, not a live street works survey.',center:entrance.toArray(),normal:normal.toArray(),view:{position:view.toArray(),yaw:Math.atan2(-normal.x,-normal.y),pitch:-.16},facades,street:{origin:origin.toArray(),west:west.toArray(),north:north.toArray()},sources:['https://us.atgtickets.com/venues/lyric-broadway/venue-info/','https://www.openstreetmap.org/way/266034050','https://github.com/JoeThunyathep/NYC3D_CesiumJS'],wingLength:45.72};
await writeFile('public/data/lyric-theatre.json',JSON.stringify(data,null,2)+'\n');
console.log(facades.map(f=>({id:f.id,width:f.width,height:f.height,center:f.center})));console.log({view:data.view});
