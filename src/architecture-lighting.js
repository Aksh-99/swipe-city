import {PerInstanceColorAppearance} from 'cesium';

// Static reflected light, evaluated in local metres. Physical stone/metal is
// shaded separately from LED faces and bulbs, without changing scene exposure
// or introducing dynamic lights, shadow maps, or per-frame CPU work.
export const NIGHT_AMBIENT={lower:[.20,.225,.27],upper:[.065,.095,.145],fade:[7,49]};
const vec=values=>`vec3(${values.map(v=>Number(v).toFixed(5)).join(',')})`;
export function architectureLightGLSL(profile){
 const lights=profile.lights.map(light=>`{
  vec3 delta=(p-${vec(light.position)})/${vec(light.radius)};
  illumination+=${vec(light.color)}*exp(-dot(delta,delta));
 }`).join('\n');
 return `vec3 architectureNightLight(vec3 base,vec3 p,vec3 normal){
  float upper=smoothstep(${NIGHT_AMBIENT.fade[0].toFixed(1)},${NIGHT_AMBIENT.fade[1].toFixed(1)},p.z);
  vec3 illumination=mix(${vec(NIGHT_AMBIENT.lower)},${vec(NIGHT_AMBIENT.upper)},upper);
  illumination*=.78+.22*abs(dot(normal,${vec(profile.frontNormal)}));
  ${lights}
  return base*illumination;
 }`;
}
export function architectureNightAppearance(profile){
 return new PerInstanceColorAppearance({flat:true,translucent:false,closed:false,renderState:{cull:{enabled:false}},
  vertexShaderSource:`in vec3 position3DHigh;in vec3 position3DLow;in vec3 localPosition;in vec4 color;in float batchId;
   out vec3 v_local;out vec4 v_color;
   void main(){v_local=localPosition;v_color=color;gl_Position=czm_modelViewProjectionRelativeToEye*czm_computePosition();}`,
  fragmentShaderSource:`in vec3 v_local;in vec4 v_color;
   ${architectureLightGLSL(profile)}
   void main(){
    vec3 normal=normalize(cross(dFdx(v_local),dFdy(v_local)));
    out_FragColor=vec4(architectureNightLight(v_color.rgb,v_local,normal),v_color.a);
   }`
 });
}
