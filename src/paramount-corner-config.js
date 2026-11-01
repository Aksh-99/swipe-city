import data from '../public/data/paramount-north.json' with {type:'json'};
export const PARAMOUNT_NORTH=data;
export function paramountReplacesFacade(f){return data.facades.some(s=>{const n=s.normal,d=f.center.map((v,i)=>v-s.center[i]);return n[0]*f.normal[0]+n[1]*f.normal[1]>.99&&Math.abs(d[0]*n[0]+d[1]*n[1])<1&&Math.abs(-d[0]*n[1]+d[1]*n[0])<s.width/2;});}
export function paramountReplacesScreen(f){return data.facades.some(s=>{const n=s.normal,d=f.center.map((v,i)=>v-s.center[i]);return n[0]*f.normal[0]+n[1]*f.normal[1]>.96&&Math.abs(d[0]*n[0]+d[1]*n[1])<3&&Math.abs(-d[0]*n[1]+d[1]*n[0])<(s.width+f.width)/2&&f.center[2]-f.height/2<s.top;});}
