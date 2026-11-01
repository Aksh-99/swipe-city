import {Vector3} from 'three';import {DetailMesh} from './detail-mesh.js';import {PARAMOUNT_NORTH} from './paramount-corner-config.js';import {addVendorCart,addVendorUmbrella} from './street-vendor-geometry.js';
export const PARAMOUNT_VISIT=PARAMOUNT_NORTH.visit;
export function addParamountCorner(f,a,ctx){const {mesh,emissive,paving,glass,doors,walkways,paramount}=ctx,{p,n,r}=a,w=f.width;
 const box=(x,y,z,ww,d,h,c,solid=false)=>mesh.box(p(x,y,z),r,n,ww,d,h,c,solid),face=(x,y,z,ww,h,extra={})=>({center:p(x,y,z),normal:n,right:r,width:ww,height:h,...extra}),sign=(kind,x,y,z,ww,h)=>paramount.labels.push(face(x,y,z,ww,h,{kind}));
 // Finish every surveyed lower surface on all three corner planes.
 box(0,.05,(f.bottom+f.top)/2,w,.10,f.top-f.bottom,f.id==='1515-return'?'#9b9688':'#24353b');
 if(f.id==='1515-return'){
  // The W45 fly-tower is a broad blind limestone wall, as in the supplied views.
  paramount.stone.push(face(0,.115,(f.top+.18)/2,w,f.top-.18));
  for(const x of [-10,-2,6,14]){for(const dx of [-.35,.35]){box(x+dx,.18,20.8,.42,.09,.85,'#62655a');for(let z=20.45;z<21.2;z+=.10)box(x+dx,.24,z,.40,.05,.028,'#929482');}}
  // Flush loading panel and service doors: no invented display windows.
  box(-10,.20,4.9,3.4,.18,9.2,'#7e827c',true);for(const dx of [-1.73,1.73])box(-10+dx,.30,4.9,.055,.06,9.25,'#c0c1ae');
  for(const z of [.55,3,6,9.1])for(const dx of [-1.5,1.5])mesh.tube(p(-10+dx,.31,z),p(-10+dx,.34,z),.025,'#414942');
  box(7.0,.21,1.75,1.25,.15,3.1,'#656e69',true);box(7.0,.31,1.45,.3,.08,.045,'#b4b4a6');
  sign('minskoff',7.0,.33,7.2,8.0,.57);
  // Double-sided Lion King blade, high on the plain wall with a visible black box edge.
  const tx=9.2;box(tx,1.2,19.5,.30,2.4,8.0,'#242b2e');for(const side of [-1,1])paramount.labels.push({center:p(tx+side*.165,1.2,19.5),normal:r.clone().multiplyScalar(side),right:n.clone().multiplyScalar(-side),width:2.30,height:7.85,kind:'lionblade'});
  for(const z of [16,22.9])mesh.tube(p(tx,.06,z),p(tx,2.3,z),.075,'#555f60');
 }else if(f.id==='1515-entrance'){
  // Double-height transparent-looking entrance, visible through a sparse grid.
  glass.push(face(0,.18,8.5,w-.10,16.4));for(let x=-w/2+.12;x<w/2;x+=1.34)box(x,.30,8.5,.075,.20,16.5,'#9b9e91');for(const z of [4.8,8.9,16.6])box(0,.32,z,w,.18,.09,'#a2aa9d');
  box(0,.31,2.4,w,.30,4.34,null,true);for(const x of [-2.0,-.65,.65,2.0])for(const d of [-.15,.15])mesh.tube(p(x+d,.49,1.15),p(x+d,.49,2.12),.022,'#c3c2ae');doors.push({point:p(0,.49,.17),normal:n,facade:f.sourceId??f.id});
  paramount.script.push(face(0,.45,12.1,w-.30,1.88));sign('address',0,.43,3.65,w-.45,1.15);sign('lobby',0,.43,6.2,w-.65,.38);
  // Steel-framed overhanging bank billboard and exposed soffit cross-bracing.
  const bankTop=f.top-.25,bankBottom=17.56,bankHeight=bankTop-bankBottom,bankZ=(bankTop+bankBottom)/2;box(0,.63,bankZ,w+.1,1.12,bankHeight,'#414d53');sign('bank',0,1.205,bankZ,w-.12,bankHeight-.12);
  box(0,.62,17.53,w+.16,1.16,.14,'#6d7774');for(let x=-w/2+.3;x<w/2;x+=1.0){mesh.tube(p(x,.15,17.43),p(x,1.16,17.43),.035,'#9ba397');mesh.tube(p(x,.16,17.42),p(Math.min(w/2,x+.8),1.16,17.42),.027,'#929e93');}
  emissive.box(p(0,.37,16.63),r,n,w-.20,.035,.035,'#c4c8b0');
 }else{
  // The small glazed corner shop and a colorful flower campaign beneath the bank ad.
  glass.push(face(0,.20,2.32,w-.2,4.1));for(let x=-w/2+.1;x<w/2;x+=1.4)box(x,.28,2.32,.07,.16,4.18,'#b3b6a9');
  sign('friends',0,.42,4.65,w-.06,.61);box(0,.27,10.3,w,.28,10.0,'#3c4448');sign('flowers',0,.425,10.3,w-.12,9.82);
  box(0,.58,22.1,w+.08,1.02,9.08,'#414d53');sign('bank',0,1.105,22.1,w-.12,8.86);box(0,.59,17.51,w+.1,1.04,.16,'#7b837c');
  for(const x of [-w*.28,w*.28])sign('flowers',x,.30,2.3,w*.42,3.55);
 }
 // Preserve the street datum; follow the recessed entrance at its actual clearance.
 paving.quad(p(-w/2,0,.17),p(w/2,0,.17),p(w/2,3.8,.17),p(-w/2,3.8,.17),'#a3a7a5',true);box(0,.15,.30,w,.22,.25,'#747f79',true);
 mesh.quad(p(-w/2,.145,.17),p(w/2,.145,.17),p(w/2,.145,2.8),p(-w/2,.145,2.8),null,true);
 const inset=f.id==='1515-chamfer'?1.8:f.id==='1515-entrance'?1.3:.5,walkOffset=f.id==='1515-chamfer'?.8:f.id==='1515-entrance'?1.3:2.45;for(let x=-w/2+inset;x<w/2-(f.id==='1515-chamfer'?1.0:.4);x+=.65)walkways.push({facade:f.sourceId??f.id,point:p(x,walkOffset,.17)});paramount.facades.push(f.sourceId??f.id);
}
export function createParamountCartGeometry(){const mesh=new DetailMesh(),emissive=new DetailMesh(),shadow=new DetailMesh(),paving=new DetailMesh(),glass=[],labels=[],pools=[],carts=[],props=[];const f=PARAMOUNT_NORTH.facades.find(f=>f.style==='1515-entrance'),n=new Vector3(...f.normal),r=new Vector3(-n.y,n.x,0),c=new Vector3(...f.center),p=(x,y,z)=>c.clone().addScaledVector(r,x).addScaledVector(n,y).setZ(z);
 const item={id:'paramount-hotdog',position:p(0,5.2,.17).toArray(),normal:n.toArray(),width:1.76,depth:.88,canopyRadius:1.12,kind:'hotdog',colors:'blue-yellow'};carts.push(addVendorCart(mesh,emissive,glass,labels,shadow,item));
 addVendorUmbrella(mesh,emissive,labels,shadow,{...item,position:p(-1.45,5.2,.17).toArray(),canopyRadius:.92});mesh.box(p(-1.35,5.1,.77),r,n,.78,.73,1.15,'#879da4',true);
 // Compact road cases sit beside the vendor rather than in the walking lane.
 for(const [x,y] of [[3.0,6.7],[4.0,6.7]]){mesh.box(p(x,y,.66),r,n,.71,.62,.95,'#29353e',true);for(const z of [.24,1.10])mesh.box(p(x,y,z),r,n,.75,.66,.045,'#9caaac');for(const sx of [-.32,.32])mesh.box(p(x+sx,y,.66),r,n,.035,.66,.94,'#a5afb0');for(const sx of [-.23,.23])mesh.tube(p(x+sx,y-.3,.20),p(x+sx,y+.3,.20),.075,'#202a30',false,12);props.push({point:p(x,y,.17),radius:.5});}
 return {batches:mesh.batches,emissive:emissive.batches,shadow:shadow.batches,paving:paving.batches,collision:new Float32Array(mesh.collision),glass,labels,pools,carts,props,night:{frontNormal:n.toArray(),lights:[{position:p(0,5.2,2).toArray(),radius:[4,4,3],color:[.18,.16,.11]}]}};
}
