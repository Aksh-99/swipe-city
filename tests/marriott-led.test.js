import test from 'node:test';import assert from 'node:assert/strict';
import {createMarriottLed,marriottLedUV,MARRIOTT_LED_BANDS} from '../src/marriott-led.js';
import {west45Local} from '../src/west45-config.js';
test('Marriott has a shorter lower screen row below one broad main display, all below hotel glazing',()=>{
 const g=createMarriottLed();assert(g.faces.length<40,'continuous panels replace hundreds of perforated wall triangles');
 for(const f of g.faces){const band=MARRIOTT_LED_BANDS[f.kind];assert(f.width>0);assert.equal(f.height,band[1]-band[0]);for(const p of f.corners){assert(p.z===band[0]||p.z===band[1]);assert(p.toArray().every(Number.isFinite));}assert(Math.abs(f.normal.length()-1)<1e-10);}
 assert.equal(MARRIOTT_LED_BANDS.upper[1],32.4);assert(MARRIOTT_LED_BANDS.lower[1]-MARRIOTT_LED_BANDS.lower[0]<MARRIOTT_LED_BANDS.upper[1]-MARRIOTT_LED_BANDS.upper[0]);
});
test('ad panels meet at shared corners with continuous arc-length UVs and no repeated campaign slices',()=>{
 for(const kind of ['lower','upper']){
  const faces=createMarriottLed().faces.filter(f=>f.kind===kind);
  for(let i=1;i<faces.length;i++){
   assert(faces[i-1].corners[1].distanceTo(faces[i].corners[0])<1e-10);
   assert(faces[i-1].corners[2].distanceTo(faces[i].corners[3])<1e-10);
   if(faces[i].side===faces[i-1].side)assert(Math.abs(marriottLedUV(faces[i-1],1,0)[0]-marriottLedUV(faces[i],0,0)[0])<1e-10);
  }
  for(const group of [false,true]){const subset=faces.filter(f=>f.side===group);assert.equal(subset[0].u0,0);assert(Math.abs(subset.at(-1).u1-1)<1e-10);}
  for(const f of faces)for(const u of [0,1])for(const v of [0,1]){const uv=marriottLedUV(f,u,v);assert(uv.every(x=>x>0&&x<1));assert((kind==='upper')===(uv[1]>.5));}
 }
});
test('Marriott panels stay on the original street-facing footprint and above shops',()=>{
 const g=createMarriottLed();for(const f of g.faces)for(const p of f.corners){const q=west45Local(p.toArray());assert(q.t>=225.4&&q.t<=251.1);assert(q.d>=8.4&&q.d<=66.6);assert(p.z>=8.8);}
 assert(g.faces.some(f=>!f.side&&Math.abs(f.normal.x)>0));
});
test('actual Marriott draw calls use the continuous opaque screens and retain the existing central artwork',async t=>{
 const {Resource}=await import('cesium'),{addMarriottFront}=await import('../src/marriott-front.js');
 t.mock.method(Resource.prototype,'fetchImage',()=>Promise.resolve({width:1,height:1}));
 const previous=globalThis.document;globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>new Proxy({},{get:()=>()=>{}})})};
 const added=[];
 try{
  const result=addMarriottFront({scene:{primitives:{add:p=>added.push(p)}}});
  assert.equal(result.ledPanels,createMarriottLed().faces.length);assert.equal(added.length,4);
  const ad=added.find(p=>p.appearance.material.type==='MarriottModernWrapScreens');
  assert.equal(ad.appearance.material.uniforms.image,'/billboards/marriott-front-campaigns.webp');
  assert(ad.appearance.material.shaderSource.includes('swipeBillboardLight(result.emission)'));
  for(const p of added)assert.equal(p.appearance.isTranslucent(),false);
 }finally{globalThis.document=previous;for(const p of added)p.destroy();}
});
