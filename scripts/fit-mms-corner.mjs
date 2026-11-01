import {Vector3} from 'three';

// The reference shows the Broadway / W 48th Street corner of 1600 Broadway.
// Fit both decorative skins to the source podium, keeping its surveyed footprint.
export function fitMmsCorner(store,city){
 const origin=new Vector3(...store.center),normal=new Vector3(...store.normal),right=new Vector3(-normal.y,normal.x,0);
 const sideGuess=new Vector3(-.53,-.848,0).normalize();
 const hit=city.ray(origin.clone().addScaledVector(right,43).addScaledVector(sideGuess,5).setZ(6),sideGuess.clone().negate(),15);
 if(!hit)throw new Error('M&M’s W 48th Street source facade unavailable');
 const sideNormal=hit.face.normal.clone().setZ(0).normalize();if(sideNormal.dot(sideGuess)<0)sideNormal.negate();
 const frontPlane=origin.clone().addScaledVector(normal,-.12),a=normal.dot(frontPlane),b=sideNormal.dot(hit.point),det=normal.x*sideNormal.y-normal.y*sideNormal.x;
 const corner=new Vector3((a*sideNormal.y-normal.y*b)/det,(normal.x*b-a*sideNormal.x)/det,0);
 const sideRight=new Vector3(-sideNormal.y,sideNormal.x,0),height=13.65;
 const faces=[
  {center:corner.clone().addScaledVector(right,-27).addScaledVector(normal,.12),normal,right,width:54},
  {center:corner.clone().addScaledVector(sideRight,14.6).addScaledVector(sideNormal,.12),normal:sideNormal,right:sideRight,width:29.2},
 ];
 for(const f of faces)for(const u of [-.48,0,.48])for(const z of [1,6,10,13]){
  const h=city.ray(f.center.clone().addScaledVector(f.right,u*f.width).addScaledVector(f.normal,3).setZ(z),f.normal.clone().negate(),5);
  if(!h||Math.abs(h.distance-3.12)>.25)throw new Error('M&M’s glazing must remain attached to the original podium');
 }
 const viewDirection=normal.clone().add(sideNormal).normalize(),position=corner.clone().addScaledVector(viewDirection,18).setZ(.17);
 return {...store,center:faces[0].center.toArray(),width:54,height,architecture:'mms-glass-corner',corner:corner.toArray(),
  facades:faces.map(f=>({center:f.center.toArray(),normal:f.normal.toArray(),width:f.width,height})),
  view:{position:position.toArray(),yaw:Math.atan2(-viewDirection.x,-viewDirection.y),pitch:-.13},
  placement:'Reference-inspired glazing on the original Broadway and W 48th Street podium planes; authored finishes and signs, original building geometry preserved'};
}
