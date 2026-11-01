// Scenic civilian exteriors reuse the detailed vehicle construction; no police markings or transport interaction.
import {Vector3} from 'three';
import {DetailMesh} from './detail-mesh.js';

const UP=new Vector3(0,0,1),WHITE='#d8dddc',BLUE='#16517e',BLACK='#14232c',STEEL='#81939c';
export function civilianVehicleAxes(car){
 const c=new Vector3(...car.center),f=new Vector3(...car.forward),r=new Vector3(...car.right);
 return {c,f,r,p:(x,y,z)=>c.clone().addScaledVector(r,x).addScaledVector(f,y).addScaledVector(UP,z)};
}
function loft(mesh,rings,color,solid=false){
 for(let j=1;j<rings.length;j++)for(let i=0;i<rings[j].length;i++){const next=(i+1)%rings[j].length;mesh.quad(rings[j-1][i],rings[j-1][next],rings[j][next],rings[j][i],color,solid);}
 for(const ring of [rings[0],rings.at(-1)]){
  const center=ring.reduce((sum,p)=>sum.add(p),new Vector3()).divideScalar(ring.length);
  for(let i=0;i<ring.length;i++)mesh.emit([center,ring[i],ring[(i+1)%ring.length]],[[0,1,2]],color,solid);
 }
}
function sideArch(car,y){
 let z=.25;for(const axle of car.axles){const d=y-axle,r=car.wheelRadius+.073;if(Math.abs(d)<r)z=Math.max(z,car.wheelRadius-.025+Math.sqrt(r*r-d*d));}return z;
}
function bodyRing(car,p,y,arch=true){
 const half=car.length/2,t=Math.min(1,(half-Math.abs(y))/.34),w=car.width*(.83+.17*t)/2;
 const front=y>car.axles[1]?Math.max(0,(y-car.axles[1])/(half-car.axles[1])):0;
 const rear=y<car.axles[0]?Math.max(0,(car.axles[0]-y)/(half+car.axles[0])):0;
 const top=car.belt-.14*front-.12*rear,base=arch?sideArch(car,y):.25;
 return [[-w*.82,.23],[w*.82,.23],[w,base],[w,Math.max(base+.015,top-.11)],[w*.92,top],[0,top+.036],[-w*.92,top],[-w,Math.max(base+.015,top-.11)],[-w,base]].map(([x,z])=>p(x,y,z));
}
function wheel(mesh,p,car,side,y){
 const radius=car.wheelRadius,z=radius-.025,outer=side*(car.width/2+.035),inner=side*(car.width/2-.19),count=32;
 const ring=(x,r)=>Array.from({length:count},(_,i)=>{const a=i/count*Math.PI*2;return p(x,y+Math.cos(a)*r,z+Math.sin(a)*r);});
 loft(mesh,[ring(inner,radius*.86),ring(side*(car.width/2-.12),radius),ring(outer,radius*.96)],'#11191e');
 // Recessed steel wheel, machined rim lip, spokes, lug nuts and tread bands.
 const face=outer+side*.012;mesh.tube(p(face-side*.025,y,z),p(face,y,z),radius*.70,'#28343c',false,32);
 loft(mesh,[ring(face,radius*.71),ring(face+side*.014,radius*.74),ring(face+side*.027,radius*.68)],'#b1bfc2');
 for(let j=0;j<8;j++){
  const a=j*Math.PI/4,c=Math.cos(a),s=Math.sin(a),v1=p(face+side*.031,y+c*radius*.20,z+s*radius*.20),v2=p(face+side*.031,y+c*radius*.64,z+s*radius*.64);
  mesh.tube(v1,v2,radius*.065,STEEL,false,6);
 }
 mesh.tube(p(face+side*.035,y,z),p(face+side*.060,y,z),radius*.23,'#a4b2b6',false,20);
 for(let j=0;j<5;j++){const a=j*Math.PI*2/5;mesh.tube(p(face+side*.06,y+Math.cos(a)*radius*.16,z+Math.sin(a)*radius*.16),p(face+side*.074,y+Math.cos(a)*radius*.16,z+Math.sin(a)*radius*.16),.014,'#d3d9d8',false,6);}
 for(let j=0;j<24;j++){
  const a=j*Math.PI*2/24,b=a+.08;
  mesh.tube(p(inner+side*.035,y+Math.cos(a)*radius*.999,z+Math.sin(a)*radius*.999),p(outer-side*.04,y+Math.cos(b)*radius*.989,z+Math.sin(b)*radius*.989),.007,'#2b3336',false,4);
 }
 for(let j=0;j<28;j++){
  const a=j/28*Math.PI,b=(j+1)/28*Math.PI,rad=radius+.064;
  mesh.tube(p(side*(car.width/2+.007),y+Math.cos(a)*rad,z+Math.sin(a)*rad),p(side*(car.width/2+.007),y+Math.cos(b)*rad,z+Math.sin(b)*rad),.026,car.type==='sedan'?WHITE:'#43525a',false,6);
 }
}
export function createCivilianCarGeometry(vehicles){
 const mesh=new DetailMesh(),physical=new DetailMesh(),lamps=new DetailMesh(),shadows=new DetailMesh(),glass=[],labels=[];
 const night={frontNormal:[0,1,0],lights:[]};
 for(const [index,car]of vehicles.entries()){
  const {p,f,r}=civilianVehicleAxes(car),w=car.width,l=car.length,half=l/2,cabin=car.cabin,base=car.belt-.025,top=cabin.roof;
  const box=(x,y,z,dx,dy,dz,color,target=mesh)=>target.box(p(x,y,z),r,f,dx,dy,dz,color);
  const sideFace=(side,y,z,width,height,extra={})=>({center:p(side*(w/2+.018),y,z),normal:r.clone().multiplyScalar(side),right:f.clone().multiplyScalar(side),width,height,car,...extra});
  const face=(corners,extra={})=>{
   const normal=new Vector3().crossVectors(corners[1].clone().sub(corners[0]),corners[3].clone().sub(corners[0])).normalize();
   return {corners,normal,right:corners[1].clone().sub(corners[0]).normalize(),width:corners[0].distanceTo(corners[1]),height:corners[0].distanceTo(corners[3]),car,...extra};
  };
  const sections=Array.from({length:49},(_,i)=>-half+.035+(l-.07)*i/48);
  loft(mesh,sections.map(y=>bodyRing(car,p,y)),car.paint??WHITE);
  loft(physical,Array.from({length:9},(_,i)=>bodyRing(car,p,-half+.045+(l-.09)*i/8,false)),null,true);
  box(0,0,.25,w-.28,l-.35,.085,BLACK);
  const cabinPoints=[p(-w*.43,cabin.rear,base),p(w*.43,cabin.rear,base),p(w*.43,cabin.front,base),p(-w*.43,cabin.front,base),p(-w*.36,cabin.roofRear,top),p(w*.36,cabin.roofRear,top),p(w*.36,cabin.roofFront,top),p(-w*.36,cabin.roofFront,top)];
  const faces=[[0,1,5],[0,5,4],[1,2,6],[1,6,5],[2,3,7],[2,7,6],[3,0,4],[3,4,7],[4,5,6],[4,6,7]];
  mesh.emit(cabinPoints,faces,car.paint??WHITE);physical.emit(cabinPoints,faces,null,true);
  // Slightly crowned roof and a discreet rear spoiler distinguish silhouettes.
  loft(mesh,[-1,0,1].map(k=>[-1,0,1].map(j=>p(j*w*.36,cabin.roofRear+(cabin.roofFront-cabin.roofRear)*(k+1)/2,top+.045*(1-j*j)))),car.paint??WHITE);
  if(car.type!=='van')box(0,cabin.rear-.09,car.belt+.056,w*.74,.17,.042,'#a5b6bd');
  const xAt=(side,z)=>side*w*(.43-.07*(z-base)/(top-base));
  for(const side of [-1,1]){
   if(car.panel&&car.paint==='#2760a1')box(side*w*.425,-.85,1.63,.018,2.35,.82,'#e6e8e3');
   wheel(mesh,p,car,side,car.axles[0]);wheel(mesh,p,car,side,car.axles[1]);
   const lowerZ=base+.075,upperZ=top-.105;
   const bottomRear=cabin.rear+.14,bottomFront=cabin.front-.13,roofRear=cabin.roofRear+.12,roofFront=cabin.roofFront-.12;
   for(let pane=0;pane<car.windows;pane++){
    if(car.panel&&pane<car.windows-1)continue;
    const a=pane/car.windows+.013,b=(pane+1)/car.windows-.013;
    const mix=(a,b,t)=>a+(b-a)*t,lowA=mix(bottomRear,bottomFront,a),lowB=mix(bottomRear,bottomFront,b),highA=mix(roofRear,roofFront,a),highB=mix(roofRear,roofFront,b);
    const corners=[p(xAt(side,lowerZ)+side*.011,side>0?lowA:lowB,lowerZ),p(xAt(side,lowerZ)+side*.011,side>0?lowB:lowA,lowerZ),p(xAt(side,upperZ)+side*.013,side>0?highB:highA,upperZ),p(xAt(side,upperZ)+side*.013,side>0?highA:highB,upperZ)];
    glass.push(face(corners,{variant:(pane+index)%4}));for(let j=0;j<4;j++)mesh.tube(corners[j],corners[(j+1)%4],.018,'#344750',false,6);
   }
   // Door panel creases, separate handles, rocker trim and blue double stripe.
   for(const y of [cabin.rear+.08,-.12,cabin.front-.06])mesh.tube(p(side*(w/2+.006),y,Math.max(.44,sideArch(car,y)+.025)),p(side*(w/2+.006),y,base),.007,'#7c929d',false,5);
   box(side*(w/2+.014),0,.46,.02,l-.60,.032,'#667d89');
   for(const y of [-.50,.62]){box(side*(w/2+.025),y,base-.08,.04,.20,.045,BLACK);box(side*(w/2+.048),y,base-.075,.01,.14,.018,'#a1b4bd');}
   // The two blue stripes sit below the large door text, with a thin white gap.
   const mirrorY=cabin.front-.16,mirrorZ=base+.21;
   mesh.tube(p(side*w*.43,mirrorY,mirrorZ),p(side*(w/2+.14),mirrorY+.07,mirrorZ-.035),.035,BLACK,false,8);
   loft(mesh,[-.08,.08].map(y=>[[0,-.075],[.14,-.060],[.16,.048],[.05,.077]].map(([x,z])=>p(side*(w/2+.08+x),mirrorY+y,mirrorZ+z))),BLACK);
   const mirrorCorners=[p(side*(w/2+.09),mirrorY-.086,mirrorZ-.052),p(side*(w/2+.21),mirrorY-.086,mirrorZ-.052),p(side*(w/2+.22),mirrorY-.086,mirrorZ+.045),p(side*(w/2+.10),mirrorY-.086,mirrorZ+.048)];
   glass.push(face(mirrorCorners,{variant:2}));
   // Front/rear reflectors and a cool-white daytime lamp strip remain subdued.
   box(side*w*.36,half-.008,.71,w*.20,.066,.18,BLACK);
   box(side*w*.36,half+.035,.78,w*.19,.013,.035,'#a4c4d0',lamps);
   for(const dx of [-.075,.075])mesh.tube(p(side*w*.36+dx,half+.031,.70),p(side*w*.36+dx,half+.05,.70),.052,'#9fb5bc',false,14);
   box(side*w*.37,-half+.005,.78,w*.17,.068,.20,'#52272c');
   box(side*w*.37,-half-.034,.82,w*.14,.015,.035,'#923833',lamps);
   box(side*w*.47,half-.22,.64,.015,.12,.048,'#a27c47',lamps);
  }
  const windshield=[p(-w*.405,cabin.front+.014,base+.075),p(w*.405,cabin.front+.014,base+.075),p(w*.343,cabin.roofFront+.014,top-.092),p(-w*.343,cabin.roofFront+.014,top-.092)];
  glass.push(face(windshield,{variant:1}));for(let j=0;j<4;j++)mesh.tube(windshield[j],windshield[(j+1)%4],.023,BLACK,false,8);
  for(const side of [-1,1])mesh.tube(p(side*.60,cabin.front+.03,base+.09),p(side*.21,cabin.front-.065,base+.31),.012,'#24343e',false,6);
  const rearWindow=[p(w*.403,cabin.rear-.015,base+.09),p(-w*.403,cabin.rear-.015,base+.09),p(-w*.343,cabin.roofRear-.015,top-.12),p(w*.343,cabin.roofRear-.015,top-.12)];
  glass.push(face(rearWindow,{variant:3}));for(let j=0;j<4;j++)mesh.tube(rearWindow[j],rearWindow[(j+1)%4],.02,BLACK,false,6);
  // Front grille, bumper trims, fog-light recesses and licence-plate frames.
  box(0,half-.005,.72,w*.47,.072,.235,BLACK);
  for(let z=.635;z<=.805;z+=.043)box(0,half+.035,z,w*.44,.012,.012,'#8299a5');
  for(const y of [-half+.06,half-.06]){box(0,y,.43,w*.84,.20,.15,'#3b4e59');box(0,y+(y>0?.103:-.103),.48,w*.73,.02,.025,'#96a9b0');}
  for(const end of [-1,1]){
   box(0,end*(half+.059),.56,.40,.014,.17,BLACK);
   labels.push({center:p(0,end*(half+.071),.56),normal:f.clone().multiplyScalar(end),right:r.clone().multiplyScalar(-end),width:.36,height:.13,car,kind:'plate'});
  }
  const hoodZ=y=>car.belt-.14*Math.max(0,(y-car.axles[1])/(half-car.axles[1]))+.047;
  if(car.taxi){box(0,0,top+.12,.64,.38,.19,'#d4d1b5');box(0,0,top+.23,.58,.32,.03,'#252d30');for(const side of [-1,1]){mesh.tube(p(side*(w/2+.03),-.1,.88),p(side*(w/2+.05),-.1,.88),.18,'#18212a',false,20);box(side*(w/2+.07),-.1,.88,.015,.045,.25,'#e9c344');box(side*(w/2+.07),-.1,.99,.015,.17,.045,'#e9c344');}}
  shadows.quad(p(-w/2-.07,-half-.04,-.018),p(w/2+.07,-half-.04,-.018),p(w/2+.07,half+.04,-.018),p(-w/2-.07,half+.04,-.018),'#03090dd0');
  night.lights.push({position:p(0,0,1.4).toArray(),radius:[6,6,3.5],color:[.06,.075,.10]});
 }
 return {batches:mesh.batches,lamps:lamps.batches,shadows:shadows.batches,glass,labels,night,vehicles,collision:new Float32Array(physical.collision)};
}
