import {Vector3} from 'three';
import {FontLoader} from 'three/addons/loaders/FontLoader.js';
import {TextGeometry} from 'three/addons/geometries/TextGeometry.js';
import fontData from 'three/examples/fonts/helvetiker_bold.typeface.json' with {type:'json'};
import {DetailMesh} from './detail-mesh.js';
import {steelCylinder} from './curb-bollard-geometry.js';
import {TOURO as B} from './touro-config.js';
const UP=new Vector3(0,0,1),font=new FontLoader().parse(fontData);
const miter=(a,b)=>a.clone().add(b).divideScalar(1+a.dot(b));
function raisedText(mesh,p,text,x,y,z,maxWidth,height){
 const g=new TextGeometry(text,{font,size:height,depth:.065,curveSegments:4,bevelEnabled:true,bevelThickness:.009,bevelSize:.006,bevelSegments:1});
 g.computeBoundingBox();const bounds=g.boundingBox,scale=Math.min(1,maxWidth/(bounds.max.x-bounds.min.x)),a=g.getAttribute('position'),vertices=[];
 for(let i=0;i<a.count;i++)vertices.push(p(x+(a.getX(i)-(bounds.min.x+bounds.max.x)/2)*scale,y+a.getZ(i),z+(a.getY(i)-bounds.min.y)*scale));
 const faces=[];for(let i=0;i<a.count;i+=3)faces.push([i,i+1,i+2]);mesh.emit(vertices,faces,'#c7b26f');g.dispose();
 return {text,vertices:vertices.length};
}
export function createTouroGeometry(){
 const mesh=new DetailMesh(),emissive=new DetailMesh(),glass=[],labels=[],screens=[],posts=[],lettering=[],canopies=[],lights=[],doors=[],walkways=[];
 const night={frontNormal:B.normal,lights:[]};
 for(const f of B.facades){
  const o=new Vector3(...f.center),n=new Vector3(...f.normal),r=new Vector3(-n.y,n.x,0),w=f.width;
  const p=(x,y,z)=>o.clone().addScaledVector(r,x).addScaledVector(n,y).setZ(z);
  const box=(x,y,z,dx,dy,dz,color,solid=false)=>mesh.box(p(x,y,z),r,n,dx,dy,dz,color,solid);
  const face=(x,y,z,width,height,extra={})=>({center:p(x,y,z),normal:n,right:r,width,height,...extra});
  // Gray granite is a shallow skin over the surveyed podium, not a city box.
  box(0,.025,f.height/2,w,.05,f.height,'#717571');
  box(0,.12,.32,w,.22,.30,'#515954',true);
  const bays=Math.max(1,Math.round(w/4.2)),bw=w/bays;
  for(let j=0;j<bays;j++){
   const x=-w/2+(j+.5)*bw;
   for(let row=0;row<5;row++)box(x,.07,.55+row*1.77,bw-.025,.08,1.73,['#7e7d74','#737872','#7b7b73'][(row+j)%3]);
   // Tall warm lobby panes and bronze-metal reveals beneath the canopy.
   box(x,.14,2.93,bw-.36,.14,5.07,'#303d3d',true);
   glass.push(face(x,.222,2.94,bw-.54,4.94,{kind:'lobby',variant:j,aspect:(bw-.54)/4.94}));
   for(const dx of [-bw/2+.18,bw/2-.18])box(x+dx,.25,2.94,.11,.17,5.16,'#8f9180');
   box(x,.27,.47,bw-.32,.17,.11,'#949482');box(x,.27,5.45,bw-.32,.17,.11,'#aaa28b');
   glass.push(face(x,.13,7.28,bw-.62,2.55,{kind:'transom',variant:j,aspect:(bw-.62)/2.55}));
   for(const dx of [-bw/2+.22,bw/2-.22])box(x+dx,.19,7.25,.18,.18,2.72,'#737a73');
   for(const z of [5.97,8.6])box(x,.19,z,bw-.28,.20,.11,'#949482');
   if(f.id==='west43'&&j===1){
    // Closed glass doors: the entrance remains an exterior inspection detail.
    for(const dx of [-.68,0,.68])box(x+dx,.31,1.77,.065,.16,2.55,'#bbb39c');
    box(x,.31,3.04,1.42,.17,.09,'#bbb39c');
    for(const dx of [-.13,.13])mesh.tube(p(x+dx,.42,1.10),p(x+dx,.42,2.12),.023,'#d0bb8c');
    labels.push(face(x,.344,4.5,2.6,.31,{kind:'address'}));doors.push({position:p(x,.24,.17),normal:n});
   }
  }
  // Projecting brushed-metal canopy, its warm underside and slender edge.
  box(0,.64,5.61,w+.18,1.13,.34,'#8e948c',true);
  box(0,1.18,5.66,w+.18,.08,.33,'#a5a69a');
  box(0,.57,5.42,w-.14,.98,.06,'#777b72');
  emissive.box(p(0,1.23,5.47),r,n,w-.16,.025,.025,'#e5d3a5');
  canopies.push({center:p(0,.64,5.61),width:w});
  if(f.id==='west43'){
   lettering.push(raisedText(mesh,p,'TOURO',-w/2+10.0,1.23,5.91,8.0,1.12));
   labels.push(face(-w/2+10,1.315,5.19,7.0,.19,{kind:'campus'}));
  }
  if(f.id==='seventh'){
   labels.push(face(0,.246,2.96,Math.min(3.55,bw-.65),4.10,{kind:'university'}));
   box(-w/2+.80,.45,17.5,1.23,.59,20.0,'#626e6d');
   labels.push(face(-w/2+.8,.765,17.5,1.09,19.78,{kind:'blade'}));
  }
  // Lights remain localized to the lower windows and canopy at night.
  night.lights.push({position:p(0,1.8,4.1).toArray(),radius:[Math.max(3,w*.65),Math.max(3,w*.65),5.2],color:[.18,.125,.052]});
  lights.push(face(0,1.4,.185,w,3.1,{normal:UP,up:n}));
  const walkOffset=f.id==='corner'?1.5:2.15; // Stay inside the mapped corner curb.
  walkways.push({id:f.id,a:p(-w/2+.7,walkOffset,.17),b:p(w/2-.7,walkOffset,.17),normal:n});
  if(f.id!=='corner')for(let x=-w/2+2;x<w/2-1;x+=3.15){
   if(f.id==='west43'&&Math.abs(x-(-w/2+bw*1.5))<1.7)continue;
   const position=p(x,3.75,.17);steelCylinder(mesh,position,n);posts.push({position,normal:n});
  }
 }
 // Follow all three original planes, including the beveled corner. Mitered
 // screen vertices share endpoints so the campaign wraps without a seam.
 const total=B.facades.reduce((sum,f)=>sum+new Vector3(...f.sourceA).distanceTo(new Vector3(...f.sourceB)),0);let distance=0;
 for(const [i,f]of B.facades.entries()){
  const a=new Vector3(...f.sourceA),b=new Vector3(...f.sourceB),n=new Vector3(...f.normal),r=b.clone().sub(a).normalize(),length=a.distanceTo(b);
  const prev=new Vector3(...B.facades[Math.max(0,i-1)].normal),next=new Vector3(...B.facades[Math.min(B.facades.length-1,i+1)].normal);
  const ja=i?a.clone().lerp(new Vector3(...B.facades[i-1].sourceB),.5):a,jb=i<B.facades.length-1?b.clone().lerp(new Vector3(...B.facades[i+1].sourceA),.5):b;
  const point=(side,offset,z)=>(side?jb:ja).clone().addScaledVector(miter(side?n:prev,side?next:n),offset).setZ(z);
  const corners=[point(0,1.00,B.screenBottom),point(1,1.00,B.screenBottom),point(1,1.00,B.screenTop),point(0,1.00,B.screenTop)];
  const rear=[point(0,.17,B.screenBottom-.20),point(1,.17,B.screenBottom-.20),point(1,.17,B.screenTop+.20),point(0,.17,B.screenTop+.20)];
  mesh.quad(...corners,'#11191f',true);
  mesh.quad(rear[0],rear[1],corners[1],corners[0],'#242d33',true);
  mesh.quad(corners[3],corners[2],rear[2],rear[3],'#242d33',true);
  for(const z of [B.screenBottom-.12,B.screenTop+.12])mesh.tube(point(0,1.015,z),point(1,1.015,z),.066,'#414b51');
  const panel={id:f.id,corners:corners.map(p=>p.clone().addScaledVector(n,.012)),center:corners[0].clone().lerp(corners[2],.5),normal:n,right:r,width:length,height:B.screenTop-B.screenBottom,u0:distance/total,u1:(distance+length)/total};
  screens.push(panel);distance+=length;
 }
 return {batches:mesh.batches,emissive:emissive.batches,collision:new Float32Array(mesh.collision),glass,labels,screens,posts,lettering,canopies,lights,doors,walkways,night,facades:B.facades,screenAspect:total/(B.screenTop-B.screenBottom)};
}
