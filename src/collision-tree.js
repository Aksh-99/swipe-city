import {MeshBVH} from 'three-mesh-bvh';
// Tile generation happens away from the rendering/physics thread. Retain the
// original positions until completion so a failed worker can safely fall back.
export function createCollisionTreeBuilder({makeWorker=()=>typeof Worker==='function'?new Worker(new URL('./collision-tree-worker.js',import.meta.url),{type:'module'}):null}={}){
 let worker=null,unavailable=false,nextId=0;const pending=new Map();
 function close(error){worker?.terminate();worker=null;unavailable=true;for(const job of pending.values())job.reject(error);pending.clear();}
 return async geometry=>{
  if(!worker&&!unavailable){try{worker=makeWorker();if(!worker)unavailable=true;else{worker.onmessage=({data})=>{const job=pending.get(data.id);if(!job)return;pending.delete(data.id);data.error?job.reject(new Error(data.error)):job.resolve(data.serialized);};worker.onerror=event=>close(new Error(event.message||'Collision worker failed'));}}catch{unavailable=true;}}
  if(!worker)return new MeshBVH(geometry,{targetLeafSize:12});
  try{
   const serialized=await new Promise((resolve,reject)=>{const id=++nextId;pending.set(id,{resolve,reject});const positions=geometry.attributes.position.array.slice();try{worker.postMessage({id,positions},[positions.buffer]);}catch(error){pending.delete(id);reject(error);}});
   return MeshBVH.deserialize(serialized,geometry);
  }catch{return new MeshBVH(geometry,{targetLeafSize:12});}
 };
}
