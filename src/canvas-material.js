import{Material as CesiumMaterial}from'cesium';

// Fabric deep-clones its constructor input and cached type template. Native
// canvas/image objects cannot be reconstructed with `new value.constructor()`.
// Keep only a serializable placeholder in Fabric; attach live textures after
// construction, so repeated scene creation also leaves the type cache safe.
export class Material extends CesiumMaterial{
 constructor(options={}){
  const bindings=[],fabric=options.fabric;
  if(fabric?.uniforms){
   const uniforms={...fabric.uniforms};
   for(const[key,value]of Object.entries(uniforms)){
    const nativeTexture=value&&typeof value==='object'&&(typeof value.getContext==='function'||['HTMLCanvasElement','HTMLImageElement','HTMLVideoElement','ImageBitmap','OffscreenCanvas'].some(name=>typeof globalThis[name]==='function'&&value instanceof globalThis[name]));
    if(nativeTexture){bindings.push([key,value]);uniforms[key]=CesiumMaterial.DefaultImageId;}
   }
   if(bindings.length)options={...options,fabric:{...fabric,uniforms}};
  }
  super(options);
  for(const[key,value]of bindings)this.uniforms[key]=value;
 }
}
