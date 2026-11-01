import {BufferGeometry,BufferAttribute} from 'three';
import {MeshBVH} from 'three-mesh-bvh';
self.onmessage=({data:{id,positions}})=>{
 try{
  const geometry=new BufferGeometry();geometry.setAttribute('position',new BufferAttribute(positions,3));
  const tree=new MeshBVH(geometry,{targetLeafSize:12}),serialized=MeshBVH.serialize(tree,{cloneBuffers:false});
  const transfer=[...serialized.roots];if(serialized.index)transfer.push(serialized.index.buffer);if(serialized.indirectBuffer)transfer.push(serialized.indirectBuffer.buffer);
  self.postMessage({id,serialized},transfer);geometry.dispose();
 }catch(error){self.postMessage({id,error:error.message});}
};
