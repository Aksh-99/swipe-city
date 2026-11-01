import data from '../public/data/avenue.json' with {type:'json'};
export const AVENUE=data;
export function avenueReplacesScreen(screen){
 return data.wrap.some(f=>{
  const n=f.normal,c=f.a.map((v,i)=>(v+f.b[i])/2),d=screen.center.map((v,i)=>v-c[i]);
  return Math.abs(n[0]*screen.normal[0]+n[1]*screen.normal[1])>.95&&Math.abs(d[0]*n[0]+d[1]*n[1])<2.5&&Math.abs(-d[0]*n[1]+d[1]*n[0])<(f.length+screen.width)/2&&screen.center[2]-screen.height/2<data.height;
 });
}
