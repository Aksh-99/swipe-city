import {roleFor,policeIds,thiefIds,isOut,catchThief,checkPoliceWin} from './round-teams.js';
import {teamCounts,MIN_PLAYERS,MAX_PLAYERS} from '../src/team-rules.js';
export {roleFor} from './round-teams.js';
import {applyShot} from './shooting.js';
import {settleStreetRules,applyCityEvent,createPhotoTasks} from './city-rules.js';
import {isPoliceCharacter} from '../src/appearances.js';
import {MEMBER_LEASE} from '../src/room-protocol.js';
import {matchDuration} from '../src/match-time.js';
import {THEFT_GOAL,HOLD_GRACE_MS,WRONGFUL_ARREST_MS,PEDESTRIAN_WALLET,nearInteraction,interactionDuration} from '../src/round-rules.js';
import {collectReports,reportsForArrest,resolveArrestReports,finishRewards} from './round-rewards.js';

export class RoundError extends Error{constructor(message,status=409,code='ACTION_UNAVAILABLE'){super(message);this.status=status;this.code=code;}}
const randomIndex=length=>crypto.getRandomValues(new Uint32Array(1))[0]%length;
const parse=room=>JSON.parse(room.anchor_state);
const actorPosition=member=>JSON.parse(member.state).position;
export const movementLocked=(round,id,time)=>isOut(round,id)||(round?.penalties?.[id]??(!round?.policeIds&&id===round?.policeId?round?.cooldownUntil:0)??0)>time;
export const penaltyPath=id=>`$._round.penalties."${id}"`;
export const permitsMovementSQL="(? IS NOT NULL AND COALESCE(json_extract(anchor_state,?),0)<=?)";
export function newRound(players,matchId,choose=randomIndex){
 if(players.length<MIN_PLAYERS||players.length>MAX_PLAYERS)throw new RoundError('A round needs 4–20 players.',409,'LOBBY_NOT_READY');
 const count=teamCounts(players.length).officers,pool=[...players],officers=[];
 const take=p=>{pool.splice(pool.indexOf(p),1);return p;};
 for(const p of players.filter(p=>isPoliceCharacter(p.characterId)).slice(0,count))officers.push(take(p));
 while(officers.length<count)officers.push(take(pool[choose(pool.length)]));
 const thieves=[];while(thieves.length<count)thieves.push(take(pool[choose(pool.length)]));
 const pedestrians=pool;
 return {matchId,policeIds:officers.map(p=>p.id),thiefIds:thieves.map(p=>p.id),policeId:officers[0].id,thiefId:thieves[0].id,caught:{},stolen:0,goal:THEFT_GOAL,
  photoTasks:Object.fromEntries(pedestrians.map(p=>[p.id,createPhotoTasks(choose)])),dead:{},wallets:Object.fromEntries(players.map(p=>[p.id,PEDESTRIAN_WALLET])),values:Object.fromEntries(pedestrians.map(p=>[p.id,100+25*choose(7)])),reports:{},penalties:{},assists:{},rewards:{},actions:{},feedback:{},cooldownUntil:0,result:null};
}
const roomColumns='code,phase,match_id,started_at,anchor_state,expires_at,host_id';
export async function readRoundRoom(db,code){return db.prepare(`SELECT ${roomColumns} FROM ts_rooms WHERE code=?`).bind(code).first();}
// The local SQLite adapter and D1 both expose .run() results. SELECTs use batch
// so these same queries work in both runtimes without a second game protocol.
async function readMembers(db,code,time){return (await db.batch([db.prepare(`SELECT player_id,slot,name,avatar,ready,state,state_revision,sequence FROM ts_members WHERE room_code=? AND (last_seen>=? OR presence_until>=?)`).bind(code,time-MEMBER_LEASE,time)]))[0].results;}
function targetPosition(action,members){const target=members.find(m=>m.player_id===action.targetId&&m.ready);return target&&actorPosition(target);}
function feedback(round,id,action,kind,time,extra={}){round.feedback[id]={id:crypto.randomUUID(),actionId:action?.id??null,kind,at:time,...extra};}
function interrupt(round,id,action,time){delete round.actions[id];feedback(round,id,action,'interrupted',time);}
function prune(round,room,members,time){
 // Existing live rounds and replacement pedestrians receive private wallets.
 // No NPC id is a target: every pocket belongs to an authenticated room member.
 round.wallets??={};round.values??={};round.dead??={};round.caught??={};
 if(!round.policeIds){round.policeIds=policeIds(round);round.thiefIds=thiefIds(round);if(round.cooldownUntil)round.penalties[round.policeId]=round.cooldownUntil;}
 for(const m of members){
  round.wallets[m.player_id]??=PEDESTRIAN_WALLET;round.values[m.player_id]??=100+25*randomIndex(7);
 }
 round.gunshots=(round.gunshots??[]).filter(s=>time-s.at<15000);
 round.startedAt??=room.started_at;round.photoTasks??={};for(const m of members)if(roleFor(round,m.player_id)==='PEDESTRIAN')round.photoTasks[m.player_id]??=createPhotoTasks(randomIndex);
 if(time<room.started_at+matchDuration(round.durationMs))settleStreetRules(round,members,time);
 collectReports(round,members,time);
 if(round.result)return;
 if(time>=room.started_at+matchDuration(round.durationMs)){round.result={winner:'THIEF',reason:'survived',stolen:round.stolen,goal:THEFT_GOAL,endedAt:room.started_at+matchDuration(round.durationMs)};round.actions={};return;}
 if(!policeIds(round).some(id=>members.some(m=>m.player_id===id))||!thiefIds(round).some(id=>!isOut(round,id)&&members.some(m=>m.player_id===id))){
  round.result={winner:null,reason:'disconnected',stolen:round.stolen,goal:THEFT_GOAL,endedAt:time};round.actions={};return;
 }
 for(const [id,action]of Object.entries(round.actions)){
  const member=members.find(m=>m.player_id===id),target=targetPosition(action,members),pose=member&&JSON.parse(member.state);
  if(isOut(round,id)||isOut(round,action.targetId)||!member||!member.ready||member.state_revision!==action.revision||!target||!nearInteraction(pose.position,target)||pose.speed>.5||pose.airBlend>.35||time-action.lastPulseAt>HOLD_GRACE_MS||action.kind!=='arrest')interrupt(round,id,action,time);
 }
}
// Every game mutation compares the exact previous room document in one SQL
// write. Concurrent Worker isolates cannot double award money or arrest twice.
// Actor/target sequence guards also recheck that validated poses are current.
async function mutate({db,code,time,matchId,decide=()=>{},guardIds=[],initial=null}){
 for(let attempt=0;attempt<6;attempt++){
  const room=attempt===0&&initial?.room?initial.room:await readRoundRoom(db,code);if(!room)return null;
  const anchor=parse(room),round=anchor._round;
  if(!round||room.phase!=='playing'){
   if(matchId)throw new RoundError('Start a new round to use this action.',409,'MATCH_NOT_STARTED');
   return {room,round:null,anchor};
  }
  if(matchId&&room.match_id!==matchId)throw new RoundError('This action belongs to an earlier round.',409,'ACTION_STALE');
  const members=attempt===0&&initial?.members?initial.members:await readMembers(db,code,time);prune(round,room,members,time);
  const error=await decide({round,room,members});
  finishRewards(round,members);
  const encoded=JSON.stringify(anchor);
  if(encoded===room.anchor_state){if(error)throw error;return {room,round,anchor};}
  const guards=guardIds.map(id=>members.find(m=>m.player_id===id)).filter(Boolean);
  const result=await db.prepare(`UPDATE ts_rooms SET anchor_state=? WHERE code=? AND match_id=? AND phase='playing' AND anchor_state=?
   ${guards.map(()=>`AND EXISTS(SELECT 1 FROM ts_members WHERE room_code=? AND player_id=? AND sequence=? AND state_revision=?)`).join('\n')}`).bind(encoded,code,room.match_id,room.anchor_state,...guards.flatMap(m=>[code,m.player_id,m.sequence,m.state_revision])).run();
  if(!result.meta.changes)continue;
  if(error)throw error;return {room:{...room,anchor_state:encoded},round,anchor};
 }
 throw new RoundError('The action changed while connecting. Try again.',409,'ACTION_BUSY');
}
export const settleRound=(db,code,time,initial)=>mutate({db,code,time,initial});
export function privateRound(round,id,time=Date.now()){
 if(!round)return null;const role=roleFor(round,id),action=round.actions[id];
 return {role,caught:!!round.caught?.[id],teamCounts:{officers:policeIds(round).length,thieves:thiefIds(round).length},dead:!!round.dead?.[id],survival:true,nextShotAt:(round.shotAt?.[id]??0)+1000,goal:THEFT_GOAL,...(['THIEF','POLICE'].includes(role)?{...(role==='THIEF'?{stolen:round.stolen}:{}),availablePlayerIds:Object.keys(round.wallets??{}).filter(other=>other!==id&&!isOut(round,other))}:{}),
  wallet:round.wallets?.[id]??PEDESTRIAN_WALLET,
  ...(role==='PEDESTRIAN'?{photoTasks:(round.photoTasks?.[id]??[]).filter(t=>time>=(round.startedAt??time)+t.dueAfter)}:{}),
  ...(role==='POLICE'?{cooldownUntil:round.penalties?.[id]??0,penaltyUntil:round.penalties?.[id]??0,penaltyKind:round.penaltyKinds?.[id]??'wrongful_arrest'}:{penaltyUntil:round.penalties?.[id]??0,penaltyKind:'false_report'}),
  ...(round.result?{reward:round.rewards?.[id]??0,finalBalance:role==='THIEF'?(round.wallets?.[id]??PEDESTRIAN_WALLET):role==='PEDESTRIAN'?round.wallets?.[id]??0:0}:{}),
  action:action?{id:action.id,kind:action.kind,targetId:action.targetId,startedAt:action.startedAt,endsAt:action.endsAt}:null,
  feedback:round.feedback[id]??null};
}
export function publicInteraction(round,id){const a=round?.actions[id];return a&&!round.result?{motion:'arrest',startedAt:a.startedAt,endsAt:a.endsAt}:null;}
export async function interactRound({db,code,self,time,body}){
 if(!['begin','finish','cancel'].includes(body.command))throw new RoundError('Invalid action.',400,'INVALID_ACTION');
 const id=self.player_id,guardIds=[id];if(typeof body.targetId==='string')guardIds.push(body.targetId);
 return mutate({db,code,time,matchId:body.matchId,guardIds,decide:({round,room,members})=>{
  const fail=(message,code='ACTION_UNAVAILABLE',status=409)=>new RoundError(message,status,code);
  if(body.matchId!==room.match_id)return fail('Reconnect to this round.','ACTION_STALE');
  if(round.result)return fail('The round has ended. Ask the host for a rematch.','MATCH_ENDED');
  if(isOut(round,id))return fail('You are out. Wait for the next round.',round.dead?.[id]?'PLAYER_DEAD':'PLAYER_CAUGHT');
  const member=members.find(m=>m.player_id===id);if(!member?.ready)return fail('Wait until your character is ready.');
  let action=round.actions[id];
  if(body.command==='cancel'){if(action&&(!body.actionId||action.id===body.actionId))interrupt(round,id,action,time);return;}
  if(body.command==='begin'&&body.kind==='shoot'){
   if(!['THIEF','POLICE'].includes(roleFor(round,id)))return fail('Only thieves and officers can shoot.','ACTION_FORBIDDEN',403);
   if(body.hidden||movementLocked(round,id,time))return fail('You cannot shoot right now.','ACTION_FORBIDDEN');
   const target=members.find(m=>m.player_id===body.targetId),reportIds=roleFor(round,id)==='POLICE'&&roleFor(round,body.targetId)==='THIEF'?reportsForArrest(round,body.targetId,time):[];
   const error=applyShot(round,member,target,time,body.shotId,{allowMiss:body.targetId===null});if(error)return fail(...error);if(round.caught?.[body.targetId]?.by===id)resolveArrestReports(round,{targetId:body.targetId,reportIds},members,time);checkPoliceWin(round,time);return;
  }
  if(body.command==='begin'){
   const role=roleFor(round,id),allowed=body.kind==='arrest'&&role==='POLICE';
   if(!allowed)return fail('Your role cannot perform this action.','ACTION_FORBIDDEN',403);
   if(movementLocked(round,id,time))return fail('Wait until your movement penalty ends.',role==='POLICE'?'ARREST_COOLDOWN':'FALSE_REPORT_PENALTY',429);
   if(body.hidden)return fail('Keep the game visible while holding E.','ACTION_INTERRUPTED');
   if(body.kind==='arrest'&&(isOut(round,body.targetId)||body.targetId===id||!members.some(m=>m.player_id===body.targetId&&m.ready)))return fail('Look at another nearby person.','ARREST_TARGET');
   const target=targetPosition(body,members),pose=JSON.parse(member.state);
   if(!nearInteraction(pose.position,target)||pose.speed>.5||pose.airBlend>.35)return fail('Stand close and still to hold E.','TARGET_TOO_FAR');
   if(action){if(action.kind===body.kind&&action.targetId===body.targetId)return;return fail('Release E before starting another action.');}
   const reportIds=body.kind==='arrest'?reportsForArrest(round,body.targetId,time):[];
   round.actions[id]={id:crypto.randomUUID(),kind:body.kind,targetId:body.targetId,reportIds,startedAt:time,endsAt:time+interactionDuration(body.kind),lastPulseAt:time,revision:member.state_revision};return;
  }
  if(!action||action.id!==body.actionId){
   if(round.feedback[id]?.actionId===body.actionId&&['theft','wrongful_arrest','arrested'].includes(round.feedback[id]?.kind))return;
   return fail('The hold was interrupted. Try again.','ACTION_INTERRUPTED');
  }
  // target ID comes from the stored action, never the completion payload.
  if(!guardIds.includes(action.targetId))guardIds.push(action.targetId);
  if(time<action.endsAt)return fail('Keep holding E until the circle fills.','HOLD_INCOMPLETE');
  if(body.hidden||time-action.lastPulseAt>HOLD_GRACE_MS||!nearInteraction(actorPosition(member),targetPosition(action,members)))return fail('The hold was interrupted. Try again.','ACTION_INTERRUPTED');
  delete round.actions[id];
  if(roleFor(round,action.targetId)==='THIEF'){
   resolveArrestReports(round,action,members,time);catchThief(round,action.targetId,id,time);feedback(round,id,action,'arrested',time);
  }else{resolveArrestReports(round,action,members,time);round.penalties[id]=time+WRONGFUL_ARREST_MS;round.penaltyKinds??={};round.penaltyKinds[id]='wrongful_arrest';feedback(round,id,action,'wrongful_arrest',time,{cooldownUntil:round.penalties[id]});}
 }});
}
export async function pulseInteraction({db,code,self,time,body}){
 return mutate({db,code,time,matchId:body.matchId,guardIds:[self.player_id],decide:({round})=>{
  const action=round.actions[self.player_id];if(!action||round.result)return;
  if(body.interactionId!==action.id||body.hidden)interrupt(round,self.player_id,action,time);
  else action.lastPulseAt=time;
 }});
}

export async function cityEvent({db,code,self,time,body}){return mutate({db,code,time,matchId:body.matchId,guardIds:[self.player_id],decide:({round,room,members})=>{if(body.matchId!==room.match_id)return new RoundError('This action belongs to an earlier round.',409,'ACTION_STALE');const error=applyCityEvent(round,room,members,self.player_id,body,time);if(error)return new RoundError(error.message,409,error.code??'CITY_ACTION_UNAVAILABLE');}});}
