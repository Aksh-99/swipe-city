import {Vector3} from 'three';
import {DetailMesh} from './detail-mesh.js';
import {addScaffoldGeometry} from './streetscape-geometry.js';
import {steelCylinder} from './curb-bollard-geometry.js';
import {SUBWAY_ENTRANCES} from './streetscape-config.js';
import {SOUTH42_TRANSIT as B} from './south42-transit-config.js';
const UP=new Vector3(0,0,1);
export function south42Axes(f){
 const c=new Vector3(...f.center),n=new Vector3(...f.normal),r=new Vector3(-n.y,n.x,0);
 return {c,n,r,p:(x,y,z)=>c.clone().addScaledVector(r,x).addScaledVector(n,y).setZ(z)};
}
export function createSouth42TransitGeometry(){
 const mesh=new DetailMesh(),light=new DetailMesh(),paving=new DetailMesh(SUBWAY_ENTRANCES);
 const glass=[],labels=[],posters=[],wideAds=[],stripeScreens=[],pools=[],bollards=[],doors=[],routes=[],canopies=[],portalFacades=B.facades,scaffolds=B.scaffolds;
 const night={frontNormal:B.facades[0].normal,lights:[]};
 const setup=f=>{const a=south42Axes(f);return {...a,box:(x,y,z,w,d,h,color,solid=false)=>mesh.box(a.p(x,y,z),a.r,a.n,w,d,h,color,solid),face:(x,y,z,w,h,extra={})=>({center:a.p(x,y,z),normal:a.n,right:a.r,width:w,height:h,...extra})};};
 const label=(a,x,y,z,w,h,kind,shade=.78)=>labels.push(a.face(x,y,z,w,h,{kind,shade}));
 function poster(a,x,y,bottom,width,height,ad,wide=false){
  a.box(x,y-.1,bottom+height/2,width+.24,.22,height+.26,'#16242c');
  (wide?wideAds:posters).push(a.face(x,y+.019,bottom+height/2,width,height,{ad}));
  for(const edge of [-1,1])a.box(x+edge*(width+.16)/2,y-.06,bottom+height/2,.10,.25,height+.4,'#627274');
  for(const z of [bottom-.12,bottom+height+.13])a.box(x,y-.04,z,width+.34,.29,.09,'#718080');
 }
 for(const [index,f]of B.facades.entries()){
  const a=setup(f),w=f.width,half=w/2,canopyDepth=2.02;
  // The red frame is a thin finish on the original NYC walls, not a new
  // pavilion footprint. Glazed station/shop bays retain the reference grid.
  a.box(0,.14,.36,w,.28,.36,'#ac333d',true);
  a.box(0,.10,2.73,w,.18,4.94,null,true);
  glass.push(a.face(0,.218,2.77,w-.12,4.91));
  const bays=Math.max(3,Math.round(w/2.38)),bay=w/bays;
  for(let i=0;i<=bays;i++){
   const x=-half+i*bay;a.box(x,.35,2.87,.135,.27,5.25,'#bd3b46');
   a.box(x+.041,.495,2.85,.018,.014,5.18,'#d78072');
  }
  for(const z of [.23,1.13,3.18,4.33,5.33])a.box(0,.36,z,w,.27,.105,'#b83440');
  for(let i=0;i<bays;i++){
   const x=-half+(i+.5)*bay;
   if(i%4===1)label(a,x,.39,2.10,bay*.61,1.68,'info',.58);
   if(i%3===0){a.box(x,.29,2.29,bay*.80,.10,3.93,'#9eacaa');glass.push(a.face(x,.352,2.31,bay*.74,3.79));}
  }
  const entryX=f.entryX??0,entryW=Math.min(5.55,w*.42);
  for(const x of [-entryW/2,0,entryW/2])a.box(entryX+x,.46,1.85,.10,.21,3.31,'#d34149');
  for(const z of [.27,3.45])a.box(entryX,.45,z,entryW,.21,.105,'#dc5354');
  for(const x of [-entryW*.24,entryW*.24])for(const d of [-.12,.12])mesh.tube(a.p(entryX+x+d,.57,1.12),a.p(entryX+x+d,.57,1.99),.021,'#cfb58e');
  label(a,entryX,.58,3.87,entryW,.43,'entry',.77);
  doors.push({position:a.p(entryX,.47,.18),normal:a.n,facade:f.id});
  // Corrugated stainless roof with a smoothly undulating edge and two red
  // neon outlines. Only the canopy profile curves; surveyed walls stay flat.
  const wave=x=>5.58+.27*Math.sin((x/w+.5)*Math.PI*2*Math.max(1,Math.round(w/7.1)));
  for(let x=-half;x<half-.001;x+=.19){
   const t=Math.min(half,x+.19),z=wave(x),zz=wave(t),p=a.p;
   mesh.quad(p(x,.12,z),p(t,.12,zz),p(t,canopyDepth,zz),p(x,canopyDepth,z),'#9a9e98',true);
   mesh.quad(p(x,.12,z+.18),p(x,canopyDepth,z+.18),p(t,canopyDepth,zz+.18),p(t,.12,zz+.18),'#59696c',true);
   mesh.quad(p(x,canopyDepth,z),p(t,canopyDepth,zz),p(t,canopyDepth,zz+.18),p(x,canopyDepth,z+.18),'#872c3c',true);
   for(const rise of [.035,.168])light.tube(p(x,canopyDepth+.032,z+rise),p(t,canopyDepth+.032,zz+rise),.031,'#ed3b62',false,6);
   mesh.tube(p(x,.20,z-.016),p(x,canopyDepth-.055,z-.016),.011,'#5f7277',false,4);
  }
  label(a,Math.max(-half+4,Math.min(half-4,entryX)),canopyDepth-.24,6.75,Math.min(8.1,w*.62),1.58,'subway',.94);
  const routeX=entryX+(entryX>0?-1:1)*Math.min(w*.27,7.6),routeW=Math.min(7.1,w*.37);
  label(a,Math.max(-half+routeW/2+.1,Math.min(half-routeW/2-.1,routeX)),canopyDepth-.08,6.12,routeW,.66,'routes',.85);
  for(let x=-half+.60;x<half;x+=2.9){mesh.tube(a.p(x,.25,7.60),a.p(x,1.6,7.60),.036,'#727e7d');mesh.tube(a.p(x,1.6,7.60),a.p(x,.27,8.13),.026,'#7c8682');a.box(x,1.38,7.81,.46,.51,.27,'#687477');light.box(a.p(x,1.30,7.92),a.r,a.n,.34,.29,.037,'#cec4a1');}
  // Billboard maintenance catwalk and exposed triangular steel trusses.
  a.box(0,.96,7.58,w,1.49,.12,'#303d43',true);
  for(const z of [7.85,8.51])mesh.tube(a.p(-half,1.65,z),a.p(half,1.65,z),.027,'#617075');
  for(let x=-half;x<=half+.01;x+=w/Math.ceil(w/2.8))mesh.tube(a.p(x,1.65,7.62),a.p(x,1.65,8.56),.027,'#667a7d');
  if(w>18){
   const panelW=(w-.75)/2;poster(a,-w/4,.78,8.75,panelW,Math.min(27.3,f.height-9.1),index%2?5:0);poster(a,w/4,.78,8.75,panelW,Math.min(27.3,f.height-9.1),index%2?6:5);
  }else poster(a,0,.78,8.75,w-.5,Math.min(25.2,f.height-9.1),index%2?7:0);
  label(a,0,1.74,8.03,3.5,.49,'credit',.60);
  pools.push({center:a.p(entryX,2.7,.188),normal:UP,right:a.r,up:a.n,width:8,height:4.3});
  night.lights.push({position:a.p(entryX,2.1,6.5).toArray(),radius:[12,12,11],color:[.14,.073,.036]});
  // Bounded pavement aprons are clipped by the unchanged MTA stair holes.
  paving.quad(a.p(-half,.01,.176),a.p(half,.01,.176),a.p(half,4.8,.176),a.p(-half,4.8,.176),'#8e9894',true);
  routes.push({id:f.id+'-walkway',points:[a.p(-half+.8,2.85,.18),a.p(half-.8,2.85,.18)]});
  canopies.push({facade:f.id,position:a.p(entryX,1.1,.18),normal:a.n,underside:5.25});
 }
 // A quarter-round overhang joins the two perpendicular facades at their
 // actual corner. This is canopy metal only, with no added building volume.
 const c=new Vector3(...B.corner),ns=B.facades.slice(0,2).map(f=>new Vector3(...f.normal));
 let start=Math.atan2(ns[0].y,ns[0].x),end=Math.atan2(ns[1].y,ns[1].x);while(end<start)end+=2*Math.PI;
 if(end-start<Math.PI){
  const pt=(a,r,z)=>c.clone().add(new Vector3(Math.cos(a)*r,Math.sin(a)*r,z));
  for(let i=0;i<16;i++){const a=start+(end-start)*i/16,b=start+(end-start)*(i+1)/16;
   mesh.emit([c.clone().setZ(5.58),pt(a,2.2,5.58),pt(b,2.2,5.58)],[[0,1,2]],'#979c97',true);
   mesh.quad(pt(a,2.2,5.58),pt(b,2.2,5.58),pt(b,2.2,5.76),pt(a,2.2,5.76),'#862d3b',true);
   for(const z of [5.615,5.748])light.tube(pt(a,2.235,z),pt(b,2.235,z),.031,'#ed3b62',false,6);
   paving.emit([c.clone().setZ(.176),pt(a,5.0,.176),pt(b,5.0,.176)],[[0,1,2]],'#8e9894',true);
  }
  routes.push({id:'red-subway-corner',points:Array.from({length:17},(_,i)=>pt(start+(end-start)*i/16,3.0,.18))});
  const cn=ns[0].clone().add(ns[1]).normalize(),cr=new Vector3(-cn.y,cn.x,0);
  mesh.box(c.clone().addScaledVector(cn,.25).setZ(2.85),cr,cn,.26,.25,5.25,'#b93643',true);
 }
 for(const f of B.oneTimesFacades){
  const a=setup(f),w=f.width;
  glass.push(a.face(0,.035,5.95,w,11.2,{kind:1}));
  for(let x=-w/2+.2;x<w/2;x+=2.27){a.box(x,.15,6.0,.075,.22,11.35,'#577270');a.box(x,.22,3.0,.065,.28,5.6,'#30534b');}
  for(const z of [4.8,7.05,10.98])a.box(0,.24,z,w,.35,.14,'#58716d');
  a.box(0,.18,1.57,w,.20,2.95,'#254c43',true);
  for(let x=-w/2+.1;x<w/2;x+=2.5)a.box(x,.293,1.55,.02,.015,2.8,'#627a67');
  if(f.screen){
   a.box(0,.31,(11.8+f.height)/2,w,.44,f.height-11.8,'#1a2b32');stripeScreens.push(a.face(0,.55,(12.0+f.height-.20)/2,w-.2,f.height-12.2));
   a.box(0,.85,10.36,w,1.6,.22,'#2d444b',true);label(a,0,1.665,10.38,w-.15,.68,'ribbon',.81);
   for(const z of [10.03,10.76])light.tube(a.p(-w/2,1.685,z),a.p(w/2,1.685,z),.029,'#4368e7',false,6);
  }
 }
 for(const shed of scaffolds){
  const signs=[],glow=[];addScaffoldGeometry(mesh,shed,signs,glow);labels.push(...signs.map(f=>({...f,kind:'shed',shade:.60})));pools.push(...glow);
  const a=setup(shed),half=shed.length/2,w=shed.width/2;
  for(let x=-half;x<half-1.5;x+=3.2){const t=Math.min(half,x+3.2);mesh.tube(a.p(x,-w,.46),a.p(t,-w,3.18),.028,'#98a6a0');mesh.tube(a.p(x,-w,3.18),a.p(t,-w,.46),.028,'#95a19d');}
  for(let x=-half+1.5;x<half;x+=10.5)label(a,x,-w+.12,1.86,1.11,1.5,'notice',.59);
  routes.push({id:shed.id,points:[a.p(-half-.30,0,.18),a.p(half+.30,0,.18)]});
 }
 for(const p of B.bollards||[]){const position=new Vector3(...p.position),normal=new Vector3(...p.normal);steelCylinder(mesh,position,normal);bollards.push({position,normal});}
 // Construction barriers are outside the covered walkway, away from doors.
 for(const b of B.barriers||[]){const p=new Vector3(...b.center),r=new Vector3(...b.along),n=new Vector3(-r.y,r.x,0),at=(x,y,z)=>p.clone().addScaledVector(r,x).addScaledVector(n,y).setZ(p.z+z);
  mesh.box(at(0,0,.30),r,n,2.2,.56,.55,'#b85f40',true);mesh.box(at(0,0,.70),r,n,2.2,.24,.35,'#d67a50',true);
  for(const side of [-1,1])for(const x of [-.65,.65])mesh.box(at(x,side*.126,.74),r,n,.5,.018,.12,'#d4d4c5');
 }
 return {batches:mesh.batches,emissive:light.batches,paving:paving.batches,collision:new Float32Array([...mesh.collision,...paving.collision]),glass,labels,posters,wideAds,stripeScreens,pools,bollards,doors,routes,canopies,portalFacades,scaffolds,night};
}
