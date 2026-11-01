import test from 'node:test';import assert from 'node:assert/strict';
import {createRoomsHandler} from '../server/rooms.js';
import {transportMetadata,encodeMovement} from '../server/transport.js';
import {TRANSPORT_PORTALS,findTransport,transportArrival} from '../src/transport-config.js';
import {TransportController} from '../src/transport-controller.js';
import {nearTransportDoor} from '../src/transport-rules.js';
import {DEFAULT_ROOM_STATE} from '../src/room-protocol.js';
import {createTestDatabase} from './d1-test-helper.js';

function fixture(){
 let time=100000;const store=createTestDatabase(),handler=createRoomsHandler({now:()=>time}),members=[];let room;
 const post=async(path,body)=>{const response=await handler(new Request('https://times.test'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),{DB:store.db});return {status:response.status,...await response.json()};};
 return {store,post,members,get room(){return room;},advance:ms=>time+=ms,
  async join(access='pedestrian',characterId='explorer'){const member=await post(room?`/api/rooms/${room}/join`:'/api/rooms',{transportAccess:access,characterId});assert.equal(member.status,201);members.push(member);room=member.roomCode;return member;},
  async start(){for(const m of members)await post(`/api/rooms/${room}/ready`,{token:m.sessionToken});return post(`/api/rooms/${room}/start`,{token:members[0].sessionToken});},
  // Seed a legal doorway pose in the test database only, avoiding minutes of
  // cross-city walking. Production has no endpoint accepting spawn targets.
  atDoor(member,portal){const row=store.sql.prepare('SELECT * FROM ts_members WHERE player_id=?').get(member.yourId),position=portal.doors[0].approach,state={...DEFAULT_ROOM_STATE,position:[...position]};store.sql.prepare('UPDATE ts_members SET state=?,pose_at=?,last_seen=?,presence_until=? WHERE player_id=?').run(encodeMovement(state,row.state),time,time,time+25000,member.yourId);return {token:member.sessionToken,matchId:store.sql.prepare('SELECT match_id FROM ts_rooms WHERE code=?').get(room).match_id,revision:row.state_revision,sequence:row.sequence+1,state};},close:()=>store.close()};
}
test('every bus and NYPD route has one next destination, wraps around, and separates all four exits',()=>{
 for(const kind of ['bus','police']){
  const route=TRANSPORT_PORTALS.filter(p=>p.kind===kind);assert.equal(route.length,kind==='bus'?7:12);let current=route[0];const seen=new Set();
  for(let i=0;i<route.length;i++){assert(!seen.has(current.id));seen.add(current.id);assert.equal(findTransport(current.nextId).kind,kind);for(let slot=0;slot<4;slot++){const {state}=transportArrival(current,slot);assert(state.position.every(Number.isFinite));assert.equal(state.speed,0);assert.equal(state.running,false);}current=findTransport(current.nextId);}
  assert.equal(current.id,route[0].id);
  for(const portal of route)for(let i=0;i<4;i++)for(let j=i+1;j<4;j++)assert(Math.hypot(...portal.exits[i].position.map((v,k)=>v-portal.exits[j].position[k]))>.85);
 }
});
test('officers choose NYPD destinations; the server rejects distant, invalid, replayed or concurrent entries',async()=>{
 const f=fixture();try{
  const pedestrian=await f.join('police','tourist'),police=await f.join('pedestrian','officer');await f.join();await f.join();
  assert.equal(pedestrian.self.characterId,'tourist');assert.equal(pedestrian.transportAccess,'pedestrian');assert.equal(police.self.characterId,'pedestrian');assert.equal(police.transportAccess,'police');
  const bus=findTransport('bus:mta-44'),car=findTransport('police:7th-avenue'),path=`/api/rooms/${f.room}/transport`;
  assert.equal((await f.post(path,{...f.atDoor(pedestrian,bus),portalId:bus.id})).code,'TRANSPORT_UNAVAILABLE');await f.start();
  const forbidden=await f.post(path,{...f.atDoor(pedestrian,car),portalId:car.id,transportAccess:'police'});assert.equal(forbidden.code,'TRANSPORT_FORBIDDEN');
  assert.equal((await f.post(path,{...f.atDoor(police,bus),portalId:bus.id})).code,'TRANSPORT_FORBIDDEN');
  const body=f.atDoor(pedestrian,bus);assert.equal((await f.post(path,{...body,portalId:'bus:missing'})).status,400);
  assert.equal((await f.post(path,{...body,portalId:bus.id,state:{...body.state,position:[200,200,20]}})).code,'TRANSPORT_TOO_FAR');
  const bodyCar=f.atDoor(police,car),destination=findTransport('police:station-2');
  for(const destinationId of [undefined,'police:missing',car.id,'bus:big-bus'])assert.equal((await f.post(path,{...bodyCar,portalId:car.id,destinationId})).code,'DESTINATION_REQUIRED');
  const moved=await f.post(path,{...bodyCar,portalId:car.id,destinationId:destination.id,position:[999,999,999],playerId:pedestrian.yourId});
  assert.equal(moved.status,200);assert.equal(moved.transport.destinationId,destination.id);assert.deepEqual(moved.players.find(p=>p.id===police.yourId).state.position,destination.exits[1].position);assert.equal(moved.players.find(p=>p.id===pedestrian.yourId).revision,1);
  assert.equal((await f.post(path,{...bodyCar,portalId:car.id})).code,'TRANSPORT_STALE');
  assert.equal((await f.post(path,{...f.atDoor(police,destination),portalId:destination.id})).code,'TRANSPORT_COOLDOWN');
  const simultaneous=await Promise.all([f.post(path,{...body,portalId:bus.id}),f.post(path,{...body,portalId:bus.id})]);assert.equal(simultaneous.filter(r=>r.status===200).length,1);assert.equal(simultaneous.filter(r=>r.code==='TRANSPORT_STALE').length,1);
  const result=simultaneous.find(r=>r.status===200),self=result.players.find(p=>p.id===pedestrian.yourId),expected=transportArrival(bus,0).state;assert.deepEqual(self.state,expected);
  const stale=await f.post(`/api/rooms/${f.room}/sync`,{...body,sequence:1000,state:{...body.state,_transport:{access:'police',lastAt:0}}});assert.deepEqual(stale.players.find(p=>p.id===pedestrian.yourId).state,expected);
  const current=await f.post(`/api/rooms/${f.room}/sync`,{token:pedestrian.sessionToken,sequence:1001,revision:self.revision,matchId:result.matchId,state:{...expected,_transport:{access:'police',lastAt:0}}});assert.equal(current.transportAccess,'pedestrian');assert.equal('_transport' in current.players[0].state,false);
  const metadata=transportMetadata(f.store.sql.prepare('SELECT state FROM ts_members WHERE player_id=?').get(pedestrian.yourId).state);assert.equal(metadata.access,'pedestrian');assert(metadata.lastAt>0);
  f.advance(2000);const next=findTransport(bus.nextId),nextEntry=await f.post(path,{...f.atDoor(pedestrian,next),portalId:next.id});assert.equal(nextEntry.status,200);assert.equal(nextEntry.transport.destinationId,next.nextId);
  const reset=await f.post(`/api/rooms/${f.room}/respawn`,{token:police.sessionToken});assert.equal(reset.transportAccess,'police');const resume=await f.post(`/api/rooms/${f.room}/join`,{token:police.sessionToken,transportAccess:'pedestrian'});assert.equal(resume.transportAccess,'police');
 }finally{f.close();}
});
test('walking toward a door and E share one transport action; sides, roofs, waiting rooms, wrong access and held input cannot chain teleports',async()=>{
 let time=0,count=0,release;const bus=TRANSPORT_PORTALS.find(p=>p.kind==='bus'),door=bus.doors[0];
 const point=(out,along=0,z=door.ground)=>door.position.map((v,i)=>i===2?z:v+door.normal[i]*out+door.tangent[i]*along),intent=door.normal.map(v=>-v);
 const controller=new TransportController({portals:[bus],clock:()=>time,travel:async()=>{count++;await new Promise(resolve=>release=resolve);}});
 const update=(position=point(.5),input=intent,access='pedestrian',enabled=true)=>controller.update({position,intent:input,access,enabled});
 update(point(.5),intent,'pedestrian',false);update(point(.5),intent,'police');update(point(.5,3));update(point(.5,0,5));update(point(.5),door.normal);assert.equal(count,0);
 const pending=update();assert.equal(count,1);assert(controller.busy);update();await controller.interact();assert.equal(count,1);release();await pending;
 time=1900;update();assert.equal(count,1,'remaining in a doorway requires stepping away');assert(controller.view().needsRelease,'the prompt continues to explain the stepping-away requirement after cooldown');update(point(3),[0,0,0]);assert.equal(controller.view().needsRelease,false);update(point(1.3),[0,0,0]);const explicit=controller.interact();assert.equal(count,2);release();await explicit;
 assert(nearTransportDoor(point(.5),door,{entering:true}));assert(!nearTransportDoor(point(-.5),door));
});
test('police proximity opens the map, never auto-routes; selecting a car travels once with a cooldown',async()=>{
 let time=0,opened=0;const requests=[],cars=TRANSPORT_PORTALS.filter(p=>p.kind==='police'),source=cars[0],destination=cars.at(-1);
 const c=new TransportController({portals:TRANSPORT_PORTALS,clock:()=>time,onChooseDestination:p=>{assert.equal(p.id,source.id);opened++;},travel:async(p,door,id)=>requests.push({source:p.id,destination:id})});
 c.update({position:source.doors[0].approach,intent:source.doors[0].normal.map(v=>-v),access:'police',enabled:true});assert.equal(requests.length,0);
 assert(await c.interact());assert.equal(opened,1);assert.equal(requests.length,0);
 assert.equal(await c.interact(source.id),false);assert.equal(await c.interact('bus:big-bus'),false);
 assert(await c.interact(destination.id));assert.deepEqual(requests,[{source:source.id,destination:destination.id}]);assert.equal(await c.interact(destination.id),false);
 time=2000;c.update({position:destination.doors[0].approach,access:'police',enabled:true});assert(await c.interact(source.id));assert.equal(requests.length,2);
});
test('each playable NYPD car can be selected from every other car, including all 20 player slots',()=>{
 const cars=TRANSPORT_PORTALS.filter(p=>p.kind==='police');for(const source of cars)for(const destination of cars)if(source!==destination)for(let slot=0;slot<20;slot++){
  const arrival=transportArrival(source,slot,destination.id);assert.equal(arrival.destination.id,destination.id);assert.deepEqual(arrival.state.position,destination.exits[slot%4].position);
 }
});
