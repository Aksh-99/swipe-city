import data from '../public/data/play-area.json' with {type:'json'};
export const PLAY_AREA=data;
export const PLAY_AREA_PLAYER_RADIUS=.32;
export function containsPlayArea(position,radius=0){
 const x=Array.isArray(position)?position[0]:position.x,y=Array.isArray(position)?position[1]:position.y;
 return Number.isFinite(x)&&Number.isFinite(y)&&data.planes.every(p=>p.normal[0]*x+p.normal[1]*y>=p.offset+radius-1e-6);
}
// Infinite-height invisible walls: project only horizontal capsule motion,
// allowing sliding along an edge and normal gravity/jumping beside it.
export function constrainPlayArea(position,radius=PLAY_AREA_PLAYER_RADIUS){
 for(let pass=0;pass<4;pass++)for(const plane of data.planes){
  const distance=plane.normal[0]*position.x+plane.normal[1]*position.y-plane.offset-radius;
  if(distance<0){position.x-=plane.normal[0]*(distance-.00001);position.y-=plane.normal[1]*(distance-.00001);}
 }
 return position;
}
