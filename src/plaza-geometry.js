import {Vector3} from 'three';
import {STEPS,BARRIERS,plazaPoint} from './plaza-layout.js';
const faces=[[0,2,1],[0,3,2],[4,5,6],[4,6,7],[0,1,5],[0,5,4],[3,7,6],[3,6,2],[0,4,7],[0,7,3],[1,2,6],[1,6,5]];
export function createPlazaGeometry(){
 const batches=new Map(),collision=[];
 function emit(vertices,indices,color,solid=false){
  if(color&&!batches.has(color))batches.set(color,[]);
  for(const face of indices)for(const i of face){const v=vertices[i];if(color)batches.get(color).push(v.x,v.y,v.z);if(solid)collision.push(v.x,v.y,v.z);}
 }
 function box(x0,x1,y0,y1,z0,z1,color,solid=false){
  const vs=[[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]].map(p=>plazaPoint(...p));emit(vs,faces,color,solid);
 }
 function beam(a,b,width,color,solid=false){
  const start=plazaPoint(...a),end=plazaPoint(...b),axis=end.clone().sub(start).normalize();
  const r=new Vector3().crossVectors(axis,Math.abs(axis.z)>.9?new Vector3(0,1,0):new Vector3(0,0,1)).normalize().multiplyScalar(width/2),t=new Vector3().crossVectors(axis,r).normalize().multiplyScalar(width/2);
  const vs=[];for(const center of [start,end])for(const [x,y] of [[-1,-1],[1,-1],[1,1],[-1,1]])vs.push(center.clone().addScaledVector(r,x).addScaledVector(t,y));emit(vs,faces,color,solid);
 }
 const rise=STEPS.height/STEPS.count,run=STEPS.length/STEPS.count,w=STEPS.width/2;
 for(let i=0;i<STEPS.count;i++){
  const y0=i*run,y1=(i+1)*run,z=STEPS.base+(i+1)*rise;
  box(-w,w,y0,y1,STEPS.base,z,i%2?'#b81f38':'#d32944');
  box(-w,w,y0,y0+.045,z-.045,z+.008,'#ff7587');
  // Fine glass panel joints read as a real broad staircase, not a solid ramp.
  for(const x of [-2.5,0,2.5])box(x-.013,x+.013,y0+.045,y1,z,z+.007,'#8f182e');
 }
 // Continuous support ramp for smooth locomotion; rear and side faces form the
 // solid ticket-booth volume. Visual tread mismatch is under one 18 cm riser.
 const ramp=[plazaPoint(-w,0,STEPS.base),plazaPoint(w,0,STEPS.base),plazaPoint(w,STEPS.length,STEPS.base+STEPS.height),plazaPoint(-w,STEPS.length,STEPS.base+STEPS.height),plazaPoint(-w,STEPS.length,STEPS.base),plazaPoint(w,STEPS.length,STEPS.base)];
 emit(ramp,[[0,1,2],[0,2,3],[0,3,4],[1,5,2],[4,3,2],[4,2,5]],null,true);
 // Glazed side enclosure and ticket-window back, below the red roof.
 emit(ramp,[[0,3,4],[1,5,2],[4,3,2],[4,2,5]],'#244854',false);
 for(let i=0;i<=8;i++)beam([-w+i*STEPS.width/8,STEPS.length,STEPS.base],[-w+i*STEPS.width/8,STEPS.length,STEPS.base+STEPS.height],.055,'#7b909c');
 const topAt=y=>STEPS.base+STEPS.height*Math.max(0,Math.min(1,y/STEPS.length));
 for(const x of [-w,w,-2.55,2.55]){
  beam([x,-.6,STEPS.base+1.02],[x,STEPS.length,topAt(STEPS.length)+1.02],.07,'#c2cdd2');
  for(let y=0;y<=STEPS.length+.01;y+=STEPS.length/12)beam([x,y,topAt(y)],[x,y,topAt(y)+1.02],.045,'#879ca8');
  if(Math.abs(x)===w){
   const vs=[plazaPoint(x,0,topAt(0)),plazaPoint(x,STEPS.length,topAt(STEPS.length)),plazaPoint(x,STEPS.length,topAt(STEPS.length)+.95),plazaPoint(x,0,topAt(0)+.95)];
   emit(vs,[[0,1,2],[0,2,3]],'#8dcfe33d',true);
  }else{
   // Thin continuous collision rail stops the capsule squeezing between posts.
   const vs=[plazaPoint(x,0,topAt(0)),plazaPoint(x,STEPS.length,topAt(STEPS.length)),plazaPoint(x,STEPS.length,topAt(STEPS.length)+1),plazaPoint(x,0,topAt(0)+1)];emit(vs,[[0,1,2],[0,2,3]],null,true);
  }
 }
 beam([-w,STEPS.length,topAt(STEPS.length)+1.02],[w,STEPS.length,topAt(STEPS.length)+1.02],.07,'#c2cdd2');
 box(-w,w,STEPS.length,STEPS.length+.08,topAt(STEPS.length),topAt(STEPS.length)+1,null,true);
 for(const b of BARRIERS){
  const y0=b.y-b.length/2,y1=b.y+b.length/2;
  for(const z of [.18,b.height])beam([b.x,y0,z],[b.x,y1,z],.045,'#a8b8c3');
  for(let i=0;i<=12;i++){const y=y0+i*b.length/12;beam([b.x,y,.18],[b.x,y,b.height],i===0||i===12?.045:.026,'#879ca8');}
  for(const y of [y0+.18,y1-.18])beam([b.x-.4,y,.055],[b.x+.4,y,.055],.07,'#687b89');
  box(b.x-.045,b.x+.045,y0,y1,.08,b.height,null,true);
 }
 // The red TKTS wayfinding pylon alongside the foot of the staircase.
 box(6.3,6.85,1,1.32,.1,3.7,'#d62845',true);
 return {batches,collision:new Float32Array(collision)};
}
