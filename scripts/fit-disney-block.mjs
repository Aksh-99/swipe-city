import {Vector3} from 'three';

// The old generic shop landed on the 45th Street return. Use the Broadway
// face of the same surveyed 1540 Broadway podium for the reference storefront.
export function fitDisneyBlock(store,city){
 const anchor=new Vector3(...store.sourceAnchor),guess=new Vector3(-.880995,.473125,0).normalize();
 const hit=city.ray(anchor.clone().addScaledVector(guess,65).setZ(6),guess.clone().negate(),110);
 if(!hit)throw new Error('Disney Broadway frontage unavailable');
 const normal=hit.face.normal.clone().setZ(0).normalize();if(normal.dot(guess)<0)normal.negate();
 const right=new Vector3(-normal.y,normal.x,0),sideNormal=new Vector3(...store.normal),sideRight=new Vector3(-sideNormal.y,sideNormal.x,0);
 const a=normal.dot(hit.point),b=sideNormal.dot(new Vector3(...store.center).addScaledVector(sideNormal,-.12)),det=normal.x*sideNormal.y-normal.y*sideNormal.x;
 const corner=new Vector3((a*sideNormal.y-normal.y*b)/det,(normal.x*b-a*sideNormal.x)/det,0);
 const width=58,height=9.4;
 const front={center:corner.clone().addScaledVector(right,-width/2).addScaledVector(normal,.16),normal,right,width,height};
 const side={center:corner.clone().addScaledVector(sideRight,13).addScaledVector(sideNormal,.16),normal:sideNormal,right:sideRight,width:26,height};
 for(const f of [front,side])for(const u of [-.485,0,.485])for(const z of [1,6,9.2,12]){
  const h=city.ray(f.center.clone().addScaledVector(f.right,u*f.width).addScaledVector(f.normal,3).setZ(z),f.normal.clone().negate(),5);
  if(!h||Math.abs(h.distance-3.16)>.3)throw new Error('Disney retail block must stay attached to the original podium');
 }
 const slots=[
  {id:'playbox',name:'PLAYBOX',kind:'variety',x:-24.2,width:9.2,color:'#dc4b8f',art:2},
  {id:'disney',name:'Disney Store',kind:'toys',x:-10.10,width:18.6,color:'#e22335',art:0},
  {id:'avenue21',name:'AVENUE 21',kind:'fashion',x:6.65,width:14.5,color:'#b4935d',art:1},
  {id:'city-sole',name:'CITY SOLE',kind:'sneakers',x:21.40,width:14.4,color:'#cedfe3',art:3},
 ];
 const entries=slots.map(slot=>{
  const center=front.center.clone().addScaledVector(right,slot.x),position=center.clone().addScaledVector(normal,slot.id==='disney'?19:10).setZ(.17);
  const common={...slot,center:center.toArray(),normal:normal.toArray(),height,address:'Broadway / West 45th Street',road:'Broadway',architecture:slot.id==='disney'?'disney-retail-block':'glass-retail-shop',retailGroup:'disney-block',authored:slot.id!=='disney',source:'User-requested fictional shop at a real building facade',view:{position:position.toArray(),yaw:Math.atan2(-normal.x,-normal.y),pitch:-.13},placement:'Authored detailed retail skin on original NYC building geometry'};
  if(slot.id!=='disney')return common;
  return {...store,...common,address:store.address,source:store.source,screenHeight:34.6,corner:corner.toArray(),
   facades:[front,side].map(f=>({center:f.center.toArray(),normal:f.normal.toArray(),width:f.width,height:f.height})),
   placement:'Disney reference frontage on the Broadway face of the original 1540 Broadway podium; large steel-supported LED screens and fictional neighboring shops are authored details'};
 });
 return {disney:entries.find(f=>f.id==='disney'),neighbors:entries.filter(f=>f.id!=='disney')};
}
