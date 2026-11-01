import {Vector3} from 'three';import {addGapStreetDetails} from './gap-street-details.js';import {addStudioProjections} from './studio-projections.js';import {DetailMesh} from './detail-mesh.js';import {STUDIOS} from './studios-config.js';
export function createStudiosGeometry(){
 const mesh=new DetailMesh(),glow=new DetailMesh(),glass=[],signs=[],walkways=[],doors=[];
 for(const original of STUDIOS.facades){
 const f=original.id==='retail-front'?{...original,width:original.width/2,center:[original.center[0]-original.normal[1]*original.width/4,original.center[1]+original.normal[0]*original.width/4,0]}:original;const c=new Vector3(...f.center),n=new Vector3(...f.normal),r=new Vector3(-n.y,n.x,0),p=(x,y,z)=>c.clone().addScaledVector(r,x).addScaledVector(n,y).setZ(z),w=f.width,studio=f.id.startsWith('studio');
 const box=(x,y,z,ww,d,h,col,solid=false)=>mesh.box(p(x,y,z),r,n,ww,d,h,col,solid),face=(x,y,z,ww,h,kind)=>({center:p(x,y,z),normal:n,right:r,width:ww,height:h,kind});
 const sign=(x,y,z,ww,h,kind)=>signs.push(face(x,y,z,ww,h,kind));
 box(0,.04,(f.top+.18)/2,w,.08,f.top-.18,studio?'#1b2931':'#486583');
 // Continuous small panes, framed doors and plinth cover the complete lower wall.
 const bays=Math.ceil(w/2.0),pitch=w/bays;for(let j=0;j<bays;j++){const x=-w/2+(j+.5)*pitch;glass.push(face(x,.19,2.55,pitch-.10,4.4,studio?'studio':'shop'));if(!studio)glass.at(-1).display=j%4===0?2:j%3===0?0:1;for(const dx of [-pitch/2,pitch/2])box(x+dx,.24,2.55,.065,.13,4.6,'#8e9794');box(x,.25,.38,pitch,.14,.22,'#34424a');if(j===Math.floor(bays/2)){for(const dx of [-.18,.18])mesh.tube(p(x+dx,.39,1.1),p(x+dx,.39,1.85),.023,'#c3c4ab');doors.push(p(x,.30,.17));}}
 if(!studio){
  if(f.id==='retail-front'){
   glass.push(face(-w*.24,.15,8.6,w*.46,6.4,'shop'));glass.at(-1).display=0;for(let x=-w/2+.3;x<0;x+=1.5)box(x,.25,8.6,.06,.16,6.5,'#9d9a88');sign(-w*.24,.31,8.2,w*.43,1.5,'oldnavy');
   sign(w*.25,.30,9.6,w*.46,7.4,'cityad');sign(w*.25,.33,4.95,w*.46,.55,'gifts');
   // Steel advertising rack and broad rooftop campaign: no replacement building volume.
   const sw=w*.80;for(const x of [-sw*.45,0,sw*.45]){mesh.tube(p(x,-.7,14.4),p(x,-.7,32),.11,'#354451');mesh.tube(p(x,-2.5,17.6),p(x,-.7,29),.08,'#354451');}
   box(0,-.38,25.4,sw+.25,.30,13.9,'#24313c');sign(0,-.20,25.4,sw,13.65,'hero');
  }else{
   // Fashion photographs on the roof advertising rack, as in the GAP references.
   const campaignWidth=f.id==='retail-corner'?Math.min(9.5,w-1):Math.min(12,w-1),campaignHeight=f.id==='retail-corner'?11.6:8.2,cz=f.top+campaignHeight/2+.8;
   for(const xx of [-campaignWidth*.42,campaignWidth*.42]){mesh.tube(p(xx,-.6,f.top-.8),p(xx,-.6,cz+campaignHeight/2),.09,'#3b4a53');mesh.tube(p(xx,-2.0,f.top),p(xx,-.6,cz+2),.065,'#3b4a53');}
   box(0,-.30,cz,campaignWidth+.20,.30,campaignHeight+.20,'#26333d');glass.push(face(0,-.13,cz,campaignWidth,campaignHeight,'shop'));glass.at(-1).display=2;
   glass.push(face(0,.18,10.6,w-.1,10.0,'blue'));for(let x=-w/2+.1;x<w/2;x+=.65)box(x,.25,10.6,.025,.055,10,'#6e8ca2');for(const z of [5.6,10.8,16.3])box(0,.28,z,w,.16,.12,'#b2b2a2');sign(0,.32,11.2,Math.min(4,w*.6),3.6,'gap');
  }
  // Navy sidewalk shed with white branching posts and a clear centre lane.
  box(0,1.4,4.4,w,2.5,.16,'#454b60',true);sign(0,2.68,4.56,w,.55,f.id==='retail-front'?'oldnavy':'gap');
  for(let x=-w/2+.22;x<w/2-.15;x+=3.3){mesh.tube(p(x,2.52,.17),p(x,2.52,4.31),.045,'#c1c4b6',true);for(const s of [-1,1])mesh.tube(p(x,2.52,2.9),p(Math.max(-w/2,Math.min(w/2,x+s*.85)),2.52,4.30),.032,'#c1c4b6');}
  glow.box(p(0,1.5,4.28),r,n,w-.2,.07,.025,'#eee0bd');
  if(f.id!=='retail-front'){
   for(let j=0;j<bays;j++){const xx=-w/2+(j+.5)*pitch;glow.box(p(xx,.29,4.60),r,n,pitch-.17,.035,.065,'#e6e4d5');}
   const entry=w*.12;box(entry,.28,2.53,1.03,.20,4.48,'#774777',true);sign(entry,.392,2.68,.87,.59,'gap');
   for(const xx of [entry-.58,entry+.58])box(xx,.35,2.53,.11,.18,4.66,'#bec4b9');
  }
 }else{
  glass.push(face(0,.13,14.0,w,f.top-5.2,'studio'));for(let x=-w/2+.1;x<w/2;x+=1.35)box(x,.23,15.2,.075,.16,f.top-4.4,'#40525b');for(const z of [5.6,10.0,13.4,17.1,20.6,24.4])box(0,.24,z,w,.14,.10,'#58666b');
  if(f.id==='studio-front'){sign(w*.31,.28,22.5,w*.31,5.8,'watch');sign(-w*.30,.29,22.5,w*.35,5.8,'art');sign(0,.30,3.9,5.7,.52,'studios');}
  else{
   // Tall portrait panel beside the projecting corner, with its own steel rim.
   box(-2.7,.25,14.7,6.6,.20,22.0,'#151f2b');sign(-2.7,.365,14.7,6.24,21.64,'show');
   for(const z of [3.58,25.82])for(let x=-5.5;x<.2;x+=1.0){mesh.tube(p(x,.32,z),p(x,1.1,z+.2),.035,'#596873');box(x,1.14,z+.21,.28,.32,.20,'#5b666c');}
   sign(0,.31,2.7,5.2,.38,'studios');
  }
 }
 for(let x=-w/2+.6;x<w/2-.3;x+=.65)walkways.push({facade:f.id,point:p(x,studio?2.5:1.45,.17)});
 }
 const props=addGapStreetDetails(mesh,signs);
 const projections=addStudioProjections(mesh,signs);
 return {props,projections,batches:mesh.batches,glow:glow.batches,collision:new Float32Array(mesh.collision),glass,signs,doors,walkways};
}
