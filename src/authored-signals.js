import {Vector3} from 'three';
import crossings from '../public/data/jaywalking-crossings.json' with {type:'json'};
const heads=new Map();
export function signalFace(center,normal,width,height,kind='pedestrian',light=null){
 const n=normal.clone().normalize();
 return{center:center.clone(),normal:n,right:new Vector3(-n.y,n.x,0),width,height,kind,light};
}
export function signalGroup(face){
 if(face.kind==='vehicle')return Math.abs(face.normal.y)>.68?0:1;
 let best=null;
 for(const crossing of crossings.crossings){
  const a=new Vector3(...crossing.points[0]),b=new Vector3(...crossing.points.at(-1)),direction=b.clone().sub(a).setZ(0).normalize();
  const alignment=Math.abs(face.normal.dot(direction));if(alignment<.7)continue;
  const p=face.center.clone().setZ(0),distance=Math.min(p.distanceTo(a),p.distanceTo(b)),score=distance+(1-alignment)*8;
  if(!best||score<best.score)best={score,distance,group:crossing.group};
 }
 return best&&best.distance<24?best.group:Math.abs(face.normal.y)>.68?1:0;
}
export function registerAuthoredSignals(faces){
 for(const face of faces??[]){const key=[face.kind,face.light,...face.center.toArray().map(v=>v.toFixed(3)),...face.normal.toArray().map(v=>v.toFixed(3))].join('/');heads.set(key,{...face,group:signalGroup(face)});}
}
export const authoredSignalHeads=()=>[...heads.values()];
export const clearAuthoredSignals=()=>heads.clear();
