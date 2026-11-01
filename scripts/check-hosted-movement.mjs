// Four real hosted HTTP clients with independently rendered Cesium avatar
// callbacks. This checks network playback; it does not claim a WebGL playtest.
import assert from 'node:assert/strict';
import {EntityCollection,Event,Matrix4,JulianDate} from 'cesium';
import {Vector3} from 'three';
import {RoomClient} from '../src/room-client.js';
import {RemotePlayers} from '../src/remote-players.js';
import {DEFAULT_ROOM_STATE} from '../src/room-protocol.js';
import {createAvatar} from '../src/avatar.js';
import {toLocal} from '../src/coordinates.js';
const origin='https://times-square-walk.agopakum1.chatgpt.site',authorization=process.env.SITES_SERVICE_AUTHORIZATION;
if(!authorization)throw Error('Missing Site service authorization.');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const fetcher=(path,init)=>fetch(origin+path,{...init,headers:{...init.headers,Origin:origin,'OAI-Sites-Authorization':authorization},redirect:'manual'});
const contexts=['explorer','tourist','pedestrian','commuter'].map(characterId=>({characterId,hidden:true,saved:new Map(),state:{...DEFAULT_ROOM_STATE,position:[...DEFAULT_ROOM_STATE.position]},viewer:{entities:new EntityCollection(),scene:{preRender:new Event()},camera:{inverseViewMatrix:Matrix4.IDENTITY,frustum:{}}}}));
const clients=[];let stopped=false,renderTimer=null,renderError=null,frames=0,maximumFrameSpeed=0,movingFrames=0;
for(const [i,c]of contexts.entries()){
 c.remotes=new RemotePlayers({serverClock:()=>clients[i]?.serverNow(),createAvatar:(get,p)=>createAvatar(c.viewer,get,{characterId:p.characterId,name:`Player ${p.number}`,slot:p.slot})});
 clients.push(new RoomClient({fetcher,storage:{getItem:key=>c.saved.get(key)??null,setItem:(key,value)=>c.saved.set(key,value),removeItem:key=>c.saved.delete(key)},isHidden:()=>c.hidden,getState:()=>c.state,onJoin:self=>c.state={...self.state,position:[...self.state.position]},onSpawn:self=>c.state={...self.state,position:[...self.state.position]},onSnapshot:s=>c.remotes.sync(s,clients[i]?.session?.yourId),setTimer:(fn,ms)=>ms===8000?setTimeout(fn,20000):0,clearTimer:clearTimeout}));
}
const poll=()=>Promise.all(clients.map(c=>c.refresh()));
const previous=contexts.map(()=>new Map());
let lastFrameAt=performance.now();
function render(){
 try{
  const now=performance.now(),dt=(now-lastFrameAt)/1000;lastFrameAt=now;frames++;
  for(const [i,c]of contexts.entries()){
   c.remotes.update(clients[i].serverNow());assert.equal(c.remotes.players.size,3);
   for(const [id,r]of c.remotes.players){
    const p=r.presentation,before=previous[i].get(id),generation=r.track.generation;
    const drawn=new Vector3().copy(toLocal(r.avatar.entity.position.getValue(JulianDate.now())));assert(drawn.distanceTo(p.position)<1e-7);
    if(before&&generation===before.generation&&dt<.75){
     assert(r.playbackTime>=before.time,'a clock correction rewound playback');
     assert(p.gaitPhase>=before.phase-1e-8,'a wrapped packet reversed the gait');
     const speed=p.position.distanceTo(before.position)/dt;maximumFrameSpeed=Math.max(maximumFrameSpeed,speed);assert(speed<13,'a packet caused a catch-up teleport');if(speed>.5)movingFrames++;
    }
    previous[i].set(id,{position:p.position.clone(),phase:p.gaitPhase,time:r.playbackTime,generation});
   }
  }
 }catch(error){renderError??=error;}
}
let pumps=[];
try{
 console.log('Creating four independent hosted movement clients.');await clients[0].create('Movement probe 1',contexts[0].characterId);const room=clients[0].view().roomCode;
 await Promise.all(clients.slice(1).map((c,i)=>c.join(room,`Movement probe ${i+2}`,contexts[i+1].characterId)));await poll();assert(clients[0].view().canStart);await clients[0].startMatch();await poll();assert(clients.every(c=>c.view().canMove));
 const ids=clients.map(c=>c.view().yourId);assert.equal(new Set(ids).size,4);const starts=contexts.map(c=>[...c.state.position]),generations=contexts.map(c=>new Map([...c.remotes.players].map(([id,r])=>[id,r.track.generation])));contexts.forEach(c=>c.hidden=false);
 render();renderTimer=setInterval(render,16);
 pumps=clients.map(async c=>{while(!stopped){const started=performance.now();await c.refresh();await pause(Math.max(0,100-(performance.now()-started)));}});
 console.log('Walking, sprinting, turning, then stopping while all three peers render each player.');
 const started=performance.now(),directions=[[0,1],[1,0],[0,-1],[-1,0]];
 while(performance.now()-started<9000){
  if(renderError)throw renderError;const seconds=(performance.now()-started)/1000;
  const walk=Math.min(seconds,3)*3.2,run=Math.max(0,Math.min(seconds-3,3))*8,moving=seconds<6;
  for(const [i,c]of contexts.entries()){
   const [dx,dy]=directions[i],running=seconds>=3&&moving;
   c.state={...c.state,position:[starts[i][0]+dx*walk-dy*run,starts[i][1]+dy*walk+dx*run,starts[i][2]],heading:running?Math.atan2(-dy,dx):Math.atan2(dx,dy),speed:moving?(running?8:3.2):0,running,runBlend:running?1:0,poseWeight:moving?1:0,airBlend:0,gaitPhase:(walk*2.5+run*1.75)%(Math.PI*2),animationTime:seconds};
  }
  await pause(16);
 }
 const deadline=Date.now()+15000;
 while(!contexts.every((c,i)=>[...c.remotes.players].every(([id,r])=>r.presentation.position.distanceTo(new Vector3(...contexts[ids.indexOf(id)].state.position))<.015&&r.presentation.poseWeight<.01))){if(renderError)throw renderError;assert(Date.now()<deadline,'remote players did not converge to stopped positions');await pause(100);}
 stopped=true;await Promise.all(pumps);if(renderError)throw renderError;
 assert(frames>100&&movingFrames>100,JSON.stringify({frames,movingFrames,maximumFrameSpeed,clients:clients.map((c,i)=>({phase:c.phase,rtt:c.rtt,notice:c.notice,position:contexts[i].state.position,remotes:[...contexts[i].remotes.players.values()].map(r=>({samples:r.track.samples.length,delay:r.track.delay,generation:r.track.generation}))}))}));assert(clients.every(c=>c.view().players.length===4&&c.view().canMove));assert(contexts.every((c,i)=>[...c.remotes.players].every(([id,r])=>r.track.generation===generations[i].get(id))),'legal walking/sprinting must not be treated as a teleport');
 console.log(`PASS: four hosted clients; ${frames} rendered frames; ${movingFrames} moving peer frames; steady walk/run gait; clock corrections cannot rewind playback; all stopped positions converge; maximum frame speed ${maximumFrameSpeed.toFixed(2)} m/s.`);
}finally{
 stopped=true;if(renderTimer)clearInterval(renderTimer);await Promise.allSettled(pumps);await Promise.allSettled(clients.map(c=>c.leave()));clients.forEach(c=>c.stop());contexts.forEach(c=>c.remotes.clear());
}
