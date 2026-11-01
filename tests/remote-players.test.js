import test from 'node:test';import assert from 'node:assert/strict';
import {RemoteTrack,RemotePlayers} from '../src/remote-players.js';
import {DEFAULT_ROOM_STATE} from '../src/room-protocol.js';
import {locomotionPose} from '../src/locomotion-pose.js';
const player=(id,sequence,time,x=0,heading=0)=>({id,sequence,updatedAt:time,characterId:'explorer',name:id,slot:0,state:{...DEFAULT_ROOM_STATE,position:[x,0,.17],heading,gaitPhase:heading}});
test('remote positions and walk/run poses interpolate between snapshots without extrapolating into obstacles',()=>{
 const track=new RemoteTrack();track.push(player('a',1,1000,0));track.push({...player('a',2,1100,1),state:{...player('a',2,1100,1).state,runBlend:1,poseWeight:1,speed:8}});
 const middle=track.sample(1050);assert.equal(middle.position.x,.5);assert.equal(middle.runBlend,.5);assert.equal(middle.poseWeight,.5);assert.equal(track.sample(5000).position.x,1);assert.equal(track.sample(0).position.x,0);
});
test('remote turns and gait wrap smoothly; stale updates are ignored and landmark teleports snap',()=>{
 const track=new RemoteTrack();track.push(player('a',1,1000,0,3.1));track.push(player('a',2,1100,1,-3.1));assert(Math.abs(track.sample(1050).heading)>3);track.push(player('a',1,1200,-2));assert.equal(track.sample(1300).position.x,1);
 track.push(player('a',3,1300,50));assert.equal(track.sample(1150).position.x,50);
});
test('a newer movement sequence in the same millisecond replaces its earlier sample',()=>{
 const track=new RemoteTrack();track.push(player('a',1,1000,0));track.push(player('a',2,1000,1));
 assert.equal(track.samples.length,1);assert.equal(track.sample(1000).position.x,1);
 track.push(player('a',3,999,2));assert.equal(track.sample(1000).position.x,1);
});
test('a four-player snapshot renders exactly three independent remote avatars and removes departed players',()=>{
 let destroyed=0;const created=[],manager=new RemotePlayers({createAvatar:(get,info)=>{created.push({get,info});return {lighting:{setFaces(){}},select(){},destroy(){destroyed++;}};}});
 manager.sync({players:['a','b','c','d'].map(id=>player(id,1,1000))},'a');assert.equal(manager.players.size,3);assert.deepEqual(created.map(r=>r.info.id),['b','c','d']);
 manager.sync({players:['a','b','c','d'].map((id,i)=>player(id,2,1100,i))},'a');manager.update(1200);assert.equal(created[0].get().position.x,.5);assert.equal(created[2].get().position.x,1.5);
 manager.sync({players:[player('a',3,1200),player('b',3,1200)]},'a');assert.equal(manager.players.size,1);assert.equal(destroyed,2);manager.clear();assert.equal(destroyed,3);
});

test('match expiry stops remote walk/run poses even if a background player has not sent a new sequence',()=>{
 const manager=new RemotePlayers({createAvatar:()=>({lighting:{setFaces(){}},select(){},destroy(){}})});
 const running={...player('b',1,1000,4),state:{...DEFAULT_ROOM_STATE,position:[4,0,.17],speed:8,running:true,poseWeight:1,runBlend:1}};
 manager.sync({matchPhase:'playing',players:[running]},'a');manager.update(1200);assert.equal(manager.players.get('b').presentation.speed,8);
 manager.sync({matchPhase:'ended',players:[running]},'a');manager.update(1300);
 const pose=manager.players.get('b').presentation;assert.equal(pose.speed,0);assert.equal(pose.running,false);assert.equal(pose.poseWeight,0);assert.equal(pose.runBlend,0);assert.deepEqual(pose.position.toArray(),[4,0,.17]);
 manager.clear();
});

test('a late sprint advances its step cycle forward instead of taking the shortest reverse angle',()=>{
 const track=new RemoteTrack(),a=player('b',1,1000),b=player('b',2,1400,3.2);
 a.state.gaitPhase=1;b.state.gaitPhase=6.6%(Math.PI*2);
 track.push(a);track.push(b);
 let phase=track.sample(1000).gaitPhase;
 for(let time=1010;time<1400;time+=10){const next=track.sample(time).gaitPhase;assert(next>=phase);phase=next;}
 assert(Math.abs(track.sample(1200).gaitPhase-3.8)<1e-10);
});

test('delayed legal sprints stay interpolated while revisions and impossible movement snap',()=>{
 const track=new RemoteTrack();track.push({...player('b',1,1000),revision:1});
 track.push({...player('b',2,1600,4.8),revision:1});assert.equal(track.samples.length,2);assert.equal(track.generation,0);assert.equal(track.sample(1300).position.x,2.4);
 track.push({...player('b',3,1700,5),revision:2});assert.equal(track.samples.length,1);assert.equal(track.generation,1);assert.equal(track.sample(1500).position.x,5);
 track.push({...player('b',4,1800,-20),revision:1});assert.equal(track.sample(2000).position.x,5,'an older authoritative revision cannot resurrect a pre-transport pose');
 track.push({...player('b',4,1800,50),revision:2});assert.equal(track.generation,2);assert.equal(track.sample(1600).position.x,50);
});

test('server-forced idle poses replace the same sequence without keeping a frozen sprint',()=>{
 const track=new RemoteTrack(),a=player('b',1,1000);Object.assign(a.state,{speed:8,running:true,runBlend:1,poseWeight:1});track.push(a);
 track.push({...a,state:{...a.state,speed:0,running:false,runBlend:0,poseWeight:0}});
 assert.equal(track.samples.length,1);assert.equal(track.sample(1100).speed,0);assert.equal(track.sample(1100).poseWeight,0);
});

const avatar=()=>({lighting:{setFaces(){}},select(){},destroy(){}});
test('the playback buffer includes packet age at receipt as well as source update spacing',()=>{
 const manager=new RemotePlayers({clock:()=>0,serverClock:()=>1300,createAvatar:avatar});
 manager.sync({serverTime:1100,players:[player('b',1,1100)]},'a');
 assert.equal(manager.players.get('b').track.delay,325,'the receiving client latency is part of the buffer');
 manager.sync({serverTime:1200,players:[player('b',2,1200,.32)]},'a');
 assert(manager.players.get('b').track.delay>300,'latency spikes fade out gradually instead of repeatedly emptying the buffer');
});
for(const fps of [30,60,120])test(`remote walking/sprinting survives irregular packets and clock corrections at ${fps} FPS`,()=>{
 let now=0,estimateOffset=0;const manager=new RemotePlayers({clock:()=>now,createAvatar:avatar});
 const distance=t=>3.2*Math.min(t,2500)/1000+8*Math.max(0,Math.min(t-2500,3000))/1000;
 const actors=(sequence,t)=>['a','b','c','d'].map((id,i)=>{
  const x=distance(t)+i*2,running=t>=2500&&t<5500,moving=t<5500,p=player(id,sequence,1000+t,x,.4);
  Object.assign(p.state,{speed:moving?(running?8:3.2):0,running,runBlend:running?1:0,poseWeight:moving?1:0,gaitPhase:(distance(t)*(running?1.75:2.5))%(Math.PI*2),animationTime:t/1000});return p;
 });
 manager.sync({matchPhase:'playing',serverTime:1000,players:actors(1,0)},'a');manager.update(1000);
 const gaps=[100,150,100,250,350,100,200,300,100,600],latencies=[60,180,40,120,200,80];
 const deliveries=[];let t=0,sequence=1;
 while(t<6500){t=Math.min(6500,t+gaps[sequence%gaps.length]);sequence++;deliveries.push({at:t+latencies[sequence%latencies.length],sequence,t});}
 deliveries.sort((a,b)=>a.at-b.at);let index=0,movingFrames=0,maxStep=0;
 const previous=new Map([...manager.players].map(([id,r])=>[id,{x:r.presentation.position.x,phase:r.presentation.gaitPhase,animation:r.presentation.animationTime,pose:locomotionPose(r.presentation),time:r.playbackTime}]));
 for(now=1000/fps;now<9000;now+=1000/fps){
  while(index<deliveries.length&&deliveries[index].at<=now){const d=deliveries[index++];manager.sync({matchPhase:'playing',serverTime:1000+d.t+40,players:actors(d.sequence,d.t)},'a');estimateOffset=[-180,150,-70,90][index%4];}
  manager.update(1000+now+estimateOffset);assert.equal(manager.players.size,3);
  for(const [id,r]of manager.players){
   const state=r.presentation,before=previous.get(id),step=state.position.x-before.x,pose=locomotionPose(state);
   assert(step>=-1e-9,'clock corrections must not rewind the character');assert(r.playbackTime>=before.time,'playback time must remain monotonic');
   assert(step<=8*1.12/fps+1e-8,`packet arrival must not jump the character: ${step}`);
   assert(state.gaitPhase>=before.phase-1e-9,'legs must never run backward at a phase wrap');
   assert(state.gaitPhase-before.phase<=step*2.5+1e-8,'steps follow displayed distance');
   assert(Math.abs(state.animationTime-before.animation-1/fps)<1e-8,'pose clock advances between packets');
   for(const joint of ['LeftLeg','RightLeg','LeftKnee','RightKnee','LeftArm','RightArm'])assert(Math.abs(pose.angles[joint]-before.pose.angles[joint])<24/fps,`${joint} must not pop between frames`);
   assert(state.position.x<=r.track.samples.at(-1).position.x+1e-9,'no extrapolation through unconfirmed obstacles');
   if(step>.005)movingFrames++;maxStep=Math.max(maxStep,step);previous.set(id,{x:state.position.x,phase:state.gaitPhase,animation:state.animationTime,pose,time:r.playbackTime});
  }
 }
 assert(movingFrames>fps*3,'the replay must include actual walking and sprinting');assert(maxStep>.015);
 for(const [id,r]of manager.players){assert(Math.abs(r.presentation.position.x-(distance(6500)+['a','b','c','d'].indexOf(id)*2))<1e-7);assert(r.presentation.poseWeight<.001,'stopped players settle to idle');}
});

test('a stalled connection fades to idle, then resumes without a catch-up teleport',()=>{
 let now=0;const manager=new RemotePlayers({clock:()=>now,createAvatar:avatar});
 const push=(sequence,time,x)=>{const p=player('b',sequence,time,x);Object.assign(p.state,{speed:8,running:true,runBlend:1,poseWeight:1});manager.sync({matchPhase:'playing',serverTime:time,players:[p]},'a');};
 push(1,1000,0);manager.update(1000);push(2,1100,.8);
 for(now=16;now<=1500;now+=16)manager.update(1000+now);
 const stopped=manager.players.get('b').presentation;assert.equal(stopped.position.x,.8);assert(stopped.poseWeight<.001);assert.equal(stopped.speed,0);
 push(3,2500,4);let previous=stopped.position.x;
 for(let i=0;i<120;i++){now+=16;manager.update(1000+now);const x=manager.players.get('b').presentation.position.x;assert(x>=previous);assert(x-previous<.15);previous=x;}
 assert(Math.abs(previous-4)<1e-8);
});

test('approved transport snaps immediately and discarded pre-transport packets cannot rewind the avatar',()=>{
 let now=0;const manager=new RemotePlayers({clock:()=>now,createAvatar:avatar});
 manager.sync({matchPhase:'playing',players:[{...player('b',1,1000),revision:1}]},'a');manager.update(1000);
 now=16;manager.sync({matchPhase:'playing',players:[{...player('b',2,1100,40),revision:2}]},'a');manager.update(1016);
 assert.equal(manager.players.get('b').presentation.position.x,40);
 now=32;manager.sync({matchPhase:'playing',players:[{...player('b',3,1200,1),revision:1}]},'a');manager.update(1032);
 assert.equal(manager.players.get('b').presentation.position.x,40);
});

test('bunched server receipt timestamps cannot accelerate a buffered sprint into a teleport',()=>{
 let now=0;const manager=new RemotePlayers({clock:()=>now,createAvatar:avatar});
 const push=(sequence,time,x)=>{const p=player('b',sequence,time,x);Object.assign(p.state,{speed:8,running:true,runBlend:1,poseWeight:1});manager.sync({matchPhase:'playing',serverTime:time,players:[p]},'a');};
 push(1,1000,0);manager.update(1000);push(2,1400,3.2);push(3,1410,4.7);push(4,1610,6.3);
 let previous=0;
 for(now=1000/60;now<2000;now+=1000/60){manager.update(1000+now);const x=manager.players.get('b').presentation.position.x;assert(x>=previous);assert(x-previous<=10/60+1e-8,'a compressed segment stays below the presentation speed limit');previous=x;}
 assert(Math.abs(previous-6.3)<1e-8,'the speed limit still catches up to the accepted stopped position');
});
