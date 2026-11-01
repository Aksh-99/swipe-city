// Original mesh remains the building. These shallow reliefs interpret the
// supplied 127A → Sixth Avenue photographs; they are not screenshot textures.
import {steelCylinder} from './curb-bollard-geometry.js';
export const EAST43_NAMES={mexican:['BAR MEXICANA'],pub:['WEST 43 PUBLIC HOUSE'],townhall:['THE TOWN HALL'],sondheim:['Stephen Sondheim'],glassoffice:['43 WEST • LOBBY']};
export const EAST43_VISIT={name:'West 43rd Street · 127A toward Sixth Avenue',address:'127A W 43rd Street → Sixth Avenue',normal:[-.48,-.877,0],view:{position:[54,-213,.17],yaw:2.075,pitch:-.04}};
export function addEast43Details(f,a,mesh,bulbs,labels,windows,posters,curtain){
 const style=f.referenceStyle,w=f.width;
 const box=(x,y,z,ww,d,h,c,solid=false)=>mesh.box(a.p(x,y,z),a.r,a.n,ww,d,h,c,solid);
 const face=(x,y,z,ww,h,extra={})=>({center:a.p(x,y,z),normal:a.n,right:a.r,width:ww,height:h,...extra});
 const label=(kind,x,y,z,ww,h,shade=.65)=>labels.push(face(x,y,z,ww,h,{kind,variant:0,shade}));
 const arch=(x,bottom,r,h)=>{
  const shoulder=bottom+h-r,points=[a.p(x-r,.255,bottom),a.p(x+r,.255,bottom)];
  for(let i=0;i<=18;i++){const t=i/18*Math.PI;points.push(a.p(x+Math.cos(t)*r,.255,shoulder+Math.sin(t)*r));}
  mesh.emit(points,Array.from({length:points.length-2},(_,i)=>[0,i+1,i+2]),'#26383c');
  for(const dx of [-r,r])box(x+dx,.30,(bottom+shoulder)/2,.17,.18,shoulder-bottom,'#b6a88b');
  for(let i=0;i<18;i++){
   const t=i/18*Math.PI,tt=(i+1)/18*Math.PI,point=(ang,rad)=>a.p(x+Math.cos(ang)*rad,.35,shoulder+Math.sin(ang)*rad);
   mesh.quad(point(t,r),point(tt,r),point(tt,r+.19),point(t,r+.19),i%3?'#b6a88b':'#c5b696');
  }
  for(const dx of [-r*.45,0,r*.45])box(x+dx,.37,bottom+h*.40,.035,.065,h*.80,'#807964');
  for(const z of [bottom+.55,bottom+1.20,bottom+1.85])box(x,.37,z,r*1.92,.06,.034,'#807964');
  box(x,.32,bottom-.12,r*2+.44,.24,.16,'#ad9e86');
 };
 const planter=(x,y=.62)=>{
  const p=a.p(x,y,.17),q=a.p(x,y,.73);
  mesh.tube(p,q,.37,style==='glassoffice'?'#657276':'#9f9177',true,16);
  mesh.tube(a.p(x,y,.72),a.p(x,y,.77),.41,'#aa9e84',false,16);
  for(let i=0;i<9;i++){const t=i/9*Math.PI*2;box(x+Math.cos(t)*.21,y+Math.sin(t)*.21,.90,.23,.22,.32+(i%3)*.055,'#344936');}
 };
 if(style==='mexican'){
  // Warm limestone, red canvas restaurant, and the narrow green pub next door.
  for(const z of [7.0,10.3])for(let i=0;i<4;i++){
   const x=-w/2+(i+.5)*w/4,color=i===3?'#355744':'#a29176';
   windows.push(face(x,.255,z,1.35,2.15,{cell:0,shade:.12}));
   for(const dx of [-.74,.74])box(x+dx,.32,z,.12,.16,2.34,color);
   for(const zz of [z-1.16,z+1.16])box(x,.35,zz,1.74,.22,.13,color);
   box(x,.35,z,.032,.10,2.14,'#6c756c');box(x,.35,z,1.35,.10,.035,'#6c756c');
  }
  box(0,.30,12.48,w,.31,.24,'#a29176');
  windows.push(face(-2.2,.25,1.95,w*.62,3.28,{cell:2,shade:.23}));
  for(let x=-w/2+.2;x<w*.14;x+=1.4)box(x,.34,1.96,.075,.12,3.48,'#665640');
  box(-2.2,1.00,3.40,w*.65,1.80,.17,'#83252b',true);
  label('mexican',-2.2,1.925,3.30,w*.63,.35,.74);
  box(-2.2,.32,4.02,w*.66,.19,.64,'#957c4b');label('mexican',-2.2,.426,4.02,w*.64,.52,.65);
  const px=w*.32,pw=w*.26;
  windows.push(face(px,.28,1.88,pw,3.17,{cell:2,shade:.17}));
  for(const x of [px-pw/2,px,px+pw/2])box(x,.37,1.95,.14,.16,3.6,'#294a3c');
  box(px,.40,4.05,pw+.18,.28,.72,'#294a3c');label('pub',px,.55,4.05,pw,.54,.57);
  box(px,.97,3.20,pw+.15,1.4,.15,'#2f5945',true);
  for(let x=-w/2+.3;x<w*.12;x+=.34)bulbs.tube(a.p(x,1.89,3.34),a.p(x+.04,1.89,3.34),.025,'#baa174',false,6);
  return;
 }
 if(style==='townhall'||style==='sondheim'){
  const bays=3,pitch=w/bays;
  box(0,.22,5.00,w,.25,.52,'#b1a58c');
  box(0,.24,11.5,w,.29,.35,'#b0a087');
  for(let i=0;i<bays;i++){
   const x=-w/2+(i+.5)*pitch;
   arch(x,6.1,Math.min(1.03,pitch*.24),3.52);
   windows.push(face(x,.26,1.95,pitch-.64,3.44,{cell:0,shade:.13}));
   for(const dx of [-pitch/2+.23,pitch/2-.23])box(x+dx,.32,2.05,.29,.27,3.77,'#b1a58c');
   box(x,.38,.22,pitch-.56,.43,.10,'#9d927e');
   box(x,.38,1.83,.05,.12,3.10,'#6c634e');
   for(const dx of [-.19,.19])mesh.tube(a.p(x+dx,.46,1.1),a.p(x+dx,.46,1.81),.025,'#b9a882');
  }
  if(style==='townhall'){
   // Two independent black entrance canopies with the reference's oval trim
   // and warm globe lamps, high enough to run underneath.
   for(const x of [-w*.25,w*.25]){
    const cw=w*.45;box(x,1.13,3.87,cw,2.08,.20,'#202c2c',true);
    box(x,2.15,3.69,cw,.12,.36,'#273331');
    label('townhall',x,2.225,3.96,cw-.16,.25,.56);
    for(let xx=x-cw/2+.18;xx<x+cw/2-.1;xx+=.33){box(xx,2.22,3.66,.16,.035,.26,'#ae9b70');bulbs.tube(a.p(xx,1.99,3.48),a.p(xx+.015,1.99,3.48),.070,'#bea476',false,8);}
   }
   box(0,.28,10.43,w*.50,.13,.58,'#b7ab94');label('townhall',0,.36,10.43,w*.48,.43,.42);
   for(const x of [-w/2+.55,w/2-.55])planter(x);
  }else{
   box(0,1.22,3.60,w-.1,2.32,.21,'#302a31',true);
   box(0,2.35,3.61,w-.1,.10,.38,'#392533');
   bulbs.box(a.p(0,2.414,3.59),a.r,a.n,w-.30,.018,.135,'#aa486c');
   label('sondheim',0,2.42,3.91,w-.35,.41,.82);
   // Existing original poster artwork supplies the billboard, not photo pixels.
   box(0,.31,12.73,w*.64,.25,2.46,'#283235');
   posters.push(face(0,.445,12.73,w*.62,2.30,{ad:5}));
   for(const x of [-w/2+.55,w/2-.55])planter(x);
  }
  return;
 }
 if(style==='glassoffice'){
  curtain.push(face(0,.26,(f.top+.18)/2,w,f.top-.18));
  for(let x=-w/2+.05;x<w/2;x+=1.48)box(x,.32,(f.top+.18)/2,.055,.11,f.top-.18,'#66787e');
  for(let z=4.9;z<f.top;z+=3.45)box(0,.32,z,w,.13,.10,'#697a80');
  box(0,.34,.31,w,.21,.25,'#273239');
  // South office return alternates loading bays with lobby glass. Louvers
  // form a continuous strip above the shutters as in the photographs.
  if(a.n.y>0){
   box(0,.39,4.53,w,.18,.79,'#243238');
   for(let z=4.19;z<4.91;z+=.095)box(0,.495,z,w-.15,.045,.026,'#6d7979');
   if(f.id==='district-96'||f.id==='district-98'){
    for(const x of [-w*.25,w*.25]){
     box(x,.40,2.02,w*.40,.10,3.56,'#596266');
     for(let z=.3;z<3.8;z+=.12)box(x,.463,z,w*.39,.025,.024,'#747d7b');
     for(const dx of [-w*.20,w*.20])box(x+dx,.49,1.14,.09,.065,1.85,'#9c8739');
    }
   }else for(let x=-w/2+.45;x<w/2;x+=2.9)steelPost(x);
  }
  function steelPost(x){
   steelCylinder(mesh,a.p(x,.70,.17),a.n);
  }
  if(a.n.y<0){
   for(const x of [-w/2+.65,w/2-.65])planter(x);
   if(f.id==='district-95'||f.id==='district-91'){
    const x=w/2-1.6,y=.63;
    mesh.tube(a.p(x,y,.17),a.p(x,y,4.30),.065,'#4b4b40',true,8);
    for(const sign of [-1,1])mesh.tube(a.p(x,y,3.15),a.p(x+sign*.75,y,4.8),.032,'#4b4b40');
    for(let i=0;i<8;i++)box(x+Math.sin(i*2.1)*.75,y+Math.cos(i*2.1)*.38,4.2+(i%3)*.38,.62,.53,.60,'#344735');
   }
  }
  label('glassoffice',0,.38,4.00,Math.min(w-1,5),.35,.45);
 }
}
