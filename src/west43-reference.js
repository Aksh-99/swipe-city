// Authored finishes from the supplied W43 photographs. Positions and facade
// extents remain those surveyed from the NYC model, rather than new buildings.
import {steelCylinder} from './curb-bollard-geometry.js';
import {EAST43_NAMES,addEast43Details} from './west43-east-details.js';
const NORTH={284:'silver',109:'diner',108:'casablanca',106:'tony',104:'parking',102:'mexican',99:'townhall',97:'townhall',95:'glassoffice',94:'glassoffice',91:'glassoffice'};
const SOUTH=new Set([107,105,103,101,100,98,96,93,92]);
export const WEST43_NAMES={diner:['BROOKLYN DINER'],casablanca:['Casablanca'],tony:["Tony’s Di Napoli"],parking:['PARK  ↓'],silver:['1500 BROADWAY'],stone:['43rd Street Kitchen'],brick:['WEST 43 PARKING'],service:['SERVICE ENTRANCE'],...EAST43_NAMES};
export function west43Facade(original){
 if(original.street!=='West 43rd Street')return original;
 const id=Number(original.id.replace('district-','')),style=NORTH[id]||([101,100].includes(id)?'sondheim':[98,96,93,92].includes(id)?'glassoffice':SOUTH.has(id)?'service':null);
 if(!style)return original;
 const palette={silver:4,diner:3,casablanca:0,tony:0,parking:3,brick:3,stone:0,service:2,mexican:0,townhall:3,sondheim:3,glassoffice:4}[style];
 return {...original,kind:style,referenceStyle:style,palette,screen:false,canopy:['diner','casablanca','tony','stone'].includes(style),scaffold:style==='diner',signVariant:0};
}
export const WEST43_VISIT={name:'West 43rd reference streetscape',address:'Broadway → Sixth Avenue · West 43rd Street',normal:[-.48,-.877,0],view:{position:[-7,-178,.17],yaw:2.075,pitch:-.04}};
export function addWest43Details(f,a,mesh,bulbs,labels,windows,posters=[],curtain=[]){
 const style=f.referenceStyle;if(!style)return;
 if(['mexican','townhall','sondheim','glassoffice'].includes(style)){addEast43Details(f,a,mesh,bulbs,labels,windows,posters,curtain);return;}
 const box=(x,y,z,w,d,h,color,solid=false)=>mesh.box(a.p(x,y,z),a.r,a.n,w,d,h,color,solid);
 const face=(x,y,z,w,h,extra={})=>({center:a.p(x,y,z),normal:a.n,right:a.r,width:w,height:h,...extra});
 const w=f.width;
 if(style==='service'){
  // Closed loading shutters and louvers on the actual wall, with a clear
  // sidewalk outside the protective posts. No fictitious accessible interior.
  for(const x of [-w*.28,w*.28]){
   box(x,.37,1.80,w*.39,.12,3.12,'#4f595e');
   for(let z=.30;z<3.30;z+=.12)box(x,.445,z,w*.39,.025,.022,'#6a7477');
   for(const dx of [-w*.195,w*.195])box(x+dx,.49,1.15,.10,.09,1.9,'#9b7c32');
   box(x,.35,4.00,w*.42,.11,.77,'#1c272d');
   for(let z=3.67;z<4.36;z+=.085)box(x,.425,z,w*.41,.045,.018,'#526268');
  }
  // Keep posts near the wall, away from the walking line at y=1.5.
  for(const x of [-w/2+.5,w/2-.5])steelCylinder(mesh,a.p(x,.72,.17),a.n);
  windows.push(face(0,.50,1.87,1.95,3.10,{cell:0,shade:.14}));
  for(const x of [-1.05,1.05])box(x,.56,1.87,.10,.16,3.24,'#747f84');
  if(f.id==='district-101'){
   // Compact maintenance enclosure hugs the facade, leaving the main
   // pedestrian corridor free. Tapered orange cones are physical obstacles.
   for(const x of [-1.9,1.9]){
    box(x,.62,.20,.38,.38,.06,'#263137',true);
    for(let k=0;k<6;k++){
     const z=.24+k*.09,zz=z+.09,rad=.17-k*.022,next=rad-.022;
     const ring=(i,h,r)=>a.p(x+Math.cos(i*Math.PI/6)*r,.62+Math.sin(i*Math.PI/6)*r,h);
     for(let i=0;i<12;i++)mesh.quad(ring(i,z,rad),ring(i+1,z,rad),ring(i+1,zz,next),ring(i,zz,next),k===2||k===4?'#d1d0bd':'#b7622f',true);
    }
   }
   for(let x=-1.8;x<1.8;x+=.24)box(x,.62,.66,.23,.015,.055,Math.round((x+1.8)/.24)%2?'#b8a97a':'#722f30');
  }
  return;
 }
 if(style==='silver'){
  for(let x=-w/2+.05;x<w/2;x+=.82)box(x,.22,5.5,.025,.08,9.0,'#64727a');
  box(0,.32,4.85,w,.38,1.05,'#8b969b');
 }
 if(style==='casablanca'){
  // Decorative tiled frieze and brass lanterns flanking a maroon awning.
  box(0,.28,4.92,w,.13,.49,'#70553c');
  for(let x=-w/2+.12;x<w/2;x+=.38){box(x,.36,4.91,.18,.035,.23,'#b49a67');box(x+.13,.38,4.98,.07,.025,.10,'#283330');}
  for(const x of [-w/2+.65,w/2-.65]){box(x,.51,2.56,.23,.37,.53,'#6f613d');bulbs.box(a.p(x,.71,2.56),a.r,a.n,.15,.025,.35,'#b39763');}
 }
 if(style==='tony'){
  // Three separate script panels, a brown framed restaurant window wall,
  // low planting boxes, and warm canopy trim as in the reference.
  for(const x of [-w/3,0,w/3])labels.push(face(x,1.835,3.30,w/3-.15,.29,{kind:'tony',variant:0,shade:.63}));
  for(const x of [-w*.32,w*.32]){
   box(x,.52,.49,w*.23,.42,.42,'#504335');
   for(let i=0;i<8;i++)box(x-w*.10+i*w*.028,.53,.79,.22,.22,.26+(i%3)*.055,'#324537');
  }
 }
 if(style==='parking'){
  box(0,.38,2.18,w-.45,.11,3.7,'#172126');
  for(let x=-w/2+.3;x<w/2-.2;x+=.18)box(x,.46,2.18,.023,.04,3.63,'#3e4b50');
  box(0,.43,4.49,w,.20,.75,'#7c888c');
  labels.push(face(0,.54,4.50,w-.30,.62,{kind:'parking',variant:0,shade:.86}));
  // Double-sided projecting parking blade; all elevated above head height.
  const x=-w/2+.55,y=1.12,z=8.1;
  box(x,y,z,.20,1.45,5.8,'#701e26');
  for(const side of [-1,1])labels.push({center:a.p(x+side*.112,y,z),normal:a.r.clone().multiplyScalar(side),right:a.n.clone().multiplyScalar(side),width:1.33,height:5.5,kind:'parking',variant:0,shade:.88,vertical:true});
 }
 if(style==='diner'){
  box(0,.32,3.98,w,.20,.72,'#7b252a');
  // Red canopy is separate from the safety shed above it.
  box(0,1.05,3.10,w-.20,1.85,.20,'#84232b');
  labels.push(face(0,2.0,3.09,w-.4,.26,{kind:'diner',variant:0,shade:.75}));
  for(let x=-w/2+.2;x<w/2-.2;x+=.38)bulbs.tube(a.p(x,1.99,3.24),a.p(x+.045,1.99,3.24),.032,'#bca57e',false,6);
  for(let x=-w/2+.15;x<w/2;x+=3.2)for(const y of [.55,2.55])for(let z=.35;z<1.6;z+=.16)box(x,y,z,.101,.101,.078,Math.round(z/.16)%2?'#9b3438':'#b4b0a2');
 }
}
