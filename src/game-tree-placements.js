import {Vector3} from 'three';
const placements=new Map();
export function clearTreePlacements(){placements.clear();}
export function treePlacements(){return [...placements.values()];}
// Tree crowns are visual only. The small invisible trunk collider leaves the
// existing pots, grates, flowers and sidewalk routes intact.
export function replacementTree(mesh,root,height){
 height=Math.max(8,height);
 const position=root.toArray(),key=position.map(v=>v.toFixed(2)).join(',');
 if(!placements.has(key)){
  const seed=Math.abs(Math.round(position[0]*13+position[1]*7));
  placements.set(key,{position,height,kind:seed%2?'maple':'green',yaw:seed*.618% (Math.PI*2)});
 }
 mesh.tube(root,root.clone().add(new Vector3(0,0,height*.45)),Math.min(.16,height*.022),null,true,8);
}
export function treeChunks(rows,size=80){
 const chunks=new Map();
 for(const row of rows){const [x,y]=row.position,cx=Math.floor(x/size)*size,cy=Math.floor(y/size)*size,key=`${cx}:${cy}:${row.kind}`;if(!chunks.has(key))chunks.set(key,{kind:row.kind,origin:[cx,cy,0],rows:[]});chunks.get(key).rows.push(row);}
 return [...chunks.values()];
}
