import data from'../public/data/sixth47.json'with{type:'json'};export const SIXTH47=data;
export function sixth47Local(p){const x=p[0]-data.origin[0],y=p[1]-data.origin[1];return{t:x*data.east[0]+y*data.east[1],d:x*data.north[0]+y*data.north[1]};}
export function sixth47Replaces(f){const q=sixth47Local(f.center);return(q.t>=484&&q.t<=533&&q.d>=-71&&q.d<=-14)||(q.t>=450&&q.t<=534&&q.d>=8&&q.d<=66);}
