import test from 'node:test';import assert from 'node:assert/strict';
import {createLocalServer} from '../server/local.mjs';import {RoomClient} from '../src/room-client.js';
import {DEFAULT_ROOM_STATE,copyPlayerState} from '../src/room-protocol.js';import {InteractionController} from '../src/interaction-controller.js';import {MATCH_DURATION_MS} from '../src/match-time.js';import {tabStorage} from './tab-test-helper.js';
const until=async predicate=>{for(let i=0;i<100;i++){if(predicate())return;await new Promise(r=>setTimeout(r,5));}assert.fail('Client action did not complete');};
test('four HTTP clients shoot, receive private costs/death, stay locked and start a clean rematch after survival',async()=>{
 let time=100000,hidden=false;const app=await createLocalServer({host:'127.0.0.1',port:0,databasePath:':memory:',now:()=>time,chooseRole:n=>n===3?0:3}),origin=`http://127.0.0.1:${app.port}`;
 const states=Array.from({length:4},()=>copyPlayerState(DEFAULT_ROOM_STATE)),clients=[];
 for(let i=0;i<4;i++)clients.push(new RoomClient({fetcher:(path,init)=>fetch(origin+path,{...init,headers:{...init.headers,Origin:origin}}),clock:()=>time,storage:tabStorage(),isHidden:()=>hidden,getState:()=>states[i],setTimer:()=>0,clearTimer:()=>{},onJoin:self=>states[i]=copyPlayerState(self.state),onSpawn:self=>states[i]=copyPlayerState(self.state)}));
 try{
  await clients[0].create('Thief','explorer');for(let i=1;i<4;i++)await clients[i].join(clients[0].view().roomCode,'Player '+i,['explorer','tourist','pedestrian','commuter'][i]);
  await clients[0].refresh();await clients[0].startMatch();const poll=()=>Promise.all(clients.map(c=>c.refresh()));await poll();assert(clients.every(c=>c.view().yourRound.wallet===500));
  // Move the test participants together after verifying their separate spawn preparation.
  assert(new Set(states.map(s=>s.position.join(','))).size===4);
  for(let i=0;i<4;i++){const row=app.store.sql.prepare('SELECT state FROM ts_members WHERE player_id=?').get(clients[i].view().yourId),saved=JSON.parse(row.state);saved.position=[i*.7,0,.17];states[i]=copyPlayerState(saved);app.store.sql.prepare('UPDATE ts_members SET state=? WHERE player_id=?').run(JSON.stringify(saved),clients[i].view().yourId);}await poll();
  const controller=new InteractionController({client:clients[0],onError:error=>assert.fail(error.message)});
  const fire=async()=>{controller.update({state:clients[0].view(),candidate:{kind:'shoot',targetId:clients[1].view().yourId},time,enabled:true});assert(controller.press());await until(()=>!controller.beginning);assert(!controller.busy);controller.keyReleased();await poll();};
  await fire();assert.equal(clients[0].view().yourRound.wallet,600);assert.equal(clients[1].view().yourRound.wallet,300);
  for(let i=0;i<3;i++){time+=1000;await fire();}assert.equal(clients[1].view().yourRound.dead,true);assert.equal(clients[1].view().canMove,false);assert.equal(clients[1].movement(),null);
  await assert.rejects(()=>clients[1].resetSpawn());
  hidden=true;await poll();time=clients[0].view().startedAt+MATCH_DURATION_MS;await poll();assert(clients.every(c=>c.view().roundResult.winner==='THIEF'));
  await clients[0].rematch();await poll();assert(clients.every(c=>!c.view().yourRound));await clients[0].startMatch();await poll();assert(clients.every(c=>c.view().yourRound.wallet===500&&!c.view().yourRound.dead));
 }finally{await Promise.allSettled(clients.map(c=>c.leave()));clients.forEach(c=>c.stop());await app.close();}
});
test('complete four-client lifecycle: custom timer, continuous run, report, 20m shot, police win and rematch',async()=>{
 const {Player,FIXED_STEP}=await import('../src/player.js'),{playerState}=await import('../src/room-protocol.js');
 let time=100000;const app=await createLocalServer({host:'127.0.0.1',port:0,databasePath:':memory:',now:()=>time,chooseRole:n=>n===3?0:3}),origin=`http://127.0.0.1:${app.port}`,states=Array.from({length:4},()=>copyPlayerState(DEFAULT_ROOM_STATE)),clients=[];
 for(let i=0;i<4;i++)clients.push(new RoomClient({fetcher:(path,init)=>fetch(origin+path,{...init,headers:{...init.headers,Origin:origin}}),clock:()=>time,storage:tabStorage(),getState:()=>states[i],setTimer:()=>0,clearTimer:()=>{},onJoin:self=>states[i]=copyPlayerState(self.state),onSpawn:self=>states[i]=copyPlayerState(self.state)}));
 const poll=()=>Promise.all(clients.map(c=>c.refresh()));
 const place=(i,position)=>{const id=clients[i].view().yourId,row=app.store.sql.prepare('SELECT state FROM ts_members WHERE player_id=?').get(id),saved=JSON.parse(row.state);saved.position=position;app.store.sql.prepare('UPDATE ts_members SET state=?,pose_at=? WHERE player_id=?').run(JSON.stringify(saved),time,id);states[i]=copyPlayerState(saved);};
 try{
  await clients[0].create('Host','explorer');for(let i=1;i<4;i++)await clients[i].join(clients[0].view().roomCode,'Guest '+i,['explorer','tourist','pedestrian','commuter'][i]);await poll();await clients[0].startMatch(120000);await poll();assert(clients.every(c=>c.view().durationMs===120000));assert.equal(new Set(states.map(s=>s.position.join())).size,4);
  const thief=clients.findIndex(c=>c.view().yourRound.role==='THIEF'),officer=clients.findIndex(c=>c.view().yourRound.role==='POLICE'),civ=clients.findIndex(c=>c.view().yourRound.role==='PEDESTRIAN');
  for(let i=0;i<4;i++)place(i,[i*.7,0,.17]);await poll();
  // Real fixed-step controller + authenticated HTTP movement at 10Hz.
  const runner=new Player({ready:()=>true,ground:()=>.17,resolve:p=>p});runner.position.fromArray(states[thief].position);runner.snapPresentation();const revision=clients[thief].view().players.find(p=>p.id===clients[thief].view().yourId).revision;
  for(let packet=0;packet<100;packet++){for(let frame=0;frame<6;frame++)runner.update(FIXED_STEP,new Set(['ArrowUp','ShiftLeft']),0);states[thief]=playerState(runner);time+=100;await poll();assert.equal(clients[thief].view().players.find(p=>p.id===clients[thief].view().yourId).revision,revision,'legal continuous running should not force respawns');}
  assert(runner.position.y>75);assert(runner.running);assert(Number.isFinite(runner.gaitPhase));
  for(let i=0;i<4;i++)place(i,[i*.7,0,.17]);await poll();
  await clients[civ].observeSuspect(clients[thief].view().yourId);await clients[civ].call911(clients[thief].view().yourId);await poll();assert.equal(clients[officer].view().dispatchCalls.length,1);assert.equal(clients[thief].view().dispatchCalls.length,0);
  place(thief,[0,0,.17]);place(civ,[0,20,.17]);await poll();await clients[thief].beginInteraction('shoot',clients[civ].view().yourId);await poll();assert.equal(clients[civ].view().yourRound.wallet,300);assert.equal(clients[thief].view().yourRound.wallet,600);assert(clients.every(c=>c.view().gunshots.length===1));
  place(officer,[1,0,.17]);await poll();await clients[officer].beginInteraction('shoot',clients[thief].view().yourId);await poll();assert(clients.every(c=>c.view().roundResult?.winner==='POLICE'));assert(clients[thief].view().yourRound.caught);
  await clients[0].rematch();await poll();assert(clients.every(c=>c.view().matchPhase==='waiting'&&!c.view().yourRound));await clients[0].startMatch(60000);await poll();assert(clients.every(c=>c.view().yourRound.wallet===500&&!c.view().yourRound.caught&&!c.view().yourRound.dead));
 }finally{await Promise.allSettled(clients.map(c=>c.leave()));clients.forEach(c=>c.stop());await app.close();}
});
