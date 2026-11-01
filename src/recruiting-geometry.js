import {Vector3} from 'three';
import {FontLoader} from 'three/addons/loaders/FontLoader.js';
import {TextGeometry} from 'three/addons/geometries/TextGeometry.js';
import fontData from 'three/examples/fonts/helvetiker_regular.typeface.json' with {type:'json'};
import {DetailMesh} from './detail-mesh.js';
import {steelCylinder} from './curb-bollard-geometry.js';
import {RECRUITING_STATION as STATION} from './recruiting-config.js';

const UP=new Vector3(0,0,1),font=new FontLoader().parse(fontData);
const face=(center,normal,right,width,height,extra={})=>({center,normal,right,width,height,...extra});
function letters(mesh,p,text,z,width,height){
 const g=new TextGeometry(text,{font,size:1,depth:.10,curveSegments:2});g.computeBoundingBox();
 const b=g.boundingBox,scale=Math.min(width/(b.max.x-b.min.x),height/(b.max.y-b.min.y)),w=(b.max.x-b.min.x)*scale;
 const a=g.attributes.position;
 for(let i=0;i<a.count;i+=3)mesh.emit([0,1,2].map(j=>p((a.getX(i+j)-b.min.x)*scale-w/2,.091+a.getZ(i+j)*.42,z+(a.getY(i+j)-b.min.y)*scale)),[[0,1,2]],'#c2cccb');
 g.dispose();
}

export function createRecruitingGeometry(){
 const mesh=new DetailMesh(),emissive=new DetailMesh(),shadow=new DetailMesh(),flags=[],panels=[],glass=[],labels=[],pools=[],posts=[];
 const height=STATION.height,grade=STATION.grade;
 for(const f of STATION.facades){
  const c=new Vector3(...f.center),n=new Vector3(...f.normal),r=new Vector3(-n.y,n.x,0),w=f.width;
  const p=(x,y,z)=>c.clone().addScaledVector(r,x).addScaledVector(n,y).setZ(z);
  const box=(x,y,z,dx,dy,dz,color,solid=false)=>mesh.box(p(x,y,z),r,n,dx,dy,dz,color,solid);
  // Thin closed walls follow the four OSM corners exactly. There is no new
  // city tile, footprint displacement, or generalized substitute building.
  mesh.quad(p(-w/2,0,grade),p(w/2,0,grade),p(w/2,0,height),p(-w/2,0,height),'#697780',true);
  for(const x of [-w/2+.045,w/2-.045]){
   box(x,.040,(height+grade)/2,.09,.10,height-grade,'#96a2a5');
   box(x+.025,.094,(height+grade)/2,.016,.014,height-grade,'#c6cecb');
  }
  // Brushed sill, folded fascia, drip edge, roof cap and panel reveals.
  box(0,.045,.34,w,.12,.35,'#5b6b73',true);
  box(0,.058,.54,w,.145,.052,'#c0c8c5');
  box(0,.06,height-.12,w+.15,.19,.25,'#89989e',true);
  box(0,.073,height+.015,w+.18,.22,.045,'#b2bdbd');
  box(0,.11,height-.285,w,.045,.06,'#273844');
  if(w>8){
   // The luminous flags are integrated into a mullioned glass wall on BOTH
   // long elevations, as in the ARO pavilion, rather than a rooftop ad.
   const fw=w-.20,low=1.23,top=height-.42;
   box(0,.039,(low+top)/2,fw,.07,top-low,'#111e2a');
   flags.push(face(p(0,.081,(low+top)/2),n,r,fw,top-low));
   for(let i=0;i<=8;i++)box(-fw/2+i*fw/8,.115,(low+top)/2,.038,.075,top-low,'#27343c');
   for(const z of [low,(low+top)/2,top])box(0,.119,z,fw,.073,.038,'#64737a');
   for(let i=0;i<8;i++){
    const x=-fw/2+(i+.5)*fw/8;
    glass.push(face(p(x,.067,.85),n,r,fw/8-.065,.53,{kind:'lower'}));
    box(x-fw/16,.091,.85,.032,.055,.59,'#9ba8aa');
   }
   pools.push(face(p(0,1.3,.183),UP,r,w+2.5,5.8,{up:n,kind:f.id==='east'?0:1}));
  }else{
   panels.push(face(p(0,.061,(height+.55)/2),n,r,w-.16,height-.69));
   for(const z of [1.14,2.03,2.92,3.81,4.70])box(0,.075,z,w-.16,.023,.014,'#839197');
   letters(mesh,p,'ARMED FORCES',4.40,w-.34,.30);
   letters(mesh,p,'RECRUITING STATION',3.99,w-.32,.20);
   if(f.id==='south'){
    for(let i=0;i<4;i++)labels.push(face(p((i-1.5)*.79,.116,3.17),n,r,.57,.57,{kind:'seal',index:i}));
    labels.push(face(p(0,.124,2.25),n,r,w-.58,.79,{kind:'services'}));
    box(0,.17,2.76,w-.6,.28,.047,'#556873');
    emissive.box(p(0,.19,2.73),r,n,w-.86,.14,.012,'#dce5dc');
   }else{
    // Closed north entrance at the mapped OSM entrance node. Only exterior
    // architecture is playable; there is no interior or recruiting system.
    const entrance=new Vector3(...STATION.entrance),ex=entrance.sub(c).dot(r),doorW=1.7;
    box(ex,.089,1.61,doorW+.17,.13,2.95,'#354651',true);
    for(const dx of [-.43,.43]){
     glass.push(face(p(ex+dx,.17,1.74),n,r,.72,2.30,{kind:'door'}));
     box(ex+dx,.185,.49,.76,.044,.30,'#71858e');
     mesh.tube(p(ex+dx-Math.sign(dx)*.26,.25,1.05),p(ex+dx-Math.sign(dx)*.26,.25,1.65),.021,'#c5cdcb');
    }
    for(const dx of [-.88,0,.88])box(ex+dx,.19,1.62,.034,.070,2.95,'#a0b0b4');
    box(ex,.22,3.12,doorW+.21,.48,.095,'#5f737d');
    emissive.box(p(ex,.27,3.064),r,n,1.28,.12,.025,'#c9dcdc');
    labels.push(face(p(ex,.18,3.43),n,r,w-.50,.44,{kind:'services'}));
    labels.push(face(p(ex,.214,2.19),n,r,1.17,.32,{kind:'address'}));
    box(w/2-.24,.125,1.36,.13,.07,.22,'#344b5b');
   }
  }
 }
 const corners=STATION.footprint.map(a=>new Vector3(...a).setZ(height));
 mesh.quad(...corners,'#48565e',true);
 const c=new Vector3(...STATION.center),north=new Vector3(...STATION.facades.find(f=>f.id==='north').normal),right=new Vector3(-north.y,north.x,0);
 mesh.box(c.clone().addScaledVector(north,-2.5).setZ(height+.13),right,north,1.32,1.55,.24,'#52636d',true);
 for(let i=-5;i<=5;i++)mesh.box(c.clone().addScaledVector(north,-2.5+i*.12).setZ(height+.259),right,north,1.13,.035,.018,'#273b49');
 for(const post of STATION.posts){const p=new Vector3(...post.position),n=new Vector3(...post.normal);steelCylinder(mesh,p,n);posts.push({position:p,normal:n});}
 const night={frontNormal:STATION.facades.find(f=>f.id==='east').normal,lights:STATION.facades.filter(f=>f.width>8).map(f=>({position:[f.center[0],f.center[1],3.1],radius:[8,8,5],color:[.115,.125,.16]}))};
 // Small contact shadows ground the protected perimeter without shadow maps.
 for(const post of posts){const p=post.position.clone().setZ(post.position.z+.009);const vs=[p];for(let i=0;i<20;i++)vs.push(p.clone().add(new Vector3(Math.cos(i*Math.PI/10)*.28,Math.sin(i*Math.PI/10)*.28,0)));for(let i=0;i<20;i++)shadow.emit(vs,[[0,1+i,1+(i+1)%20]],'#050a132c');}
 return {batches:mesh.batches,emissive:emissive.batches,shadow:shadow.batches,collision:new Float32Array(mesh.collision),flags,panels,glass,labels,pools,posts,night};
}
