import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Resource} from 'cesium';
import {addBillboards} from '../src/billboards.js';
test('filtered district billboard batches never submit zero-byte GPU geometry',async t=>{
 t.mock.method(Resource.prototype,'fetchImage',()=>Promise.resolve({width:1,height:1}));
 const prior=globalThis.fetch;globalThis.fetch=async()=>new Response(await readFile('public/data/landmarks.json'));
 const globals=['document','HTMLCanvasElement','HTMLImageElement','HTMLVideoElement','ImageBitmap','OffscreenCanvas'],saved=globals.map(k=>globalThis[k]);
 for(const k of globals.slice(1))globalThis[k]=class{};
 globalThis.document={createElement:()=>Object.assign(Object.create(globalThis.HTMLCanvasElement.prototype),{width:2048,height:2048,getContext:()=>new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{})})})};
 const primitives=[];
 try{
 const screens=await addBillboards({scene:{primitives:{add:p=>primitives.push(p)}},entities:{add(){}}});

 for(const p of primitives)assert.equal(p.appearance.isTranslucent(),false);
 for(const p of primitives)for(const instance of [].concat(p.geometryInstances)){const g=instance.geometry;assert(g.attributes.position.values.byteLength>0);assert(g.indices.byteLength>0);}
 const atlases=new Set(screens.map(s=>s.atlas));assert.equal(primitives.length,3+(screens.length?1:0)+atlases.size,'only populated atlas batches create primitives');
 }finally{globalThis.fetch=prior;globals.forEach((k,i)=>{if(saved[i]===undefined)delete globalThis[k];else globalThis[k]=saved[i];});}
});
