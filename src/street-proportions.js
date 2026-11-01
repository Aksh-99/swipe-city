import {BUS_STOPS} from './bus-config.js';

// A small, reversible art-direction adjustment for street-level play.
// OSM centerlines and original NYC building coordinates are never scaled.
export const ROAD_WIDTH_SCALE=.90;
export const ROAD_TYPES=new Set(['primary','secondary','tertiary','residential','unclassified','living_street','primary_link','secondary_link','tertiary_link']);
export function roadWidth(tags){
 const lanes=Number(tags.lanes)||(['primary','secondary'].includes(tags.highway)?3:2);
 const original=parseFloat(tags.width)||Math.max(6,lanes*3.2);
 return {original,width:original*(ROAD_TYPES.has(tags.highway)?ROAD_WIDTH_SCALE:1)};
}
// Keep the existing curb-side bus bays open, with short tapered transitions.
export function sidewalkExpansionFactor(p){
 let factor=1;
 for(const bus of BUS_STOPS){
  const x=p.x-bus.center[0],y=p.y-bus.center[1],across=Math.abs(x*bus.right[0]+y*bus.right[1]);
  if(across>6)continue;
  const along=Math.abs(x*bus.forward[0]+y*bus.forward[1]);
  factor=Math.min(factor,Math.max(0,Math.min(1,(along-bus.length/2-1)/4)));
 }
 return factor;
}
export function crossingPaintPoints(points){
 const at=[0];for(let i=1;i<points.length;i++)at.push(at.at(-1)+Math.hypot(points[i].x-points[i-1].x,points[i].y-points[i-1].y));
 const length=at.at(-1);if(length<.1)return points;
 const start=length*(1-ROAD_WIDTH_SCALE)/2,end=length-start;
 const sample=s=>{let i=1;while(i<at.length-1&&at[i]<s)i++;const t=(s-at[i-1])/(at[i]-at[i-1]||1),a=points[i-1],b=points[i];return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};};
 return [sample(start),...points.filter((p,i)=>at[i]>start&&at[i]<end),sample(end)];
}
