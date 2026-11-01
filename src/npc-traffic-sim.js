import {CITY_TRAFFIC_COUNT} from './traffic-config.js';
import {vehicleContact} from './vehicle-collision.js';
import {Vector3} from 'three';
import {makeStreetLayout} from './street-layout.js';
import {containsPlayArea} from './play-area.js';
const validRoad=name=>/^(6th|7th|8th) Avenue$/.test(name)||name==='Broadway'||/^West (42|43|44|45|46|47|48)th Street$/.test(name)||name==='West 42nd Street'||name==='West 43rd Street';
const key=p=>`${Math.round(p.x)},${Math.round(p.y)}`;
export function buildTrafficNetwork(streets,layout=makeStreetLayout(streets)){
 const nodes=new Map(),edges=[];
 const node=p=>{const k=key(p);if(!nodes.has(k))nodes.set(k,{id:k,position:p.clone(),out:[],incoming:[]});return nodes.get(k);};
 for(const road of layout.roadPaths){if(!validRoad(road.tags.name))continue;let points=road.tags.oneway==='-1'?[...road.points].reverse():road.points;
  for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i];if(a.distanceTo(b)<3||!containsPlayArea(a.clone().lerp(b,.5),-8))continue;
   const add=(a,b,offset)=>{const from=node(a),to=node(b),dir=b.clone().sub(a).normalize(),side=new Vector3(dir.y,-dir.x,0),start=a.clone().addScaledVector(side,offset),end=b.clone().addScaledVector(side,offset),length=start.distanceTo(end);edges.push({id:edges.length,from,to,start,end,dir,length,name:road.tags.name,group:Math.abs(dir.y)>.68?0:1});from.out.push(edges.at(-1));to.incoming.push(edges.at(-1));};
   const two=road.tags.oneway==='no'||road.tags.oneway===undefined;add(a,b,two?1.65:0);if(two)add(b,a,1.65);
  }
 }
 // OSM splits approaches into many short ways. Merge degree-two, same-road
 // pieces so braking and queues are measured across the whole approach.
 const merged=[],visited=new Set();const isCorner=n=>new Set([...n.out,...n.incoming].map(e=>e.name)).size>1;
 const merge=first=>{if(visited.has(first.id))return;let last=first;visited.add(last.id);
  while(!isCorner(last.to)){const choices=last.to.out.filter(e=>e.to!==last.from&&e.name===last.name&&e.dir.dot(last.dir)>.98);if(choices.length!==1||visited.has(choices[0].id))break;last=choices[0];visited.add(last.id);}
  const dir=last.end.clone().sub(first.start).normalize();merged.push({...first,id:merged.length,to:last.to,end:last.end,dir,length:first.start.distanceTo(last.end)});
 };
 for(const e of edges)if(isCorner(e.from)||e.from.incoming.length===0)merge(e);for(const e of edges)merge(e);
 for(const n of nodes.values()){n.out=[];n.incoming=[];}edges.splice(0,edges.length,...merged);for(const e of edges){e.from.out.push(e);e.to.incoming.push(e);}
 for(const e of edges){e.junction=e.to.incoming.some(other=>other.name!==e.name)||e.to.out.some(other=>other.name!==e.name);e.signal=e.junction&&layout.signals.some(s=>s.group===e.group&&s.position.distanceTo(e.end)<27);}
 return {edges,nodes:[...nodes.values()]};
}
const wrapAngle=a=>Math.atan2(Math.sin(a),Math.cos(a));
export class TrafficSimulation{
 constructor(network,{count=CITY_TRAFFIC_COUNT,seed=321}={}){this.network=network;this.randomState=seed;this.cars=[];this.reservations=new Map();this.time=0;
  const candidates=network.edges.filter(e=>e.length>35),spread=new Map();
  for(let i=0;i<count&&candidates.length;i++){
   let spawn=null;
   for(let j=0;j<candidates.length;j++){
    const edge=candidates[(i*17+j)%candidates.length],occupied=spread.get(edge.id)??[];
    const capacity=Math.max(1,Math.floor((edge.length-28)/14)+1);
    if(occupied.length>=capacity||spawn&&occupied.length>=spawn.used)continue;
    const slots=Array.from({length:capacity},(_,k)=>capacity===1?edge.length*.5:12+k*(edge.length-28)/(capacity-1));
    slots.sort((a,b)=>Math.abs(a-edge.length*((i*.61803398875)%1)) - Math.abs(b-edge.length*((i*.61803398875)%1)));
    const s=slots.find(s=>occupied.every(at=>Math.abs(at-s)>=13.9));
    if(s===undefined)continue;spawn={edge,s,used:occupied.length};if(!occupied.length)break;
   }
   if(!spawn)break;
   const {edge,s}=spawn,occupied=spread.get(edge.id)??[];occupied.push(s);spread.set(edge.id,occupied);
   const car={id:i,edge,s,speed:0,length:i%7===6?5.64:5.12,maxSpeed:6.5+(i%5)*.6,position:new Vector3(),heading:Math.atan2(edge.dir.y,edge.dir.x),braking:false,turn:null,wait:0};this.cars.push(car);this.place(car);
  }
 }
 random(){this.randomState=(Math.imul(this.randomState,1664525)+1013904223)>>>0;return this.randomState/4294967296;}
 nextEdge(car){const options=car.edge.to.out.filter(e=>e.to!==car.edge.from&&e.dir.dot(car.edge.dir)>-.8);if(!options.length)return null;const straight=options.filter(e=>e.dir.dot(car.edge.dir)>.85);return straight.length&&this.random()<.75?straight[Math.floor(this.random()*straight.length)]:options[Math.floor(this.random()*options.length)];}
 place(car){if(car.turn){const {a,c,b,s,length}=car.turn,t=Math.min(1,s/length);car.position.copy(a).multiplyScalar((1-t)**2).addScaledVector(c,2*(1-t)*t).addScaledVector(b,t*t);}else car.position.copy(car.edge.start).addScaledVector(car.edge.dir,car.s);car.position.z=.04;}
 respawn(car){const entries=this.network.edges.filter(e=>e.length>50&&e.from.incoming.length===0),pool=entries.length?entries:this.network.edges.filter(e=>e.length>40);for(let i=0;i<pool.length;i++){const e=pool[Math.floor(this.random()*pool.length)];if(this.cars.some(c=>c!==car&&!c.turn&&c.edge===e&&c.s<18))continue;car.edge=e;car.s=3;car.speed=0;car.wait=0;car.heading=Math.atan2(e.dir.y,e.dir.x);return;}}
 update(dt,phase,{pedestrians=[]}={}){dt=Math.max(0,Math.min(dt,.1));this.time+=dt;
  const plans=this.cars.map(car=>{if(pedestrians.some(p=>vehicleContact(p.position??p,car,.8)))return {car,target:0,gap:0,contact:true};if(car.turn)return {car,target:Math.min(car.maxSpeed,3.7),gap:Infinity};const e=car.edge;let gap=Infinity,target=car.maxSpeed;
   for(const other of this.cars){if(other===car)continue;if(!other.turn&&other.edge===e&&other.s>car.s)gap=Math.min(gap,other.s-car.s-(car.length+other.length)/2-2.4);}
   const stop=e.length-9-car.length/2,remaining=stop-car.s,color=e.group===0?phase.a:phase.b;
   if(e.signal&&color!==2&&remaining>=-.15){const canStop=car.speed*car.speed/(2*3.5)+1<remaining;if(color===0||canStop)gap=Math.min(gap,Math.max(0,remaining));}
   if(e.junction&&car.s>e.length-30){const holder=this.reservations.get(e.to.id),out=car.next??(car.next=this.nextEdge(car));if(holder!==undefined&&holder!==car.id||out&&this.cars.some(o=>o!==car&&!o.turn&&o.edge===out&&o.s<car.length+8))gap=Math.min(gap,Math.max(0,remaining));}
   for(const p of pedestrians){const pos=p.position??p,dx=pos.x-car.position.x,dy=pos.y-car.position.y,along=dx*e.dir.x+dy*e.dir.y,across=Math.abs(dx*e.dir.y-dy*e.dir.x);if(along>0&&along<20&&across<1.7)gap=Math.min(gap,Math.max(0,along-car.length/2-2));}
   if(Number.isFinite(gap))target=Math.min(target,Math.sqrt(Math.max(0,2*3.2*gap)),Math.max(0,(gap-1)*.8));return {car,target,gap};});
  for(const {car,target,gap,contact}of plans){if(contact){if(car.speed>.2)car.impactMotion={at:this.time,speed:car.speed};car.speed=0;car.braking=true;continue;}const before=car.position.clone();car.braking=target<car.speed-.15||target<.3;car.speed=Math.max(0,car.speed+Math.max(-3.8*dt,Math.min(1.6*dt,target-car.speed)));let travel=Math.min(car.speed*dt,Math.max(0,gap));
   if(car.turn){car.turn.s+=travel;if(car.turn.s>=car.turn.length){const t=car.turn;this.reservations.delete(t.node);car.edge=t.next;car.s=t.enter;car.turn=null;car.next=null;}}
   else{car.s+=travel;const e=car.edge,exit=e.junction?Math.min(7,e.length*.2):0;if(car.s>=e.length-exit){const next=car.next??this.nextEdge(car);if(!next){car.wait+=dt;car.speed=0;if(car.wait>.7)this.respawn(car);}else{const enter=next.junction?Math.min(7,next.length*.2):Math.min(5,next.length*.2),a=e.start.clone().addScaledVector(e.dir,e.length-exit),b=next.start.clone().addScaledVector(next.dir,enter),c=e.end.clone().add(next.start).multiplyScalar(.5),length=a.distanceTo(c)+c.distanceTo(b);if(e.junction)this.reservations.set(e.to.id,car.id);car.turn={a,b,c,s:0,length:Math.max(.1,length),next,enter,node:e.to.id};car.s=e.length-exit;}}
   }
   this.place(car);const delta=car.position.clone().sub(before);if(delta.lengthSq()>.000001&&delta.lengthSq()<100){const desired=Math.atan2(delta.y,delta.x);car.heading+=wrapAngle(desired-car.heading)*Math.min(1,dt*8);}
  }
 }
}
