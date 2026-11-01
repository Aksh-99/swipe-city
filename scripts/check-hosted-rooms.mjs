// Service-side integration probe only. This does not test browser rendering.
// Pass the Sites bypass credential through the environment, never an argument.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {DEFAULT_ROOM_STATE} from '../src/room-protocol.js';
import {RoomClient} from '../src/room-client.js';
import {TabSessionOwner} from '../src/tab-session.js';
import {APPEARANCES,APPEARANCE_IDS} from '../src/appearances.js';
import {TestLockManager,tabStorage} from '../tests/tab-test-helper.js';
import {findTransport,transportArrival} from '../src/transport-config.js';
import {PLAY_AREA,containsPlayArea} from '../src/play-area.js';
const origin='https://times-square-walk.agopakum1.chatgpt.site';
const authorization=process.env.SITES_SERVICE_AUTHORIZATION;
if(!authorization)throw new Error('Missing Sites service authorization.');
const headers={'OAI-Sites-Authorization':authorization};
async function get(path){
 const response=await fetch(origin+path,{headers,redirect:'manual',signal:AbortSignal.timeout(15000)});
 assert.equal(response.status,200,`Hosted asset ${path} must return 200`);return response;
}
const fetcher=(path,init)=>fetch(origin+path,{...init,headers:{...init.headers,...headers,Origin:origin},redirect:'manual'});
// The execution environment's network proxy can add several seconds per
// request. Allow it more time; the game's normal eight-second timeout remains.
const networkTimer=(fn,ms)=>setTimeout(fn,ms===8000?20000:ms);
const states=Array.from({length:4},(_,i)=>({...DEFAULT_ROOM_STATE,position:[i*3,i*2,.17],speed:i?8:3.2,running:!!i,poseWeight:1,runBlend:i?1:0,gaitPhase:i*.4}));
// Model copied per-tab storage and Web Locks; the room API here is production.
// Browser-native locking and WebGL still require an actual browser playtest.
const locks=new TestLockManager(),hidden=Array(4).fill(false);
const makeClient=(i,storage=tabStorage())=>new RoomClient({fetcher,getState:()=>states[i],onSpawn:self=>Object.assign(states[i],{...self.state,position:[...self.state.position]}),setTimer:networkTimer,storage,ownership:new TabSessionOwner({locks}),isHidden:()=>hidden[i]});
const clients=states.map((_,i)=>makeClient(i));
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function waitFor(check){
 const deadline=performance.now()+45000;
 while(!check()){if(performance.now()>deadline)throw new Error('Hosted clients did not converge within 45 seconds.');await delay(100);}
}
try{
 console.log('Checking hosted city assets and database binding.');
 const page=await (await get('/')).text();assert(page.includes('id="world"'),'Original game page remains available');
 const builtPage=await readFile(new URL('../dist/client/index.html',import.meta.url),'utf8');
 const entry=builtPage.match(/src="(\/assets\/index-[^"]+\.js)"/)?.[1];
 assert(entry&&page.includes(entry),'Hosted page serves the current built client');
 const publishedClient=await (await get(entry)).arrayBuffer(),builtClient=await readFile(new URL('../dist/client'+entry,import.meta.url));
 assert.equal(createHash('sha256').update(new Uint8Array(publishedClient)).digest('hex'),createHash('sha256').update(builtClient).digest('hex'),'Published client bundle matches the current checkout');
 const publishedCars=await (await get('/data/police-vehicles.json')).json(),expectedCars=JSON.parse(await readFile(new URL('../public/data/police-vehicles.json',import.meta.url),'utf8'));assert.deepEqual(publishedCars,expectedCars,'Published vehicle placements match the tested scene');assert.equal(publishedCars.vehicles.length,17);
 const publishedPortals=await (await get('/data/transport-portals.json')).json(),expectedPortals=JSON.parse(await readFile(new URL('../public/data/transport-portals.json',import.meta.url),'utf8'));assert.deepEqual(publishedPortals,expectedPortals,'Published door/exit routes match the tested collision manifest');assert.equal(publishedPortals.portals.length,24);
 const publishedArea=await (await get('/data/play-area.json')).json();assert.deepEqual(publishedArea,PLAY_AREA,'Published perimeter matches the tested map and controller');
 const health=await (await get('/api/health')).json();assert.equal(health.multiplayer,true);assert.equal(health.capacity,4);
 await get('/data/nyc/manifest.json');
 for(const appearance of APPEARANCES){const bytes=await (await get(appearance.uri)).arrayBuffer(),expected=await readFile(new URL('../public'+appearance.uri.split('?')[0],import.meta.url));assert(bytes.byteLength>2_000_000,`${appearance.name} model is available`);assert.equal(createHash('sha256').update(new Uint8Array(bytes)).digest('hex'),createHash('sha256').update(expected).digest('hex'),`${appearance.name}: hosted model matches current prepared asset`);}
 console.log('Connecting four independent hosted clients.');
 await clients[0].create('Service test 1','explorer');const room=clients[0].view().roomCode;
 assert.equal(clients[0].view().matchPhase,'waiting');assert.equal(clients[0].view().canMove,false);
 await assert.rejects(()=>clients[0].startMatch(),/Exactly four/);
 for(const client of clients.slice(1))client.storage=clients[0].storage.copy();
 assert.deepEqual(await Promise.all(clients.slice(1).map(client=>client.restore())),[true,true,true]);
 assert.equal(new Set(clients.map(c=>c.view().yourId)).size,4);
 assert.equal(new Set(clients.map(c=>c.session.characterId)).size,4);
 assert.deepEqual(clients.map(c=>c.session.characterId).sort(),[...APPEARANCE_IDS].sort());
 await waitFor(()=>clients.every(c=>c.view().players.length===4&&c.view().players.every(p=>p.ready)));
 await assert.rejects(()=>clients[1].startMatch(),/Only the host/);assert(clients[0].view().canStart);
 await clients[0].startMatch();await waitFor(()=>clients.every(c=>c.view().canMove));
 assert.equal(new Set(clients.map(c=>c.view().playerNumber)).size,4);
 const spawnPositions=clients.map((c,i)=>[...states[i].position]);assert.equal(new Set(spawnPositions.map(p=>JSON.stringify(p))).size,4);
 const goals=states.map((state,i)=>({...state,position:[state.position[0]+(i===2?1:0),state.position[1]+(i===2?0:1),state.position[2]],speed:i===3?8:3.2,running:i===3,poseWeight:1,runBlend:i===3?1:0,gaitPhase:(i+1)*.4,animationTime:1}));
 goals.forEach((state,i)=>Object.assign(states[i],state));
 await waitFor(()=>clients.every(c=>c.view().players.length===4&&c.view().players.every(peer=>{
  const index=clients.findIndex(other=>other.view().yourId===peer.id);return index>=0&&peer.state.position.every((v,i)=>v===goals[index].position[i])&&peer.state.gaitPhase===goals[index].gaitPhase;
 })));
 console.log('Hosted lobby/start passed. Four clients receive all four server spawns, positions and walking poses.');
 const grounded=states.map(state=>[...state.position]);
 states.forEach((state,i)=>Object.assign(state,{position:[grounded[i][0],grounded[i][1],grounded[i][2]+.8],airBlend:1}));
 await waitFor(()=>clients.every(client=>client.view().players.every(peer=>{
  const i=clients.findIndex(other=>other.view().yourId===peer.id);return i>=0&&peer.state.airBlend===1&&Math.abs(peer.state.position[2]-grounded[i][2]-.8)<1e-6;
 })));
 states.forEach((state,i)=>Object.assign(state,{position:[...grounded[i]],airBlend:0}));
 await waitFor(()=>clients.every(client=>client.view().players.every(peer=>{
  const i=clients.findIndex(other=>other.view().yourId===peer.id);return i>=0&&peer.state.airBlend===0&&Math.abs(peer.state.position[2]-grounded[i][2])<1e-6;
 })));
 console.log('Hosted jump synchronization passed: four clients receive airborne height/pose and grounded landing.');
 await Promise.all(clients.map(async(client,i)=>{
  const a=PLAY_AREA.polygon[i],b=PLAY_AREA.polygon[(i+1)%4],n=PLAY_AREA.planes[i].normal,target=[(a[0]+b[0])/2-n[0],(a[1]+b[1])/2-n[1],.17];let before;
  const correction=await client.control('sync',()=>{before=client.session.revision;return {sequence:++client.sequence,revision:before,matchId:client.snapshot.matchId,state:{...states[i],position:target}};});
  const self=correction.players.find(p=>p.id===client.view().yourId);assert.equal(self.revision,before+1);assert.deepEqual(self.state.position,grounded[i]);assert(correction.players.every(p=>containsPlayArea(p.state.position,.32)));
 }));
 console.log('Hosted perimeter passed: all four edges reject outside movement and preserve each player’s last in-area pose.');
 const fifth=new RoomClient({fetcher,setTimer:networkTimer,storage:clients[0].storage.copy(),ownership:new TabSessionOwner({locks})});
 try{assert.equal(await fifth.restore(),false);assert(fifth.error.includes('four players'));}finally{await fifth.leave();fifth.stop();}
 for(let i=0;i<4;i++){
  const snapshot=clients[i].view();assert.equal(snapshot.players.length,4);
  for(let j=0;j<4;j++){const peer=snapshot.players.find(p=>p.id===clients[j].view().yourId);assert.deepEqual(peer.state.position,states[j].position);assert.equal(peer.state.gaitPhase,states[j].gaitPhase);assert.equal('token' in peer,false);assert.equal('role' in peer,false);assert.equal('gameplayRole' in peer,false);}
 }
 const priorId=clients[2].view().yourId,priorStorage=clients[2].storage;await clients[2].ownership.release();clients[2].stop();clients[2]=makeClient(2,priorStorage);assert(await clients[2].restore());assert.equal(clients[2].view().yourId,priorId);assert(clients[2].view().canMove);
 hidden[3]=true;await clients[3].refresh();await waitFor(()=>clients.slice(0,3).every(c=>c.view().players.some(p=>p.id===clients[3].view().yourId&&p.background&&p.state.speed===0)));
 hidden[3]=false;await clients[3].refresh();
 console.log('Testing pedestrian bus and police vehicle transport with all four hosted clients.');
 // Access is chosen separately before a new join, never inferred from the
 // assigned model or modified through walking packets during the match.
 await clients[2].leave();await clients[2].join(room,'Service police transport','explorer','police');assert.equal(clients[2].view().transportAccess,'police');
 const bus=findTransport('bus:mta-44'),car=findTransport('police:7th-avenue');
 await assert.rejects(()=>clients[0].transport(car.id),/Pedestrians travel using buses/);
 await assert.rejects(()=>clients[2].transport(bus.id),/Police officers travel using NYPD cars/);
 // This service probe advances bounded approach states. The separate real
 // controller/collision test covers physically walking into the actual doors.
 async function approach(index,portal){
  const client=clients[index],target=portal.doors[0].approach,self=()=>client.view().players.find(p=>p.id===client.view().yourId);
  let remaining=Infinity,steps=0;
  while(remaining>.001){
   const from=self().state.position;remaining=Math.hypot(target[0]-from[0],target[1]-from[1]);if(remaining<=.001)break;
   const blend=Math.min(1,1/remaining),position=from.map((v,k)=>v+(target[k]-v)*blend),deadline=performance.now()+45000;
   // A variable proxy RTT can deliver a newer pose immediately after an old
   // delayed request. Confirm small steps before advancing, instead of the
   // test simulating several seconds of movement while a request is pending.
   while(!self().state.position.every((v,k)=>Math.abs(v-position[k])<1e-6)){
    Object.assign(states[index],{position:[...position],heading:Math.atan2(target[0]-from[0],target[1]-from[1]),speed:3.2,running:false,runBlend:0,poseWeight:1});
    await client.refresh();
    if(performance.now()>deadline)throw new Error(`Door approach stalled: player ${index+1}, phase ${client.phase}, revision ${self()?.revision}, accepted ${self()?.state.position}, target ${position}, error ${client.error}`);
    await delay(100);
   }
   steps++;if(steps%20===0)console.log(`Transport approach: player ${index+1}, ${remaining.toFixed(0)} m remaining.`);await delay(350);
  }
  Object.assign(states[index],{position:[...target],speed:0,running:false,runBlend:0,poseWeight:0});
  console.log(`Player ${index+1} reached the ${portal.name} door.`);
 }
 await Promise.all([approach(0,bus),approach(2,car)]);
 const beforeTransport=clients[0].snapshot.players.find(p=>p.id===clients[0].view().yourId),busResult=await clients[0].transport(bus.id),carResult=await clients[2].transport(car.id);
 assert.equal(busResult.transport.destinationId,bus.nextId);assert.equal(carResult.transport.destinationId,car.nextId);
 const arrivals=new Map([[clients[0].view().yourId,transportArrival(bus,clients[0].view().playerNumber-1).state.position],[clients[2].view().yourId,transportArrival(car,clients[2].view().playerNumber-1).state.position]]);
 await waitFor(()=>clients.every(c=>c.view().players.length===4&&[...arrivals].every(([id,position])=>c.view().players.find(p=>p.id===id)?.state.position.every((v,k)=>Math.abs(v-position[k])<1e-6))));
 const stale=await clients[0].request(`/api/rooms/${room}/sync`,{token:clients[0].session.token,sequence:++clients[0].sequence,revision:beforeTransport.revision,matchId:busResult.matchId,state:beforeTransport.state});
 assert.deepEqual(stale.players.find(p=>p.id===clients[0].view().yourId).state.position,arrivals.get(clients[0].view().yourId),'A stale departure packet cannot undo transport');await clients[0].apply(stale);
 console.log('Hosted transport passed: separate permissions, canonical destinations, four-client arrivals and stale-packet protection.');
 await clients[3].leave();await waitFor(()=>clients[0].view().players.length===3);
 assert(clients.slice(0,3).every(c=>c.view().canMove));
 console.log('Hosted check passed: exactly-four lobby, host-only start, assigned spawns, unique players, shared movement, reload, background idle, restricted transport, fifth-player limit and independent leaving.');
}finally{
 await Promise.allSettled(clients.map(c=>c.leave()));clients.forEach(c=>c.stop());
}
