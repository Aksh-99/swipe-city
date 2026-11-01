import {roleFor} from './round-teams.js';
import {APPEARANCES,isPoliceCharacter,appearanceDescription,OFFICER_CHARACTER_ID} from '../src/appearances.js';
import {CALL_LIFETIME,CALL_COOLDOWN,SUSPECT_REPORT_DISTANCE,SUSPECT_SELECTION_LIFETIME} from '../src/dispatch-rules.js';
import {containsPlayArea} from '../src/play-area.js';
import {reportLocation} from '../src/report-location.js';
import {matchDuration,matchTiming} from '../src/match-time.js';
import {MEMBER_LEASE} from '../src/room-protocol.js';
import {penaltyPath} from './round.js';
const active='(last_seen>=? OR presence_until>=?)';

export class DispatchError extends Error{constructor(message,status=409,code='SUSPECT_UNAVAILABLE'){super(message);this.status=status;this.code=code;}}
export function activeObservation(member,matchId,time){
 if(!member||isPoliceCharacter(member.avatar))return null;
 const o=JSON.parse(member.state)._dispatch?.observation;
 if(!o||o.matchId!==matchId||typeof o.id!=='string'||typeof o.suspectId!=='string'||!Number.isFinite(o.createdAt)||o.createdAt>time||time-o.createdAt>=SUSPECT_SELECTION_LIFETIME||!APPEARANCES.some(a=>a.description===o.description)||!Array.isArray(o.position)||o.position.length!==3||!o.position.every(Number.isFinite)||!containsPlayArea(o.position))return null;
 return {id:o.id,suspectId:o.suspectId,description:o.description,activity:['pickpocketing','shooting'].includes(o.activity)?o.activity:'suspicious',position:[...o.position],createdAt:o.createdAt,expiresAt:o.createdAt+SUSPECT_SELECTION_LIFETIME};
}
export async function recordWitnessReport({db,roomCode,self,room,time,presenceUntil,suspectId,id,observe=false,observationId,activity}){
 const durationMs=matchDuration(JSON.parse(room.anchor_state)._round?.durationMs);
 if(roleFor(JSON.parse(room.anchor_state)._round,self.player_id)==='THIEF')throw new DispatchError('Only pedestrian witnesses can send 911 reports.',403,'CALL_FORBIDDEN');
 // A report type is a witness claim. It is never checked against the target's
 // secret role or the theft ledger and does not confirm that a crime occurred.
 if(activity!==undefined&&!['suspicious','pickpocketing','shooting'].includes(activity))throw new DispatchError('Choose suspicious activity or suspected shooting.',400,'INVALID_REPORT');
 if(observationId!==undefined&&!observe){
  const observation=activeObservation(self,room.match_id,time);
  if(!observation||observation.id!==observationId)throw new DispatchError('Your selection expired. Look at the person and press R again.',409,'OBSERVATION_EXPIRED');
  const result=await db.prepare(`UPDATE ts_members SET state=json_set(state,'$._dispatch',json_set(COALESCE(json_extract(state,'$._dispatch'),'{}'),'$.lastAt',?,'$.call',json_object('id',?,'createdAt',?,'matchId',?,'kind','suspect','activity',?,'suspectId',json_extract(state,'$._dispatch.observation.suspectId'),'description',json_extract(state,'$._dispatch.observation.description'),'remainingMs',?,'lastSeenAt',json_extract(state,'$._dispatch.observation.createdAt'),'position',json_extract(state,'$._dispatch.observation.position')))),
   last_seen=MAX(last_seen,?),presence_until=MAX(presence_until,?) WHERE room_code=? AND player_id=? AND avatar<>? AND ${active}
   AND json_extract(state,'$._dispatch.observation.id')=? AND json_extract(state,'$._dispatch.observation.matchId')=? AND json_extract(state,'$._dispatch.observation.createdAt')>?
   AND (json_extract(state,'$._dispatch.lastAt') IS NULL OR json_extract(state,'$._dispatch.lastAt')<=?)
   AND EXISTS(SELECT 1 FROM ts_rooms WHERE code=? AND phase='playing' AND match_id=? AND started_at>? AND json_extract(anchor_state,'$._round.result') IS NULL AND COALESCE(json_extract(anchor_state,'$._round.thiefId'),'')<>? AND COALESCE(json_extract(anchor_state,?),0)<=?)`).bind(time,id,time,room.match_id,activity??observation.activity,matchTiming({matchPhase:room.phase,startedAt:room.started_at,durationMs},time).remainingMs,time,presenceUntil,roomCode,self.player_id,OFFICER_CHARACTER_ID,time-MEMBER_LEASE,time,observationId,room.match_id,time-SUSPECT_SELECTION_LIFETIME,time-CALL_COOLDOWN,roomCode,room.match_id,time-durationMs,self.player_id,penaltyPath(self.player_id),time).run();
  if(!result.meta.changes)throw new DispatchError('Wait 10 seconds before calling again, then select a nearby person.',429,'CALL_COOLDOWN');
  return;
 }
 if(typeof suspectId!=='string'||!/^[a-f0-9-]{36}$/.test(suspectId))throw new DispatchError('Look at a nearby person and select them before calling 911.',400,'SUSPECT_REQUIRED');
 if(suspectId===self.player_id)throw new DispatchError('Select another person to report.',400,'SUSPECT_SELF');
 const suspect=await db.prepare(`SELECT avatar,state FROM ts_members WHERE room_code=? AND player_id=? AND ready=1 AND ${active}`).bind(roomCode,suspectId,time-MEMBER_LEASE,time).first();
 if(!suspect)throw new DispatchError('This person has disconnected. Look at someone nearby again.');
 const a=JSON.parse(self.state).position,b=JSON.parse(suspect.state).position;
 if(!containsPlayArea(b)||Math.hypot(a[0]-b[0],a[1]-b[1])>SUSPECT_REPORT_DISTANCE||Math.abs(a[2]-b[2])>3)throw new DispatchError('Get closer and look at this person again.',409,'SUSPECT_TOO_FAR');
 // Capture the suspect's current accepted position at the write, and check
 // proximity against both current database poses. Client text/time/roles and
 // arbitrary coordinates never enter a report. The suspect ID stays private.
 const x="json_extract((SELECT state FROM suspect),'$.position[0]')-json_extract(state,'$.position[0]')",y="json_extract((SELECT state FROM suspect),'$.position[1]')-json_extract(state,'$.position[1]')";
 const captured=`json_object('id',?,'createdAt',?,'matchId',?,'kind','suspect','activity',?,'suspectId',?,'description',?,'remainingMs',?,'lastSeenAt',?,'position',json_extract((SELECT state FROM suspect),'$.position'))`;
 const metadata=observe?`json_set(COALESCE(json_extract(state,'$._dispatch'),'{}'),'$.observation',${captured})`:`json_set(COALESCE(json_extract(state,'$._dispatch'),'{}'),'$.lastAt',?,'$.call',${captured})`;
 const result=await db.prepare(`WITH suspect AS (SELECT state FROM ts_members WHERE room_code=? AND player_id=? AND ready=1 AND ${active})
  UPDATE ts_members SET state=json_set(state,'$._dispatch',${metadata}),
  last_seen=MAX(last_seen,?),presence_until=MAX(presence_until,?) WHERE room_code=? AND player_id=? AND avatar<>? AND ${active}
  ${observe?'':"AND (json_extract(state,'$._dispatch.lastAt') IS NULL OR json_extract(state,'$._dispatch.lastAt')<=?)"}
  AND EXISTS(SELECT 1 FROM suspect) AND (${x})*(${x})+(${y})*(${y})<=?
  AND ABS(json_extract((SELECT state FROM suspect),'$.position[2]')-json_extract(state,'$.position[2]'))<=3
  AND EXISTS(SELECT 1 FROM ts_rooms WHERE code=? AND phase='playing' AND match_id=? AND started_at>? AND json_extract(anchor_state,'$._round.result') IS NULL AND COALESCE(json_extract(anchor_state,'$._round.thiefId'),'')<>? AND COALESCE(json_extract(anchor_state,?),0)<=?)`).bind(roomCode,suspectId,time-MEMBER_LEASE,time,...(observe?[]:[time]),id,time,room.match_id,activity??'suspicious',suspectId,appearanceDescription(suspect.avatar,'natural'),matchTiming({matchPhase:room.phase,startedAt:room.started_at,durationMs},time).remainingMs,time,time,presenceUntil,roomCode,self.player_id,OFFICER_CHARACTER_ID,time-MEMBER_LEASE,time,...(observe?[]:[time-CALL_COOLDOWN]),SUSPECT_REPORT_DISTANCE**2,roomCode,room.match_id,time-durationMs,self.player_id,penaltyPath(self.player_id),time).run();
 if(!result.meta.changes){
  const latest=await db.prepare('SELECT state FROM ts_members WHERE room_code=? AND player_id=?').bind(roomCode,self.player_id).first();
  if(JSON.parse(latest?.state??'{}')._dispatch?.lastAt>time-CALL_COOLDOWN)throw new DispatchError('Wait 10 seconds before calling again.',429,'CALL_COOLDOWN');
  throw new DispatchError('This person has moved or disconnected. Look at someone nearby again.');
 }
}

// D1 stores the call in private member metadata. Physical-state projections
// exclude it; only the officer receives the room's dispatch list.
export function activeDispatchCalls(members,matchId,time){
 if(!matchId)return [];
 return members.flatMap(member=>{
  if(isPoliceCharacter(member.avatar))return [];
  const call=JSON.parse(member.state)._dispatch?.call;
  if(!call||call.matchId!==matchId||typeof call.id!=='string'||!Number.isFinite(call.createdAt)||call.createdAt>time||time-call.createdAt>=CALL_LIFETIME||!Array.isArray(call.position)||call.position.length!==3||!call.position.every(Number.isFinite)||!containsPlayArea(call.position))return [];
  const witness=call.kind==='suspect'&&APPEARANCES.some(a=>a.description===call.description);
  return [{id:call.id,playerId:member.player_id,number:member.slot+1,name:member.name,kind:witness?'suspect':'location',activity:['pickpocketing','shooting'].includes(call.activity)?call.activity:'suspicious',description:witness?call.description:null,location:reportLocation(call.position),remainingMs:Number.isFinite(call.remainingMs)?Math.max(0,Math.min(3_600_000,call.remainingMs)):null,position:[...call.position],lastSeenAt:Number.isFinite(call.lastSeenAt)?call.lastSeenAt:call.createdAt,createdAt:call.createdAt,expiresAt:call.createdAt+CALL_LIFETIME}];
 }).sort((a,b)=>b.createdAt-a.createdAt);
}
