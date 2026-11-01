import {Vector3} from 'three';
// Partition triangles against convex stairwell apertures. Rendering and capsule
// colliders use the identical cutouts, including interpolated curb/ramp heights.
function clip(polygon,distance,keepInside){
 const output=[];if(!polygon.length)return output;
 for(let i=0;i<polygon.length;i++){
  const a=polygon[i],b=polygon[(i+1)%polygon.length],da=distance(a),db=distance(b),ina=keepInside?da>=0:da<=0,inb=keepInside?db>=0:db<=0;
  if(ina)output.push(a);if(ina!==inb)output.push(a.clone().lerp(b,da/(da-db)));
 }
 return output;
}
export function entranceAxes(entry){const origin=new Vector3(...entry.origin),forward=new Vector3(...entry.direction),right=new Vector3(forward.y,-forward.x,0);return {origin,forward,right};}
export function entrancePoint(entry,x,y,z=0){const {origin,forward,right}=entranceAxes(entry);return origin.addScaledVector(right,x).addScaledVector(forward,y).setZ(z);}
export function entranceCoordinates(entry,p){const {origin,forward,right}=entranceAxes(entry),d=p.clone().sub(origin);return {x:d.dot(right),y:d.dot(forward)};}
export function insideEntrance(entry,p,margin=0){const q=entranceCoordinates(entry,p);return Math.abs(q.x)<entry.width/2+margin&&q.y>-.02-margin&&q.y<entry.length+entry.landing+margin;}
export function cutGroundTriangle(vertices,entries){
 let polygons=[vertices.map(p=>new Vector3(p.x,p.y,p.z??0))];
 for(const entry of entries){
  const {origin,forward,right}=entranceAxes(entry),width=entry.width/2,total=entry.length+entry.landing;
  const near=vertices.some(p=>Math.hypot(p.x-origin.x,p.y-origin.y)<total+width+20);
  if(!near){const minX=Math.min(...vertices.map(p=>p.x)),maxX=Math.max(...vertices.map(p=>p.x)),minY=Math.min(...vertices.map(p=>p.y)),maxY=Math.max(...vertices.map(p=>p.y));if(origin.x+total+width<minX||origin.x-total-width>maxX||origin.y+total+width<minY||origin.y-total-width>maxY)continue;}
  const planes=[p=>p.clone().sub(origin).dot(right)+width,p=>width-p.clone().sub(origin).dot(right),p=>p.clone().sub(origin).dot(forward),p=>total-p.clone().sub(origin).dot(forward)];
  const next=[];
  for(const polygon of polygons){let remaining=polygon;for(const plane of planes){const outside=clip(remaining,plane,false);if(outside.length>=3)next.push(outside);remaining=clip(remaining,plane,true);if(remaining.length<3)break;}}
  polygons=next;
 }
 const triangles=[];for(const poly of polygons)for(let i=1;i<poly.length-1;i++){const t=[poly[0],poly[i],poly[i+1]];if(t[1].clone().sub(t[0]).cross(t[2].clone().sub(t[0])).lengthSq()>1e-12)triangles.push(t);}
 return triangles;
}
