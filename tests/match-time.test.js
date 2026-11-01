import test from 'node:test';
import assert from 'node:assert/strict';
import {MATCH_DURATION_MS,matchTiming,formatMatchTime} from '../src/match-time.js';
import {RoomClient} from '../src/room-client.js';
import {createRoomsHandler} from '../server/rooms.js';
import {createTestDatabase} from './d1-test-helper.js';
import {tabStorage} from './tab-test-helper.js';

test('ten-minute countdown waits for host start, rounds seconds up and stops exactly at the server deadline',()=>{
 assert.equal(MATCH_DURATION_MS,600_000);
 assert.equal(formatMatchTime(matchTiming({matchPhase:'waiting',startedAt:null},999_999).remainingMs),'10:00');
 const match={matchPhase:'playing',startedAt:0};
 assert.equal(formatMatchTime(matchTiming(match,0).remainingMs),'10:00');
 assert.equal(formatMatchTime(matchTiming(match,1).remainingMs),'10:00');
 assert.equal(formatMatchTime(matchTiming(match,1000).remainingMs),'9:59');
 assert.equal(formatMatchTime(matchTiming(match,599_999).remainingMs),'0:01');
 assert.equal(matchTiming(match,600_000).matchPhase,'ended');
 assert.equal(formatMatchTime(matchTiming(match,900_000).remainingMs),'0:00');
 assert.equal(matchTiming({...match,matchPhase:'ended'},1000).remainingMs,0,'an ended snapshot never resumes due to clock correction');
});

test('four clients share one start/deadline despite different clocks; reload and expiry cannot restart or extend the match',async()=>{
 let time=100_000;const store=createTestDatabase(),handler=createRoomsHandler({now:()=>time}),clients=[];
 const fetcher=(path,init)=>handler(new Request('https://times.test'+path,init),{DB:store.db});
 const make=(i,storage=tabStorage())=>{
  const c=new RoomClient({fetcher,storage,clock:()=>time+i*3_600_000,isHidden:()=>true,setTimer:()=>0,clearTimer:()=>{}});
  clients.push(c);return c;
 };
 try{
  const four=Array.from({length:4},(_,i)=>make(i));
  await four[0].create('Host','tourist');const room=four[0].view().roomCode;
  for(let i=1;i<4;i++)await four[i].join(room,'Player '+(i+1),'explorer');
  await four[0].startMatch();await Promise.all(four.slice(1).map(c=>c.refresh()));
  const matchId=four[0].snapshot.matchId,startedAt=time,endsAt=time+MATCH_DURATION_MS;
  for(const c of four){assert.equal(c.view().startedAt,startedAt);assert.equal(c.view().endsAt,endsAt);assert.equal(c.serverNow(),time);assert(c.view().canMove);}
  time+=180_000;await Promise.all(four.map(c=>c.refresh()));
  four[2].stop();const resumed=make(7,four[2].storage);assert(await resumed.restore());four[2]=resumed;
  assert.equal(resumed.view().yourId,clients[2].view().yourId);assert.equal(resumed.snapshot.matchId,matchId);
  assert.equal(formatMatchTime(matchTiming(resumed.view(),resumed.serverNow()).remainingMs),'7:00');
  await four[0].startMatch();assert.equal(four[0].view().endsAt,endsAt,'repeated START cannot buy more time');
  const before=four.map(c=>c.snapshot.players.find(p=>p.id===c.view().yourId).state.position);
  time=endsAt-1;assert(four.every(c=>c.view().canMove));
  time=endsAt;assert(four.every(c=>!c.view().canMove),'the corrected local clock gates input even before the next snapshot');
  await Promise.all(four.map(c=>c.refresh()));
  for(let i=0;i<4;i++){
   const c=four[i];assert.equal(c.phase,'connected');assert.equal(c.view().matchPhase,'ended');assert.equal(c.view().players.length,4);
   assert.equal(formatMatchTime(matchTiming(c.view(),c.serverNow()).remainingMs),'0:00');
   const response=await fetcher(`/api/rooms/${room}/sync`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:c.session.token,sequence:++c.sequence,matchId,revision:c.session.revision,hidden:true,startedAt:time,endsAt:time+600_000,state:{...c.snapshot.players.find(p=>p.id===c.view().yourId).state,position:[before[i][0]+1,before[i][1],before[i][2]],speed:3.2,poseWeight:1}})});
   const snapshot=await response.json(),self=snapshot.players.find(p=>p.id===c.view().yourId);
   assert.equal(response.status,200);assert.equal(snapshot.matchPhase,'ended');assert.equal(snapshot.endsAt,endsAt);assert.deepEqual(self.state.position,before[i]);assert.equal(self.state.speed,0);
  }
  await assert.rejects(()=>four[0].resetSpawn(),error=>error.code==='MATCH_ENDED');
  for(const action of ['transport','call-911']){
   const response=await fetcher(`/api/rooms/${room}/${action}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:four[0].session.token,matchId})});
   assert.equal((await response.json()).code,'MATCH_ENDED');
  }
  assert.equal((await four[0].startMatch()).matchPhase,'ended');
  resumed.stop();const endedReload=make(9,resumed.storage);assert(await endedReload.restore());assert.equal(endedReload.view().matchPhase,'ended');assert(!endedReload.view().canMove);
  await endedReload.apply({...endedReload.snapshot,matchPhase:'playing'});assert.equal(endedReload.snapshot.matchPhase,'ended','a late playing response cannot roll back an ended match');
 }finally{clients.forEach(c=>c.stop());store.close();}
});
