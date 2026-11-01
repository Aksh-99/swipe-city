import {interactionProgress} from './round-rules.js';
// Keyboard/pointer intent only. No client awards, secret target roles or timers
// that can complete an action without the room server's approval.
export class InteractionController{
 constructor({client,onBegin=()=>{},onChange=()=>{},onError=()=>{}}){Object.assign(this,{client,onBegin,onChange,onError});this.candidate=null;this.holding=false;this.beginning=false;this.finishing=false;this.needsRelease=false;this.action=null;this.retryAt=0;this.context=null;this.time=0;this.enabled=false;}
 get busy(){return this.holding||this.beginning||this.finishing;}
 view(){return {candidate:this.candidate,action:this.action,holding:this.holding,beginning:this.beginning,finishing:this.finishing,needsRelease:this.needsRelease,progress:interactionProgress(this.action,this.time)};}
 update({state,candidate,time,enabled,inputHeld=true,moving=false}){
  this.time=time;this.enabled=enabled;
  const context=`${state.roomCode??''}/${state.matchId??''}/${state.yourId??''}`;
  if(context!==this.context){this.holding=false;this.beginning=false;this.finishing=false;this.action=null;this.needsRelease=false;this.retryAt=0;this.client.interactionHeld=false;this.context=context;}
  this.candidate=enabled?candidate:null;
  if((!enabled||!inputHeld||moving)&&this.holding)this.release();
  const action=state.yourRound?.action??null;
  if(!this.beginning){
   if(this.action&&!action&&this.holding){this.holding=false;this.client.interactionHeld=false;}
   this.action=action;
  }
  if(this.holding&&this.action&&time>=this.action.endsAt&&time>=this.retryAt&&!this.beginning&&!this.finishing)this.complete();
  this.onChange(this.view());
 }
 press(){
  if(!this.enabled||!this.candidate||this.needsRelease||this.busy)return false;
  const candidate=this.candidate,context=this.context;
  this.holding=true;this.needsRelease=true;this.beginning=true;this.onBegin(candidate);this.onChange(this.view());
  this.client.beginInteraction(candidate.kind,candidate.targetId).then(async result=>{
   if(context!==this.context)return;
   this.action=result?.yourRound?.action??null;
   if(candidate.kind==='shoot'){this.holding=false;this.client.interactionHeld=false;}
   if(!this.holding&&this.action)await this.client.cancelInteraction(this.action.id);
  }).catch(error=>{if(context===this.context){this.holding=false;this.action=null;this.client.interactionHeld=false;this.onError(error);}}).finally(()=>{if(context===this.context){this.beginning=false;this.onChange(this.view());}});
  return true;
 }
 release(){
  const id=this.action?.id;this.holding=false;this.client.interactionHeld=false;
  if(id&&!this.beginning&&!this.finishing)this.client.cancelInteraction(id).catch(this.onError);
  this.onChange(this.view());
 }
 keyReleased(){this.needsRelease=false;if(this.holding)this.release();}
 async complete(){
  if(!this.action)return;const id=this.action.id,context=this.context;this.finishing=true;
  try{await this.client.finishInteraction(id);if(context===this.context){this.holding=false;this.action=null;this.client.interactionHeld=false;}}
  catch(error){if(context===this.context){if(error.code==='HOLD_INCOMPLETE')this.retryAt=this.time+150;else{this.holding=false;this.action=null;this.client.interactionHeld=false;this.onError(error);}}}
  finally{if(context===this.context){this.finishing=false;this.onChange(this.view());}}
 }
}
