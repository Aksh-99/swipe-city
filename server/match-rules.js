import spawnPoints from '../public/data/match-spawns.json' with {type:'json'};
import {DEFAULT_ROOM_STATE,copyPlayerState} from '../src/room-protocol.js';
import {containsPlayArea,PLAY_AREA_PLAYER_RADIUS} from '../src/play-area.js';

// ENU metres at the existing Times Square origin. These points are validated
// against the same real city/plaza colliders used by the player controller.
export const MATCH_SPAWNS=Object.freeze([
 [-1.5,-1.5,.17],[1.5,-1.5,.17],[-1.5,1.5,.17],[1.5,1.5,.17]
].map(position=>Object.freeze({...DEFAULT_ROOM_STATE,position:Object.freeze(position)})));
export function spawnState(slot){const state=copyPlayerState(MATCH_SPAWNS[slot%4]);const group=Math.floor(slot/4);state.position[0]+=group*2;state.position[1]+=group*2;return state;}
export const RANDOM_SPAWN_POINTS=spawnPoints;
const randomIndex=length=>crypto.getRandomValues(new Uint32Array(1))[0]%length;
export function createMatchSpawns(players,officerIds,choose=randomIndex){
 const assigned={},used=[],officers=new Set(officerIds);
 for(const [index,id]of officerIds.entries()){const state=copyPlayerState(DEFAULT_ROOM_STATE);state.position=[...spawnPoints.officers[index]];state.heading=spawnPoints.officerHeading;assigned[id]=state;}
 for(const player of players){if(officers.has(player.id))continue;
  const clear=distance=>spawnPoints.civilian.filter(candidate=>used.every(p=>Math.hypot(p[0]-candidate.position[0],p[1]-candidate.position[1])>=distance));
  const wide=clear(60),pool=wide.length?wide:clear(40);if(!pool.length)throw Error('No separated spawn available');
  const selected=pool[((choose(pool.length)%pool.length)+pool.length)%pool.length],state=copyPlayerState(DEFAULT_ROOM_STATE);state.position=[...selected.position];state.heading=choose(6283)/1000-Math.PI;assigned[player.id]=state;used.push(state.position);
 }
 return assigned;
}
export function roundSpawnState(round,member){return round?.spawns?.[member.player_id]?copyPlayerState(round.spawns[member.player_id]):spawnState(member.slot);}
export function movementCredit(previous,next,elapsedMs,credit=1.5){
 if(!containsPlayArea(next.position,PLAY_AREA_PLAYER_RADIUS))return null;
 const seconds=Math.max(0,Math.min(10_000,elapsedMs))/1000;
 const horizontal=Math.hypot(next.position[0]-previous.position[0],next.position[1]-previous.position[1]);
 const vertical=Math.abs(next.position[2]-previous.position[2]);
 // Sprint is 8 m/s. Slack covers packet timing, curb resolution and braking.
 // This is a sanity envelope, not server-side geometry/collision simulation.
 const available=9*seconds+credit;
 return horizontal<=available&&vertical<=35*seconds+1.5?Math.min(1.5,available-horizontal):null;
}
export function plausibleMovement(previous,next,elapsedMs,credit=1.5){return movementCredit(previous,next,elapsedMs,credit)!==null;}
