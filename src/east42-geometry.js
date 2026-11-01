import {Vector3} from 'three';
import {DetailMesh} from './detail-mesh.js';
import {steelCylinder} from './curb-bollard-geometry.js';
import {addScaffoldGeometry} from './streetscape-geometry.js';
import {SUBWAY_ENTRANCES} from './streetscape-config.js';
import {EAST42 as B} from './east42-config.js';
const UP=new Vector3(0,0,1);
export function east42Axes(f){const c=new Vector3(...f.center),n=new Vector3(...f.normal),r=new Vector3(-n.y,n.x,0);return {c,n,r,p:(x,y,z)=>c.clone().addScaledVector(r,x).addScaledVector(n,y).setZ(z)};}
export function createEast42Geometry(){
 const mesh=new DetailMesh(),light=new DetailMesh(),paving=new DetailMesh(SUBWAY_ENTRANCES),glass=[],brick=[],windows=[],labels=[],posters=[],netting=[],pools=[],doors=[],bollards=[],obstacles=[],routes=[];
 const night={frontNormal:B.north,lights:[]};
 function tools(f){const a=east42Axes(f);return {...a,
  box:(x,y,z,w,d,h,color,solid=false)=>mesh.box(a.p(x,y,z),a.r,a.n,w,d,h,color,solid),
  face:(x,y,z,w,h,extra={})=>({center:a.p(x,y,z),normal:a.n,right:a.r,width:w,height:h,...extra})};}
 function sign(a,kind,x,y,z,w,h,shade=.70){labels.push(a.face(x,y,z,w,h,{kind,shade}));}
 function poster(a,x,z,w,h,ad=0){a.box(x,.31,z,w+.16,.32,h+.18,'#1b292d');posters.push(a.face(x,.478,z,w,h,{ad}));}
 for(const f of B.facades){
  const a=tools(f),w=f.width,h=f.top-f.bottom,isBrick=f.style==='brick',isStone=f.style==='stone';
  if(isBrick){
   brick.push(a.face(0,.025,(f.top+f.bottom)/2,w,h));
   const bays=Math.max(1,Math.round(w/3.48)),pitch=w/bays;
   for(let z=8.5+Math.max(0,Math.ceil((f.bottom+1.5-8.5)/3.45))*3.45;z<f.top-1.6;z+=3.45)for(let i=0;i<bays;i++){
    const x=-w/2+(i+.5)*pitch,ww=Math.min(1.38,pitch-.65);
    glass.push(a.face(x,.055,z,ww,2.18,{warm:1}));
    for(const side of [-1,1])a.box(x+side*(ww/2+.11),.115,z,.20,.17,2.45,'#b1a395');
    a.box(x,.21,z-1.22,ww+.65,.40,.18,'#b7a998');a.box(x,.20,z+1.24,ww+.54,.31,.26,'#c6b9a4');
    a.box(x,.245,z+1.47,.43,.31,.18,'#cbbfae');a.box(x,.15,z,.045,.11,2.14,'#756a5a');
   }
   for(const z of [5.6,7.0,18.25,32.05,f.top-.35])if(z>f.bottom&&z<f.top)a.box(0,.16,z,w,.34,.28,'#b4a692');
   if(f.bottom<.3)a.box(0,.12,3.1,w,.22,5.65,'#7d786a');
   // Fine corner stone courses retain the original red-brick silhouette.
   for(const x of [-w/2+.22,w/2-.22])for(let z=Math.max(7.2,f.bottom+.25);z<f.top-.25;z+=.57)a.box(x,.14,z,.44,.25,.42,'#a99b8c');
  }else if(isStone){
   a.box(0,.035,(f.top+f.bottom)/2,w,.07,h,'#858b85');
   const bays=Math.max(1,Math.round(w/3.3)),pitch=w/bays;
   for(let z=Math.max(7.9,f.bottom+1.6);z<f.top-1;z+=3.2)for(let i=0;i<bays;i++){
    const x=-w/2+(i+.5)*pitch;glass.push(a.face(x,.09,z,pitch-.85,2.28));
    a.box(x,.18,z-1.24,pitch-.35,.26,.18,'#b1b0a1');
    for(const side of [-1,1]){a.box(x+side*(pitch/2-.22),.18,z,.18,.28,2.9,'#adab9d');for(const dx of [-.05,.05])a.box(x+side*(pitch/2-.22)+dx,.329,z,.025,.03,2.8,'#716e66');}
   }
   for(const z of [5.7,f.top-.65,f.top-.27])if(z>f.bottom)a.box(0,.26,z,w,.44,.20,'#afac9e');
   for(let x=-w/2+.2;x<w/2;x+=.48)a.box(x,.32,f.top-.47,.13,.34,.18,'#c3bdaa');
  }else{
   glass.push(a.face(0,.028,(f.bottom+f.top)/2,w,h));
   const horizontal=f.style==='ribbon';
   for(let x=-w/2+.05;x<w/2;x+=horizontal?2.65:1.63)a.box(x,.135,(f.bottom+f.top)/2,.052,.16,h,'#7c9698');
   for(let z=Math.max(f.bottom+.16,.32);z<f.top;z+=horizontal?1.17:3.45){a.box(0,.15,z,w,.20,horizontal?.16:.105,'#819897');if(horizontal)a.box(0,.16,z+.22,w,.12,.022,'#445d65');}
   a.box(0,.20,f.top-.10,w,.30,.17,'#829696');
  }
  if(f.screen){const s=f.screen,x=s.x??0;a.box(x,.34,s.bottom+s.height/2,s.width+.22,.36,s.height+.22,'#263034');if(s.kind)sign(a,s.kind,x,.525,s.bottom+s.height/2,s.width,s.height,s.shade??.74);else poster(a,x,s.bottom+s.height/2,s.width,s.height,s.ad??2);}
  if(f.id==='knickerbocker-broadway'){
   // Upper scaffold continues over the subway approach. Keeping all of these
   // pipes above six metres leaves the existing stair entrance unobstructed.
   const bottom=6,top=f.top-.25,count=Math.ceil(w/3.1),pitch=w/count;
   netting.push(a.face(0,.84,(bottom+top)/2,w,top-bottom));
   for(let i=0;i<=count;i++)mesh.tube(a.p(-w/2+i*pitch,.75,bottom),a.p(-w/2+i*pitch,.75,top),.04,'#7b8985');
   for(let z=bottom;z<top;z+=2.1){mesh.tube(a.p(-w/2,.75,z),a.p(w/2,.75,z),.04,'#7b8985');for(let i=0;i<count;i++)mesh.tube(a.p(-w/2+i*pitch,.75,z),a.p(-w/2+(i+1)*pitch,.75,Math.min(top,z+2.1)),.025,'#85918b');}
  }
  if(f.bottom>.3||w<2||f.retail===null)continue;
  // Closed storefronts are thin finishes against measured original walls.
  const retail=f.retail||'lobby',storeHeight=f.storeHeight??4.05,bays=Math.max(1,Math.round(w/3.15)),pitch=w/bays;
  a.box(0,.20,storeHeight/2+.2,w,.24,storeHeight,null,true);
  for(let i=0;i<bays;i++){
   const x=-w/2+(i+.5)*pitch;
   windows.push(a.face(x,.333,storeHeight/2+.25,pitch-.14,storeHeight,{cell:retail==='sport'?1:retail==='cafe'?2:0,shade:retail==='lobby'?.23:.40}));
   for(const dx of [-pitch/2,0,pitch/2])a.box(x+dx,.40,storeHeight/2+.24,dx===0?.045:.09,.18,storeHeight+.09,'#758c8b');
   a.box(x,.41,.27,pitch,.20,.19,'#52635f');
  }
  const labelW=Math.min(w-.35,retail==='bank'?25:retail==='knick'?12:retail==='lobby'?8:15);
  a.box(0,.33,storeHeight+.7,w,.30,1.1,retail==='sport'?'#242e21':'#263534');
  sign(a,retail,0,.488,storeHeight+.69,labelW,.72,retail==='planet'?.85:.72);
  // Door frames and long handles make the ground floor readable at human scale.
  for(const dx of [-1.1,0,1.1])a.box(dx,.46,1.92,.085,.18,3.38,'#b8ae96');
  a.box(0,.47,3.61,2.26,.20,.11,'#aca78e');
  for(const dx of [-.53,.53])mesh.tube(a.p(dx,.59,1.05),a.p(dx,.59,1.94),.024,'#bfbca8');
  doors.push({point:a.p(0,.43,.17),normal:a.n,facade:f.id});
  if(f.retail==='sport')for(let x=-w/2+1.6;x<w/2-1.5;x+=6.3){sign(a,'lime',x,.449,2.1,1.15,3.52,.42);}
  if(f.retail==='hilton'||f.retail==='knick'){
   const cw=Math.min(w-.3,8.2),roof=3.72;
   a.box(0,1.1,roof,cw,2.1,.27,'#303e39',true);sign(a,f.retail,0,2.16,roof,cw-.20,.25,.72);
   light.box(a.p(0,1.25,roof-.151),a.r,a.n,cw-.5,1.55,.018,'#bca78d');
   if(f.retail==='hilton')for(let x=-cw/2+.1;x<cw/2;x+=.29)for(let j=0;j<2;j++){const z=roof+.12+j*.13;mesh.tube(a.p(x,2.04,z),a.p(x+.1,2.11,z+.06),.09,(Math.round(x*11)+j)%3?'#665368':'#8c7582',false,6);}
  }
  if(f.retail==='bank'){
   const depth=3.5;
   a.box(0,depth/2,7.25,w-.25,depth,.24,'#888979',true);
   for(let x=-w/2+.8;x<w/2;x+=1.25)a.box(x,depth/2,7.11,.08,depth-.12,.04,'#8c8571');
   light.box(a.p(0,depth-.13,7.10),a.r,a.n,w-.55,.035,.025,'#c3b292');
   sign(a,'bank',0,depth+.015,7.60,Math.min(24,w-.8),.48,.61);
  }
  if(f.portal){
   const x=-w/2+4.1;
   for(const side of [-1,1])a.box(x+side*3.3,.18,7.5,.68,.30,14.5,'#86564c');
   a.box(x,.19,14.7,7.3,.32,.55,'#694f48');glass.push(a.face(x,.36,9.8,5.95,9.2));
   a.box(x,.93,5.2,6.4,1.75,.23,'#443e36',true);sign(a,'lobby',x,1.815,5.22,6.1,.25,.61);
   for(let z=1;z<14.4;z+=.25)for(const side of [-1,1])a.box(x+side*3.3,.34,z,.67,.025,.018,'#584841');
  }
  if(f.id==='broadway-south-shoe-neighbor'){
   glass.push(a.face(-w/2+2.1,.28,25,2.9,36));
   light.box(a.p(-w/2+.68,.40,25),a.r,a.n,.12,.05,35.8,'#376d78');
   for(let z=7.2;z<43;z+=2.5)a.box(-w/2+2.1,.40,z,2.9,.08,.07,'#586f75');
  }
  if(f.retail==='jewelry'){
   const bw=Math.min(w-.3,15),bottom=5.4,top=Math.min(f.top-.2,14.7);
   if(top>bottom+1)for(let i=0;i<3;i++)poster(a,-bw/2+(i+.5)*bw/3,(bottom+top)/2,bw/3-.12,top-bottom,[1,5,1][i]);
  }
  if(f.blade){const s=f.blade,x=s.x??0;a.box(x,.53,s.bottom+s.height/2,s.width,.56,s.height,'#1d2b33');sign(a,s.kind,x,.816,s.bottom+s.height/2,s.width-.12,s.height-.14,.74);}
  night.lights.push({position:a.p(0,1,3).toArray(),radius:[Math.min(w,15),Math.min(w,15),5],color:[.055,.038,.025]});
 }
 for(const s of B.scaffolds){
  addScaffoldGeometry(mesh,s,labels,pools);
  const a=east42Axes(s),top=s.height+1+s.levels*2.1;
  if(s.netted&&top>8)netting.push({center:a.p(0,-s.width/2+.23,(top+s.height+1)/2),normal:a.n,right:a.r,width:s.length,height:top-s.height-1});
  if(s.ad){const ad=s.ad;labels.push({center:a.p(0,-s.width/2+.28,ad.bottom+ad.height/2),normal:a.n,right:a.r,width:ad.width,height:ad.height,kind:ad.kind,shade:.68});}
  if(s.entrySigns)for(const [x,kind]of [[-3.8,'hilton'],[3.8,'planet']])labels.push({center:a.p(x,s.width/2+.08,s.height-.24),normal:a.n,right:a.r,width:6.8,height:.38,kind,shade:.66});
 }
 for(const strip of B.paving){
  const a=east42Axes(strip),w=strip.length;
  paving.quad(a.p(-w/2,0,.175),a.p(w/2,0,.175),a.p(w/2,strip.width,.175),a.p(-w/2,strip.width,.175),'#959e9a',true);
 }
 for(const b of B.bollards){const position=new Vector3(...b.position),normal=new Vector3(...b.normal);steelCylinder(mesh,position,normal);bollards.push({position,normal});}
 // Street furniture occupies measured sidewalk margins; none crosses a stair
 // aperture, mapped crossing or the clear scaffold walking route.
 for(const q of B.props){
  const a=tools(q),w=q.width??2.1;
  if(q.kind==='barrier'){
   for(const x of [-w/2+.15,w/2-.15]){mesh.tube(a.p(x,0,.18),a.p(x,0,1.20),.035,'#919e9d',true);a.box(x,0,.2,.09,.60,.09,'#849190',true);}
   for(const z of [.47,1.20])mesh.tube(a.p(-w/2,0,z),a.p(w/2,0,z),.036,'#a1aaa5');
   for(let x=-w/2+.12;x<w/2;x+=.16)mesh.tube(a.p(x,0,.48),a.p(x,0,1.18),.015,'#758889');
   a.box(0,0,.72,w,.08,.97,null,true);
  }else if(q.kind==='drum'){
   a.box(0,0,.22,.63,.63,.1,'#313a3a',true);
   for(let k=0;k<6;k++)mesh.tube(a.p(0,0,.27+k*.115),a.p(0,0,.27+(k+1)*.115),.255-k*.007,k%2?'#c3c5b3':'#d26236',true,16);
  }else if(q.kind==='kiosk'){
   a.box(0,0,1.7,2.56,.59,3.0,'#667b7b',true);a.box(0,0,3.25,2.80,.82,.16,'#87948c');
   for(const side of [-1,1]){const n=a.n.clone().multiplyScalar(side);posters.push({center:a.p(0,side*.305,1.77),normal:n,right:new Vector3(-n.y,n.x,0),width:2.30,height:2.50,ad:side>0?0:6});}
  }else if(q.kind==='bench'){
   a.box(0,0,.47,w,.65,.15,'#636e65',true);a.box(0,-.28,.77,w,.1,.65,'#59675e',true);
   for(const x of [-w/2+.27,w/2-.27])a.box(x,0,.31,.12,.52,.3,'#75827a',true);
   for(let x=-w/2+.05;x<w/2;x+=.14)a.box(x,.02,.558,.085,.59,.025,'#7d8270');
  }else if(q.kind==='planter'){
   a.box(0,0,.58,w,1.05,.82,'#58675d',true);a.box(0,0,.97,w+.08,1.11,.08,'#788578');a.box(0,0,1.02,w-.15,.85,.13,'#364e3e');
   for(let x=-w/2+.2;x<w/2;x+=.3)for(const y of [-.25,0,.25])mesh.tube(a.p(x,y,1.02),a.p(x+.08,y,1.30),.20,'#405b43',false,6);
  }
  obstacles.push({kind:q.kind,point:a.c,normal:a.n,width:w});
 }
 for(const r of B.routes)routes.push({id:r.id,points:r.points.map(p=>new Vector3(...p))});
 return {batches:mesh.batches,paving:paving.batches,emissive:light.batches,glass,brick,windows,labels,posters,netting,pools,doors,bollards,obstacles,routes,night,facades:B.facades,collision:new Float32Array([...mesh.collision,...paving.collision])};
}
