import data from '../public/data/north42.json' with {type:'json'};
export const NORTH42=data;
export const NORTH42_PLACES=data.places;
export function north42ReplacesScreen(screen){
 const matches=(center,n,width,top)=>{const d=screen.center.map((v,i)=>v-center[i]);return Math.abs(n[0]*screen.normal[0]+n[1]*screen.normal[1])>.94&&Math.abs(d[0]*n[0]+d[1]*n[1])<2.5&&Math.abs(-d[0]*n[1]+d[1]*n[0])<(width+screen.width)/2&&screen.center[2]-screen.height/2<top;};
 return data.facades.some(f=>matches(f.center,f.normal,f.width,f.top))||data.curve.wrap.some(f=>matches(f.a.map((v,i)=>(v+f.b[i])/2),f.normal,f.length,data.curve.top));
}
