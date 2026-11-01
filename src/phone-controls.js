import {isPoliceCharacter} from './appearances.js';
import {CALL_COOLDOWN,canWitnessReport} from './dispatch-rules.js';
import {money} from './round-rules.js';
import {matchTiming,formatMatchTime} from './match-time.js';

export function mountPhoneControls({document:doc=globalThis.document,onOpen=()=>{},call911=async()=>{throw new Error('Join a room and start the match to call 911.');}}={}){
 const $=id=>doc.getElementById(id),phone=$('phone'),call=$('phone-call-911'),screen=$('phone-emergency'),end=$('phone-end-call');
 let state={characterId:'explorer',phase:'solo',canMove:false},pending=false,listKey='',context='',claimKey='',reportAges=[];
 const text=(element,value)=>{if(element.textContent!==value)element.textContent=value;};
 const close=()=>{screen.hidden=true;call.setAttribute('aria-expanded','false');update(state);if(!call.hidden&&!call.disabled)call.focus();else phone.focus();};
 phone.setAttribute('tabindex','-1');
 function updateTimer(next=state,serverTime=next.serverTime??Date.now()){
  const timing=matchTiming(next,serverTime),active=timing.endsAt!==null;
  $('phone-match-timer').setAttribute('data-state',timing.expired?'ended':active&&timing.remainingMs<=60_000?'urgent':active?'running':'waiting');
  text($('phone-time-left'),formatMatchTime(timing.remainingMs));
  text($('phone-timer-label'),timing.expired?timing.remainingMs>0?'Round over':"Time's up":active?'Time left':'Waiting for start');
  for(const {element,createdAt,prefix='Reported'} of reportAges){const age=Math.max(0,Math.floor((serverTime-createdAt)/1000));text(element,age?`${prefix}: ${age} sec ago`:`${prefix}: just now`);}
 }
 function update(next){
  const nextContext=`${next.roomCode??''}/${next.matchId??''}/${next.characterId??''}/${next.yourRound?.role??''}`;
  if(nextContext!==context){screen.hidden=true;call.setAttribute('aria-expanded','false');context=nextContext;}
  state=next;updateTimer(state);const police=isPoliceCharacter(state.characterId),canReport=canWitnessReport(state),connected=state.phase==='connected',calls=state.dispatchCalls??[],ended=state.matchPhase==='ended';
  const wallet=Number.isFinite(state.yourRound?.wallet),loss=state.yourRound?.feedback;
  $('phone-wallet').hidden=!wallet;text($('phone-wallet-balance'),money(state.yourRound?.wallet));
  const recentLoss=wallet&&['shot','wallet_loss','false_report','medical','jaywalking'].includes(loss?.kind)&&(state.serverTime??Date.now())-loss.at<6000;
  $('phone-wallet-loss').hidden=!recentLoss;text($('phone-wallet-loss'),recentLoss?`−${money(loss.amount)} ${({false_report:'defamation fine',medical:'medical bill',jaywalking:'jaywalking fine',wallet_loss:'stolen',shot:'shot: theft and surgery'})[loss.kind]}`:'');
  phone.setAttribute('data-mode',police?'police':'civilian');
  $('phone-map').setAttribute('aria-label',police?'Times Square streets, your location, and reported last-seen locations':'Times Square streets and live player position');
  text($('phone-app-title'),police?'NYPD DISPATCH':'Times Square');
  call.hidden=!canReport;$('phone-dispatch-bar').hidden=!police;$('phone-dispatch-status').hidden=!police;$('phone-dispatch-list').hidden=!police;$('phone-call-hint').hidden=!canReport;
  $('phone-suspect').hidden=!canReport||!state.suspect;
  const selectedKey=`${state.suspect?.playerId??''}/${state.suspect?.expiresAt??''}`;
  if(selectedKey!==claimKey){claimKey=selectedKey;$('phone-report-theft').checked=state.suspect?.activity==='shooting';}
  text($('phone-suspect-title'),state.selecting?'Selecting person…':state.suspect?.locked?'Person selected':'Suspect nearby');
  text($('phone-suspect-description'),state.suspect?.description??'');
  text($('phone-suspect-detail'),state.selecting?'Saving your sighting…':state.suspect?.expiresAt?`Saved sighting · ${Math.max(0,Math.ceil((state.suspect.expiresAt-(state.serverTime??Date.now()))/1000))}s to report`:'Press R to save this sighting.');
  const remaining=Math.max(0,Math.ceil(((state.yourCall?.createdAt??-CALL_COOLDOWN)+CALL_COOLDOWN-(state.serverTime??Date.now()))/1000));
  call.disabled=!canReport||pending||!screen.hidden||!state.canMove||remaining>0||!state.suspect||!!state.selecting;
  text($('phone-call-hint'),!state.roomCode?'Join a room to send a 911 report.':!connected?'Reconnecting…':ended?'Match ended.':state.matchPhase!=='playing'?'Start the match to send a 911 report.':remaining?`Call again in ${remaining}s`:!state.canMove?'Please wait…':!state.suspect?'Get close and look at a person. Press R to review.':'Reports describe appearances; they do not confirm a crime.');
  text($('phone-dispatch-duty'),!state.roomCode?'OFFLINE':!connected?'RECONNECTING':ended?'MATCH ENDED':state.matchPhase==='playing'?'ON DUTY':'WAITING ROOM');
  text($('phone-alert-count'),`${calls.length} ${calls.length===1?'alert':'alerts'}`);
  text($('phone-dispatch-status'),!state.roomCode?'Join a room to receive 911 reports.':!connected?'Dispatch reconnecting…':calls.length?'Red markers show last-seen locations.':'Waiting for witness reports.');
  const key=police?calls.map(c=>c.id).join('|'):'';
  if(key!==listKey){
   listKey=key;reportAges=[];$('phone-dispatch-list').replaceChildren();
   if(police)for(const c of calls){
    const item=doc.createElement('li');item.setAttribute('class','phone-report');
    const line=(tag,value,cls)=>{const node=doc.createElement(tag);node.textContent=value;if(cls)node.setAttribute('class',cls);item.append(node);return node;};
    line('strong',c.kind==='jaywalking'?'JAYWALKING':'911 REPORT','phone-report-heading');line('p',c.kind==='jaywalking'?'Red pedestrian signal crossed':c.kind==='suspect'?(c.activity==='shooting'?'Pickpocketing reported':'Suspicious person reported'):'Emergency location reported','phone-report-kind');
    if(c.description)line('strong',c.description,'phone-report-description');
    line('p',`${c.kind==='suspect'?'Last seen':'Location'}: ${c.location??'Times Square'}`);line('p',`${c.kind==='jaywalking'?'Seen player':'Caller'}: Player ${c.number}`);
    reportAges.push({element:line('p','Reported: just now','phone-report-age'),createdAt:c.createdAt??state.serverTime});
    if(c.kind==='suspect'&&Number.isFinite(c.lastSeenAt))reportAges.push({element:line('p','Seen: just now','phone-report-seen'),createdAt:c.lastSeenAt,prefix:'Seen'});
    if(Number.isFinite(c.remainingMs))line('p',`${formatMatchTime(c.remainingMs)} remaining when reported`,'phone-report-time');
    $('phone-dispatch-list').append(item);
   }
   updateTimer(state);
  }
 }
 call.addEventListener('click',async()=>{
  if(call.disabled||pending)return;
  const suspectId=state.suspect.playerId,description=state.suspect.description;
  onOpen();pending=true;screen.hidden=false;call.setAttribute('aria-expanded','true');const callContext=context;
  text($('phone-call-progress'),'Sending witness report…');text($('phone-call-detail'),description);update(state);end.focus();
  try{
   const result=await call911(suspectId,$('phone-report-theft').checked?'shooting':'suspicious');if(callContext!==context)return;
   if(!result?.yourCall)throw new Error('The report was not sent. Please look at the person again.');
   text($('phone-call-progress'),'Report sent');text($('phone-call-detail'),`${result.yourCall.description??description} · ${result.yourCall.location??'Times Square'}`);
  }catch(error){if(callContext===context){text($('phone-call-progress'),'Call not sent');text($('phone-call-detail'),error.message);}}
  finally{pending=false;update(state);}
 });
 end.addEventListener('click',close);
 phone.addEventListener('keydown',event=>{if(event.code==='Escape'&&!screen.hidden){event.preventDefault();event.stopPropagation();close();}});
 function reviewSuspect(){if(!state.suspect||!canWitnessReport(state)||!state.canMove)return false;onOpen();call.focus();return true;}
 update(state);return {update,updateTimer,reviewSuspect};
}
