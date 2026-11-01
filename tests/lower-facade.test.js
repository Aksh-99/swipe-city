import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {CustomShader,CustomShaderMode,LightingModel,Matrix4} from 'cesium';
import ShaderBuilder from '@cesium/engine/Source/Renderer/ShaderBuilder.js';
import CustomShaderPipelineStage from '@cesium/engine/Source/Scene/Model/CustomShaderPipelineStage.js';
import {createFacadeShader} from '../src/facades.js';
import {LOWER_FACADE,lowerFacadeCoverage} from '../src/lower-facade.js';
import {PLAY_AREA} from '../src/play-area.js';
import {DISTRICT} from '../src/district-config.js';
const p=(x,y,z)=>({x,y,z});
test('continuous lower finish includes all surveyed frontages and perimeter street returns',()=>{
 for(const f of DISTRICT.facades)for(const s of [-.5,0,.5]){
  const x=f.center[0]-f.normal[1]*f.width*s,y=f.center[1]+f.normal[0]*f.width*s;
  for(const z of [0,.17,3.5,6.2,10.6,14.2])assert(lowerFacadeCoverage(p(x,y,z),0),f.id+' fully covered');
 }
 for(const intersection of PLAY_AREA.intersections)for(const dx of [-20,0,20])for(const dy of [-20,0,20])assert(lowerFacadeCoverage([...intersection.position.map((v,i)=>v+(i?dy:dx)),3],0),'boundary blocks covered');
 assert(!lowerFacadeCoverage([0,0,14.21],0),'upper tower excluded');
 assert(!lowerFacadeCoverage([0,0,1],1),'ground/roofs excluded');
 assert(!lowerFacadeCoverage([5000,0,1],0),'outside neighborhood excluded');
 assert(!lowerFacadeCoverage([NaN,0,1],0));
 assert(LOWER_FACADE.bayWidth<=3.5&&LOWER_FACADE.storeHeight<4,'street-level scale');
});
test('real Cesium streamed model pipeline accepts the full-surface finish without moving vertices',()=>{
 const shader=createFacadeShader();
 try{
  assert(shader instanceof CustomShader);assert.equal(shader.mode,CustomShaderMode.MODIFY_MATERIAL);assert.equal(shader.lightingModel,LightingModel.PBR);
  const attributes=[{name:'POSITION',type:'VEC3',semantic:'POSITION'},{name:'NORMAL',type:'VEC3',semantic:'NORMAL'},{name:'_AVENUEFINISH',type:'SCALAR'}];
  const resources={shaderBuilder:new ShaderBuilder(),model:{customShader:shader},alphaOptions:{},lightingOptions:{},uniformMap:{}};
  CustomShaderPipelineStage.process(resources,{attributes},{});
  assert(resources.shaderBuilder._fragmentShaderParts.defineLines.includes('HAS_CUSTOM_FRAGMENT_SHADER'));
  assert(resources.shaderBuilder._vertexShaderParts.defineLines.includes('HAS_CUSTOM_VERTEX_SHADER'));
  // No vertex displacement or runtime textures/atlas meshes: the source
  // walls remain unchanged outside the explicitly replaced VOCO parcel.
  assert(!shader.vertexShaderText.includes('vsOutput.positionMC='));
  assert(!shader.vertexShaderText.includes('vsOutput.positionMC+='));
  assert.deepEqual(Object.keys(shader.uniforms),['u_localFromWorld']);
  assert(shader.uniforms.u_localFromWorld.value instanceof Matrix4);
  assert(shader.fragmentShaderText.includes('material.alpha=1.0;'));
  assert.equal((shader.fragmentShaderText.replace(/\/\/[^\n]*/g,'').match(/discard/g)||[]).length,1);assert(shader.fragmentShaderText.includes('if(obsoleteVoco48Source(v_local))discard;'),'only the obsolete VOCO volume is hidden');
 }finally{shader.destroy();}
});
test('district-wide source audit reaches every requested street and lower-wall elevation',async()=>{
 const audit=JSON.parse(await readFile('docs/lower-facade-coverage.json'));
 assert.deepEqual(audit.finish,LOWER_FACADE);assert(audit.samples>50000);assert.equal(audit.covered,audit.samples);assert.equal(audit.uncovered,0);
 for(const name of [...Array.from({length:8},(_,i)=>`West ${i+42}${i===0?'nd':i===1?'rd':'th'} Street`),'6th Avenue','7th Avenue','8th Avenue','Broadway']){
  const street=audit.streets[name];assert(street&&street.samples>3000,name+' audited');assert.equal(street.covered,street.samples,name+' fully covered');
 }
 assert(audit.outsideGenericPanels>20000,'checks substantial surface outside isolated panels');
});
