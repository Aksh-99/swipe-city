import data from'../public/data/fdny-theta48.json'with{type:'json'};export const FDNY_THETA48=data;
export function reference48Local(p){const x=p[0]-data.origin[0],y=p[1]-data.origin[1];return{t:x*data.east[0]+y*data.east[1],d:x*data.north[0]+y*data.north[1]};}
export function reference48Replaces(f){const q=reference48Local(f.center);return(q.t>14&&q.t<46&&q.d>51.4&&q.d<71)||(q.t>14&&q.t<36.7&&q.d>88.5&&q.d<149.3);}
