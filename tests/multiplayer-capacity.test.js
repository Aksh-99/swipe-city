import test from 'node:test';import assert from 'node:assert/strict';
import {createLocalServer} from '../server/local.mjs';import {RoomClient} from '../src/room-client.js';
import {DEFAULT_ROOM_STATE,copyPlayerState} from '../src/room-protocol.js';import {tabStorage} from './tab-test-helper.js';

test('20 real HTTP clients sustain movement, temporary outages, reload and host departure without losing the room',async t=>{
 let time=100000,requests=0,serverErrors=0;const latency=[],offline=new Set(),states=Array.from({length:20},()=>copyPlayerState(DEFAULT_ROOM_STATE)),storages=Array.from({length:20},()=>tabStorage()),clients=[];
 const app=await createLocalServer({host:'127.0.0.1',port:0,databasePath:':memory:',now:()=>time}),origin=`http://127.0.0.1:${app.port}`;
 const make=i=>new RoomClient({fetcher:async(path,init)=>{if(offline.has(i))throw Error('simulated connection loss');requests++;const start=performance.now(),response=await fetch(origin+path,{...init,headers:{...init.headers,Origin:origin}});latency.push(performance.now()-start);if(response.status>=500)serverErrors++;return response;},clock:()=>time,storage:storages[i],getState:()=>states[i],setTimer:()=>0,clearTimer:()=>{},onJoin:self=>states[i]=copyPlayerState(self.state),onSpawn:self=>states[i]=copyPlayerState(self.state)});
 const poll=()=>Promise.all(clients.map(c=>c.refresh()));
 try{
  for(let i=0;i<20;i++)clients.push(make(i));
  await clients[0].create('Host','explorer');const code=clients[0].view().roomCode;
  for(let i=1;i<20;i++)await clients[i].join(code,'Guest '+i,'explorer');await poll();await clients[0].startMatch(300000);await poll();
  assert.equal(new Set(clients.map(c=>c.view().yourId)).size,20);assert.equal(new Set(states.map(s=>s.position.join())).size,20);
  const roles=clients.map(c=>c.view().yourRound.role);assert.equal(roles.filter(r=>r==='POLICE').length,5);assert.equal(roles.filter(r=>r==='THIEF').length,5);
  for(let frame=0;frame<120;frame++){
   if(frame===25){offline.add(3);offline.add(11);}if(frame===45)offline.clear();
   for(let i=0;i<20;i++)if(clients[i].view().canMove){const s=states[i],[x,y]=s.position,length=Math.hypot(x,y);if(length>1){s.position=[x-x/length*.25,y-y/length*.25,s.position[2]];s.heading=Math.atan2(-x,-y);s.speed=2.5;s.running=false;s.poseWeight=1;s.runBlend=0;s.gaitPhase=(s.gaitPhase+.625)%(Math.PI*2);s.animationTime+=.1;}}
   time+=100;await poll();
   if(frame===35)for(const i of [3,11]){assert.equal(clients[i].phase,'reconnecting');assert.equal(clients[i].view().players.length,20);assert(!clients[i].view().canMove);}
  }
  assert(clients.every(c=>c.phase==='connected'&&c.view().players.length===20));assert(clients.every(c=>Number.isFinite(c.view().yourRound.wallet)));
  const retainedId=clients[3].view().yourId,retainedRole=clients[3].view().yourRound.role,retainedWallet=clients[3].view().yourRound.wallet,endsAt=clients[0].view().endsAt;offline.add(3);for(let second=0;second<45;second++){time+=1000;await poll();}offline.clear();await poll();await poll();assert.equal(clients[3].view().yourId,retainedId);assert.equal(clients[3].view().yourRound.role,retainedRole);assert.equal(clients[3].view().yourRound.wallet,retainedWallet);assert.equal(clients[3].phase,'connected');assert(clients.every(c=>c.view().players.length===20&&c.view().endsAt===endsAt));
  const savedId=clients[7].view().yourId,savedRole=clients[7].view().yourRound.role;clients[7].stop();clients[7]=make(7);assert(await clients[7].restore(code));assert.equal(clients[7].view().yourId,savedId);assert.equal(clients[7].view().yourRound.role,savedRole);await poll();assert(clients.every(c=>c.view().players.length===20));
  await clients[0].leave();await poll();const remaining=clients.slice(1);assert(remaining.every(c=>c.view().players.length===19));assert.equal(remaining.filter(c=>c.view().isHost).length,1);assert(remaining.every(c=>c.view().matchPhase==='playing'));assert.equal(serverErrors,0);assert(requests>2200);
  latency.sort((a,b)=>a-b);t.diagnostic(`${requests} real HTTP requests; 0 server errors; 20 members retained through a 45-second outage/reload; local p95 ${latency[Math.floor(latency.length*.95)].toFixed(1)} ms (not a production benchmark).`);
 }finally{offline.clear();await Promise.allSettled(clients.map(c=>c.leave()));clients.forEach(c=>c.stop());await app.close();}
});
