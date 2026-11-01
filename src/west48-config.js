import data from'../public/data/west48.json'with{type:'json'};export const WEST48=data;
export function west48Local(p){const x=p[0]-data.origin[0],y=p[1]-data.origin[1];return{t:x*data.east[0]+y*data.east[1],d:x*data.north[0]+y*data.north[1]};}
export function west48Replaces(f){const q=west48Local(f.center);return data.fronts.some(s=>{const n=s.normal,d=f.center.map((v,i)=>v-s.center[i]);return(!f.normal||Math.abs(f.normal[0]*n[0]+f.normal[1]*n[1])>.9)&&Math.abs(d[0]*n[0]+d[1]*n[1])<2&&Math.abs(-d[0]*n[1]+d[1]*n[0])<(s.width+(f.width||0))/2;})||(q.t>137.1&&q.t<197&&q.d>87&&q.d<152);}
