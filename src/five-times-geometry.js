import {Vector3} from 'three';
import {DetailMesh} from './detail-mesh.js';
import {steelCylinder} from './curb-bollard-geometry.js';
import {SUBWAY_ENTRANCES} from './streetscape-config.js';
import {FIVE_TIMES as B} from './five-times-config.js';
const UP=new Vector3(0,0,1);
export function fiveTimesAxes(f){const c=new Vector3(...f.center),n=new Vector3(...f.normal),r=new Vector3(-n.y,n.x,0);return {c,n,r,p:(x,y,z)=>c.clone().addScaledVector(r,x).addScaledVector(n,y).setZ(z)};}
export function createFiveTimesGeometry(){
 const mesh=new DetailMesh(),light=new DetailMesh(),paving=new DetailMesh([...SUBWAY_ENTRANCES,B.reservedPavingCutout]),glass=[],interiors=[],labels=[],posters=[],pools=[],screens=[],doors=[],bollards=[],barriers=[],routes=[],meshPanels=[];
 const night={frontNormal:B.facades.at(-1).normal,lights:[]};
 const setup=f=>{const a=fiveTimesAxes(f);return {...a,box:(x,y,z,w,d,h,color,solid=false)=>mesh.box(a.p(x,y,z),a.r,a.n,w,d,h,color,solid),face:(x,y,z,w,h,extra={})=>({center:a.p(x,y,z),normal:a.n,right:a.r,width:w,height:h,...extra})};};
 const label=(a,x,y,z,w,h,kind,shade=.70,extra={})=>labels.push(a.face(x,y,z,w,h,{kind,shade,...extra}));
 for(const f of B.facades){
  const a=setup(f),w=f.width,top=f.bottom+f.height,isTower=f.role==='tower',h=Math.min(4.55,top-.8);
  glass.push(a.face(0,.02,(f.bottom+top)/2,w,f.height));
  // Slim facade finishes follow each historical mesh plane and roof height.
  const spacing=isTower?1.50:2.65;
  for(let x=-w/2+.10;x<w/2;x+=spacing)a.box(x,.105,(f.bottom+top)/2,isTower?.055:.14,.12,f.height,isTower?'#61747a':'#7a8076');
  for(let z=6.4;z<top-.1;z+=isTower?3.5:3.3)a.box(0,.12,z,w,.19,isTower?.12:.24,isTower?'#9aa5a3':'#8c8d7b');
  a.box(0,.20,top-.10,w,.32,.18,isTower?'#829697':'#929588');
  // Red illuminated retail windows are exterior display surfaces. Original
  // closed city walls remain physical, and no shop interior is fabricated.
  a.box(0,.15,2.42,w,.20,4.50,null,true);
  const bays=Math.max(1,Math.round(w/3.15)),bw=w/bays;
  for(let i=0;i<bays;i++){
   const x=-w/2+(i+.5)*bw;
   if(isTower)label(a,x,.273,h/2+.24,bw-.12,h-.12,'window',.62);
   else interiors.push(a.face(x,.273,h/2+.24,bw-.12,h-.12,{cell:i%3}));
   a.box(x-bw/2,.33,h/2+.22,.13,.24,h+.03,'#748081');
  }
  for(const z of [.24,h+.29])a.box(0,.35,z,w,.25,.15,'#8d9590');
  if(isTower){
   for(const x of [-w*.28,w*.25])if(w>12){label(a,x,.46,4.13,Math.min(3.25,w*.20),.52,'logo',.78);light.box(a.p(x,.51,3.83),a.r,a.n,Math.min(3.2,w*.20),.08,.06,'#df4353');}
   if(f.id==='five-times-w42-corner'||f.id==='five-times-seventh')label(a,f.id==='five-times-seventh'?w/2-2.2:-w/2+2.2,.47,2.10,.46,3.30,'blade',.72);
   night.lights.push({position:a.p(0,2.0,4.9).toArray(),radius:[20,20,9],color:[.10,.035,.065]});
  }
  const entryX=f.entryX??0;
  if(w>5){
   a.box(entryX,.36,1.90,2.30,.16,3.40,null,true);
   for(const dx of [-1.15,0,1.15])a.box(entryX+dx,.41,1.87,.095,.17,3.30,'#a1aaa2');
   for(const dx of [-.52,.52])mesh.tube(a.p(entryX+dx,.54,1.18),a.p(entryX+dx,.54,1.95),.025,'#bfbdad');
   doors.push({position:a.p(entryX,.43,.18),normal:a.n,facade:f.id});
  }
  // Aprons respect existing subway apertures and stay near the source wall.
  paving.quad(a.p(-w/2,.01,.176),a.p(w/2,.01,.176),a.p(w/2,4.35,.176),a.p(-w/2,4.35,.176),'#929b97',true);
 }
 for(const s of B.screens){
  const f=B.facades.find(f=>f.id===s.facade),a=setup(f),top=s.bottom+s.height;
  a.box(s.x,.52,s.bottom+s.height/2,s.width+.17,.40,s.height+.17,'#182b3a');
  const corners=[a.p(s.x-s.width/2,.741,s.bottom),a.p(s.x+s.width/2,.741,s.bottom),a.p(s.x+s.width/2,.741,top-(s.rightDrop||0)),a.p(s.x-s.width/2,.741,top-(s.leftDrop||0))];
  if(s.join){
   // Intersect the two offset sign planes so the wrap is continuous across
   // the real sharp corner. Only the projecting sign skin joins here.
   const [nx,ny]=B.corner.northNormal,[ex,ey]=B.corner.eastNormal,d=nx*ey-ny*ex,offset=.16+.741;
   const j=new Vector3(...B.corner.world).add(new Vector3(offset*(ey-ny)/d,offset*(nx-ex)/d,0));
   for(const i of s.join==='left'?[0,3]:[1,2]){corners[i].x=j.x;corners[i].y=j.y;}
  }
  const detail=a.face(s.x,.741,s.bottom+s.height/2,s.width,s.height,{kind:s.kind,shade:s.kind==='tower'?.80:.74,corners,uvRange:s.uvRange});
  labels.push(detail);screens.push(detail);
  for(const [lo,hi]of [[0,3],[1,2]])mesh.tube(corners[lo],corners[hi],.045,'#586d76');
  for(let x=s.x-s.width/2+.5;x<s.x+s.width/2;x+=3.1){mesh.tube(a.p(x,.06,s.bottom-.26),a.p(x,1.10,s.bottom-.26),.045,'#72817f');a.box(x,.94,s.bottom-.15,.34,.37,.17,'#52676e');}
 }
 for(const s of B.neighborAds||[]){
  const a=setup(B.facades.find(f=>f.id===s.facade));a.box(s.x,.53,s.bottom+s.height/2,s.width+.20,.34,s.height+.22,'#293b45');
  posters.push(a.face(s.x,.716,s.bottom+s.height/2,s.width,s.height,{ad:s.ad}));
 }
 for(const s of [...B.scaffolds,...B.bridges]){
  const a={c:new Vector3(...s.center),n:new Vector3(...s.normal),r:new Vector3(...s.along)};a.p=(x,y,z)=>a.c.clone().addScaledVector(a.r,x).addScaledVector(a.n,y).setZ(z);
  const half=s.length/2,w=s.width/2,roof=s.height,grade=s.grade??.17,box=(x,y,z,dx,dy,dz,color,solid=false)=>mesh.box(a.p(x,y,z),a.r,a.n,dx,dy,dz,color,solid);
  // The reference uses substantial steel I-beams and framed mesh above the
  // deck; the full walking width beneath is kept clear of diagonal braces.
  box(0,0,roof+.13,s.length,s.width,.26,'#475853',true);
  for(const y of [-w,w]){box(0,y,roof-.14,s.length,.18,.44,'#717d7b',true);for(const z of [roof-.37,roof+.08])box(0,y,z,s.length,.34,.075,'#8c9690');}
  const count=Math.ceil(s.length/3.25);
  for(let i=0;i<=count&&!s.noPosts;i++){
   const x=-half+i*s.length/count;
   for(const y of [-w,w]){
    box(x,y,grade+.035,.39,.37,.07,'#939b90',true);box(x,y,(grade+roof)/2,.17,.19,roof-grade,'#87938d',true);
    for(const z of [grade+.7,roof-.65])box(x,y,z,.235,.24,.11,'#5d716f');
    for(const d of [-1,1])if(i+(d>0?0:-1)>=0&&i+(d>0?1:0)<=count)mesh.tube(a.p(x,y,roof-1.22),a.p(x+d*.82,y,roof-.28),.040,'#a4afa6');
   }
   box(x,0,roof-.19,.14,s.width,.35,'#667a77');light.box(a.p(x,0,roof-.39),a.r,a.n,.11,1.55,.045,'#ddd5b8');
   pools.push({center:a.p(x,0,.188),normal:UP,right:a.r,up:a.n,width:4.5,height:5});
  }
  for(const y of [-w,w]){
   for(const z of [roof+.28,roof+1.32])mesh.tube(a.p(-half,y,z),a.p(half,y,z),.035,'#587669');
   for(let x=-half;x<=half+.01;x+=s.length/count)mesh.tube(a.p(x,y,roof+.25),a.p(x,y,roof+1.35),.035,'#729083');
   const n=a.n.clone().multiplyScalar(Math.sign(y)),r=new Vector3(-n.y,n.x,0);meshPanels.push({center:a.p(0,y,roof+.80),normal:n,right:r,width:s.length,height:1.0});
  }
  const right=new Vector3(-a.n.y,a.n.x,0);labels.push({center:a.p(0,w+.03,roof-.17),normal:a.n,right,width:Math.min(3.2,s.length*.62),height:.31,kind:'shed',shade:.62});
  routes.push({id:s.id,points:[a.p(-half+.55,0,.18),a.p(half-.55,0,.18)]});
 }
 for(const b of B.bollards||[]){const position=new Vector3(...b.position),normal=new Vector3(...b.normal);steelCylinder(mesh,position,normal);bollards.push({position,normal});}
 for(const b of B.barriers||[]){const c=new Vector3(...b.center),r=new Vector3(...b.along),n=new Vector3(-r.y,r.x,0);
  mesh.box(c.clone().addScaledVector(UP,.4),r,n,1.9,.62,.8,'#b8453f',true);mesh.box(c.clone().addScaledVector(UP,.84),r,n,1.7,.46,.12,'#ce5650');
  barriers.push({position:c,normal:n,depth:.62});
  for(const side of [-1,1]){const normal=n.clone().multiplyScalar(side);labels.push({center:c.clone().addScaledVector(UP,.44).addScaledVector(normal,.321),normal,right:new Vector3(-normal.y,normal.x,0),width:1.55,height:.18,kind:'barrier',shade:.60});}
 }
 for(const route of B.routes||[])routes.push({id:route.id,points:route.points.map(p=>new Vector3(...p))});
 return {batches:mesh.batches,paving:paving.batches,emissive:light.batches,glass,interiors,labels,posters,pools,meshPanels,screens,doors,bollards,barriers,routes,night,facades:B.facades,scaffolds:B.scaffolds,collision:new Float32Array([...mesh.collision,...paving.collision])};
}
