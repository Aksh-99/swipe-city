import data from '../public/data/cinema-block.json' with {type:'json'};
export const CINEMA_BLOCK=data;
export const CINEMA_PLACES=data.places;
export function cinemaReplacesScreen(screen){return data.facades.some(f=>{
 const n=f.normal,d=screen.center.map((v,i)=>v-f.center[i]);
 return Math.abs(n[0]*screen.normal[0]+n[1]*screen.normal[1])>.94&&Math.abs(d[0]*n[0]+d[1]*n[1])<2.5&&Math.abs(-d[0]*n[1]+d[1]*n[0])<(f.width+screen.width)/2&&screen.center[2]-screen.height/2<f.bottom+f.height&&screen.center[2]+screen.height/2>f.bottom;
});}
