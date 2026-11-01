import data from '../public/data/transport-portals.json' with {type:'json'};
import {DEFAULT_ROOM_STATE} from './room-protocol.js';
import {containsPlayArea,PLAY_AREA_PLAYER_RADIUS} from './play-area.js';
// Keep the scenery intact; only doors with four safe in-area exits participate
// in travel. Re-link each loop so a portal cannot cross the playable perimeter.
export const TRANSPORT_PORTALS=data.portals.map(p=>({...p,doors:p.doors.filter(d=>containsPlayArea(d.approach,PLAY_AREA_PLAYER_RADIUS))})).filter(p=>p.doors.length&&p.exits.every(e=>containsPlayArea(e.position,PLAY_AREA_PLAYER_RADIUS)));
for(const kind of ['bus','police']){const route=TRANSPORT_PORTALS.filter(p=>p.kind===kind);route.forEach((p,i)=>p.nextId=route[(i+1)%route.length].id);}
export const findTransport=id=>TRANSPORT_PORTALS.find(portal=>portal.id===id);
export function transportArrival(source,slot=0,destinationId=null){
 const destination=findTransport(destinationId??source.nextId);if(!destination||destination.kind!==source.kind)throw new RangeError('Unknown transport destination');
 const exit=destination.exits[slot%destination.exits.length];if(!exit)throw new RangeError('Unknown player exit');
 return {destination,state:{...DEFAULT_ROOM_STATE,position:[...exit.position],heading:exit.heading}};
}
