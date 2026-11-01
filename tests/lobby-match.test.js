import test from 'node:test';import assert from 'node:assert/strict';
import {createRoomsHandler} from '../server/rooms.js';
import {spawnState,RANDOM_SPAWN_POINTS} from '../server/match-rules.js';
import {DEFAULT_ROOM_STATE,MEMBER_LEASE} from '../src/room-protocol.js';
import {RoomClient} from '../src/room-client.js';
import {createTestDatabase} from './d1-test-helper.js';

function fixture(){
 let time=100_000;const store=createTestDatabase(),handler=createRoomsHandler({now:()=>time,chooseRole:()=>0});
 const post=async(path,body={})=>{const response=await handler(new Request('https://times.test'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),{DB:store.db});return {status:response.status,...await response.json()};};
 const members=[];let room;
 return {store,post,members,advance:ms=>time+=ms,get room(){return room;},async join(){const member=await post(room?`/api/rooms/${room}/join`:'/api/rooms',{characterId:'tourist',slot:3,playerId:'chosen-by-client',state:{...DEFAULT_ROOM_STATE,position:[300,0,0]}});assert.equal(member.status,201);members.push(member);room=member.roomCode;return member;},async start(){for(const m of members)await post(`/api/rooms/${room}/ready`,{token:m.sessionToken});return post(`/api/rooms/${room}/start`,{token:members[0].sessionToken});},close:()=>store.close()};
}
test('lobby has fixed server IDs/slots/spawns; only a host with four ready members can start',async()=>{
 const f=fixture();try{
  const host=await f.join();assert.equal(host.matchPhase,'waiting');assert.equal(host.hostId,host.yourId);assert.equal(host.self.number,1);assert.notEqual(host.yourId,'chosen-by-client');assert.deepEqual(host.self.state,spawnState(0));
  assert.equal((await f.start()).code,'LOBBY_NOT_READY');
  const second=await f.join();assert.equal((await f.post(`/api/rooms/${f.room}/start`,{token:second.sessionToken})).code,'HOST_ONLY');
  await f.join();await f.join();assert.equal((await f.post(`/api/rooms/${f.room}/start`,{token:host.sessionToken})).code,'LOBBY_NOT_READY');
  const started=await f.start();assert.equal(started.status,200);assert.equal(started.matchPhase,'playing');assert(started.matchId);assert.equal(started.players.length,4);
  started.players.forEach((p,i)=>{assert.equal(p.number,i+1);assert.equal(p.revision,1);assert(p.state.position.every(Number.isFinite));assert.notDeepEqual(p.state.position,spawnState(i).position);});
  assert.equal((await f.post(`/api/rooms/${f.room}/join`,{})).code,'MATCH_IN_PROGRESS');
  const repeated=await f.post(`/api/rooms/${f.room}/start`,{token:host.sessionToken});assert.equal(repeated.matchId,started.matchId);assert.deepEqual(repeated.players.map(p=>p.revision),[1,1,1,1]);
 }finally{f.close();}
});
test('waiting, wrong-match and old-spawn packets cannot move a player; fast teleports trigger owner-only correction',async()=>{
 const f=fixture();try{
  const host=await f.join(),path=`/api/rooms/${f.room}/sync`;
  await f.post(path,{token:host.sessionToken,sequence:10,state:{...DEFAULT_ROOM_STATE,position:[100,0,0]}});
  for(let i=0;i<3;i++)await f.join();const started=await f.start(),self=started.players[0];
  const origin=self.state.position,near=origin.map((v,i)=>i<2?v*.995:v);
  const other=started.players[1],state={...self.state,position:[100,0,.17]};
  const stale=await f.post(path,{token:host.sessionToken,sequence:12,matchId:'another-match',revision:1,state});assert.deepEqual(stale.players[0].state,self.state);
  const rejected=await f.post(path,{token:host.sessionToken,sequence:13,matchId:started.matchId,revision:1,state,playerId:other.id});
  assert.deepEqual(rejected.players[0].state,self.state);assert.equal(rejected.players[0].revision,2);assert.deepEqual(rejected.players[1],other);
  const late=await f.post(path,{token:host.sessionToken,sequence:14,matchId:started.matchId,revision:1,state:{...self.state,position:near}});assert.deepEqual(late.players[0].state,self.state);
  f.advance(1000);const valid=await f.post(path,{token:host.sessionToken,sequence:15,matchId:started.matchId,revision:2,state:{...self.state,position:near,heading:.2,speed:3.2,poseWeight:1},camera:{yaw:99}});
  assert.deepEqual(valid.players[0].state.position,near);assert(!JSON.stringify(valid.players).includes('camera'));assert.deepEqual(valid.players[1].state,other.state);
 }finally{f.close();}
});
test('duplicate authenticated joins resume one member; host promotion, expiry, replacement and respawn are safe',async()=>{
 const f=fixture();try{
  const host=await f.join();for(let i=0;i<3;i++)await f.join();await f.start();
  const repeated=await f.post(`/api/rooms/${f.room}/join`,{token:host.sessionToken});assert.equal(repeated.yourId,host.yourId);assert.equal(repeated.players.length,4);
  await f.post(`/api/rooms/${f.room}/leave`,{token:host.sessionToken});
  const second=f.members[1],snapshot=await f.post(`/api/rooms/${f.room}/sync`,{token:second.sessionToken,sequence:2});assert.equal(snapshot.players.length,3);assert.equal(snapshot.hostId,second.yourId);assert.equal(snapshot.matchPhase,'ended');assert.equal(snapshot.roundResult.reason,'disconnected');
  await f.post(`/api/rooms/${f.room}/rematch`,{token:second.sessionToken});
  const replacement=await f.post(`/api/rooms/${f.room}/join`,{});assert.equal(replacement.players.length,4);assert.equal(replacement.self.number,1);assert.deepEqual(replacement.self.state,spawnState(0));
  await f.post(`/api/rooms/${f.room}/rematch`,{token:second.sessionToken});await f.post(`/api/rooms/${f.room}/ready`,{token:replacement.sessionToken});const next=await f.post(`/api/rooms/${f.room}/start`,{token:second.sessionToken});
  const reset=await f.post(`/api/rooms/${f.room}/respawn`,{token:second.sessionToken,state:{position:[99,99,99]}});const self=reset.players.find(p=>p.id===second.yourId);assert.deepEqual(self.state,next.players.find(p=>p.id===second.yourId).state);assert.equal(self.revision,4);
  f.advance(MEMBER_LEASE+1);const fresh=await f.post(`/api/rooms/${f.room}/join`,{});assert.equal(fresh.players.length,1);assert.equal(fresh.hostId,fresh.yourId);assert.equal(fresh.matchPhase,'waiting');
 }finally{f.close();}
});
test('repeated bursts cannot reuse a per-packet speed allowance',async()=>{
 const f=fixture();try{
  const host=await f.join();for(let i=0;i<3;i++)await f.join();const started=await f.start(),path=`/api/rooms/${f.room}/sync`;
  const base=started.players[0].state,p=base.position,length=Math.hypot(p[0],p[1]),move=d=>[p[0]-p[0]/length*d,p[1]-p[1]/length*d,p[2]];
  f.advance(100);const first=await f.post(path,{token:host.sessionToken,sequence:2,matchId:started.matchId,revision:1,state:{...base,position:move(2)}});assert.deepEqual(first.players[0].state.position,move(2));
  f.advance(100);const second=await f.post(path,{token:host.sessionToken,sequence:3,matchId:started.matchId,revision:1,state:{...base,position:move(4)}});assert.deepEqual(second.players[0].state.position,move(2));assert.equal(second.players[0].revision,2);
 }finally{f.close();}
});
test('client waits for its spawn preparation, preserves local ownership and ignores stale lobby snapshots',async()=>{
 const f=fixture(),clients=[],spawned=[];let release;
 try{
  for(let i=0;i<4;i++)clients.push(new RoomClient({fetcher:async(path,init)=>{const result=await f.post(path,JSON.parse(init.body));const {status,...body}=result;return Response.json(body,{status});},getState:()=>DEFAULT_ROOM_STATE,setTimer:()=>0,clearTimer:()=>{},onSpawn:async(self)=>{spawned.push(self);if(i===0)await new Promise(resolve=>release=resolve);}}));
  await clients[0].create('Host','explorer');const room=clients[0].view().roomCode;
  for(let i=1;i<4;i++)await clients[i].join(room,'Guest '+i,'explorer');await clients[0].tick();
  assert(clients.every(c=>!c.view().canMove));assert(clients[0].view().canStart);
  const waiting=clients[0].snapshot,pending=clients[0].startMatch();while(!release)await new Promise(resolve=>setImmediate(resolve));
  assert.equal(clients[0].view().preparing,true);assert.equal(clients[0].view().canMove,false);assert.equal(clients[0].movement(),null);
  release();await pending;await Promise.all(clients.slice(1).map(c=>c.tick()));assert(clients.every(c=>c.view().canMove));assert.equal(spawned.length,4);
  await clients[0].apply({...waiting,serverTime:clients[0].snapshot.serverTime});assert.equal(clients[0].view().matchPhase,'playing');
  const id=clients[1].view().yourId;await clients[1].join(room,'Again','tourist');assert.equal(clients[1].view().yourId,id);
 }finally{clients.forEach(c=>c.stop());f.close();}
});
test('host chooses a persistent custom deadline; invalid/nonhost settings fail and a long round stays movable beyond ten minutes',async()=>{
 const f=fixture();try{
  for(let i=0;i<4;i++)await f.join();for(const m of f.members)await f.post(`/api/rooms/${f.room}/ready`,{token:m.sessionToken,hidden:true});
  const start=(i,durationMs)=>f.post(`/api/rooms/${f.room}/start`,{token:f.members[i].sessionToken,durationMs});
  assert.equal((await start(1,120000)).code,'HOST_ONLY');
  for(const value of [0,60001,3660000,'120000'])assert.equal((await start(0,value)).code,'INVALID_DURATION');
  const a=await start(0,1200000);assert.equal(a.durationMs,1200000);assert.equal(a.endsAt,a.startedAt+1200000);
  for(let n=0;n<4;n++){f.advance(180000);for(const m of f.members)await f.post(`/api/rooms/${f.room}/sync`,{token:m.sessionToken,sequence:n+2,hidden:true});}
  const same=await start(0,60000);assert.equal(same.matchId,a.matchId);assert.equal(same.endsAt,a.endsAt);assert.equal(same.matchPhase,'playing');
  const reset=await f.post(`/api/rooms/${f.room}/respawn`,{token:f.members[0].sessionToken,matchId:a.matchId,hidden:true});assert.equal(reset.status,200);assert(reset.players[0].revision>1);
  f.advance(480000);const ended=await f.post(`/api/rooms/${f.room}/sync`,{token:f.members[0].sessionToken,sequence:99,hidden:true});assert.equal(ended.matchPhase,'ended');assert.equal(ended.roundResult.endedAt,a.endsAt);
 }finally{f.close();}
});
