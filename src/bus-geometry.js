import {Vector3} from 'three';
import {DetailMesh} from './detail-mesh.js';
import {BUS_STOPS} from './bus-config.js';
const UP=new Vector3(0,0,1);
export function busAxes(bus){const c=new Vector3(...bus.center),f=new Vector3(...bus.forward),r=new Vector3(...bus.right);return {c,f,r,p:(x,y,z)=>c.clone().addScaledVector(r,x).addScaledVector(f,y).addScaledVector(UP,z)};}
// Rounded rectangular section with true chamfered corners. Several stacked
// sections form the coach's sloping windscreen and curved shoulder/roof.
function ring(p,width,length,z,corner=.20,shift=0){
 const w=width/2,l=length/2,vs=[];
 for(const [cx,cy,start]of [[w-corner,l-corner,0],[-w+corner,l-corner,90],[-w+corner,-l+corner,180],[w-corner,-l+corner,270]])for(let i=0;i<=4;i++){
  const angle=(start+i*22.5)*Math.PI/180;vs.push(p(cx+Math.cos(angle)*corner,cy+Math.sin(angle)*corner+shift,z));
 }return vs;
}
function skin(mesh,rings,colors){
 for(let k=1;k<rings.length;k++)for(let i=0;i<rings[k].length;i++){const j=(i+1)%rings[k].length;mesh.quad(rings[k-1][i],rings[k-1][j],rings[k][j],rings[k][i],colors[k-1]);}
 const top=rings.at(-1),center=top.reduce((a,v)=>a.add(v),new Vector3()).divideScalar(top.length);for(let i=0;i<top.length;i++)mesh.emit([center,top[i],top[(i+1)%top.length]],[[0,1,2]],colors.at(-1));
}
function wheel(mesh,p,side,y,radius,width){
 const x=side*(width/2-.15),center=p(x,y,radius+.02),end=p(side*(width/2+.034),y,radius+.02);
 mesh.tube(center,end,radius,'#151d22',false,32);
 mesh.tube(end,end.clone().add(p(side*.019,0,0).sub(p(0,0,0))),radius*.70,'#a3aba9',false,32);
 const nx=side*(width/2+.065);mesh.tube(p(nx,y,radius+.02),p(nx+side*.026,y,radius+.02),radius*.36,'#65747b',false,24);
 for(let j=0;j<10;j++){
  const a=j*Math.PI/5,cy=y+Math.cos(a)*radius*.5,z=radius+.02+Math.sin(a)*radius*.5;
  mesh.tube(p(nx,cy,z),p(nx+side*.03,cy,z),.027,'#d0d4cd',false,6);
  const aa=a+.15;mesh.tube(p(nx,y+Math.cos(aa)*radius*.80,radius+.02+Math.sin(aa)*radius*.80),p(nx+side*.014,y+Math.cos(aa)*radius*.80,radius+.02+Math.sin(aa)*radius*.80),.055,'#263237',false,8);
 }
 // The shadow recess and raised arch lip remain visible around the tire.
 for(let j=0;j<22;j++){const a=j/22*Math.PI,b=(j+1)/22*Math.PI;mesh.tube(p(side*(width/2+.019),y+Math.cos(a)*(radius+.11),radius+.02+Math.sin(a)*(radius+.11)),p(side*(width/2+.019),y+Math.cos(b)*(radius+.11),radius+.02+Math.sin(b)*(radius+.11)),.055,'#303d43',false,6);}
}
export function createBusGeometry(){
 const mesh=new DetailMesh(),emissive=new DetailMesh(),asphalt=new DetailMesh(),shadows=new DetailMesh(),glass=[],labels=[],pools=[],polePositions=[];
 const night={frontNormal:[0,1,0],lights:[]};
 for(const [index,bus]of BUS_STOPS.entries()){
  const {p,f,r}=busAxes(bus),w=bus.width,l=bus.length,h=bus.height,half=l/2,coach=bus.kind==='coach',tour=bus.kind==='tour',city=bus.kind==='city',body=tour?'#672931':coach?'#c6c4b7':'#d0d3cc',accent=tour?'#d4b57c':coach?'#cfad37':'#245a87';
  const box=(x,y,z,dx,dy,dz,color,solid=false)=>mesh.box(p(x,y,z),r,f,dx,dy,dz,color,solid);
  const sideFace=(side,y,z,width,height,extra={})=>({center:p(side*(w/2+.076),y,z),normal:r.clone().multiplyScalar(side),right:f.clone().multiplyScalar(side),width,height,...extra});
  const frontFace=(y,z,width,height,extra={})=>({center:p(0,y,z),normal:f.clone(),right:r.clone().negate(),width,height,...extra});
  const backFace=(y,z,width,height,extra={})=>({center:p(0,y,z),normal:f.clone().negate(),right:r.clone(),width,height,...extra});
  // Separate smooth hull collider prevents walking through windows/axles,
  // while the vehicle silhouette has individual wheels and molded panels.
  box(0,0,(h+.14)/2,w-.02,l-.15,h-.14,null,true);
  box(0,0,.44,w-.20,l-.47,.26,'#1f2a30');
  const roof=tour?2.92:coach?3.5:3.11;
  skin(mesh,[ring(p,w-.14,l-.14,.46),ring(p,w,l,.82),ring(p,w,l,1.50),ring(p,w-.04,l-.06,roof-.18),ring(p,w-.28,l-.50,roof,.28,-.03)],[accent,body,'#28383f',body]);
  // Body panels and raised beltline sit outside the dark glazing band.
  for(const side of [-1,1]){
   box(side*(w/2+.018),0,1.28,.055,l-.7,.30,body);
   box(side*(w/2+.047),0,1.06,.012,l-.55,.045,tour?'#d8bd87':coach?'#e0bd52':'#d0b469');
   box(side*(w/2+.047),0,1.44,.012,l-.55,.055,'#a7b5b8');
   box(side*(w/2+.05),0,.47,.014,l-.61,.08,'#859092');
   const axles=coach?[half-2.85,-half+2.05,-half+3.28]:[half-2.7,-half+2.8];
   for(const y of axles)wheel(mesh,p,side,y,coach?.53:.48,w);
   const doorYs=coach?[half-1.04]:tour?[half-1.08]:[half-1.13,-.85];
   const count=coach?9:tour?8:7,spacing=(l-1.4)/count;
   for(let j=0;j<count;j++){
    const y=-half+.7+(j+.5)*spacing;if(side===1&&doorYs.some(d=>Math.abs(d-y)<1.0))continue;
    glass.push(sideFace(side,y,coach?2.51:2.15,spacing-.09,coach?1.28:1.18,{variant:j%5}));
    box(side*(w/2+.069),y-spacing/2,coach?2.51:2.15,.056,.048,coach?1.37:1.25,'#687a7e');
    box(side*(w/2+.069),y,coach?2.59:2.35,.05,spacing-.08,.036,'#586a71');
   }
   for(let j=0;j<5;j++){
    const y=-half+1.3+j*(l-2.6)/5;
    box(side*(w/2+.058),y,.92,.026,.016,.63,'#70818a');
    if(coach){box(side*(w/2+.062),y+.22,.84,.023,.26,.054,'#454f50');box(side*(w/2+.071),y+.22,.85,.019,.17,.023,'#c3cac5');}
   }
   for(let z=.65;z<1.37;z+=.077)box(side*(w/2+.061),-half+.76,z,.024,.89,.021,'#404f56');
   labels.push(sideFace(side,coach?-.30:tour?-1.0:1.26,coach?1.46:tour?1.45:1.30,coach?5.3:tour?6.0:3.45,coach?.43:tour?.45:.29,{kind:'livery',bus}));
   if(city)labels.push(sideFace(side,-half+1.6,2.34,1.0,.37,{kind:'fleet',text:String(9621+index*17),bus}));
   // Marker lamps and side reflectors do not illuminate entire white panels.
   for(const y of [-half+.55,half-.55])emissive.box(p(side*(w/2+.075),y,.73),r,f,.019,.16,.064,y>0?'#dba15b':'#b13b30');
   if(side===1)for(const dy of doorYs){
    box(w/2+.042,dy,1.53,.045,coach?.97:1.26,2.30,'#242e33');glass.push(sideFace(1,dy,1.72,coach?.87:1.14,1.83,{variant:2}));
    for(const yy of [dy-.56,dy,dy+.56])box(w/2+.084,yy,1.55,.062,.045,2.24,'#9aaba9');
    box(w/2+.09,dy,.64,.075,1.11,.15,'#b3b9ae');box(w/2+.10,dy,1.70,.09,1.12,.044,'#858f8b');
    if(!coach)labels.push(sideFace(1,dy-.83,.88,.28,.28,{kind:'access',bus}));
   }
  }
  // Slanted, split windscreen, dark gasket, wipers and destination display.
  const z0=coach?1.47:1.21,z1=tour?2.69:coach?3.2:2.67,y0=half+.018,y1=half-.21;
  const corners=[p(-w/2+.16,y0,z0),p(w/2-.16,y0,z0),p(w/2-.24,y1,z1),p(-w/2+.24,y1,z1)];
  glass.push({corners,center:p(0,half,2),normal:f,right:r,width:w-.35,height:z1-z0,variant:3});
  for(let i=0;i<4;i++)mesh.tube(corners[i],corners[(i+1)%4],.043,'#111f29',false,8);
  mesh.tube(p(0,y0+.012,z0),p(0,y1+.012,z1),.038,'#283d47');
  for(const side of [-1,1]){
   mesh.tube(p(side*.68,half+.062,z0+.10),p(side*.24,half+.050,z0+.72),.018,'#1a2429',false,6);
   mesh.tube(p(side*.24,half+.050,z0+.72),p(side*.54,half+.015,z0+1.07),.019,'#3f4c50',false,6);
   // Rear-view mirror arms stay within the road-facing clearance envelope.
   mesh.tube(p(side*(w/2-.06),half-.46,2.55),p(side*(w/2+.26),half-.38,2.50),.037,'#596e78');
   box(side*(w/2+.26),half-.38,2.28,.10,.20,.45,'#344853');
  }
  if(!coach){box(0,half-.07,2.92,w-.24,.28,.32,'#182832');labels.push(frontFace(half+.081,2.92,w-.39,.24,{kind:'destination',bus}));}
  else{box(0,half-.03,3.39,w-.38,.17,.24,'#252c2b');labels.push(frontFace(half+.061,3.39,w-.49,.18,{kind:'destination',bus}));}
  box(0,half-.015,.90,w-.13,.14,.38,body);box(0,half+.060,.51,w-.25,.13,.16,'#566971');
  box(0,half+.12,.64,.32,.02,.15,'#c39c45');labels.push(frontFace(half+.09,1.03,1.03,.20,{kind:'nose',bus}));
  for(const side of [-1,1]){
   box(side*.91,half+.065,.88,.48,.10,.27,'#26353a');
   for(const dx of [-.11,.11])emissive.tube(p(side*.91+dx,half+.127,.90),p(side*.91+dx,half+.148,.90),.082,'#e9e7cb',false,16);
   emissive.box(p(side*.97,half+.125,1.12),r,f,.24,.015,.035,'#a7c8d5');
   box(side*.98,-half-.02,1.02,.25,.10,.43,'#283237');
   for(const z of [.89,1.10])emissive.tube(p(side*.98,-half-.080,z),p(side*.98,-half-.10,z),.067,'#b23a30',false,12);
  }
  // Rear cooling panel, high rear window, plate and center brake light.
  box(0,-half-.018,1.13,1.55,.05,.9,body);for(let z=.84;z<1.45;z+=.078)box(0,-half-.052,z,1.30,.033,.032,'#42545c');
  glass.push(backFace(-half-.044,2.10,1.67,.94,{variant:1}));
  labels.push(backFace(-half-.062,2.84,city?1.25:1.70,.24,{kind:'rear',bus}));
  box(0,-half-.05,.55,.35,.04,.17,'#c0a25a');emissive.box(p(0,-half-.064,2.67),r,f,.33,.025,.04,'#b64331');
  // Rooftop hybrid/HVAC equipment with bevels, grilles and circular fans.
  if(!tour){
   const top=coach?3.50:3.12;skin(mesh,[ring(p,1.62,4.8,top,.18,-1.5),ring(p,1.45,4.6,h,.25,-1.5)],['#939f9f']);
   for(const y of [-2.7,-1.15]){mesh.tube(p(0,y,h),p(0,y,h+.015),.48,'#465a64',false,24);for(let j=0;j<8;j++){const a=j*Math.PI/4;mesh.tube(p(-Math.sin(a)*.40,y+Math.cos(a)*.4,h+.023),p(Math.sin(a)*.40,y-Math.cos(a)*.4,h+.023),.021,'#819295',false,5);}}
   for(const side of [-1,1])for(let y=-3.7;y<.5;y+=.18)box(side*.79,y,top+.10,.025,.041,.12,'#526773');
  }else{
   // Open top is genuinely open: individual empty passenger seats, central
   // aisle, raised front windscreen and perimeter handrails, no people.
   box(0,-.10,2.94,w-.15,l-.35,.16,'#35414a');
   for(const side of [-1,1]){
    box(side*(w/2-.055),0,3.36,.11,l-.33,.85,body);
    mesh.tube(p(side*(w/2-.065),-half+.25,3.88),p(side*(w/2-.065),half-.55,3.88),.036,'#adb9b8');
    labels.push(sideFace(side,0,3.38,l-1.7,.47,{kind:'tour-brand',bus}));
    for(let y=-half+.95;y<half-1.5;y+=.84)for(const x of [side*.43,side*.91]){
     box(x,y,3.37,.40,.49,.08,'#574b42');box(x,y-.23,3.68,.40,.10,.61,'#b5916e');
     mesh.tube(p(x-.15,y-.28,3.91),p(x+.15,y-.28,3.91),.031,'#c7c5b4');
     for(const xx of [x-.13,x+.13])mesh.tube(p(xx,y,2.98),p(xx,y,3.33),.023,'#667373');
    }
   }
   const upper=[p(-w/2+.10,half-.37,3.22),p(w/2-.10,half-.37,3.22),p(w/2-.20,half-.54,h-.06),p(-w/2+.20,half-.54,h-.06)];
   glass.push({corners:upper,normal:f,right:r,width:w-.25,height:.90,variant:4});for(let i=0;i<4;i++)mesh.tube(upper[i],upper[(i+1)%4],.046,'#b7b7a5');
  }
  // Thin parking asphalt follows the measured OSM curb where rendered lane
  // widths were estimated. It never covers the raised sidewalk or crosswalk.
  const edge=w/2+bus.standOff;
  asphalt.quad(p(-w/2-.30,-half-.5,-.016),p(edge-.025,-half-.5,-.016),p(edge-.025,half+.5,-.016),p(-w/2-.30,half+.5,-.016),'#39434c');
  for(let y=-half+.3;y<half;y+=1.1)mesh.box(p(edge-.03,y,.004),r,f,.07,.60,.007,'#bca15e');
  shadows.quad(p(-w/2-.18,-half-.16,-.009),p(w/2+.18,-half-.16,-.009),p(w/2+.18,half+.16,-.009),p(-w/2-.18,half+.16,-.009),'#040b11a0');
  pools.push({center:p(0,half+1.9,-.010),normal:UP,right:r,up:f,width:4.0,height:4.0});
  night.lights.push({position:p(0,0,2.5).toArray(),radius:[8,8,5],color:[.055,.07,.08]});
  // NYC-style curb pole: bus pictogram, red parking restriction, blue route
  // panels, and a framed information case. Printed signs are not live feeds.
  const pole=new Vector3(...bus.pole),sp=(x,y,z)=>pole.clone().addScaledVector(r,x).addScaledVector(f,y).addScaledVector(UP,z),signN=r.clone().negate(),signR=f.clone().negate();
  mesh.tube(sp(0,0,0),sp(0,0,3.78),.045,'#879994',true,12);mesh.tube(sp(0,0,0),sp(0,0,.13),.13,'#485b65',true,16);
  mesh.tube(sp(-.023,0,3.49),sp(.023,0,3.49),.36,city?'#15577d':tour?'#843d36':'#58653a',false,32);
  const signFace=(z,ww,hh,kind)=>({center:sp(-.04,0,z),normal:signN,right:signR,width:ww,height:hh,kind,bus});
  labels.push(signFace(3.49,.58,.58,'stop-icon'));
  mesh.box(sp(0,0,2.72),f,r,.57,.065,.94,'#d4d9d1');labels.push(signFace(2.72,.53,.90,'stop-routes'));
  mesh.box(sp(0,0,1.68),f,r,.44,.085,.83,'#657b86');labels.push(signFace(1.68,.385,.765,'info'));
  // Reverse panels allow the stop to read naturally from both approaches.
  for(const z of [2.72,3.49]){const front=labels.findLast(t=>t.kind===(z===2.72?'stop-routes':'stop-icon')&&t.bus===bus);labels.push({...front,center:sp(.052,0,z),normal:r.clone(),right:f.clone()});}
  polePositions.push(pole);
 }
 return {batches:mesh.batches,emissive:emissive.batches,asphalt:asphalt.batches,shadows:shadows.batches,collision:new Float32Array(mesh.collision),glass,labels,pools,polePositions,night,buses:BUS_STOPS};
}
