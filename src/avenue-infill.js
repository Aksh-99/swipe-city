// Only pre-audited, previously unrendered building IDs have this attribute set.
// It follows every original triangle, so there is no height or facade mask seam.
export function avenueInfillGLSL(){return `
void avenueInfillFinish(vec3 p,vec3 n,inout vec3 diffuse,inout vec3 emission,inout float roughness,inout vec3 specular){
 vec2 q=vec2(dot(p.xy-vec2(-362.3792469,-85.1103715),vec2(.87613143,-.48207232)),dot(p.xy-vec2(-362.3792469,-85.1103715),vec2(.48207232,.87613143)));
 float side=abs(dot(n.xy,vec2(.87613143,-.48207232)))>.7?q.y:q.x;
 vec2 cell=fract(vec2(side,p.z)/vec2(1.75,3.55));
 float vertical=1.-smoothstep(.025,.048,min(cell.x,1.-cell.x));
 float horizontal=1.-smoothstep(.016,.032,min(cell.y,1.-cell.y));
 float rail=max(vertical,horizontal);
 float spandrel=step(.84,cell.y)*step(cell.y,.96);
 float reflection=.5+.5*sin(side*.073+p.z*.026)+.12*sin(side*.23-p.z*.14);
 vec3 glass=mix(vec3(.115,.225,.245),vec3(.30,.425,.46),clamp(reflection*.65,0.,1.));
 glass=mix(glass,vec3(.105,.18,.19),spandrel*.36);
 vec3 c=mix(glass,vec3(.40,.47,.46),rail*.78);
 vec2 id=floor(vec2(side,p.z)/vec2(1.75,3.55));float occupied=step(.88,fract(sin(dot(id,vec2(12.9898,78.233)))*43758.5453));
 float lamp=step(.35,cell.x)*step(cell.x,.85)*step(.65,cell.y)*step(cell.y,.669);
 float lobby=1.-smoothstep(5.8,7.2,p.z);
 c=mix(c,vec3(.055,.12,.13),lobby*(1.-rail)*.55);
 float roof=smoothstep(.65,.9,abs(n.z));c=mix(c,vec3(.29,.32,.31),roof);
 diffuse=c*.16;emission=c*.012+vec3(.18,.135,.075)*occupied*lamp*(1.-roof)+vec3(.025,.020,.011)*lobby*(1.-rail)*(1.-roof);
 roughness=mix(.27,.65,max(rail,roof));specular=mix(vec3(.28),vec3(.055),max(rail,roof));
}
`;}
export const AVENUE_INFILL_VIEWS={sixthavenue:{position:[203.20159661345474,-179.4465230258611,.17],yaw:Math.atan2(.87613143,-.48207232),pitch:-.32},eighthavenue:{position:[-264.6525867782032,77.9800938631562,.17],yaw:Math.atan2(-.87613143,.48207232),pitch:-.27}};
