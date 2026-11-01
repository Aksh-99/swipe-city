import test from 'node:test';
import assert from 'node:assert/strict';
import {createRoomsHandler} from '../server/rooms.js';
import {createTestDatabase} from './d1-test-helper.js';
import {CALL_COOLDOWN,CALL_LIFETIME} from '../src/dispatch-rules.js';
import {findTransport} from '../src/transport-config.js';
import {appearanceDescription} from '../src/appearances.js';
import {SUSPECT_SELECTION_LIFETIME} from '../src/dispatch-rules.js';

async function fixture(){
 let time=100_000,roomCode;const store=createTestDatabase(),handler=createRoomsHandler({now:()=>time,chooseRole:length=>length===3?1:3});
 const post=async(path,body)=>{const r=await handler(new Request('https://times.test'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),{DB:store.db});return {status:r.status,...await r.json()};};
 const members=[];
 for(const characterId of ['explorer','tourist','pedestrian','commuter']){const result=await post(roomCode?`/api/rooms/${roomCode}/join`:'/api/rooms',{characterId,name:characterId,transportAccess:characterId==='pedestrian'?'pedestrian':'police'});assert.equal(result.status,201);roomCode=result.roomCode;members.push(result);}
 const action=(member,name,extra={})=>post(`/api/rooms/${roomCode}/${name}`,{token:member.sessionToken,hidden:true,...extra});
 const sync=member=>action(member,'sync',{sequence:++member.seq});for(const m of members)m.seq=0;
 return {store,post,action,sync,members,roomCode,get time(){return time;},advance:ms=>time+=ms,
  async start(){for(const m of members)await action(m,'ready');const start=await action(members[0],'start');assert.equal(start.status,200);for(const [i,m]of members.entries())store.sql.prepare("UPDATE ts_members SET state=json_set(state,'$.position',json(?)),pose_at=? WHERE player_id=?").run(JSON.stringify([i,0,.17]),time,m.yourId);return action(members[0],'sync',{sequence:++members[0].seq});},close:()=>store.close()};
}

test('four players: only human pedestrian witnesses can report; Manson receives their two private 911 locations',async()=>{
 const f=await fixture();try{
  const [a,b,officer,d]=f.members;assert.deepEqual(f.members.map(m=>m.transportAccess),['pedestrian','pedestrian','police','pedestrian']);
  assert.equal((await f.action(a,'call-911')).code,'MATCH_NOT_STARTED');const start=await f.start();
  assert.equal((await f.action(officer,'call-911',{matchId:start.matchId})).code,'CALL_FORBIDDEN');
  assert.equal((await f.action(a,'call-911',{matchId:'forged'})).code,'CALL_STALE');
  assert.equal((await f.action(b,'call-911',{matchId:start.matchId,suspectId:a.yourId})).code,'CALL_FORBIDDEN');
  assert.equal((await f.action(b,'observe',{matchId:start.matchId,suspectId:a.yourId})).code,'CALL_FORBIDDEN');
  for(const caller of [a,d]){
   const suspect=caller===d?b:d;
   const r=await f.action(caller,'call-911',{matchId:start.matchId,suspectId:suspect.yourId,playerId:officer.yourId,position:[999,999,999],description:'Player 3 is the thief',remainingMs:999,id:'forged',createdAt:999});
   assert.equal(r.status,200);assert.equal(r.yourCall.playerId,caller.yourId);assert.notEqual(r.yourCall.id,'forged');
   assert.deepEqual(r.yourCall.position,start.players.find(p=>p.id===suspect.yourId).state.position);assert.equal(r.yourCall.description,appearanceDescription(suspect.self.characterId));assert.equal(r.yourCall.remainingMs,600_000);assert.equal(r.dispatchCalls.length,0);assert(!('suspectId' in r.yourCall));
  }
  const dispatch=await f.sync(officer);assert.equal(dispatch.dispatchCalls.length,2);assert.equal(dispatch.yourCall,null);
  assert.equal(new Set(dispatch.dispatchCalls.map(c=>c.playerId)).size,2);assert.equal((await f.sync(b)).yourObservation,null);assert.equal((await f.sync(b)).yourCall,null);
  for(const member of dispatch.players){assert.equal('_dispatch' in member.state,false);assert.equal('_transport' in member.state,false);}
  const observer=await f.sync(a);assert.equal(observer.dispatchCalls.length,0);assert.equal(observer.yourCall.playerId,a.yourId);
  assert.equal((await f.post(`/api/rooms/${f.roomCode}/call-911`,{token:'0'.repeat(64),matchId:start.matchId})).code,'MEMBER_EXPIRED');
 }finally{f.close();}
});

test('R records an owned observation; reports preserve the observation and track the suspect GPS during the 20-second alert, without revealing secret fields',async()=>{
 const f=await fixture();try{
  const [caller,other,officer,suspect]=f.members,start=await f.start();
  f.store.sql.prepare("UPDATE ts_members SET state=json_set(state,'$._secretRole','innocent','$.role','thief') WHERE player_id=?").run(suspect.yourId);
  for(const m of f.members)await f.action(m,'sync',{sequence:++m.seq,hidden:true});f.advance(88_000);
  const selected=await f.action(caller,'observe',{matchId:start.matchId,suspectId:suspect.yourId,description:'THIEF',position:[999,999,999]});
  assert.equal(selected.status,200);const observation=selected.yourObservation;assert(observation);assert.equal(observation.description,appearanceDescription(suspect.self.characterId));
  assert.equal((await f.sync(officer)).yourObservation,null,'pending observations are private to their reporter');
  assert.equal((await f.action(suspect,'call-911',{matchId:start.matchId,observationId:observation.id})).code,'OBSERVATION_EXPIRED');
  f.advance(500);f.store.sql.prepare("UPDATE ts_members SET state=json_set(state,'$.position',json(?)),pose_at=? WHERE player_id=?").run(JSON.stringify([30,20,.17]),f.time,suspect.yourId);
  const result=await f.action(caller,'call-911',{matchId:start.matchId,observationId:observation.id,suspectId:officer.yourId,description:'THIEF',remainingMs:999_999,position:[999,999,999]});
  assert.equal(result.status,200);assert.deepEqual(result.yourCall.position,observation.position);assert.equal(result.yourCall.lastSeenAt,observation.createdAt);assert.equal(result.yourCall.remainingMs,511_500);
  const dispatch=await f.sync(officer),report=dispatch.dispatchCalls[0];assert.equal(report.description,appearanceDescription(suspect.self.characterId));assert.deepEqual(report.position,[30,20,.17]);assert.equal(report.number,1);
  for(const privateField of ['suspectId','characterId','role','gameplayRole','isThief','correct','_secretRole'])assert.equal(privateField in report,false,privateField);
  assert(!JSON.stringify(dispatch).includes('thief'));assert(!JSON.stringify(dispatch.players).includes('_dispatch'));
  assert.equal((await f.sync(other)).dispatchCalls.length,0);
  const resumed=await f.action(officer,'join');assert.deepEqual(resumed.dispatchCalls[0].position,[30,20,.17]);
 }finally{f.close();}
});

test('missing/self/foreign/distant/disconnected selections are rejected, observation tickets expire, and future timestamps cannot extend them',async()=>{
 const f=await fixture();try{
  const [caller,,officer,suspect]=f.members,start=await f.start(),payload={matchId:start.matchId};
  assert.equal((await f.action(caller,'observe',payload)).code,'SUSPECT_REQUIRED');
  assert.equal((await f.action(caller,'observe',{...payload,suspectId:caller.yourId})).code,'SUSPECT_SELF');
  assert.equal((await f.action(caller,'observe',{...payload,suspectId:'00000000-0000-0000-0000-000000000000'})).code,'SUSPECT_UNAVAILABLE');
  assert.equal((await f.action(officer,'observe',{...payload,suspectId:caller.yourId})).code,'CALL_FORBIDDEN');
  const selected=await f.action(caller,'observe',{...payload,suspectId:suspect.yourId,createdAt:1_000_000});assert.equal(selected.yourObservation.createdAt,f.time);
  f.advance(SUSPECT_SELECTION_LIFETIME);assert.equal((await f.sync(caller)).yourObservation,null);
  assert.equal((await f.action(caller,'call-911',{...payload,observationId:selected.yourObservation.id,createdAt:f.time})).code,'OBSERVATION_EXPIRED');
  f.store.sql.prepare("UPDATE ts_members SET state=json_set(state,'$.position',json(?)) WHERE player_id=?").run(JSON.stringify([30,20,.17]),suspect.yourId);
  assert.equal((await f.action(caller,'observe',{...payload,suspectId:suspect.yourId})).code,'SUSPECT_TOO_FAR');
  await f.action(suspect,'leave');assert.equal((await f.action(caller,'observe',{...payload,suspectId:suspect.yourId})).code,'SUSPECT_UNAVAILABLE');
 }finally{f.close();}
});

test('an observation captures the target pose at its atomic write rather than an earlier read',async()=>{
 const f=await fixture();try{
  const [caller,,,suspect]=f.members,start=await f.start(),prepare=f.store.db.prepare;
  f.store.db.prepare=function(sql){
   if(sql.startsWith('WITH suspect AS'))f.store.sql.prepare("UPDATE ts_members SET state=json_set(state,'$.position',json(?)) WHERE player_id=?").run('[3,3,0.17]',suspect.yourId);
   return prepare.call(this,sql);
  };
  const selected=await f.action(caller,'observe',{matchId:start.matchId,suspectId:suspect.yourId});assert.equal(selected.status,200);assert.deepEqual(selected.yourObservation.position,[3,3,.17]);
 }finally{f.close();}
});

test('calls are atomic, bounded, preserved by movement/respawn/transport, expire, and clear when callers leave',async()=>{
 const f=await fixture();try{
  const [caller,,officer,suspect]=f.members,start=await f.start(),payload={matchId:start.matchId,suspectId:suspect.yourId};
  const attempts=await Promise.all([f.action(caller,'call-911',payload),f.action(caller,'call-911',payload)]);
  assert.equal(attempts.filter(r=>r.status===200).length,1);assert.equal(attempts.filter(r=>r.code==='CALL_COOLDOWN').length,1);
  let dispatch=await f.sync(officer),call=dispatch.dispatchCalls[0];const reportPosition=[...call.position];
  f.advance(1000);let self=(await f.sync(caller)).players.find(p=>p.id===caller.yourId);
  const moved=await f.action(caller,'sync',{sequence:++caller.seq,revision:self.revision,matchId:start.matchId,state:{...self.state,position:[self.state.position[0]+1,...self.state.position.slice(1)],_dispatch:{call:{id:'forged'}},_transport:{access:'police'}}});
  assert.equal(moved.status,200);assert.deepEqual(moved.yourCall.position,reportPosition);assert.equal(moved.yourCall.id,call.id);assert.equal(moved.transportAccess,'pedestrian');
  const reset=await f.action(caller,'respawn');assert.equal(reset.yourCall.id,call.id);assert.deepEqual(reset.yourCall.position,reportPosition);
  f.store.sql.prepare("UPDATE ts_members SET state=json_set(state,'$.position',json(?)),pose_at=? WHERE player_id=?").run('[0,0,0.17]',f.time,caller.yourId);f.advance(CALL_COOLDOWN);const replacement=await f.action(caller,'call-911',payload);assert.equal(replacement.status,200);assert.notEqual(replacement.yourCall.id,call.id);call=replacement.yourCall;
  dispatch=await f.sync(officer);assert.equal(dispatch.dispatchCalls.length,1);
  // Seed a legal doorway only inside the test database, preserving metadata.
  const bus=findTransport('bus:mta-44');f.store.sql.prepare("UPDATE ts_members SET state=json_set(state,'$.position',json(?)),pose_at=? WHERE player_id=?").run(JSON.stringify(bus.doors[0].approach),f.time,caller.yourId);
  self=(await f.sync(caller)).players.find(p=>p.id===caller.yourId);caller.seq=self.sequence;
  const travel=await f.action(caller,'transport',{portalId:bus.id,matchId:start.matchId,revision:self.revision,sequence:++caller.seq,state:self.state});
  assert.equal(travel.status,200);assert.equal(travel.yourCall.id,call.id);assert.deepEqual(travel.yourCall.position,call.position);
  const resume=await f.action(officer,'join',{transportAccess:'pedestrian'});assert.equal(resume.transportAccess,'police');assert.equal(resume.dispatchCalls[0].id,call.id);
  for(const m of f.members){const row=f.store.sql.prepare('SELECT sequence FROM ts_members WHERE player_id=?').get(m.yourId);await f.action(m,'sync',{sequence:row.sequence+1,hidden:true});}f.advance(CALL_LIFETIME);
  assert.equal((await f.sync(officer)).dispatchCalls.length,0);
 }finally{f.close();}
});

test('a civilian cannot upgrade to police through selection fields or legacy private metadata; disconnect removes alerts cleanly',async()=>{
 const f=await fixture();try{
  const [caller,,officer,suspect]=f.members,start=await f.start();
  const report=await f.action(caller,'call-911',{matchId:start.matchId,suspectId:suspect.yourId});assert.equal(report.status,200);
  f.store.sql.prepare("UPDATE ts_members SET state=json_set(state,'$._transport.access','police') WHERE player_id=?").run(caller.yourId);
  assert.equal((await f.sync(caller)).transportAccess,'pedestrian');
  const car=findTransport('police:7th-avenue');f.store.sql.prepare("UPDATE ts_members SET state=json_set(state,'$.position',json(?)),pose_at=? WHERE player_id=?").run(JSON.stringify(car.doors[0].approach),f.time,caller.yourId);
  const view=await f.sync(caller),self=view.players.find(p=>p.id===caller.yourId);caller.seq=self.sequence;
  const denied=await f.action(caller,'transport',{portalId:car.id,transportAccess:'police',matchId:start.matchId,revision:self.revision,sequence:++caller.seq,state:self.state});assert.equal(denied.code,'TRANSPORT_FORBIDDEN');
  assert.equal((await f.sync(officer)).dispatchCalls.length,1);
  await f.action(caller,'leave');assert.equal((await f.sync(officer)).dispatchCalls.length,0);assert.equal((await f.sync(officer)).players.length,3);
 }finally{f.close();}
});
