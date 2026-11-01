import data from '../public/data/east42.json' with {type:'json'};
export const EAST42=data;
export const EAST42_PLACES=data.places;
export function east42ReplacesScreen(screen){return data.facades.some(f=>{
 const n=f.normal,d=screen.center.map((v,i)=>v-f.center[i]);
 return Math.abs(n[0]*screen.normal[0]+n[1]*screen.normal[1])>.94&&Math.abs(d[0]*n[0]+d[1]*n[1])<2.8&&Math.abs(-d[0]*n[1]+d[1]*n[0])<(f.width+screen.width)/2&&screen.center[2]-screen.height/2<f.top&&screen.center[2]+screen.height/2>f.bottom;
});}
