import {CITY_TRAFFIC_COUNT} from '../src/traffic-config.js';
import test from 'node:test';import assert from 'node:assert/strict';import {newRound} from '../server/round.js';import {settleStreetRules,streetAlerts,applyCityEvent} from '../server/city-rules.js';import {nearestRoad,pedestrianCrossing,pedestrianWalk,createPhotoTasks,PHOTO_LANDMARKS,photoInView,MEDICAL_FINE,JAYWALK_FINE} from '../src/city-rules.js';
const players=[{id:'thief',characterId:'explorer'},{id:'ped1',characterId:'tourist'},{id:'cop',characterId:'pedestrian'},{id:'ped2',characterId:'commuter'}];
const member=(id,p)=>({player_id:id,ready:true,slot:players.findIndex(v=>v.id===id),state:JSON.stringify({position:p})});
test('new economy gives every player $500 for survival, and generates 3–5 distinct landmark requests only for pedestrians',()=>{const r=newRound(players,'match',()=>0);assert.equal(r.goal,500);assert.deepEqual(r.wallets,{thief:500,ped1:500,cop:500,ped2:500});assert.equal(r.photoTasks.cop,undefined);assert.equal(r.photoTasks.thief,undefined);for(let i=0;i<3;i++){const tasks=createPhotoTasks(n=>i%n);assert(tasks.length>=3&&tasks.length<=5);assert.equal(new Set(tasks.map(t=>t.id)).size,tasks.length);}});
import crossings from '../public/data/jaywalking-crossings.json' with {type:'json'};
const crossing=crossings.crossings[0],a=crossing.points[0],b=crossing.points[1],len=Math.hypot(b[0]-a[0],b[1]-a[1]),at=t=>[a[0]+(b[0]-a[0])*t/len,a[1]+(b[1]-a[1])*t/len,.17];
test('only entering a signalled zebra on DON’T WALK fines civilians and thieves once; officers exempt',()=>{
 const time=crossing.group===0?64000:96000;assert(!pedestrianWalk(crossing.group,time));assert(pedestrianCrossing(at(2)));assert.equal(pedestrianCrossing(at(.2)),null);
 const r=newRound(players,'match',()=>0);
 for(const id of ['thief','ped1','cop']){r.streetState={[id]:{inside:false,position:at(.2),lastFine:0}};settleStreetRules(r,[member(id,at(2))],time);settleStreetRules(r,[member(id,at(2.2))],time+100);assert.equal(r.wallets[id],id==='cop'?500:460);}
 assert.equal(streetAlerts(r,[],time).length,2);assert.equal(streetAlerts(r,[],time+20000).length,0);assert.equal(JAYWALK_FINE,40);
});
test('WALK entry stays legal when the pedestrian hand changes mid-crossing',()=>{
 const time=crossing.group===0?96000:64000,r=newRound(players,'walk',()=>0);assert(pedestrianWalk(crossing.group,time));r.streetState={ped1:{inside:false,position:at(.2),lastFine:0}};settleStreetRules(r,[member('ped1',at(2))],time);settleStreetRules(r,[member('ped1',at(2.2))],time+11000);assert.equal(r.wallets.ped1,500);
});
test('ordinary road entry away from a pedestrian crossing cannot trigger a fine',()=>{
 const road=nearestRoad([0,0,0]),dx=road.b[0]-road.a[0],dy=road.b[1]-road.a[1],length=Math.hypot(dx,dy),base=[(road.a[0]+road.b[0])/2,(road.a[1]+road.b[1])/2,.17],p=[base[0]-dy/length*3.5,base[1]+dx/length*3.5,.17];assert.equal(pedestrianCrossing(p),null);const r=newRound(players,'road',()=>0);r.streetState={ped1:{inside:false,position:[p[0]+1,p[1],.17],lastFine:0}};settleStreetRules(r,[member('ped1',p)],128000);assert.equal(r.wallets.ped1,500);
});
test('photo validation requires a near, correctly aimed landmark and never pays twice or outside the scheduled request',()=>{const r=newRound(players,'match',()=>0),task=r.photoTasks.ped1[0],p=[task.position[0],task.position[1]-30,.17],m=[member('ped1',p)],room={started_at:100000},body={kind:'photo',landmarkId:task.landmarkId,heading:0};assert(applyCityEvent(r,room,m,'ped1',body,100000));assert(applyCityEvent(r,room,m,'ped1',{...body,heading:Math.PI},110000));assert.equal(applyCityEvent(r,room,m,'ped1',body,110000),undefined);assert.equal(r.wallets.ped1,500+task.reward);assert(applyCityEvent(r,room,m,'ped1',body,110001));assert.equal(r.wallets.ped1,500+task.reward);assert(photoInView(p,0,PHOTO_LANDMARKS.find(l=>l.id===task.landmarkId)));});
test('photo requests assign and retain random rewards across the full inclusive $20–$90 range',()=>{
 for(let reward=20;reward<=90;reward++){const tasks=createPhotoTasks(n=>n===71?reward-20:0);assert(tasks.every(t=>t.reward===reward));const saved=JSON.parse(JSON.stringify(tasks));assert.deepEqual(saved.map(t=>t.reward),tasks.map(t=>t.reward));}
});
test('fines create debt and a $50 photo reward adds to the negative balance',async()=>{const {debit}=await import('../server/city-rules.js'),{money}=await import('../src/round-rules.js'),r=newRound(players,'debt',()=>0),task=r.photoTasks.ped1[0];r.wallets.ped1=0;debit(r,'ped1',40,'jaywalking',100000);assert.equal(r.wallets.ped1,-40);assert.equal(r.feedback.ped1.amount,40);assert.equal(money(-40),'-$40');task.reward=50;const p=[task.position[0],task.position[1]-30,.17];assert.equal(applyCityEvent(r,{started_at:100000},[member('ped1',p)],'ped1',{kind:'photo',landmarkId:task.landmarkId,heading:0},110000),undefined);assert.equal(r.wallets.ped1,10);debit(r,'ped1',200,'medical',111000);assert.equal(r.wallets.ped1,-190);assert.equal(money(-190),'-$190');});
test('parked or stopped car claims cannot charge a medical bill',()=>{const r=newRound(players,'cars',()=>0),p=[0,0,.17],m=[member('ped1',p)];for(const body of [{carId:'parked-1',carSpeed:3},{carId:0,carSpeed:0},{carId:0},{carId:CITY_TRAFFIC_COUNT,carSpeed:4}]){const error=applyCityEvent(r,{started_at:100000},m,'ped1',{kind:'medical',carPosition:p,...body},110000);assert(error);assert.equal(r.wallets.ped1,500);}});
test('fine timing matches the rendered pedestrian WALK icon throughout both signal cycles',async()=>{const {signalPhase}=await import('../src/street-layout.js');for(let seconds=0;seconds<128;seconds++){const phase=signalPhase(seconds);assert.equal(pedestrianWalk(0,seconds*1000),phase.pedA===0);assert.equal(pedestrianWalk(1,seconds*1000),phase.pedB===0);}});
test('all five added photo destinations can be assigned and paid by the authoritative server',()=>{
 for(const id of ['harry-potter','port-authority','disney','fdny','mcdonalds']){
  const index=PHOTO_LANDMARKS.findIndex(l=>l.id===id);assert(index>=0,id);
  let selected=false;const tasks=createPhotoTasks(n=>{if(n===PHOTO_LANDMARKS.length&&!selected){selected=true;return index;}return 0;});
  const task=tasks.find(t=>t.landmarkId===id);assert(task,id);
  const r=newRound(players,'photo-destinations',()=>0);r.photoTasks.ped1=tasks;
  const position=[task.position[0],task.position[1]-30,.17],members=[member('ped1',position)],body={kind:'photo',landmarkId:id,heading:0};
  assert.equal(applyCityEvent(r,{started_at:100000},members,'ped1',body,110000),undefined,id);
  assert.equal(r.wallets.ped1,500+task.reward);assert(applyCityEvent(r,{started_at:100000},members,'ped1',body,110001));
 }
});

test('medical validation recognizes the added moving cars but rejects an out-of-range vehicle ID',()=>{
 const landmark=PHOTO_LANDMARKS.find(l=>nearestRoad(l.position)?.distance<18),p=landmark.position,m=[member('ped1',p)],room={started_at:100000};
 for(const carId of [24,CITY_TRAFFIC_COUNT-1]){const r=newRound(players,'extra-car',()=>0);assert.equal(applyCityEvent(r,room,m,'ped1',{kind:'medical',carId,carSpeed:4,carPosition:p},110000),undefined);assert.equal(r.wallets.ped1,500-MEDICAL_FINE);}
});
