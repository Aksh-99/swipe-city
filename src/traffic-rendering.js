import {CustomShader,CustomShaderMode,LightingModel,UniformType,Transforms,HeadingPitchRoll} from 'cesium';
import {toWorld} from './coordinates.js';
// Cesium applies glTF's default +Z-forward correction before the entity frame.
// Our generated mesh is +X-forward, which that correction maps to local +Y.
export function trafficOrientation(position,heading){return Transforms.headingPitchRollQuaternion(toWorld(position),new HeadingPitchRoll(Math.PI/2-heading,0,0));}
export function createTrafficShader(){return new CustomShader({mode:CustomShaderMode.MODIFY_MATERIAL,lightingModel:LightingModel.UNLIT,uniforms:{u_brake:{type:UniformType.FLOAT,value:0}},fragmentShaderText:`
void fragmentMain(FragmentInput fsInput,inout czm_modelMaterial material){
 vec3 base=material.diffuse;
 vec3 n=normalize(fsInput.attributes.normalEC);
 float fill=.34+.20*max(n.y,0.0)+.07*abs(n.z);
 vec3 color=max(base,vec3(.012,.016,.022))*fill;
 color=mix(color,base*.95,fsInput.attributes.lamp);
 if(fsInput.attributes.taillight>.5)color=mix(vec3(.20,.018,.009),vec3(.95,.025,.008),u_brake);
 // Cesium's UNLIT lighting stage uses diffuse directly, not emissive.
 material.diffuse=color;
}`});}
