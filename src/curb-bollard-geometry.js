import {Vector3} from 'three';
import {DetailMesh} from './detail-mesh.js';
import {STOREFRONTS} from './storefront-config.js';
import {nearestSegment,segmentProjection} from './street-layout.js';

const UP=new Vector3(0,0,1),RADIUS=.17,HEIGHT=1.08,SIDES=32;
const STEEL=['#68747c','#85919a','#a0abb2','#b8c1c6','#cbd2d6','#dde3e5','#edf0ee','#fafbf7'];

export function steelCylinder(mesh,position,outward){
 const angle=Math.atan2(outward.y,outward.x);
 const p=(a,r,z)=>position.clone().add(new Vector3(Math.cos(a+angle)*r,Math.sin(a+angle)*r,z));
 // Brushed stainless reflections are baked into shared color batches. Broad
 // vertical highlights keep the round sleeves legible at dusk without lights
 // or a separate material/draw call for every post.
 for(let i=0;i<SIDES;i++){
  const a=i/SIDES*Math.PI*2,b=(i+1)/SIDES*Math.PI*2,mid=(a+b)/2;
  const reflection=Math.max(0,Math.min(1,.53+.26*Math.cos(mid-.45)+.25*Math.cos(mid*3+.9)));
  const color=STEEL[Math.round(reflection*(STEEL.length-1))];
  mesh.quad(p(a,RADIUS,.075),p(b,RADIUS,.075),p(b,RADIUS,HEIGHT-.014),p(a,RADIUS,HEIGHT-.014),color);
  mesh.quad(p(a,RADIUS,HEIGHT-.014),p(b,RADIUS,HEIGHT-.014),p(b,RADIUS-.012,HEIGHT),p(a,RADIUS-.012,HEIGHT),'#eff1ec');
 }
 // Flush cap, tiny rolled lip, dark ground socket and weathered lower sleeve.
 mesh.tube(position,position.clone().addScaledVector(UP,.012),RADIUS+.035,'#555e62',false,SIDES);
 mesh.tube(position.clone().addScaledVector(UP,.012),position.clone().addScaledVector(UP,.08),RADIUS+.004,'#9aa4a9',false,SIDES);
 mesh.tube(position.clone().addScaledVector(UP,HEIGHT-.004),position.clone().addScaledVector(UP,HEIGHT),RADIUS-.012,'#cbd2d4',false,SIDES);
 mesh.tube(position,position.clone().addScaledVector(UP,HEIGHT),RADIUS,null,true,24);
}

export function createCurbBollardGeometry(layout){
 const mesh=new DetailMesh(),posts=[];
 const rows=[{id:'disney',group:'disney-block',sidewalkId:1117867050},{id:'hard-rock',group:'paramount-block',sidewalkId:1117866991}];
 for(const row of rows){
 const shops=STOREFRONTS.filter(f=>f.retailGroup===row.group);
 const facade=shops.find(f=>f.id===row.id).facades[0];
 const origin=new Vector3(...facade.center),normal=new Vector3(...facade.normal),right=new Vector3(-normal.y,normal.x,0);
 // Use the same OSM sidewalk and width as the rendered pavement, including
 // its slight angle relative to the surveyed building. Never place these
 // posts from a guessed distance to individual shop windows.
 const sidewalk=layout.sidewalks.find(p=>p.id===row.sidewalkId);
 if(!sidewalk)throw new Error(`${row.id} curb sidewalk is missing from the street layout`);
 const segments=sidewalk.points.slice(1).map((b,i)=>({a:sidewalk.points[i],b}));
 const segment=segments.filter(s=>Math.abs(s.b.clone().sub(s.a).normalize().dot(right))>.98).sort((a,b)=>b.a.distanceTo(b.b)-a.a.distanceTo(a.b))[0];
 if(!segment)throw new Error(`${row.id} curb has no matching frontage segment`);
 const along=segment.b.clone().sub(segment.a).normalize(),outward=new Vector3(-along.y,along.x,0);
 if(outward.dot(normal)<0)outward.negate();
 const doors=shops.map(f=>new Vector3(...f.center).addScaledVector(right,f.id==='disney'?f.width/2-3.15:0).sub(origin).dot(right));
 for(let x=-facade.width/2+1.4;x<=facade.width/2-1.4;x+=1.8){
  const footway=segmentProjection(origin.clone().addScaledVector(right,x),segment.a,segment.b).point;
  const position=footway.clone().addScaledVector(outward,sidewalk.width/2-.32);
  const offset=position.clone().sub(origin).dot(right);
  if(doors.some(door=>Math.abs(offset-door)<.8))continue;
  if((nearestSegment(position,layout.crossings)?.distance??Infinity)<2.5)continue;
  if(layout.signals.some(p=>p.position.clone().setZ(0).distanceTo(position)<1.15))continue;
  position.z=layout.sidewalkHeight(footway);
  steelCylinder(mesh,position,outward);
  posts.push({position,normal:outward.clone(),radius:RADIUS,height:HEIGHT,row:row.id});
 }
 }
 return {batches:mesh.batches,collision:new Float32Array(mesh.collision),posts};
}
