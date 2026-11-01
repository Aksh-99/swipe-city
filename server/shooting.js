import {roleFor,isOut,catchThief} from './round-teams.js';
import {SHOT_LOOT,SURGERY_COST,SHOT_COOLDOWN_MS,nearShot} from '../src/round-rules.js';
// Called inside round.js's compare-and-swap transaction; all balances are private.
export function applyShot(round,actor,target,time,shotId,{allowMiss=false}={}){
 const id=actor.player_id,targetId=target?.player_id;
 round.shotReceipts??={};round.shotAt??={};round.dead??={};
 if(typeof shotId!=='string'||!/^[-a-f0-9]{36}$/i.test(shotId))return ['Invalid shot request.','INVALID_SHOT'];
 if(round.shotReceipts[shotId]===id)return;
 if(round.shotReceipts[shotId])return ['Invalid shot request.','INVALID_SHOT'];
 if(!allowMiss&&(!target?.ready||targetId===id||isOut(round,targetId)))return ['Aim at a living player.','SHOT_TARGET'];
 if(time-(round.shotAt[id]??-Infinity)<SHOT_COOLDOWN_MS)return ['Wait a moment before firing again.','SHOT_COOLDOWN'];
 if(!allowMiss&&!nearShot(JSON.parse(actor.state).position,JSON.parse(target.state).position))return ['Aim at a player within 20 metres.','TARGET_TOO_FAR'];
 round.shotAt[id]=time;round.shotReceipts[shotId]=id;
 round.gunshots??=[];round.gunshots.push({id:shotId,at:time,position:[...JSON.parse(actor.state).position]});
 if(allowMiss){round.feedback[id]={id:crypto.randomUUID(),actionId:shotId,kind:'shot_missed',at:time};return;}
 if(roleFor(round,id)==='POLICE'){
  if(roleFor(round,targetId)==='THIEF'){catchThief(round,targetId,id,time);round.feedback[id]={id:crypto.randomUUID(),actionId:shotId,kind:'arrested',at:time};}
  else{const amount=100;round.wallets[id]-=amount;round.penalties[id]=time+30000;round.penaltyKinds??={};round.penaltyKinds[id]='officer_defamation';round.feedback[id]={id:crypto.randomUUID(),actionId:shotId,kind:'officer_defamation',at:time,amount};delete round.actions[id];}
  return;
 }
 const before=round.wallets[targetId]??0,dead=before<SHOT_LOOT;
 if(dead){
  round.dead[targetId]={at:time};round.penalties[targetId]=Number.MAX_SAFE_INTEGER;
  round.deathNotices??=[];round.deathNotices.push({id:crypto.randomUUID(),playerId:targetId,name:target.name,number:target.slot+1,at:time});
  delete round.actions[targetId];
 }else{
  round.wallets[targetId]=before-SHOT_LOOT-SURGERY_COST;
  round.wallets[id]+=SHOT_LOOT;round.stolen+=SHOT_LOOT;
 }
 round.feedback[id]={id:crypto.randomUUID(),actionId:shotId,kind:'shot_fired',at:time,amount:dead?0:SHOT_LOOT,stolen:round.stolen,killed:dead};
 round.feedback[targetId]={id:crypto.randomUUID(),kind:dead?'dead':'shot',at:time,amount:dead?0:before-round.wallets[targetId],stolen:dead?0:SHOT_LOOT,surgery:dead?0:SURGERY_COST,wallet:round.wallets[targetId]};
}
