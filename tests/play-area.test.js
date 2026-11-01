import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Vector3} from 'three';
import {PLAY_AREA,containsPlayArea,constrainPlayArea,PLAY_AREA_PLAYER_RADIUS} from '../src/play-area.js';
import {Player,FIXED_STEP} from '../src/player.js';
import {localPoint} from '../src/street-layout.js';
import {TRANSPORT_PORTALS,transportArrival} from '../src/transport-config.js';
import {DEFAULT_ROOM_STATE} from '../src/room-protocol.js';
import {spawnState,movementCredit} from '../server/match-rules.js';
import {encodeMovement,transportMetadata} from '../server/transport.js';
import {createRoomsHandler} from '../server/rooms.js';
import {createTestDatabase} from './d1-test-helper.js';
const world={ready:()=>true,resolve:p=>p,ground:()=>0};
const edgePoint=(i,inset)=>{const a=PLAY_AREA.polygon[i],b=PLAY_AREA.polygon[(i+1)%4],n=PLAY_AREA.planes[i].normal;return new Vector3((a[0]+b[0])/2+n[0]*inset,(a[1]+b[1])/2+n[1]*inset,0);};

test('perimeter corners match real mapped W42/W49 and Sixth/Eighth intersections, with W49 access closed',async()=>{
 const streets=JSON.parse(await readFile(new URL('../public/data/streets-osm.json',import.meta.url)));
 for(const corner of PLAY_AREA.intersections){
  for(const name of [corner.street,corner.avenue])assert(streets.elements.some(w=>w.tags?.name===name&&w.geometry?.some(p=>p.lat===corner.latitude&&p.lon===corner.longitude)),`${name} uses the same surveyed intersection`);
  const point=localPoint({lat:corner.latitude,lon:corner.longitude});assert(Math.hypot(point.x-corner.position[0],point.y-corner.position[1])<.001);assert.equal(containsPlayArea(point,PLAY_AREA_PLAYER_RADIUS),corner.street!=='West 49th Street');
 }
 for(let i=0;i<4;i++){assert(containsPlayArea(edgePoint(i,1),.32));assert(!containsPlayArea(edgePoint(i,-1)));}
 assert(containsPlayArea([0,0,.17]));assert(!containsPlayArea([NaN,0,0]));
});

test('all four invisible walls stop walking/sprinting/jumping and permit sliding along the edge',()=>{
 for(let i=0;i<4;i++)for(const run of [false,true]){
  const p=new Player(world),n=PLAY_AREA.planes[i].normal;p.position.copy(edgePoint(i,3));
  const yaw=Math.atan2(-n[0],-n[1]),keys=new Set(run?['ArrowUp','ShiftLeft','Space']:['ArrowUp']);
  for(let tick=0;tick<180;tick++){p.update(FIXED_STEP,keys,yaw);assert(containsPlayArea(p.position,.32),'capsule stays inside at every substep/frame');}
  assert(p.speed<.025);assert(p.grounded);assert.equal(p.position.z,0);
  const start=p.position.clone(),tangent=[-n[1],n[0]];
  for(let tick=0;tick<60;tick++)p.update(FIXED_STEP,new Set(['ArrowUp','ShiftLeft']),Math.atan2(tangent[0],tangent[1]));
  assert(p.position.distanceTo(start)>6);assert(containsPlayArea(p.position,.32));
 }
 for(const corner of PLAY_AREA.polygon){const p=new Player(world),target=new Vector3(...corner,0);p.position.copy(constrainPlayArea(target.clone(),2));const d=target.clone().sub(p.position);
  for(let tick=0;tick<180;tick++){p.update(FIXED_STEP,new Set(['ArrowUp','ShiftLeft','Space']),Math.atan2(d.x,d.y));assert(containsPlayArea(p.position,.32));}
 }
});

test('collision separation cannot push the capsule through an invisible boundary',()=>{
 const n=PLAY_AREA.planes[0].normal,p=new Player({...world,resolve:p=>p.add(new Vector3(-n[0],-n[1],0))});p.position.copy(edgePoint(0,1));
 for(let tick=0;tick<60;tick++){p.update(FIXED_STEP,new Set(),0);assert(containsPlayArea(p.position,.32));}
});

test('bus and police loops only use in-area doors and four in-area exits',()=>{
 for(const kind of ['bus','police']){
  const route=TRANSPORT_PORTALS.filter(p=>p.kind===kind),seen=new Set();let next=route[0];
  assert.equal(route.length,kind==='bus'?7:12);
  for(let i=0;i<route.length;i++){assert(!seen.has(next.id));seen.add(next.id);for(const door of next.doors)assert(containsPlayArea(door.approach,.32));for(let slot=0;slot<4;slot++)assert(containsPlayArea(transportArrival(next,slot).state.position,.32));next=TRANSPORT_PORTALS.find(p=>p.id===next.nextId);}
  assert.equal(next.id,route[0].id);
 }
 for(const id of ['police:w40','police:w41','police:w50','police:broadway'])assert(!TRANSPORT_PORTALS.some(p=>p.id===id));
});

test('server corrects plausible out-of-area movement and restores older outside saves without changing other players',async()=>{
 let time=100000;const store=createTestDatabase(),handler=createRoomsHandler({now:()=>time});
 const post=async(path,body)=>{const r=await handler(new Request('https://times.test'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),{DB:store.db});assert.equal(r.status,200);return r.json();};
 const join=async(path,body)=>{const r=await handler(new Request('https://times.test'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),{DB:store.db});assert.equal(r.status,201);return r.json();};
 try{
  const host=await join('/api/rooms',{}),room=host.roomCode,members=[host];for(let i=1;i<4;i++)members.push(await join(`/api/rooms/${room}/join`,{transportAccess:i===2?'police':'pedestrian'}));
  for(const m of members)await post(`/api/rooms/${room}/ready`,{token:m.sessionToken});const start=await post(`/api/rooms/${room}/start`,{token:host.sessionToken});
  const inside={...DEFAULT_ROOM_STATE,position:edgePoint(0,.42).toArray()},outside={...inside,position:edgePoint(0,-.1).toArray()};
  assert(movementCredit(inside,outside,100,1.5)===null,'even a short legal-speed move cannot cross the perimeter');
  store.sql.prepare('UPDATE ts_members SET state=? WHERE player_id=?').run(encodeMovement(inside,null),host.yourId);
  time+=100;const corrected=await post(`/api/rooms/${room}/sync`,{token:host.sessionToken,sequence:10,revision:1,matchId:start.matchId,state:outside});
  const self=corrected.players.find(p=>p.id===host.yourId);assert.deepEqual(self.state.position,inside.position);assert.equal(self.revision,2);
  for(const m of members.slice(1))assert.equal(corrected.players.find(p=>p.id===m.yourId).revision,1);
  // Simulate a position saved before the smaller perimeter existed.
  const legacy=members[2],privateState={...outside,_transport:{access:'police',lastAt:123}};
  store.sql.prepare('UPDATE ts_members SET state=?,state_revision=4,sequence=20 WHERE player_id=?').run(JSON.stringify(privateState),legacy.yourId);
  const resumed=await join(`/api/rooms/${room}/join`,{token:legacy.sessionToken});assert.deepEqual(resumed.self.state,start.players[2].state);assert.equal(resumed.self.revision,5);assert.equal(resumed.players.length,4);assert.equal(resumed.transportAccess,'police');
  assert.deepEqual(transportMetadata(store.sql.prepare('SELECT state FROM ts_members WHERE player_id=?').get(legacy.yourId).state),{access:'police',lastAt:123});
  const stale=await post(`/api/rooms/${room}/sync`,{token:legacy.sessionToken,sequence:21,revision:4,matchId:start.matchId,state:outside});assert.deepEqual(stale.players.find(p=>p.id===legacy.yourId).state,start.players[2].state);
  store.sql.prepare('UPDATE ts_members SET state=? WHERE player_id=?').run(encodeMovement(outside,null),members[1].yourId);
  const restored=await post(`/api/rooms/${room}/sync`,{token:members[1].sessionToken,sequence:22});assert.deepEqual(restored.players.find(p=>p.id===members[1].yourId).state,start.players[1].state);
 }finally{store.close();}
});
