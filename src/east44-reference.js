import {steelCylinder} from './curb-bollard-geometry.js';
export const EAST44_TITLES=['FISH & CHIPS','TIMES DELI & CAFÉ',"O’DONOGHUE’S",'VIRGIL’S BBQ','PARK',"JIMMY’S CORNER",'THE CHATWAL','THE LONG ROOM','ART GALLERY','STUDIO NEW YORK','MILLENNIUM','HUDSON THEATRE','AKA','BELASCO','RESERVE COFFEE','GATSBY’S LANDING','FRESH GRILL','CITY ICES','NYC SOUVENIRS','STREET FOOD'];
export const EAST44_COLORS=['#2b343c','#5a3929','#264d39','#7c3430','#7f2934','#2b466a','#742b3b','#2f493b','#354248','#264b77','#34443c','#455c4d','#4c4b45','#6f5935','#30523e','#294451','#9a6235','#397b79','#4d4857','#806033'];
const STYLES={110:'fish',111:'blue',112:'deli',113:'loading',114:'pub',115:'hotel',116:'bbq',117:'hudson',118:'parking',119:'modern',120:'cornerbar',121:'aka',122:'chatwal',123:'aka',124:'belasco',125:'longroom',126:'belasco',127:'office',128:'office',129:'gallery',130:'glass',131:'glass',132:'green',133:'green',134:'glass',135:'green'};
export const EAST44_VISITS=[{name:'East W44 · Times Square shops and food truck',address:'Broadway → Sixth Avenue',normal:[0,1,0],view:{position:[-1,-96,.17],yaw:2.075,pitch:-.04}},{name:'East W44 · hotel and theatre row',address:'Hudson / Chatwal / Belasco reference fronts',normal:[0,1,0],view:{position:[60,-130,.17],yaw:2.075,pitch:-.04}},{name:'East W44 · Sixth Avenue food truck',address:'Sixth Avenue end of West 44th Street',normal:[0,1,0],view:{position:[143,-176,.17],yaw:2.075,pitch:-.04}}];
export function east44Facade(f){if(f.street!=='West 44th Street')return f;const style=STYLES[Number(f.id.split('-')[1])];return style?{...f,east44:style,scaffold:false,canopy:false,screen:false,palette:['pub','bbq','belasco','cornerbar'].includes(style)?3:['blue','glass','green','office'].includes(style)?4:0}:f;}
export function addEast44Details(f,a,mesh,bulbs,labels,windows,posters,curtain){
 const style=f.east44,w=f.width,top=f.top,ids={fish:0,blue:9,deli:1,loading:9,pub:2,hotel:10,bbq:3,hudson:11,parking:4,modern:9,cornerbar:5,aka:12,chatwal:6,belasco:13,longroom:7,office:9,gallery:8,glass:9,green:14},id=ids[style];
 const p=a.p,box=(x,y,z,ww,d,h,c,solid=false)=>mesh.box(p(x,y,z),a.r,a.n,ww,d,h,c,solid),face=(x,y,z,ww,h,extra={})=>({center:p(x,y,z),normal:a.n,right:a.r,width:ww,height:h,...extra});
 const sign=(index,x,y,z,ww,h,shade=.65)=>labels.push(face(x,y,z,ww,h,{kind:'west44',variant:index+15,shade}));
 const planter=x=>{box(x,.59,.50,.62,.64,.66,'#636b60',true);for(let i=0;i<6;i++)box(x+Math.sin(i)*.15,.59+Math.cos(i)*.13,.99,.23,.23,.32+(i%3)*.08,'#345038');};
 function blade(index,height=5.7){const z=Math.min(top-height/2-.2,8.6);if(z-height/2<3.5)return;const x=w/2-.55;box(x,.91,z,.18,1.22,height,EAST44_COLORS[index]);for(const side of [-1,1])labels.push({center:p(x+side*.10,.91,z),normal:a.r.clone().multiplyScalar(side),right:a.n.clone().multiplyScalar(-side),width:1.15,height:height-.12,kind:'west44',variant:index+15,shade:.80,west44Vertical:true});}
 function canopy(color,z=3.55,depth=1.8){box(0,depth/2+.12,z,w-.1,depth,.18,color,true);box(0,depth+.10,z-.17,w-.1,.10,.32,color);sign(id,0,depth+.16,z-.15,w-.25,.27,.72);for(let x=-w/2+.15;x<w/2-.1;x+=.36)bulbs.tube(p(x,depth-.05,z-.13),p(x+.025,depth-.05,z-.13),.030,'#bda477',false,6);}
 const glazing=['blue','glass','green','office','modern'].includes(style);
 if(glazing){
  curtain.push(face(0,.24,(top+.18)/2,w,top-.18));for(let x=-w/2+.05;x<w/2;x+=1.45)box(x,.31,(top+.18)/2,.050,.13,top-.18,'#718286');for(let z=4.4;z<top;z+=3.3)box(0,.31,z,w,.13,.10,'#7a898a');
  if(style==='blue'){box(0,.35,8.90,w,.17,6.3,'#285785');for(let x=-w/2+.15;x<w/2;x+=.7)box(x,.445,8.90,.025,.04,6.2,'#547997');
   // White branching sidewalk shed, with a clear 1.5 m walking line.
   box(0,1.50,3.95,w-.1,2.8,.14,'#565665',true);
   for(let x=-w/2+.12;x<w/2;x+=3.4){mesh.tube(p(x,2.65,.17),p(x,2.65,3.9),.044,'#a6aaa0',true);for(const dir of [-1,1])mesh.tube(p(x,2.65,2.6),p(x+dir*.75,2.65,3.9),.032,'#b1b2a2');}
   // Original souvenir table sits close to the facade, away from the shed posts.
  }
  if(style==='green')bulbs.box(p(0,.40,3.72),a.r,a.n,w-.2,.025,.11,'#48765b');
  sign(id,0,.395,4.05,Math.min(w-.2,6),.43,.54);return;
 }
 if(style==='loading'){
  box(0,.28,2.12,w-.35,.17,3.80,'#697475');for(let z=.28;z<4;z+=.10)box(0,.38,z,w-.45,.035,.022,'#949b92');for(const x of [-w/2+.2,w/2-.2])box(x,.43,1.2,.1,.10,2.0,'#aa9540');return;
 }
 const bays=Math.max(1,Math.round(w/2.6)),pitch=w/bays;
 for(let i=0;i<bays;i++){const x=-w/2+(i+.5)*pitch;windows.push(face(x,.25,1.93,pitch-.18,3.4,{cell:['deli','bbq','pub','longroom'].includes(style)?2:0,shade:.20}));for(const dx of [-pitch/2,pitch/2])box(x+dx,.33,1.93,.11,.16,3.55,'#8a806b');mesh.tube(p(x+.18,.42,1.05),p(x+.18,.42,1.80),.021,'#b5a58c');}
 box(0,.23,.32,w,.18,.28,'#565950');
 for(const z of [7,10.25]){if(z+1.15>top)continue;for(let x=-w/2+1.1;x<w/2-.6;x+=2.6){windows.push(face(x,.21,z,1.4,2.1,{cell:0,shade:.11}));box(x,.27,z-1.16,1.67,.22,.14,'#a99c83');}}
 box(0,.34,4.10,w,.23,.72,EAST44_COLORS[id]);sign(id,0,.466,4.1,w-.25,.55);
 if(style==='parking'){blade(4);box(0,.34,1.9,w*.68,.15,3.15,'#313b3b');for(let z=.4;z<3.3;z+=.11)box(0,.43,z,w*.66,.02,.022,'#7a7d71');}
 else if(['hudson','belasco'].includes(style)){
  canopy(style==='hudson'?'#3c5d4a':'#544632',3.9,2.12);blade(id,Math.min(5.9,top-4.3));
  for(let x=-w/2+.15;x<w/2;x+=.30){box(x,2.25,3.72,.15,.025,.23,'#bda67e');bulbs.tube(p(x,2.05,4.16),p(x+.012,2.05,4.16),.058,'#c4af7c',false,8);}
  for(const x of [-w*.30,w*.30]){box(x,.37,6.25,w*.30,.18,2.1,'#615443');posters.push(face(x,.47,6.25,w*.28,1.91,{ad:5}));}
  for(const x of [-w/2+.6,w/2-.6])steelCylinder(mesh,p(x,.66,.17),a.n);
 }else if(['hotel','chatwal','aka','longroom'].includes(style)){
  canopy(style==='chatwal'?'#783342':style==='aka'?'#3b4746':'#304839',3.55,1.78);
  for(const x of [-w/2+.55,w/2-.55])planter(x);
  for(const x of [-w*.30,w*.30]){mesh.tube(p(x,.20,5.1),p(x,1.45,6.2),.028,'#6b736a');mesh.quad(p(x,1.45,6.2),p(x+1.03,1.45,6.05),p(x+1.03,1.45,5.18),p(x,1.45,5.33),style==='chatwal'?'#863641':'#344c5a');}
  for(let z=5;z<top;z+=2.9)box(0,.24,z,w,.22,.14,'#9c927d');
 }else{
  canopy(style==='bbq'?'#873f37':style==='pub'||style==='longroom'?'#2f5840':style==='cornerbar'?'#35537b':'#414c47');
  if(['bbq','pub','deli'].includes(style)&&w>7)blade(id);
  if(style==='deli')for(const x of [-w*.26,w*.26]){mesh.tube(p(x,.4,5.5),p(x,1.4,5.5),.033,'#67746b');sign(1,x,1.42,5.42,1.28,1.1,.76);}
  if(style==='cornerbar')box(w*.27,.32,4.84,w*.40,.12,1.10,'#304d75');
  if(style==='gallery')for(const x of [-w*.25,w*.25]){box(x,.34,1.9,2.1,.15,2.65,'#a79c82');posters.push(face(x,.43,1.9,1.85,2.40,{ad:3}));}
 }
 if(['chatwal','hudson','belasco'].includes(style)){
  const count=Math.max(1,Math.round(w/4.5)),spacing=w/count;
  for(let i=0;i<count;i++){const x=-w/2+(i+.5)*spacing,r=Math.min(1.05,spacing*.25),z=Math.min(top-2.1,8.5);if(z<7)continue;
   for(let j=0;j<18;j++){const t=j*Math.PI/18,tt=(j+1)*Math.PI/18,at=(q,rad)=>p(x+Math.cos(q)*rad,.30,z+Math.sin(q)*rad);mesh.quad(at(t,r),at(tt,r),at(tt,r+.18),at(t,r+.18),'#b3a789');}
   for(const dx of [-r,r])box(x+dx,.28,z-.8,.16,.18,1.6,'#b3a789');
  }
 }
}
