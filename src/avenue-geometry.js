import {Vector3} from 'three';
import {DetailMesh} from './detail-mesh.js';
import {steelCylinder} from './curb-bollard-geometry.js';
import {AVENUE as A} from './avenue-config.js';
const UP=new Vector3(0,0,1),wrap=A.wrap.map(f=>({...f,a:new Vector3(...f.a),b:new Vector3(...f.b),n:new Vector3(...f.normal)}));
const miter=(a,b)=>a.clone().add(b).divideScalar(1+a.dot(b));
export function avenuePoint(s,offset=0,z=0){
 let i=wrap.findIndex(f=>s<=f.s1+1e-8);if(i<0)i=wrap.length-1;const f=wrap[i],t=Math.max(0,Math.min(1,(s-f.s0)/f.length));
 const a=miter(wrap[Math.max(0,i-1)].n,f.n),b=miter(f.n,wrap[Math.min(wrap.length-1,i+1)].n);
 return {point:f.a.clone().lerp(f.b,t).addScaledVector(a.lerp(b,t),offset).setZ(z),normal:f.n.clone(),right:new Vector3(-f.n.y,f.n.x,0)};
}
export function avenueFaces(from,to,bottom,top,offset,extra={}){
 const faces=[];
 for(const f of wrap){const a=Math.max(from,f.s0),b=Math.min(to,f.s1);if(b-a<.0001)continue;
  faces.push({normal:f.n,right:new Vector3(-f.n.y,f.n.x,0),width:b-a,height:top-bottom,s0:a,s1:b,bottom,top,
   corners:[avenuePoint(a,offset,bottom).point,avenuePoint(b,offset,bottom).point,avenuePoint(b,offset,top).point,avenuePoint(a,offset,top).point],...extra});
 }return faces;
}
export function createAvenueGeometry(){
 const mesh=new DetailMesh(),emissive=new DetailMesh(),paving=new DetailMesh(),glass=[],interiors=[],screens=[],labels=[],posts=[],doors=[],walkway=[],pools=[];
 const band=(from,to,bottom,top,offset,color,solid=false)=>{for(const f of avenueFaces(from,to,bottom,top,offset))mesh.quad(...f.corners,color,solid);};
 const box=(s,off,z,w,d,h,color,solid=false,target=mesh)=>{const p=avenuePoint(s,off,z);target.box(p.point,p.right,p.normal,w,d,h,color,solid);};
 // Dark green curtain wall and restrained physical metal. The tower and
 // rounded footprint remain the original streamed city building.
 glass.push(...avenueFaces(0,A.length,.23,A.height,.14));
 band(0,A.length,.08,.29,.23,'#626e72',true);
 band(0,A.length,.17,2.8,.17,null,true);
 for(let z=.4;z<A.height;z+=1.28){
  band(0,A.length,z,z+.072,.25,'#92a0a2');
  band(0,A.length,z+.12,z+.15,.26,'#495d64');
 }
 for(let s=0;s<A.length;s+=2.13)box(s,.23,A.height/2,.07,.19,A.height-.2,'#9aabaa');
 for(const z of [4.48,8.82,13.3,26.62,30.75,35.05,38.8])band(0,A.length,z-.09,z+.09,.31,'#778e91');
 // Three store levels, separated by real mullions and floor spandrels.
 // Only the clothing slice of the existing authored retail atlas is used.
 for(let s=.12;s<57.5;s+=3.8)for(let row=0;row<3;row++){
  const end=Math.min(s+3.68,57.5),bottom=.40+row*4.34,top=bottom+3.92;
  interiors.push(...avenueFaces(s,end,bottom,top,.286,{from:s,to:end,row}));
  band(s,end,top,top+.27,.325,'#40565b');
  box(s,.34,bottom+1.97,.058,.12,3.97,'#b4b9ac');
  box((s+end)/2,.35,bottom+1.97,.033,.10,3.94,'#6c7c78');
 }
 // A restrained stone/glass strip along W42, as in the reference's right edge.
 band(58.0,A.length,.3,A.height,.32,'#758381');
 for(let z=1.0;z<A.height;z+=.68)band(58.0,A.length,z,z+.027,.335,'#444f54');
 for(const s of [58.6,62.4]){
  glass.push(...avenueFaces(s-.38,s+.38,5.4,37.8,.351,{kind:'office'}));
  box(s,.41,21.6,.04,.10,32.4,'#a0aaaa');
 }
 const screen=(from,to,bottom,top,crop=[0,0,1,1],kind='collage')=>{
  band(from-.10,to+.10,bottom-.12,top+.12,.40,'#17252d');
  screens.push(...avenueFaces(from,to,bottom,top,.47,{from,to,crop,kind}));
  for(const z of [bottom-.12,top+.12])band(from-.10,to+.10,z-.035,z+.035,.51,'#617780');
 };
 // The owner's published 108 x 42 ft corner screen wraps continuously over
 // the source facets, with a single shared UV span across the entire mosaic.
 screen(A.screen.from,A.screen.to,A.screen.bottom,A.screen.top);
 // Broad Broadway advertising frame: two portrait-like editorial crops above
 // a low collage ribbon. Preserve the 78 x 60 ft overall upper screen envelope.
 const w=A.broadwayScreen.width,h=A.broadwayScreen.height;
 screen(.20,.20+w/2-.10,12.2,12.2+h,[.01,0,.22,1]);
 screen(.20+w/2+.10,.20+w,12.2,12.2+h,[.54,0,.76,1]);
 screen(.20,.20+w,5.35,11.8,[0,.05,1,.85]);
 // Two collage monitors flank the tall clear rounded entrance glazing.
 screen(24.45,31.95,5.45,12.6,[.0,.04,.33,.94]);
 screen(49.0,56.6,5.45,12.6,[.65,.04,.98,.94]);
 function canopy(from,to,height,depth){
  for(const f of avenueFaces(from,to,height,height+.25,.38)){
   const a=f.s0,b=f.s1,p=(s,o,z)=>avenuePoint(s,o,z).point;
   mesh.quad(p(a,.35,height),p(b,.35,height),p(b,depth,height),p(a,depth,height),'#263339',true);
   mesh.quad(p(a,depth,height),p(b,depth,height),p(b,depth,height+.25),p(a,depth,height+.25),'#182328',true);
   mesh.quad(p(a,.35,height+.25),p(a,depth,height+.25),p(b,depth,height+.25),p(b,.35,height+.25),'#4e6467',true);
   emissive.tube(p(a,depth-.16,height-.035),p(b,depth-.16,height-.035),.022,'#c4b589',false,6);
  }
 }
 canopy(36,48.5,3.83,1.6);canopy(20.9,28.8,3.57,1.22);
 for(const s of [23.3,25.85,39.8,42.7,45.6]){
  for(const edge of [-1.05,0,1.05])box(s+edge,.42,1.88,.07,.24,3.34,'#a49677');
  box(s,.42,3.55,2.1,.24,.085,'#a49677');
  box(s,.43,.29,2.1,.23,.13,'#6e695c');
  for(const d of [-.15,.15]){const a=avenuePoint(s+d,.57,1.1).point,b=avenuePoint(s+d,.57,1.85).point;mesh.tube(a,b,.023,'#c9c6b0');}
  const p=avenuePoint(s,.41,.17);doors.push({point:p.point,normal:p.normal});
 }
 labels.push(...avenueFaces(37.7,47.4,4.46,7.09,.52,{kind:'wordmark',from:37.7,to:47.4,shade:.84}));
 labels.push(...avenueFaces(21.05,28.75,4.08,5.37,.53,{kind:'wordmark',from:21.05,to:28.75,shade:.79}));
 labels.push(...avenueFaces(51.0,56.5,17.2,18.7,.53,{kind:'campaign',from:51,to:56.5,shade:.66}));
 labels.push(...avenueFaces(39.25,46.05,3.33,3.66,.58,{kind:'entry',from:39.25,to:46.05,shade:.67}));
 // A continuous low sidewalk joins the existing street surface. Its outer
 // edge remains near the facade; no lane or crosswalk is relocated.
 for(const f of wrap){
  const p=(s,o,z)=>avenuePoint(s,o,z).point;
  paving.quad(p(f.s0,.0,.17),p(f.s1,.0,.17),p(f.s1,4.45,.17),p(f.s0,4.45,.17),'#a1a7a5',true);
  paving.quad(p(f.s0,4.45,0),p(f.s1,4.45,0),p(f.s1,4.45,.17),p(f.s0,4.45,.17),'#68767c',true);
 }
 for(const s of [29.0,32.5,36.0,39.5,46.5,50.0,53.5,57.0]){
  const p=avenuePoint(s,4.08,.17);steelCylinder(mesh,p.point,p.normal);posts.push({position:p.point,normal:p.normal});
 }
 for(let s=.5;s<A.length-.5;s+=.75)walkway.push(avenuePoint(s,2.08,.17).point);
 for(const s of [23.4,40.7,45.2]){const p=avenuePoint(s,1.9,.181);pools.push({center:p.point,normal:UP,right:p.right,up:p.normal,width:6.8,height:3.3});}
 const night={frontNormal:A.normal,lights:[{position:avenuePoint(41,.8,18).point.toArray(),radius:[20,18,16],color:[.16,.14,.13]},{position:avenuePoint(41,1,4).point.toArray(),radius:[15,15,7],color:[.15,.083,.037]}]};
 return {batches:mesh.batches,emissive:emissive.batches,paving:paving.batches,collision:new Float32Array([...mesh.collision,...paving.collision]),glass,interiors,screens,labels,posts,doors,walkway,pools,night};
}
