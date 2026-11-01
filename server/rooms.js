import {MIN_PLAYERS,MAX_PLAYERS} from '../src/team-rules.js';
import {streetAlerts} from './city-rules.js';
import {normalizeDesign} from '../src/character-designs.js';
import {validHairColor,normalizeHairColor} from '../src/hair-colors.js';
import {AVATAR_IDS,ROOM_CODE_PATTERN,ROOM_CAPACITY,MEMBER_LEASE,BACKGROUND_LEASE,ROOM_LIFETIME,DEFAULT_ROOM_STATE,validPlayerState,copyPlayerState} from '../src/room-protocol.js';
import {normalizeAppearanceId,isPoliceCharacter,OFFICER_CHARACTER_ID} from '../src/appearances.js';
import {spawnState,createMatchSpawns,roundSpawnState,movementCredit} from './match-rules.js';
import {transportAccessForCharacter} from '../src/transport-rules.js';
import {TransportError,encodeMovement,planTransport} from './transport.js';
import {containsPlayArea,PLAY_AREA_PLAYER_RADIUS} from '../src/play-area.js';
import {activeDispatchCalls,activeObservation,recordWitnessReport,DispatchError} from './dispatch.js';
import {matchTiming,matchDuration,validDuration} from '../src/match-time.js';
import {newRound,privateRound,publicInteraction,cityEvent,settleRound,interactRound,pulseInteraction,roleFor,movementLocked,penaltyPath,permitsMovementSQL,RoundError} from './round.js';
const ALPHABET='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const response=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
class RoomError extends Error{constructor(message,status=400,code='INVALID_REQUEST'){super(message);this.status=status;this.code=code;}}
const code=()=>Array.from(crypto.getRandomValues(new Uint8Array(6)),b=>ALPHABET[b&31]).join('');
const token=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
const hash=async t=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t))),b=>b.toString(16).padStart(2,'0')).join('');
const validToken=t=>typeof t==='string'&&/^[a-f0-9]{64}$/.test(t);
function nameOf(value){const name=String(value??'Player').trim().replace(/[\u0000-\u001f\u007f]/g,'').slice(0,24);return name||'Player';}
const slotValues=Array.from({length:ROOM_CAPACITY},(_,i)=>`(${i})`).join(',');
const spawnCase=`CASE slot ${Array.from({length:ROOM_CAPACITY},(_,i)=>`WHEN ${i} THEN ?`).join(' ')} END`;
const avatarsSQL=AVATAR_IDS.map((id,slot)=>`(${slot},'${id}')`).join(',');
const columns='player_id,slot,avatar,name,last_seen,presence_until,sequence,state,ready,state_revision,pose_at,movement_credit';
// Explicit projection: room snapshots never include credentials, cameras or
// future secret roles. Player numbers and spawns come from server-owned slots.
const publicMember=row=>({id:row.player_id,slot:row.slot,number:row.slot+1,characterId:row.avatar,designId:JSON.parse(row.state)._design??'white_male',...(JSON.parse(row.state)._hairColor?{hairColor:normalizeHairColor(JSON.parse(row.state)._hairColor)}:{}),name:row.name,ready:!!row.ready,revision:row.state_revision,background:row.presence_until>row.last_seen+MEMBER_LEASE,updatedAt:Math.max(row.last_seen,row.pose_at),sequence:row.sequence,state:copyPlayerState(JSON.parse(row.state))});
const alive='(last_seen>=? OR presence_until>=?)',expired='last_seen<? AND presence_until<?';
const deadline=(time,hidden)=>time+(hidden?BACKGROUND_LEASE:MEMBER_LEASE);
const permitsMovement=permitsMovementSQL;

// D1 is the authority for membership, host, start, leases and spawn revisions.
// Independent Worker isolates use the same transactional database, not memory.
export function createRoomsHandler({now=Date.now,chooseRole,chooseSpawn}={}){
 async function recoverPlayAreaMember(db,roomCode,member,time,hidden){
  if(containsPlayArea(JSON.parse(member.state).position,PLAY_AREA_PLAYER_RADIUS))return false;
  // Older live rooms may have walked beyond the newly requested perimeter.
  // A revisioned server spawn keeps reloads and in-flight packets in bounds.
  const saved=await db.prepare('SELECT anchor_state FROM ts_rooms WHERE code=?').bind(roomCode).first(),round=saved?JSON.parse(saved.anchor_state)._round:null;
  await db.prepare(`UPDATE ts_members SET state=json_set(?,'$._transport',json_extract(state,'$._transport'),'$._dispatch',json_extract(state,'$._dispatch'),'$._design',json_extract(state,'$._design'),'$._hairColor',json_extract(state,'$._hairColor')),
   state_revision=state_revision+1,sequence=sequence+1,pose_at=?,last_seen=?,presence_until=?,movement_credit=1.5
   WHERE room_code=? AND player_id=? AND state_revision=? AND sequence=?`).bind(JSON.stringify(roundSpawnState(round,member)),time,time,deadline(time,hidden),roomCode,member.player_id,member.state_revision,member.sequence).run();
  return true;
 }
 async function snapshot(db,roomCode,time,yourId){
  const results=await db.batch([
   db.prepare(`UPDATE ts_rooms SET host_id=(SELECT player_id FROM ts_members WHERE room_code=? AND ${alive} ORDER BY joined_at,slot LIMIT 1)
    WHERE code=? AND (host_id IS NULL OR NOT EXISTS(SELECT 1 FROM ts_members WHERE room_code=? AND player_id=host_id AND ${alive}))`).bind(roomCode,time-MEMBER_LEASE,time,roomCode,roomCode,time-MEMBER_LEASE,time),
   db.prepare('SELECT code,expires_at,host_id,phase,match_id,started_at,anchor_state FROM ts_rooms WHERE code=? AND expires_at>?').bind(roomCode,time),
   db.prepare(`SELECT ${columns} FROM ts_members WHERE room_code=? AND ${alive} ORDER BY slot`).bind(roomCode,time-MEMBER_LEASE,time)
  ]);
  let room=results[1].results[0];if(!room)throw new RoomError('This room has expired. Create a new room.',410,'ROOM_EXPIRED');
  const members=results[2].results,self=members.find(row=>row.player_id===yourId);
  const settled=await settleRound(db,roomCode,time,{room,members});room=settled.room;
  const round=settled.round,result=round?.result??null,serverTime=now(),timing=matchTiming({matchPhase:result?'ended':room.phase,startedAt:room.started_at,roundResult:result,durationMs:round?.durationMs},serverTime);
  const players=members.map(publicMember),calls=activeDispatchCalls(members,room.match_id,time).filter(call=>!round||roleFor(round,call.playerId)==='PEDESTRIAN');
  for(const player of players){player.dead=!!round?.dead?.[player.id];player.caught=!!round?.caught?.[player.id];player.interaction=publicInteraction(round,player.id);if(timing.expired||movementLocked(round,player.id,time))Object.assign(player.state,{speed:0,running:false,poseWeight:0,runBlend:0});}
  return {roomCode,serverTime,expiresAt:room.expires_at,capacity:ROOM_CAPACITY,yourId,hostId:room.host_id,matchPhase:timing.matchPhase,matchId:room.match_id,roundGeneration:settled.anchor.roundGeneration??0,roundResult:result,gunshots:round?.gunshots??[],deathNotices:round?.deathNotices??[],yourRound:privateRound(round,yourId,time),durationMs:matchDuration(round?.durationMs),startedAt:room.started_at,endsAt:timing.endsAt,transportAccess:transportAccessForCharacter(self?.avatar),dispatchCalls:isPoliceCharacter(self?.avatar)?[...calls.map(c=>{const target=members.find(m=>m.player_id===round?.reports?.[c.id]?.suspectId);return target?{...c,position:JSON.parse(target.state).position}:c;}),...streetAlerts(round,members,time)]:[],yourCall:calls.find(call=>call.playerId===yourId)??null,yourObservation:timing.expired||roleFor(round,yourId)==='THIEF'?null:activeObservation(self,room.match_id,time),players};
 }
 async function join(db,roomCode,body,time){
  if(body.token!==undefined){
   if(!validToken(body.token))throw new RoomError('Invalid reconnect credential.',401,'MEMBER_EXPIRED');
   const member=await db.prepare(`SELECT ${columns} FROM ts_members WHERE room_code=? AND token_hash=? AND ${alive}`).bind(roomCode,await hash(body.token),time-MEMBER_LEASE,time).first();
   if(!member)throw new RoomError('Your connection expired. Rejoin the lobby.',401,'MEMBER_EXPIRED');
   await recoverPlayAreaMember(db,roomCode,member,time,body.hidden);
   const current=await snapshot(db,roomCode,time,member.player_id);
   return {...current,sessionToken:body.token,self:current.players.find(p=>p.id===member.player_id)};
  }
  const preferred=normalizeAppearanceId(body.characterId??AVATAR_IDS[0]);if(!AVATAR_IDS.includes(preferred))throw new RoomError('Choose a valid appearance.');
  const sessionToken=token(),tokenHash=await hash(sessionToken),id=crypto.randomUUID();
  const results=await db.batch([
   db.prepare(`DELETE FROM ts_members WHERE room_code=? AND ${expired}`).bind(roomCode,time-MEMBER_LEASE,time),
   db.prepare(`UPDATE ts_rooms SET phase='waiting',match_id=NULL,started_at=0,anchor_state=json_remove(anchor_state,'$._round') WHERE code=? AND NOT EXISTS(SELECT 1 FROM ts_members WHERE room_code=?)`).bind(roomCode,roomCode),
   db.prepare(`WITH slots(slot) AS (VALUES ${slotValues}),avatars(rank,avatar) AS (VALUES ${avatarsSQL})
    INSERT INTO ts_members(token_hash,player_id,room_code,slot,avatar,name,joined_at,last_seen,presence_until,sequence,state,pose_at)
    SELECT ?,?,r.code,s.slot,a.avatar,?,?,?,?,0,json_set(${spawnCase},'$._design',?,'$._transport',json_object('access',CASE WHEN a.avatar='pedestrian' THEN 'police' ELSE 'pedestrian' END,'lastAt',0)),?
    FROM slots s CROSS JOIN avatars a JOIN ts_rooms r ON r.code=?
    WHERE r.expires_at>? AND r.phase='waiting' AND NOT EXISTS(SELECT 1 FROM ts_members m WHERE m.room_code=r.code AND m.slot=s.slot)
    ORDER BY s.slot,CASE WHEN NOT EXISTS(SELECT 1 FROM ts_members m WHERE m.room_code=r.code AND m.avatar=a.avatar) THEN 0 ELSE 1 END,CASE WHEN a.avatar=? THEN 0 ELSE 1 END,a.rank LIMIT 1 RETURNING ${columns}`).bind(tokenHash,id,nameOf(body.name),time,time,deadline(time,body.hidden),...Array.from({length:ROOM_CAPACITY},(_,i)=>JSON.stringify(spawnState(i))),normalizeDesign(body.designId),time,roomCode,time,preferred)

  ]);
  const self=results[2].results[0];
  if(!self){const room=await db.prepare('SELECT code,phase FROM ts_rooms WHERE code=? AND expires_at>?').bind(roomCode,time).first();if(!room)throw new RoomError('Room not found. Check the six-character code.',404,'ROOM_NOT_FOUND');if(room.phase!=='waiting')throw new RoomError('This round is in progress. Wait for the next lobby.',409,'MATCH_IN_PROGRESS');throw new RoomError('This room already has 20 players. Disconnected slots clear after the reconnect grace.',409,'ROOM_FULL');}
  return {...await snapshot(db,roomCode,time,id),sessionToken,self:publicMember(self)};
 }
 return async function rooms(request,env){
  const url=new URL(request.url);if(!url.pathname.startsWith('/api/'))return null;
  if(url.pathname==='/api/health'&&request.method==='GET')return response({multiplayer:!!env.DB,capacity:ROOM_CAPACITY});
  if(!url.pathname.startsWith('/api/rooms'))return response({error:'Not found',code:'NOT_FOUND'},404);
  try{
   if(!env.DB)throw new RoomError('Multiplayer is not available. Please try again shortly.',503,'BACKEND_UNAVAILABLE');
   if(request.method!=='POST')return response({error:'Use POST',code:'METHOD_NOT_ALLOWED'},405);
   const origin=request.headers.get('Origin');if(origin&&origin!==url.origin)throw new RoomError('This request must come from the game.',403,'ORIGIN_MISMATCH');
   if(!request.headers.get('Content-Type')?.includes('application/json'))throw new RoomError('Expected JSON.');
   if(Number(request.headers.get('Content-Length'))>4096)throw new RoomError('Request too large.',413);
   const text=await request.text();if(text.length>4096)throw new RoomError('Request too large.',413);
   let body;try{body=JSON.parse(text);}catch{throw new RoomError('Invalid JSON.');}if(!body||Array.isArray(body)||typeof body!=='object')throw new RoomError('Invalid request.');
   if(body.hidden!==undefined&&typeof body.hidden!=='boolean')throw new RoomError('Invalid tab visibility.');
   if(Object.hasOwn(body,'role')||Object.hasOwn(body,'gameplayRole'))throw new RoomError('Roles are assigned by the server.');
   const time=now(),db=env.DB.withSession?.('first-primary')??env.DB;
   if(url.pathname==='/api/rooms'){
    for(let attempt=0;attempt<8;attempt++){
     const roomCode=code(),result=await db.batch([
      db.prepare('DELETE FROM ts_rooms WHERE expires_at<?').bind(time),
      db.prepare('INSERT OR IGNORE INTO ts_rooms(code,created_at,expires_at,anchor_state) VALUES(?,?,?,?)').bind(roomCode,time,time+ROOM_LIFETIME,JSON.stringify(DEFAULT_ROOM_STATE))
     ]);
     if(result[1].meta.changes===1)return response(await join(db,roomCode,body,time),201);
    }
    throw new RoomError('Unable to create a room. Try again.',503);
   }
   const match=url.pathname.match(/^\/api\/rooms\/([A-Z2-9]{6})\/(join|ready|start|rematch|interact|sync|character|respawn|transport|observe|call-911|city-event|leave)$/);
   if(!match||!ROOM_CODE_PATTERN.test(match[1]))throw new RoomError('Enter a valid six-character room code.');
   const [,roomCode,action]=match;if(action==='join')return response(await join(db,roomCode,body,time),201);
   if(!validToken(body.token))throw new RoomError('Your connection needs to rejoin.',401,'MEMBER_EXPIRED');
   const tokenHash=await hash(body.token);
   if(action==='leave'){
    await db.prepare('DELETE FROM ts_members WHERE room_code=? AND token_hash=?').bind(roomCode,tokenHash).run();return response({left:true});
   }
   const self=await db.prepare(`SELECT ${columns} FROM ts_members WHERE room_code=? AND token_hash=? AND ${alive}`).bind(roomCode,tokenHash,time-MEMBER_LEASE,time).first();
   if(!self)throw new RoomError('Your connection expired. Rejoining…',401,'MEMBER_EXPIRED');
   const room=await db.prepare('SELECT code,phase,match_id,started_at,anchor_state FROM ts_rooms WHERE code=? AND expires_at>?').bind(roomCode,time).first();
   if(!room)throw new RoomError('This room has expired.',410,'ROOM_EXPIRED');
   const roundAnchor=JSON.parse(room.anchor_state),durationMs=matchDuration(roundAnchor._round?.durationMs),matchEnded=!!roundAnchor._round?.result||matchTiming({matchPhase:room.phase,startedAt:room.started_at,durationMs},time).expired;
   if(matchEnded&&['respawn','transport','observe','call-911'].includes(action))throw new RoomError('The round has ended. Ask the host for a rematch.',409,'MATCH_ENDED');
   if(movementLocked(roundAnchor._round,self.player_id,time)&&['respawn','transport','observe','call-911'].includes(action))throw new RoomError(isPoliceCharacter(self.avatar)?'Write-up: movement is locked for 10 seconds after a wrongful arrest.':'Wait until the movement lock ends.',429,isPoliceCharacter(self.avatar)?'WRONGFUL_ARREST_PENALTY':'FALSE_REPORT_PENALTY');
   if(await recoverPlayAreaMember(db,roomCode,self,time,body.hidden))return response(await snapshot(db,roomCode,time,self.player_id));
   let poseCorrected=false;
   if(action==='start'){
    const before=await snapshot(db,roomCode,time,self.player_id);
    if(before.hostId!==self.player_id)throw new RoomError('Only the host can start the match.',403,'HOST_ONLY');
    if(before.matchPhase==='playing'||before.matchPhase==='ended')return response(before);
    if(body.durationMs!==undefined&&!validDuration(body.durationMs))throw new RoomError('Choose a whole number of minutes from 1 to 60.',400,'INVALID_DURATION');
    const matchId=crypto.randomUUID(),round=newRound(before.players,matchId,chooseRole),officers=round.policeIds,officerMarks=officers.map(()=>'?').join(','),count=before.players.length;round.durationMs=matchDuration(body.durationMs);round.spawns=createMatchSpawns(before.players,officers,chooseSpawn);
    const result=await db.batch([
     db.prepare(`UPDATE ts_rooms SET phase='playing',match_id=?,started_at=?,anchor_state=json_set(anchor_state,'$._round',json(?),'$.roundGeneration',COALESCE(json_extract(anchor_state,'$.roundGeneration'),0)+1) WHERE code=? AND host_id=? AND phase='waiting'
      AND (SELECT count(*) FROM ts_members WHERE room_code=? AND ${alive})=?
      AND (SELECT count(*) FROM ts_members WHERE room_code=? AND ready=1 AND ${alive})=?`).bind(matchId,time,JSON.stringify(round),roomCode,self.player_id,roomCode,time-MEMBER_LEASE,time,count,roomCode,time-MEMBER_LEASE,time,count),
     db.prepare(`UPDATE ts_members SET avatar=CASE WHEN player_id IN (${officerMarks}) THEN 'pedestrian' WHEN avatar='pedestrian' THEN 'explorer' ELSE avatar END,
      state=json_set(${spawnCase},'$._transport',json_object('access',CASE WHEN player_id IN (${officerMarks}) THEN 'police' ELSE 'pedestrian' END,'lastAt',0),'$._design',json_extract(state,'$._design'),'$._hairColor',json_extract(state,'$._hairColor')),
      state_revision=state_revision+1,sequence=sequence+1,pose_at=?,movement_credit=1.5 WHERE room_code=? AND EXISTS(SELECT 1 FROM ts_rooms WHERE code=? AND match_id=?)`).bind(...officers,...Array.from({length:ROOM_CAPACITY},(_,i)=>JSON.stringify(round.spawns[before.players.find(p=>p.slot===i)?.id]??spawnState(i))),...officers,time,roomCode,roomCode,matchId)
    ]);
    if(!result[0].meta.changes){const current=await snapshot(db,roomCode,time,self.player_id);if(current.matchPhase==='playing')return response(current);throw new RoomError('At least 4 connected, ready players are required.',409,'LOBBY_NOT_READY');}
   }else if(action==='rematch'){
    const before=await snapshot(db,roomCode,time,self.player_id);
    if(before.hostId!==self.player_id)throw new RoomError('Only the host can open the rematch lobby.',403,'HOST_ONLY');
    if(before.matchPhase==='waiting')return response(before);
    if(before.matchPhase!=='ended')throw new RoomError('Finish this round before starting a rematch.',409,'MATCH_PLAYING');
    const rematchId=crypto.randomUUID();await db.batch([
     db.prepare(`UPDATE ts_rooms SET phase='waiting',match_id=NULL,started_at=0,anchor_state=json_set(json_remove(anchor_state,'$._round'),'$.roundGeneration',COALESCE(json_extract(anchor_state,'$.roundGeneration'),0)+1,'$.rematchId',?)
      WHERE code=? AND host_id=? AND match_id=? AND (json_extract(anchor_state,'$._round.result') IS NOT NULL OR started_at<=?)`).bind(rematchId,roomCode,self.player_id,before.matchId,time-durationMs),
     db.prepare(`UPDATE ts_members SET state=json_set(${spawnCase},'$._transport',json_object('access',CASE WHEN avatar=? THEN 'police' ELSE 'pedestrian' END,'lastAt',0),'$._design',json_extract(state,'$._design'),'$._hairColor',json_extract(state,'$._hairColor')),state_revision=state_revision+1,sequence=sequence+1,pose_at=?,movement_credit=1.5
      WHERE room_code=? AND EXISTS(SELECT 1 FROM ts_rooms WHERE code=? AND phase='waiting' AND match_id IS NULL AND json_extract(anchor_state,'$.rematchId')=?)`).bind(...Array.from({length:ROOM_CAPACITY},(_,i)=>JSON.stringify(spawnState(i))),OFFICER_CHARACTER_ID,time,roomCode,roomCode,rematchId)
    ]);
   }else if(action==='city-event'){
    await cityEvent({db,code:roomCode,self,time,body});
   }else if(action==='interact'){
    await interactRound({db,code:roomCode,self,time,body});
   }else if(action==='ready'){
    await db.prepare('UPDATE ts_members SET ready=1,last_seen=?,presence_until=? WHERE room_code=? AND token_hash=?').bind(time,deadline(time,body.hidden),roomCode,tokenHash).run();
   }else if(action==='respawn'){
    if(room.phase!=='playing')throw new RoomError('The match has not started.',409,'MATCH_NOT_STARTED');
    if(body.matchId!==undefined&&body.matchId!==room.match_id)throw new RoomError('This reset belongs to an earlier round.',409,'ACTION_STALE');
    await db.prepare(`UPDATE ts_members SET state=json_set(?,'$._transport',json_extract(state,'$._transport'),'$._dispatch',json_extract(state,'$._dispatch'),'$._design',json_extract(state,'$._design'),'$._hairColor',json_extract(state,'$._hairColor')),state_revision=state_revision+1,sequence=sequence+1,pose_at=?,last_seen=?,presence_until=?,movement_credit=1.5 WHERE room_code=? AND token_hash=?
     AND EXISTS(SELECT 1 FROM ts_rooms WHERE code=? AND phase='playing' AND match_id=? AND started_at>? AND json_extract(anchor_state,'$._round.result') IS NULL AND ${permitsMovement})`).bind(JSON.stringify(roundSpawnState(roundAnchor._round,self)),time,time,deadline(time,body.hidden),roomCode,tokenHash,roomCode,room.match_id,time-durationMs,self.player_id,penaltyPath(self.player_id),time).run();
   }else if(action==='call-911'||action==='observe'){
    if(isPoliceCharacter(self.avatar))throw new RoomError('Officer Manson receives 911 calls in Dispatch.',403,'CALL_FORBIDDEN');
    if(room.phase!=='playing')throw new RoomError('Start the match before calling 911.',409,'MATCH_NOT_STARTED');
    if(body.matchId!==room.match_id)throw new RoomError('Reconnect to the current match before calling.',409,'CALL_STALE');
    if(roleFor(roundAnchor._round,self.player_id)==='THIEF')throw new RoomError('Only pedestrian witnesses can send 911 reports.',403,'CALL_FORBIDDEN');
    await recordWitnessReport({db,roomCode,self,room,time,presenceUntil:deadline(time,body.hidden),suspectId:body.suspectId,id:crypto.randomUUID(),observe:action==='observe',observationId:body.observationId,activity:body.activity});
   }else if(action==='transport'){
    const plan=planTransport({body,self,room,time});
    // Revision + sequence compare-and-set serializes door entry, duplicate
    // requests, respawns and older in-flight walking packets across isolates.
    const result=await db.prepare(`UPDATE ts_members SET state=json_set(?,'$._dispatch',json_extract(state,'$._dispatch'),'$._design',json_extract(state,'$._design'),'$._hairColor',json_extract(state,'$._hairColor')),state_revision=state_revision+1,sequence=?,pose_at=?,last_seen=?,presence_until=?,movement_credit=0
     WHERE room_code=? AND token_hash=? AND state_revision=? AND sequence=?
     AND EXISTS(SELECT 1 FROM ts_rooms WHERE code=? AND phase='playing' AND match_id=? AND started_at>? AND json_extract(anchor_state,'$._round.result') IS NULL AND ${permitsMovement})`).bind(plan.encoded,body.sequence,time,time,deadline(time,body.hidden),roomCode,tokenHash,self.state_revision,self.sequence,roomCode,room.match_id,time-durationMs,self.player_id,penaltyPath(self.player_id),time).run();
    if(!result.meta.changes)throw new TransportError('Your player has moved. Try entering the door again.',409,'TRANSPORT_STALE');
    return response({...await snapshot(db,roomCode,time,self.player_id),transport:{playerId:self.player_id,sourceId:plan.source.id,destinationId:plan.destination.id}});
   }else if(action==='character'){
    if(room.phase==='playing')throw new RoomError('Appearances are fixed during a match.',409,'MATCH_STARTED');
    if(body.hairColor!==undefined&&!validHairColor(body.hairColor))throw new RoomError('Choose a valid hair color.');
    const hairColor=body.hairColor??normalizeHairColor(JSON.parse(self.state)._hairColor);
    const appearanceId=normalizeAppearanceId(body.characterId);if(!AVATAR_IDS.includes(appearanceId))throw new RoomError('Choose a valid appearance.');
    const result=await db.batch([
     db.prepare(`DELETE FROM ts_members WHERE room_code=? AND ${expired}`).bind(roomCode,time-MEMBER_LEASE,time),
     db.prepare(`UPDATE ts_members SET avatar=?,state=json_set(state,'$._transport.access',?,'$._hairColor',?),last_seen=?,presence_until=? WHERE room_code=? AND token_hash=?
      AND EXISTS(SELECT 1 FROM ts_rooms WHERE code=ts_members.room_code AND phase<>'playing')`).bind(appearanceId,transportAccessForCharacter(appearanceId),hairColor,time,deadline(time,body.hidden),roomCode,tokenHash)
    ]);
    if(!result[1].meta.changes)throw new RoomError('That appearance is already being used.',409,'CHARACTER_TAKEN');
   }else{
    if(!Number.isSafeInteger(body.sequence)||body.sequence<0||body.sequence>2147483647)throw new RoomError('Invalid update sequence.');
    if(body.state!==undefined&&!validPlayerState(body.state))throw new RoomError('Invalid movement update.');
    let state=null,correction=false,credit=null;
    if(body.state&&room.phase==='playing'&&!matchEnded&&body.matchId===room.match_id&&body.revision===self.state_revision&&body.sequence>self.sequence){
     credit=movementLocked(roundAnchor._round,self.player_id,time)?null:movementCredit(JSON.parse(self.state),body.state,time-Math.max(self.pose_at,room.started_at),self.movement_credit);
     if(credit!==null){
      state=copyPlayerState(body.state);if(body.hidden)Object.assign(state,{speed:0,running:false,poseWeight:0,runBlend:0});
     }else correction=true;
    }
    const encoded=state?encodeMovement(state,self.state):null;
    const movementResult=await db.prepare(`UPDATE ts_members SET state=CASE WHEN sequence<? AND ? IS NOT NULL THEN json_set(?,'$._dispatch',json_extract(state,'$._dispatch'),'$._design',json_extract(state,'$._design'),'$._hairColor',json_extract(state,'$._hairColor')) ELSE state END,
     pose_at=CASE WHEN sequence<? AND ? IS NOT NULL THEN ? ELSE pose_at END,
     movement_credit=CASE WHEN sequence<? AND ? IS NOT NULL THEN ? ELSE movement_credit END,
     state_revision=state_revision+CASE WHEN sequence<? AND ? THEN 1 ELSE 0 END,
     presence_until=CASE WHEN sequence<=? THEN ? ELSE presence_until END,
     sequence=MAX(sequence,?),last_seen=MAX(last_seen,?) WHERE room_code=? AND token_hash=? AND state_revision=? AND ${alive}
     AND (?=0 OR EXISTS(SELECT 1 FROM ts_rooms WHERE code=? AND phase='playing' AND match_id=? AND started_at>? AND json_extract(anchor_state,'$._round.result') IS NULL))
     AND (? IS NULL OR EXISTS(SELECT 1 FROM ts_rooms WHERE code=? AND ${permitsMovement}))`).bind(body.sequence,encoded,encoded,body.sequence,encoded,time,body.sequence,encoded,credit,body.sequence,correction?1:0,body.sequence,deadline(time,body.hidden),body.sequence,time,roomCode,tokenHash,self.state_revision,time-MEMBER_LEASE,time,state||correction?1:0,roomCode,room.match_id,time-durationMs,encoded,roomCode,self.player_id,penaltyPath(self.player_id),time).run();
    poseCorrected=correction&&!!movementResult.meta.changes;
    if(!matchEnded&&room.phase==='playing'&&body.matchId===room.match_id&&body.revision===self.state_revision&&(roundAnchor._round?.actions?.[self.player_id]||body.interactionId))await pulseInteraction({db,code:roomCode,self,time,body});
   }
   return response({...await snapshot(db,roomCode,time,self.player_id),...(poseCorrected?{poseCorrection:{playerId:self.player_id}}:{})});
  }catch(error){
   if(error instanceof RoomError||error instanceof TransportError||error instanceof DispatchError||error instanceof RoundError)return response({error:error.message,code:error.code},error.status);
   console.error('Room service error',error?.name??'Error');return response({error:'Connection interrupted. Please try again.',code:'SERVICE_ERROR'},503);
  }
 };
}
