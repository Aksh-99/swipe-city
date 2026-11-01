import {Vector3} from 'three';
import {DetailMesh} from './detail-mesh.js';
import {cinemaAxes,cinemaStreetPoint} from './cinema-geometry.js';
import {steelCylinder} from './curb-bollard-geometry.js';
import {SUBWAY_ENTRANCES} from './streetscape-config.js';
import {NORTH42 as B} from './north42-config.js';
const UP=new Vector3(0,0,1),wrap=B.curve.wrap.map(f=>({...f,a:new Vector3(...f.a),b:new Vector3(...f.b),n:new Vector3(...f.normal)}));
const miter=(a,b)=>a.clone().add(b).divideScalar(1+a.dot(b));
export function north42CurvePoint(s,offset=0,z=0){
 let i=wrap.findIndex(f=>s<f.s1-1e-8);if(i<0)i=wrap.length-1;
 const f=wrap[i],t=Math.max(0,Math.min(1,(s-f.s0)/f.length));
 const a=miter(wrap[Math.max(0,i-1)].n,f.n),b=miter(f.n,wrap[Math.min(wrap.length-1,i+1)].n);
 return {point:f.a.clone().lerp(f.b,t).addScaledVector(a.lerp(b,t),offset).setZ(z),normal:f.n.clone(),right:new Vector3(-f.n.y,f.n.x,0)};
}
export function north42CurveFaces(from,to,bottom,top,offset,extra={}){
 const faces=[];for(const f of wrap){const a=Math.max(from,f.s0),b=Math.min(to,f.s1);if(b-a<1e-5)continue;
  faces.push({normal:f.n,right:new Vector3(-f.n.y,f.n.x,0),width:b-a,height:top-bottom,s0:a,s1:b,bottom,from,to,
   corners:[north42CurvePoint(a,offset,bottom).point,north42CurvePoint(b,offset,bottom).point,north42CurvePoint(b,offset,top).point,north42CurvePoint(a,offset,top).point],...extra});
 }return faces;
}
export function createNorth42Geometry(){
 const mesh=new DetailMesh(),light=new DetailMesh(),paving=new DetailMesh(SUBWAY_ENTRANCES);
 const stone=[],glass=[],interiors=[],labels=[],screens=[],ribbons=[],blueScreens=[],barriers=[],bollards=[],doors=[],routes=[],pools=[];
 const night={frontNormal:[-.48728,-.87324,0],lights:[]};
 const facade=id=>B.facades.find(f=>f.id===id);
 const setup=f=>{const a=cinemaAxes(f);return {...a,box:(x,y,z,w,d,h,color,solid=false)=>mesh.box(a.p(x,y,z),a.r,a.n,w,d,h,color,solid),face:(x,y,z,w,h,extra={})=>({center:a.p(x,y,z),normal:a.n,right:a.r,width:w,height:h,...extra})};};
 const label=(a,x,y,z,w,h,kind,shade=.72)=>labels.push(a.face(x,y,z,w,h,{kind,shade}));
 const ad=(a,x,y,z,w,h,cell=0)=>{a.box(x,y-.12,z,w+.18,.24,h+.18,'#111b22');screens.push(a.face(x,y+.015,z,w,h,{ad:cell}));};
 function entry(a,x,w,top=3.6,base=.18){
  a.box(x,.16,(top+base)/2,w,.20,top-base,'#172325',true);
  interiors.push(a.face(x,.277,(top+base)/2,w-.13,top-base-.12,{cell:0,shade:.35}));
  for(let k=0;k<=Math.ceil(w/1.25);k++){const xx=x-w/2+k*w/Math.ceil(w/1.25);a.box(xx,.32,(top+base)/2,.055,.14,top-base,'#a4a296');}
  for(const z of [base,top,2.7])a.box(x,.33,z,w,.16,.075,'#a4a296');
  for(const dx of [-.13,.13])mesh.tube(a.p(x+dx,.43,base+.83),a.p(x+dx,.43,base+1.45),.021,'#d0c2a0');
  doors.push({position:a.p(x,.28,.17),normal:a.n});
 }
 // The entire block retains the surveyed wall planes and roof silhouettes.
 // Small western links complete the previously bare strip past Regal.
 for(const f of B.facades.filter(f=>f.end<198.3)){
  const a=setup(f),w=f.width,b=f.bottom,h=f.height;
  if(f.id==='west-glass-front'||f.id==='west-upper-link'){
   glass.push(a.face(0,.035,b+h/2,w,h));
   for(let x=-w/2+.13;x<w/2;x+=1.52)a.box(x,.11,b+h/2,.055,.15,h,'#9aa7a8');
   for(let z=b+.3;z<f.top;z+=2.9)a.box(0,.13,z,w,.18,.16,'#7e8a89');
   if(b<1){entry(a,0,w-.5);ad(a,0,.58,14.2,w-1.4,15.4,6);}
  }else{
   stone.push(a.face(0,.035,b+h/2,w,h));
   for(const z of [4.1,6.2,f.top-.5])a.box(0,.17,z,w,.30,.23,'#b2a997');
   for(let x=-w/2+1.9;x<w/2;x+=4.6){
    glass.push(a.face(x,.08,10.5,2.65,7.4));
    for(const dx of [-1.44,1.44])a.box(x+dx,.20,10.5,.18,.29,7.7,'#a39988');
    if(w>10)entry(a,x,3.5);
   }
   if(w>20){label(a,0,.39,5.1,w-1.2,1.15,'theatre-row',.67);for(const x of [-w*.35,w*.35])ad(a,x,.45,10.6,4.5,7.2,x<0?0:5);}
   if(w<8&&b<1){entry(a,0,w-.4);label(a,0,.4,4.65,w-.35,.78,f.id==='narrow-link'?'lyric':'gifts',.69);}
  }
 }
 // New Victory: rusticated stone base, pilasters, deep upper windows,
 // cornice, twin blue/gold blades and shallow entrance steps.
 const nv=setup(facade('new-victory-front')),nw=facade('new-victory-front').width;
 stone.push(nv.face(0,.035,9.8,nw,19.2));
 for(const z of [.65,4.8,5.18,10.9,14.9,17.8,18.45,19.05])nv.box(0,.24,z,nw,.45,z>17?.31:.21,'#b5ab94');
 for(let x=-nw/2+.25;x<nw/2;x+=.47){nv.box(x,.48,18.16,.22,.52,.35,'#afa58e');nv.box(x,.37,17.50,.17,.33,.22,'#a09886');}
 for(const x of [-8.5,-4.3,0,4.3,8.5]){
  nv.box(x,.24,12.5,.88,.38,9.7,'#b9ae96');
  for(const dx of [-.25,0,.25])nv.box(x+dx,.45,12.45,.07,.15,8.7,'#817e70');
  for(const z of [7.6,17.3])nv.box(x,.42,z,1.16,.63,.31,'#c4b8a0');
  mesh.tube(nv.p(x,.49,15.8),nv.p(x,.65,15.8),.34,'#b9ac95',false,10);
 }
 for(const x of [-6.45,-2.15,2.15,6.45]){
  glass.push(nv.face(x,.09,13.1,2.72,7.25));
  for(const z of [9.48,13.25,16.72])nv.box(x,.21,z,2.9,.28,.14,'#837b69');
  nv.box(x,.24,13.1,.075,.30,7.2,'#998d78');
  for(let i=0;i<18;i++){const t=i*Math.PI/18,tt=(i+1)*Math.PI/18;mesh.tube(nv.p(x+1.42*Math.cos(t),.31,16.1+1.10*Math.sin(t)),nv.p(x+1.42*Math.cos(tt),.31,16.1+1.10*Math.sin(tt)),.072,'#baad96',false,6);}
 }
 for(const x of [-4.8,0,4.8]){entry(nv,x,3.65,4.4,.69);for(let i=0;i<3;i++)nv.box(x,.25+(2-i)*.19,.18+(i+.5)*.17,3.8,.21,.17,'#92968d',true);}
 for(const x of [-7.15,7.15]){
  nv.box(x,.59,11.62,1.40,.62,12.2,'#1b304f');label(nv,x,.915,11.62,1.31,12.04,'victory-blade',.88);
  for(let z=5.6;z<17.6;z+=.38)for(const dx of [-.64,.64])light.tube(nv.p(x+dx,.933,z),nv.p(x+dx,.962,z),.023,'#dec275',false,6);
 }
 label(nv,0,.53,18.6,16.8,.77,'victory-header',.70);
 label(nv,0,.53,5.92,11.9,1.12,'victory-header',.76);
 for(const x of [-9.5,9.5])ad(nv,x,.38,2.6,1.12,2.8,7);
 night.lights.push({position:nv.p(0,1.5,7).toArray(),radius:[13,13,12],color:[.12,.08,.028]});

 // 3 Times Square's MTA easement is an exterior portal at the surveyed
 // coordinate. The source building has a closed ground-floor wall; do not
 // cut it or move the separate, already descendable plaza entrance.
 const sub=setup(facade('three-times-subway-adjacent')),sw=facade('three-times-subway-adjacent').width,sx=sub.sx(B.subway.station);
 glass.push(sub.face(0,.035,18.25,sw,36.15));
 for(let x=-sw/2+.25;x<sw/2;x+=2.65){sub.box(x,.17,18.3,.21,.27,36.1,'#93a4a6');for(let z=7.2;z<36;z+=3.2)sub.box(x+1.2,.15,z,2.45,.27,.14,'#859595');}
 ad(sub,-4.55,.54,25.8,7.55,14.8,0);ad(sub,-5.30,.66,12.3,5.6,7.9,5);ad(sub,2.10,.58,19.2,4.8,10.7,4);
 const portalWidth=6.4,gateY=.31;
 sub.box(sx,.15,1.90,portalWidth,.28,3.43,'#101819',true);
 for(let x=sx-portalWidth/2+.09;x<sx+portalWidth/2;x+=.12)sub.box(x,gateY,1.87,.027,.055,3.28,'#737a75');
 for(const z of [.32,1.47,2.65,3.52])sub.box(sx,gateY+.04,z,portalWidth,.09,.065,'#5a6766');
 for(const x of [sx-3.32,sx+3.32])sub.box(x,.40,1.95,.26,.70,3.54,'#617375',true);
 // An angled dark canopy carries the red sign, with a separate wavy neon
 // awning below. Its overhead collision lets the camera retract naturally.
 const cp=(x,y,z)=>sub.p(sx+x,y,z),cw=7.25,front=2.08;
 mesh.quad(cp(-cw/2,.18,4.82),cp(cw/2,.18,4.82),cp(cw/2,front,4.13),cp(-cw/2,front,4.13),'#3d4b53',true);
 mesh.quad(cp(-cw/2,front,3.91),cp(cw/2,front,3.91),cp(cw/2,front,4.13),cp(-cw/2,front,4.13),'#354148',true);
 for(const side of [-1,1])mesh.quad(cp(side*cw/2,.18,4.82),cp(side*cw/2,front,4.13),cp(side*cw/2,front,3.91),cp(side*cw/2,.18,4.61),'#34434b',true);
 const slopeUp=UP.clone().multiplyScalar(.941).addScaledVector(sub.n,-.337),signNormal=sub.n.clone().multiplyScalar(.941).addScaledVector(UP,.337);
 labels.push({center:cp(0,1.10,4.62),normal:signNormal,right:sub.r,up:slopeUp,width:6.65,height:.70,kind:'subway',shade:.92});
 sub.box(sx,1.06,3.28,7.06,1.76,.16,'#192b32',true);
 for(let x=-3.45;x<3.45;x+=.055){const nx=Math.min(3.45,x+.055),z=3.28+.052*Math.sin(x*13.2),nz=3.28+.052*Math.sin(nx*13.2);light.tube(cp(x,1.97,z),cp(nx,1.97,nz),.025,'#eb2445',false,5);}
 label(sub,sx,2.00,3.06,6.40,.30,'routes',.78);
 night.lights.push({position:cp(0,2.3,3.6).toArray(),radius:[6,6,5],color:[.14,.025,.03]});
 const portal={position:sub.at(B.subway.station,.40,.17),normal:sub.n,width:portalWidth,canopyUnderside:3.20};

 // Continuous skins use shared mitered joints across all original facets.
 const length=B.curve.length;
 const band=(from,to,b,t,off,color,solid=false,target=mesh)=>{for(const f of north42CurveFaces(from,to,b,t,off))target.quad(...f.corners,color,solid);};
 const cb=(s,off,z,w,d,h,color,solid=false)=>{const a=north42CurvePoint(s,off,z);mesh.box(a.point,a.right,a.normal,w,d,h,color,solid);};
 stone.push(...north42CurveFaces(0,length,.18,18.1,.16));
 band(0,length,.17,.42,.31,'#697776',true);band(0,length,.19,3.0,.18,null,true);
 for(let s=.15;s<length;s+=3.55){
  const t=Math.min(length,s+3.39);
  interiors.push(...north42CurveFaces(s,t,.43,5.01,.24,{cell:2,shade:.44}));
  cb(s,.33,2.75,.085,.21,4.7,'#b5a47f');
  cb((s+t)/2,.35,2.7,.045,.14,4.45,'#7b887f');
  glass.push(...north42CurveFaces(s+.35,t-.20,10.5,17.5,.23));
  cb(s,.43,13.4,.55,.64,8.7,'#b5ab98');
  for(let z=9.1;z<17.8;z+=.50)cb(s,.765,z,.56,.05,.028,'#656e69');
  for(const z of [12.5,15.0])band(s+.32,t-.16,z,z+.09,.33,'#879592');
 }
 for(const z of [5.07,7.28,8.03,10.05,17.65,18.02])band(0,length,z,z+.17,.38,'#8d9187');
 for(let z=7.7;z<10.0;z+=.48)band(0,length,z,z+.022,.403,'#626c68');
 // Shoe-store advertising ribbon wraps from W42 into Seventh Avenue.
 band(0,length,5.19,7.25,.43,'#16232d');
 for(let s=0;s<length;s+=9.43){const t=Math.min(length,s+9.43);ribbons.push(...north42CurveFaces(s,t,5.28,7.15,.47,{kind:'ribbon',shade:.70}));}
 for(const s of [5.5,15.0,24.5,34.0]){
  for(let z=8.43;z<9.68;z+=.16)band(Math.max(0,s-3.35),Math.min(length,s+3.35),z,z+.06,.63,'#34485e');
  labels.push(...north42CurveFaces(Math.max(.03,s-3.10),Math.min(length-.03,s+3.10),8.53,9.54,.68,{kind:'civic',shade:.83}));
 }
 for(const s of [9.4,25.2]){
  labels.push(...north42CurveFaces(s-3.6,s+3.6,4.36,4.96,.49,{kind:'citysole',shade:.77}));
  for(const d of [-1.0,0,1.0])cb(s+d,.39,2.28,.07,.23,3.80,'#c6b08a');
  for(const d of [-.13,.13]){const a=north42CurvePoint(s+d,.51,1.20).point,b=north42CurvePoint(s+d,.51,1.93).point;mesh.tube(a,b,.022,'#cfbb8c');}
  const a=north42CurvePoint(s,.40,.17);doors.push({position:a.point,normal:a.normal});
 }
 // Large upper blue wrap, with a few restrained lit windows behind it.
 band(0,length,18.15,33.7,.41,'#172a39');blueScreens.push(...north42CurveFaces(0,length,18.35,33.5,.48));
 labels.push(...north42CurveFaces(8.2,29.6,23.0,28.5,.51,{kind:'city-nights',shade:.81}));
 for(const z of [18.19,33.58])band(0,length,z,z+.07,.54,'#687d89');
 glass.push(...north42CurveFaces(0,length,33.86,36.4,.17));
 for(let s=.15;s<length;s+=1.8)cb(s,.25,35.13,.05,.15,2.5,'#8b9a9b');
 night.lights.push({position:north42CurvePoint(16,1,9).point.toArray(),radius:[19,19,17],color:[.038,.067,.13]});

 // Curb-side blocks leave the 42nd Street lane, all entry gaps, and the
 // narrow source sidewalk open. Never place new paving over subway holes.
 for(const f of B.facades){const a=cinemaAxes(f);for(let s=f.start;s<f.end;s+=2.5){const t=Math.min(f.end,s+2.5);paving.quad(a.at(s,.03,.176),a.at(t,.03,.176),cinemaStreetPoint(t,12.1,.176),cinemaStreetPoint(s,12.1,.176),'#929b97',true);}}
 paving.quad(cinemaStreetPoint(133.7,12.1,.178),cinemaStreetPoint(239,12.1,.178),cinemaStreetPoint(239,13.32,.178),cinemaStreetPoint(133.7,13.32,.178),'#929b97',true);
 const north=new Vector3(...B.facades[0].normal),right=new Vector3(-north.y,north.x,0);
 for(let s=137;s<241;s+=3.2){if([151.8,176.1,195.3,204.2,209,213.8,232.1].some(x=>Math.abs(s-x)<1.75))continue;
  const p=cinemaStreetPoint(s,11.55,.03),color=['#a6423b','#2b5f8c','#a4aba3'][Math.round(s/3.2)%3],at=(x,y,z)=>p.clone().addScaledVector(right,x).addScaledVector(north,y).setZ(z+.03);
  // Trapezoid shoulders, recessed lifting eyes and the municipal nameplate.
  const vertices=[[-1.03,-.34,0],[1.03,-.34,0],[1.03,.34,0],[-1.03,.34,0],[-.96,-.25,.91],[.96,-.25,.91],[.96,.25,.91],[-.96,.25,.91]].map(v=>at(...v));
  mesh.emit(vertices,[[0,1,5],[0,5,4],[1,2,6],[1,6,5],[2,3,7],[2,7,6],[3,0,4],[3,4,7],[4,5,6],[4,6,7]],color,true);
  for(const x of [-.70,.70])mesh.box(at(x,.31,.51),right,north,.18,.014,.085,'#324751');
  labels.push({center:at(0,.31,.49),normal:north,right,width:1.64,height:.13,kind:'barrier',shade:.54});barriers.push({position:p,normal:north});
 }
 for(const f of wrap){const p=(s,o,z)=>north42CurvePoint(s,o,z).point;paving.quad(p(f.s0,.02,.176),p(f.s1,.02,.176),p(f.s1,2.20,.176),p(f.s0,2.20,.176),'#929b97',true);paving.quad(p(f.s0,2.2,0),p(f.s1,2.2,0),p(f.s1,2.2,.176),p(f.s0,2.2,.176),'#68787c',true);}
 for(const s of [2.2,5.5,13.2,17,20.8,29.3,33.1,36.6]){const a=north42CurvePoint(s,2.03,.176);steelCylinder(mesh,a.point,a.normal);bollards.push({position:a.point,normal:a.normal});}
 for(const [s,t]of [[224.0,14.2],[219.5,13.8]]){const p=cinemaStreetPoint(s,t,.176);mesh.box(p.clone().addScaledVector(UP,.51),right,north,.59,.54,1.0,'#485955',true);mesh.box(p.clone().addScaledVector(UP,1.04),right,north,.63,.58,.075,'#2d3a3b');for(let x=-.24;x<.25;x+=.08)mesh.tube(p.clone().addScaledVector(right,x).addScaledVector(north,.285).setZ(.24),p.clone().addScaledVector(right,x).addScaledVector(north,.285).setZ(1.15),.012,'#8c9690');}
 routes.push({id:'north42-sidewalk',points:[cinemaStreetPoint(133.7,13.0),cinemaStreetPoint(239,13.0)]});
 routes.push({id:'corner-sidewalk',points:Array.from({length:75},(_,i)=>north42CurvePoint(.25+i*(length-.5)/74,1.12,.18).point)});
 routes.push({id:'north42-road',points:[cinemaStreetPoint(133,0,.04),cinemaStreetPoint(253,0,.04)]});
 pools.push({center:sub.at(B.subway.station,1.2,.185),normal:UP,right:sub.r,up:sub.n,width:8,height:3});
 return {batches:mesh.batches,emissive:light.batches,paving:paving.batches,collision:new Float32Array([...mesh.collision,...paving.collision]),stone,glass,interiors,labels,screens,ribbons,blueScreens,barriers,bollards,doors,routes,pools,portal,night};
}
