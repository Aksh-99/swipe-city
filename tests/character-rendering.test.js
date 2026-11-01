import test from 'node:test';import assert from 'node:assert/strict';
import {ModelGraphics,JulianDate,CustomShader,Matrix4,Matrix3,Cartesian3} from 'cesium';
import {createCharacterShader,CharacterLighting,screenLightSources,sampleScreenLights,CHARACTER_LIGHT_LIMIT} from '../src/character-rendering.js';
import {frame} from '../src/coordinates.js';
import {createStorefrontGeometry} from '../src/storefront-geometry.js';
import {createNasdaqGeometry} from '../src/nasdaq-geometry.js';
test('character shader binds to a real Cesium model and requests animated normals/UVs',()=>{
 const shader=createCharacterShader();try{assert(shader instanceof CustomShader);const model=new ModelGraphics({customShader:shader});assert.equal(model.customShader.getValue(JulianDate.now()),shader);for(const key of ['normalEC','positionEC','texCoord_0','surface'])assert(shader.usedVariablesFragment.attributeSet[key]);}finally{shader.destroy();}
});
const sign=(name,center=[0,0,8],color=[.2,.4,1])=>({name,center,normal:[0,1,0],width:12,height:10,lightColor:color});
test('screen lighting falls with distance, rejects the back side and uses a point on the screen',()=>{
 const sources=screenLightSources([sign('blue')]),near=sampleScreenLights(sources,[2,5,1.7]),far=sampleScreenLights(sources,[2,60,1.7]);
 assert.equal(near.length,1);assert(near[0].intensity>far[0].intensity*4);assert.deepEqual(near[0].position,[2,0,3]);
 assert.equal(sampleScreenLights(sources,[0,-5,1.7]).length,0);assert.equal(sampleScreenLights(sources,[0,100,1.7]).length,0);
});
test('collages share one light and selected sources stay within the rendering budget',()=>{
 const sources=screenLightSources([sign('collage / poster 0'),sign('collage / poster 1',[3,0,8],[1,.1,.05]),...Array.from({length:12},(_,i)=>sign('sign-'+i,[i*4,0,8]))]);
 assert.equal(sources[0].faces.length,2);const selected=sampleScreenLights(sources,[0,5,1.7]);assert.equal(selected.length,CHARACTER_LIGHT_LIMIT);assert.equal(new Set(selected.map(s=>s.id)).size,selected.length);
});
test('billboard positions stay in the city when the camera orbits and local coordinate precision is retained',()=>{
 const lighting=new CharacterLighting([sign('blue')]),cam=(angle,x)=>({inverseViewMatrix:Matrix4.multiply(frame,Matrix4.fromRotationTranslation(Matrix3.fromRotationZ(angle),new Cartesian3(x,5,3)),new Matrix4())});
 try{
  for(let i=0;i<60;i++)lighting.update(cam(0,3),[0,5,0]);
  const source=Cartesian3.fromElements(lighting.slots[0].screen.x,lighting.slots[0].screen.y,lighting.slots[0].screen.z);
  lighting.update(cam(1.8,8),[0,5,0],0);
  assert.deepEqual(Cartesian3.fromElements(lighting.slots[0].screen.x,lighting.slots[0].screen.y,lighting.slots[0].screen.z),source);
  const origin=Matrix4.multiplyByPoint(lighting.eyeToLocal,Cartesian3.ZERO,new Cartesian3());assert(Math.abs(origin.x-8)<1e-7);assert(Math.abs(origin.y-5)<1e-7);assert(Math.abs(origin.z-3)<1e-7);
  assert.equal(lighting.activeScreenCount,1);
 }finally{lighting.destroy();}
});
test('light selection fades between nearby signs and clears stale illumination on a landmark reset',()=>{
 const lighting=new CharacterLighting([sign('blue'),sign('red',[200,0,8],[1,.1,.05])]),camera={inverseViewMatrix:frame};
 try{
  for(let i=0;i<60;i++)lighting.update(camera,[0,5,0]);assert(lighting.slots[0].screen.w>.1);
  const before=lighting.slots[0].screen.w;lighting.update(camera,[0,6,0]);assert(Math.abs(lighting.slots[0].screen.w-before)<.02);
  lighting.update(camera,[200,5,0]);assert.equal(lighting.slots[0].id,'red');assert.equal(lighting.slots[0].color.x,1);assert(lighting.slots[0].screen.w<before*.3);
  lighting.update(camera,[400,5,0]);assert.equal(lighting.activeScreenCount,0);assert(lighting.slots.every(s=>s.screen.w===0));
 }finally{lighting.destroy();}
});
test('actual storefront faces and corner-defined Nasdaq panels produce usable street-level lights',()=>{
 const shops=createStorefrontGeometry(),nasdaq=createNasdaqGeometry();
 for(const faces of [shops.disney.screens,shops.hersheys.screens,shops.mms.referenceAds,shops.touro.screens,nasdaq.screens]){
  const sources=screenLightSources(faces.map(f=>({...f,lightGroup:'actual-sign'})));assert.equal(sources.length,1);assert.equal(sources[0].faces.length,faces.length);
  const f=sources[0].faces[0],p=f.center.map((v,i)=>v+f.normal[i]*5);p[2]=1.4;const samples=sampleScreenLights(sources,p);assert.equal(samples.length,1);assert(Number.isFinite(samples[0].intensity));assert(samples[0].intensity>.03);
 }
});
