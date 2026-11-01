import {Vector3} from 'three';
import {Cartesian3} from 'cesium';
import {toLocal} from './coordinates.js';
// OSM way 1216256939, Times Square Red Steps. The operator and NYC describe
// 27 steps / 16 feet; use those figures over OSM's differing step_count tag.
const p=toLocal(Cartesian3.fromDegrees(-73.9849793,40.7590739));
const q=toLocal(Cartesian3.fromDegrees(-73.9849051,40.759226));
export const STEPS={origin:new Vector3(p.x,p.y,0),up:new Vector3(q.x-p.x,q.y-p.y,0).normalize(),length:Math.hypot(q.x-p.x,q.y-p.y),width:10,count:27,height:4.8768,base:.10};
export const across=new Vector3(STEPS.up.y,-STEPS.up.x,0);
export function plazaPoint(x,y,z=0){return STEPS.origin.clone().addScaledVector(across,x).addScaledVector(STEPS.up,y).setZ(z);}
export function plazaCoordinates(p){const d=p.clone().sub(STEPS.origin);return {x:d.dot(across),y:d.dot(STEPS.up),z:p.z};}
export const BARRIERS=[];
// Temporary crowd-control layout drawn from the reference: boundary rows with
// several wide openings. These movable positions are authored, not surveyed.
for(const side of [-1,1])for(let i=0;i<18;i++){
 const y=-29+i*2.55;if([4,5,10,11].includes(i))continue;
 BARRIERS.push({x:side*10.6,y,length:2.4,height:1.08});
}
export const STEPS_VIEW=plazaPoint(-4,-35,.05);
export const STEPS_HEADING=Math.atan2(STEPS.up.x,STEPS.up.y);
