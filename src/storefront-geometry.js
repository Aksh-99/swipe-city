import {Vector3} from 'three';
import {DetailMesh} from './detail-mesh.js';
import {STOREFRONTS} from './storefront-config.js';
import {createMmsStorefront} from './mms-storefront.js';
import {createHersheysStorefront} from './hersheys-storefront.js';
import {createDisneyRetail} from './disney-retail.js';
import {createHardRockGeometry} from './hard-rock-geometry.js';
import {createTouroGeometry} from './touro-geometry.js';
const UP=new Vector3(0,0,1),tiles={souvenir:0,pizza:1,deli:2,candy:3,toys:4,chocolate:5};
export function createStorefrontGeometry(){
 const mesh=new DetailMesh(),windows=[],signs=[],lights=[];let mms,hersheys,disney,hardRock;
 for(const [index,f] of STOREFRONTS.entries()){
  if(f.architecture==='disney-retail-block'){disney=createDisneyRetail(mesh,f,STOREFRONTS.filter(s=>s.retailGroup==='disney-block'));lights.push(...disney.lights);continue;}
  if(f.architecture==='glass-retail-shop')continue;
  if(f.architecture==='paramount-hard-rock'){hardRock=createHardRockGeometry(mesh,f);lights.push(...hardRock.lights);continue;}
  if(f.architecture==='paramount-neighbor')continue;
  if(f.architecture==='mms-glass-corner'){mms=createMmsStorefront(mesh,f);lights.push(...mms.lights);continue;}
  if(f.architecture==='hersheys-glass-corner'){hersheys=createHersheysStorefront(mesh,f);lights.push(...hersheys.lights);continue;}
  const origin=new Vector3(...f.center),normal=new Vector3(...f.normal),right=new Vector3().crossVectors(UP,normal).normalize(),half=f.width/2,flagship=f.height>5;
  const p=(x,y,z)=>origin.clone().addScaledVector(right,x).addScaledVector(normal,y).setZ(z);
  const box=(x,y,z,w,d,h,color,solid=false)=>mesh.box(p(x,y,z),right,normal,w,d,h,color,solid);
  const face=(x,y,z,w,h,extra={})=>({center:p(x,y,z),normal,right,width:w,height:h,...extra});
  const trim=flagship?'#b7b7af':'#6c7271',top=flagship?4.45:3.13;
  // A shallow retail skin mounted on the source facade, never a replacement
  // building. Closed doors and displays keep the original wall collision.
  box(0,.16,f.height/2+.17,f.width,.35,f.height,flagship?'#1d272f':'#373e3d');
  box(0,.35,.31,f.width,.36,.28,'#4b4e4b',true);
  for(const x of [-half+.07,half-.07])box(x,.37,top/2+.2,.14,.24,top,trim,true);
  box(0,.38,top,f.width,.25,.14,trim);box(0,.4,.56,f.width,.22,.1,trim);
  const doorWidth=1.62,gap=.14,sideWidth=(f.width-doorWidth)/2-.18,panes=Math.max(1,Math.round(sideWidth/2.65)),paneWidth=sideWidth/panes;
  for(const side of [-1,1])for(let j=0;j<panes;j++){
   const x=side*(doorWidth/2+gap+(j+.5)*paneWidth),height=Math.min(2.6,top-.74),centerZ=.62+height/2;
   windows.push(face(x,.39,centerZ,paneWidth-.10,height,{tile:tiles[f.kind],door:false,flip:side>0,variant:j}));
   for(const edge of [-.5,.5])box(x+edge*paneWidth,.44,centerZ,.055,.13,height+.15,trim);
   if(flagship){box(x,.39,3.85,paneWidth-.1, .08,.92,'#172f3a');box(x,.43,3.42,paneWidth,.15,.07,trim);}
  }
  // Double glass doors have visible stiles, kickplates and pull handles.
  for(const side of [-1,1]){
   const x=side*doorWidth/4;windows.push(face(x,.4,1.62,doorWidth/2-.07,2.08,{tile:tiles[f.kind],door:true,flip:false,variant:0}));
   box(x,.46,.6,doorWidth/2-.05,.1,.32,'#59656a');
   mesh.tube(p(side*.12,.59,1.16),p(side*.12,.59,1.91),.024,'#d0d5d2');
  }
  for(const x of [-doorWidth/2,0,doorWidth/2])box(x,.46,1.65,.07,.15,2.5,trim);
  box(0,.46,2.89,doorWidth,.15,.08,trim);
  signs.push(face(.37,.49,2.44,.47,.22,{sign:'open'}));
  // Large, legible flagship marquees sit below the existing billboard layer.
  const signHeight=flagship?1.82:.93,signZ=flagship?5.45:3.78;
  box(0,.43,signZ,f.width-.13,.34,signHeight+.2,f.color);
  for(const z of [signZ-signHeight/2-.05,signZ+signHeight/2+.05])box(0,.63,z,f.width-.1,.06,.045,flagship?'#e8cf8d':'#e8e0c6');
  signs.push(face(0,.615,signZ,f.width-.3,signHeight,{sign:'main',index,entry:f}));
  if(!flagship){
   // Canvas awnings with a sloped roof, short valance and metal supports.
   const awningY=1.07,awningTop=3.25,awningFront=2.94;
   for(let x=-half+.08;x<half-.08;x+=.43){const x1=Math.min(half-.08,x+.43),stripe=Math.floor((x+half)/.43)%2===0;
    const color=(f.kind==='pizza'||f.kind==='deli')&&stripe?'#dfd9bc':f.color;
    mesh.quad(p(x,.46,awningTop),p(x1,.46,awningTop),p(x1,awningY,awningFront),p(x,awningY,awningFront),color);
    box((x+x1)/2,awningY,awningFront-.12,x1-x,.07,.25,color);
   }
   for(const x of [-half+.14,half-.14])mesh.tube(p(x,.45,2.68),p(x,awningY,awningFront),.026,'#909690');
   box(0,.72,2.90,f.width-.35,.08,.045,'#fff0ba');
  }else{
   box(0,.75,4.48,f.width,.9,.16,'#a1a6a5');box(0,.85,4.39,f.width-.25,.10,.03,'#fff3ce');
   for(const x of [-half+.35,half-.35]){box(x,.45,2.54,.11,.16,3.75,'#f4e3aa');}
  }
  // A compact sidewalk menu/display board stays tight to the shop wall.
  if(['pizza','deli','souvenir'].includes(f.kind)){
   const x=-half+.53,y=1.05;
   box(x,y,.86,.67,.16,1.15,'#242c2b',true);
   for(const dx of [-.34,.34])mesh.tube(p(x+dx,y-.20,.17),p(x+dx,y,.86),.025,'#a1a7a0',true);
   signs.push(face(x,y+.09,.91,.58,.87,{sign:f.kind}));
  }
  // Shallow spill light is shared and batched, with no per-shop shadow lights.
  lights.push({center:p(0,1.25,.182),normal:UP,right,up:normal,width:f.width,height:4});
 }
 const touro=createTouroGeometry();for(const value of touro.collision)mesh.collision.push(value);lights.push(...touro.lights);
 return {batches:mesh.batches,collision:new Float32Array(mesh.collision),windows,signs,lights,mms,hersheys,disney,hardRock,touro};
}
