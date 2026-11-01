import test from 'node:test';import assert from 'node:assert/strict';
import {RoomClient} from '../src/room-client.js';
import {createRoomsHandler} from '../server/rooms.js';
import {DEFAULT_ROOM_STATE} from '../src/room-protocol.js';
import {createTestDatabase} from './d1-test-helper.js';
import {TabSessionOwner} from '../src/tab-session.js';
import {TestLockManager,tabStorage} from './tab-test-helper.js';
import {HIDDEN_SYNC_INTERVAL} from '../src/room-protocol.js';
function client(db,extra={}){const handler=createRoomsHandler({now:extra.serverNow??Date.now});return new RoomClient({fetcher:(path,init)=>handler(new Request('https://times.test'+path,init),{DB:db}),getState:()=>DEFAULT_ROOM_STATE,setTimer:()=>0,clearTimer:()=>{},...extra});}
test('four browser clients create/join, send independent movement and see the other three without sharing local storage',async()=>{
 let time=100_000;const store=createTestDatabase(),positions=Array.from({length:4},(_,i)=>[i*4,0,.17]),snapshots=Array(4),clients=Array.from({length:4},(_,i)=>client(store.db,{serverNow:()=>time,getState:()=>({...DEFAULT_ROOM_STATE,position:positions[i]}),onSpawn:self=>positions[i]=self.state.position.map((v,j)=>j<2?v*.998:v),onSnapshot:s=>snapshots[i]=s}));
 try{
  await clients[0].create('Host','explorer');const code=clients[0].view().roomCode;await Promise.all(clients.slice(1).map((c,i)=>c.join(code,'Guest '+i,'explorer')));
  await clients[0].startMatch();await Promise.all(clients.map(c=>c.tick()));time+=3000;
  await Promise.all(clients.map(c=>c.tick()));await Promise.all(clients.map(c=>c.tick()));
  for(let i=0;i<4;i++){assert.equal(clients[i].phase,'connected');assert.equal(snapshots[i].players.filter(p=>p.id!==clients[i].view().yourId).length,3);for(let j=0;j<4;j++){const p=snapshots[i].players.find(p=>p.id===clients[j].view().yourId);assert.deepEqual(p.state.position,positions[j]);}}
  assert.equal(new Set(clients.map(c=>c.session.token)).size,4);
  await clients[2].leave();await clients[0].tick();assert.equal(clients[0].view().players.length,3);assert.equal(clients[2].phase,'solo');
 }finally{clients.forEach(c=>c.stop());store.close();}
});
test('three duplicated session stores join as distinct players; one leaving cannot remove the original',async()=>{
 let time=100_000;const store=createTestDatabase(),locks=new TestLockManager(),originalStorage=tabStorage(),clients=[],poses=[];
 const make=storage=>{const index=clients.length,x=index*4;poses[index]=[x,0,.17];const result=client(store.db,{serverNow:()=>time,storage,ownership:new TabSessionOwner({locks}),getState:()=>({...DEFAULT_ROOM_STATE,position:poses[index]}),onSpawn:self=>poses[index]=self.state.position.map((v,j)=>j<2?v*.998:v)});clients.push(result);return result;};
 try{
  const original=make(originalStorage);await original.create('Host','explorer');const originalId=original.view().yourId;
  const copies=Array.from({length:3},()=>make(originalStorage.copy()));assert.deepEqual(await Promise.all(copies.map(copy=>copy.restore())),[true,true,true]);
  await original.tick();await original.startMatch();await Promise.all(clients.map(c=>c.tick()));time+=3000;
  await Promise.all(clients.map(c=>c.tick()));
  assert.equal(new Set(clients.map(c=>c.view().yourId)).size,4);assert.equal(new Set(clients.map(c=>c.session.characterId)).size,4);
  await Promise.all(clients.map(c=>c.tick()));for(const c of clients)for(let i=0;i<4;i++)assert.deepEqual(c.view().players.find(p=>p.id===clients[i].view().yourId).state.position,poses[i]);
  assert(copies.every(c=>c.notice.includes('separate player')));assert.equal(original.view().yourId,originalId);
  const fifth=make(originalStorage.copy());assert.equal(await fifth.restore(),false);assert(fifth.error.includes('round is in progress'));assert.equal(fifth.phase,'solo');
  await copies[0].leave();await original.tick();assert.equal(original.view().players.length,3);assert(original.view().players.some(p=>p.id===originalId));
  await original.ownership.release();original.stop();const reloaded=make(originalStorage);assert.equal(await reloaded.restore(),true);assert.equal(reloaded.view().yourId,originalId);assert.equal(reloaded.view().players.length,3);
 }finally{await Promise.all(clients.map(c=>c.ownership.release()));clients.forEach(c=>c.stop());store.close();}
});
test('background synchronization sends idle poses at a lower rate and wakes immediately without overlapping requests',async()=>{
 const store=createTestDatabase(),timers=[];let hidden=false,release,calls=0;
 const base=client(store.db),fetcher=base.fetcher;
 const c=client(store.db,{isHidden:()=>hidden,getState:()=>({...DEFAULT_ROOM_STATE,speed:8,running:true,poseWeight:1,runBlend:1}),clock:()=>0,setTimer:(fn,ms)=>{timers.push({fn,ms});return timers.length;},fetcher:async(path,init)=>{if(path.endsWith('/sync')&&++calls===1)await new Promise(resolve=>release=resolve);return fetcher(path,init);}});
 try{
  await c.create('Host','explorer');hidden=true;const pending=c.tick();const refresh=c.refresh();assert.equal(calls,1);release();await Promise.all([pending,refresh]);assert.equal(timers.at(-1).ms,0);
  await c.tick();assert.equal(timers.at(-1).ms,HIDDEN_SYNC_INTERVAL);const self=c.view().players.find(p=>p.id===c.view().yourId);assert.equal(self.background,true);assert.equal(self.state.speed,0);assert.equal(self.state.poseWeight,0);
  hidden=false;await c.refresh();assert.equal(c.view().players[0].background,false);assert.equal(timers.at(-1).ms,100);
 }finally{c.stop();base.stop();store.close();}
});
test('reload resumes the same membership and errors display without claiming a successful connection',async()=>{
 const store=createTestDatabase(),values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};try{
  const original=client(store.db,{storage});await original.create('Host','tourist');original.stop();const id=original.session.yourId;
  const resumed=client(store.db,{storage});assert.equal(await resumed.restore(),true);assert.equal(resumed.session.yourId,id);assert.equal(resumed.view().players.length,1);resumed.stop();
  const bad=client(store.db);await assert.rejects(()=>bad.join('ABC234','Guest','explorer'),/Room not found/);assert.equal(bad.phase,'solo');assert(bad.error.includes('Room not found'));
 }finally{store.close();}
});
test('an offline reload and temporary server failure retry the same owned player without consuming a slot or losing its role',async()=>{
 const store=createTestDatabase(),locks=new TestLockManager(),clients=[],storages=Array.from({length:4},()=>tabStorage()),requests=[],timers=[];let time=100_000;
 const make=(storage,extra={})=>{const c=client(store.db,{serverNow:()=>time,storage,ownership:new TabSessionOwner({locks}),...extra});clients.push(c);return c;};
 try{
  const original=storages.map(storage=>make(storage));await original[0].create('Host','explorer');const room=original[0].view().roomCode;
  for(let i=1;i<4;i++)await original[i].join(room,'Guest '+i,'explorer');await original[0].startMatch();await Promise.all(original.map(c=>c.tick()));
  const index=original.findIndex(c=>c.view().yourRound.role==='THIEF'),thief=original[index],saved={...thief.session};await thief.ownership.release();thief.stop();
  let outage='offline',joins=0,spawns=0;const base=make(null),fetcher=base.fetcher;
  const resumed=make(storages[index],{setTimer:(fn,ms)=>{timers.push({fn,ms});return timers.length;},onJoin:()=>joins++,onSpawn:()=>spawns++,fetcher:async(path,init)=>{requests.push({path,body:JSON.parse(init.body)});if(outage==='offline')throw new TypeError('Failed to fetch');if(outage==='server')return Response.json({error:'Please retry.',code:'BACKEND_UNAVAILABLE'},{status:503});return fetcher(path,init);}});
  assert.equal(await resumed.restore(room),false);assert.equal(resumed.phase,'reconnecting');assert.equal(resumed.view().canMove,false);assert.equal(resumed.view().yourId,saved.yourId);assert.equal(JSON.parse(storages[index].getItem('times-square-room-v1')).token,saved.token);assert(timers.some(t=>t.ms<8000));
  outage='server';await resumed.tick();assert.equal(resumed.phase,'reconnecting');assert.equal(resumed.view().yourId,saved.yourId);
  outage=null;await resumed.tick();assert.equal(resumed.phase,'connected');assert.equal(resumed.view().yourId,saved.yourId);assert.equal(resumed.view().yourRound.role,'THIEF');assert.equal(resumed.view().players.length,4);assert.equal(resumed.view().canMove,true);assert.equal(joins,1);assert.equal(spawns,1);
  assert(requests.every(r=>r.path.endsWith('/sync')&&r.body.token===saved.token),'retries authenticate the saved membership instead of joining another slot');
  await Promise.all(original.filter(c=>c!==thief).map(c=>c.tick()));assert(original.filter(c=>c!==thief).every(c=>c.view().players.length===4));
 }finally{clients.forEach(c=>c.stop());await Promise.all(clients.map(c=>c.ownership.release()));store.close();}
});
test('an unavailable room clears a saved membership instead of retrying it forever',async()=>{
 const store=createTestDatabase(),storage=tabStorage(),locks=new TestLockManager(),clients=[];let time=100_000;
 const make=()=>{const c=client(store.db,{serverNow:()=>time,storage,ownership:new TabSessionOwner({locks})});clients.push(c);return c;};
 try{const original=make();await original.create('Host','explorer');await original.ownership.release();original.stop();time+=4*60*60*1000+1;const resumed=make();assert.equal(await resumed.restore(),false);assert.equal(resumed.phase,'solo');assert.equal(resumed.view().roomCode,null);assert.equal(storage.getItem('times-square-room-v1'),null);assert.match(resumed.error,/room/i);assert.equal(resumed.ownership.id,null);}
 finally{clients.forEach(c=>c.stop());await Promise.all(clients.map(c=>c.ownership.release()));store.close();}
});
test('an offline duplicated tab never retains or retries the original player credential',async()=>{
 const store=createTestDatabase(),storage=tabStorage(),locks=new TestLockManager(),original=client(store.db,{storage,ownership:new TabSessionOwner({locks})}),requests=[];let duplicate;
 try{await original.create('Host','explorer');const copied=storage.copy();duplicate=client(store.db,{storage:copied,ownership:new TabSessionOwner({locks}),fetcher:async(path,init)=>{requests.push(JSON.parse(init.body));throw new TypeError('Failed to fetch');}});assert.equal(await duplicate.restore(),false);assert.equal(duplicate.phase,'solo');assert.equal(duplicate.session,null);assert.equal(copied.getItem('times-square-room-v1'),null);assert.equal(duplicate.joinHint.roomCode,original.view().roomCode);assert(requests.every(body=>!body.token));assert.equal(original.ownership.id,original.view().yourId);await original.tick();assert.equal(original.view().players.length,1);}
 finally{original.stop();duplicate?.stop();await Promise.all([original.ownership.release(),duplicate?.ownership.release()]);store.close();}
});
test('connection failure retains membership for reconnect and rejects a twenty-first client clearly',async()=>{
 const store=createTestDatabase();try{
  const a=client(store.db);await a.create('Host','explorer');const code=a.session.roomCode;
  for(let i=0;i<19;i++)await client(store.db).join(code,'Guest','explorer');await assert.rejects(()=>client(store.db).join(code,'Twenty-first','explorer'),/20 players/);
  const fetcher=a.fetcher;a.fetcher=async()=>{throw new Error('offline');};await a.tick();assert.equal(a.phase,'reconnecting');assert.equal(a.view().players.length,1);a.fetcher=fetcher;await a.tick();assert.equal(a.phase,'connected');assert.equal(a.view().players.length,20);a.stop();
 }finally{store.close();}
});
test('default browser APIs preserve their Window receiver during create, join, sync, failure and leave',async t=>{
 const store=createTestDatabase(),handler=createRoomsHandler(),scheduled=new Map();let nextTimer=0;
 // Emulate the receiver checks enforced by Safari without replacing the
 // client adapters. The default adapters must call each global as a method.
 t.mock.method(globalThis,'setTimeout',function(fn,delay){if(this!==globalThis)throw new TypeError('Can only call Window.setTimeout on instances of Window');const id=++nextTimer;scheduled.set(id,{fn,delay});return id;});
 t.mock.method(globalThis,'clearTimeout',function(id){if(this!==globalThis)throw new TypeError('Can only call Window.clearTimeout on instances of Window');scheduled.delete(id);});
 t.mock.method(globalThis,'fetch',function(path,init){if(this!==globalThis)throw new TypeError('Can only call Window.fetch on instances of Window');return handler(new Request('https://times.test'+path,init),{DB:store.db});});
 const clients=Array.from({length:20},()=>new RoomClient({getState:()=>DEFAULT_ROOM_STATE}));
 try{
  // The former defaults stored raw APIs and reproduce the reported error.
  const legacy=new RoomClient({fetcher:globalThis.fetch,setTimer:globalThis.setTimeout,clearTimer:globalThis.clearTimeout});
  await assert.rejects(()=>legacy.create('Legacy','explorer'),/Can only call Window.clearTimeout on instances of Window/);
  assert.equal(legacy.phase,'joining','the former call shape leaves the UI stuck');
  await clients[0].create('Host','explorer');const code=clients[0].view().roomCode;
  await Promise.all(clients.slice(1).map((client,i)=>client.join(code,'Guest '+i,'explorer')));
  await Promise.all(clients.map(client=>client.tick()));assert(clients.every(client=>client.phase==='connected'));
  const full=new RoomClient();await assert.rejects(()=>full.join(code,'Twenty-first','explorer'),/20 players/);assert.equal(full.phase,'solo');assert(full.error.includes('20 players'));full.stop();
  assert(scheduled.size>0,'successful clients schedule their next synchronization');
  await Promise.all(clients.map(client=>client.leave()));assert(clients.every(client=>client.phase==='solo'));
  assert.equal(scheduled.size,0,'leaving clears request timeouts and synchronization timers');
 }finally{clients.forEach(client=>client.stop());store.close();}
});

test('a missing invite is marked unavailable and creating a fresh lobby recovers normally',async()=>{
 const store=createTestDatabase(),c=client(store.db);
 try{await assert.rejects(()=>c.join('ABC234','Guest','explorer'),/Room not found/);assert.equal(c.view().unavailableRoomCode,'ABC234');assert.equal(c.view().joinHint,null);assert.equal(c.phase,'solo');assert.match(c.error,/Create a new lobby/);await c.create('Host','explorer');assert.equal(c.phase,'connected');assert.equal(c.view().unavailableRoomCode,null);assert.equal(c.view().players.length,1);assert(c.view().isHost);}finally{c.stop();store.close();}
});
test('players keep separate designs across joins, reloads, and expired-membership recovery',async()=>{let time=100000;const store=createTestDatabase(),saved=tabStorage(),a=client(store.db,{serverNow:()=>time,storage:saved,getDesign:()=> 'irish'}),b=client(store.db,{serverNow:()=>time,getDesign:()=> 'blonde'}),resumed=client(store.db,{serverNow:()=>time,storage:saved,getDesign:()=> 'indian'});try{await a.create('A','explorer');await b.join(a.view().roomCode,'B','explorer');await a.tick();assert.equal(a.session.designId,'irish');assert.equal(b.session.designId,'blonde');assert.equal(a.snapshot.players.find(p=>p.id===b.session.yourId).designId,'blonde');a.stop();assert(await resumed.restore());assert.equal(resumed.session.designId,'irish');store.sql.prepare('DELETE FROM ts_members WHERE player_id=?').run(resumed.session.yourId);resumed.stop();const recovery=client(store.db,{serverNow:()=>time,storage:saved,getDesign:()=> 'indian'});try{assert(await recovery.restore());assert.equal(recovery.session.designId,'irish');}finally{recovery.stop();}}finally{a.stop();b.stop();resumed.stop();store.close();}});

test('leaving with a stalled sync aborts the old request and cannot block or overwrite the next room',async()=>{
 const store=createTestDatabase(),handler=createRoomsHandler();let hold=false,release,oldSignal,syncs=0;
 const c=new RoomClient({setTimer:()=>0,clearTimer:()=>{},fetcher:(path,init)=>{if(hold&&path.endsWith('/sync')){hold=false;oldSignal=init.signal;return new Promise(resolve=>{release=()=>resolve(handler(new Request('https://times.test'+path,init),{DB:store.db}));});}if(path.endsWith('/sync'))syncs++;return handler(new Request('https://times.test'+path,init),{DB:store.db});}});
 try{await c.create('First room','explorer');const oldRoom=c.view().roomCode;hold=true;const oldTick=c.tick();assert(oldSignal);await c.leave();assert(oldSignal.aborted);await c.create('Second room','explorer');const nextRoom=c.view().roomCode;assert.notEqual(oldRoom,nextRoom);await c.tick();assert(syncs>0);release();release=null;await oldTick;assert.equal(c.view().roomCode,nextRoom);assert.equal(c.phase,'connected');assert.equal(c.requests.size,0);}finally{release?.();c.stop();store.close();}
});

test('stopping a document preserves its final keepalive park request',async()=>{
 let signal,resolve;const c=new RoomClient({setTimer:()=>0,clearTimer:()=>{},fetcher:async(path,init)=>{signal=init.signal;assert(init.keepalive);return new Promise(done=>{resolve=()=>done(Response.json({}));});}});c.session={roomCode:'ABC234',token:'a'.repeat(64),yourId:'test'};const parked=c.park();c.stop();assert(signal&&!signal.aborted);resolve();await parked;assert.equal(c.keepaliveRequests.size,0);
});
