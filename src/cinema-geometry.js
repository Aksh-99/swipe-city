import {Vector3} from 'three';
import {DetailMesh} from './detail-mesh.js';
import {CINEMA_BLOCK as B} from './cinema-config.js';
const UP=new Vector3(0,0,1),ORIGIN=new Vector3(...B.origin),EAST=new Vector3(...B.east),NORTH=new Vector3(...B.north);
export const cinemaStreetPoint=(s,t,z=.18)=>ORIGIN.clone().addScaledVector(EAST,s).addScaledVector(NORTH,t).setZ(z);
export function cinemaAxes(f){
 const c=new Vector3(...f.center),n=new Vector3(...f.normal),r=new Vector3(-n.y,n.x,0);
 const p=(x,y,z)=>c.clone().addScaledVector(r,x).addScaledVector(n,y).setZ(z);
 const station=c.clone().sub(ORIGIN).dot(EAST),sx=s=>(s-station)/r.dot(EAST);
 return {c,n,r,p,sx,at:(s,y,z)=>p(sx(s),y,z)};
}
export function createCinemaGeometry(){
 const mesh=new DetailMesh(),light=new DetailMesh(),paving=new DetailMesh(),glass=[],stone=[],brick=[],labels=[],posters=[],landscape=[],pools=[],barriers=[],doors=[],routes=[];
 const night={frontNormal:B.north,lights:[]};
 const facade=id=>B.facades.find(f=>f.id===id);
 const setup=f=>{
  const a=cinemaAxes(f),{p,n,r}=a;
  return {...a,box:(x,y,z,w,d,h,color,solid=false)=>mesh.box(p(x,y,z),r,n,w,d,h,color,solid),face:(x,y,z,w,h,extra={})=>({center:p(x,y,z),normal:n,right:r,width:w,height:h,...extra})};
 };
 const label=(a,x,y,z,w,h,kind,shade=.72)=>labels.push(a.face(x,y,z,w,h,{kind,shade}));
 const screen=(a,x,y,z,w,h,ad,wide=false)=>{
  a.box(x,y-.12,z,w+.25,.24,h+.25,'#192b34');(wide?landscape:posters).push(a.face(x,y+.008,z,w,h,{ad}));
  for(const xx of [x-w/2,x+w/2])a.box(xx,y-.22,z,.075,.50,h+.3,'#5c6a6c');
 };
 const entry=(a,x,width,top=4.9,metal='#9b9580')=>{
  a.box(x,.21,top/2+.15,width,.30,top-.10,'#172b31',true);
  glass.push(a.face(x,.373,top/2+.15,width-.15,top-.21,{kind:2}));
  const count=Math.max(2,Math.round(width/1.35)),bay=width/count;
  for(let i=0;i<=count;i++)a.box(x-width/2+i*bay,.45,top/2+.16,.06,.16,top-.10,metal);
  for(const z of [.25,top-.03,top*.74])a.box(x,.46,z,width,.18,.07,metal);
  for(let i=0;i<count;i++)for(const d of [-.10,.10])mesh.tube(a.p(x-width/2+(i+.5)*bay+d,.54,1.15),a.p(x-width/2+(i+.5)*bay+d,.54,1.95),.023,metal);
  doors.push({position:a.p(x,.36,.18),normal:a.n});
 };
 const canopy=(a,x,width,depth,z,kind)=>{
  a.box(x,depth/2,z,width,depth,.31,'#273339',true);a.box(x,depth,z+.16,width,.22,.64,'#132229');
  label(a,x,depth+.118,z+.17,width-.4,.49,kind,.89);
  for(const sign of [-1,1]){
   const center=a.p(x+sign*width/2,depth/2,z+.17),normal=a.r.clone().multiplyScalar(sign),right=new Vector3(-normal.y,normal.x,0);
   labels.push({center,normal,right,width:depth-.2,height:.46,kind,shade:.89});
  }
  for(let xx=x-width/2+.18;xx<x+width/2;xx+=.28)for(const zz of [z-.12,z+.46])light.tube(a.p(xx,depth+.12,zz),a.p(xx,depth+.153,zz),.026,'#d6c48d',false,6);
  for(let xx=x-width/2+.7;xx<x+width/2;xx+=1.5)for(const yy of [.8,depth-.6])light.box(a.p(xx,yy,z-.175),a.r,a.n,.17,.17,.03,'#e5d6aa');
  pools.push({center:a.p(x,2,.185),normal:UP,right:a.r,up:a.n,width:width+3,height:5});
  night.lights.push({position:a.p(x,1.0,z).toArray(),radius:[14,14,8],color:kind==='regal'?[.18,.071,.021]:[.17,.10,.055]});
 };

 // The office tower is dressed all the way up its surveyed street-facing
 // elevations. No new tower, rounded building volume or fictional roof.
 for(const f of B.facades.filter(f=>f.kind==='eleven')){
  const a=setup(f),{width:w,bottom:b,height:h}=f;
  glass.push(a.face(0,.045,b+h/2,w,h,{kind:0}));
  for(let x=-w/2+.1;x<w/2;x+=1.56)a.box(x,.12,b+h/2,.054,.16,h,'#7b8e92');
  for(let z=Math.max(6.3,b);z<b+h;z+=z<28?1.15:3.75){
   a.box(0,.20,z,w,.35,z<28?.31:.23,'#aab5b2');a.box(0,.395,z-.14,w,.045,.052,'#46585c');
  }
  if(b<1){
   a.box(0,.17,.44,w,.27,.5,'#4e6064',true);
   for(let x=-w/2+1.0;x<w/2;x+=3.12)a.box(x,.26,3.0,.085,.30,5.6,'#9caeae');
   label(a,0,.30,5.35,w-.3,.61,'eleven',.59);
  }
 }
 const ec=setup(facade('eleven-corner'));entry(ec,0,5.8,4.9,'#a7b1aa');
 // The projecting glass canopy follows the surveyed corner and terminates
 // at slim steel ribs and tension rods, as in the reference.
 ec.box(0,1.75,6.15,9.0,3.35,.16,'#677f80',true);
 for(let x=-4.4;x<=4.4;x+=1.1){mesh.tube(ec.p(x,.12,8.2),ec.p(x,3.4,6.28),.029,'#aebdb6');mesh.tube(ec.p(x,.15,6.07),ec.p(x,3.4,6.07),.046,'#b4c1bc');}
 for(const z of [6.08,6.27])mesh.tube(ec.p(-4.5,3.45,z),ec.p(4.5,3.45,z),.047,'#acbdb9');
 label(ec,0,3.48,5.9,8.4,.39,'eleven',.66);
 screen(ec,0,.66,15.35,5.7,10.2,3);
 const ep=setup(facade('eleven-north-podium'));screen(ep,0,.88,15.0,17.6,8.15,2,true);
 const ew=setup(facade('eleven-west'));screen(ew,-3.4,.78,15.1,14.6,8.2,0,true);
 const el=setup(facade('eleven-link'));entry(el,0,7.8,6.0,'#8faaa8');
 for(const x of [-3.0,3.0]){
  el.box(x,1.14,.60,2.05,1.08,.83,'#b8b9b2',true);el.box(x,1.14,1.035,1.86,.90,.07,'#333c33');
  for(let j=0;j<7;j++){const dx=(j%3-1)*.48,yy=1.12+(j%2-.5)*.45,h=1.8+(j*7%5)*.13;mesh.tube(el.p(x+dx,yy,1.1),el.p(x+dx*.5,yy,h),.055,'#605846');for(let k=0;k<3;k++)mesh.tube(el.p(x+dx,yy,1.28+k*.22),el.p(x+dx*.6,yy,1.51+k*.22),.16-k*.03,'#586447',false,7);}
 }

 // AMC's modern glazed complex rises behind its retained Empire façade.
 for(const f of B.facades.filter(f=>f.kind==='amc-glass')){
  const a=setup(f),w=f.width,b=f.bottom,h=f.height;glass.push(a.face(0,.045,b+h/2,w,h,{kind:1}));
  for(let x=-w/2+.15;x<w/2;x+=2.35){a.box(x,.22,b+h/2,.13,.35,h,'#9e3537');if(Math.round((x+w/2)/2.35)%4===0)a.box(x,.44,b+h/2,.37,.64,h,'#b6453b');}
  for(let z=b+1;z<b+h;z+=3.80)a.box(0,.20,z,w,.38,.16,'#a53c3a');
  for(const z of [b+.24,b+h-.3])a.box(0,.34,z,w,.62,.58,'#bd493e');
  for(let x=-w/2+.3;x<w/2;x+=9.4){
   for(let z=b+2;z<b+h-1;z+=3.8){mesh.tube(a.p(x,.56,z),a.p(Math.min(x+8.6,w/2),.56,Math.min(z+3.4,b+h-.5)),.065,'#b6584b');}
  }
 }
 const amc=setup(facade('amc-empire')),aw=facade('amc-empire').width,ax=amc.sx(67.6);
 brick.push(amc.face(0,.035,13.3,aw,26.1));stone.push(amc.face(0,.07,13.30,aw-1.6,26.1));
 amc.box(0,.27,.68,aw,.43,.94,'#53574f',true);
 for(const z of [5.65,6.06,22.62,23.50,24.3,25.10,26.15])amc.box(0,.34,z,aw,.63,z>24?.33:.24,'#beb19c');
 for(let x=-aw/2+.4;x<aw/2;x+=.47){amc.box(x,.62,24.64,.25,.58,.30,'#c2b59f');amc.box(x,.45,23.0,.17,.29,.25,'#968b78');}
 for(const x of [-9.4,9.4]){
  amc.box(x,.29,14.5,1.65,.41,16.2,'#b6a991');
  for(let z=6.5;z<22.5;z+=.57)amc.box(x,.51,z,1.60,.026,.026,'#756e61');
  for(let j=0;j<11;j++){const z=7.4+j*1.29;mesh.tube(amc.p(x,.61,z),amc.p(x,.73,z),.21,'#baae96',false,10);}
 }
 // Arched glass opening with concentric stone archivolts and carved leaves.
 const archX=ax,archZ=14.60,inner=6.62;
 glass.push(amc.face(archX,.34,11.48,12.83,12.18,{kind:2}));
 for(let i=0;i<44;i++){
  const t=i/44*Math.PI,tt=(i+1)/44*Math.PI;
  // Curved window's upper fan occupies the real arch outline.
  const c=amc.p(archX,.341,archZ),p=amc.p(archX+Math.cos(t)*inner,.341,archZ+Math.sin(t)*inner),q=amc.p(archX+Math.cos(tt)*inner,.341,archZ+Math.sin(tt)*inner);
  mesh.emit([c,p,q],[[0,1,2]],'#243b3e');
  for(const rad of [6.75,7.01,7.30,7.57])mesh.tube(amc.p(archX+Math.cos(t)*rad,.59,archZ+Math.sin(t)*rad),amc.p(archX+Math.cos(tt)*rad,.59,archZ+Math.sin(tt)*rad),.074,'#c1b29a',false,6);
  if(i%2===0){const rad=7.23,xx=archX+Math.cos(t)*rad,zz=archZ+Math.sin(t)*rad;mesh.tube(amc.p(xx,.66,zz-.08),amc.p(xx,.84,zz+.08),.13,'#cabba0',false,8);}
 }
 for(const x of [-6.6,6.6])for(const dx of [-.16,.14])amc.box(archX+x+dx,.57,10.10,.10,.32,9.15,'#bfb29b');
 for(let x=archX-5.8;x<archX+6.0;x+=1.65){const cap=archZ+Math.sqrt(Math.max(0,inner*inner-(x-archX)**2));amc.box(x,.47,(5.4+cap)/2,.10,.25,cap-5.4,'#9b8e70');}
 for(const z of [9.0,12.0,14.58,17.0])amc.box(archX,.48,z,12.55,.25,.11,'#a89774');
 for(const x of [-7.8,0,7.8]){mesh.tube(amc.p(x,.46,22.79),amc.p(x,.68,22.79),.59,'#a4977f',false,20);mesh.tube(amc.p(x,.72,22.8),amc.p(x,.89,22.8),.25,'#d0bfa1',false,14);}
 entry(amc,ax,13.15,4.8,'#a88753');canopy(amc,ax,16.1,3.65,5.17,'amc-marquee');
 label(amc,ax,3.80,6.43,15.9,2.58,'amc-logo',.91);
 label(amc,ax,3.80,4.84,11.0,.39,'dolby',.80);
 // Two illuminated faces on the projecting vertical EMPIRE blade.
 const bladeX=9.65,bladeY=1.75,bladeZ=17.74;
 amc.box(bladeX,bladeY,bladeZ,.43,3.0,14.50,'#242a28');
 for(const side of [-1,1]){
  const normal=amc.r.clone().multiplyScalar(side),right=new Vector3(-normal.y,normal.x,0),center=amc.p(bladeX+side*.231,bladeY,bladeZ);
  labels.push({center,normal,right,width:2.82,height:14.34,kind:'empire-blade',shade:.91});
  for(const yy of [bladeY-1.44,bladeY+1.44])for(let z=10.68;z<24.9;z+=.27)light.tube(amc.p(bladeX+side*.24,yy,z),amc.p(bladeX+side*.27,yy,z),.035,'#e4d99d',false,6);
 }
 label(amc,0,.83,25.25,aw-1.6,1.05,'cinema-banner',.57);
 for(const x of [-8.5,8.5])screen(amc,x,.59,2.90,1.64,3.48,x<0?0:5);

 const ac=setup(facade('amc-glass'));screen(ac,0,.97,22.25,17.5,10.75,0,true);label(ac,0,1.0,14.8,17.9,1.75,'cinema-banner',.60);entry(ac,0,14.8,5.1,'#6b7d7d');

 // North curb: brick storefront block, Regal's fluted stone pilasters and
 // projecting orange marquee, then the billboard-covered eastern frontage.
 for(const f of B.facades.filter(f=>['shops','regal','regal-east'].includes(f.kind))){
  const a=setup(f),w=f.width;brick.push(a.face(0,.035,16.2,w,32.1));
  for(const z of [5.6,12.5,31.6,32.25])a.box(0,.21,z,w,.38,.27,'#b7ae97');
  for(let x=-w/2+1.9;x<w/2;x+=7.2){
   glass.push(a.face(x,.09,18.3,4.65,25.2,{kind:2}));
   for(const dx of [-2.40,2.40])a.box(x+dx,.16,18.3,.17,.25,25.4,'#71817d');
   for(let z=7.5;z<31;z+=2.8)a.box(x,.19,z,4.85,.31,.19,'#929d91');
  }
 }
 const regal=setup(facade('regal')),rx=regal.sx(73.2);
 for(const s of [69.6,80.5,103.5]){
  const x=regal.sx(s);regal.box(x,.29,19.2,1.83,.46,25.0,'#bfb096');
  for(let dx=-.70;dx<=.70;dx+=.115)regal.box(x+dx,.58,19.25,.045,.10,23.4,'#897f6d');
  for(const z of [6.8,7.14,30.85,31.40])regal.box(x,.55,z,2.28,.90,.28,'#c9baa0');
  for(let k=0;k<12;k++){const z=8.3+k*1.9;regal.box(x+.84,.60,z,.32,.61,.28,'#aa9d88');}
 }
 entry(regal,rx,7.9,4.8,'#63767a');canopy(regal,rx,11.35,3.58,12.68,'regal');
 screen(regal,rx,1.29,8.46,4.80,6.40,5);screen(regal,rx,.84,21.5,4.76,16.3,0);
 // A red vertical header preserves the tall REGAL silhouette above the ad.
 regal.box(rx,.98,25.78,4.98,.37,12.76,'#8c292a');label(regal,rx,1.176,25.78,4.80,12.61,'regal-vertical',.83);
 label(regal,rx-3.15,.56,4.84,3.20,.62,'westin',.56);label(regal,rx+1.7,.52,4.20,3.8,.48,'formats',.65);
 screen(regal,regal.sx(94.2),.90,22.1,18.1,12.0,3,true);
 const shops=[{station:58.7,width:8.1,kind:'five-guys'},{station:65.1,width:4.0,kind:'gifts'},{station:94.3,width:14.2,kind:'bbq'}];
 for(const shop of shops){const x=regal.sx(shop.station);entry(regal,x,shop.width-.35,4.40,shop.kind==='five-guys'?'#b74439':'#9da690');regal.box(x,.5,5.02,shop.width,.79,1.03,shop.kind==='five-guys'?'#8e3631':'#576771');label(regal,x,.908,5.02,shop.width-.1,.92,shop.kind,.78);
  if(shop.kind==='five-guys'){for(let u=-shop.width/2+.12;u<shop.width/2;u+=.24)light.tube(regal.p(x+u,.95,4.53),regal.p(x+u,.99,4.53),.021,'#dcc9a0',false,6);}
 }
 const bx=regal.sx(102.1);regal.box(bx,.69,7.78,1.30,1.13,5.96,'#243853');label(regal,bx,1.273,7.78,1.17,5.78,'bbq-blade',.88);
 const re=setup(facade('regal-east'));screen(re,re.sx(116.8),.75,18.1,7.4,27.9,7);screen(re,re.sx(129.0),.60,17.8,6.1,15.1,6);
 const rw=setup(facade('regal-west'));label(rw,rw.sx(36.0),.31,8.0,21.0,4.40,'live-new-york',.59);entry(rw,rw.sx(37),15.8,4.7,'#8c9d98');

 // Continuous pavement uses the actual wall at each section. The road edge
 // remains straight; AMC's recessed historic front receives a deeper apron.
 for(const f of B.facades.filter(f=>f.bottom<1&&!f.id.includes('west')&&!f.id.includes('corner')&&f.start!==undefined)){
  if(f.kind==='eleven'&&f.id!=='eleven-north-podium'&&f.id!=='eleven-link')continue;
  const a=setup(f),side=a.n.dot(NORTH)>0?-1:1;
  for(let s=f.start;s<f.end;s+=2.8){const ss=Math.min(f.end,s+2.8),a0=a.at(s,.23,.176),b0=a.at(ss,.23,.176),a1=cinemaStreetPoint(s,side*B.street.curb,.176),b1=cinemaStreetPoint(ss,side*B.street.curb,.176);
   paving.quad(a0,b0,b1,a1,'#87918f',true);paving.quad(a1.clone().setZ(0),b1.clone().setZ(0),b1,a1,'#637176',true);mesh.tube(a0.clone().setZ(.183),a1.clone().setZ(.183),.009,'#526164',false,4);
  }
 }
 // The west shop section has a street-facing name containing "west".
 for(let s=19.1;s<54.3;s+=2.8){const t=Math.min(54.3,s+2.8),a=rw.at(s,.24,.176),b=rw.at(t,.24,.176),c=cinemaStreetPoint(t,12.1,.176),d=cinemaStreetPoint(s,12.1,.176);paving.quad(a,b,c,d,'#87918f',true);paving.quad(d.clone().setZ(0),c.clone().setZ(0),c,d,'#637176',true);}
 // A continuous walking strip bridges the gaps between independently fitted
 // façade sections; narrow cracks must not catch the player capsule.
 for(const side of [-1,1])paving.quad(cinemaStreetPoint(19.1,side*12.1,.178),cinemaStreetPoint(134,side*12.1,.178),cinemaStreetPoint(134,side*14.55,.178),cinemaStreetPoint(19.1,side*14.55,.178),'#87918f',true);
 // Bus-lane paint follows W42, with unchanged centerline and crossing positions.
 for(const side of [-1,1]){
  paving.quad(cinemaStreetPoint(25,side*7.0,.039),cinemaStreetPoint(134,side*7.0,.039),cinemaStreetPoint(134,side*11.9,.039),cinemaStreetPoint(25,side*11.9,.039),'#763d3e');
  const forward=EAST.clone().multiplyScalar(-side),right=new Vector3(forward.y,-forward.x,0);
  for(const s of [47,111])labels.push({center:cinemaStreetPoint(s,side*9.0,.048),normal:UP,right,up:forward,width:2.3,height:4.8,kind:'bus-only',shade:.43});
 }
 // Reference concrete blocks sit on the curb; gaps preserve every entrance.
 for(const side of [-1,1])for(let s=29;s<133;s+=3.1){
  const entries=side===1?[37,58.7,65.1,73.2,94.3]:[28,49.5,67.6,89,109.5,123.2];if(entries.some(x=>Math.abs(s-x)<1.65))continue;
  const p=cinemaStreetPoint(s,side*12.56,.176),n=NORTH.clone().multiplyScalar(-side),r=new Vector3(-n.y,n.x,0),phase=Math.round(s/3.1)%3,color=['#a43e36','#235b8c','#a3aaa4'][phase],at=(x,y,z)=>p.clone().addScaledVector(r,x).addScaledVector(n,y).addScaledVector(UP,z);
  mesh.box(at(0,0,.45),r,n,2.08,.71,.88,color,true);
  // Slightly chamfered cap and lifting sockets make these street barriers,
  // not small untextured blocks standing in for buildings.
  mesh.box(at(0,0,.914),r,n,1.98,.63,.048,color);for(const x of [-.70,.70])mesh.box(at(x,.360,.48),r,n,.18,.012,.092,'#364b53');
  labels.push({center:at(0,.369,.49),normal:n,right:r,width:1.78,height:.145,kind:'barrier',shade:.58});barriers.push({position:p,normal:n,right:r,width:2.08,depth:.71,height:.94});
 }
 routes.push({id:'north-sidewalk',points:[cinemaStreetPoint(22,13.65),cinemaStreetPoint(133,13.65)]},{id:'south-sidewalk',points:[cinemaStreetPoint(25,-13.75),cinemaStreetPoint(129,-13.75)]},{id:'street',points:[cinemaStreetPoint(21,0,.04),cinemaStreetPoint(133,0,.04)]});
 return {batches:mesh.batches,emissive:light.batches,paving:paving.batches,glass,stone,brick,labels,posters,landscape,pools,barriers,doors,routes,night,collision:new Float32Array([...mesh.collision,...paving.collision])};
}
