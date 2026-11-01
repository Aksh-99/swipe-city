import {readFile,writeFile} from 'node:fs/promises';
import {Vector3} from 'three';
import {CollisionWorld} from '../src/collision.js';
globalThis.fetch=async u=>new Response(await readFile('public'+u));
const world=new CollisionWorld(JSON.parse(await readFile('public/data/nyc/manifest.json')).files);world.radius=240;await world.stream(new Vector3(-50,-65,0));
// Independently fitted planes on the two real buildings shown by the user.
// Centers contain a 0.16 m surface offset. The 1515 source podium steps back
// at 26.93 m; its advertising does not extend onto a fictional upper wall.
const facades=[
 {id:'restaurants',center:[-67.618385288,-87.900406233,0],normal:[.875265842,-.483642125,0],width:30,bottom:.18,top:38.0},
 {id:'1515-front',center:[-36.164934211,-31.626547217,0],normal:[.877222124,-.480084726,0],width:49.136707790,bottom:.18,top:26.75},
 {id:'1515-return',center:[-77.276241870,-44.157707854,0],normal:[-.480082428,-.877223382,0],width:43.591162145,bottom:.18,top:35.45},
 {id:'1515-chamfer',center:[-50.848070995,-50.874032372,0],normal:[-.703964981,-.710234683,0],width:6.250320589,bottom:.18,top:26.75},
 {id:'1515-entrance',center:[-55.460308742,-51.504666202,0],normal:[.807301934,-.590138617,0],width:6.945213789,bottom:.18,top:26.75},
 {id:'1515-setback',center:[-41.156641555,-29.035241872,0],normal:[.877221528,-.480085816,0],width:45.412876364,bottom:27.08,top:30.30},
];
for(const f of facades){const c=new Vector3(...f.center),n=new Vector3(...f.normal).normalize(),r=new Vector3(-n.y,n.x,0);f.normal=n.toArray();f.height=f.top-f.bottom;f.maxFitError=0;
 for(const x of [-.48,-.25,0,.25,.48])for(const z of [f.bottom+.04,(f.bottom+f.top)/2,f.top]){
  const h=world.ray(c.clone().addScaledVector(r,x*f.width).addScaledVector(n,2).setZ(z),n.clone().negate(),3,true);
  if(!h||Math.abs(h.distance-2.16)>.06)throw Error(`${f.id} off source at ${x},${z}`);
  f.maxFitError=Math.max(f.maxFitError,Math.abs(h.distance-2.16));
 }
}
const places=[{id:'1501-retail',name:'1501 Broadway stores',shortName:'1501 stores',address:'1501 Broadway · West 44th Street',facade:'restaurants',offset:0},{id:'1515-retail',name:'1515 Broadway stores',shortName:'1515 stores',address:'1515 Broadway · Across West 44th Street',facade:'1515-front',offset:-5}].map(p=>{
 const f=facades.find(f=>f.id===p.facade),n=new Vector3(...f.normal),r=new Vector3(-n.y,n.x,0),center=new Vector3(...f.center).addScaledVector(r,p.offset),position=center.clone().addScaledVector(n,10).setZ(.17);
 return {...p,center:center.toArray(),normal:n.toArray(),view:{position:position.toArray(),yaw:Math.atan2(-n.x,-n.y),pitch:-.18}};
});
await writeFile('public/data/broadway-retail.json',JSON.stringify({facades,places,description:'Fictional shop names and reference-guided design on the original 1501 and 1515 Broadway buildings; original NYC geometry and street gap retained.'},null,2)+'\n');console.log(facades.map(f=>({id:f.id,fitError:f.maxFitError,top:f.top})));
