import{Vector3}from'three';import{TSX47 as D}from'./tsx47-config.js';
export const TSX47_LED_BRIGHTNESS=.87;
// A single rounded 90-degree LED assembly, separate from the building's old
// faceted survey wall. Every span shares literal corner vertices and arc-length
// texture coordinates, as on the existing Hershey's rounded screen.
export function createTsx47Led(){const o=new Vector3(...D.origin),e=new Vector3(...D.east),N=new Vector3(...D.north),at=(t,d,z=0)=>o.clone().addScaledVector(e,t).addScaledVector(N,d).setZ(z),profile=[at(288,-40.2),at(288,-19)];
for(let i=1;i<=24;i++){const a=Math.PI-i*Math.PI/48;profile.push(at(299+11*Math.cos(a),-19+11*Math.sin(a)));}profile.push(at(324,-8));
const lengths=profile.slice(1).map((p,i)=>p.distanceTo(profile[i])),total=lengths.reduce((a,b)=>a+b,0),faces=[];let distance=0;
for(let i=0;i<lengths.length;i++){const a=profile[i],b=profile[i+1],dir=b.clone().sub(a).normalize(),normal=new Vector3().crossVectors(new Vector3(0,0,1),dir),right=dir.clone().negate(),lo=10,hi=29;faces.push({corners:[b.clone().setZ(lo),a.clone().setZ(lo),a.clone().setZ(hi),b.clone().setZ(hi)],center:a.clone().lerp(b,.5).setZ((lo+hi)/2),normal,right,width:lengths[i],height:hi-lo,kind:'main',curved:i>0&&i<=24,u0:1-(distance+lengths[i])/total,u1:1-distance/total});distance+=lengths[i];}
// Secondary displays have their own quiet frames, never repeated across facets.
const secondary=(a,b,lo,hi,kind)=>{const dir=b.clone().sub(a).normalize(),n=new Vector3().crossVectors(new Vector3(0,0,1),dir);return{corners:[b.clone().setZ(lo),a.clone().setZ(lo),a.clone().setZ(hi),b.clone().setZ(hi)],center:a.clone().lerp(b,.5).setZ((lo+hi)/2),normal:n,right:dir.clone().negate(),width:a.distanceTo(b),height:hi-lo,kind,curved:false};};
faces.push(secondary(at(288,-51.8),at(288,-40.6),10.5,27,'lostboys'),secondary(at(324.7,-8),at(348.5,-8),11.4,25.5,'anime'));return{faces,profile,total};}
