import {Vector3} from 'three';
import {FontLoader} from 'three/addons/loaders/FontLoader.js';
import {TextGeometry} from 'three/addons/geometries/TextGeometry.js';
import fontData from 'three/examples/fonts/helvetiker_regular.typeface.json' with {type:'json'};
import {DetailMesh} from './detail-mesh.js';
import {steelCylinder} from './curb-bollard-geometry.js';
import {addScaffoldGeometry} from './streetscape-geometry.js';
import {NYPD_PLAZA} from './nypd-plaza-config.js';
const UP=new Vector3(0,0,1),X=new Vector3(1,0,0),Y=new Vector3(0,1,0);
const font=new FontLoader().parse(fontData),letterCache=new Map();
function axes(f){const c=new Vector3(...f.center),n=new Vector3(...f.normal),r=new Vector3(-n.y,n.x,0);return {c,n,r,p:(x,y,z)=>c.clone().addScaledVector(r,x).addScaledVector(n,y).setZ(z)};}
function face(p,n,r,w,h,extra={}){return {center:p,normal:n,right:r,width:w,height:h,...extra};}
function letterGeometry(text){if(!letterCache.has(text)){const g=new TextGeometry(text,{font,size:1,depth:.075,curveSegments:3,bevelEnabled:true,bevelThickness:.004,bevelSize:.004,bevelSegments:1});g.computeBoundingBox();letterCache.set(text,g);}return letterCache.get(text);}
function sign(mesh,p,width){
 const words=['N','EW','Y','ORK','P','OLICE','D','EPT'],parts=words.map((text,i)=>{const g=letterGeometry(text),h=i%2?.53:.83,b=g.boundingBox;return {g,b,h,w:(b.max.x-b.min.x)/(b.max.y-b.min.y)*h,blue:i%2===0,gap:i===7?0:i%2?.22:.035};});
 const total=parts.reduce((sum,g)=>sum+g.w+g.gap,0),scale=Math.min(1,width/total);let x=-total*scale/2;
 for(const part of parts){const {g,b,h,w,blue}=part,a=g.attributes.position,n=g.attributes.normal;
  for(let i=0;i<a.count;i+=3){const vs=[0,1,2].map(j=>p(x+(a.getX(i+j)-b.min.x)/(b.max.x-b.min.x)*w*scale,1.00+a.getZ(i+j),3.46+(a.getY(i+j)-b.min.y)/(b.max.y-b.min.y)*h*scale));mesh.emit(vs,[[0,1,2]],n.getZ(i)>.8?(blue?'#184afa':'#e4e8e5'):(blue?'#0c2377':'#717f89'));}
  x+=(w+part.gap)*scale;
 }
}
function railBarrier(mesh,center,along,length=2.4){
 const out=new Vector3(along.y,-along.x,0),p=(x,y,z)=>center.clone().addScaledVector(along,x).addScaledVector(out,y).addScaledVector(UP,z);
 for(const z of [.22,1.07])mesh.tube(p(-length/2,0,z),p(length/2,0,z),.028,'#c1cbce');
 for(const x of [-length/2,length/2]){
  mesh.tube(p(x,0,.08),p(x,0,1.05),.03,'#b2bfc3');
  mesh.tube(p(x,-.38,.035),p(x,.38,.035),.032,'#c7cdcc');
  mesh.tube(p(x,-.36,.035),p(x,0,.36),.022,'#8b9c9f');mesh.tube(p(x,.36,.035),p(x,0,.36),.022,'#d1d7d5');
 }
 for(let x=-length/2+.17;x<length/2-.08;x+=.17)mesh.tube(p(x,0,.23),p(x,0,1.045),.012,'#98a9ad');
 // Continuous thin panel collider avoids the capsule slipping through rods.
 mesh.box(p(0,0,.61),along,out,length,.055,1.0,null,true);
 mesh.box(p(0,0,.77),along,out,.44,.065,.20,'#41658a');
 return {center,along,length,normal:out};
}
function jersey(mesh,center,along,color){
 const n=new Vector3(along.y,-along.x,0),p=(x,y,z)=>center.clone().addScaledVector(along,x).addScaledVector(n,y).addScaledVector(UP,z),length=2.5;
 const section=[[-.37,.02],[.37,.02],[.37,.16],[.16,.58],[.16,.85],[-.16,.85],[-.16,.58],[-.37,.16]],vs=[];
 for(const x of [-length/2,length/2])for(const [y,z]of section)vs.push(p(x,y,z));
 const faces=[];for(let i=0;i<8;i++){const j=(i+1)%8;faces.push([i,j,8+j],[i,8+j,8+i]);if(i>0&&i<7)faces.push([0,i+1,i],[8,8+i,8+i+1]);}mesh.emit(vs,faces,color,true);
 for(const x of [-.75,.75])for(const side of [-1,1]){mesh.box(p(x,side*.169,.68),along,n,.30,.012,.08,'#dddac9');mesh.tube(p(x,side*.167,.40),p(x,side*.167,.75),.018,color==='#e8733d'?'#aa4826':'#939d9c');}
 mesh.tube(p(0,0,.85),p(0,0,.87),.08,'#606965',false,12);
}
function cafeChair(mesh,center,yaw){
 const r=new Vector3(Math.cos(yaw),-Math.sin(yaw),0),n=new Vector3(Math.sin(yaw),Math.cos(yaw),0),p=(x,y,z)=>center.clone().addScaledVector(r,x).addScaledVector(n,y).addScaledVector(UP,z);
 for(const x of [-.225,.225]){
  mesh.tube(p(x,-.24,.035),p(x,.22,.50),.017,'#b7c2c4');mesh.tube(p(x,.25,.035),p(x,-.19,.49),.017,'#d5dada');
  mesh.tube(p(x,-.19,.44),p(x,-.29,.90),.017,'#b5c1c5');mesh.tube(p(x,-.24,.035),p(x,-.20,.035),.024,'#414b50');
 }
 for(let i=0;i<5;i++)mesh.box(p(0,-.18+i*.081,.465),r,n,.48,.062,.032,i%2?'#846341':'#a18155');
 for(let i=0;i<3;i++)mesh.box(p(0,-.245-i*.018,.685+i*.073),r,n,.47,.029,.052,i%2?'#a58b60':'#8d7652');
 mesh.tube(p(-.23,.12,.10),p(.23,.12,.10),.013,'#9caaad');
 mesh.box(p(0,-.025,.48),r,n,.49,.48,.82,null,true);
}
function cafeTable(mesh,config,index){
 const center=new Vector3(...config.position),yaw=config.yaw,r=new Vector3(Math.cos(yaw),-Math.sin(yaw),0),n=new Vector3(Math.sin(yaw),Math.cos(yaw),0),p=(x,y,z)=>center.clone().addScaledVector(r,x).addScaledVector(n,y).addScaledVector(UP,z);
 mesh.box(p(0,0,.765),r,n,.82,.82,.045,'#b7bdbb',true);mesh.box(p(0,0,.737),r,n,.84,.84,.021,'#687474');
 for(const x of [-.28,.28]){mesh.tube(p(x,-.32,.04),p(x,.24,.72),.022,'#a5b0b0');mesh.tube(p(x,.32,.04),p(x,-.24,.72),.022,'#ccd0cc');}
 for(let i=-3;i<=3;i++)mesh.box(p(i*.10,0,.790),r,n,.004,.72,.002,'#9aa4a3');
 for(let i=0;i<4;i++){
  const a=yaw+i*Math.PI/2,at=center.clone().add(new Vector3(Math.sin(a),Math.cos(a),0).multiplyScalar(.93+(i===index%4?.12:0)));
  cafeChair(mesh,at,a+Math.PI+(i===index%4?.12:0));
 }
 // A segmented octagonal fabric canopy, with a vent, ribs and weighted base.
 mesh.tube(p(0,0,.01),p(0,0,.09),.35,'#707c7f',true,24);mesh.tube(p(0,0,.09),p(0,0,.14),.25,'#a9b2b2',false,24);
 mesh.tube(p(0,0,.12),p(0,0,3.02),.032,'#bfc8c7',true,12);
 const palette=['#aa3149','#97283e','#ba3b53','#a42c43','#8e293c','#a82b43','#bd3b52','#a83148'];
 for(let i=0;i<8;i++){
  const a=i*Math.PI/4,b=(i+1)*Math.PI/4,ring=(angle,rad,z)=>p(Math.sin(angle)*rad,Math.cos(angle)*rad,z);
  mesh.quad(ring(a,.22,2.98),ring(b,.22,2.98),ring(b,1.9,2.48),ring(a,1.9,2.48),palette[i]);
  mesh.quad(ring(a,1.9,2.48),ring(b,1.9,2.48),ring(b,1.9,2.38),ring(a,1.9,2.38),'#842338');
  mesh.emit([p(0,0,3.07),ring(a,.30,3.015),ring(b,.30,3.015)],[[0,1,2]],i%2?'#9d2a42':'#bc4055');
  mesh.tube(p(0,0,2.94),ring(a,1.89,2.455),.012,'#d0b0ae');mesh.tube(p(0,0,2.1),ring(a,.74,2.70),.012,'#9da6a3');
  // Shade below the canopy stays subtle at dusk; no real-time shadow lights.
  mesh.emit([p(0,0,.011),ring(a,2.0,.011),ring(b,2.0,.011)],[[0,1,2]],'#11151d23');
 }
 return {position:center,radius:1.9};
}
function planter(mesh,config,index){
 const c=new Vector3(...config.position),r=new Vector3(...config.along),n=new Vector3(r.y,-r.x,0),p=(x,y,z)=>c.clone().addScaledVector(r,x).addScaledVector(n,y).addScaledVector(UP,z),color=config.light?'#c9cdca':'#444d53';
 mesh.box(p(0,0,.47),r,n,1.9,.86,.94,color,true);mesh.box(p(0,0,.085),r,n,1.82,.79,.17,'#373e43');mesh.box(p(0,0,.944),r,n,1.92,.88,.04,config.light?'#e2e3da':'#636b6c');mesh.box(p(0,0,.968),r,n,1.74,.7,.01,'#303a2e');
 for(let i=0;i<23;i++){
  const x=Math.sin(i*17.31+index)*.76,y=Math.cos(i*9.67)*.25,z=1.07+((i*17)%13)/38,rad=.16+(i%4)*.027,center=p(x,y,z);
  const vertices=[center.clone().addScaledVector(UP,rad)];for(let j=0;j<5;j++)vertices.push(center.clone().addScaledVector(r,Math.cos(j*Math.PI*.4)*rad).addScaledVector(n,Math.sin(j*Math.PI*.4)*rad).addScaledVector(UP,-rad*.35));
  const faces=[];for(let j=0;j<5;j++)faces.push([0,1+j,1+(j+1)%5]);mesh.emit(vertices,faces,['#344f3c','#4b6650','#2e493a','#617154'][i%4]);
 }
 // Low granite seat at alternating planters, facing into the plaza.
 if(index%2===0){const bench=p(0,config.light?-1.1:1.1,.27);mesh.box(bench,r,n,1.8,.52,.54,'#7d8688',true);mesh.box(bench.clone().addScaledVector(UP,.277),r,n,1.86,.57,.04,'#adb2af');}
}

export function createNypdPlazaGeometry(){
 const mesh=new DetailMesh(),glass=[],labels=[],ads=[],barriers=[],posts=[],furniture=[],pools=[];
 const {station,scaffolds,tables,planters}=NYPD_PLAZA;
 for(const f of station.facades){
  const {n,r,p}=axes(f),w=f.width,box=(x,y,z,dx,dy,dz,c,solid=false)=>mesh.box(p(x,y,z),r,n,dx,dy,dz,c,solid);
  // The original pavilion stays underneath this thin modern cladding layer.
  box(0,.02,1.74,w,.06,3.12,'#748789');box(0,.08,.25,w,.14,.18,'#9ea8a8',true);
  mesh.quad(p(-w/2,.09,.18),p(w/2,.09,.18),p(w/2,.09,3.31),p(-w/2,.09,3.31),null,true);
  glass.push(face(p(0,.065,1.78),n,r,w-.15,2.94,{kind:'mosaic'}));
  const bays=Math.ceil(w/2.65);for(let i=0;i<=bays;i++)box(-w/2+i*w/bays,.13,1.78,.055,.16,3.12,'#bdc6c5');
  box(0,.10,3.31,w,.18,.14,'#9aa6aa');box(0,.13,.31,w,.18,.15,'#a7b2b3');
  for(const x of [-w/2,w/2]){box(x,.12,1.8,.15,.20,3.12,'#acb6b7');box(x-.025,.23,1.8,.022,.012,3.08,'#e1e5df');}
  // Deep fascia and overhanging soffit match the low, broad reference roof.
  box(0,.34,3.35,w+1.65,1.25,.22,'#566b7c',true);box(0,.86,3.45,w+1.65,.23,.27,'#1650a4');
  box(0,.75,3.94,w+1.65,.30,.76,'#98a8b1');box(0,.78,4.335,w+1.70,.38,.05,'#ced4d3');
  for(let z=3.59;z<4.29;z+=.058)box(0,.908,z,w+1.61,.007,.009,'#8f9fa8');
  if(f.id!=='rear')sign(mesh,p,w+1.2);
  for(let x=-w/2+.55;x<w/2;x+=2.7){box(x,.61,3.226,.18,.32,.025,'#fff5d4');mesh.tube(p(x,.22,3.20),p(x,.76,3.10),.035,'#30495b');}
  if(f.id==='front'){
   box(0,.145,1.83,2.28,.19,3.03,'#444f57');box(0,.264,1.46,2.02,.05,2.40,'#83949e');
   for(const x of [-.515,.515]){box(x,.30,1.47,.90,.04,2.27,'#aab6bb');glass.push(face(p(x,.323,1.60),n,r,.58,1.61,{kind:'door'}));mesh.tube(p(x+Math.sign(x)*-.34,.39,.95),p(x+Math.sign(x)*-.34,.39,1.61),.023,'#cdd5d3');box(x,.354,1.32,.58,.015,.025,'#8fb6bc');}
   box(0,.33,1.44,.035,.07,2.45,'#647a84');labels.push(face(p(0,.27,2.98),n,r,.52,.62,{kind:'badge'}));
   box(1.26,.24,1.21,.09,.05,.16,'#647985');
   for(const x of [-1.3,1.3]){const pos=p(x,1.03,.17);steelCylinder(mesh,pos,n);posts.push({position:pos,normal:n});}
   for(const x of [-3.07,3.07])barriers.push(railBarrier(mesh,p(x,1.19,.17),r,2.36));
  }else if(f.id==='east'||f.id==='west'){
   const grade=f.id==='east'?.075:.17;
   for(let x=-w/2+1.35;x<w/2-1;x+=2.64)barriers.push(railBarrier(mesh,p(x,1.15,grade),r,2.38));
   for(const x of [-w/2+.3,w/2-.3]){const pos=p(x,.95,grade);steelCylinder(mesh,pos,n);posts.push({position:pos,normal:n});}
  }
 }
 const c=new Vector3(...station.center),n=new Vector3(...station.normal),r=new Vector3(-n.y,n.x,0);
 mesh.box(c.clone().setZ(4.17),r,n,station.width+1.85,station.depth+1.85,.25,'#77868c',true);
 // Nasdaq owns the opposite facade and its continuous covered walkway.
 for(const shed of scaffolds.filter(s=>s.id!=='opposite-broadway')){
  addScaffoldGeometry(mesh,shed,labels,pools);
  const {p,n,r}=axes(shed),w=shed.width/2;
  // Green plywood and panel joints are tight to the tower, outside the clear
  // 3.4-m covered passage. The opposite retail windows stay visible.
  if(shed.id==='one-times-square'){
   mesh.box(p(0,-w+.02,1.67),r,n,shed.length,.075,3.12,'#244a3f',true);
   for(let x=-shed.length/2;x<shed.length/2;x+=2.4)mesh.box(p(x,-w+.08,1.67),r,n,.024,.02,3.1,'#48665b');
   for(const x of [-12,0,12])labels.push(face(p(x,-w+.12,1.86),n,r,1.28,1.7,{kind:'notice'}));
  }
  for(let x=-shed.length/2+.2;x<shed.length/2-.2;x+=3.2){
   const width=Math.min(3.1,shed.length/2-x),height=shed.levels*2.1;
   mesh.box(p(x+width/2,-w+.19,4.35+height/2),r,n,width,.01,height,'#27463b8f');
  }
 }
 // Water-filled orange / white construction barriers along the tower-side
 // edge only; their end gaps keep access to both covered walks open.
 const shed=scaffolds[0],sCenter=new Vector3(...shed.center),sN=new Vector3(...shed.normal),sR=new Vector3(...shed.along);
 for(const x of [-16,-13.45,10.5,13.05,15.6])jersey(mesh,sCenter.clone().addScaledVector(sR,x).addScaledVector(sN,2.1).setZ(.075),sR,x===-16||x===13.05?'#e8733d':'#c9cfca');
 tables.forEach((t,i)=>furniture.push(cafeTable(mesh,t,i)));planters.forEach((p,i)=>planter(mesh,p,i));
 return {batches:mesh.batches,collision:new Float32Array(mesh.collision),glass,labels,ads,barriers,posts,furniture,pools};
}
