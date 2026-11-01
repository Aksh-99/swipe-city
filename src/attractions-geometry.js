import {Vector3} from 'three';
import {DetailMesh} from './detail-mesh.js';
import {ATTRACTIONS as A} from './attractions-config.js';
import {CINEMA_BLOCK} from './cinema-config.js';
import {cinemaAxes,cinemaStreetPoint} from './cinema-geometry.js';
const UP=new Vector3(0,0,1),NORTH=new Vector3(...CINEMA_BLOCK.north);
export function createAttractionsGeometry(){
 const mesh=new DetailMesh(),light=new DetailMesh(),paving=new DetailMesh(),glass=[],stone=[],labels=[],posters=[],landscape=[],pools=[],doors=[],bollards=[],barriers=[];
 const night={frontNormal:CINEMA_BLOCK.north,lights:[]};
 const setup=id=>{const f=A.facades.find(f=>f.id===id),a=cinemaAxes(f);return {...a,f,box:(s,y,z,w,d,h,color,solid=false)=>mesh.box(a.at(s,y,z),a.r,a.n,w,d,h,color,solid),face:(s,y,z,w,h,extra={})=>({center:a.at(s,y,z),normal:a.n,right:a.r,width:w,height:h,...extra})};};
 const sign=(a,s,y,z,w,h,kind,shade=.73)=>labels.push(a.face(s,y,z,w,h,{kind,shade}));
 const poster=(a,s,y,z,w,h,ad,wide=false)=>{a.box(s,y-.13,z,w+.27,.25,h+.27,'#24343d');(wide?landscape:posters).push(a.face(s,y+.01,z,w,h,{ad}));};
 const entry=(a,s,w,top=4.5,metal='#9a9272')=>{
  a.box(s,.20,top/2+.16,w,.30,top-.1,'#23373b',true);glass.push(a.face(s,.366,top/2+.16,w-.12,top-.2,{kind:1}));
  const count=Math.round(w/1.23);for(let i=0;i<=count;i++)a.box(s-w/2+i*w/count,.44,top/2+.16,.065,.16,top-.1,metal);
  for(const z of [.23,top-.04,top*.73])a.box(s,.44,z,w,.17,.075,metal);
  for(let i=0;i<count;i++)for(const d of [-.11,.11])mesh.tube(a.at(s-w/2+(i+.5)*w/count+d,.51,1.18),a.at(s-w/2+(i+.5)*w/count+d,.51,1.86),.023,metal);
  doors.push({position:a.at(s,.36,.18),normal:a.n});
 };
 const oval=(a,s,y,z,w,h,color,steps=56)=>{
  const x=a.sx(s),center=a.p(x,y,z);for(let i=0;i<steps;i++){const t=i/steps*Math.PI*2,tt=(i+1)/steps*Math.PI*2;mesh.emit([center,a.p(x+Math.cos(t)*w/2,y,z+Math.sin(t)*h/2),a.p(x+Math.cos(tt)*w/2,y,z+Math.sin(tt)*h/2)],[[0,1,2]],color);}
 };
 const ovalRim=(a,s,y,z,w,h,r,color)=>{const x=a.sx(s);for(let i=0;i<64;i++){const t=i/64*Math.PI*2,tt=(i+1)/64*Math.PI*2;mesh.tube(a.p(x+Math.cos(t)*w/2,y,z+Math.sin(t)*h/2),a.p(x+Math.cos(tt)*w/2,y,z+Math.sin(tt)*h/2),r,color,false,6);}};
 const d=setup('dave-applebees'),lib=setup('liberty-lower'),upper=setup('liberty-upper'),mt=setup('tussauds-tower');

 // Bronze window framework, red spandrels, sandstone piers and visible
 // sign-support steel follow the real shared 234 W42 frontage.
 glass.push(d.face(115.85,.04,23.4,28.9,46.4,{kind:0}));
 for(let s=101.9;s<130.3;s+=1.23)d.box(s,.19,23.4,.066,.29,46.3,'#84978e');
 for(let z=.5;z<46.5;z+=3.17){d.box(115.8,.24,z,28.8,.43,.25,'#b09965');if(z>8)d.box(115.8,.11,z-.57,28.8,.14,.9,'#723b39');}
 for(const s of [101.65,114.85,130.0]){d.box(s,.40,23.25,.50,.65,46.2,'#a98b58');for(let z=7;z<45;z+=6.34)d.box(s,.48,z,.80,.88,.28,'#b4a173');}
 entry(d,109.5,8.3,4.6);sign(d,109.5,.80,5.30,8.6,.9,'applebees',.70);
 entry(d,123.2,10.5,4.5);sign(d,123.2,.80,4.75,10.7,.47,'dave-door',.83);
 // Broad old Liberty Diner canopy is retained below the third-floor venue.
 for(const [a,s,w]of [[d,123.0,14.4],[lib,134.0,6.4]]){
  a.box(s,1.43,5.65,w,2.9,.22,'#253c3c',true);a.box(s,2.79,6.24,w,.31,1.21,'#244337');
  for(const z of [5.72,6.76])a.box(s,2.98,z,w,.16,.13,'#b49c61');
  for(let z=5.90;z<6.7;z+=.18)a.box(s,2.967,z,w,.075,.031,'#71825d');
  sign(a,s,3.0,6.23,w-.45,.86,'diner',.78);
  for(const sx of [s-w/2+.21,s+w/2-.21]){a.box(sx,.59,3.05,.31,.59,5.42,'#a79770',true);for(const z of [5.1,5.25,5.4])a.box(sx,.71,z,.50,.77,.15,'#b09f75');}
  for(let s0=s-w/2+.45;s0<s+w/2;s0+=1.25)light.box(a.at(s0,2.1,5.51),a.r,a.n,.11,.20,.03,'#d7bd81');
 }
 entry(lib,134.0,5.0,4.5);sign(lib,134.0,.55,4.82,5.2,.36,'liberty',.63);
 const libF=upper.f;stone.push(upper.face(134,0.04,26.8,libF.width,39.5));
 for(let z=7.2;z<46.6;z+=1.6)upper.box(134,.14,z,6.4,.2,.065,'#8d8873');
 for(const s of [131.1,136.9])upper.box(s,.27,26.85,.36,.5,39.5,'#b7ab8e');
 // A real shallow oval sign, perimeter rings and support brackets, rather
 // than a small storefront nameplate. The diagonal lettering is in the atlas.
 const ds=122.9,dy=1.24,dz=14.3;
 oval(d,ds,dy-.18,dz,12.25,9.02,'#1e327b');ovalRim(d,ds,dy-.08,dz,12.30,9.08,.095,'#405db7');ovalRim(d,ds,dy+.005,dz,11.95,8.77,.056,'#4163cf');
 sign(d,ds,dy+.03,dz,11.75,8.58,'dave-logo',.82);
 for(const s of [117.5,128.4])for(const z of [10.7,17.9]){mesh.tube(d.at(s,.08,z),d.at(s,1.08,z),.065,'#566678');mesh.tube(d.at(s,.08,z-.75),d.at(s,1.08,z),.053,'#6d7985');}
 // Two-sided projecting EAT / DRINK / PLAY / WATCH sign by the oval.
 const bladeS=130.2,bladeZ=13.9;d.box(bladeS,1.45,bladeZ,.44,2.25,11.96,'#203b7b');
 for(const side of [-1,1]){const normal=d.r.clone().multiplyScalar(side),right=new Vector3(-normal.y,normal.x,0),center=d.at(bladeS,1.45,bladeZ).addScaledVector(d.r,side*.235);labels.push({center,normal,right,width:2.13,height:11.76,kind:'dave-blade',shade:.82});}
 for(const y of [.29,2.60])for(const side of [-1,1])mesh.tube(d.at(bladeS,y,8.0).addScaledVector(d.r,side*.24),d.at(bladeS,y,19.82).addScaledVector(d.r,side*.24),.049,'#cc7953');
 poster(d,116.7,.88,33.0,26.0,16.9,3,true);
 for(const z of [23.7,42.0])for(let s=104;s<129;s+=4.1){mesh.tube(d.at(s,.31,z),d.at(s,1.32,z+.45),.052,'#73837f');d.box(s,1.32,z+.47,.4,.25,.13,'#65766d');}

 // Madame Tussauds has a taller central survey wall and lower flanking
 // walls. Each surface stops at its original roof and follows its plane.
 for(const f of A.facades.filter(f=>f.kind==='tussauds')){
  const a=setup(f.id),s=(f.start+f.end)/2;stone.push(a.face(s,.035,f.bottom+f.height/2,f.width,f.height));
  for(let ss=f.start+.46;ss<f.end;ss+=1.6){glass.push(a.face(ss,.075,f.bottom+f.height/2,.89,f.height-.25,{kind:0}));for(const offset of [-.5,.5])a.box(ss+offset,.16,f.bottom+f.height/2,.15,.28,f.height,'#a99d7c');}
  for(let z=7;z<f.bottom+f.height;z+=3.17)a.box(s,.14,z,f.width,.23,.25,'#a29a7f');
 }
 // Red entrance portal and curved stainless canopy from the reference.
 const ms=151.3,mx=mt.sx(ms);mt.box(ms,.27,3.74,12.5,.46,7.08,'#87333c');
 for(const s of [145.65,156.95]){mt.box(s,.59,3.70,1.12,.95,7.0,'#a54246',true);for(let z=.7;z<7;z+=.68)mt.box(s,1.08,z,1.10,.026,.030,'#75323a');}
 entry(mt,ms,8.7,4.70,'#9c835b');sign(mt,ms,.68,5.01,8.65,.42,'mt-entrance',.79);
 const canopy={station:ms,width:12.0,depth:3.75,underside:7.2,top:11.85};
 for(let i=0;i<48;i++){
  const t=i/48*Math.PI,tt=(i+1)/48*Math.PI;
  const point=(angle,upper)=>mt.p(mx+Math.cos(angle)*(upper?4.65:6.0),.12+Math.sin(angle)*(upper?2.57:3.75),upper?11.85:7.2);
  const a=point(t,false),b=point(tt,false),c=point(tt,true),d0=point(t,true);
  mesh.quad(a,b,c,d0,['#aab7b2','#859a99','#b3bdb5','#718785'][i%4],true);
  mesh.emit([mt.p(mx,.12,7.2),a,b],[[0,1,2]],'#892d3c',true);
  mesh.tube(a,b,.070,'#c0c5b8');mesh.tube(d0,c,.069,'#b8c5bc');
  if(i%4===0){mesh.tube(a,d0,.033,'#a7b6b1');mesh.tube(mt.p(mx,.14,7.15),a.clone().addScaledVector(UP,-.05),.033,'#af7366');}
  if(i%3===0)light.tube(a.clone().addScaledVector(UP,-.10),a.clone().addScaledVector(UP,-.075),.036,'#d5bd82',false,6);
 }
 for(const t of [.16,.45,.75]){const z=7.2+t*4.65,rx=6.0-t*1.35,dep=3.75-t*1.18;for(let i=0;i<48;i++){const q=i/48*Math.PI,qq=(i+1)/48*Math.PI;mesh.tube(mt.p(mx+Math.cos(q)*rx,.15+Math.sin(q)*dep,z),mt.p(mx+Math.cos(qq)*rx,.15+Math.sin(qq)*dep,z),.045,'#bdc7bd');}}
 // Tall segmented blade: gold brackets, dark violet faces and serif letters.
 const blade={station:ms,centerZ:29.20,height:32.4,depth:3.50,width:1.24};
 mt.box(ms,2.10,blade.centerZ,1.24,3.50,blade.height,'#4d4852');
 for(const side of [-1,1]){
  const normal=mt.r.clone().multiplyScalar(side),right=new Vector3(-normal.y,normal.x,0),center=mt.at(ms,2.10,blade.centerZ).addScaledVector(mt.r,side*.634);
  labels.push({center,normal,right,width:3.34,height:32.18,kind:'mt-blade',shade:.73});
 }
 for(const s of [ms-.69,ms+.69])for(const y of [.32,3.88])mesh.tube(mt.at(s,y,13.0),mt.at(s,y,45.4),.063,'#bfa360');
 for(let z=13.0;z<45.5;z+=2.22)for(const side of [-1,1]){const offset=mt.r.clone().multiplyScalar(side*.70);mesh.tube(mt.at(ms,.34,z).add(offset),mt.at(ms,3.88,z).add(offset),.055,'#bf9952');}
 for(const z of [13.2,19.8,26.4,33.0,39.6,45.0]){
  let prev;for(let i=0;i<=16;i++){const t=i/16,p=mt.at(ms,.05+3.8*t,z+.90*Math.sin(Math.PI*t));if(prev)mesh.tube(prev,p,.11,'#ba9a52');prev=p;}
 }
 // Simplified sculptural silver hand: shaped palm, tapered fingers, knuckles
 // and nails. It is fixed architectural relief, with no character or AI.
 const ellipsoid=(x,y,z,rx,ry,rz,color)=>{
  const vs=[],faces=[],rows=10,cols=18;for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){const v=j/rows*Math.PI,u=i/cols*Math.PI*2;vs.push(mt.p(mx+x+Math.sin(v)*Math.cos(u)*rx,y+Math.sin(v)*Math.sin(u)*ry,z+Math.cos(v)*rz));}
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const a=j*(cols+1)+i,b=a+cols+1;faces.push([a,b,a+1],[a+1,b,b+1]);}mesh.emit(vs,faces,color);
 };
 mesh.tube(mt.p(mx+6.2,.13,7.75),mt.p(mx+4.65,2.40,7.65),.63,'#929f9e',false,16);
 ellipsoid(4.4,2.66,7.60,1.12,.71,.56,'#a6b4b0');ellipsoid(3.35,3.1,7.48,1.18,1.10,.48,'#aeb9b4');
 for(let finger=0;finger<4;finger++){
  const y=2.31+finger*.49,len=[1.63,2.10,1.96,1.54][finger],r=[.22,.24,.235,.19][finger];
  const points=[[3.08,y,7.55],[2.27,y+.11,7.35],[3.08-len,y+.20,6.93],[2.88-len,y+.19,6.30+finger*.045]];
  for(let j=1;j<points.length;j++){const a=points[j-1],b=points[j];mesh.tube(mt.p(mx+a[0],a[1],a[2]),mt.p(mx+b[0],b[1],b[2]),r*(1-j*.09),'#aab6b1',false,12);ellipsoid(...b,r*.91,r*.92,r*1.02,'#b0bab4');}
  const tip=points.at(-1);ellipsoid(tip[0],tip[1]+.13,tip[2]+.13,r*.72,.038,.20,'#c2c9bd');
 }
 const thumb=[[3.9,2.1,7.37],[3.3,1.53,7.06],[2.55,1.48,6.64],[1.95,1.75,6.66]];
 for(let i=1;i<thumb.length;i++){const a=thumb[i-1],b=thumb[i];mesh.tube(mt.p(mx+a[0],a[1],a[2]),mt.p(mx+b[0],b[1],b[2]),.25-i*.025,'#a7b4b0',false,12);ellipsoid(...b,.24,.24,.25,'#b4beb6');}
 // Suspended red/gold medallion beneath the hand; heads remain clear below.
 const medS=ms-1.15;mesh.tube(mt.at(medS,3.42,4.55),mt.at(medS,3.71,4.55),1.43,'#9c493c',false,48);ovalRim(mt,medS,3.73,4.55,2.86,2.86,.075,'#ba9a5a');sign(mt,medS,3.815,4.55,2.70,2.70,'mt-medallion',.77);
 for(const s of [ms-2.05,ms-.35])mesh.tube(mt.at(s,3.57,5.65),mt.at(s,3.57,6.35),.026,'#b1a679');
 // Photo references show dark steel ad gantries beside the blade.
 const west=setup('tussauds-west'),east=setup('tussauds-end');
 poster(west,143.0,.83,30.70,7.45,13.4,2);poster(west,143.0,.83,19.25,7.45,8.50,5);
 for(const s of [139.1,146.85])for(let z=12.5;z<38;z+=3.5){mesh.tube(west.at(s,.09,z),west.at(s,1.13,z),.06,'#526669');west.box(s,.74,z,.16,1.5,.11,'#566c6d');}
 poster(east,163.2,.74,14.6,6.4,13.2,7);poster(mt,157.1,.95,3.6,1.25,5.55,0);
 // Bridge sign behind the projecting blade matches the ad-packed middle bay.
 poster(upper,134.0,4.15,25.15,6.0,15.2,1);
 night.lights.push({position:d.at(ds,2,13).toArray(),radius:[17,17,12],color:[.035,.055,.20]},{position:mt.at(ms,2,6.8).toArray(),radius:[11,11,8],color:[.19,.04,.055]});
 for(const [a,s,w]of [[d,123.2,14],[mt,ms,13]])pools.push({center:a.at(s,2,.19),normal:UP,right:a.r,up:a.n,width:w,height:5});
 // Extend only this photographed south curb. The source street and the
 // original northern frontage remain the navigation frame.
 for(let s=130;s<167.1;s+=2.4){const end=Math.min(s+2.4,167.1),a=cinemaStreetPoint(s,-12.1,.176),b=cinemaStreetPoint(end,-12.1,.176),c=cinemaStreetPoint(end,-15.35,.176),d0=cinemaStreetPoint(s,-15.35,.176);paving.quad(a,b,c,d0,'#87918f',true);paving.quad(a.clone().setZ(0),b.clone().setZ(0),b,a,'#637176',true);mesh.tube(a.clone().setZ(.183),d0.clone().setZ(.183),.009,'#526164',false,4);}
 paving.quad(cinemaStreetPoint(130,-12.1,.178),cinemaStreetPoint(167.1,-12.1,.178),cinemaStreetPoint(167.1,-14.55,.178),cinemaStreetPoint(130,-14.55,.178),'#87918f',true);
 paving.quad(cinemaStreetPoint(134,-7,.039),cinemaStreetPoint(167.1,-7,.039),cinemaStreetPoint(167.1,-11.9,.039),cinemaStreetPoint(134,-11.9,.039),'#763d3e');
 for(let s=134.4;s<166.7;s+=3.1){if(Math.abs(s-151.3)<4.2||Math.abs(s-134)<1.65)continue;
  const p=cinemaStreetPoint(s,-12.56,.178),n=NORTH.clone(),r=new Vector3(-n.y,n.x,0),color=['#9d3d36','#265a8d','#a3aaa4'][Math.round(s/3.1)%3];mesh.box(p.clone().addScaledVector(UP,.45),r,n,2.08,.71,.88,color,true);mesh.box(p.clone().addScaledVector(UP,.914),r,n,1.98,.63,.048,color);
  labels.push({center:p.clone().addScaledVector(n,.369).addScaledVector(UP,.49),normal:n,right:r,width:1.78,height:.145,kind:'barrier',shade:.58});barriers.push({position:p,normal:n,right:r,width:2.08,depth:.71});
 }
 for(const s of [147.9,154.7]){
  const p=cinemaStreetPoint(s,-12.56,.178);mesh.tube(p,p.clone().addScaledVector(UP,.93),.125,'#bac4c0',true,16);mesh.tube(p.clone().addScaledVector(UP,.01),p.clone().addScaledVector(UP,.07),.17,'#71858c',false,16);mesh.tube(p.clone().addScaledVector(UP,.89),p.clone().addScaledVector(UP,.94),.128,'#d2d3c4',false,16);for(const z of [.20,.66])mesh.tube(p.clone().addScaledVector(UP,z),p.clone().addScaledVector(UP,z+.025),.127,'#6f858c',false,16);bollards.push({position:p,normal:NORTH.clone(),radius:.125});
 }
 const routes=[{id:'attractions-sidewalk',points:[cinemaStreetPoint(103,-13.75),cinemaStreetPoint(166.5,-13.75)]},{id:'attractions-street',points:[cinemaStreetPoint(126,0,.04),cinemaStreetPoint(166,0,.04)]}];
 return {batches:mesh.batches,emissive:light.batches,paving:paving.batches,glass,stone,labels,posters,landscape,pools,night,doors,bollards,barriers,routes,canopy,blade,collision:new Float32Array([...mesh.collision,...paving.collision])};
}
