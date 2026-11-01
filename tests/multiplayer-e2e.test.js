import './helpers/loaded-rigs.js';
import test from 'node:test';import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Vector3} from 'three';
import {EntityCollection,Event,Matrix4,JulianDate} from 'cesium';
import {createLocalServer} from '../server/local.mjs';
import {Player,FIXED_STEP} from '../src/player.js';
import {ThirdPersonCamera} from '../src/camera.js';
import {CollisionWorld} from '../src/collision.js';
import {makeStreetLayout} from '../src/street-layout.js';
import {RoomClient} from '../src/room-client.js';
import {RemotePlayers} from '../src/remote-players.js';
import {createAvatar} from '../src/avatar.js';
import {canControlLocalPlayer,canShowLocalPlayer,createPlayerSession} from '../src/player-session.js';
import {playerState} from '../src/room-protocol.js';
import {spawnState} from '../server/match-rules.js';
import {toLocal} from '../src/coordinates.js';
import {tabStorage} from './tab-test-helper.js';
import {TRANSPORT_PORTALS,findTransport,transportArrival} from '../src/transport-config.js';
import {placeTransportArrival} from '../src/player-transport.js';
import {TransportController} from '../src/transport-controller.js';
import {encodeMovement} from '../server/transport.js';
import {observedPerson} from '../src/witness-selection.js';
import {CALL_COOLDOWN} from '../src/dispatch-rules.js';

test('real HTTP solo → waiting room → four controllers/cameras → movement → door transport → leave/reload/replacement',async t=>{
 let serverTime=100_000,renderTime=serverTime;const nativeFetch=globalThis.fetch.bind(globalThis);
 t.mock.method(globalThis,'fetch',(url,init)=>typeof url==='string'&&url.startsWith('/')?readFile(new URL('../public'+url,import.meta.url)).then(bytes=>new Response(bytes)):nativeFetch(url,init));
 const manifest=JSON.parse(await readFile(new URL('../public/data/nyc/manifest.json',import.meta.url))),world=new CollisionWorld(manifest.files);
 const layout=makeStreetLayout(JSON.parse(await readFile(new URL('../public/data/streets-osm.json',import.meta.url))));
 const details=JSON.parse(await readFile(new URL('../public/data/street-details.json',import.meta.url))),poles=new Map(details.poles.map(p=>[p.id,p.position]));
 layout.signals=layout.signals.filter(s=>poles.has(s.id));for(const signal of layout.signals)signal.position.fromArray(poles.get(signal.id));
 const modules=['plaza','streetscape','storefront','nypd-plaza','nasdaq','street-vendor','hard-rock-food','recruiting','lyric','bus','police-vehicle','port-authority','cinema','attractions','avenue','north42','south42-transit','five-times','east42','broadway-retail','district'];
 for(const id of modules){const module=await import(`../src/${id}-geometry.js`),create=Object.entries(module).find(([name])=>/^create.*Geometry$/.test(name))[1];world.addStatic(id,create().collision);}
 const streets=await import('../src/street-detail-geometry.js'),bollards=await import('../src/curb-bollard-geometry.js');
 world.addStatic('sidewalks',streets.createSidewalkGeometry(layout).collision);world.addStatic('signals',streets.createSignalGeometry(layout).collision);world.addStatic('bollards',bollards.createCurbBollardGeometry(layout).collision);
 await world.stream(new Vector3());
 for(let slot=0;slot<4;slot++){const point=new Vector3(...spawnState(slot).position),resolved=world.resolve(point.clone());assert(resolved.clone().sub(point).setZ(0).length()<.01,`Player ${slot+1} spawn must be outside all real buildings/furniture`);}
 const app=await createLocalServer({host:'127.0.0.1',port:0,databasePath:':memory:',now:()=>serverTime,chooseRole:()=>0}),origin=`http://127.0.0.1:${app.port}`;
 const fixtures=Array.from({length:4},()=>{
  const player=new Player(world),viewer={entities:new EntityCollection(),scene:{preRender:new Event()},camera:{inverseViewMatrix:Matrix4.IDENTITY,frustum:{},setView(view){this.lastView=view;}}};
  const camera=new ThirdPersonCamera(viewer,world);camera.yaw=0;const local=createAvatar(viewer,()=>player,{show:()=>canShowLocalPlayer(camera)});
  const remotes=new RemotePlayers({clock:()=>renderTime,createAvatar:(get,info)=>{const avatar=createAvatar(viewer,get,{characterId:info.characterId,name:`Player ${info.number}`,slot:info.slot});avatar.setDebugPlayer(info.slot);return avatar;}});
  return {player,viewer,camera,local,remotes,storage:tabStorage()};
 });
 const make=f=>{
  const presentation=createPlayerSession({debugPlayers:true,localAvatar:f.local,remotePlayers:f.remotes,prepareSpawn:async(self,snapshot)=>{if(snapshot?.transport?.playerId===self.id)return placeTransportArrival({player:f.player,camera:f.camera,collision:world,state:self.state});f.player.reset();f.player.position.fromArray(self.state.position);f.player.heading=self.state.heading;f.player.snapPresentation();}});
  return new RoomClient({fetcher:(path,init)=>nativeFetch(origin+path,{...init,headers:{...init.headers,Origin:origin}}),getState:()=>playerState(f.player),storage:f.storage,setTimer:()=>0,clearTimer:()=>{},onJoin:presentation.onJoin,onSpawn:presentation.onSpawn,onSnapshot:s=>presentation.onSnapshot(s,f.client?.session?.yourId)});
 };
 const clients=fixtures.map(f=>f.client=make(f));
 // Render independently of the 10 Hz network updates, as each browser does.
 const renderRemotes=()=>{const until=Math.max(serverTime,renderTime+1000/60);while(renderTime<until){renderTime=Math.min(until,renderTime+1000/60);for(const f of fixtures)f.remotes.update(serverTime+200);}};
 try{
  const displayTime=JulianDate.now();
  for(const f of fixtures){
   assert(f.local.entity.model.show.getValue(displayTime),'the selected character is visible before joining a room');
   const start=f.player.position.clone();
   for(let tick=0;tick<6;tick++)f.player.update(FIXED_STEP,canControlLocalPlayer(f.client.view())?new Set(['ArrowUp']):new Set(),f.camera.yaw);
   assert(f.player.position.y>start.y,'solo exploration works without starting a multiplayer match');
  }
  await clients[0].create('Host','tourist');const code=clients[0].view().roomCode;assert.equal(clients[0].view().players.length,1);
  for(let i=1;i<4;i++){await clients[i].join(code,'Guest '+i,'explorer',i===2?'police':'pedestrian');await clients[0].tick();assert.equal(clients[0].view().players.length,i+1);}
  await Promise.all(clients.map(c=>c.tick()));
  assert(clients.every(c=>!c.view().canMove));
  fixtures.forEach((f,i)=>{
   assert.deepEqual(f.player.position.toArray(),spawnState(i).position,'waiting-room previews use separate server-assigned positions');
   assert(f.local.entity.model.show.getValue(displayTime),'the waiting-room player stays visible');
   assert.equal(f.remotes.players.size,3,'all three joined players are visible before START MATCH');
   assert.equal(f.viewer.entities.values.length,8,'four character models and four labels in the waiting room');
   const start=f.player.position.clone();
   for(let tick=0;tick<6;tick++)f.player.update(FIXED_STEP,canControlLocalPlayer(f.client.view())?new Set(['ArrowUp']):new Set(),f.camera.yaw);
   assert(f.player.position.clone().sub(start).setZ(0).length()<1e-10,'waiting-room movement remains locked');
   f.camera.distanceToPlayer=.4;assert.equal(f.local.entity.model.show.getValue(displayTime),false,'close camera still avoids showing the inside of a character');
   f.camera.distanceToPlayer=5.5;assert.equal(f.local.entity.model.show.getValue(displayTime),true);
  });
  await assert.rejects(()=>clients[2].startMatch(),/Only the host/);assert(clients[0].view().canStart);
  await clients[0].startMatch();await Promise.all(clients.slice(1).map(c=>c.tick()));
  assert(clients.every(c=>c.view().canMove));const ids=clients.map(c=>c.view().yourId);assert.equal(new Set(ids).size,4);
  fixtures.forEach((f,i)=>{assert.deepEqual(f.player.position.toArray(),spawnState(i).position);assert.equal(f.remotes.players.size,3);assert.equal(f.viewer.entities.values.length,8);});
  const starts=fixtures.map(f=>f.player.position.clone());fixtures[1].camera.orbit(120,30);assert.equal(fixtures[0].camera.yaw,0);assert.equal(fixtures[2].camera.yaw,0);
  for(let frame=0;frame<20;frame++){
   for(let i=0;i<4;i++){const f=fixtures[i],keys=new Set(i===2?['ArrowRight']:i===3?['KeyW','ShiftLeft']:['ArrowUp']);for(let tick=0;tick<6;tick++)f.player.update(FIXED_STEP,keys,f.camera.yaw);f.camera.update(f.player);}
   serverTime+=100;await Promise.all(clients.map(c=>c.tick()));renderRemotes();
  }
  await Promise.all(clients.map(c=>c.tick()));assert(fixtures[0].player.position.y>starts[0].y+5);assert(fixtures[2].player.position.x>starts[2].x+5);
  const time=JulianDate.now();
  for(let i=0;i<4;i++){
   const f=fixtures[i];f.remotes.update(serverTime+200);
   for(let j=0;j<4;j++){
    const peer=clients[i].view().players.find(p=>p.id===ids[j]);assert(peer);assert(new Vector3(...peer.state.position).distanceTo(fixtures[j].player.position)<1e-7);assert.equal('camera' in peer,false);
    if(i!==j){const remote=f.remotes.players.get(ids[j]),drawn=new Vector3().copy(toLocal(remote.avatar.entity.position.getValue(time)));assert(drawn.distanceTo(remote.presentation.position)<1e-7,'Cesium draws the buffered pose');assert(drawn.distanceTo(fixtures[j].player.position)<12*remote.track.delay/1000+.1,'remote remains within its bounded playback delay');assert.equal(remote.avatar.label.label.text.getValue(time),`Player ${j+1}`);}
   }
   assert(new Vector3().copy(toLocal(f.viewer.camera.lastView.destination)).distanceTo(f.player.position)<10,'camera follows its own player');
  }
  // Four actual controllers jump together; all HTTP peers and Cesium avatar
  // adapters receive the height and airborne pose, with independent cameras.
  for(const f of fixtures)for(let tick=0;tick<20;tick++)f.player.update(FIXED_STEP,new Set(),f.camera.yaw);
  serverTime+=20*FIXED_STEP*1000;await Promise.all(clients.map(c=>c.tick()));
  const jumpStarts=fixtures.map(f=>f.player.position.clone()),jumpCameras=fixtures.map(f=>[f.camera.yaw,f.camera.pitch,f.camera.distance]);
  for(let frame=0;frame<12;frame++){
   for(const f of fixtures){for(let tick=0;tick<6;tick++)f.player.update(FIXED_STEP,new Set(['Space']),f.camera.yaw);f.camera.update(f.player);}
   serverTime+=100;await Promise.all(clients.map(c=>c.tick()));renderRemotes();
   if(frame===2)for(let i=0;i<4;i++){
    const f=fixtures[i];f.remotes.update(serverTime+200);
    for(let j=0;j<4;j++){
     const peer=clients[i].view().players.find(p=>p.id===ids[j]);assert(peer.state.position[2]>jumpStarts[j].z+.6);assert.equal(peer.state.airBlend,1);
     if(i!==j){const remote=f.remotes.players.get(ids[j]),drawn=toLocal(remote.avatar.entity.position.getValue(time));assert(Math.abs(drawn.z-remote.presentation.position.z)<1e-7,'Cesium draws the smoothed airborne pose');assert(drawn.z>jumpStarts[j].z+.5,'remote avatar is visibly raised by the synchronized jump');}
    }
   }
  }
  for(let i=0;i<4;i++){assert(fixtures[i].player.grounded);assert.equal(fixtures[i].player.airBlend,0);assert(Math.abs(fixtures[i].player.position.z-jumpStarts[i].z)<.002);assert.deepEqual([fixtures[i].camera.yaw,fixtures[i].camera.pitch,fixtures[i].camera.distance],jumpCameras[i]);}
  // Only the two pedestrian witnesses send locations to Manson; the thief
  // has the same civilian appearance but cannot send a report.
  const callCameras=fixtures.map(f=>[f.camera.yaw,f.camera.pitch,f.camera.distance]),callPositions=fixtures.map(f=>f.player.position.clone());
  assert.deepEqual(clients.map(c=>c.view().transportAccess),['pedestrian','pedestrian','police','pedestrian']);
  await assert.rejects(()=>clients[0].call911(ids[3]),e=>e.code==='CALL_FORBIDDEN');
  await Promise.all([clients[1].call911(ids[3]),clients[3].call911(ids[1])]);await Promise.all(clients.map(c=>c.tick()));
  assert.equal(clients[2].view().dispatchCalls.length,2);await assert.rejects(()=>clients[2].call911(),e=>e.code==='CALL_FORBIDDEN');
  for(let i=0;i<4;i++){
   assert(fixtures[i].player.position.distanceTo(callPositions[i])<1e-8,'sending/receiving a call never moves another controller');
   assert.deepEqual([fixtures[i].camera.yaw,fixtures[i].camera.pitch,fixtures[i].camera.distance],callCameras[i],'dispatch never moves a camera');
   if(i!==2){assert.equal(clients[i].view().dispatchCalls.length,0);if(i===0)assert.equal(clients[i].view().yourCall,null);else{assert.deepEqual(clients[i].view().yourCall.position,callPositions[i===3?1:3].toArray());assert(!('suspectId' in clients[i].view().yourCall));}}
  }
  // Real controller approaches + real HTTP transport, with a mixed-access
  // room. Test-only SQL puts each player beside a door; there is no arbitrary
  // spawn/teleport target endpoint in the production API.
  const sources=clients.map((c,i)=>findTransport(i===2?'police:7th-avenue':'bus:mta-44'));
  for(let i=0;i<4;i++){
   const row=app.store.sql.prepare('SELECT state FROM ts_members WHERE player_id=?').get(ids[i]),door=sources[i].doors[0];
   app.store.sql.prepare("UPDATE ts_members SET state=json_set(?,'$._dispatch',json_extract(state,'$._dispatch')),state_revision=state_revision+1,sequence=sequence+1,pose_at=? WHERE player_id=?").run(encodeMovement({...playerState(fixtures[i].player),position:door.approach,speed:0,running:false},row.state),serverTime,ids[i]);
  }
  await Promise.all(clients.map(c=>c.tick()));
  const cameraSettings=fixtures.map(f=>({yaw:f.camera.yaw,pitch:f.camera.pitch,distance:f.camera.distance})),before=fixtures.map(f=>f.player.position.clone());
  let portalPending;
  const first=fixtures[0],door=sources[0].doors[0],entry=new TransportController({portals:TRANSPORT_PORTALS,travel:source=>clients[0].transport(source.id)});
  for(let tick=0;tick<40&&!portalPending;tick++){
   first.player.update(FIXED_STEP,new Set(['ArrowUp']),Math.atan2(-door.normal[0],-door.normal[1]));serverTime+=FIXED_STEP*1000;
   portalPending=entry.update({position:first.player.position.toArray(),intent:door.normal.map(v=>-v),access:'pedestrian',enabled:true});
  }
  assert(portalPending,'walking into the actual bus door starts travel');await portalPending;
  assert.deepEqual(first.player.position.toArray(),transportArrival(sources[0],0).state.position);
  fixtures.slice(1).forEach((f,i)=>assert(f.player.position.distanceTo(before[i+1])<1e-8,'another player transport never moves your controller'));
  await Promise.all(clients.slice(1).map((c,i)=>c.transport(sources[i+1].id,sources[i+1].kind==='police'?sources[i+1].nextId:null)));await Promise.all(clients.map(c=>c.tick()));
  for(let i=0;i<4;i++){
   const expected=transportArrival(sources[i],i).state.position,f=fixtures[i];assert.deepEqual(f.player.position.toArray(),expected);assert.equal(f.player.speed,0);assert.equal(f.player.velocityZ,0);
   assert.deepEqual({yaw:f.camera.yaw,pitch:f.camera.pitch,distance:f.camera.distance},cameraSettings[i],'transport keeps only this client camera settings');
   f.remotes.update(serverTime+250);
   for(let j=0;j<4;j++){const target=transportArrival(sources[j],j).state.position,peer=clients[i].view().players.find(p=>p.id===ids[j]);assert.deepEqual(peer.state.position,target);if(i!==j)assert(f.remotes.players.get(ids[j]).presentation.position.distanceTo(new Vector3(...target))<1e-8,'remote snaps to an approved arrival rather than walking through city blocks');}
   assert(new Vector3().copy(toLocal(f.viewer.camera.lastView.destination)).distanceTo(f.player.position)<10,'camera follows only its own arriving character');
  }
  assert(fixtures[0].player.position.distanceTo(fixtures[1].player.position)>.85);assert(fixtures[1].player.position.distanceTo(fixtures[3].player.position)>.85);
  assert.equal(clients[2].view().dispatchCalls.length,2,'bus travel preserves active 911 alerts at their original locations');
  await assert.rejects(()=>clients[2].transport('bus:mta-44'),/Police officers/);
  await clients[3].leave();await Promise.all(clients.slice(0,3).map(c=>c.tick()));assert(clients.slice(0,3).every(c=>c.view().players.length===3&&c.view().canMove));assert(fixtures.slice(0,3).every(f=>f.remotes.players.size===2));assert(canControlLocalPlayer(clients[3].view()),'leaving a room restores solo exploration');assert(fixtures[3].local.entity.model.show.getValue(displayTime));assert.equal(fixtures[3].remotes.players.size,0,'leaving removes remote avatars');
  const id=ids[1],position=fixtures[1].player.position.clone();clients[1].stop();clients[1]=fixtures[1].client=make(fixtures[1]);assert(await clients[1].restore());assert.equal(clients[1].view().yourId,id);assert(fixtures[1].player.position.distanceTo(position)<1e-7);
  await clients[3].join(code,'Replacement','explorer');assert.equal(clients[3].view().playerNumber,4);assert.deepEqual(fixtures[3].player.position.toArray(),spawnState(3).position);
  await Promise.all(clients.map(c=>c.tick()));assert(clients.every(c=>c.view().players.length===4));
  const fifth=new RoomClient({fetcher:(path,init)=>nativeFetch(origin+path,init),setTimer:()=>0,clearTimer:()=>{}});await assert.rejects(()=>fifth.join(code,'Fifth','explorer'),/four players/);fifth.stop();
  const firstRevision=clients[2].view().players.find(p=>p.id===ids[0]).revision;
  const reset=await clients[2].resetSpawn();assert.deepEqual(fixtures[2].player.position.toArray(),spawnState(2).position);assert.equal(reset.players.find(p=>p.id===ids[0]).revision,firstRevision);
  // Actual third-person camera and real city colliders select the executive.
  // R captures a server observation; a later call reports that point, even
  // after the other controller moves. It never reports the person's identity.
  await Promise.all(clients.map(c=>c.resetSpawn()));serverTime+=CALL_COOLDOWN+1000;await Promise.all(clients.map(c=>c.refresh()));
  const witness=fixtures[1],suspect=fixtures[3];witness.camera.yaw=0;witness.camera.pitch=0;witness.camera.update(witness.player);witness.remotes.update(serverTime+250);
  const selected=observedPerson({selfId:clients[1].view().yourId,position:witness.player.position,cameraPosition:witness.camera.position,cameraDirection:witness.camera.direction,collision:world,people:[...witness.remotes.players].map(([id,r])=>({id,characterId:r.characterId,position:r.presentation.position}))});
  assert(selected,'a visible person is selected by the real game camera');assert.equal(selected.playerId,clients[3].view().yourId);assert.equal(selected.description,'Male · dark suit · beard');
  const observation=(await clients[1].observeSuspect(selected.playerId)).yourObservation;assert(observation);const lastSeen=[...observation.position];
  for(let tick=0;tick<30;tick++)suspect.player.update(FIXED_STEP,new Set(['KeyW']),0);serverTime+=500;await Promise.all(clients.map(c=>c.refresh()));assert(suspect.player.position.distanceTo(new Vector3(...lastSeen))>.2);
  const report=(await clients[1].call911(selected.playerId)).yourCall;await clients[2].refresh();assert.deepEqual(report.position,lastSeen);assert.equal(report.lastSeenAt,observation.createdAt);
  const received=clients[2].view().dispatchCalls.find(c=>c.id===report.id);assert(received);assert.equal(received.description,'Male · dark suit · beard');assert.equal(received.number,2);assert(!('suspectId' in received));assert(!('role' in received));assert.match(received.location,/W 4[2-9]/);
  assert.equal(clients[0].view().dispatchCalls.length,0);assert.equal(clients[3].view().dispatchCalls.length,0);
 }finally{
  await Promise.allSettled(clients.map(c=>c.leave()));clients.forEach(c=>c.stop());for(const f of fixtures){f.remotes.clear();f.local.destroy();}await app.close();
 }
});
