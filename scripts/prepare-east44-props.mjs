import {readFile,writeFile} from 'node:fs/promises';
import {Vector3} from 'three';
import {CollisionWorld} from '../src/collision.js';
import {makeStreetLayout,nearestSegment} from '../src/street-layout.js';
import {createSidewalkGeometry} from '../src/street-detail-geometry.js';
import {createDistrictGeometry} from '../src/district-geometry.js';
import {createPoliceVehicleGeometry} from '../src/police-vehicle-geometry.js';
import {createBusGeometry} from '../src/bus-geometry.js';
const json=async p=>JSON.parse(await readFile('public'+p));globalThis.fetch=async p=>new Response(await readFile('public'+p));
const world=new CollisionWorld((await json('/data/nyc/manifest.json')).files);world.radius=600;await world.stream(new Vector3(0,-100,0));
const layout=makeStreetLayout(await json('/data/streets-osm.json'));
for(const [id,g] of [['sidewalks',createSidewalkGeometry(layout)],['district',createDistrictGeometry(undefined,{streetProps:false})],['police',createPoliceVehicleGeometry()],['bus',createBusGeometry()]])world.addStatic(id,g.collision);
const trucks=[];
for(const [index,seed] of [[0,new Vector3(3,-99,0)],[1,new Vector3(145,-181,0)]]){
 const road=nearestSegment(seed,layout.roadPaths.filter(p=>p.tags.name==='West 44th Street')),f=road.direction.clone();if(f.x<0)f.negate();const r=new Vector3(f.y,-f.x,0);let selected;
 for(const shift of [0,4,-4,8,-8,12,-12,18,-18,24,-24]){if(selected)break;for(const offset of [3.6,-3.6,4.2,-4.2,2.9,-2.9,4.8,-4.8]){
  const c=road.point.clone().addScaledVector(f,shift).addScaledVector(r,offset);
  if((nearestSegment(c,layout.crossings)?.distance??99)<7)continue;
  let clear=true;
  for(let y=-3.25;y<=3.25;y+=.5)for(const x of [-1.15,0,1.15]){
   const p=c.clone().addScaledVector(f,y).addScaledVector(r,x);
   if(world.ray(p.clone().setZ(500),new Vector3(0,0,-1),499.7,true))clear=false;
   const curb=world.ray(p.clone().setZ(.30),new Vector3(0,0,-1),.29);if(curb&&curb.point.z>.045)clear=false;
   for(const z of [.06,1.0,2.2])if(world.resolve(p.clone().setZ(z)).sub(p.clone().setZ(z)).setZ(0).length()>.02)clear=false;
  }
  if(clear){selected={id:'east44-food-'+index,center:c.toArray(),forward:f.toArray(),right:r.toArray(),length:6.3,width:2.15,height:3.15,scheme:index?'citrus':'grill'};break;}
 }}
 if(!selected)throw Error('No clear road position '+index);trucks.push(selected);
}
await writeFile('public/data/east44-props.json',JSON.stringify({description:'Static scenic food trucks fitted to mapped W44 road parking edges, clear of source buildings, sidewalks, crossings and existing buses/police cars. Not transport portals.',trucks},null,2)+'\n');console.log(trucks);
