import {CITY_TRAFFIC_COUNT} from '../src/traffic-config.js';
import {roleFor,isOut} from './round-teams.js';
import {nearestRoad,pedestrianCrossing,pedestrianWalk,createPhotoTasks,PHOTO_LANDMARKS,photoInView,MEDICAL_FINE,JAYWALK_FINE,photoReward,ALERT_MS} from '../src/city-rules.js';
export function debit(round,id,amount,kind,time){const paid=amount;round.wallets[id]=(round.wallets[id]??0)-paid;round.feedback[id]={id:crypto.randomUUID(),kind,at:time,amount:paid,wallet:round.wallets[id]};return paid;}
export function settleStreetRules(round,members,time){
 round.streetState??={};round.alerts??=[];round.alerts=round.alerts.filter(a=>a.expiresAt>time);
 if(round.result)return;
 for(const m of members){const id=m.player_id;if(isOut(round,id)||roleFor(round,id)==='POLICE'||!m.ready)continue;const p=JSON.parse(m.state).position,crossing=pedestrianCrossing(p),previous=round.streetState[id],inside=!!crossing;
  if(previous&&inside&&!previous.inside&&Math.hypot(p[0]-previous.position[0],p[1]-previous.position[1])>.05&&Math.hypot(p[0]-previous.position[0],p[1]-previous.position[1])<6&&!pedestrianWalk(crossing.group,time)&&time-(previous.lastFine??-Infinity)>10_000){debit(round,id,JAYWALK_FINE,'jaywalking',time);round.alerts.push({id:crypto.randomUUID(),targetId:id,kind:'jaywalking',position:[...p],createdAt:time,expiresAt:time+ALERT_MS});previous.lastFine=time;}
  round.streetState[id]={inside,position:p,lastFine:previous?.lastFine??0};
 }
}
export function applyCityEvent(round,room,members,id,body,time){
 if(isOut(round,id))return {message:'You are dead. Wait for the next round.',code:'PLAYER_DEAD'};
 if(round.result)return {message:'The round has ended.',code:'MATCH_ENDED'};
 if(roleFor(round,id)==='POLICE')return {message:'The officer does not receive civilian fines or photo jobs.',code:'ACTION_FORBIDDEN'};
 const member=members.find(m=>m.player_id===id&&m.ready);if(!member)return {message:'Wait for your character to spawn.'};const p=JSON.parse(member.state).position;
 if(body.kind==='medical'){
  const car=body.carPosition;if(!Number.isInteger(body.carId)||body.carId<0||body.carId>=CITY_TRAFFIC_COUNT||!Number.isFinite(body.carSpeed)||body.carSpeed<=.2||body.carSpeed>12)return {message:'Only a moving traffic collision has a medical bill.'};if(!Array.isArray(car)||car.length!==3||!car.every(Number.isFinite)||Math.hypot(p[0]-car[0],p[1]-car[1])>3.6||Math.abs(p[2]-car[2])>1.4||!nearestRoad(car)||nearestRoad(car).distance>18)return {message:'No nearby road collision was detected.'};
  round.medicalAt??={};if(time-(round.medicalAt[id]??-Infinity)<10_000)return;round.medicalAt[id]=time;debit(round,id,MEDICAL_FINE,'medical',time);return;
 }
 if(body.kind==='photo'){
  if(roleFor(round,id)==='THIEF')return {message:'Photo requests are for pedestrians.',code:'ACTION_FORBIDDEN'};
  const task=round.photoTasks?.[id]?.find(t=>t.landmarkId===body.landmarkId),landmark=PHOTO_LANDMARKS.find(l=>l.id===body.landmarkId);
  if(!task||task.completedAt||time<room.started_at+task.dueAfter)return {message:'That photo request is not active.'};
  if(!landmark||!photoInView(p,body.heading,landmark))return {message:'Get within 95 metres and aim your camera at the requested building.'};
  const reward=photoReward(task);task.completedAt=time;round.wallets[id]=(round.wallets[id]??0)+reward;round.feedback[id]={id:crypto.randomUUID(),kind:'photo_reward',at:time,amount:reward,wallet:round.wallets[id],landmark:task.name};return;
 }
 return {message:'Unknown city action.',code:'INVALID_ACTION'};
}
export function streetAlerts(round,members,time){return (round?.alerts??[]).filter(a=>a.expiresAt>time).map(a=>{const m=members.find(m=>m.player_id===a.targetId);return {id:a.id,kind:a.kind,number:(m?.slot??0)+1,description:'Jaywalking',location:'Times Square',position:m?JSON.parse(m.state).position:a.position,createdAt:a.createdAt,expiresAt:a.expiresAt};});}
export {createPhotoTasks};
