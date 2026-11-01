import {Vector3} from 'three';

// All skins below are attached to the original NYC triangles. Storefront and
// ornament dimensions are authored from the user's two exterior references.
export function fitHardRockBlock(store,city){
 const anchor=new Vector3(...store.sourceAnchor),guess=new Vector3(.875,-.484,0).normalize();
 const hit=city.ray(anchor.clone().addScaledVector(guess,65).setZ(8),guess.clone().negate(),110);
 if(!hit)throw new Error('1501 Broadway frontage unavailable');
 const normal=hit.face.normal.clone().setZ(0).normalize();if(normal.dot(guess)<0)normal.negate();
 const right=new Vector3(-normal.y,normal.x,0),origin=hit.point.clone().setZ(0);
 function edge(sign){let inside=0,outside=50;for(let i=0;i<17;i++){const mid=(inside+outside)/2,p=origin.clone().addScaledVector(right,sign*mid).addScaledVector(normal,3).setZ(8),h=city.ray(p,normal.clone().negate(),5);if(h&&Math.abs(h.distance-3)<.05)inside=mid;else outside=mid;}return sign*inside;}
 const low=edge(-1),high=edge(1),width=high-low-.40;
 const front={kind:'broadway',center:origin.clone().addScaledVector(right,(low+high)/2).addScaledVector(normal,.16),normal,right,width,height:51.8};
 const corner=origin.clone().addScaledVector(right,low+.06);
 const sideHit=city.ray(corner.clone().addScaledVector(right,-5).addScaledVector(normal,-12).setZ(8),right,10);
 if(!sideHit)throw new Error('Paramount 43rd Street return unavailable');
 const sideNormal=sideHit.face.normal.clone().setZ(0).normalize();if(sideNormal.dot(right)>0)sideNormal.negate();
 const sideRight=new Vector3(-sideNormal.y,sideNormal.x,0);
 const side={kind:'43rd',center:corner.clone().addScaledVector(normal,-16).addScaledVector(sideNormal,.16),normal:sideNormal,right:sideRight,width:31.6,height:44.8};
 const facades=[front,side];
 for(const f of facades)for(const x of [-.48,0,.48])for(const z of [1,6,18,28,Math.min(45,f.height),f.height]){
  const h=city.ray(f.center.clone().addScaledVector(f.right,x*f.width).addScaledVector(f.normal,3).setZ(z),f.normal.clone().negate(),5);
  if(!h||Math.abs(h.distance-3.16)>.20)throw new Error(`Paramount ${f.kind} skin must stay on source building at ${x}, ${z} m`);
 }
 // Immediate neighboring building skins also get independent source-plane
 // checks; keep the north neighbor below its genuine tower setback.
 const neighbors=[];
 for(const spec of [{id:'south',x:-60,width:12,height:34},{id:'north',x:63,width:17,height:14.8}]){
  const h=city.ray(origin.clone().addScaledVector(right,spec.x).addScaledVector(normal,15).setZ(8),normal.clone().negate(),40);
  if(!h)throw new Error(`Missing ${spec.id} neighboring building`);
  const n=h.face.normal.clone().setZ(0).normalize();if(n.dot(normal)<0)n.negate();const r=new Vector3(-n.y,n.x,0),center=h.point.clone().setZ(0).addScaledVector(n,.15);
  const ok=[-.48,0,.48].every(x=>[1,8,spec.height].every(z=>{const s=city.ray(center.clone().addScaledVector(r,x*spec.width).addScaledVector(n,3).setZ(z),n.clone().negate(),5);return s&&Math.abs(s.distance-3.15)<.20;}));
  if(!ok)throw new Error(`Neighbor ${spec.id} detail exceeds its source wall`);
  neighbors.push({...spec,screenHeight:spec.id==='north'?24:spec.height,center:center.toArray(),normal:n.toArray()});
 }
 const portalX=-10,center=front.center.clone().addScaledVector(right,portalX),view=center.clone().addScaledVector(normal,19).setZ(.17);
 const common={normal:normal.toArray(),height:5.4,road:'Broadway',retailGroup:'paramount-block',authored:false};
 const hardRock={...store,...common,center:center.toArray(),width:16,architecture:'paramount-hard-rock',portalX,screenHeight:52,
  facades:facades.map(f=>({kind:f.kind,center:f.center.toArray(),normal:f.normal.toArray(),width:f.width,height:f.height})),neighbors,
  view:{position:view.toArray(),yaw:Math.atan2(-normal.x,-normal.y),pitch:-.16},
  placement:'Reference-inspired Paramount / Hard Rock architectural skin on surveyed Broadway and W 43rd Street faces, with source-fitted neighboring facades'};
 const tacoCenter=front.center.clone().addScaledVector(right,6.2);
 const tacoBell={id:'harbor-shrimp',name:'Harbor Shrimp Co.',address:'1501 Broadway',kind:'restaurant',color:'#233c51',...common,authored:true,center:tacoCenter.toArray(),width:14.1,architecture:'paramount-neighbor',
  view:{position:tacoCenter.clone().addScaledVector(normal,12).setZ(.17).toArray(),yaw:Math.atan2(-normal.x,-normal.y),pitch:-.10},placement:'Fictional seafood storefront name; user-reference restaurant row on the original 1501 Broadway building'};
 return {hardRock,neighbors:[tacoBell]};
}
