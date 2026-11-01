import data from '../public/data/studios.json' with {type:'json'};
export const STUDIOS=data;
export function studiosReplacesScreen(screen){return data.facades.some(f=>{const n=f.normal,d=screen.center.map((v,i)=>v-f.center[i]);return n[0]*screen.normal[0]+n[1]*screen.normal[1]>.95&&Math.abs(d[0]*n[0]+d[1]*n[1])<3&&Math.abs(-d[0]*n[1]+d[1]*n[0])<(f.width+screen.width)/2&&screen.center[2]-screen.height/2<Math.max(f.top,35);});}
export function studiosReplacesFacade(f){return data.facades.some(s=>{const d=f.center.map((v,i)=>v-s.center[i]),n=s.normal;return n[0]*f.normal[0]+n[1]*f.normal[1]>.99&&Math.abs(d[0]*n[0]+d[1]*n[1])<1&&Math.abs(-d[0]*n[1]+d[1]*n[0])<s.width/2;});}
const retail=data.facades.find(f=>f.id==='retail-front'),gap=data.facades.find(f=>f.id==='retail-corner');
const gapPosition=[retail.center[0]-retail.normal[1]*15+retail.normal[0]*8,retail.center[1]+retail.normal[0]*15+retail.normal[1]*8,.17];
export const GAP_VISIT={name:'GAP · displays, planters & boards',address:'Broadway · Old Navy / GAP',normal:retail.normal,view:{position:gapPosition,yaw:Math.atan2(gap.center[0]-gapPosition[0],gap.center[1]-gapPosition[1]),pitch:-.14}};
