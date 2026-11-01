import {Model,Matrix4,Cartesian3,CustomShader,LightingModel,VaryingType,Axis} from 'cesium';
import {frame} from './coordinates.js';
import {treePlacements,treeChunks} from './game-tree-placements.js';
import {loadResource} from './resource-loading.js';
// Instance translations already map city Z-up to glTF Y-up. Disable Cesium's
// additional Z-forward rotation, which otherwise rotates every tree off its pit.
export const TREE_MODEL_AXES=Object.freeze({upAxis:Axis.Y,forwardAxis:Axis.X});
// Cesium exposes model-space normals only in the vertex stage. Pass the
// normal explicitly so the soft tree lighting stays independent of the camera.
export function createTreeShader(){
 return new CustomShader({
  lightingModel:LightingModel.UNLIT,
  varyings:{v_treeNormal:VaryingType.VEC3},
  vertexShaderText:'void vertexMain(VertexInput vsInput, inout czm_modelVertexOutput vsOutput) { v_treeNormal = vsInput.attributes.normalMC; }',
  fragmentShaderText:'void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) { vec3 n=normalize(v_treeNormal); material.diffuse *= .48 + .22 * max(n.y,0.0) + .12 * abs(n.x); }'
 });
}
function instanceBuffer(chunk){
 const count=chunk.rows.length,values=new Float32Array(count*10);
 chunk.rows.forEach((r,i)=>{const [x,y,z]=r.position;values.set([x-chunk.origin[0],z,-(y-chunk.origin[1])],i*3);values.set([0,Math.sin(r.yaw/2),0,Math.cos(r.yaw/2)],count*3+i*4);values.set([r.height,r.height,r.height],count*7+i*3);});
 return values;
}
export function instancedTreeAsset(base,chunk,binaryUrl){
 const g=structuredClone(base),data=instanceBuffer(chunk),count=chunk.rows.length,buffer=g.buffers.length,view=g.bufferViews.length,accessor=g.accessors.length;
 const bytes=new Uint8Array(data.buffer);let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);
 g.buffers[0].uri=binaryUrl;g.buffers.push({byteLength:bytes.length,uri:'data:application/octet-stream;base64,'+btoa(binary)});
 g.bufferViews.push({buffer,byteOffset:0,byteLength:count*12},{buffer,byteOffset:count*12,byteLength:count*16},{buffer,byteOffset:count*28,byteLength:count*12});
 g.accessors.push({bufferView:view,componentType:5126,count,type:'VEC3'},{bufferView:view+1,componentType:5126,count,type:'VEC4'},{bufferView:view+2,componentType:5126,count,type:'VEC3'});
 g.nodes[0].extensions={EXT_mesh_gpu_instancing:{attributes:{TRANSLATION:accessor,ROTATION:accessor+1,SCALE:accessor+2}}};
 g.extensionsUsed=['EXT_mesh_gpu_instancing'];g.extensionsRequired=['EXT_mesh_gpu_instancing'];return g;
}
// GPU instances share two textured meshes rather than loading a model per tree.
// Spatial chunks give Cesium useful bounds for ordinary frustum culling.
export async function addGameTrees(viewer,{resourceOptions={},baseUrl=globalThis.location?.href??'http://localhost/',loadModel=options=>Model.fromGltfAsync(options),onError=error=>console.warn('Tree scenery unavailable',error.message)}={}){
 const rows=treePlacements(),chunks=treeChunks(rows),bases={};
 const models=[],failures=[],report=error=>{failures.push(error);onError(error);};
 await Promise.all(['maple','green'].map(async kind=>{try{bases[kind]=await loadResource(`/trees/${kind}.json`,{...resourceOptions,type:'json'});}catch(error){report(error);}}));
 for(const chunk of chunks){
  if(!bases[chunk.kind])continue;
  let shader,url;
  try{
   const asset=instancedTreeAsset(bases[chunk.kind],chunk,new URL(`/trees/${chunk.kind}.bin`,baseUrl).href);url=URL.createObjectURL(new Blob([JSON.stringify(asset)],{type:'model/gltf+json'}));
   shader=createTreeShader();
   const model=await loadModel({url,...TREE_MODEL_AXES,modelMatrix:Matrix4.multiplyByTranslation(frame,Cartesian3.fromArray(chunk.origin),new Matrix4()),customShader:shader,cull:true,allowPicking:false});
   model.errorEvent?.addEventListener(error=>{report(error);queueMicrotask(()=>{if(!model.isDestroyed?.())viewer.scene.primitives.remove(model);if(!shader.isDestroyed())shader.destroy();});});
   viewer.scene.primitives.add(model);models.push(model);
  }catch(error){if(shader&&!shader.isDestroyed())shader.destroy();report(error);}finally{if(url)URL.revokeObjectURL(url);}
  await new Promise(resolve=>setTimeout(resolve,0));
 }
 return {count:rows.length,chunks:chunks.length,models,failures};
}
