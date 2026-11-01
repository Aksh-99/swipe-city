import{avenueInfillGLSL}from'./avenue-infill.js';
import{voco48SourceMaskGLSL}from'./voco48-source-mask.js';
import {biltmore47GLSL} from './biltmore47-config.js';
import {sixth46GLSL} from './sixth46-config.js';
import {east46GLSL} from './east46-config.js';
import {w46CornerGLSL} from './w46-corner-config.js';
import {west46GLSL} from './west46-config.js';
import {east45GLSL} from './east45-config.js';
import {shubertGLSL} from './shubert-config.js';
import { CustomShader,CustomShaderMode,UniformType,VaryingType,LightingModel } from 'cesium';
import { inverseFrame } from './coordinates.js';
import { lightSpillGLSL } from './plaza-lighting.js';
import {lowerFacadeGLSL} from './lower-facade.js';
import {studioTowerGLSL} from './studio-tower-shader.js';
import {west45GLSL} from './west45-shader.js';
// Reference-guided architectural materials, on unmodified survey triangles.
export function createFacadeShader({plain=false}={}){return new CustomShader({
 mode:CustomShaderMode.MODIFY_MATERIAL,lightingModel:LightingModel.PBR,
 uniforms:{u_localFromWorld:{type:UniformType.MAT4,value:inverseFrame}},varyings:{v_local:VaryingType.VEC3},
 vertexShaderText:`void vertexMain(VertexInput vsInput,inout czm_modelVertexOutput vsOutput){v_local=(u_localFromWorld*czm_model*vec4(vsInput.attributes.positionMC,1)).xyz;}`,
 fragmentShaderText:plain?`${voco48SourceMaskGLSL()}
void fragmentMain(FragmentInput fsInput,inout czm_modelMaterial material){if(obsoleteVoco48Source(v_local))discard;}`:`${voco48SourceMaskGLSL()}
${lowerFacadeGLSL()}
${avenueInfillGLSL()}
${studioTowerGLSL()}
${west45GLSL()}
${east45GLSL()}
${west46GLSL()}
${w46CornerGLSL()}
${east46GLSL()}
${sixth46GLSL()}
${biltmore47GLSL()}
void fragmentMain(FragmentInput fsInput,inout czm_modelMaterial material){
  if(obsoleteVoco48Source(v_local))discard;
  vec3 n=normalize(cross(dFdx(v_local),dFdy(v_local)));
  float wall=1.0-smoothstep(.45,.8,abs(n.z));
  vec2 grid=vec2(dot(v_local.xy,vec2(.848,-.53)),dot(v_local.xy,vec2(.53,.848)));
  vec2 normalGrid=vec2(dot(n.xy,vec2(.848,-.53)),dot(n.xy,vec2(.53,.848)));
  float side=abs(normalGrid.x)>abs(normalGrid.y)?grid.y:grid.x;
  float historic=step(v_local.x,-20.0)*step(-150.0,v_local.y)*step(v_local.y,10.0);
  // Bounded neighborhood palette. Existing facade overlays and signs retain
  // their own materials; this only changes the underlying real city mesh.
  vec2 district=vec2(dot(v_local.xy-vec2(-362.37925,-85.11037),vec2(.87613143,-.48207232)),dot(v_local.xy-vec2(-362.37925,-85.11037),vec2(.48207232,.87613143)));
  float inDistrict=step(6.0,district.x)*step(district.x,544.0)*step(9.0,district.y)*step(district.y,562.0);
  float office=inDistrict*step(430.0,district.x);
  float block=fract(sin(dot(floor(district/vec2(95.0,80.0)),vec2(31.83,91.13)))*7313.7);
  vec2 scale=mix(vec2(1.6,3.65),vec2(2.6,3.8),historic);
  vec2 cell=fract(vec2(side,v_local.z)/scale),id=floor(vec2(side,v_local.z)/scale);
  float pane=step(mix(.05,.22,historic),cell.x)*step(cell.x,mix(.95,.78,historic))*step(.14,cell.y)*step(cell.y,.78);
  float mullion=step(.48,cell.x)*step(cell.x,.52);
  float lit=step(.69,fract(sin(dot(id,vec2(12.9898,78.233)))*43758.5453));
  float hue=step(.8,fract(sin(dot(id,vec2(23.18,93.62)))*2947.35));
  vec3 light=mix(vec3(1.0,.68,.35),vec3(.53,.70,.88),hue);
  float cornice=step(.92,fract(v_local.z/3.8));
  vec3 stone=mix(vec3(.16,.19,.22),vec3(.33,.29,.24),historic);
  stone*=mix(1.0,.68,cornice*historic);
  vec3 neighborhoodStone=mix(vec3(.25,.19,.145),vec3(.18,.21,.23),step(.38,block));
  neighborhoodStone=mix(neighborhoodStone,vec3(.22,.12,.087),step(.76,block)*(1.0-office));
  stone=mix(stone,neighborhoodStone,inDistrict);
  vec3 glass=mix(vec3(.025,.047,.075),vec3(.035,.07,.09),office)+light*lit*.13;
  vec3 facade=mix(stone,glass,pane);facade*=1.0-mullion*pane*.7;
  float storefront=1.0-smoothstep(3.5,5.0,v_local.z);
  facade=mix(facade,vec3(.02,.027,.032),storefront*.8);
  vec3 glow=vec3(0);vec2 p=v_local.xy;${lightSpillGLSL()}
  material.diffuse=mix(vec3(.12,.14,.16),facade,wall)*.55;
  material.emissive=(light*lit*pane*.13*(1.0-mullion)+glow*exp(-v_local.z/25.0)*.45)*wall;
  material.roughness=mix(.9,.42,pane);material.specular=vec3(.035);
  // Cover the complete lower survey surface, including gaps between fitted
  // retail panels, corner returns, narrow recesses and streamed tile seams.
  if(lowerFacadeMask(v_local,n.z)>.5){
   lowerFacadeFinish(v_local,side,office,material.diffuse,material.emissive,material.roughness);
   material.alpha=1.0;
   material.emissive+=glow*exp(-v_local.z/25.0)*.13;
  }
  if(wall>.5&&west45Mask(v_local)>.5){west45Finish(v_local,n,material.diffuse,material.emissive,material.roughness);material.alpha=1.0;}
  if(wall>.5){vec3 p=v_local;vec3 diffuse=material.diffuse;vec3 emissive=material.emissive;float roughness=material.roughness;${shubertGLSL()}material.diffuse=diffuse;material.emissive=emissive;material.roughness=roughness;}
  if(wall>.5&&east45Mask(v_local)>.5){east45Finish(v_local,n,material.diffuse,material.emissive,material.roughness);material.alpha=1.;}
  if(wall>.5&&west46Mask(v_local)>.5){west46Finish(v_local,n,material.diffuse,material.emissive,material.roughness);material.alpha=1.;}
  if(wall>.5&&studioTowerMask(v_local)>.5){studioTowerFinish(v_local,n,material.diffuse,material.emissive,material.roughness);material.alpha=1.0;}
  if(wall>.5&&biltmore47Mask(v_local)>.5){biltmore47Finish(v_local,n,material.diffuse,material.emissive,material.roughness);material.alpha=1.;}
  if(wall>.5&&sixth46Mask(v_local)>.5){sixth46Finish(v_local,n,material.diffuse,material.emissive,material.roughness);material.alpha=1.;}
  if(wall>.5&&east46Mask(v_local)>.5){east46Finish(v_local,n,material.diffuse,material.emissive,material.roughness);material.alpha=1.;}
  float corner=w46CornerMaterial(v_local);if(wall>.5&&corner>.5){vec3 metal=corner<1.5?vec3(.075,.10,.11):vec3(.38,.42,.43);material.diffuse=metal*.4;material.emissive=metal*.25;material.roughness=.45;material.alpha=1.;}
  if(fsInput.attributes.avenuefinish>.5){avenueInfillFinish(v_local,n,material.diffuse,material.emissive,material.roughness,material.specular);material.alpha=1.;}
  // Suppress the uniformly bright physical shell; emitted window light stays separate.
  material.diffuse*=.24;material.specular*=.18;
 }`
});}
