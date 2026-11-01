import data from '../public/data/west46.json' with {type:'json'};
export const WEST46=data;
export function west46Local(p){const x=p[0]-data.origin[0],y=p[1]-data.origin[1];return {t:x*data.east[0]+y*data.east[1],d:x*data.north[0]+y*data.north[1]};}
export function west46CoversPoint(p){const q=west46Local(p);return q.t>=13&&q.t<=240&&Math.abs(q.d)>=7&&Math.abs(q.d)<=54&&p[2]>=.18;}
export function west46ReplacesFacade(f){const q=west46Local(f.center);return q.t>=13&&q.t<=240&&Math.abs(q.d)>=7&&Math.abs(q.d)<=54&&(f.street==='West 46th Street'||f.street==='Eighth Avenue'||f.street==='8th Avenue');}
export function west46ReplacesScreen(f){return west46CoversPoint(f.center)&&f.center[2]-f.height/2<28;}
export function west46GLSL(){return `
vec2 west46Coordinates(vec3 p){vec2 v=p.xy-vec2(${data.origin[0]},${data.origin[1]});return vec2(dot(v,vec2(${data.east[0]},${data.east[1]})),dot(v,vec2(${data.north[0]},${data.north[1]})));}
float west46Mask(vec3 p){vec2 q=west46Coordinates(p);return step(13.,q.x)*step(q.x,240.)*step(7.,abs(q.y))*step(abs(q.y),54.)*step(.18,p.z);}
void west46Finish(vec3 p,vec3 normal,inout vec3 diffuse,inout vec3 emissive,inout float roughness){vec2 q=west46Coordinates(p);float south=1.-step(0.,q.y);float modern=south*(1.-step(110.,q.x));float construction=(1.-south)*(1.-step(70.,q.x));float picnic=south*step(110.,q.x)*(1.-step(126.,q.x));float hotel=south*step(126.,q.x)*(1.-step(151.,q.x));float theatre=(1.-south)*step(70.,q.x)*(1.-step(151.,q.x))*step(p.z,26.);float x=abs(dot(normal.xy,vec2(${data.north[0]},${data.north[1]})))>.6?q.x:q.y;
vec2 cell=fract(vec2(x,p.z)/vec2(2.4,3.25));float win=step(.25,cell.x)*step(cell.x,.76)*step(.17,cell.y)*step(cell.y,.81);float jamb=step(.21,cell.x)*step(cell.x,.80)*step(.13,cell.y)*step(cell.y,.86);vec3 stone=vec3(.61,.585,.52);float joints=max(step(.99,fract(x/1.5)),step(.97,fract(p.z/.7)));stone*=1.-joints*.12;vec3 wall=mix(stone,vec3(.24,.25,.24),jamb);wall=mix(wall,vec3(.045,.065,.075),win);if(hotel>.5){wall=mix(stone,wall,step(10.7,p.z));float band=step(.91,fract((p.z-10.8)/3.25));wall*=1.-band*.12;}
if(modern>.5){vec2 g=fract(vec2(x,p.z)/vec2(1.42,3.6));float frame=max(step(.965,g.x),step(.96,g.y));wall=mix(vec3(.075,.115,.14)+vec3(.02)*sin(x*.9+p.z*.16),vec3(.44,.47,.47),frame);float panel=step(.42,fract(x/8.4))*step(8.,p.z);wall=mix(wall,vec3(.32,.36,.37),panel*.66);}
if(picnic>.5&&p.z<8.){vec2 brick=fract(vec2(x/.27+mod(floor(p.z/.13),2.)*.5,p.z/.13));float mortar=max(step(.94,brick.x),step(.9,brick.y));wall=vec3(.40,.36,.32)*(1.-mortar*.18);}
if(theatre>.5){wall=mix(vec3(.59,.53,.40),vec3(.055,.075,.075),win*step(7.,p.z));wall*=1.-step(.92,fract(p.z/4.8))*.19;}
if(construction>.5){vec2 b=fract(vec2(x,p.z)/vec2(3.2,3.3));float beam=max(step(.92,b.x),step(.92,b.y));float mesh=max(step(.94,fract(x*5.)),step(.94,fract(p.z*5.)));wall=mix(vec3(.31,.13,.095)*(1.-mesh*.15),vec3(.48,.49,.46),beam);if(p.z<3.5)wall=vec3(.055,.12,.09);}
if((1.-south)*step(151.,q.x)>.5){float rib=step(.83,fract(x/.26));wall=mix(vec3(.43,.46,.45),vec3(.32,.35,.34),rib);vec2 c=fract(vec2(x,p.z)/vec2(2.2,4.8));float glass=step(.08,c.x)*step(c.x,.93)*step(.12,c.y)*step(c.y,.82);wall=mix(wall,vec3(.035,.07,.09),glass*step(7.,p.z)*step(p.z,13.));}if(south*step(171.,q.x)*(1.-step(219.,q.x))>.5&&p.z<15.){float line=step(.96,fract(p.z/.52));wall=vec3(.43,.38,.30)*(1.-line*.18);}if(south*step(219.,q.x)>.5&&p.z>4.)wall=vec3(.22,.26,.29);
diffuse=wall*.43;emissive=wall*.31;roughness=modern>.5?.44:.88;
}
`;}
