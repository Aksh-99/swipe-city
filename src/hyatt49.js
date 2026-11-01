import {replacementTree} from './game-tree-placements.js';
import{addHyatt49Street}from'./hyatt49-street.js';
import{Vector3}from'three';
import{Material}from'cesium';
import{DetailMesh}from'./detail-mesh.js';
import{addFaces,addBatches}from'./street-details.js';
import{WEST48 as W}from'./west48-config.js';
import{west48Local}from'./west48-config.js';
import{hyatt48SkinFaces}from'./hyatt48.js';
import{west48SignAtlas}from'./west48.js';
import{addVendorCart,addVendorUmbrella,vendorOval}from'./street-vendor-geometry.js';
const V=a=>new Vector3(...a);
// W49 north frontage and its Broadway return. The W48 doughnut corner is excluded.
export function createHyatt49(){
 const mesh=new DetailMesh(),glow=new DetailMesh(),shadow=new DetailMesh(),labels=[],glass=[],menus=[],cartLabels=[],screens=[],awnings=[],trees=[];
 const e=V(W.east),N=V(W.north),o=V(W.origin),at=(t,d,z)=>o.clone().addScaledVector(e,t).addScaledVector(N,d).setZ(z);
 const label=(center,normal,right,width,height,text,theme='letters')=>labels.push({center,normal,right,width,height,text,theme});
 const fronts=[{a:[144,149.65],b:[183,149.45],side:'north'},{a:[190.05,142.35],b:[194.0,114],side:'east'}];
 for(const f of fronts){
  const A=at(...f.a,0),B=at(...f.b,0),r=A.clone().sub(B).normalize(),n=new Vector3(r.y,-r.x,0),c=A.clone().lerp(B,.5),w=A.distanceTo(B),p=(x,y,z)=>c.clone().addScaledVector(r,x).addScaledVector(n,y).setZ(z),box=(x,y,z,dx,dy,dz,col,solid=false)=>mesh.box(p(x,y,z),r,n,dx,dy,dz,col,solid);
  box(0,-.05,5.15,w,.23,10.1,'#9a9382');
  for(let x=-w/2+1.15;x<w/2;x+=2.4){box(x,.11,2.45,2.10,.12,4.1,'#25373a');glass.push({center:p(x,.19,2.45),normal:n,right:r,width:1.95,height:3.85});box(x-1.15,.20,2.6,.19,.22,4.8,'#c0b9a3');for(const z of[1.0,3.35])box(x,.25,z,2.14,.08,.06,'#817e70');}
  box(0,.24,5.55,w,.22,1.48,'#252b2a');
  label(p(0,.38,5.55),n,r,w-1.0,1.0,f.side==='north'?'NYC GIFTS   I ♥ NY   LUGGAGE':'THE HARRISON  BRASSERIE & BAR');
  const span=f.side==='north'?w*.28:w*.9,offset=f.side==='north'?-w*.33:0;
  // Folded sloped awnings with narrow alternating charcoal and ivory stripes.
  for(let x=offset-span/2;x<offset+span/2;x+=.19){const dx=Math.min(.19,offset+span/2-x),col=Math.round((x-offset+span/2)/.19)%2?'#c7c4b5':'#333b38';mesh.quad(p(x,.37,4.70),p(x+dx,.37,4.70),p(x+dx,1.8,3.62),p(x,1.8,3.62),col);box(x+dx/2,1.79,3.49,dx,.08,.25,col);}
  awnings.push({side:f.side,width:span});
  if(f.side==='north')label(p(offset,.41,6.06),n,r,span,1.2,'THE HARRISON\nBRASSERIE & BAR','poster');
  else label(p(w*.32,.41,7.25),n,r,7.7,1.4,'PARKING →\nOPEN TO THE PUBLIC · 24 HOURS','dark');
  box(0,.28,9.4,w,.32,1.55,'#b13d38');label(p(0,.46,9.4),n,r,w-.4,1.05,'NYSC   New York Sports Clubs   on 15th Floor');
  // Bronze gridded Broadway Grill podium, above the advertising band.
  box(0,-.02,23.0,w,.2,9.1,'#6b6050');
  for(let x=-w/2+.5;x<w/2;x+=1.20){box(x,.17,23.0,.10,.22,9.1,'#b0a18b');for(let z=19.1;z<27.4;z+=1.16)box(x+.55,.13,z,1.0,.10,.87,'#3b4140');}
  box(0,.19,27.7,w,.28,.75,'#9a8c75');label(p(0,.36,27.7),n,r,w-1,.58,f.side==='east'?'BROADWAY GRILL':'HYATT REGENCY','letters');
 }
 // Continuous rounded advertising face: north, corner curve, Broadway return.
 const path=[[155,149.88],[182.7,149.73]];
 for(let j=1;j<=18;j++){const a=Math.PI/2-j*Math.PI/36;path.push([182.7+7.6*Math.cos(a),142.13+7.6*Math.sin(a)]);}
 path.push([193.1,122]);let total=0;const spans=[];
 for(let j=1;j<path.length;j++){const A=at(...path[j-1],10.35),B=at(...path[j],10.35),r=A.clone().sub(B).normalize(),n=new Vector3(r.y,-r.x,0),w=A.distanceTo(B),center=A.clone().lerp(B,.5).setZ(14.25);spans.push({A,B,r,n,w,start:total,center});total+=w;}
 for(const s of spans){screens.push({corners:[s.B,s.A,s.A.clone().setZ(18.15),s.B.clone().setZ(18.15)],normal:s.n,right:s.r,center:s.center,width:s.w,height:7.8,u0:1-(s.start+s.w)/total,u1:1-s.start/total});mesh.box(s.center.clone().addScaledVector(s.n,-.10),s.r,s.n,s.w+.03,.18,7.94,'#344332');for(const z of[10.25,18.25])mesh.tube(s.A.clone().setZ(z),s.B.clone().setZ(z),.065,'#444b3b',false,8);}
 // Silver hotel entry portal on the western part of the shown W49 frontage.
 for(const t of[140,152.5])mesh.box(at(t,150.1,5.4),e,N,.62,.65,10.6,'#c4c5b9');mesh.box(at(146.25,150.1,10.7),e,N,13.1,.7,.6,'#c4c5b9');
 for(let t=141;t<152;t+=1.65)mesh.box(at(t,150.12,5.1),e,N,.09,.16,10.1,'#c1bfb0');
 // Semicircular metal arch and its radial glazing bars.
 const arch=(radius,z,col,thick)=>{for(let i=0;i<40;i++){const a=i*Math.PI/40,b=(i+1)*Math.PI/40;mesh.tube(at(148+Math.cos(a)*radius,149.8,z+Math.sin(a)*radius),at(148+Math.cos(b)*radius,149.8,z+Math.sin(b)*radius),thick,col,false,8);}};
 arch(5.0,20.2,'#c8c8b8',.24);arch(3.7,20.2,'#9fa59b',.10);for(let j=0;j<=12;j++){const a=j*Math.PI/12;mesh.tube(at(148,149.85,20.2),at(148+Math.cos(a)*4.75,149.85,20.2+Math.sin(a)*4.75),.04,'#b7b7a7',false,6);}
 const cart={position:at(183.5,154.4,0).toArray(),normal:N.toArray(),width:1.8,canopyRadius:1.35,colors:'blue-yellow',menu:0};addVendorCart(mesh,glow,glass,cartLabels,shadow,cart);addVendorUmbrella(mesh,glow,cartLabels,shadow,cart);label(at(183.5,154.98,1.04),N,e.clone().negate(),1.6,1.0,'HOT DOGS\nPRETZELS · DRINKS','red');
 for(const t of[156,169]){const p=(x,y,z)=>at(t+x,153.3+y,z);mesh.box(p(0,0,.28),e,N,1.4,1.4,.42,'#827d69',true);replacementTree(mesh,p(0,0,.50),7.0);trees.push(p(0,0,0));}
 return{mesh,glow,shadow,labels,glass,screens,menus,awnings,trees,cart,view:{position:at(200,149,.17).toArray(),yaw:Math.atan2(-e.x-N.x,-e.y-N.y),pitch:-.33}};
}
export function hyatt49Campaign(){const c=document.createElement('canvas');c.width=4096;c.height=768;const x=c.getContext('2d'),bg=x.createLinearGradient(0,0,4096,768);bg.addColorStop(0,'#c4bd74');bg.addColorStop(.5,'#dfcd7a');bg.addColorStop(1,'#788d49');x.fillStyle=bg;x.fillRect(0,0,4096,768);x.fillStyle='#24533c';x.textAlign='center';x.font='bold 225px Georgia';x.fillText('LIVING IT UP',1000,355,1850);x.font='bold 165px Georgia';x.fillText('120 YEARS',3060,440,1800);x.font='40px Arial';x.fillText('TSINGTAO · CELEBRATING 120 YEARS',3000,620);x.fillStyle='#347c43';x.beginPath();x.moveTo(1940,657);x.lineTo(1910,330);x.lineTo(1980,184);x.lineTo(1980,62);x.lineTo(2080,62);x.lineTo(2080,184);x.lineTo(2150,330);x.lineTo(2120,657);x.closePath();x.fill();x.fillStyle='#baba76';x.fillRect(1977,58,106,42);x.fillStyle='#e6dabc';x.beginPath();x.ellipse(2030,472,100,120,0,0,Math.PI*2);x.fill();x.fillStyle='#a83b31';x.fillRect(1940,448,180,46);x.font='bold 28px Arial';x.fillStyle='#f0e6c0';x.fillText('TSINGTAO',2030,480);return c;}
export function hyatt49TowerFaces(){const out=[];for(const f of hyatt48SkinFaces()){if(!(f.normal.dot(V(W.north))>.75||f.normal.dot(V(W.east))>.75&&f.corners.every(p=>west48Local(p.toArray()).d>110)))continue;const poly=f.corners.slice(0,3),clipped=[];for(let j=0;j<3;j++){const a=poly[j],b=poly[(j+1)%3],da=a.z-28,db=b.z-28;if(da>=0)clipped.push(a);if((da>=0)!==(db>=0))clipped.push(a.clone().lerp(b,da/(da-db)));}for(let j=1;j<clipped.length-1;j++){const c=[clipped[0],clipped[j],clipped[j+1]].map(p=>p.clone().addScaledVector(f.normal,.035));out.push({...f,corners:[...c,c[2]]});}}return out;}
export function addHyatt49(viewer,collision){const g=createHyatt49();if(collision)collision.addStatic('hyatt49-harrison-trees-cart',new Float32Array(g.mesh.collision));addBatches(viewer,g.mesh.batches);addBatches(viewer,g.glow.batches);addBatches(viewer,g.shadow.batches,false,true);
 const tower=hyatt49TowerFaces();
 const towerMat=new Material({translucent:false,fabric:{type:'Hyatt49ShownTowerGrid',source:'czm_material czm_getMaterial(czm_materialInput i){czm_material m=czm_getDefaultMaterial(i);vec2 q=i.st;vec2 cell=fract(q/vec2(1.13,1.30));float grid=max(step(.95,cell.x),step(.955,cell.y));vec3 blue=mix(vec3(.10,.19,.28),vec3(.32,.43,.49),.5+.5*sin(q.x*.12+q.y*.026));float band=1.-step(2.1,abs(q.x-127.));vec3 col=mix(blue,vec3(.36,.31,.27),band);col=mix(col,vec3(.53,.56,.52),grid);m.diffuse=col*.35;m.emission=col*.43;m.specular=.6;m.shininess=90.;m.alpha=1.;return m;}'}});addFaces(viewer,tower,towerMat,(f,u,v)=>{const p=f.corners[v===0?(u===0?0:1):(u===0?3:2)],q=west48Local(p.toArray());return[f.normal.dot(V(W.north))>.75?q.t:q.d,p.z];});
 const glass=new Material({translucent:false,fabric:{type:'Hyatt49HarrisonGlass',source:'czm_material czm_getMaterial(czm_materialInput i){czm_material m=czm_getDefaultMaterial(i);vec3 c=mix(vec3(.08,.13,.14),vec3(.32,.27,.17),.5+.5*sin(i.st.x*16.+i.st.y*5.));m.diffuse=c*.35;m.emission=c*.5;m.alpha=1.;return m;}'}});addFaces(viewer,g.glass,glass,(f,u,v)=>[u,v]);
 const atlas=west48SignAtlas(g.labels),ids=new Map(g.labels.map((f,i)=>[f,i]));const signs=new Material({translucent:true,fabric:{type:'Hyatt49ReferenceSigns',uniforms:{image:Material.DefaultImageId},source:'czm_material czm_getMaterial(czm_materialInput i){czm_material m=czm_getDefaultMaterial(i);vec4 c=texture(image,i.st);m.diffuse=c.rgb*.2;m.emission=c.rgb*.6;m.alpha=c.a;return m;}'}});signs.uniforms.image=atlas.canvas;addFaces(viewer,g.labels,signs,(f,u,v)=>{const a=atlas.rects[ids.get(f)];return[(a.x+.5+u*(a.w-1))/atlas.canvas.width,(atlas.canvas.height-a.y-a.h+.5+v*(a.h-1))/atlas.canvas.height];},true);
 const ad=new Material({translucent:false,fabric:{type:'Hyatt49RoundedGreenCampaign',uniforms:{image:Material.DefaultImageId},source:'czm_material czm_getMaterial(czm_materialInput i){czm_material m=czm_getDefaultMaterial(i);m.diffuse=vec3(0.);m.emission=texture(image,i.st).rgb*.78;m.alpha=1.;return m;}'}});ad.uniforms.image=hyatt49Campaign();addFaces(viewer,g.screens,ad,(f,u,v)=>[f.u0+u*(f.u1-f.u0),v],false,{blending:{enabled:false},depthMask:true});g.streetProps=addHyatt49Street(viewer,collision);return g;}
