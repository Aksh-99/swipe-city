import {copyPlayerState,validPlayerState} from '../src/room-protocol.js';
import {TRANSPORT_ACCESS,TRANSPORT_COOLDOWN,allowedTransport,nearTransportDoor,nearPoliceCar,transportAccessForCharacter} from '../src/transport-rules.js';
import {findTransport,transportArrival} from '../src/transport-config.js';
import {movementCredit} from './match-rules.js';
export class TransportError extends Error{constructor(message,status=409,code='TRANSPORT_UNAVAILABLE'){super(message);this.status=status;this.code=code;}}
// Private server metadata shares the existing JSON pose column; explicit
// physical-state projections strip it from every public movement snapshot.
// Authorization always derives from the server's assigned character.
export function transportMetadata(encoded){
 const value=typeof encoded==='string'?JSON.parse(encoded):encoded;
 const meta=value?._transport;
 return {access:TRANSPORT_ACCESS.includes(meta?.access)?meta.access:'pedestrian',lastAt:Number.isFinite(meta?.lastAt)?meta.lastAt:0};
}
const hairMetadata=previous=>{const p=typeof previous==='string'?JSON.parse(previous):previous;return p?._hairColor?{_hairColor:p._hairColor}:{};};
export const encodeMovement=(state,previous)=>JSON.stringify({...copyPlayerState(state),...hairMetadata(previous),_transport:transportMetadata(previous)});
export function planTransport({body,self,room,time}){
 if(room.phase!=='playing')throw new TransportError('Start the match before using transport.');
 if(body.matchId!==room.match_id||body.revision!==self.state_revision)throw new TransportError('Your player has moved. Try entering the door again.',409,'TRANSPORT_STALE');
 if(!Number.isSafeInteger(body.sequence)||body.sequence<=self.sequence||body.sequence>2147483647)throw new TransportError('Invalid transport update.',400);
 const source=findTransport(body.portalId);if(!source)throw new TransportError('Unknown vehicle.',400);
 const meta={...transportMetadata(self.state),access:transportAccessForCharacter(self.avatar)};
 if(!allowedTransport(meta.access,source.kind))throw new TransportError(meta.access==='police'?'Police officers travel using NYPD cars.':'Pedestrians travel using buses.',403,'TRANSPORT_FORBIDDEN');
 if(time-meta.lastAt<TRANSPORT_COOLDOWN)throw new TransportError('Step away from the door before travelling again.',409,'TRANSPORT_COOLDOWN');
 const previous=JSON.parse(self.state),current=body.state??previous;
 if(!validPlayerState(current)||movementCredit(previous,current,time-Math.max(self.pose_at,room.started_at),self.movement_credit)===null)throw new TransportError('Walk up to the vehicle door first.',409,'TRANSPORT_TOO_FAR');
 if(!(source.kind==='police'?nearPoliceCar(current.position,source):source.doors.some(door=>nearTransportDoor(current.position,door))))throw new TransportError('Walk up to the vehicle door first.',409,'TRANSPORT_TOO_FAR');
 let destinationId=null;
 if(source.kind==='police'){const destination=findTransport(body.destinationId);if(!destination||destination.kind!=='police'||destination.id===source.id)throw new TransportError('Choose another NYPD car on your map.',400,'DESTINATION_REQUIRED');destinationId=destination.id;}
 const {destination,state}=transportArrival(source,self.slot,destinationId);
 return {source,destination,state,encoded:JSON.stringify({...state,...hairMetadata(self.state),_transport:{...meta,lastAt:time}})};
}
