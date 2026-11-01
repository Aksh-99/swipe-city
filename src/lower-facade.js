import {PLAY_AREA} from './play-area.js';

// A continuous finish on the streamed survey mesh, underneath the authored
// storefronts. Padding includes the building faces behind boundary sidewalks.
// There are no added building boxes, resident meshes, or collision changes.
export const LOWER_FACADE={top:14.2,padding:35,storeHeight:3.7,bayWidth:3.3,floorHeight:3.3};
export function lowerFacadeCoverage(position,normalZ=0){
 const p=Array.isArray(position)?position:[position.x,position.y,position.z];
 return p.every(Number.isFinite)&&Math.abs(normalZ)<.45&&p[2]>=-.5&&p[2]<=LOWER_FACADE.top&&PLAY_AREA.planes.every(f=>f.normal[0]*p[0]+f.normal[1]*p[1]>=f.offset-LOWER_FACADE.padding);
}
export function lowerFacadeGLSL(){
 const planes=PLAY_AREA.planes.map(f=>`step(${(f.offset-LOWER_FACADE.padding).toFixed(6)},dot(local.xy,vec2(${f.normal.map(n=>n.toFixed(9)).join(',')})))`).join('*');
 return `
 float lowerFacadeMask(vec3 local,float normalZ){
  return ${planes}*step(-.5,local.z)*step(local.z,${LOWER_FACADE.top.toFixed(1)})*(1.0-step(.45,abs(normalZ)));
 }
 void lowerFacadeFinish(vec3 local,float side,float office,inout vec3 diffuse,inout vec3 emission,inout float roughness){
  // Dimensions are in local metres, independent of tiles, camera and LOD.
  // A continuous base spans every wall triangle; glass is an inset finish,
  // never a hole/discard which could reveal the old giant window pattern.
  const float bay=${LOWER_FACADE.bayWidth.toFixed(1)};
  float x=fract(side/bay),z=max(0.0,local.z-.18),row=floor(max(0.0,z-4.46)/${LOWER_FACADE.floorHeight.toFixed(1)});
  float upperY=fract(max(0.0,z-4.46)/${LOWER_FACADE.floorHeight.toFixed(1)});
  float storefront=1.0-step(${LOWER_FACADE.storeHeight.toFixed(1)},z);
  float panel=step(.045,x)*step(x,.955)*step(.28,z)*step(z,${(LOWER_FACADE.storeHeight-.12).toFixed(2)});
  float upperPane=step(.23,x)*step(x,.77)*step(.20,upperY)*step(upperY,.79)*step(4.46,z);
  vec2 id=vec2(floor(side/bay),row);
  float seed=fract(sin(dot(id,vec2(12.9898,78.233)))*43758.5453);
  float lit=step(.68,seed);
  // Stone joints, plinth, thin ledges and a subdued metal sign fascia.
  float joints=max(step(.981,fract(side/1.10)),step(.966,fract(z/.72)));
  vec3 stone=mix(vec3(.22,.205,.18),vec3(.19,.215,.225),office)*(1.0-joints*.23);
  float plinth=1.0-step(.31,z);
  float fascia=step(3.7,z)*step(z,4.38);
  float ledge=max(step(4.38,z)*step(z,4.53),step(13.84,z)*step(z,14.02));
  vec3 base=mix(stone,vec3(.075,.095,.105),max(plinth,fascia));
  base=mix(base,vec3(.22,.235,.23),ledge);
  vec3 upperGlass=vec3(.014,.027,.038);
  base=mix(base,upperGlass,upperPane);
  // Three-metre shop windows, slender mullions and recessed-looking doors.
  float mullion=step(.491,x)*step(x,.509);
  float transom=step(2.92,z)*step(z,2.98);
  float frame=max(mullion,transom)*panel;
  float door=step(.72,x)*step(x,.94)*step(z,2.90)*panel;
  float handle=step(.737,x)*step(x,.749)*step(1.04,z)*step(z,1.55)*door;
  vec3 shopGlass=mix(vec3(.020,.032,.039),vec3(.018,.025,.030),door);
  base=mix(base,shopGlass,storefront*panel);
  base=mix(base,vec3(.13,.155,.16),storefront*frame);
  base=mix(base,vec3(.31,.32,.30),handle);
  // Quiet interior silhouettes, with no new textures or per-window lights.
  float shelves=step(.948,fract(z/.58))*step(.45,z)*step(z,2.72);
  float interior=panel*storefront*(1.0-frame)*(1.0-door*.6);
  float roomLit=step(.36,fract(sin(floor(side/bay)*23.18)*2947.35));
  vec3 warmth=mix(vec3(.067,.068,.059),vec3(.105,.075,.046),roomLit);
  emission=base*.30+warmth*interior*(1.0-shelves*.48)*.52;
  emission+=vec3(.055,.044,.030)*lit*upperPane;
  diffuse=base*.22;
  roughness=mix(.86,.48,max(panel*storefront,upperPane));
 }
 `;
}
