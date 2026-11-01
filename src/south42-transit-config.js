import data from '../public/data/south42-transit.json' with {type:'json'};
export const SOUTH42_TRANSIT=data;
export const OPPOSITE_SUBWAY=data.place;
export function south42ReplacesScreen(screen){
 return [...data.facades,...data.oneTimesFacades].some(f=>{
  const n=f.normal,d=screen.center.map((v,i)=>v-f.center[i]);
  return Math.abs(n[0]*screen.normal[0]+n[1]*screen.normal[1])>.94&&Math.abs(d[0]*n[0]+d[1]*n[1])<2.6&&Math.abs(-d[0]*n[1]+d[1]*n[0])<(f.width+screen.width)/2&&screen.center[2]-screen.height/2<f.height;
 });
}
