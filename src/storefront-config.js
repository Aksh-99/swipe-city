import data from '../public/data/storefronts.json' with {type:'json'};
import mmsWhole from'../public/data/mms-whole.json'with{type:'json'};
export const STOREFRONTS=data.fronts.map(f=>f.id==='mms'?{...f,facades:[f.facades[0],mmsWhole.south,...mmsWhole.fronts.map(a=>({...a,fullBrand:true}))]}:f);
export const STOREFRONT_OMISSIONS=data.omitted;
export function storefrontReplacesScreen(screen){
 // Reference storefronts occupy more of the facade than the generic fascias.
 // Remove only decorative ads that intersect their glass or custom screens,
 // including historical mounts whose source triangle has reversed winding.
 if(STOREFRONTS.filter(f=>f.facades).some(store=>[...store.facades,...(store.neighbors||[])].some(f=>{
  const n=f.normal,d=screen.center.map((v,i)=>v-f.center[i]);
  return Math.abs(n[0]*screen.normal[0]+n[1]*screen.normal[1])>.96&&Math.abs(d[0]*n[0]+d[1]*n[1])<2.5&&Math.abs(-d[0]*n[1]+d[1]*n[0])<(f.width+screen.width)/2&&screen.center[2]-screen.height/2<(f.screenHeight||store.screenHeight||store.height);
 })))return true;
 if(screen.height>4)return false;
 return STOREFRONTS.some(f=>{
  const n=f.normal,d=screen.center.map((v,i)=>v-f.center[i]),dot=n.reduce((sum,v,i)=>sum+v*screen.normal[i],0);
  return dot>.96&&Math.abs(d[0]*n[0]+d[1]*n[1])<2.5&&Math.abs(-d[0]*n[1]+d[1]*n[0])<(f.width+screen.width)/2&&screen.center[2]-screen.height/2<f.height;
 });
}
