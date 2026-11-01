import {isPoliceCharacter} from './appearances.js';
// Access follows the server-assigned character, never a client-selected role.
export const TRANSPORT_ACCESS=Object.freeze(['pedestrian','police']);
export const transportAccessForCharacter=id=>isPoliceCharacter(id)?'police':'pedestrian';
export const TRANSPORT_COOLDOWN=1800;
export const transportName=access=>access==='police'?'Police · NYPD cars':'Pedestrian · buses';
export const allowedTransport=(access,kind)=>access==='police'?kind==='police':access==='pedestrian'&&kind==='bus';
export function doorCoordinates(position,door){
 const d=position.map((v,i)=>v-door.position[i]);
 return {outward:d.reduce((n,v,i)=>n+v*door.normal[i],0),along:d.reduce((n,v,i)=>n+v*door.tangent[i],0),height:position[2]};
}
export function nearTransportDoor(position,door,{entering=false}={}){
 const q=doorCoordinates(position,door);
 return q.outward>=.17&&q.outward<=(entering?.72:1.65)&&Math.abs(q.along)<=(entering?.62:1.0)&&Math.abs(q.height-door.ground)<.55;
}
// Officers may choose a destination while standing beside any part of a patrol car.
export function nearPoliceCar(position,portal){return portal?.kind==='police'&&portal.doors.some(d=>Math.hypot(position[0]-d.position[0],position[1]-d.position[1])<=4&&Math.abs(position[2]-d.ground)<.8);}
