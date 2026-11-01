import data from'../public/data/tsx47.json'with{type:'json'};
export const TSX47=data;
export function tsx47Local(p){const x=p[0]-data.origin[0],y=p[1]-data.origin[1];return{t:x*data.east[0]+y*data.east[1],d:x*data.north[0]+y*data.north[1]};}
export function tsx47Replaces(f){const q=tsx47Local(f.center);return q.t>286&&q.t<351&&q.d< -8&&q.d> -69;}
