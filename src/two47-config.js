import data from '../public/data/two47.json' with {type:'json'};export const TWO47=data;
export function two47Local(p){const x=p[0]-data.origin[0],y=p[1]-data.origin[1];return {t:x*data.east[0]+y*data.east[1],d:x*data.north[0]+y*data.north[1]};}
export function two47Replaces(f){return data.fronts.some(s=>{const d=f.center.map((v,i)=>v-s.center[i]),n=s.normal;return(!f.normal||Math.abs(f.normal[0]*n[0]+f.normal[1]*n[1])>.85)&&Math.abs(d[0]*n[0]+d[1]*n[1])<3&&Math.abs(-d[0]*n[1]+d[1]*n[0])<(s.width+(f.width||0))/2;});}
export const TWO47_REGIONS=[['two',1,220,270,8,80,.18,350]];
