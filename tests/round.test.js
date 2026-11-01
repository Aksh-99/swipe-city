import test from 'node:test';import assert from 'node:assert/strict';
import {createRoomsHandler} from '../server/rooms.js';
import {createTestDatabase} from './d1-test-helper.js';
import {NPC_PEDESTRIANS} from '../src/npc-config.js';
import {DEFAULT_ROOM_STATE,copyPlayerState} from '../src/room-protocol.js';
import {MATCH_DURATION_MS} from '../src/match-time.js';
import {HOLD_GRACE_MS,WRONGFUL_ARREST_MS,FALSE_REPORT_FINE,RICHEST_REWARD,POLICE_ASSIST_REWARD} from '../src/round-rules.js';
async function fixture(){
 let time=100_000;const store=createTestDatabase(),handler=createRoomsHandler({now:()=>time,chooseRole:length=>length===3?0:3}),people=[];let room,match;
 const post=async(i,action,extra={})=>{const path=i===null?'/api/rooms':`/api/rooms/${room}/${action}`,response=await handler(new Request('https://game.test'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...(i!==null?{token:people[i]?.sessionToken,matchId:match}:{}),...extra})}),{DB:store.db});return {status:response.status,...await response.json()};};
 for(const [i,characterId]of ['explorer','tourist','pedestrian','commuter'].entries()){const r=await post(i===0?null:i,'join',{characterId,hidden:true});assert.equal(r.status,201);people.push(r);room=r.roomCode;await post(i,'ready',{hidden:true});}
 const started=await post(0,'start');assert.equal(started.status,200);match=started.matchId;
 const sync=async(i,interactionId)=>{const m=store.sql.prepare('SELECT state,state_revision,sequence FROM ts_members WHERE player_id=?').get(people[i].yourId);return post(i,'sync',{sequence:m.sequence+1,revision:m.state_revision,state:copyPlayerState(JSON.parse(m.state)),...(interactionId?{interactionId}:{})});};
 const place=(i,position)=>{const m=store.sql.prepare('SELECT state FROM ts_members WHERE player_id=?').get(people[i].yourId),state={...JSON.parse(m.state),...DEFAULT_ROOM_STATE,position:[...position]};store.sql.prepare('UPDATE ts_members SET state=?,sequence=sequence+1 WHERE player_id=?').run(JSON.stringify(state),people[i].yourId);};
 const begin=async(i,kind,targetId)=>{const r=await post(i,'interact',{command:'begin',kind,targetId});assert.equal(r.status,200,JSON.stringify(r));return r.yourRound.action;};
 const hold=async(i,action)=>{while(time<action.endsAt){time+=Math.min(400,action.endsAt-time);const r=await sync(i,action.id);assert.equal(r.yourRound?.action?.id,action.id,JSON.stringify(r));}return post(i,'interact',{command:'finish',actionId:action.id});};
 return {store,people,room,started,post,sync,place,begin,hold,advance:ms=>time+=ms,get time(){return time;},get match(){return match;},close:()=>store.close()};
}

test('exactly one server-assigned police/thief; private roles and money never enter shared avatars or dispatch',async()=>{
 const f=await fixture();try{
  const views=await Promise.all(f.people.map((_,i)=>f.sync(i)));assert.deepEqual(views.map(v=>v.yourRound.role),['THIEF','PEDESTRIAN','POLICE','PEDESTRIAN']);
  for(const v of views){assert(!JSON.stringify(v.players).includes('THIEF'));assert(!JSON.stringify(v.players).includes('stolen'));assert(!JSON.stringify(v).includes('thiefId'));assert(!JSON.stringify(v).includes('policeId'));assert.equal(v.roundResult,null);}
  for(const i of [1,2,3])assert.equal('stolen' in views[i].yourRound,false);
  assert.equal((await f.post(1,'interact',{command:'begin',kind:'pickpocket',targetId:NPC_PEDESTRIANS[0].id})).code,'ACTION_FORBIDDEN');
  assert.equal((await f.post(0,'interact',{command:'begin',kind:'arrest',targetId:f.people[1].yourId})).code,'ACTION_FORBIDDEN');
  assert.equal((await f.post(0,'sync',{role:'THIEF',sequence:99})).status,400);
  const again=await f.post(0,'start');assert.equal(again.matchId,f.match);assert.equal(again.yourRound.role,'THIEF');
 }finally{f.close();}
});

test('a wrongful arrest writes up the officer and blocks movement, reset, transport and arrests for exactly 10 seconds',async()=>{
 const f=await fixture();try{
  f.place(2,[0,0,.17]);f.place(1,[1,0,.17]);f.place(0,[0,1,.17]);
  const wrong=await f.begin(2,'arrest',f.people[1].yourId),r=await f.hold(2,wrong);assert.equal(r.yourRound.feedback.kind,'wrongful_arrest');assert.equal(r.yourRound.cooldownUntil,f.time+WRONGFUL_ARREST_MS);assert.equal(r.roundResult,null);
  assert.equal((await f.post(2,'interact',{command:'begin',kind:'arrest',targetId:f.people[0].yourId})).code,'ARREST_COOLDOWN');
  assert.equal(WRONGFUL_ARREST_MS,10000);assert.equal(r.yourRound.penaltyUntil,f.time+10000);
  for(const action of ['respawn','transport'])assert.equal((await f.post(2,action)).code,'WRONGFUL_ARREST_PENALTY');
  const current=f.store.sql.prepare('SELECT sequence,state_revision FROM ts_members WHERE player_id=?').get(f.people[2].yourId);
  const moved=await f.post(2,'sync',{sequence:current.sequence+1,revision:current.state_revision,state:{...DEFAULT_ROOM_STATE,position:[1,0,.17],speed:3.2,poseWeight:1}});assert.deepEqual(moved.players.find(p=>p.id===f.people[2].yourId).state.position,[0,0,.17]);
  f.advance(9999);assert.equal((await f.post(2,'respawn')).code,'WRONGFUL_ARREST_PENALTY');f.advance(1);
  const right=await f.begin(2,'arrest',f.people[0].yourId),win=await f.hold(2,right);assert.equal(win.roundResult.winner,'POLICE');assert.equal(win.roundResult.reason,'all_caught');assert.equal(win.matchPhase,'ended');
  for(let i=0;i<4;i++){const s=await f.sync(i);assert.equal(s.matchPhase,'ended');assert.equal(s.roundResult.winner,'POLICE');assert(s.players.every(p=>p.state.speed===0));}
  assert.equal((await f.post(0,'respawn')).code,'MATCH_ENDED');assert.equal((await f.post(0,'call-911')).code,'MATCH_ENDED');
 }finally{f.close();}
});

test('arrest loses its hold if the target escapes; forged target/role on completion cannot arrest someone else',async()=>{
 const f=await fixture();try{
  f.place(2,[0,0,.17]);f.place(1,[1,0,.17]);f.place(0,[0,1,.17]);
  const action=await f.begin(2,'arrest',f.people[1].yourId);f.place(1,[8,0,.17]);const r=await f.sync(2,action.id);assert.equal(r.yourRound.action,null);
  f.place(1,[1,0,.17]);const held=await f.begin(2,'arrest',f.people[1].yourId);while(f.time<held.endsAt){f.advance(400);await f.sync(2,held.id);}
  const wrong=await f.post(2,'interact',{command:'finish',actionId:held.id,targetId:f.people[0].yourId,kind:'pickpocket'});assert.equal(wrong.yourRound.feedback.kind,'wrongful_arrest');assert.equal(wrong.roundResult,null);
 }finally{f.close();}
});

test('critical disconnect ends the round cleanly and allows a replacement in the same rematch lobby',async()=>{
 const f=await fixture();try{
  await f.post(2,'leave');const ended=await f.sync(1);assert.equal(ended.players.length,3);assert.equal(ended.roundResult.winner,null);assert.equal(ended.roundResult.reason,'disconnected');
  assert.equal((await f.post(0,'rematch')).matchPhase,'waiting');
  const fresh=await f.post(2,'join',{token:undefined,characterId:'pedestrian'});assert.equal(fresh.status,201);assert.equal(fresh.players.length,4);assert.equal(fresh.yourRound,null);
 }finally{f.close();}
});

test('defamation costs $120 immediately once, without freezing the reporter or charging the accused',async()=>{
 const f=await fixture();try{f.place(3,[0,0,.17]);f.place(1,[1,0,.17]);f.place(2,[0,1,.17]);const report=await f.post(3,'call-911',{suspectId:f.people[1].yourId});assert.equal(report.status,200);assert.equal(report.yourRound.wallet,380);assert.equal(report.yourRound.feedback.kind,'false_report');assert.equal(report.yourRound.penaltyUntil,0);assert.equal((await f.sync(1)).yourRound.wallet,500);for(let i=0;i<4;i++)assert.equal((await f.sync(3)).yourRound.wallet,380);await f.hold(2,await f.begin(2,'arrest',f.people[1].yourId));assert.equal((await f.sync(3)).yourRound.wallet,380);assert.equal((await f.sync(2)).yourRound.penaltyUntil,f.time+10000);}finally{f.close();}
});
test('photo rewards pay once through authenticated requests, officer/thief cannot claim pedestrian jobs, and rematch resets the economy',async()=>{
 const f=await fixture();try{f.advance(6000);const ped=await f.sync(1),tasks=ped.yourRound.photoTasks;assert(tasks.length>=1);const task=tasks[0];f.place(1,[task.position[0],task.position[1]-30,.17]);const event={kind:'photo',landmarkId:task.landmarkId,heading:0,reward:999999};const replies=await Promise.all([f.post(1,'city-event',event),f.post(1,'city-event',event)]);assert.equal(replies.filter(r=>r.status===200).length,1);assert.equal((await f.sync(1)).yourRound.wallet,500+task.reward);assert.equal((await f.post(2,'city-event',event)).status,409);assert.equal((await f.post(0,'city-event',event)).status,409);const anchor=JSON.parse(f.store.sql.prepare('SELECT anchor_state FROM ts_rooms WHERE code=?').get(f.room).anchor_state);for(const list of Object.values(anchor._round.photoTasks))assert(list.length>=3&&list.length<=5);assert.equal((await f.post(1,'city-event',{...event,matchId:'old'})).code,'ACTION_STALE');}finally{f.close();}
});
test('medical bills charge pedestrians and thief once per cooldown, never the officer; forged distant contacts cannot deduct money',async()=>{
 const f=await fixture();try{const {nearestRoad}=await import('../src/city-rules.js');const road=nearestRoad([0,0,.17]),position=[road.a[0],road.a[1],.17];for(const i of [0,1,2])f.place(i,position);for(const i of [0,1]){const r=await f.post(i,'city-event',{kind:'medical',carId:0,carSpeed:3,carPosition:position});assert.equal(r.status,200);assert.equal(r.yourRound.wallet,300);assert.equal((await f.post(i,'city-event',{kind:'medical',carId:0,carSpeed:3,carPosition:position})).yourRound.wallet,300);}assert.equal((await f.post(2,'city-event',{kind:'medical',carId:0,carSpeed:3,carPosition:position})).status,409);assert.equal((await f.post(3,'city-event',{kind:'medical',carId:0,carSpeed:3,carPosition:[9999,9999,0]})).status,409);assert.equal((await f.sync(3)).yourRound.wallet,500);}finally{f.close();}
});
test('existing end-of-round bonuses remain separate from the new $500 starting wallet',async()=>{const f=await fixture();try{for(let i=0;i<4;i++)await f.post(i,'ready',{hidden:true});f.advance(MATCH_DURATION_MS);const end=await f.sync(1);assert.equal(end.matchPhase,'ended');assert.equal(end.yourRound.wallet,750);assert.equal(end.yourRound.reward,250);assert.equal(end.roundResult.awards.length,3);assert(end.roundResult.awards.every(a=>a.kind==='richest'&&a.amount===250));}finally{f.close();}});

const shoot=(f,target,extra={})=>f.post(0,'interact',{command:'begin',kind:'shoot',targetId:f.people[target].yourId,shotId:crypto.randomUUID(),...extra});
const balance=(f,i,value)=>{const row=f.store.sql.prepare('SELECT anchor_state FROM ts_rooms WHERE code=?').get(f.room),a=JSON.parse(row.anchor_state);a._round.wallets[f.people[i].yourId]=value;f.store.sql.prepare('UPDATE ts_rooms SET anchor_state=? WHERE code=?').run(JSON.stringify(a),f.room);};
test('all four players start with $500; shooting transfers exactly $100 and charges $100 surgery privately',async()=>{
 const f=await fixture();try{
  for(let i=0;i<4;i++)assert.equal((await f.sync(i)).yourRound.wallet,500);
  f.place(0,[0,0,.17]);f.place(1,[0,5,.17]);
  const result=await shoot(f,1);assert.equal(result.status,200);assert.equal(result.yourRound.wallet,600);assert.equal(result.yourRound.stolen,100);assert.equal(result.gunshots.length,1);assert.deepEqual(result.gunshots[0].position,[0,0,.17]);assert.equal('targetId' in result.gunshots[0],false);
  const victim=await f.sync(1);assert.equal(victim.yourRound.wallet,300);assert.equal(victim.yourRound.feedback.surgery,100);assert.equal(victim.yourRound.dead,false);
  assert(!JSON.stringify(victim.players).includes('wallet'));assert.equal((await f.sync(2)).dispatchCalls.length,0);
  assert.equal((await f.post(0,'interact',{command:'begin',kind:'pickpocket',targetId:f.people[1].yourId})).code,'ACTION_FORBIDDEN');
 }finally{f.close();}
});
test('shooting is thief-only, range checked, rate limited and idempotent under concurrent requests',async()=>{
 const f=await fixture();try{
  f.place(0,[0,0,.17]);f.place(1,[0,5,.17]);
  assert.equal((await f.post(1,'interact',{command:'begin',kind:'shoot',targetId:f.people[0].yourId,shotId:crypto.randomUUID()})).code,'ACTION_FORBIDDEN');
  assert.equal((await shoot(f,1,{targetId:'npc-1'})).code,'SHOT_TARGET');
  assert.equal((await shoot(f,0)).code,'SHOT_TARGET');
  f.place(1,[0,20.01,.17]);assert.equal((await shoot(f,1)).code,'TARGET_TOO_FAR');f.place(1,[0,5,.17]);
  const shotId=crypto.randomUUID();const replies=await Promise.all(Array.from({length:4},()=>shoot(f,1,{shotId})));assert(replies.every(r=>r.status===200));
  assert.equal((await f.sync(0)).yourRound.wallet,600);assert.equal((await f.sync(0)).gunshots.length,1);assert.equal((await f.sync(1)).yourRound.wallet,300);
  assert.equal((await shoot(f,1)).code,'SHOT_COOLDOWN');
  f.advance(1000);assert.equal((await shoot(f,1)).status,200);assert.equal((await f.sync(1)).yourRound.wallet,100);
 }finally{f.close();}
});
test('exactly $100 survives a hit with surgery debt; the next shot kills, locks all actions and persists on reconnect',async()=>{
 const f=await fixture();try{
  f.place(0,[0,0,.17]);f.place(1,[0,5,.17]);balance(f,1,100);
  await shoot(f,1);let v=await f.sync(1);assert.equal(v.yourRound.wallet,-100);assert.equal(v.yourRound.dead,false);assert.equal(v.yourRound.feedback.surgery,100);
  f.advance(1000);await shoot(f,1);v=await f.sync(1);assert.equal(v.yourRound.dead,true);assert.equal(v.yourRound.feedback.kind,'dead');assert(v.players.find(p=>p.id===f.people[1].yourId).dead);
  for(const action of ['respawn','transport','observe','call-911'])assert.notEqual((await f.post(1,action)).status,200);
  assert.equal((await f.post(1,'city-event',{kind:'photo'})).code,'PLAYER_DEAD');
  assert.equal((await f.post(1,'interact',{command:'begin',kind:'arrest',targetId:f.people[0].yourId})).code,'PLAYER_DEAD');
  const before=JSON.parse(f.store.sql.prepare('SELECT state FROM ts_members WHERE player_id=?').get(f.people[1].yourId).state).position;
  const row=f.store.sql.prepare('SELECT state,state_revision,sequence FROM ts_members WHERE player_id=?').get(f.people[1].yourId);const state=copyPlayerState(JSON.parse(row.state));state.position[0]+=1;
  await f.post(1,'sync',{sequence:row.sequence+1,revision:row.state_revision,state});
  assert.deepEqual(JSON.parse(f.store.sql.prepare('SELECT state FROM ts_members WHERE player_id=?').get(f.people[1].yourId).state).position,before);
  assert.equal((await f.post(1,'join')).yourRound.dead,true);
  f.advance(1000);assert.equal((await shoot(f,1)).code,'SHOT_TARGET');
 }finally{f.close();}
});
test('a victim below $100 dies immediately, including the officer; no invented loot is minted',async()=>{
 const f=await fixture();try{
  f.place(0,[0,0,.17]);f.place(2,[0,3,.17]);balance(f,2,99);
  const result=await shoot(f,2);assert.equal(result.status,200);assert.equal(result.yourRound.wallet,500);assert.equal((await f.sync(2)).yourRound.dead,true);
 }finally{f.close();}
});
test('surviving the timer wins with zero stolen, and a rematch resets wallets and deaths',async()=>{
 const f=await fixture();try{
  for(let i=0;i<4;i++)await f.post(i,'ready',{hidden:true});f.advance(MATCH_DURATION_MS);
  const end=await f.sync(0);assert.equal(end.roundResult.winner,'THIEF');assert.equal(end.roundResult.reason,'survived');assert.equal(end.roundResult.stolen,0);
  const waiting=await f.post(0,'rematch');assert.equal(waiting.yourRound,null);
  for(let i=0;i<4;i++)await f.post(i,'ready',{hidden:true});const next=await f.post(0,'start');assert.notEqual(next.matchId,f.match);assert.equal(next.yourRound.dead,false);assert.equal(next.yourRound.wallet,500);assert.equal(next.yourRound.stolen,0);assert.equal(next.yourRound.availablePlayerIds.length,3);
 }finally{f.close();}
});
