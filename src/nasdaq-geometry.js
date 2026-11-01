import {Vector3} from 'three';
import {DetailMesh} from './detail-mesh.js';
import {steelCylinder} from './curb-bollard-geometry.js';
import {NASDAQ,NASDAQ_WINDOWS} from './nasdaq-config.js';

const UP=new Vector3(0,0,1);
const face=(center,normal,right,width,height,extra={})=>({center,normal,right,width,height,...extra});
const wrap=NASDAQ.wrap.map(f=>({...f,a:new Vector3(...f.a),b:new Vector3(...f.b),n:new Vector3(...f.normal)}));
function miter(a,b){return a.clone().add(b).divideScalar(1+a.dot(b));}
function axes(f){const c=new Vector3(...f.center),n=new Vector3(...f.normal),r=new Vector3(-n.y,n.x,0);return {n,r,p:(x,y,z)=>c.clone().addScaledVector(r,x).addScaledVector(n,y).setZ(z)};}

// Offset a source facet using joined corners. Both the facade and the wider
// scaffold canopy remain continuous around the real rounded footprint.
export function nasdaqPoint(s,offset=0,z=0){
 let i=wrap.findIndex(f=>s<=f.s1+1e-8);if(i<0)i=wrap.length-1;const f=wrap[i];
 const t=Math.max(0,Math.min(1,(s-f.s0)/f.length));
 const a=miter(wrap[Math.max(0,i-1)].n,f.n),b=miter(f.n,wrap[Math.min(wrap.length-1,i+1)].n);
 return {point:f.a.clone().lerp(f.b,t).addScaledVector(a.lerp(b,t),offset).setZ(z),normal:f.n.clone(),right:new Vector3(-f.n.y,f.n.x,0)};
}
function wrappedFaces(from,to,bottom,top,offset,extra={}){
 const result=[];
 for(const f of wrap){const a=Math.max(from,f.s0),b=Math.min(to,f.s1);if(b-a<.0001)continue;
  result.push({normal:f.n,right:new Vector3(-f.n.y,f.n.x,0),width:b-a,height:top-bottom,
   corners:[nasdaqPoint(a,offset,bottom).point,nasdaqPoint(b,offset,bottom).point,nasdaqPoint(b,offset,top).point,nasdaqPoint(a,offset,top).point],
   s0:a,s1:b,bottom,top,...extra});
 }return result;
}
function emitFaces(mesh,faces,color,solid=false){for(const f of faces)mesh.quad(...f.corners,color,solid);}

export function createNasdaqGeometry(){
 const mesh=new DetailMesh(),emissive=new DetailMesh(),glass=[],screens=[],fascia=[],windows=[],labels=[],ads=[],pools=[],posts=[],doors=[],walkway=[];
 const L=NASDAQ.length;
 const band=(bottom,top,offset,color,solid=false)=>emitFaces(mesh,wrappedFaces(0,L,bottom,top,offset),color,solid);
 // Three glazed studio floors under a deep black branded fascia.
 glass.push(...wrappedFaces(0,L,.32,NASDAQ.glassTop,.18,{kind:'studio'}));
 band(.08,.32,.30,'#707b81',true);band(.32,.43,.35,'#9eaaae');
 band(.16,2.7,.145,null,true);
 for(const z of [.43,3.76,7.5,11.4]){band(z-.075,z+.075,.27,'#889ca5');band(z+.076,z+.095,.29,'#c0cacf');}
 for(let s=.0;s<L+.01;s+=L/15){const {point:p,normal:n,right:r}=nasdaqPoint(s,.245,5.83);mesh.box(p,r,n,.065,.16,11.05,'#97a6aa');}
 band(11.44,15.05,.21,'#111a23');
 fascia.push(...wrappedFaces(0,L,NASDAQ.fasciaBottom,NASDAQ.fasciaTop,.245));
 screens.push(...wrappedFaces(0,L,NASDAQ.screenBottom,NASDAQ.screenTop,.265));
 for(const z of [15.055,NASDAQ.screenTop+.04])band(z-.05,z+.05,.29,'#596a78');
 for(const s of [0,L]){const {point,normal,right}=nasdaqPoint(s,.20,(NASDAQ.screenTop+11.4)/2);mesh.box(point,right,normal,.13,.28,NASDAQ.screenTop-11.25,'#4e606b');}
 // The actual screen's interrupted window grid is an architectural feature.
 // LED faces are cut in the material; recessed glass and metal reveals sit
 // behind those holes instead of placing bright white squares on the ad.
 for(const [i,w]of NASDAQ_WINDOWS.entries()){
  windows.push(...wrappedFaces(w.s-w.width/2,w.s+w.width/2,w.z-w.height/2,w.z+w.height/2,.242,{kind:'tower',variant:i}));
  for(const z of [w.z-w.height/2,w.z+w.height/2])emitFaces(mesh,wrappedFaces(w.s-w.width/2-.055,w.s+w.width/2+.055,z-.045,z+.045,.307),'#758895');
  for(const s of [w.s-w.width/2,w.s+w.width/2]){const {point,normal,right}=nasdaqPoint(s,.31,w.z);mesh.box(point,right,normal,.064,.115,w.height,'#677a85');}
 }
 // Small monitors visible through the broadcast-studio glazing, with dark
 // layered frames and a few warm ceiling strips. No simulated people/interior.
 for(const s of [2.5,5.7,8.9,12.1,14.7]){
  const {point:p,normal:n,right:r}=nasdaqPoint(s,.26,2.35);
  mesh.box(p,r,n,1.20,.10,.68,'#101820');labels.push(face(p.clone().addScaledVector(n,.055),n,r,1.1,.59,{kind:'monitor'}));
  const bar=nasdaqPoint(s,.27,3.53);emissive.box(bar.point,bar.right,bar.normal,.78,.035,.022,'#a1bdb7');
 }
 for(const s of [4.5,11.6]){const {point,normal,right}=nasdaqPoint(s,.275,8.5);labels.push(face(point,normal,right,2.7,.60,{kind:'studio'}));}

 for(const f of NASDAQ.returns){
  const {p,n,r}=axes(f),w=f.width,north=f.id==='west-43rd';
  mesh.box(p(0,.07,f.height/2),r,n,w,.11,f.height,north?'#58626a':'#263e4b');
  mesh.box(p(0,.16,.24),r,n,w,.28,.34,'#737f82',true);
  mesh.quad(p(-w/2,.13,.17),p(w/2,.13,.17),p(w/2,.13,2.8),p(-w/2,.13,2.8),null,true);
  if(north){
   // W43 return: repeated gray metal/stone piers, dark punched windows,
   // louvered ventilation, service shutter and a restrained glass entrance.
   const bays=9,pitch=w/bays;
   for(let i=0;i<bays;i++){
    const x=-w/2+(i+.5)*pitch;
    for(let row=0;row<10;row++){
     const z=5.8+row*3.7;if(z+1.46>f.height)continue;
     mesh.box(p(x,.155,z),r,n,2.15,.09,2.93,'#14232d');
     glass.push(face(p(x,.212,z),n,r,1.97,2.73,{kind:'office',variant:i+row*9}));
     for(const edge of [-1,1])mesh.box(p(x+edge*1.04,.23,z),r,n,.048,.09,2.9,'#929e9f');
     mesh.box(p(x,.22,z-1.44),r,n,2.15,.16,.065,'#a1a7a6');
     mesh.box(p(x,.247,z),r,n,.035,.05,2.78,'#737f84');
    }
    mesh.box(p(x+pitch/2,.14,f.height/2),r,n,.023,.04,f.height,'#202e36');
   }
   for(let z=4.02;z<f.height;z+=3.7)mesh.box(p(0,.17,z),r,n,w,.17,.21,'#717c81');
   const vent=(x,width,z,height)=>{mesh.box(p(x,.21,z),r,n,width,.15,height,'#142027');for(let h=z-height/2+.06;h<z+height/2;h+=.095)mesh.box(p(x,.315,h),r,n,width-.1,.08,.035,'#48565e');};
   vent(-9.5,3.2,2.65,1.8);vent(-2.6,3.35,2.65,1.8);vent(4.0,2.55,2.65,1.8);
   const shutterX=-6.0;mesh.box(p(shutterX,.205,1.75),r,n,3.05,.16,3.05,'#4c5b63');
   for(let z=.26;z<3.23;z+=.10)mesh.box(p(shutterX,.3,z),r,n,3.0,.055,.025,'#79858b');
   const x=11.6;mesh.box(p(x,.21,1.81),r,n,2.8,.20,3.28,'#798c96',true);
   for(const dx of [-.67,.67]){glass.push(face(p(x+dx,.325,1.78),n,r,1.21,2.93,{kind:'door'}));mesh.tube(p(x+dx-Math.sign(dx)*.36,.40,1.0),p(x+dx-Math.sign(dx)*.36,.40,1.62),.021,'#c0c9c9');}
   mesh.box(p(x,.35,1.81),r,n,.052,.12,3.28,'#9facb1');doors.push({point:p(x,.35,.17),normal:n});
   labels.push(face(p(x,.33,3.79),n,r,2.7,.37,{kind:'entry'}));
   // Low concrete protection and brushed-steel cylinders stand close to the
   // wall, leaving the existing W43 sidewalk and crosswalk approaches clear.
   for(const x of [-12,-8,-4,0,4,7.5]){const position=p(x,.78,.17);steelCylinder(mesh,position,n);posts.push({position,normal:n});}
   for(const x of [-10,2])mesh.box(p(x,.58,.52),r,n,2.20,.58,.70,'#869095',true);
  }else{
   glass.push(face(p(0,.142,19.57),n,r,w-.12,38.35,{kind:'curtain'}));
   for(let x=-w/2;x<=w/2+.02;x+=w/16)mesh.box(p(x,.25,19.5),r,n,.09,.25,38.4,'#8a9ca4');
   for(let z=.45;z<f.height;z+=1.25){mesh.box(p(0,.25,z),r,n,w,.23,.055,'#80939c');mesh.box(p(0,.28,z+.09),r,n,w,.05,.025,'#466477');}
   // Two broad landscape ads, like the neighboring fashion/film screens in
   // the reference; reuse the existing authored campaign atlas.
   for(const [z,height,art]of (w>=12?[[15.3,6.5,3],[25.1,10.7,1]]:[])){
    const center=p(-.8,.52,z),width=w-3.6;mesh.box(center,r,n,width+.25,.65,height+.23,'#192b36');
    ads.push(face(center.clone().addScaledVector(n,.335),n,r,width,height,{art}));
    for(let x=-width/2;x<=width/2;x+=2)mesh.tube(p(x-.8,.44,z-height/2-.10),p(x-.8,.91,z-height/2+.20),.026,'#6c7e86');
   }
   labels.push(face(p(0,.29,7.4),n,r,Math.min(9.8,w-.8),1.42,{kind:'studio'}));
  }
  mesh.box(p(0,.24,f.height),r,n,w,.34,.14,'#7c898e');
 }

 // Continuous covered route: short W43 return → rounded corner → Broadway.
 // Replace the previous straight scaffold on this frontage, retaining the
 // One Times Square / NYPD-side scaffolds across the plaza.
 const north=NASDAQ.returns[0],west=NASDAQ.returns[1],nN=new Vector3(...north.normal),nW=new Vector3(...west.normal);
 const first=wrap[0],last=wrap.at(-1),northR=new Vector3(-nN.y,nN.x,0);
 const path=[{a:first.a.clone().addScaledVector(northR,-5),b:first.a.clone(),n:nN},...wrap.map(f=>({a:f.a,b:f.b,n:f.n})),{a:last.b.clone(),b:new Vector3(...west.b),n:nW}];
 let covered=0;
 const {inner,width,height,grade}=NASDAQ.scaffold,outer=inner+width;
 for(const [i,seg]of path.entries()){
  const aN=miter(path[Math.max(0,i-1)].n,seg.n),bN=miter(seg.n,path[Math.min(path.length-1,i+1)].n),length=seg.a.distanceTo(seg.b);
  const at=(t,d,z)=>seg.a.clone().lerp(seg.b,t).addScaledVector(aN.clone().lerp(bN,t),d).setZ(z+grade);
  mesh.quad(at(0,inner,height),at(1,inner,height),at(1,outer,height),at(0,outer,height),'#405254',true);
  mesh.quad(at(0,outer,height-.16),at(1,outer,height-.16),at(1,outer,height+.16),at(0,outer,height+.16),'#243c35');
  mesh.quad(at(0,inner,height-.17),at(1,inner,height-.17),at(1,outer,height-.17),at(0,outer,height-.17),'#202b32',true);
  for(const z of [height+.23,height+1.26])mesh.tube(at(0,outer-.02,z),at(1,outer-.02,z),.034,'#768d92');
  for(let d=Math.ceil(covered/3.0)*3.0;d<covered+length-.001;d+=3.0){
   const t=(d-covered)/length,r=new Vector3(-seg.n.y,seg.n.x,0);
   for(const off of [inner+.10,outer-.10]){
    mesh.tube(at(t,off,.04),at(t,off,height+1.25),.048,'#8e9ea3',true,10);
    mesh.box(at(t,off,.075),r,seg.n,.24,.24,.12,'#596b70',true);
    // Upper knee braces leave the player capsule and sightline unobstructed.
    mesh.tube(at(t,off,2.62),at(t,off+(off<1?.50:-.50),height-.18),.027,'#879da5');
   }
   mesh.tube(at(t,inner,height-.21),at(t,outer,height-.21),.055,'#8f9da0');
   mesh.tube(at(t,inner,height+.24),at(t,outer,height+.24),.04,'#657d84');
   emissive.tube(at(t,1.35,height-.27),at(t,2.30,height-.27),.026,'#b2cec3',false,6);
   pools.push(face(at(t,2.0,.012),UP,r,3.1,3.6,{up:seg.n}));
  }
  for(let d=0;d<length;d+=.8)walkway.push(at(d/length,inner+width/2,.17-grade));
  covered+=length;
 }
 const night={frontNormal:NASDAQ.normal,lights:[
  {position:[...NASDAQ.center.slice(0,2),13],radius:[15,13,21],color:[.05,.12,.20]},
  {position:[...NASDAQ.center.slice(0,2),3.5],radius:[11,9,5],color:[.07,.09,.08]},
  {position:[...west.center.slice(0,2),17],radius:[12,19,16],color:[.095,.045,.13]},
 ]};
 return {batches:mesh.batches,emissive:emissive.batches,collision:new Float32Array(mesh.collision),glass,screens,fascia,windows,labels,ads,pools,posts,doors,walkway,coveredMeters:covered,night};
}
