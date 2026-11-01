import data from '../public/data/east45.json' with {type:'json'};import {west45Local} from './west45-config.js';export const EAST45=data;
export function east45CoversPoint(p){const q=west45Local(p);return q.t>=298&&q.t<=540&&(q.d>0||q.t>=328)&&Math.abs(q.d)>=7&&Math.abs(q.d)<=64&&p[2]>=.18;}
export function east45ReplacesFacade(f){const q=west45Local(f.center);return f.street==='West 45th Street'&&q.t>=298&&q.t<=540&&(q.d>0||q.t>=328)&&Math.abs(q.d)<35;}
export function east45ReplacesScreen(f){return east45CoversPoint(f.center)&&f.center[2]-f.height/2<32;}
export function east45GLSL(){return `
float east45Mask(vec3 p){vec2 q=west45Coordinates(p);return step(298.,q.x)*step(q.x,540.)*step(7.,abs(q.y))*step(abs(q.y),64.)*step(.18,p.z)*max(step(0.,q.y),step(328.,q.x));}
void east45Finish(vec3 p,vec3 normal,inout vec3 diffuse,inout vec3 emissive,inout float roughness){vec2 q=west45Coordinates(p);float t=q.x,side=step(0.,q.y);float isConstruction=side*step(391.,t)*(1.-step(432.,t));float isGlass=side*(1.-step(341.,t))+step(490.,t);float pale=side*step(341.,t)*(1.-step(391.,t))+(1.-side)*step(372.,t)*(1.-step(414.,t));float stage=(1.-side)*step(372.,t)*(1.-step(414.,t));float pub=side*step(432.,t)*(1.-step(454.,t));float x=abs(dot(normal.xy,vec2(${data.north[0]},${data.north[1]})))>.6?t:q.y;
vec2 brick=fract(vec2(x/.28+mod(floor(p.z/.14),2.)*.5,p.z/.14));float mortar=max(step(.94,brick.x),step(.88,brick.y));vec3 wall=mix(vec3(.35,.20,.14),vec3(.49,.46,.38),clamp(pale,0.,1.))*(1.-mortar*.20);wall=mix(wall,t<440.&&p.z>10.?vec3(.55,.51,.40):vec3(.19,.13,.085),pub);vec2 sash=fract(vec2(x,p.z)/vec2(2.7,3.5));float win=step(.25,sash.x)*step(sash.x,.75)*step(.20,sash.y)*step(sash.y,.79);wall=mix(wall,vec3(.025,.05,.067),win*(1.-stage));
if(isGlass>.5){vec2 cell=fract(vec2(x,p.z)/vec2(1.45,3.65));float mullion=max(1.-step(.035,min(cell.x,1.-cell.x)),1.-step(.023,min(cell.y,1.-cell.y)));wall=mix(vec3(.035,.07,.09)+vec3(.025)*sin(x*.4+p.z*.09),vec3(.21,.27,.28),mullion);}
if(stage>.5){vec2 block=fract(vec2(x,p.z)/vec2(1.7,.72));float joint=max(step(.991,block.x),step(.982,block.y));wall=vec3(.45,.405,.32)*(1.-joint*.21);}
if(isConstruction>.5){vec2 net=fract(vec2(x,p.z)*4.2),bay=fract(vec2(x,p.z)/vec2(3.1,3.4));float mesh=max(step(.96,net.x),step(.96,net.y)),frame=max(1.-step(.045,min(bay.x,1.-bay.x)),1.-step(.06,min(bay.y,1.-bay.y)));vec3 wrap=mix(vec3(.24,.27,.24),vec3(.42,.145,.075),step(.5,fract(p.z/10.2)));wall=mix(wrap*(.85+mesh*.15),vec3(.44,.49,.46),frame);}
diffuse=wall*.39;emissive=wall*mix(.39,.24,smoothstep(15.,90.,p.z));roughness=isGlass>.5?.40:.86;}
`;}
