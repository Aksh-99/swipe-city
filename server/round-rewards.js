import {roleFor,isOut} from './round-teams.js';
import {debit} from './city-rules.js';
import {CALL_LIFETIME} from '../src/dispatch-rules.js';
import {FALSE_REPORT_FINE,REPORT_PENALTY_MS,RICHEST_REWARD,POLICE_ASSIST_REWARD} from '../src/round-rules.js';

// Accepted 911 calls are recorded privately, without judging the suspect.
// An arrest is the only point at which a report is resolved against a role.
export function collectReports(round,members,time){
 round.reports??={};round.penalties??={};round.assists??={};round.rewards??={};
 if(round.result)return;
 for(const member of members){
  if(isOut(round,member.player_id)||roleFor(round,member.player_id)!=='PEDESTRIAN')continue;
  const call=JSON.parse(member.state)._dispatch?.call;
  if(!call||call.kind!=='suspect'||call.matchId!==round.matchId||typeof call.id!=='string'||typeof call.suspectId!=='string'||!Number.isFinite(call.createdAt)||call.createdAt>time||time-call.createdAt>=CALL_LIFETIME)continue;
  if(!round.reports[call.id]){round.reports[call.id]={reporterId:member.player_id,suspectId:call.suspectId,createdAt:call.createdAt,expiresAt:call.createdAt+CALL_LIFETIME,outcome:null,fineApplied:false};if(roleFor(round,call.suspectId)!=='THIEF'){debit(round,member.player_id,FALSE_REPORT_FINE,'false_report',time);round.reports[call.id].fineApplied=true;}}
 }
}
export const reportsForArrest=(round,targetId,time)=>Object.entries(round.reports??{}).filter(([,r])=>!r.outcome&&r.suspectId===targetId&&r.createdAt<=time&&time<r.expiresAt).map(([id])=>id);
export function resolveArrestReports(round,action,members,time){
 const correct=roleFor(round,action.targetId)==='THIEF',reporters=new Set();
 for(const id of action.reportIds??[]){
  const report=round.reports[id];if(!report||report.outcome||report.suspectId!==action.targetId)continue;
  report.outcome=correct?'assisted':'innocent';report.resolvedAt=time;reporters.add(report.reporterId);
 }
 for(const id of reporters){
  if(roleFor(round,id)!=='PEDESTRIAN'||!members.some(m=>m.player_id===id))continue;
  if(correct){round.assists[id]=true;continue;}
  // Defamation is charged once when the false report is accepted.

 }
}
export function finishRewards(round,members){
 if(!round.result||round.result.awards)return;
 round.result.awards=[];
 if(round.result.reason==='disconnected')return;
 const civilians=members.filter(m=>m.ready&&!isOut(round,m.player_id)&&roleFor(round,m.player_id)!=='POLICE').map(m=>({playerId:m.player_id,number:m.slot+1,name:m.name,balance:round.wallets[m.player_id]??0}));
 const highest=Math.max(...civilians.map(p=>p.balance));
 for(const person of civilians){
  const add=(kind,amount)=>{if(!amount)return;round.result.awards.push({...person,kind,amount});round.rewards[person.playerId]=(round.rewards[person.playerId]??0)+amount;};
  if(person.balance===highest)add('richest',RICHEST_REWARD);
  if(round.assists[person.playerId]&&roleFor(round,person.playerId)!=='THIEF')add('police_assist',POLICE_ASSIST_REWARD);
 }
 for(const person of civilians)round.wallets[person.playerId]+=(round.rewards[person.playerId]??0);
}
