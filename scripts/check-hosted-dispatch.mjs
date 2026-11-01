// Four production HTTP clients. Browser/WebGL rendering is a separate playtest.
// Pass the private Sites credential through the environment, never arguments.
import assert from 'node:assert/strict';
import {RoomClient} from '../src/room-client.js';
import {DEFAULT_ROOM_STATE} from '../src/room-protocol.js';
import {isPoliceCharacter,appearanceDescription} from '../src/appearances.js';
import {MATCH_DURATION_MS,matchTiming,formatMatchTime} from '../src/match-time.js';
const origin='https://times-square-walk.agopakum1.chatgpt.site';
const authorization=process.env.SITES_SERVICE_AUTHORIZATION;if(!authorization)throw new Error('Missing Site service authorization.');
const fetcher=(path,init)=>fetch(origin+path,{...init,headers:{...init.headers,Origin:origin,'OAI-Sites-Authorization':authorization},redirect:'manual'});
const timer=(fn,ms)=>ms===8000?setTimeout(fn,20000):0;
const contexts=['explorer','tourist','pedestrian','commuter'].map(characterId=>{
 const values=new Map();return {characterId,state:{...DEFAULT_ROOM_STATE,position:[...DEFAULT_ROOM_STATE.position]},storage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)}};
});
// This probe polls explicitly. Use the background lease so a slow hosted join
// cannot expire the other clients while their automatic heartbeats are disabled.
const make=c=>new RoomClient({fetcher,storage:c.storage,isHidden:()=>true,getState:()=>c.state,onSpawn:self=>c.state={...self.state,position:[...self.state.position]},setTimer:timer,clearTimer:clearTimeout});
const clients=contexts.map(make);
try{
 console.log('Connecting four clients and checking automatic vehicle permissions.');
 await clients[0].create('Dispatch probe 1',contexts[0].characterId,'police');const room=clients[0].view().roomCode;
 await Promise.all(clients.slice(1).map((c,i)=>c.join(room,`Dispatch probe ${i+2}`,contexts[i+1].characterId,i===1?'pedestrian':'police')));
 await clients[0].refresh();assert(clients[0].view().canStart,`Lobby: ${clients[0].view().phase}, ${clients[0].view().players.length}/4, host=${clients[0].view().isHost}, ready=${clients[0].view().players.filter(p=>p.ready).length}`);await clients[0].startMatch();await Promise.all(clients.map(c=>c.refresh()));
 const startedAt=clients[0].view().startedAt,endsAt=startedAt+MATCH_DURATION_MS;
 assert.equal(MATCH_DURATION_MS,600_000);
 for(const c of clients){assert.equal(c.view().startedAt,startedAt);assert.equal(c.snapshot.endsAt,endsAt);assert.equal(c.view().endsAt,endsAt);assert.equal(c.view().matchPhase,'playing');}
 console.log('All four hosted clients share the same 10-minute deadline.');
 assert.equal(new Set(clients.map(c=>c.view().yourId)).size,4);assert.equal(clients.filter(c=>c.view().transportAccess==='police').length,1);
 const officerIndex=clients.findIndex(c=>isPoliceCharacter(c.session.characterId)),officer=()=>clients[officerIndex],civilianIndices=clients.map((c,i)=>i).filter(i=>i!==officerIndex),witnessIndices=civilianIndices.filter(i=>clients[i].view().yourRound.role==='PEDESTRIAN');
 for(const [i,c] of clients.entries())assert.equal(c.view().transportAccess,i===officerIndex?'police':'pedestrian');
 await assert.rejects(()=>officer().transport('bus:mta-44'),error=>error.code==='TRANSPORT_FORBIDDEN');
 for(const i of civilianIndices)await assert.rejects(()=>clients[i].transport('police:7th-avenue'),error=>error.code==='TRANSPORT_FORBIDDEN');
 for(const i of civilianIndices)contexts[i].state={...contexts[i].state,position:[contexts[i].state.position[0]+.5,contexts[i].state.position[1]+.5,contexts[i].state.position[2]]};
 await Promise.all(clients.map(c=>c.refresh()));
 console.log('Recording two pedestrian witness selections, then moving the observed people.');
 const executive=clients.findIndex(c=>c.session.characterId==='commuter'),suspects=witnessIndices.map(i=>i===executive?civilianIndices.find(j=>j!==i):executive);
 const sightings=await Promise.all(witnessIndices.map((i,j)=>clients[i].observeSuspect(clients[suspects[j]].view().yourId)));
 for(const i of civilianIndices)contexts[i].state={...contexts[i].state,position:[contexts[i].state.position[0]+.5,contexts[i].state.position[1]+.5,contexts[i].state.position[2]]};
 await Promise.all(clients.map(c=>c.refresh()));
 console.log('Sending two 911 reports and checking private descriptions and fixed last-seen locations.');
 const reports=await Promise.all(witnessIndices.map((i,j)=>clients[i].call911(clients[suspects[j]].view().yourId)));await officer().refresh();
 const alerts=officer().view().dispatchCalls;assert.equal(alerts.length,2);
 for(const [j,i] of witnessIndices.entries()){
  assert.equal(clients[i].view().dispatchCalls.length,0);const report=reports[j].yourCall;assert(report);
  assert.equal(report.playerId,clients[i].view().yourId);const target=suspects[j],observation=sightings[j].yourObservation;
  assert.deepEqual(report.position,observation.position);assert.notDeepEqual(report.position,contexts[target].state.position);assert.equal(report.lastSeenAt,observation.createdAt);assert.equal(report.description,appearanceDescription(clients[target].session.characterId));
  for(const field of ['suspectId','characterId','role','gameplayRole','isThief','correct'])assert(!(field in report),field);
  assert(report.remainingMs<=MATCH_DURATION_MS&&report.remainingMs>0);assert.match(report.location,/Times Square · near W 4[2-9]/);
  assert(alerts.some(call=>call.id===report.id&&call.playerId===report.playerId));
 }
 await assert.rejects(()=>officer().call911(),error=>error.code==='CALL_FORBIDDEN');
 const caller=witnessIndices[0],pinned=reports[0].yourCall;await clients[caller].resetSpawn();await officer().refresh();
 assert.deepEqual(officer().view().dispatchCalls.find(call=>call.id===pinned.id).position,pinned.position);
 console.log('Checking officer reload and caller disconnect.');
 officer().stop();clients[officerIndex]=make(contexts[officerIndex]);assert(await officer().restore());assert.equal(officer().view().transportAccess,'police');assert.equal(officer().view().dispatchCalls.length,2);
 assert.equal(officer().view().startedAt,startedAt);assert.equal(officer().view().endsAt,endsAt);assert.notEqual(formatMatchTime(matchTiming(officer().view(),officer().serverNow()).remainingMs),'0:00');
 const departed=clients[caller].view().yourId;await clients[caller].leave();await officer().refresh();assert.equal(officer().view().players.length,3);assert.equal(officer().view().dispatchCalls.length,1);assert(!officer().view().dispatchCalls.some(call=>call.playerId===departed));
 console.log('PASS: four hosted clients, witness selection, appearance descriptions, last-seen points fixed before movement, private reports without suspect IDs/roles, shared 10-minute timer, Manson-only cars, reload and disconnect.');
}finally{await Promise.allSettled(clients.map(c=>c.leave()));clients.forEach(c=>c.stop());}
