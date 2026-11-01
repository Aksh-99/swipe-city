import data from '../public/data/corner47.json' with {type:'json'};export const CORNER47=data;
export function corner47Local(p){const x=p[0]-data.origin[0],y=p[1]-data.origin[1];return {t:x*data.east[0]+y*data.east[1],d:x*data.north[0]+y*data.north[1]};}
export function corner47Replaces(f){return data.fronts.some(s=>{const d=f.center.map((v,i)=>v-s.center[i]),n=s.normal;return(!f.normal||Math.abs(f.normal[0]*n[0]+f.normal[1]*n[1])>.85)&&Math.abs(d[0]*n[0]+d[1]*n[1])<3&&Math.abs(-d[0]*n[1]+d[1]*n[0])<(s.width+(f.width||0))/2;});}
export const CORNER47_REGIONS=[['morgan',1,124,225,45,74,0.18,24],['morgan',1,184,225,8,45,0.18,24],['morgan',1,124,225,8,74,24,350],['w',-1,185,225,8,39,0.18,40],['w',-1,168,225,8,73,40,350]];
