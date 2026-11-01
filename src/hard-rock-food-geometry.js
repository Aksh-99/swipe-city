import {Vector3} from 'three';
import {DetailMesh} from './detail-mesh.js';
import {steelCylinder} from './curb-bollard-geometry.js';
import {addVendorCart,addVendorUmbrella,addVendorWheel,addVendorBottle,vendorOval,addVendorLabel} from './street-vendor-geometry.js';
import {HARD_ROCK_FOOD_ROW as ROW} from './recruiting-config.js';
const UP=new Vector3(0,0,1);
const face=(center,normal,right,width,height,extra={})=>({center,normal,right,width,height,...extra});
function axes(item){const c=new Vector3(...item.position),n=new Vector3(...item.normal),r=new Vector3(-n.y,n.x,0);return {c,n,r,p:(x,y,z)=>c.clone().addScaledVector(r,x).addScaledVector(n,y).addScaledVector(UP,z)};}

function photoBoard(mesh,labels,photos,p,n,r,x,y,z,w,h,art){
 addVendorLabel(mesh,labels,p(x,y,z),n,r,w,h,'food-item',{art});
 photos.push(face(p(x,y+.028,z+h*.055),n,r,w*.90,h*.69,{art}));
}
function grillCart(mesh,emissive,glass,labels,photos,shadow,item){
 const {p,n,r}=axes(item),w=item.width,box=(x,y,z,dx,dy,dz,color,solid=false)=>mesh.box(p(x,y,z),r,n,dx,dy,dz,color,solid);
 box(0,0,.69,w,1.04,.82,'#8f9ea5',true);box(0,0,.32,w+.07,1.08,.13,'#475964',true);
 // Real sheet-metal construction: seams, access doors, hinges, bolts, a
 // ventilated end cabinet, folded counter edge and rubber wheels.
 for(const side of [-1,1]){
  for(let i=0;i<24;i++)box(-w/2+(i+.5)*w/24,side*.53,.72,w/24,.014,.70,['#9eafb5','#80959f','#b0bdbe','#96a8ad'][i%4]);
  for(let i=-1;i<=1;i++){
   const x=i*.98;box(x,side*.55,.72,.88,.031,.66,'#a3b2b6');
   box(x,side*.576,.99,.19,.055,.03,'#c7cfcb');
   for(const dx of [-.39,.39])for(const z of [.44,.97])vendorOval(mesh,p,[x+dx,side*.578,z],[.016,.009,.016],'#d3d8ce',6,4);
  }
  addVendorWheel(mesh,p,r,n,-1.02,side*.59,.26,side);addVendorWheel(mesh,p,r,n,1.12,side*.53,.145,side);
  box(1.12,side*.53,.26,.085,.10,.16,'#a7b6b9');
 }
 box(0,0,1.16,w+.19,1.23,.09,'#c4d0cc',true);box(0,.613,1.208,w+.19,.047,.049,'#859ca6');
 for(let z=.49;z<1.06;z+=.055)box(w/2+.022,0,z,.024,.86,.026,'#405965');
 for(const x of [-w/2+.035,w/2-.035])for(const y of [-.46,.49])mesh.tube(p(x,y,1.21),p(x,y,2.35),.029,'#c0cfce');
 box(0,0,2.36,w+.13,1.19,.11,'#889fa9');
 // A shallow awning with work lamps, instead of a flat cart-shaped decal.
 box(0,.02,2.44,w+.24,1.27,.067,'#b0bdbf');
 emissive.box(p(0,.07,2.289),r,n,2.52,.12,.030,'#dfe3cc');
 glass.push(face(p(0,.514,1.82),n,r,w-.12,.68));
 for(const side of [-1,1])glass.push(face(p(side*(w/2-.027),.02,1.80),r.clone().multiplyScalar(side),n.clone().multiplyScalar(-side),.93,1.04));
 for(const x of [-.85,-.17,.51]){
  box(x,.02,1.225,.54,.75,.05,'#354b55');
  box(x,.02,1.255,.47,.68,.024,x<0?'#92704b':'#688365');
  for(const side of [-1,1])box(x+side*.26,.02,1.283,.025,.75,.042,'#c7d0c9');
  for(let j=0;j<9;j++)vendorOval(mesh,p,[x+Math.sin(j*7)*.16,Math.cos(j*11)*.26,1.29+(j%2)*.023],[.058,.042,.025],x<-.5?'#be9560':x<0?'#855330':'#7d984f',7,4);
 }
 for(let i=0;i<4;i++)addVendorBottle(mesh,p,1.18,-.28+i*.17,1.22,['#c7bfac','#b3442d','#d2b93d','#d3c9b7'][i]);
 box(-1.08,-.63,.24,.45,.22,.44,'#485d66',true);box(.96,-.67,.18,.48,.27,.33,'#315a72',true);
 for(const x of [-.88,.88]){
  const umbrella={...item,kind:'hotdog',position:p(x,-.12,.28).toArray(),canopyRadius:1.30};
  addVendorUmbrella(mesh,emissive,labels,new DetailMesh(),umbrella);
 }
 addVendorLabel(mesh,labels,p(0,.66,2.535),n,r,2.99,.25,'grill-heading');
 for(const [x,art]of [[-1.21,0],[1.21,1]])photoBoard(mesh,labels,photos,p,n,r,x,.615,1.80,.59,.91,art);
 for(let i=0;i<4;i++)photoBoard(mesh,labels,photos,p,n,r,(i-1.5)*.70,.588,.70,.65,.67,i);
 // The rear and end carry menus too, matching a busy collage of cart boards.
 addVendorLabel(mesh,labels,p(0,-.573,.70),n.clone().negate(),r.clone().negate(),2.78,.65,'grill-apron');
 return {position:new Vector3(...item.position),normal:n,right:r,width:w,depth:1.23,canopyRadius:2.18};
}
function blueKiosk(mesh,emissive,glass,labels,photos,item){
 const {p,n,r}=axes(item),w=item.width,box=(x,y,z,dx,dy,dz,c,solid=false)=>mesh.box(p(x,y,z),r,n,dx,dy,dz,c,solid);
 box(0,0,.72,w,1.08,.88,'#235475',true);box(0,0,.28,w+.04,1.12,.13,'#334c5b',true);
 for(const x of [-w/2+.035,w/2-.035])for(const y of [-.48,.50])mesh.tube(p(x,y,.39),p(x,y,2.53),.027,'#bcc8c8');
 box(0,-.50,1.66,w,.05,1.15,'#15344b',true);
 for(const side of [-1,1]){
  addVendorWheel(mesh,p,r,n,-.66,side*.55,.18,side);addVendorWheel(mesh,p,r,n,.68,side*.55,.18,side);
  box(side*(w/2-.02),0,1.69,.04,1.08,1.14,'#29597b',true);
 }
 box(0,0,1.23,w+.17,1.2,.07,'#b8c9cd',true);
 box(0,0,2.60,w+.25,1.35,.16,'#205e91',true);box(0,.02,2.70,w+.17,1.25,.04,'#b1c1c6');
 for(let z=2.35;z<2.58;z+=.052)box(0,.551,z,w-.10,.028,.028,'#7b98a7');
 emissive.box(p(0,.15,2.30),r,n,w-.32,.11,.025,'#cfe3dc');
 glass.push(face(p(0,.53,1.78),n,r,w-.11,.88));
 // Stacked water bottles, cans and the open service shelf read at street level.
 for(let row=0;row<2;row++){
  box(0,-.19,1.34+row*.40,w-.20,.42,.035,'#829daa');
  for(let i=0;i<10;i++)addVendorBottle(mesh,p,-.84+i*.185,-.18,1.36+row*.40,['#5086a1','#527d84','#993f34'][i%3]);
 }
 addVendorLabel(mesh,labels,p(0,.706,2.59),n,r,w+.02,.21,'kiosk-heading');
 addVendorLabel(mesh,labels,p(0,.567,.72),n,r,w-.13,.67,'kiosk-apron');
 photoBoard(mesh,labels,photos,p,n,r,-.85,.60,1.92,.41,.67,2);
 photoBoard(mesh,labels,photos,p,n,r,.85,.60,1.92,.41,.67,3);
 return {position:new Vector3(...item.position),normal:n,right:r,width:w,depth:1.2,canopyRadius:0};
}
function cone(mesh,p,n,r){
 mesh.box(p,r,n,.34,.34,.045,'#253844',true);
 for(let i=0;i<5;i++){const z0=.026+i*.085,z1=z0+.085,r0=.133-i*.019,r1=r0-.019,vs=[];for(const [z,rad]of [[z0,r0],[z1,r1]])for(let j=0;j<12;j++)vs.push(p.clone().addScaledVector(r,Math.cos(j*Math.PI/6)*rad).addScaledVector(n,Math.sin(j*Math.PI/6)*rad).addScaledVector(UP,z));const fs=[];for(let j=0;j<12;j++){const k=(j+1)%12;fs.push([j,k,k+12],[j,k+12,j+12]);}mesh.emit(vs,fs,i===2||i===4?'#d9dbcb':'#d36c38',true);}
}
export function createHardRockFoodGeometry(){
 const mesh=new DetailMesh(),emissive=new DetailMesh(),paving=new DetailMesh(),shadow=new DetailMesh(),glass=[],labels=[],photoMenus=[],carts=[],posts=[],pools=[];
 for(let i=1;i<ROW.paving.length;i++){
  const a=ROW.paving[i-1],b=ROW.paving[i],corners=[a.a,a.b,b.b,b.a].map(v=>new Vector3(...v));paving.quad(...corners,null,true);
  paving.quad(...corners.map(p=>p.clone().addScaledVector(UP,.006)),'#a4a9ab');
  paving.quad(new Vector3(...a.b).setZ(0),new Vector3(...b.b).setZ(0),new Vector3(...b.b),new Vector3(...a.b),'#737e86',true);
 }
 for(const item of ROW.carts){
  carts.push(item.kind==='hotdog'?addVendorCart(mesh,emissive,glass,labels,shadow,item):item.kind==='grill'?grillCart(mesh,emissive,glass,labels,photoMenus,shadow,item):blueKiosk(mesh,emissive,glass,labels,photoMenus,item));
  const {p,n,r}=axes(item);pools.push(face(p(0,.22,.016),UP,r,item.width+1.6,3.1,{up:n}));
  if(item.kind==='hotdog')photoBoard(mesh,labels,photoMenus,p,n,r,0,.529,.72,1.41,.57,2);
 }
 for(const post of ROW.posts){const p=new Vector3(...post.position),n=new Vector3(...post.normal);steelCylinder(mesh,p,n);posts.push({position:p,normal:n});}
 const {p,n,r}=axes(ROW.carts[1]);
 // Small props sit in the vendor strip, outside the rear walking route.
 for(const x of [-2.18,2.20])cone(mesh,p(x,.1,.026),n,r);
 const ax=2.23,ay=-.19;
 for(const sx of [-.28,.28])for(const sy of [-.20,.20])mesh.tube(p(ax+sx,ay+sy,.025),p(ax+sx*.9,ay,1.03),.022,'#8f9da1');
 addVendorLabel(mesh,labels,p(ax,.04,.64),n,r,.49,.67,'grill-board');
 const night={frontNormal:ROW.normal,lights:ROW.carts.map(c=>({position:[c.position[0],c.position[1],2.1],radius:[3.5,3.5,3.2],color:[.24,.23,.19]}))};
 return {batches:mesh.batches,emissive:emissive.batches,shadow:shadow.batches,paving:paving.batches,collision:new Float32Array([...mesh.collision,...paving.collision]),glass,labels,photoMenus,carts,posts,pools,night,walkway:ROW.walkway.map(p=>new Vector3(...p))};
}
