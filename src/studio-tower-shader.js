import {STUDIOS} from './studios-config.js';
// The mask follows surveyed wall planes; the original NYC triangles supply
// every setback, corner and roof edge. No rectangular replacement tower.
export function studioTowerGLSL(){const planes=STUDIOS.towerMaskPlanes.map(f=>{const n=f.normal,c=f.center;return `step(dot(p.xy-vec2(${c[0].toFixed(5)},${c[1].toFixed(5)}),vec2(${n[0].toFixed(6)},${n[1].toFixed(6)})),.32)`;}).join('*');return `
float studioTowerMask(vec3 p){return ${planes}*step(.18,p.z)*step(p.z,127.0);}
void studioTowerFinish(vec3 p,vec3 n,inout vec3 diffuse,inout vec3 emissive,inout float roughness){
 vec2 axes=vec2(dot(p.xy,vec2(.481276,.876569)),dot(p.xy,vec2(.876569,-.481276)));
 vec2 wall=vec2(dot(n.xy,vec2(.481276,.876569)),dot(n.xy,vec2(.876569,-.481276)));
 float x=abs(wall.x)>abs(wall.y)?axes.y:axes.x;
 vec2 cell=fract(vec2(x,p.z)/vec2(1.38,3.42));
 float vertical=1.-smoothstep(.018,.043,min(cell.x,1.-cell.x));
 float horizontal=1.-smoothstep(.016,.035,min(cell.y,1.-cell.y));
 float reflection=.5+.5*sin(x*.23+p.z*.051);
 vec3 glass=mix(vec3(.014,.029,.040),vec3(.029,.052,.065),reflection);
 vec3 color=mix(glass,vec3(.080,.099,.104),max(vertical,horizontal));
 diffuse=color*.40;emissive=color*.77;roughness=.30;
}`;}
