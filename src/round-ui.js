import {notificationCenter} from './notifications.js';
import {THEFT_GOAL,money,interactionProgress} from './round-rules.js';
const descriptions={THIEF:{title:'YOU ARE THE THIEF',objective:'Survive until the timer ends.',detail:"Press A for zoomed aim, then press E to shoot. Steal $100 per hit; the victim also pays $100 for surgery. Avoid arrest until 0:00."},POLICE:{title:'YOU ARE THE OFFICER',objective:'Respond to reports. Catch all thieves.',detail:'Hold E nearby to arrest, or press A for zoomed aim and F to shoot. Shooting an innocent costs $100 and freezes you for 30 seconds. A wrongful arrest freezes you for 10 seconds.'},PEDESTRIAN:{title:'YOU ARE A PEDESTRIAN',objective:'Protect your wallet. Help police catch the thief.',detail:'Look at a player, press R, then call 911. Everyone starts with $500. A shot costs $100 stolen plus $100 surgery. Being shot with less than $100 kills you. Photo requests pay $20–$90 each. Moving-car medical bills cost $200, jaywalking $40, and false reports $120.'}};
export function mountRoundUI({document:doc=globalThis.document,rematch=async()=>{},onOpen=()=>{}}={}){
 const $=id=>doc.getElementById(id),role=$('round-role'),intro=$('round-intro'),result=$('round-result'),toast=$('round-toast'),prompt=$('interaction-prompt');let match=null,roleUntil=0,feedbackId=null,toastUntil=0,rematchPending=false,awardsKey='',noticeUntil=0,deathSeen=new Set();
 if(doc.body){const center=notificationCenter(doc);for(const id of ['round-intro','round-dead','round-toast','round-death-notice'])center.append($(id));}
 const text=(id,value)=>{const e=$(id);if(e.textContent!==value)e.textContent=value;};
 $('round-dismiss').addEventListener('click',()=>{roleUntil=0;intro.hidden=true;});
 $('round-rematch').addEventListener('click',async()=>{if(rematchPending||$('round-rematch').disabled)return;onOpen();rematchPending=true;$('round-rematch').disabled=true;try{await rematch();}catch(error){text('round-rematch-status',error.message);}finally{rematchPending=false;}});
 function update(state,time){
  const connected=!!state.roomCode,r=state.yourRound,active=state.matchPhase==='playing'&&r;
  if(state.matchId!==match){match=state.matchId;roleUntil=active?time+6500:0;feedbackId=null;toastUntil=0;deathSeen.clear();noticeUntil=0;}
  role.hidden=!active;intro.hidden=!active||time>=roleUntil||!!state.preparing;
  if(r){const d=descriptions[r.role];role.setAttribute('data-role',r.role);intro.setAttribute('data-role',r.role);text('round-role-title',r.role==='POLICE'?'OFFICER':r.role);text('round-intro-title',d.title);text('round-intro-objective',d.objective);text('round-intro-detail',d.detail);
   text('round-objective',r.role==='THIEF'?'Stay free until 0:00. A to aim · E to shoot.':r.role==='POLICE'?'Follow reports. Hold E to arrest · A to aim · F to shoot.':'Look at a player. R to report.');
   const wallet=Number.isFinite(r.wallet);$('round-money').hidden=!wallet;text('round-money',`Wallet: ${money(r.wallet)}`);
   $('officer-shoot').hidden=!active||r.role!=='POLICE'||!!r.dead||!!r.caught;$('officer-shoot').disabled=!state.canMove;
   const cooldown=Math.max(0,Math.ceil(((r.penaltyUntil??r.cooldownUntil??0)-time)/1000));$('round-cooldown').hidden=!cooldown||!!r.dead||!!r.caught;text('round-cooldown',`${r.penaltyKind==='officer_defamation'?'DEFAMATION':r.role==='POLICE'?'WRITE-UP':'FALSE REPORT'} · Movement locked: ${cooldown}s`);
   if(r.feedback&&r.feedback.id!==feedbackId){feedbackId=r.feedback.id;if(time-r.feedback.at<6000){toastUntil=time+5000;text('round-toast',r.feedback.kind==='officer_defamation'?`WRONG PERSON · −${money(r.feedback.amount)} defamation · Movement locked for 30 seconds`:r.feedback.kind==='caught'?'YOU WERE CAUGHT':r.feedback.kind==='shot_missed'?'SHOT FIRED · No player hit':r.feedback.kind==='shot_fired'?(r.feedback.killed?'SHOT FIRED · Player eliminated':`SHOT FIRED · +${money(r.feedback.amount)} stolen`):r.feedback.kind==='shot'?`YOU WERE SHOT · ${money(r.feedback.stolen)} stolen + ${money(r.feedback.surgery)} surgery`:r.feedback.kind==='dead'?'YOU ARE DEAD':r.feedback.kind==='theft'?`+${money(r.feedback.amount)} stolen · ${money(r.feedback.stolen)} / ${money(THEFT_GOAL)}`:r.feedback.kind==='wallet_loss'?`−${money(r.feedback.amount)} from your wallet · ${money(r.feedback.wallet)} left`:r.feedback.kind==='false_report'?`DEFAMATION · −${money(r.feedback.amount)} fine`:r.feedback.kind==='medical'?`MEDICAL BILL · −${money(r.feedback.amount)}`:r.feedback.kind==='jaywalking'?`JAYWALKING · −${money(r.feedback.amount)}`:r.feedback.kind==='photo_reward'?`PHOTO COMPLETE · +${money(r.feedback.amount)}`:r.feedback.kind==='wrongful_arrest'?'WRONGFUL ARREST · Innocent pedestrian · WRITE-UP: movement locked for 10 seconds':r.feedback.kind==='interrupted'?'Hold interrupted. Stay close and hold E again.':'THIEF ARRESTED');toast.setAttribute('data-kind',r.feedback.kind);}}
  }
  toast.hidden=!active||time>=toastUntil;
  $('round-dead').hidden=!active||(!r?.dead&&!r?.caught);
  text('round-dead-title',r?.caught?'YOU WERE CAUGHT':'YOU ARE DEAD');
  text('round-dead-detail',r?.caught?'An officer caught you. You are out until the next round.':'You were shot with less than $100. You are out until the next round.');
  if(!active)$('officer-shoot').hidden=true;
  const fresh=(state.deathNotices??[]).filter(n=>!deathSeen.has(n.id));for(const n of fresh)deathSeen.add(n.id);
  const recent=fresh;if(connected&&r&&recent.length){noticeUntil=time+7000;text('round-death-notice',recent.map(n=>`Player ${n.number} · ${n.name} has died`).join(' · '));}
  $('round-death-notice').hidden=!connected||!r||time>=noticeUntil;
  if(active&&(r?.dead||r?.caught)){intro.hidden=true;prompt.hidden=true;}
  const ended=connected&&state.matchPhase==='ended';result.hidden=!ended;
  if(ended){
   const win=state.roundResult;result.setAttribute('data-winner',win?.winner??'none');
   text('round-result-title',win?.winner==='THIEF'?(r?.teamCounts?.thieves>1?'THIEVES WIN':'THIEF WINS'):win?.winner==='POLICE'?'POLICE WIN':'ROUND ENDED');
   text('round-result-reason',win?.reason==='all_caught'?'All thieves were caught or eliminated.':win?.reason==='arrested'?'THIEF ARRESTED':win?.reason==='survived'?'A thief survived the full round without being caught.':win?.reason==='escaped'?'The thief escaped arrest.':win?.reason==='target_missed'?'Time ran out before the thief reached $500.':win?.reason==='disconnected'?'The officer or thief disconnected. Reconnect and play a rematch.':"Time's up.");
   text('round-result-money',win?`${money(win.stolen)} stolen`:'');
   const awards=win?.awards??[],key=`${state.matchId}/${JSON.stringify(awards)}`;
   if(key!==awardsKey){awardsKey=key;$('round-awards').replaceChildren();for(const award of awards){
    const card=doc.createElement('div');card.setAttribute('class','round-award');
    const title=doc.createElement('strong');title.textContent=award.kind==='richest'?'RICHEST PLAYER':'POLICE ASSIST';
    const person=doc.createElement('p');person.textContent=`Player ${award.number} · ${award.name}`;
    const bonus=doc.createElement('span');bonus.textContent=`+${money(award.amount)}${award.kind==='richest'?` · ${money(award.balance)} before bonuses`:''}`;
    card.append(title,person,bonus);$('round-awards').append(card);
   }}
   $('round-awards').hidden=!awards.length;
   $('round-result-reward').hidden=!Number.isFinite(r?.finalBalance)||r?.role==='POLICE';text('round-result-reward',`Your bonus: +${money(r?.reward)} · Final balance: ${money(r?.finalBalance)}`);
   $('round-rematch').hidden=!state.isHost;$('round-rematch').disabled=!state.canRematch||rematchPending;
   text('round-rematch-status',state.isHost?'Open the same-room lobby, then start with 4–20 players.':'Waiting for the host to open a rematch lobby.');
  }
 }
 function updateInteraction(view,time){
  prompt.hidden=!view.candidate&&!view.action&&!view.beginning;const action=view.action,candidate=view.candidate;
  text('interaction-label',view.beginning?(candidate?.kind==='shoot'?'Firing…':'Preparing hold…'):action?`Hold E — ${action.kind==='pickpocket'?'Pickpocket':'Arrest'}`:candidate?.label??'');
  text('interaction-detail',view.finishing?'Checking action…':action?'Stay close. Keep holding E.':candidate?.detail??'');
  const progress=interactionProgress(action,time),circle=$('interaction-ring');circle.setAttribute('stroke-dashoffset',String(113.1*(1-progress)));
  $('interaction-progress').setAttribute('aria-valuenow',String(Math.round(progress*100)));
  $('interaction-hold').disabled=!view.candidate&&!view.action&&!view.beginning;
 }
 return {update,updateInteraction,onHold(begin,end){const button=$('interaction-hold');button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture?.(e.pointerId);begin();});button.addEventListener('pointerup',end);button.addEventListener('pointercancel',end);button.addEventListener('keydown',e=>{if(['Space','Enter'].includes(e.code)){e.preventDefault();if(!e.repeat)begin();}});button.addEventListener('keyup',e=>{if(['Space','Enter'].includes(e.code)){e.preventDefault();end();}});}};
}
