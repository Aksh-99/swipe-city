import {Vector3} from 'three';
import {DetailMesh} from './detail-mesh.js';
import {steelCylinder} from './curb-bollard-geometry.js';
import {STREET_VENDORS} from './street-vendor-config.js';
import {NASDAQ} from './nasdaq-config.js';

const UP=new Vector3(0,0,1),X=new Vector3(1,0,0),Y=new Vector3(0,1,0);
// Reused by the W43 food-cart row; original Nasdaq dimensions are unchanged.
export {cart as addVendorCart,umbrella as addVendorUmbrella,wheel as addVendorWheel,bottle as addVendorBottle,oval as vendorOval,label as addVendorLabel};
function axes(item){const c=new Vector3(...item.position),n=new Vector3(...item.normal),r=new Vector3(-n.y,n.x,0);return {c,n,r,p:(x,y,z)=>c.clone().addScaledVector(r,x).addScaledVector(n,y).addScaledVector(UP,z)};}
const face=(center,normal,right,width,height,extra={})=>({center,normal,right,width,height,...extra});
function oval(mesh,p,c,scale,color,sides=12,rows=6){
 const points=[];for(let j=0;j<=rows;j++)for(let i=0;i<sides;i++){const a=i*Math.PI*2/sides,b=j*Math.PI/rows;points.push(p(c[0]+Math.cos(a)*Math.sin(b)*scale[0],c[1]+Math.sin(a)*Math.sin(b)*scale[1],c[2]+Math.cos(b)*scale[2]));}
 const triangles=[];for(let j=0;j<rows;j++)for(let i=0;i<sides;i++){const a=j*sides+i,b=j*sides+(i+1)%sides;if(j>0)triangles.push([a,b,a+sides]);if(j<rows-1)triangles.push([b,b+sides,a+sides]);}mesh.emit(points,triangles,color);
}
function label(mesh,labels,point,n,r,w,h,kind,extra={}){
 mesh.box(point,r,n,w+.035,.045,h+.035,'#253339',true);
 labels.push(face(point.clone().addScaledVector(n,.026),n,r,w,h,{kind,...extra}));
}
function wheel(mesh,p,r,n,x,y,radius,side){
 const z=radius+.015;mesh.tube(p(x,y-.048,z),p(x,y+.048,z),radius,'#192027',false,24);
 mesh.tube(p(x,y+side*.049,z),p(x,y+side*.058,z),radius*.66,'#9caaad',false,20);
 mesh.tube(p(x,y+side*.06,z),p(x,y+side*.063,z),radius*.49,'#46545b',false,16);
 for(let a=0;a<Math.PI*2;a+=Math.PI/4)mesh.tube(p(x,y+side*.066,z),p(x+Math.cos(a)*radius*.49,y+side*.066,z+Math.sin(a)*radius*.49),.013,'#b6c1c1');
 mesh.tube(p(x,y+side*.067,z),p(x,y+side*.092,z),radius*.16,'#c4cdcb',false,12);
}
function bottle(mesh,p,x,y,z,color){
 mesh.tube(p(x,y,z),p(x,y,z+.15),.035,color,false,10);
 oval(mesh,p,[x,y,z+.15],[.035,.035,.035],color,10,4);
 mesh.tube(p(x,y,z+.17),p(x,y,z+.21),.015,'#ede1b8',false,8);
}
function pretzel(mesh,p,x,y,z){
 const curve=(points)=>{for(let i=1;i<points.length;i++)mesh.tube(p(...points[i-1]),p(...points[i]),.022,'#b56e30',false,7);};
 const loop=[];for(let i=0;i<=20;i++){const a=i*Math.PI*2/20;loop.push([x+Math.cos(a)*.115,y,z+Math.sin(a)*.14]);}curve(loop);
 curve([[x-.1,y,z-.08],[x+.085,y-.015,z+.07],[x+.03,y-.02,z+.12],[x-.03,y-.02,z+.12],[x-.085,y-.015,z+.07],[x+.1,y,z-.08]]);
 for(let i=0;i<10;i++){const a=i*2.399;oval(mesh,p,[x+Math.cos(a)*.113,y+.022,z+Math.sin(a)*.137],[.007,.007,.007],'#d4c7aa',5,3);}
}
function umbrella(mesh,emissive,labels,shadow,item){
 const {p,n,r}=axes(item),colors=item.colors==='blue-yellow'?['#d6aa2a','#1b5796']:item.colors==='red-white'?['#bf4c42','#d1cec0']:['#dca925','#a3382f'];
 const radius=item.canopyRadius,segments=10;
 mesh.tube(p(0,-.18,1.08),p(0,-.18,2.92),.029,'#b4c0c1',false,12);
 const ring=(a,rad,z)=>p(Math.cos(a)*rad,-.18+Math.sin(a)*rad,z);
 for(let i=0;i<segments;i++){
  const a=i*Math.PI*2/segments,b=(i+1)*Math.PI*2/segments,color=colors[i%2];
  // Slightly bowed fabric panels, with a scalloped valance and sewn seams.
  for(let j=0;j<3;j++){
   const u=a+(b-a)*j/3,v=a+(b-a)*(j+1)/3,edgeU=2.34-.028*Math.sin(j/3*Math.PI),edgeV=2.34-.028*Math.sin((j+1)/3*Math.PI);
   mesh.quad(ring(u,.11,2.92),ring(v,.11,2.92),ring(v,radius,edgeV),ring(u,radius,edgeU),color,true);
   mesh.quad(ring(u,radius,edgeU),ring(v,radius,edgeV),ring(v,radius,edgeV-.15),ring(u,radius,edgeU-.15),color);
   mesh.quad(ring(u,radius*.98,edgeU-.018),ring(v,radius*.98,edgeV-.018),ring(v,.11,2.90),ring(u,.11,2.90),i%2?'#6a7370':'#9b936d');
  }
  mesh.tube(ring(a,.11,2.92),ring(a,radius,2.34),.006,'#e0d9bc');
  mesh.tube(p(0,-.18,2.27),ring(a,.93,2.50),.011,'#9cabad');mesh.tube(ring(a,.11,2.88),ring(a,radius-.02,2.30),.009,'#9cabad');
  shadow.emit([p(0,-.18,.011),ring(a,radius,.011),ring(b,radius,.011)],[[0,1,2]],'#080e1938');
 }
 oval(mesh,p,[0,-.18,2.94],[.15,.15,.043],colors[0],12,4);
 const text=item.kind==='nuts'?'nuts-valance':'hotdog-valance';
 // Small branded valance panels sit below the fabric, not giant flat signs.
 labels.push(face(p(0,1.235,2.245),n,r,.84,.12,{kind:text,scheme:item.colors}));
 for(const x of [-.69,0,.69])oval(emissive,p,[x,.06,2.11],[.025,.025,.035],'#ead8b1',8,5);
}
function cart(mesh,emissive,glass,labels,shadow,item){
 const {p,r,n}=axes(item),w=item.width,half=w/2,box=(x,y,z,dx,dy,dz,color,solid=false)=>mesh.box(p(x,y,z),r,n,dx,dy,dz,color,solid);
 box(0,0,.35,w+.03,.92,.13,'#495960',true);
 box(0,0,.74,w,.86,.76,'#98a6aa',true);
 // Brushed sheet-metal panels, folded edges, hinges, service doors and bolts.
 for(const side of [-1,1]){
  for(let i=0;i<14;i++)box(-half+(i+.5)*w/14,side*.438,.76,w/14,.012,.69,['#93a2a7','#a3b0b2','#87979e','#b3bcba'][i%4]);
  for(const x of [-half+.025,0,half-.025])box(x,side*.45,.76,.026,.025,.74,'#4c626d');
  box(0,side*.46,.93,.17,.04,.031,'#bac5c4');
  box(0,side*.46,.76,w-.1,.025,.020,'#c1cac5');
  for(const x of [-half+.08,half-.08])for(const z of [.43,1.06])oval(mesh,p,[x,side*.457,z],[.012,.009,.012],'#d0d6ce',6,4);
 }
 box(0,0,1.145,w+.15,1.05,.09,'#c2cac5',true);box(0,.52,1.19,w+.13,.045,.043,'#778d97');
 box(0,-.49,1.26,w+.12,.035,.21,'#a7b7b8');
 for(const side of [-1,1]){
  wheel(mesh,p,r,n,-.54,side*.50,.225,side);
  wheel(mesh,p,r,n,.66,side*.43,.10,side);
  box(.66,side*.43,.22,.07,.10,.16,'#9facae');
  mesh.tube(p(-.73,side*.53,.78),p(-.73,side*.53,1.04),.022,'#b6c3c4');
 }
 mesh.tube(p(-.73,-.54,1.04),p(-.73,.54,1.04),.024,'#c7cfca');
 box(half+.04,0,.80,.075,.65,.52,'#414e56');
 for(let z=.58;z<1.04;z+=.045)box(half+.086,0,z,.022,.60,.015,'#a7b3b6');
 // Utility crate and a water jug are contained at the cart's rear corner.
 box(-.68,-.64,.19,.38,.30,.36,'#7c2928',true);for(let z=.10;z<.33;z+=.073)box(-.68,-.798,z,.33,.02,.017,'#3c282d');
 oval(mesh,p,[-.70,-.64,.51],[.083,.066,.15],'#d6d8c7',10,6);mesh.tube(p(-.7,-.64,.63),p(-.7,-.64,.68),.029,'#dce0d3');
 const nut=item.kind==='nuts';
 // Glass serving/display case with visible food and stainless steam trays.
 for(const x of [-.78,.78])for(const y of [-.34,.37])mesh.tube(p(x,y,1.18),p(x,y,2.06),.021,'#bdc9c8');
 box(0,0,2.045,1.67,.80,.065,'#8b9fa7');box(0,.40,1.45,1.65,.025,.028,'#c0ccca');
 glass.push(face(p(0,.386,1.75),n,r,1.52,.48));
 for(const side of [-1,1])glass.push(face(p(side*.79,.02,1.61),r.clone().multiplyScalar(side),n.clone().multiplyScalar(-side),.68,.77));
 for(const x of [-.45,.12]){
  box(x,.05,1.225,.45,.59,.056,'#273a40');box(x,.05,1.252,.38,.52,.019,nut?'#8a5b32':'#6f858b');
  for(const sx of [-1,1])box(x+sx*.212,.05,1.26,.027,.59,.031,'#d0d5c9');
  for(const sy of [-1,1])box(x,.05+sy*.282,1.26,.45,.028,.031,'#cad2cb');
  if(nut){for(let i=0;i<22;i++){const dx=Math.sin(i*17.31)*.155,dy=Math.cos(i*9.72)*.22;oval(mesh,p,[x+dx,.05+dy,1.285+(i%4)*.012],[.026,.018,.022],['#a36c30','#bd873b','#805326'][i%3],6,4);}}
  else for(let i=0;i<3;i++){
   const y=-.12+i*.15;oval(mesh,p,[x,y,1.29],[.17,.062,.047],'#cb9650');
   oval(mesh,p,[x,y,1.327],[.155,.028,.025],'#99492b');
   for(let k=0;k<7;k++)mesh.tube(p(x-.12+k*.034,y+Math.sin(k*2)*.011,1.35),p(x-.086+k*.034,y+Math.sin((k+1)*2)*.011,1.35),.005,'#d7b237',false,6);
  }
 }
 for(const [i,color]of ['#b7382d','#d5ac2f','#d2d0af'].entries())bottle(mesh,p,.58,-.2+i*.15,1.19,color);
 if(!nut)for(const x of [-.45,-.12,.22]){mesh.tube(p(x,-.32,1.93),p(x,-.32,1.76),.005,'#cbd2c4');pretzel(mesh,p,x,-.31,1.64);}
 else{box(.49,.11,1.235,.22,.31,.047,'#bec9c7');mesh.tube(p(.55,.06,1.26),p(.65,-.03,1.32),.016,'#c4cfca');}
 label(mesh,labels,p(0,.475,.71),n,r,1.46,.62,nut?'nuts-apron':'hotdog-apron',{scheme:item.colors});
 label(mesh,labels,p(-.96,.31,1.66),n,r,.46,.83,nut?'nuts-menu':'hotdog-menu',{scheme:item.colors});
 label(mesh,labels,p(.96,.31,1.66),n,r,.46,.83,nut?'nuts-menu':'drink-menu',{scheme:item.colors});
 label(mesh,labels,p(0,.416,1.98),n,r,1.46,.21,nut?'nuts-heading':'hotdog-heading',{scheme:item.colors});
 // A side menu faces down the plaza as well as the customer-facing counter.
 label(mesh,labels,p(half+.055,-.05,.78),r,n.clone().negate(),.64,.57,nut?'nuts-side':'hotdog-side',{scheme:item.colors});
 umbrella(mesh,emissive,labels,shadow,item);
 return {position:new Vector3(...item.position),normal:n,right:r,width:w,depth:.88,canopyRadius:item.canopyRadius};
}
function bin(mesh,labels,item){
 const {p,n,r}=axes(item),w=.66,d=.69;
 mesh.box(p(0,0,.60),r,n,w,d,1.12,'#263b39',true);mesh.box(p(0,0,.10),r,n,w+.025,d+.025,.16,'#18282a');
 const color=item.kind==='bottles'?'#2d6b91':item.kind==='paper'?'#487353':'#435c57';
 mesh.box(p(0,.357,.62),r,n,.56,.026,.80,'#485e59');mesh.box(p(0,.378,.62),r,n,.48,.020,.72,'#15292c');
 mesh.box(p(0,.383,1.025),r,n,.48,.055,.14,'#0b191e');
 for(let i=0;i<12;i++){const a=i*Math.PI/12,b=(i+1)*Math.PI/12;mesh.quad(p(-w/2,-Math.cos(a)*d/2,1.15+Math.sin(a)*.20),p(w/2,-Math.cos(a)*d/2,1.15+Math.sin(a)*.20),p(w/2,-Math.cos(b)*d/2,1.15+Math.sin(b)*.20),p(-w/2,-Math.cos(b)*d/2,1.15+Math.sin(b)*.20),color);}
 for(const x of [-.27,.27])mesh.tube(p(x,.40,.16),p(x,.40,1.17),.018,'#6e8784');
 label(mesh,labels,p(0,.40,.87),n,r,.50,.13,`bin-${item.kind}`);
 label(mesh,labels,p(0,.402,.49),n,r,.48,.54,'bin-poster',{art:item.kind==='trash'?0:item.kind==='bottles'?1:2});
}

export function createStreetVendorGeometry(){
 const mesh=new DetailMesh(),emissive=new DetailMesh(),shadow=new DetailMesh(),paving=new DetailMesh(),glass=[],labels=[],carts=[],posts=[],pools=[];
 const data=STREET_VENDORS;
 for(let i=1;i<data.paving.length;i++){
  const a=data.paving[i-1],b=data.paving[i],corners=[a.a,a.b,b.b,b.a].map(p=>new Vector3(...p));
  paving.quad(...corners,null,true);
  // Keep the visible skin slightly above the existing OSM sidewalk to avoid
  // coplanar flicker; collision retains the actual 17 cm walking surface.
  paving.quad(...corners.map(p=>p.clone().addScaledVector(UP,.006)),'#a7abae');
  paving.quad(new Vector3(...a.b).setZ(0),new Vector3(...b.b).setZ(0),new Vector3(...b.b),new Vector3(...a.b),'#737e88',true);
 }
 for(const item of data.carts){carts.push(cart(mesh,emissive,glass,labels,shadow,item));const {p,r,n}=axes(item);pools.push(face(p(0,.10,.016),UP,r,4.8,4.2,{up:n}));}
 for(const post of data.posts){
  const p=new Vector3(...post.position),n=new Vector3(...post.normal);steelCylinder(mesh,p,n);
  // Three narrow polished collars distinguish the reference's plaza posts.
  for(const z of [.82,.91,1.0]){mesh.tube(p.clone().addScaledVector(UP,z),p.clone().addScaledVector(UP,z+.033),.185,'#cbd4d1',false,32);mesh.tube(p.clone().addScaledVector(UP,z-.014),p.clone().addScaledVector(UP,z),.172,'#536c79',false,32);}
  posts.push({position:p,normal:n});
 }
 for(const item of data.bins)bin(mesh,labels,item);
 // Dress the existing OSM crossing pole. Its live pedestrian signal remains
 // controlled by the existing signal cycle; no duplicate frozen signal head.
 const pole=data.pole,{p,n,r}=axes(pole);
 const base=[];for(const [z,rad]of [[.02,.29],[.17,.27],[.51,.18],[.62,.11]])for(let i=0;i<8;i++){const a=i*Math.PI/4;base.push(p(Math.cos(a)*rad,Math.sin(a)*rad,z));}
 const faces=[];for(let j=0;j<3;j++)for(let i=0;i<8;i++){const a=j*8+i,b=j*8+(i+1)%8;faces.push([a,b,b+8],[a,b+8,a+8]);}mesh.emit(base,faces,'#718087',true);
 for(const side of [-1,1])mesh.box(p(side*.12,.20,.30),r,n,.046,.035,.046,'#a0adac');
 mesh.tube(p(0,0,3.88),p(0,0,6.7),.073,'#8d9ca0',true,12);
 for(const z of [4.1,4.8,6.45])mesh.tube(p(0,0,z),p(0,0,z+.038),.092,'#b5c0bf');
 label(mesh,labels,p(0,.10,4.7),n,r,.48,.59,'no-standing');
 mesh.tube(p(0,0,6.42),p(0,.21,6.88),.047,'#a7b2b1');mesh.tube(p(0,.21,6.88),p(0,.57,6.88),.042,'#a7b2b1');
 oval(mesh,p,[0,.63,6.86],[.25,.31,.09],'#798b93',14,6);oval(emissive,p,[0,.65,6.78],[.13,.20,.019],'#cbdad2',12,4);
 mesh.box(p(0,-.15,1.36),r,n,.18,.13,.32,'#4b6567');
 const night={frontNormal:NASDAQ.normal,lights:data.carts.map(c=>({position:[c.position[0],c.position[1],2.1],radius:[3.1,3.1,2.7],color:[.27,.22,.15]}))};
 night.lights.push({position:[...NASDAQ.center.slice(0,2),9],radius:[18,18,20],color:[.04,.08,.13]});
 const collision=new Float32Array([...mesh.collision,...paving.collision]);
 return {batches:mesh.batches,emissive:emissive.batches,shadow:shadow.batches,paving:paving.batches,collision,glass,labels,carts,posts,pools,night};
}
