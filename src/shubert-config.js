import data from '../public/data/shubert-alley.json' with {type:'json'};
export const SHUBERT=data;export const SHUBERT_VISIT=data.visit;
export function shubertReplacesFacade(f){return data.fronts.some(s=>{const d=f.center.map((v,i)=>v-s.center[i]),n=s.normal;return n[0]*f.normal[0]+n[1]*f.normal[1]>.95&&Math.abs(d[0]*n[0]+d[1]*n[1])<1.2&&Math.abs(-d[0]*n[1]+d[1]*n[0])<s.width/2;});}
export function shubertGLSL(){return data.fronts.map(s=>`{
 vec2 delta=p.xy-vec2(${s.center[0].toFixed(5)},${s.center[1].toFixed(5)});vec2 sn=vec2(${s.normal[0].toFixed(6)},${s.normal[1].toFixed(6)});float along=dot(delta,vec2(-sn.y,sn.x));
 if(abs(dot(delta,sn))<.8&&abs(along)<${(s.width/2+.7).toFixed(3)}&&p.z>.18){
 ${s.kind==='theatre'?`vec2 brick=fract(vec2(along/.27+mod(floor(p.z/.13),2.)*.5,p.z/.13));float mortar=max(step(.92,brick.x),step(.87,brick.y));float pilaster=1.-step(.25,abs(mod(along+3.,8.)-4.));vec3 finish=mix(vec3(.36,.29,.20)*(1.-mortar*.26),vec3(.55,.50,.39),pilaster);finish=mix(finish,vec3(.11,.12,.105),1.-step(.75,p.z));diffuse=finish*.35;emissive=finish*.39;roughness=.88;`:`vec2 cell=fract(vec2(along,p.z)/vec2(1.35,3.5));float mullion=max(1.-step(.024,min(cell.x,1.-cell.x)),1.-step(.025,min(cell.y,1.-cell.y)));vec3 finish=mix(vec3(.024,.049,.065),vec3(.17,.20,.21),mullion);if(p.z<5.6)finish=mix(vec3(.12,.14,.13),vec3(.35,.32,.25),1.-step(.08,fract(along/3.)));diffuse=finish*.35;emissive=finish*.35;roughness=.38;`}
 }
 }`).join('\n');}
