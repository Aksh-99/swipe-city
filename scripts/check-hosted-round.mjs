// Four independent hosted HTTP clients, without a browser/WebGL claim.
// The private Sites service credential is supplied through hidden stdin/env.
import assert from 'node:assert/strict';
import {RoomClient} from '../src/room-client.js';
import {DEFAULT_ROOM_STATE} from '../src/room-protocol.js';
import {NPC_PEDESTRIANS} from '../src/npc-config.js';
const origin='https://times-square-walk.agopakum1.chatgpt.site',authorization=process.env.SITES_SERVICE_AUTHORIZATION;
if(!authorization)throw Error('Missing Site service authorization.');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const fetcher=(path,init)=>fetch(origin+path,{...init,headers:{...init.headers,Origin:origin,'OAI-Sites-Authorization':authorization},redirect:'manual'});
const contexts=['explorer','tourist','pedestrian','commuter'].map(characterId=>({characterId,hidden:true,saved:new Map(),state:{...DEFAULT_ROOM_STATE,position:[...DEFAULT_ROOM_STATE.position]}}));
const makeClient=c=>new RoomClient({fetcher,storage:{getItem:key=>c.saved.get(key)??null,setItem:(key,value)=>c.saved.set(key,value),removeItem:key=>c.saved.delete(key)},isHidden:()=>c.hidden,getState:()=>c.state,onSpawn:self=>c.state={...self.state,position:[...self.state.position]},setTimer:(fn,ms)=>ms===8000?setTimeout(fn,20000):0,clearTimer:clearTimeout});
const clients=contexts.map(makeClient);
const poll=()=>Promise.all(clients.map(c=>c.refresh()));
async function walk(i,target){
 const c=contexts[i];c.hidden=false;
 for(let step=0;step<120;step++){
  const a=c.state.position,d=target.map((v,j)=>v-a[j]),length=Math.hypot(d[0],d[1]);if(length<.015){c.state={...c.state,position:[...target],speed:0,running:false,poseWeight:0,airBlend:0};await clients[i].refresh();return;}
  const fraction=Math.min(1,.6/length);c.state={...c.state,position:d.map((v,j)=>a[j]+v*fraction),heading:Math.atan2(d[0],d[1]),speed:3.2,running:false,poseWeight:1,airBlend:0};await clients[i].refresh();await pause(100);
 }
 throw Error('Timed out approaching target.');
}
async function beginHold(i,kind,targetId){
 contexts[i].hidden=false;const r=await clients[i].beginInteraction(kind,targetId);assert(r.yourRound.action);const id=r.yourRound.action.id;
 return {action:r.yourRound.action,async finish(){
  for(let tick=0;tick<70;tick++){
   await clients[i].refresh();const a=clients[i].view().yourRound.action;assert(a&&a.id===id,`Hold interrupted (${clients[i].view().yourRound.feedback?.kind}). RTT ${Math.round(clients[i].rtt??0)} ms`);
   if(clients[i].serverNow()>=a.endsAt+100){try{await clients[i].finishInteraction(id);clients[i].interactionHeld=false;return clients[i].view();}catch(e){if(e.code!=='HOLD_INCOMPLETE')throw e;}}
   await pause(100);
  }throw Error('Held action did not finish.');
 }};
}
try{
 console.log('Creating a four-client hosted round.');await clients[0].create('Round probe 1','explorer');const room=clients[0].view().roomCode;
 await Promise.all(clients.slice(1).map((c,i)=>c.join(room,`Round probe ${i+2}`,contexts[i+1].characterId)));await poll();assert(clients[0].view().canStart);await clients[0].startMatch();await poll();
 const roles=clients.map(c=>c.view().yourRound.role);assert.equal(roles.filter(r=>r==='POLICE').length,1);assert.equal(roles.filter(r=>r==='THIEF').length,1);assert.equal(roles.filter(r=>r==='PEDESTRIAN').length,2);
 const thief=roles.indexOf('THIEF'),cop=roles.indexOf('POLICE'),innocents=roles.map((r,i)=>r==='PEDESTRIAN'?i:-1).filter(i=>i>=0),witness=innocents[0],wrong=innocents[1];
 for(const [i,c]of clients.entries()){assert(!JSON.stringify(c.snapshot.players).includes('THIEF'));if(i!==thief)assert(!('stolen' in c.view().yourRound));}
 const victim=wrong,point=[...contexts[victim].state.position];await walk(thief,[point[0],point[1]-1.3,point[2]]);
 const intent=extra=>({token:clients[thief].session.token,matchId:clients[thief].view().matchId,...extra});
 await assert.rejects(()=>clients[thief].request(`/api/rooms/${room}/interact`,intent({command:'begin',kind:'pickpocket',targetId:NPC_PEDESTRIANS[0].id})),e=>e.code==='PEDESTRIAN_REQUIRED');
 await assert.rejects(()=>clients[thief].request(`/api/rooms/${room}/observe`,intent({suspectId:clients[victim].view().yourId})),e=>e.code==='CALL_FORBIDDEN');
 console.log('Pickpocketing a human pedestrian while the other pedestrian sends a description report.');
 const theft=await beginHold(thief,'pickpocket',clients[victim].view().yourId),theftFinish=theft.finish();
 try{
  await clients[cop].refresh();assert.equal(clients[cop].view().dispatchCalls.length,0,'theft must not automatically alert police');
  const selection=(await clients[witness].observeSuspect(clients[thief].view().yourId,'pickpocketing')).yourObservation;
  const report=(await clients[witness].call911(clients[thief].view().yourId,'pickpocketing')).yourCall;await clients[cop].refresh();assert.equal(clients[cop].view().dispatchCalls.length,1);assert.equal(report.activity,'pickpocketing');assert.deepEqual(report.position,selection.position);
  for(const key of ['suspectId','role','thiefId','isThief','correct'])assert(!(key in report));
 }finally{const r=await theftFinish;assert.equal(r.yourRound.feedback.kind,'theft');assert(r.yourRound.stolen>=100&&r.yourRound.stolen<=250);}
 const stolen=clients[thief].view().yourRound.stolen,pinned=[...clients[cop].view().dispatchCalls[0].position];await clients[victim].refresh();assert.equal(clients[victim].view().yourRound.wallet,1000-stolen);assert.equal(clients[victim].view().yourRound.feedback.kind,'wallet_loss');assert(!JSON.stringify(clients[cop].snapshot.players).includes('wallet'));await walk(thief,[point[0],point[1]+3,point[2]]);await clients[cop].refresh();assert.deepEqual(clients[cop].view().dispatchCalls[0].position,pinned);
 console.log('Reloading the thief offline, then resuming the same player, role, and money.');
 const thiefId=clients[thief].view().yourId,matchId=clients[thief].view().matchId;clients[thief].stop();clients[thief]=makeClient(contexts[thief]);clients[thief].fetcher=async()=>{throw new TypeError('Offline during reload');};
 assert.equal(await clients[thief].restore(room),false);assert.equal(clients[thief].phase,'reconnecting');assert.equal(clients[thief].view().canMove,false);clients[thief].fetcher=fetcher;await poll();
 assert.equal(clients[thief].view().yourId,thiefId);assert.equal(clients[thief].view().matchId,matchId);assert.equal(clients[thief].view().yourRound.role,'THIEF');assert.equal(clients[thief].view().yourRound.stolen,stolen);assert(clients.every(c=>c.view().players.length===4));
 console.log('Testing a false-report fine and both real 10-second movement locks.');
 await clients[cop].resetSpawn();const arrestPoint=[...contexts[cop].state.position];await walk(wrong,[arrestPoint[0],arrestPoint[1]+1.3,arrestPoint[2]]);
 await walk(witness,[arrestPoint[0]-1.3,arrestPoint[1],arrestPoint[2]]);while(clients[witness].serverNow()<(clients[witness].view().yourCall?.createdAt??0)+10010){await poll();await pause(200);}
 await clients[witness].observeSuspect(clients[wrong].view().yourId);await clients[witness].call911(clients[wrong].view().yourId);assert.equal(clients[witness].view().yourRound.wallet,1000,'an unverified accusation has no fine');
 const innocentHold=await beginHold(cop,'arrest',clients[wrong].view().yourId),innocentResult=await innocentHold.finish();assert.equal(innocentResult.yourRound.feedback.kind,'wrongful_arrest');assert.equal(innocentResult.roundResult,null);
 await clients[witness].refresh();assert.equal(clients[witness].view().yourRound.wallet,900);assert.equal(clients[witness].view().yourRound.feedback.kind,'false_report');assert.equal(clients[witness].view().canMove,false);assert.equal(clients[witness].movement(),null);await assert.rejects(()=>clients[witness].resetSpawn(),e=>e.code==='FALSE_REPORT_PENALTY');
 const witnessId=clients[witness].view().yourId,penaltyUntil=clients[witness].view().yourRound.penaltyUntil;clients[witness].stop();clients[witness]=makeClient(contexts[witness]);assert(await clients[witness].restore(room));assert.equal(clients[witness].view().yourId,witnessId);assert.equal(clients[witness].view().yourRound.wallet,900);assert.equal(clients[witness].view().yourRound.penaltyUntil,penaltyUntil);assert.equal(clients[witness].view().canMove,false);
 assert.equal(clients[cop].view().canMove,false);assert.equal(clients[cop].movement(),null);await assert.rejects(()=>clients[cop].resetSpawn(),e=>e.code==='WRONGFUL_ARREST_PENALTY');
 const officer=clients[cop],pose=officer.view().players.find(p=>p.id===officer.view().yourId);await officer.request(`/api/rooms/${room}/sync`,{token:officer.session.token,matchId:officer.view().matchId,sequence:++officer.sequence,revision:pose.revision,state:{...pose.state,position:[pose.state.position[0]+1,...pose.state.position.slice(1)],speed:3.2}});await officer.refresh();assert.deepEqual(contexts[cop].state.position,arrestPoint);
 const until=clients[cop].view().yourRound.cooldownUntil;assert.equal(until-clients[cop].view().yourRound.feedback.at,10000);assert.equal(penaltyUntil-clients[witness].view().yourRound.feedback.at,10000);
 // Clients estimate server time independently from request latency. Wait for
 // both actual server snapshots to confirm expiry, not the officer's estimate.
 const unlockDeadline=Date.now()+20000;while(clients[cop].snapshot.serverTime<until||clients[witness].snapshot.serverTime<penaltyUntil){
  assert(Date.now()<unlockDeadline,JSON.stringify({message:'Lock did not expire',copPhase:clients[cop].phase,witnessPhase:clients[witness].phase,copTime:clients[cop].snapshot.serverTime,witnessTime:clients[witness].snapshot.serverTime,until,penaltyUntil}));await poll();await pause(500);
 }
 assert.equal(clients[cop].view().canMove,true);assert.equal(clients[witness].view().canMove,true);
 await walk(wrong,[arrestPoint[0]+5,arrestPoint[1],arrestPoint[2]]);await walk(thief,[arrestPoint[0],arrestPoint[1]+1.3,arrestPoint[2]]);
 await clients[witness].observeSuspect(clients[thief].view().yourId,'pickpocketing');await clients[witness].call911(clients[thief].view().yourId,'pickpocketing');assert(!('reward' in clients[witness].view().yourRound),'a correct report is not confirmed before arrest');
 const arrest=await beginHold(cop,'arrest',clients[thief].view().yourId);await arrest.finish();await poll();assert(clients.every(c=>c.view().roundResult?.winner==='POLICE'&&c.view().roundResult.reason==='arrested'&&!c.view().canMove));
 assert.equal(clients[witness].view().yourRound.reward,500);assert.equal(clients[witness].view().yourRound.wallet,1400);assert.equal(clients[witness].view().yourRound.finalBalance,1400);const awards=clients[cop].view().roundResult.awards;for(const kind of ['richest','police_assist'])assert(awards.some(a=>a.kind===kind&&a.playerId===witnessId&&a.amount===250));await clients[witness].refresh();assert.equal(clients[witness].view().yourRound.wallet,1400,'polls cannot duplicate rewards');
 console.log('Opening the same-room rematch and checking clean, private round state.');const previous=clients[0].snapshot.matchId;
 await clients[0].rematch();await poll();assert(clients.every(c=>c.view().matchPhase==='waiting'&&c.view().yourRound===null));assert(clients[0].view().canStart);await clients[0].startMatch();await poll();assert.notEqual(clients[0].snapshot.matchId,previous);
 const freshThief=clients.find(c=>c.view().yourRound.role==='THIEF');assert.equal(freshThief.view().yourRound.stolen,0);assert.equal(freshThief.view().yourRound.availablePlayerIds.length,2);assert(clients.filter(c=>c.view().yourRound.role==='PEDESTRIAN').every(c=>c.view().yourRound.wallet===1000));assert(clients.every(c=>(c.view().yourRound.penaltyUntil??0)===0&&!('reward' in c.view().yourRound)));assert.equal(clients[cop].view().dispatchCalls.length,0);
 console.log(`PASS: four hosted clients; human-only theft; $${stolen} wallet transfer; no thief reporting; unverified reports reveal no role; $100 verified false-report fine; penalty survives reload; two real 10-second movement locks; correct arrest; shared richest and police-assist awards; $500 bonus credited once; clean rematch.`);
}finally{await Promise.allSettled(clients.map(c=>c.leave()));clients.forEach(c=>c.stop());}
