import{new49Replaces}from'./new49-frontages.js';
import{morgan48Replaces}from'./morgan48.js';
import{mmsWholeReplaces}from'./mms-whole.js';
import{rockefeller48Replaces}from'./rockefeller48.js';
import{five48Replaces}from'./five48.js';
import{voco48Replaces}from'./voco48.js';
import{renaissance48Replaces}from'./renaissance48.js';
import{krispy48Replaces}from'./krispy48.js';
import{west48Replaces}from'./west48-config.js';
import{reference48Replaces}from'./fdny-theta48-config.js';
import{sixth47Replaces}from'./sixth47-config.js';
import{tsx47Replaces}from'./tsx47-config.js';
import {two47Replaces} from './two47-config.js';
import {corner47Replaces} from './corner47-config.js';
import {mid47Replaces} from './mid47-config.js';
import {biltmore47Replaces} from './biltmore47-config.js';
import {carve47Replaces} from './carve47.js';
import {sixth46Replaces} from './sixth46-config.js';
import {east46Replaces} from './east46-config.js';
import {w46CornersReplace} from './w46-corner-config.js';
import {west46ReplacesFacade} from './west46-config.js';
import {east45ReplacesFacade} from './east45-config.js';
import {mcdonaldsReplaces} from './mcdonalds-corner.js';
import {marriottReplacesFacade} from './marriott-reference.js';
import {shubertReplacesFacade} from './shubert-config.js';
import {Vector3} from 'three';
import {west45ReplacesFacade} from './west45-config.js';
import {paramountReplacesFacade} from './paramount-corner-config.js';
import {studiosReplacesFacade} from './studios-config.js';
import {east44Facade,addEast44Details} from './east44-reference.js';
import {addEast44Props} from './east44-props.js';
import {west44Facade,addWest44Details} from './west44-reference.js';
import {west43Facade,addWest43Details} from './west43-reference.js';
import {DetailMesh} from './detail-mesh.js';
import {DISTRICT as DEFAULT_DISTRICT} from './district-config.js';
export function districtAxes(f){const c=new Vector3(...f.center),n=new Vector3(...f.normal),r=new Vector3(-n.y,n.x,0);return {c,n,r,p:(x,y,z)=>c.clone().addScaledVector(r,x).addScaledVector(n,y).setZ(z)};}
// Every skin terminates on a measured city wall. This module contains no
// building volumes; only frontage finishes, narrow sheds and mapped lamps.
export function createDistrictGeometry(D=DEFAULT_DISTRICT,{streetProps=true}={}){
 const mesh=new DetailMesh(),bulbs=new DetailMesh(),walls=[],windows=[],labels=[],posters=[],netting=[],pools=[],passages=[],curtain=[],foodMenus=[];
 const palette=['#92877a','#786858','#949591','#715a4f','#71818a'];
 for(const original of D.facades){
  if(new49Replaces(original)||morgan48Replaces(original)||mmsWholeReplaces(original)||rockefeller48Replaces(original)||five48Replaces(original)||voco48Replaces(original)||renaissance48Replaces(original)||krispy48Replaces(original)||west48Replaces(original)||reference48Replaces(original)||sixth47Replaces(original)||tsx47Replaces(original)||two47Replaces(original)||corner47Replaces(original)||mid47Replaces(original)||biltmore47Replaces(original)||carve47Replaces(original)||sixth46Replaces(original)||east46Replaces(original)||w46CornersReplace(original)||west46ReplacesFacade(original)||east45ReplacesFacade(original)||mcdonaldsReplaces(original)||marriottReplacesFacade(original)||shubertReplacesFacade(original)||west45ReplacesFacade(original)||studiosReplacesFacade(original)||paramountReplacesFacade(original))continue;
  const f=east44Facade(west44Facade(west43Facade(original)));
  const a=districtAxes(f),box=(x,y,z,w,d,h,col,solid=false)=>mesh.box(a.p(x,y,z),a.r,a.n,w,d,h,col,solid),face=(x,y,z,w,h,extra={})=>({center:a.p(x,y,z),normal:a.n,right:a.r,width:w,height:h,...extra});
  const w=f.width,store=f.kind==='office'?4.7:3.5,pitch=w/Math.max(1,Math.round(w/3.3)),bays=Math.round(w/pitch),stone=palette[f.palette];
  walls.push(face(0,.005,(f.top+f.bottom)/2,w,f.top-f.bottom,{palette:f.palette,office:f.kind==='office'}));
  if(f.east44){addEast44Details(f,a,mesh,bulbs,labels,windows,posters,curtain);continue;}
  if(f.west44){addWest44Details(f,a,mesh,bulbs,labels,windows,posters,curtain);continue;}
  const eastReference=['mexican','townhall','sondheim','glassoffice'].includes(f.referenceStyle);
  if(eastReference){addWest43Details(f,a,mesh,bulbs,labels,windows,posters,curtain);continue;}
  box(0,.05,.34,w,.10,.32,'#4d5352');
  // Upper floors use smaller recessed sash openings on side streets, and
  // continuous curtain-wall rhythm on the office avenue.
  for(let z=7.0;z<f.top-1;z+=3.3){
   for(let i=0;i<bays;i++){
    const x=-w/2+(i+.5)*pitch,ww=f.kind==='office'?pitch-.12:Math.min(1.65,pitch-.6);
    windows.push(face(x,.075,z,ww,2.12,{cell:(f.palette+i)%3,shade:.12}));
    box(x,.135,z-1.16,ww+.2,.23,.12,stone);
    for(const dx of [-ww/2,0,ww/2])box(x+dx,.12,z,.045,.12,2.13,'#526267');
   }
  }
  for(const z of [store+.96,f.top-.18])box(0,.16,z,w,.30,.18,stone);
  box(0,.17,store/2+.18,w,.14,store,null,true);
  for(let i=0;i<bays;i++){
   const x=-w/2+(i+.5)*pitch;
   windows.push(face(x,.249,store/2+.18,pitch-.14,store-.14,{cell:f.kind==='coffee'||f.kind==='restaurant'?2:f.kind==='fashion'?1:0,shade:f.kind==='service'?.14:f.referenceStyle?.23:f.kind==='office'?.20:.32}));
   for(const dx of [-pitch/2,pitch/2])box(x+dx,.31,store/2+.18,.09,.16,store+.05,'#6c7e7d');
  }
  box(0,.32,1.62,.06,.15,2.85,'#a0a8a0');box(0,.31,3.12,2.05,.14,.09,'#86918b');
  for(const dx of [-.48,.48])mesh.tube(a.p(dx,.40,1.10),a.p(dx,.40,1.87),.022,'#b4b5aa');
  box(0,.23,store+.48,w,.24,.66,f.kind==='coffee'?'#254538':f.kind==='theatre'?'#483432':'#223136');
  labels.push(face(0,.358,store+.48,w-.25,.53,{kind:f.kind,variant:f.signVariant??f.palette,shade:f.kind==='theatre'?.73:.61}));
  if(f.canopy&&!f.scaffold){
   box(0,.91,3.36,w-.1,1.8,.19,f.kind==='diner'?'#84232b':f.kind==='casablanca'?'#59242d':f.kind==='tony'?'#303c2c':f.kind==='restaurant'?'#3c5145':'#3d3032',true);
   labels.push(face(0,1.82,3.30,w-.24,.24,{kind:f.kind,variant:f.signVariant??f.palette,shade:.55}));
   bulbs.box(a.p(0,.95,3.248),a.r,a.n,w-.5,.035,.023,'#ab9474');
   if(f.kind==='theatre')for(let x=-w/2+.25;x<w/2-.2;x+=.4)bulbs.tube(a.p(x,1.75,3.46),a.p(x+.06,1.75,3.46),.05,'#bca987',false,6);
  }
  if(f.screen){
   const h=Math.min(6.6,f.top-store-1.6),z=store+1.25+h/2;
   for(let i=0;i<3;i++){const pw=(w-.25)/3,x=-w/2+.125+(i+.5)*pw;
    box(x,.27,z,pw-.02,.28,h+.08,'#1f2a2f');posters.push(face(x,.415,z,pw-.10,h,{ad:(f.ad+i)%8}));
   }
  }else if(!f.referenceStyle&&f.kind!=='office'&&w>7){
   posters.push(face(w/2-1.05,.36,1.85,.95,1.45,{ad:f.ad}));
   box(w/2-1.05,.29,1.85,1.04,.12,1.54,'#263336');
  }
  addWest43Details(f,a,mesh,bulbs,labels,windows);
  if(f.scaffold){
   const depth=2.7,top=3.95,length=w-.10;
   box(0,depth/2,top,length,depth,.16,'#536354',true);
   box(0,depth-.01,top-.20,length,.13,.55,'#244237');
   labels.push(face(0,depth+.06,top-.18,Math.min(length-.2,9),.36,{kind:'shed',variant:0,shade:.55}));
   for(let x=-length/2+.10;x<length/2;x+=3.2){
    for(const y of [.55,depth-.15]){mesh.tube(a.p(x,y,.18),a.p(x,y,top+3.6),.045,'#7c8a86',true);box(x,y,.20,.20,.20,.08,'#687771');}
    mesh.tube(a.p(x,.55,top+2.8),a.p(Math.min(x+3.2,length/2),.55,top+.6),.029,'#778985');
   }
   for(const z of [top+.55,top+2.7])mesh.tube(a.p(-length/2,.55,z),a.p(length/2,.55,z),.04,'#80918a');
   netting.push(face(0,.57,top+1.65,length,2.2));
   bulbs.box(a.p(0,1.4,top-.09),a.r,a.n,length-.4,.055,.025,'#afa68b');
   passages.push({id:f.id,points:[a.p(-length/2+1,1.50,.17),a.p(length/2-1,1.50,.17)],height:top});
  }
 }
 const east44Props=D===DEFAULT_DISTRICT&&streetProps?addEast44Props(mesh,bulbs,labels,foodMenus):null;
 for(const l of D.lamps){
  const p=new Vector3(...l.position),n=new Vector3(...l.normal),r=new Vector3(-n.y,n.x,0),q=(x,y,z)=>p.clone().addScaledVector(r,x).addScaledVector(n,y).setZ(z);
  mesh.tube(q(0,0,.18),q(0,0,7.55),.072,'#607172',true,10);
  mesh.tube(q(0,0,.18),q(0,0,.48),.15,'#566365',true,12);
  mesh.tube(q(0,0,7.43),q(0,1.3,7.69),.065,'#687c7c');
  mesh.box(q(0,1.39,7.65),r,n,.34,.72,.16,'#64777b');bulbs.box(q(0,1.4,7.56),r,n,.25,.57,.016,'#c0b7a0');
  pools.push({center:q(0,1.35,.19),normal:new Vector3(0,0,1),right:r,up:n,width:6.0,height:7.0});
 }
 return {batches:mesh.batches,bulbs:bulbs.batches,walls,windows,labels,posters,netting,pools,passages,curtain,foodMenus,east44Props,collision:new Float32Array(mesh.collision),night:{frontNormal:D.north,lights:[]}};
}
