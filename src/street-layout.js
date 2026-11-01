import {Cartesian3} from 'cesium';
import {Vector3} from 'three';
import {toLocal} from './coordinates.js';
import {ROAD_WIDTH_SCALE} from './street-proportions.js';

// All paths come from the bundled OSM extract. Widths and pole offsets are
// authored estimates where OSM supplies no survey, never replacement buildings.
const roads=new Set(['primary','secondary','tertiary','residential','unclassified']);
export const CURB_HEIGHT=.17;
export const localPoint=p=>{const v=toLocal(Cartesian3.fromDegrees(p.lon,p.lat));return new Vector3(v.x,v.y,0);};
export function insideSection(p){const across=p.x*.848-p.y*.53,along=p.x*.53+p.y*.848;return Math.abs(across)<310&&Math.abs(along)<420;}
export function segmentProjection(p,a,b){const d=b.clone().sub(a);const t=Math.max(0,Math.min(1,p.clone().sub(a).dot(d)/d.lengthSq()));const point=a.clone().addScaledVector(d,t);return {point,distance:point.distanceTo(p)};}
export function nearestSegment(p,paths){let best=null;for(const path of paths)for(let i=1;i<path.points.length;i++){const a=path.points[i-1],b=path.points[i];if(a.distanceTo(b)<.01)continue;const hit=segmentProjection(p,a,b);if(!best||hit.distance<best.distance)best={...hit,path,a,b,direction:b.clone().sub(a).normalize()};}return best;}
export function makeStreetLayout(streets){
 const paths=streets.elements.filter(w=>w.geometry?.length>1&&w.geometry.every(Boolean)&&w.tags?.tunnel!=='yes'&&(!w.tags.level||w.tags.level==='0')).map(w=>({id:w.id,tags:w.tags??{},points:w.geometry.map(localPoint)})).filter(w=>w.points.some(insideSection));
 const roadPaths=paths.filter(w=>roads.has(w.tags.highway));
 const sidewalks=paths.filter(w=>w.tags.footway==='sidewalk').map(w=>({...w,width:Math.max(2.2,Math.min(6,parseFloat(w.tags.width)||3.7))}));
 // A closed crossing-area outline is not a walking centerline or two corners.
 const crossings=paths.filter(w=>w.tags.footway==='crossing'&&w.tags.area!=='yes'&&w.points[0].distanceTo(w.points.at(-1))>1);
 const broadway=paths.filter(w=>w.tags.highway==='pedestrian'&&w.tags.name==='Broadway');
 const endpoints=crossings.flatMap(w=>[w.points[0],w.points.at(-1)]);
 function sidewalkEdges(p,direction,width){
  const half=width/2,side=new Vector3(-direction.y,direction.x,0);let best=null;
  // Match the parallel road, not a crossing street at an intersection.
  // All extra pavement goes on the road-facing side of the existing walk.
  for(const path of roadPaths)for(let i=1;i<path.points.length;i++){
   const a=path.points[i-1],b=path.points[i],d=b.clone().sub(a);if(d.lengthSq()<.01||Math.abs(d.normalize().dot(direction))<.85)continue;
   const hit=segmentProjection(p,a,b);if(hit.distance>24||best&&hit.distance>=best.distance)continue;best=hit;
  }
  if(!best)return [half,half];
  const plaza=nearestSegment(p,broadway);if(plaza&&plaza.distance<6&&best.distance>8)return [half,half];
  const toward=best.point.clone().sub(p).dot(side),inset=Math.max(0,Math.min(1.8,(Math.abs(toward)-half)*(1-ROAD_WIDTH_SCALE)));
  return toward>0?[half+inset,half]:[half,half+inset];
 }
 function sidewalkHeight(p){
  // Broadway's pedestrian plazas remain flush. Raised curbs belong along roads.
  const plaza=nearestSegment(p,broadway),road=nearestSegment(p,roadPaths);
  const flush=plaza&&plaza.distance<6&&road?.distance>8;
  let height=flush?.075:CURB_HEIGHT;
  for(const q of endpoints){const d=p.distanceTo(q);if(d<2.6)height=Math.min(height,.045+(CURB_HEIGHT-.045)*Math.max(0,(d-.7)/1.9));}
  return height;
 }
 const inSignalArea=insideSection;
 const signalCrossings=crossings.filter(w=>w.tags.crossing==='traffic_signals'&&w.points.every(inSignalArea));
 const signals=[];
 for(const crossing of signalCrossings){
  const mid=crossing.points[0].clone().lerp(crossing.points.at(-1),.5),road=nearestSegment(mid,roadPaths);
  if(!road||road.distance>12)continue;
  const avenue=Math.abs(road.direction.y)>.68,group=avenue?0:1;
  for(const end of [0,1]){
   const start=crossing.points[end?crossing.points.length-1:0],other=crossing.points[end?0:crossing.points.length-1];
   const facing=other.clone().sub(start).normalize(),side=new Vector3(facing.y,-facing.x,0);
   const candidates=[1,-1].map(sign=>start.clone().addScaledVector(facing,-.65).addScaledVector(side,sign*2.05));
   candidates.sort((a,b)=>(nearestSegment(a,sidewalks)?.distance??99)-(nearestSegment(b,sidewalks)?.distance??99));
   const at=candidates[0];
   // Adjacent crossings can share a physical corner post and two pedestrian heads.
   let pole=signals.find(s=>s.position.distanceTo(at)<3.3);
   if(!pole){pole={id:`corner-${crossing.id}-${end}`,position:at,candidates,pedestrians:[],road,group,vehicle:end===0,street:road.path.tags.name||'Broadway'};signals.push(pole);}
   pole.pedestrians.push({normal:facing,group,crossing:crossing.id});
   if(end===0)pole.vehicle=true;
  }
 }
 return {sidewalks,crossings,roadPaths,broadway,signals,sidewalkHeight,sidewalkEdges};
}

// Preserve the public layout API while sharing timing with server rules.
export {signalPhase} from './signal-cycle.js';
