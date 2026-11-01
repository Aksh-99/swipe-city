import data from '../public/data/touro-frontage.json' with {type:'json'};
export const TOURO=data;
export function touroReplacesScreen(screen){
 return data.facades.some(f=>{
  const n=f.normal,d=screen.center.map((v,i)=>v-f.center[i]);
  return Math.abs(n[0]*screen.normal[0]+n[1]*screen.normal[1])>.96&&Math.abs(d[0]*n[0]+d[1]*n[1])<2.5&&Math.abs(-d[0]*n[1]+d[1]*n[0])<(f.width+screen.width)/2&&screen.center[2]-screen.height/2<f.height;
 });
}
