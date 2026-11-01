import {Vector3} from 'three';
import data from '../public/data/marriott-front.json' with {type:'json'};
import {WEST45,west45Local} from './west45-config.js';

// Reference proportions: shops, a shorter lower screen row, the broad main
// display, then hotel glazing. Never project advertising up the hotel tower.
export const MARRIOTT_LED_BANDS=Object.freeze({lower:[8.8,17.2],upper:[18,32.4]});
const e=new Vector3(...WEST45.east),n=new Vector3(...WEST45.north),o=new Vector3(...WEST45.origin);
const at=([t,d],z)=>o.clone().addScaledVector(e,t).addScaledVector(n,d).setZ(z);
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
function outerProfile(kind){
 // Smooth LED envelopes span over window recesses. Original triangular wall
 // holes must not be treated as holes in a physical opaque billboard.
 const points=[...new Map(data.faces.filter(f=>f.kind===kind).flatMap(f=>f.vertices.map(v=>{
  const q=west45Local(v),p=[+q.t.toFixed(2),+q.d.toFixed(2)];return[p.join(','),p];
 }))).values()].sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
 const half=items=>{const out=[];for(const p of items){while(out.length>1&&cross(out.at(-2),out.at(-1),p)<=0)out.pop();out.push(p);}return out;};
 const lo=half(points),hi=half([...points].reverse()),hull=[...lo.slice(0,-1),...hi.slice(0,-1)];
 // CCW starts at the western W45 return, continues around the street-facing
 // curve and stops at the northern end; never bridge across the building back.
 const north=Math.max(...hull.map(p=>p[1])),stop=hull.findIndex(p=>p[1]===north);
 return hull.slice(0,stop+1);
}
export function createMarriottLed(){
 const faces=[],ribbons=[],profiles={};
 for(const kind of ['lower','upper']){
  const profile=outerProfile(kind),[bottom,top]=MARRIOTT_LED_BANDS[kind];profiles[kind]=profile;
  const edgeNormals=profile.slice(1).map((b,i)=>{
  const dir=at(b,0).sub(at(profile[i],0)).normalize();return new Vector3().crossVectors(dir,new Vector3(0,0,1));
 });
 const raised=profile.map((p,i)=>{
  const before=edgeNormals[Math.max(0,i-1)],after=edgeNormals[Math.min(i,edgeNormals.length-1)],miter=before.clone().add(after).normalize();
  return at(p,0).addScaledVector(miter,.35/Math.max(.5,miter.dot(after)));
 });
 const lengths=profile.slice(1).map((b,i)=>Math.hypot(b[0]-profile[i][0],b[1]-profile[i][1]));
  const side=lengths.map((_,i)=>(profile[i][1]+profile[i+1][1])/2<10.2);
  const totals={side:0,front:0},offsets={side:0,front:0};
  lengths.forEach((l,i)=>totals[side[i]?'side':'front']+=l);
  for(let i=0;i<lengths.length;i++){
   const a=raised[i],b=raised[i+1],dir=b.clone().sub(a).normalize(),normal=edgeNormals[i];
   // Shared mitered corners close every LED seam over the original wall trim.
   const group=side[i]?'side':'front',u0=offsets[group]/totals[group],u1=(offsets[group]+lengths[i])/totals[group];offsets[group]+=lengths[i];
   const face=(z0,z1,extra={})=>({kind,corners:[a.clone().setZ(z0),b.clone().setZ(z0),b.clone().setZ(z1),a.clone().setZ(z1)],center:a.clone().lerp(b,.5).setZ((z0+z1)/2),normal,right:dir,width:lengths[i],height:z1-z0,side:side[i],u0,u1,...extra});
   faces.push(face(bottom,top));
   if(kind==='lower')ribbons.push(face(8.4,8.8,{kind:'ribbon'}));
   else ribbons.push(face(17.2,18,{kind:'ribbon'}),face(32.4,32.85,{kind:'ribbon'}));
  }
 }
 return{faces,ribbons,profiles};
}
export function marriottLedUV(face,u,v){
 const x=face.u0+u*(face.u1-face.u0);
 return [.002+x*.996,(face.kind==='upper'?.503:.003)+v*.494];
}
