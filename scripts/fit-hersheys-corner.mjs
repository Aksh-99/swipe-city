import {Vector3} from 'three';

export function fitHersheysCorner(store,city){
 const origin=new Vector3(...store.center),normal=new Vector3(...store.normal),right=new Vector3(-normal.y,normal.x,0);
 const sideHit=city.ray(origin.clone().addScaledVector(right,22).addScaledVector(normal,-8).setZ(6),right.clone().negate(),12);
 if(!sideHit)throw new Error('Hershey’s W 47th Street wall unavailable');
 const sideNormal=sideHit.face.normal.clone().setZ(0).normalize();if(sideNormal.dot(right)<0)sideNormal.negate();
 const sourceFront=origin.clone().addScaledVector(normal,-.12),a=normal.dot(sourceFront),b=sideNormal.dot(sideHit.point),det=normal.x*sideNormal.y-normal.y*sideNormal.x;
 const corner=new Vector3((a*sideNormal.y-normal.y*b)/det,(normal.x*b-a*sideNormal.x)/det,0);
 const sideRight=new Vector3(-sideNormal.y,sideNormal.x,0),radius=1.12,height=10.2;
 const facades=[
  {kind:'front',center:corner.clone().addScaledVector(right,-14).addScaledVector(normal,radius),normal,right,width:28},
  {kind:'side',center:corner.clone().addScaledVector(sideRight,10).addScaledVector(sideNormal,radius),normal:sideNormal,right:sideRight,width:20},
 ];
 for(const f of facades)for(const u of [-.47,0,.47])for(const z of [1,6,9.7,20,30]){
  const h=city.ray(f.center.clone().addScaledVector(f.right,u*f.width).addScaledVector(f.normal,3).setZ(z),f.normal.clone().negate(),7);
  if(!h||Math.abs(h.distance-(3+radius))>.28)throw new Error(`Hershey’s ${f.kind} facade must follow the original source wall at height ${z}`);
 }
 const out=normal.clone().multiplyScalar(1.8).add(sideNormal).normalize(),view=corner.clone().addScaledVector(out,24).addScaledVector(right,-4).setZ(.17);
 return {...store,center:facades[0].center.toArray(),width:28,height,architecture:'hersheys-glass-corner',corner:corner.toArray(),radius,
  facades:facades.map(f=>({kind:f.kind,center:f.center.toArray(),normal:f.normal.toArray(),width:f.width,height})),
  screenHeight:30.6,view:{position:view.toArray(),yaw:Math.atan2(-out.x,-out.y),pitch:-.13},
  placement:'Reference-inspired Hershey’s frontage on the original Seventh Avenue / W 47th Street wall planes, with a shallow rounded skin; original building geometry retained'};
}
