import {Vector3} from 'three';
import {DetailMesh} from './detail-mesh.js';
import {addScaffoldGeometry} from './streetscape-geometry.js';
import {LYRIC_THEATRE as L} from './lyric-config.js';
const UP=new Vector3(0,0,1);
export function lyricAxes(f){const c=new Vector3(...f.center),n=new Vector3(...f.normal),r=new Vector3(-n.y,n.x,0);return {c,n,r,p:(x,y,z)=>c.clone().addScaledVector(r,x).addScaledVector(n,y).setZ(z)};}

function rail(mesh,p,r,n,length=2.45){
 const at=(x,y,z)=>p.clone().addScaledVector(r,x).addScaledVector(n,y).addScaledVector(UP,z);
 for(const z of [.23,1.08])mesh.tube(at(-length/2,0,z),at(length/2,0,z),.027,'#c1c9ca');
 for(const x of [-length/2,length/2]){mesh.tube(at(x,0,.07),at(x,0,1.08),.029,'#aab9be');mesh.tube(at(x,-.34,.035),at(x,.34,.035),.03,'#adbabe');}
 for(let x=-length/2+.18;x<length/2-.08;x+=.18)mesh.tube(at(x,0,.24),at(x,0,1.07),.013,'#b0bec3');
 mesh.box(at(0,0,.60),r,n,length,.065,1.04,null,true);
 return {position:p,right:r,normal:n,length};
}
function waterBarrier(mesh,p,r,n,orange){
 const at=(x,y,z)=>p.clone().addScaledVector(r,x).addScaledVector(n,y).addScaledVector(UP,z),color=orange?'#d87439':'#c2c9c5';
 const profile=[[-.32,.02],[.32,.02],[.32,.20],[.14,.52],[.14,.86],[-.14,.86],[-.14,.52],[-.32,.20]],vs=[];
 for(const x of [-1.16,1.16])for(const [y,z]of profile)vs.push(at(x,y,z));
 const fs=[];for(let i=0;i<8;i++){const j=(i+1)%8;fs.push([i,j,j+8],[i,j+8,i+8]);if(i>0&&i<7)fs.push([0,i+1,i],[8,8+i,8+i+1]);}mesh.emit(vs,fs,color,true);
 for(const side of [-1,1])for(const x of [-.77,0,.77]){mesh.box(at(x,side*.145,.64),r,n,.46,.02,.17,orange?'#a04e29':'#6e7c82');mesh.box(at(x,side*.162,.75),r,n,.34,.018,.065,'#e8dfc5');}
 mesh.tube(at(0,0,.86),at(0,0,.885),.075,'#424f50',false,12);
 return {position:p,normal:n,right:r,width:2.32};
}
function cone(mesh,p,r,n){
 const at=(a,z,rad)=>p.clone().addScaledVector(r,Math.cos(a)*rad).addScaledVector(n,Math.sin(a)*rad).addScaledVector(UP,z);
 mesh.box(p.clone().addScaledVector(UP,.035),r,n,.43,.43,.07,'#222f36',true);
 const bands=[.07,.29,.40,.49,.60,.75];
 for(let k=0;k<bands.length-1;k++)for(let i=0;i<16;i++){
  const z=bands[k],zz=bands[k+1],rad=t=>.19*(.82-t)/.75;
  mesh.quad(at(i*Math.PI/8,z,rad(z)),at((i+1)*Math.PI/8,z,rad(z)),at((i+1)*Math.PI/8,zz,rad(zz)),at(i*Math.PI/8,zz,rad(zz)),k===1||k===3?'#e3e4d5':'#e87732',true);
 }return {position:p,normal:n};
}
export function createLyricGeometry(){
 const mesh=new DetailMesh(),emissive=new DetailMesh(),paving=new DetailMesh(),brick=[],stone=[],glass=[],labels=[],logos=[],netting=[],fence=[],pools=[],rails=[],barriers=[],cones=[],scaffolds=[],routes=[];
 const facade=id=>L.facades.find(f=>f.id===id),front=facade('historic'),a=lyricAxes(front),night={frontNormal:front.normal,lights:[]};
 const setup=f=>{
  const {p,n,r}=lyricAxes(f),box=(x,y,z,w,d,h,c,solid=false)=>mesh.box(p(x,y,z),r,n,w,d,h,c,solid),face=(x,y,z,w,h,extra={})=>({center:p(x,y,z),normal:n,right:r,width:w,height:h,...extra});
  return {p,n,r,box,face};
 };
 const {p,n,r,box,face}=setup(front),w=front.width;
 // The original NYC mesh supplies the building volume and roof. These layers
 // are shallow masonry, architectural relief, windows, and sign mounts only.
 brick.push(face(0,.046,11.82,w,23.26));
 box(0,.07,2.78,w,.13,5.2,'#b4ab94');stone.push(face(0,.142,2.80,w,5.17));
 box(0,.15,.41,w,.26,.46,'#827f73',true);
 for(const [z,depth,height]of [[5.42,.44,.24],[5.72,.60,.20],[13.80,.32,.28],[18.65,.47,.3],[21.45,.75,.35],[22.15,.94,.48],[22.61,1.03,.19],[23.18,.69,.22]])box(0,depth/2,z,w,depth,height,'#bab19c');
 for(let x=-w/2+.35;x<w/2;x+=.50){box(x,.52,21.82,.22,.5,.29,'#c7bda6');box(x,.68,22.78,.32,.64,.35,'#a79d87');}
 // Three Renaissance window bays with fluted columns, archivolts and busts.
 for(const x of [-10.1,-2.9,4.3]){
  box(x,.19,11.6,5.46,.20,10.5,'#6b6355');glass.push(face(x,.31,11.9,4.23,9.45));
  for(const dx of [-2.57,2.57]){
   box(x+dx,.37,11.56,.87,.58,10.10,'#bfb49b');
   mesh.tube(p(x+dx,.69,7.22),p(x+dx,.69,16.35),.32,'#c2b89f',false,16);
   for(let q=0;q<9;q++){const angle=Math.PI*(q/8);mesh.tube(p(x+dx+Math.cos(angle)*.285,.70+Math.sin(angle)*.285,7.28),p(x+dx+Math.cos(angle)*.285,.70+Math.sin(angle)*.285,16.0),.022,'#9e947e',false,6);}
   for(const z of [7.05,7.27,16.23,16.52])box(x+dx,.64,z,1.14,.85,.20,'#bdb39b');
   for(const side of [-1,1])for(let k=0;k<14;k++){const t=k/14*Math.PI*2,t1=(k+1)/14*Math.PI*2;mesh.tube(p(x+dx+side*.37+Math.cos(t)*.17,.99,16.45+Math.sin(t)*.17),p(x+dx+side*.37+Math.cos(t1)*.17,.99,16.45+Math.sin(t1)*.17),.049,'#cdc1a8',false,6);}
  }
  for(let i=0;i<32;i++)for(const rad of [2.03,2.25,2.44]){
   const t=i/32*Math.PI,t1=(i+1)/32*Math.PI;mesh.tube(p(x+Math.cos(t)*rad,.56,14.18+Math.sin(t)*rad),p(x+Math.cos(t1)*rad,.56,14.18+Math.sin(t1)*rad),.07,'#c2b69c',false,6);
  }
  box(x,.57,6.9,6.0,.90,.29,'#b4aa92');box(x,.40,17.22,6.15,.61,.32,'#c0b79f');
  // Carved medallion, torso and curls are relief, never a human NPC.
  mesh.tube(p(x,.47,18.0),p(x,.64,18.0),.67,'#9e937d',false,24);
  mesh.tube(p(x,.65,18.0),p(x,.78,18.0),.52,'#c7b99b',false,24);
  mesh.tube(p(x,.80,17.97),p(x,.96,18.04),.24,'#cbbf9f',false,12);
  mesh.emit([p(x-.39,.83,17.62),p(x+.39,.83,17.62),p(x+.17,1,17.91),p(x-.17,1,17.91)],[[0,1,2],[0,2,3]],'#b8aa8c');
  for(const dx of [-.25,-.14,0,.14,.25])mesh.tube(p(x+dx,.83,18.27),p(x+dx,.93,18.24),.075,'#a99a7d',false,8);
  for(const dx of [-1.08,0,1.08])box(x+dx,.37,11.9,.062,.12,7.9,'#807a68');box(x,.37,12.6,4.3,.12,.11,'#807a68');
 }
 // Tall outer stone pilasters and rusticated joints.
 for(const x of [-w/2+.6,w/2-.6]){box(x,.19,14.0,1.1,.28,15.1,'#b3a78e');for(let z=6.6;z<21;z+=.62)box(x,.345,z,1.1,.026,.025,'#817661');}
 const entry=-3.0;
 box(entry,.27,2.70,12.15,.34,4.70,'#20282b',true);
 for(let j=0;j<6;j++){
  const x=entry+(j-2.5)*1.96;glass.push(face(x,.449,2.70,1.85,4.20));
  for(const dx of [-.94,0,.94])box(x+dx,.53,2.66,.06,.12,4.30,'#8c7a52');
  box(x,.54,3.86,1.86,.15,.075,'#b3a078');for(const dx of [-.14,.14])mesh.tube(p(x+dx,.65,1.3),p(x+dx,.65,2.32),.024,'#b9a775');
 }
 // Projecting black-and-gold canopy and low warm pin lights.
 box(entry,1.39,4.58,13.1,2.55,.38,'#272728',true);box(entry,2.67,4.78,13.35,.18,.72,'#1d2224');
 for(const z of [4.39,5.11])mesh.tube(p(entry-6.68,2.79,z),p(entry+6.68,2.79,z),.033,'#a68b5b');
 for(let x=entry-6.45;x<entry+6.6;x+=.24){emissive.tube(p(x,2.79,4.42),p(x,2.83,4.42),.028,'#eacb87',false,6);if(Math.round((x-entry)*10)%2===0)emissive.tube(p(x,2.79,5.05),p(x,2.83,5.05),.021,'#b69c6a',false,6);}
 for(const x of [entry-6.3,entry+6.3])for(let y=.2;y<2.6;y+=.27)emissive.tube(p(x,y,4.37),p(x,y,4.34),.025,'#e3c995',false,6);
 logos.push(face(entry,.86,8.10,13.0,13*333/800));
 labels.push(face(entry,2.773,4.79,11.5,.48,{kind:'marquee'}),face(9.9,.47,4.0,3.6,1.25,{kind:'lyric'}));
 for(const x of [-13.8,10.1,13.4]){
  box(x,.27,2.20,1.53,.22,2.79,'#27302e');labels.push(face(x,.389,2.20,1.35,2.60,{kind:'poster'}));
  for(const dx of [-.79,.79])mesh.tube(p(x+dx,.47,1.3),p(x+dx,.47,3.1),.022,'#a39368');
 }
 for(const x of [-12,7.7,14.3]){
  mesh.tube(p(x,.25,4.40),p(x,.88,4.65),.055,'#373d36');box(x,.88,4.61,.23,.24,.62,'#82704c');emissive.box(p(x,1.01,4.62),r,n,.12,.025,.42,'#dabb7c');
 }
 night.lights.push({position:p(entry,1.1,6.0).toArray(),radius:[13,13,8],color:[.30,.19,.066]});pools.push({center:p(entry,1.9,.181),normal:UP,right:r,up:n,width:16,height:5});

 // Reference side wall, green loading doors and a hooded zig-zag fire escape.
 const service=facade('service'),s=setup(service),sw=service.width;
 brick.push(s.face(0,.045,13.65,sw,16.3));stone.push(s.face(0,.052,2.95,sw,5.54));
 for(const z of [.40,5.68,6.04,13.1,21.58])s.box(0,.16,z,sw,.26,z===.4?.48:.22,'#a79e8b',z===.40);
 for(const x of [-12.5,-7.9,-2.8,4.0,10.3]){
  s.box(x,.15,2.04,3.28,.22,3.65,'#958e7b');s.box(x,.28,1.96,2.94,.18,3.38,'#254b3e',true);
  for(const dx of [-1.41,0,1.41])s.box(x+dx,.39,1.96,.054,.12,3.41,'#69796a');
  for(const dx of [-.17,.17])mesh.tube(s.p(x+dx,.48,1.30),s.p(x+dx,.48,1.73),.021,'#a2aba0');
  if(x<0)labels.push(s.face(x,.47,4.46,2.75,.42,{kind:'exit'}));
 }
 for(const x of [-11,-5]){s.box(x,.22,7.08,4.5,.31,1.65,'#232c2a');labels.push(s.face(x,.391,7.08,4.26,1.40,{kind:'show'}));for(let dx=-2.1;dx<2.13;dx+=.26)for(const z of [6.30,7.86])emissive.tube(s.p(x+dx,.40,z),s.p(x+dx,.44,z),.032,'#f0d192',false,6);}
 const stairX=9.7;
 for(let level=0;level<3;level++){
  const z=5.8+level*4.65,sign=level%2?1:-1;
  s.box(stairX,.83,z,6.7,1.3,.17,'#65726e',true);
  for(const xx of [stairX-3.26,stairX+3.26])mesh.tube(s.p(xx,1.4,z),s.p(xx,1.4,z+1.05),.035,'#7a8580');
  mesh.tube(s.p(stairX-3.3,1.42,z+1.05),s.p(stairX+3.3,1.42,z+1.05),.035,'#84908b');
  if(level<2){
   for(let j=0;j<20;j++){const xx=stairX+sign*(-3+j*6/20),zz=z+j*4.65/20;s.box(xx,.83,zz,.34,1.16,.06,'#7e8882');}
   for(const y of [.26,1.43])mesh.tube(s.p(stairX-sign*3,y,z+1),s.p(stairX+sign*3,y,z+5.65),.04,'#8d9690');
   // Sheet-metal weather hood, sloped with the flight.
   mesh.quad(s.p(stairX-sign*3,.17,z+1.52),s.p(stairX+sign*3,.17,z+6.17),s.p(stairX+sign*3,1.58,z+6.17),s.p(stairX-sign*3,1.58,z+1.52),'#8f9992');
   mesh.quad(s.p(stairX-sign*3,1.58,z+1.16),s.p(stairX+sign*3,1.58,z+5.81),s.p(stairX+sign*3,1.58,z+6.17),s.p(stairX-sign*3,1.58,z+1.52),'#6a7771');
  }
 }
 // The 150-foot metal wing is authored as overlapping tapered relief feathers,
 // following the reference silhouette. It does not create building mass.
 const wingStart=83.3,wingEnd=wingStart+L.wingLength;
 const wp=(station,y,z)=>p(station-(front.start+front.end)/2,y,z);
 for(let row=0;row<4;row++)for(let i=0;i<27;i++){
  const t=i/26,station=wingStart+3+t*(L.wingLength-3),base=7.4+t*12.3,spread=(1.0+Math.sin(t*Math.PI)*3.7)*(row/3),z=Math.min(21.25,base+spread-1.8),length=3.1+t*4.8,depth=.63+row*.11+(i%3)*.04;
  const tipX=Math.max(wingStart,station-length),tipZ=z-1.3-row*.42;
  const vs=[wp(tipX,depth,tipZ),wp(station-.8,depth+.21,z-.63),wp(station,depth+.13,z+.18),wp(station-.6,depth,z+.64),wp(station-1.95,depth-.02,z+.40)];
  mesh.emit(vs,[[0,1,2],[0,2,3],[0,3,4]],['#77766b','#8d8878','#666a64','#a09a87'][(i+row)%4]);
  mesh.tube(vs[0],vs[2],.024,'#aaa18c',false,5);
 }
 // Long torn primary feathers at the high western end, within the real roof.
 for(let i=0;i<11;i++){
  const x=wingEnd-1-i*.9,z=20.0+Math.sin(i*.25)*1.15;
  mesh.emit([wp(x-9.0,.80,z-5.7),wp(x-.8,1.05,z-.2),wp(x,.83,z+1.0),wp(x-1.2,.73,z+.4)],[[0,1,2],[0,2,3]],i%2?'#8b8576':'#797b70');
 }
 for(let i=0;i<9;i++)emissive.tube(wp(wingStart+2+i*.55,1.0,6.1+i*.27),wp(wingStart+2+i*.55,1.07,6.1+i*.27),.095,'#ba7c40',false,8);

 // Modern glass-and-limestone neighbor on the approach from Broadway.
 const neighbor=setup(facade('east-neighbor')),nw=facade('east-neighbor').width;
 stone.push(neighbor.face(0,.04,11.57,nw,22.86));
 for(let j=0;j<5;j++){
  const x=(j-2)*7.35;neighbor.box(x,.11,14.43,6.52,.12,15.60,'#354b4b');glass.push(neighbor.face(x,.182,14.43,6.27,15.30));
  for(const dx of [-3.16,0,3.16])neighbor.box(x+dx,.25,14.45,.075,.15,15.45,'#9baba9');
  for(let z=7.0;z<22;z+=2.6)neighbor.box(x,.25,z,6.35,.15,.07,'#a5b0a7');
  neighbor.box(x,.13,2.57,6.4,.18,4.84,'#555d5b',true);
  for(let z=.35;z<4.8;z+=.14)neighbor.box(x,.24,z,6.24,.08,.055,'#969d93');
  neighbor.box(x,.32,5.23,6.7,.47,.30,'#b8b29f');
 }
 // Deli opposite the entrance connects to the existing Hard Rock / Taco Bell.
 const deli=setup(facade('deli')),dw=facade('deli').width;
 stone.push(deli.face(0,.041,9.06,dw,17.85));
 for(let j=0;j<7;j++){
  const x=(j-3)*3.8;deli.box(x,.15,2.44,3.35,.18,4.42,'#24342f',true);glass.push(deli.face(x,.25,2.47,3.10,4.10));
  for(const z of [8.25,13.8]){deli.box(x,.17,z,2.62,.22,3.42,'#2d3c3d');glass.push(deli.face(x,.291,z,2.42,3.17));deli.box(x,.35,z-1.8,2.9,.52,.18,'#a6a495');}
 }
 deli.box(0,.4,5.18,dw-.4,.68,.83,'#17392f');labels.push(deli.face(0,.751,5.19,dw-1,.59,{kind:'deli'}));
 for(const x of [-8.3,0,8.3]){
  deli.box(x,.84,8.39,1.45,1.45,5.15,'#344032');labels.push(deli.face(x,1.574,8.39,1.30,4.95,{kind:'deli-banner'}));
  for(const dx of [-.72,.72])deli.box(x+dx,1.60,8.39,.055,.1,5.13,'#af9367');
 }

 // Raised paving joins the measured wall to the existing OSM sidewalks.
 // Long routes stay open behind curb furniture and below scaffold decks.
 for(const id of ['historic','service','east-neighbor','deli','north-construction']){
  const f=facade(id),{p,n,r}=setup(f),half=f.width/2,curb=id==='north-construction'?3.90:4.05;
  for(let x=-half;x<half-.01;x+=3.0){const xx=Math.min(half,x+3);paving.quad(p(x,.30,.176),p(xx,.30,.176),p(xx,curb,.176),p(x,curb,.176),'#879195',true);paving.quad(p(x,curb,0),p(xx,curb,0),p(xx,curb,.176),p(x,curb,.176),'#65747a',true);mesh.tube(p(x,.35,.184),p(x,curb,.184),.009,'#555f63',false,5);}
  routes.push({id,points:[p(-half+.65,2.04,.18),p(half-.65,2.04,.18)]});
 }
 const addShed=(f,start,end)=>{
  const ax=setup(f),center=ax.p((start+end)/2,2.05,0),shed={id:f.id,center:center.toArray(),normal:ax.n.toArray(),along:ax.r.toArray(),length:end-start,width:3.25,height:3.45,levels:2,grade:.176};
  const signFaces=[],lightPools=[];addScaffoldGeometry(mesh,shed,signFaces,lightPools);scaffolds.push(shed);
  for(const f of signFaces)labels.push({...f,kind:'scaffold'});pools.push(...lightPools);
  // Luminous tube fixtures stay on the underside, separate from shaded metal.
  for(let x=start+.8;x<end;x+=3.15)emissive.box(ax.p(x,2.05,3.24),ax.r,ax.n,.065,1.6,.035,'#ddd8bc');
 };
 addShed(service,4.1,sw/2-.2);addShed(facade('north-construction'),-39.6,39.6);
 const cf=facade('north-construction'),cs=setup(cf),half=cf.width/2;
 for(let x=-half+.5;x<half;x+=3.2){
  mesh.tube(cs.p(x,.59,4.2),cs.p(x,.59,cf.height),.045,'#8a9996');
  for(let z=4.4;z<cf.height-1;z+=2.7){mesh.tube(cs.p(x,.59,z),cs.p(Math.min(half,x+3.2),.59,z+2.7),.025,'#a7b4ae');mesh.tube(cs.p(x,.59,z),cs.p(Math.min(half,x+3.2),.59,z),.042,'#919e99');}
 }
 netting.push(cs.face(0,.66,(4.4+cf.height)/2,cf.width,cf.height-4.4));
 // Chain-link construction fence sits at the outer curb, with two gaps.
 for(let x=-half+1.5;x<half-1;x+=2.5){
  if(Math.abs(x-12)<2.2||Math.abs(x+17)<2.2)continue;
  barriers.push(waterBarrier(mesh,cs.p(x,4.18,0),cs.r,cs.n,Math.round((x+half)/2.5)%2===0));
  fence.push(cs.face(x,3.84,1.83,2.42,2.9));
  for(const dx of [-1.21,1.21])mesh.tube(cs.p(x+dx,3.81,.18),cs.p(x+dx,3.81,3.28),.036,'#a0afad',true);
  for(const z of [.4,3.26])mesh.tube(cs.p(x-1.2,3.81,z),cs.p(x+1.2,3.81,z),.027,'#abb7b3');
 }
 // South-side crowd barriers and traffic cones occupy the parking edge.
 for(const [f,xs]of [[front,[-13,-9,9,13]],[service,[-13,-8,-3,2,7,12]]]){
  const ax=setup(f);for(const x of xs)rails.push(rail(mesh,ax.p(x,4.50,0),ax.r,ax.n));
 }
 const so=new Vector3(...L.street.origin),wr=new Vector3(...L.street.west),nn=new Vector3(...L.street.north);
 for(const station of [28,40,52,63,75,86,98,110,124,135])cones.push(cone(mesh,so.clone().addScaledVector(wr,station).addScaledVector(nn,-3.25),wr,nn));
 for(const offset of [-3.4,3.7])mesh.tube(so.clone().addScaledVector(wr,23).addScaledVector(nn,offset).setZ(.019),so.clone().addScaledVector(wr,162).addScaledVector(nn,offset).setZ(.019),.038,'#929995',false,4);
 routes.push({id:'street',points:[so.clone().addScaledVector(wr,22).setZ(.17),so.clone().addScaledVector(wr,163).setZ(.17)]});
 return {batches:mesh.batches,emissive:emissive.batches,paving:paving.batches,collision:new Float32Array([...mesh.collision,...paving.collision]),brick,stone,glass,labels,logos,netting,fence,pools,rails,barriers,cones,scaffolds,routes,night};
}
