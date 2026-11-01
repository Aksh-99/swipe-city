// Reference-inspired exterior reliefs on the existing surveyed NYC wall spans.
// The seventeen supplied photos are design references, never texture sources.
import {EAST44_TITLES,EAST44_COLORS} from './east44-reference.js';
import {addOfficeGrid} from './office-grid.js';
import {steelCylinder} from './curb-bollard-geometry.js';
export const WEST44_TITLES=['MIDTOWN PHARMACY','MAJESTIC','ST. JAMES','John’s PIZZERIA','SUGAR FACTORY','BROADWAY THEATRE',"Sardi’s",'BOWL',"Junior’s",'PARK', 'ONE ASTOR PLAZA',"Carmine’s",'SQUARE COFFEE','CITY DELI','THEATRE DISTRICT',...EAST44_TITLES];
export const WEST44_COLORS=['#344c58','#762930','#36594b','#4d2e24','#242b30','#5c5426','#63303a','#202e37','#8f4c2c','#7d2630','#28383e','#3c262e','#3b4535','#314436','#514436',...EAST44_COLORS];
const STYLES={319:'sugar',320:'pharmacy',321:'pizza',322:'majestic',323:'stjames',324:'majestic',325:'stjames',326:'backstage',327:'stjames',328:'yellowtheatre',329:'stage',330:'stage',331:'ornate',332:'sardis',333:'office',334:'bowl',335:'loading',336:'deli',337:'juniors',338:'coffee',339:'carmines',340:'parking',341:'carmines',342:'dining',343:'corner'};
export function west44Facade(f){
 if(f.street!=='West 44th Street')return f;
 const style=STYLES[Number(f.id.replace('district-',''))];if(!style)return f;
 return {...f,west44:style,palette:['majestic','stjames','yellowtheatre','backstage','pizza','stage','sardis'].includes(style)?3:['ornate','loading','parking'].includes(style)?0:4,scaffold:false,canopy:false,screen:false};
}
export const WEST44_VISITS=[
 {name:'West 44th Street · 267 toward Times Square',address:'267 W 44th Street · theatre block',normal:[-.485,-.875,0],view:{position:[-259,51,.17],yaw:2.075,pitch:-.04}},
 {name:'West 44th Street · Sardi’s and theatre fronts',address:'West 44th Street · mid-block',normal:[.484,.875,0],view:{position:[-171,-7,.17],yaw:2.075,pitch:-.04}},
 {name:'West 44th Street · Times Square approach',address:'200 W 44th Street · Broadway',normal:[.484,.875,0],view:{position:[-86,-52,.17],yaw:2.075,pitch:-.04}}
];
export function addWest44Details(f,a,mesh,bulbs,labels,windows,posters,curtain){
 const style=f.west44,w=f.width,top=f.top;
 const box=(x,y,z,ww,d,h,c,solid=false)=>mesh.box(a.p(x,y,z),a.r,a.n,ww,d,h,c,solid);
 const face=(x,y,z,ww,h,extra={})=>({center:a.p(x,y,z),normal:a.n,right:a.r,width:ww,height:h,...extra});
 const sign=(variant,x,y,z,ww,h,shade=.66)=>labels.push(face(x,y,z,ww,h,{kind:'west44',variant,shade}));
 const title={pharmacy:0,majestic:1,stjames:2,pizza:3,sugar:4,yellowtheatre:5,ornate:14,sardis:6,bowl:7,juniors:8,parking:9,office:10,carmines:11,dining:12,coffee:12,deli:13,corner:11,stage:14,backstage:14,loading:10}[style];
 const planter=x=>{
  mesh.tube(a.p(x,.65,.17),a.p(x,.65,.76),.35,'#9e9580',true,16);
  mesh.tube(a.p(x,.65,.75),a.p(x,.65,.81),.39,'#b7ac90',false,16);
  for(let i=0;i<8;i++)box(x+Math.sin(i*2)*.19,.65+Math.cos(i*2)*.19,1.00,.23,.23,.40+(i%3)*.07,'#344c36');
 };
 function blade(index,x,height=6.1){
  const z=Math.min(top-height/2-.25,8.8);if(z-height/2<3.8)return;
  box(x,1.0,z,.19,1.35,height,WEST44_COLORS[index]);
  for(const side of [-1,1])labels.push({center:a.p(x+side*.105,1,z),normal:a.r.clone().multiplyScalar(side),right:a.n.clone().multiplyScalar(-side),width:1.27,height:height-.12,kind:'west44',variant:index,shade:.82,west44Vertical:true});
  for(const h of [z-height/2+.4,z+height/2-.4])mesh.tube(a.p(x,.1,h),a.p(x,1,h),.055,'#4c585a');
 }
 function glazing(height=3.4,column=0){
  const count=Math.max(1,Math.round(w/2.4)),pitch=w/count;
  box(0,.21,.30,w,.17,.25,'#4c5150');
  for(let i=0;i<count;i++){
   const x=-w/2+(i+.5)*pitch;
   windows.push(face(x,.27,height/2+.18,pitch-.15,height,{cell:column,shade:['pharmacy','pizza','carmines'].includes(style)?.25:.17}));
   for(const dx of [-pitch/2,pitch/2])box(x+dx,.34,height/2+.18,.08,.13,height+.09,'#827b68');
   box(x,.37,1.65,.045,.12,2.84,'#a69b80');
   mesh.tube(a.p(x+.17,.42,1.04),a.p(x+.17,.42,1.78),.021,'#bdb09a');
  }
 }
 function canopy(color,z=3.8,depth=2.0){
  box(0,depth/2+.16,z,w-.08,depth,.18,color,true);
  box(0,depth+.12,z-.16,w-.08,.10,.27,color);
  sign(title,0,depth+.18,z-.12,w-.30,.24,.72);
  for(let x=-w/2+.18;x<w/2-.1;x+=.36)for(const y of [.65,depth-.12])bulbs.tube(a.p(x,y,z-.13),a.p(x+.025,y,z-.13),.028,'#c4ac7c',false,6);
 }
 function arches(color){
  const count=Math.max(1,Math.round(w/4.8)),pitch=w/count;
  for(let i=0;i<count;i++){
   const x=-w/2+(i+.5)*pitch,r=Math.min(1.2,pitch*.28),bottom=6.05,shoulder=Math.min(8.35,top-2.0);
   if(shoulder<bottom+.5)continue;
   box(x,.23,(bottom+shoulder)/2,2*r,.12,shoulder-bottom,'#293a3b');
   const p=(angle,rad)=>a.p(x+Math.cos(angle)*rad,.30,shoulder+Math.sin(angle)*rad);
   for(let j=0;j<20;j++){const t=j*Math.PI/20,tt=(j+1)*Math.PI/20;
    mesh.quad(a.p(x,.235,shoulder),p(t,r),p(tt,r),a.p(x,.235,shoulder),'#293a3b');
    mesh.quad(p(t,r),p(tt,r),p(tt,r+.19),p(t,r+.19),j%3?color:'#b6aa8b');
   }
   for(const dx of [-r,r])box(x+dx,.30,(bottom+shoulder)/2,.19,.20,shoulder-bottom,color);
   for(let xx=-r+.17;xx<r;xx+=.22)box(x+xx,.35,(bottom+shoulder)/2,.022,.04,shoulder-bottom,'#897e61');
  }
 }
 if(style==='office'){addOfficeGrid(mesh,curtain);return;}
 if(style==='parking'){
  curtain.push(face(0,.20,(top+.18)/2,w,top-.18));
  for(let x=-w/2+.1;x<w/2;x+=1.22)box(x,.29,top/2,.045,.12,top-.18,'#778387');
  for(let z=4.5;z<top;z+=3.2)box(0,.29,z,w,.15,.10,'#6e797b');
  box(0,.36,4.04,w,.22,.73,'#26383b');sign(title,0,.48,4.04,w-.25,.52,.61);
  if(style==='parking'){
   box(-w*.22,.34,1.93,w*.46,.17,3.45,'#283234');
   sign(9,-w*.22,.445,3.44,w*.44,.43,.81);blade(9,w*.32,5.8);
   for(let x=-w/2+.5;x<w/2;x+=3.6)steelCylinder(mesh,a.p(x,.68,.17),a.n);
  }
  return;
 }
 if(style==='backstage'||style==='loading'){
  box(0,.24,2.12,w-.5,.22,3.88,'#615d53');
  for(let x=-w/2+.5;x<w/2-.3;x+=.22)box(x,.36,2.12,.018,.035,3.77,'#817d6c');
  if(style==='backstage')for(const z of [5.1,8.3,11.5]){
   box(0,.72,z,w,1.4,.10,'#4c4a41');
   mesh.tube(a.p(-w/2,.72,z+.95),a.p(w/2,.72,z+.95),.032,'#625c4d');
   for(let x=-w/2+.1;x<w/2;x+=.22)mesh.tube(a.p(x,.72,z),a.p(x,.72,z+.95),.018,'#625c4d');
  }
  return;
 }
 glazing(['pharmacy','sugar'].includes(style)?4.2:3.35,['pizza','sardis','carmines','dining','coffee','juniors'].includes(style)?2:0);
 const theatre=['majestic','stjames','yellowtheatre','ornate','stage'].includes(style);
 if(theatre){
  const trim=style==='stjames'?'#6e9687':style==='majestic'?'#a3987d':'#b1a68c';
  for(const z of [4.55,Math.min(top-.30,11.8)])box(0,.26,z,w,.30,.25,trim);
  arches(trim);canopy(style==='yellowtheatre'?'#514921':style==='stjames'?'#354945':'#494137',3.85,2.12);
  if(style==='majestic'||style==='yellowtheatre'){
   for(const z of [6.0,9.4,12.6]){
    if(z+.8>top)continue;box(0,.73,z,w,1.22,.08,'#5b5549');
    for(let x=-w/2+.12;x<w/2;x+=.24)mesh.tube(a.p(x,1.28,z),a.p(x,1.28,z+.76),.015,'#766c57');
    mesh.tube(a.p(-w/2,1.28,z+.76),a.p(w/2,1.28,z+.76),.025,'#766c57');
   }
  }
  if(['majestic','stjames','yellowtheatre'].includes(style)&&w>7)blade(title,-w/2+.8,Math.min(6.3,top-4.4));
  for(const x of [-w/2+.6,w/2-.6]){if(style==='stjames')planter(x);else steelCylinder(mesh,a.p(x,.67,.17),a.n);}
  if(f.id==='district-325'){
   for(const x of [-1.5,1.5])mesh.tube(a.p(x,.67,.18),a.p(x,.67,1.20),.035,'#718385',true);
   for(const z of [.38,1.14])mesh.tube(a.p(-1.5,.67,z),a.p(1.5,.67,z),.027,'#718385',true);
   for(let x=-1.3;x<1.5;x+=.22)mesh.tube(a.p(x,.67,.39),a.p(x,.67,1.13),.016,'#718385');
  }
  if(f.id==='district-327')for(const x of [-2,0,2]){
   box(x,.63,.20,.38,.38,.06,'#2a3639',true);
   for(let k=0;k<6;k++){
    const z=.24+k*.085,zz=z+.085,r=.17-k*.022,rr=r-.022;
    const ring=(i,h,rad)=>a.p(x+Math.cos(i*Math.PI/6)*rad,.63+Math.sin(i*Math.PI/6)*rad,h);
    for(let i=0;i<12;i++)mesh.quad(ring(i,z,r),ring(i+1,z,r),ring(i+1,zz,rr),ring(i,zz,rr),k===2||k===4?'#c1c1ad':'#ba632f',true);
   }
  }
  for(const x of [-w*.30,w*.30]){box(x,.41,2.13,1.12,.16,1.85,'#293337');posters.push(face(x,.50,2.13,1.02,1.73,{ad:(Number(f.id.split('-')[1])+Math.round(x)+80)%8}));}
 }else{
  const awning=['pizza','sardis','juniors','coffee','carmines','dining','corner'].includes(style);
  if(awning)canopy(style==='pizza'||style==='sardis'||style==='carmines'?'#733039':style==='juniors'?'#9e552b':'#2c424b',3.50,1.65);
  box(0,.36,4.32,w,.24,.77,WEST44_COLORS[title]);sign(title,0,.49,4.32,w-.28,.60,.74);
  for(const z of [7.0,10.2]){
   if(z+1.13>top)continue;
   for(let x=-w/2+1.1;x<w/2-.7;x+=2.65){windows.push(face(x,.21,z,1.45,2.1,{cell:0,shade:.12}));box(x,.27,z-1.16,1.72,.21,.14,'#9d927f');}
  }
  if(['sardis','bowl','juniors','carmines'].includes(style)&&w>7)blade(title,w/2-.75,5.2);
  if(style==='bowl')for(const z of [7.0,10.0]){box(0,.38,z,w*.7,.20,2.40,'#b99c46');box(0,.51,z,w*.7-.22,.06,2.18,'#253035');}
  if(style==='sardis')for(const x of [-w/2+.6,w/2-.6])planter(x);
  if(['carmines','corner','dining'].includes(style))for(const x of [-w/2+.5,w/2-.5])steelCylinder(mesh,a.p(x,.66,.17),a.n);
 }
}
