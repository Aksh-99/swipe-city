import { Cesium3DTileset, Cesium3DTileStyle, Color, Cartesian3 } from 'cesium';
import { createFacadeShader } from './facades.js';
import { streetSurfaces } from './street-surfaces.js';
import {loadResource} from './resource-loading.js';
export class NycCitySource {
  async load(viewer) {
    this.tileset=await Cesium3DTileset.fromUrl('/data/nyc/tileset.json?finish=avenue-infill-1',{
      maximumScreenSpaceError:8,cacheBytes:96*1024*1024,maximumCacheOverflowBytes:32*1024*1024,
      cullWithChildrenBounds:true,skipLevelOfDetail:false,preloadWhenHidden:false,preloadFlightDestinations:false,
      enableCollision:false
    });
    this.tileset.style=new Cesium3DTileStyle({color:'color("#c3c9ce")'});
    this.tileset.customShader=createFacadeShader({plain:new URLSearchParams(location.search).get('materials')==='plain'});
    viewer.scene.primitives.add(this.tileset);
    this.tileset.tileFailed.addEventListener(error=>{this.error=new Error(`NYC tile failed: ${error.message}`);console.error(this.error);});
    this.loaded=new Set();this.visible=new Set();
    this.tileset.tileLoad.addEventListener(tile=>this.loaded.add(tile));
    this.tileset.tileUnload.addEventListener(tile=>this.loaded.delete(tile));
    viewer.scene.preRender.addEventListener(()=>this.visible.clear());
    this.tileset.tileVisible.addEventListener(tile=>this.visible.add(tile));
    [this.manifest,this.streets]=await Promise.all([loadResource('/data/nyc/manifest.json',{type:'json'}),loadResource('/data/streets-osm.json',{type:'json'})]);
    this.addStreets(viewer);
    return this.manifest;
  }
  addStreets(viewer) {
    viewer.scene.primitives.add(streetSurfaces(this.streets));

  }
  stats(){return {loaded:this.loaded.size,visible:this.visible.size,memory:this.tileset.totalMemoryUsageInBytes};}
  waitUntilVisible(viewer){
    return new Promise((resolve,reject)=>{
      let removeFrame,removeError,finished=false;
      const finish=error=>{if(finished)return;finished=true;clearTimeout(timer);removeFrame?.();removeError?.();error?reject(error):resolve();};
      const timer=setTimeout(()=>finish(this.error??new Error('City tiles did not become visible; reload to retry')),60000);
      removeError=viewer.scene.renderError.addEventListener((scene,error)=>finish(error));
      removeFrame=viewer.scene.postRender.addEventListener(()=>{
        // A failed distant visual tile must not invalidate the visible city.
        // Nearby movement safety is checked independently by CollisionWorld.
        if(this.loaded.size>0&&this.visible.size>0)finish();
      });
    });
  }
}
