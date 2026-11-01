import {Vector3} from 'three';
const TAU=Math.PI*2;
const lerp=(a,b,t)=>a+(b-a)*t;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const angle=(a,b,t)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*t;
// A step cycle advances forward, even when a delayed sprint spans half a cycle.
const forwardPhase=(a,b,t)=>a+(((b-a)%TAU+TAU)%TAU)*t;
const poseFields=['heading','speed','running','gaitPhase','runBlend','poseWeight','airBlend','animationTime','carHitAt'];
export class RemoteTrack{
 constructor(){this.samples=[];this.lastSequence=-1;this.lastRevision=null;this.generation=0;this.intervals=[];this.sampleAge=0;this.delay=150;}
 push(player,serverTime=player.updatedAt){
  const last=this.samples.at(-1),revision=player.revision??null;
  if(revision!==null&&this.lastRevision!==null&&revision<this.lastRevision)return;
  const revised=last&&this.lastRevision!==null&&revision!==this.lastRevision;
  if(!revised&&(player.sequence<this.lastSequence||last&&player.updatedAt<last.time))return;
  const state=player.state,position=new Vector3(...state.position);
  // The server can stop a penalized player's pose without a new client sequence.
  if(last&&!revised&&player.sequence===this.lastSequence&&position.equals(last.position)&&poseFields.every(key=>state[key]===last[key]))return;
  this.lastSequence=player.sequence;
  const gap=last?player.updatedAt-last.time:0;
  // Delayed sprint packets can legitimately be more than four metres apart.
  // Approved resets/transport and physically impossible travel still snap.
  if(revised||last&&position.distanceTo(last.position)>Math.max(4,12*Math.max(0,gap)/1000+1.5)){
   this.samples=[];this.generation++;
  }
  else if(last&&player.updatedAt===last.time)this.samples.pop();
  else if(gap>0&&gap<1000){this.intervals.push(gap);if(this.intervals.length>12)this.intervals.shift();}
  const age=Math.max(0,serverTime-player.updatedAt);
  this.sampleAge=age>this.sampleAge?age:lerp(this.sampleAge,age,.15);
  const cadence=[...this.intervals].sort((a,b)=>a-b),typical=cadence[Math.floor((cadence.length-1)*.8)]??100;
  this.delay=clamp(typical*1.25+this.sampleAge,150,700);
  this.lastRevision=revision;this.samples.push({...state,position,time:player.updatedAt});if(this.samples.length>64)this.samples.shift();
 }
 sample(time){
  const list=this.samples;if(!list.length)return null;
  let a=list[0],b=a;for(const sample of list){if(sample.time<=time)a=sample;else{b=sample;break;}b=sample;}
  if(a===b)return {...a,position:a.position.clone()};
  const t=clamp((time-a.time)/(b.time-a.time),0,1),state={...b,position:a.position.clone().lerp(b.position,t)};
  for(const key of ['runBlend','poseWeight','airBlend','animationTime','speed'])state[key]=lerp(a[key]??0,b[key]??0,t);
  state.heading=angle(a.heading,b.heading,t);state.gaitPhase=forwardPhase(a.gaitPhase,b.gaitPhase,t);return state;
 }
 advance(time,target,seconds){
  // Server receive timestamps can bunch up while the source keeps moving.
  // Pace the buffered path rather than blending directly across its corners.
  let cursor=time,position=this.sample(time).position,remaining=seconds;
  for(const sample of this.samples){
   if(sample.time<=cursor)continue;
   const end=Math.min(sample.time,target),next=this.sample(end).position;
   const duration=Math.max(Math.hypot(next.x-position.x,next.y-position.y)/10,Math.abs(next.z-position.z)/30);
   if(duration>remaining)return lerp(cursor,end,remaining/duration);
   remaining-=duration;cursor=end;position=next;
   if(cursor>=target)return target;
  }
  return Math.min(target,this.samples.at(-1).time);
 }
}
export class RemotePlayers{
 constructor({createAvatar,clock=()=>performance.now(),serverClock=null}){this.createAvatar=createAvatar;this.clock=clock;this.serverClock=serverClock;this.lastFrameAt=null;this.players=new Map();this.lightFaces=[];}
 sync(snapshot,yourId){
  this.matchEnded=snapshot.matchPhase==='ended';
  const serverTime=this.serverClock?.()??snapshot.serverTime;
  const ids=new Set();for(const player of snapshot.players){
   if(player.id===yourId)continue;ids.add(player.id);let remote=this.players.get(player.id);
   if(!remote){const track=new RemoteTrack();remote={track,presentation:null,avatar:null,characterId:player.characterId,playbackTime:null,trackGeneration:track.generation};track.push(player,serverTime);remote.presentation=track.sample(player.updatedAt);remote.avatar=this.createAvatar(()=>remote.presentation,player);remote.avatar.lighting.setFaces(this.lightFaces);this.players.set(player.id,remote);}
   else{remote.track.push(player,serverTime);if(remote.characterId!==player.characterId){remote.avatar.select(player.characterId);remote.characterId=player.characterId;}}
   if(player.designId)remote.avatar.setDesign?.(player.designId);remote.avatar.setHairColor?.('natural');
   remote.interaction=player.interaction??null;
  }
  for(const [id,remote]of this.players)if(!ids.has(id)){remote.avatar.destroy();this.players.delete(id);}
 }
 update(serverTime){
  const now=this.clock(),elapsed=this.lastFrameAt===null?0:Math.max(0,now-this.lastFrameAt);this.lastFrameAt=now;
  const dt=Math.min(elapsed,250)/1000,blend=1-Math.exp(-dt/.14);
  for(const remote of this.players.values()){
   const track=remote.track,latest=track.samples.at(-1),previous=remote.presentation;
   if(!latest)continue;
   const reset=remote.trackGeneration!==track.generation||elapsed>750;
   const first=reset||remote.playbackTime===null,target=serverTime-track.delay;
   if(reset||this.matchEnded)remote.playbackTime=latest.time;
   else if(first)remote.playbackTime=clamp(target,track.samples[0].time,latest.time);
   else{
    // Response latency changes the clock estimate. Adjust playback speed gently
    // instead of rewinding or jumping the character to a new estimated time.
    const predicted=remote.playbackTime+dt*1000;
    const rate=clamp(1+(target-predicted)/350,0,1.12);
    const proposed=Math.min(latest.time,remote.playbackTime+dt*1000*rate);
    remote.playbackTime=track.advance(remote.playbackTime,proposed,dt);
   }
   remote.trackGeneration=track.generation;
   const state=track.sample(remote.playbackTime);
   if(!first){
    const travel=Math.hypot(state.position.x-previous.position.x,state.position.y-previous.position.y);
    const speed=dt>0?travel/dt:previous.speed??0,moving=Math.min(1,speed/.9);
    state.poseWeight=lerp(previous.poseWeight??0,moving,blend);
    state.runBlend=lerp(previous.runBlend??0,moving?state.runBlend:0,blend);
    // Feet follow the distance actually drawn, not wrapped packet phases.
    // When packets stall the character settles to idle without walking in place.
    state.gaitPhase=(previous.gaitPhase??0)+(state.airBlend<.35?travel*(2.5-.75*state.runBlend):0);
    state.speed=speed;state.running=state.running&&speed>3.3;
    state.animationTime=(previous.animationTime??0)+dt;
   }
   if(this.matchEnded)Object.assign(state,{speed:0,running:false,poseWeight:0,runBlend:0});
   const action=!this.matchEnded&&remote.interaction,previousWeight=first?0:previous?.interactionWeight??0;
   state.interactionWeight=lerp(previousWeight,action?clamp((serverTime-action.startedAt)/220,0,1):0,1-Math.exp(-dt/.075));
   if(action)remote.lastInteractionMotion=action.motion;
   state.interactionMotion=remote.lastInteractionMotion;
   remote.presentation=state;
  }
 }
 setLightFaces(faces){this.lightFaces=faces;for(const remote of this.players.values())remote.avatar.lighting.setFaces(faces);}
 clear(){for(const remote of this.players.values())remote.avatar.destroy();this.players.clear();this.lastFrameAt=null;}
}
