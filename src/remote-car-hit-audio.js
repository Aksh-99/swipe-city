import {createCarHitAudio} from './car-hit-audio.js';
export const crashVoiceVolume=distance=>distance>=90?0:1/(1+(Math.max(0,distance)/20)**2);
export function createRemoteCarHitAudio({host=globalThis,play=null}={}){
 let match=null;const seen=new Map(),voices=new Map();
 return {update({matchId,players=[],selfId,position}){
  if(match!==matchId){match=matchId;seen.clear();for(const voice of voices.values())voice.sound.dispose?.();voices.clear();}if(!position)return;
  for(const p of players){if(p.id===selfId||!p.ready)continue;const hit=p.state?.carHitAt;if(!Number.isFinite(hit)||hit<0){seen.delete(p.id);continue;}if(seen.get(p.id)===hit)continue;seen.set(p.id,hit);
   const age=(p.state.animationTime??0)-hit;if(p.dead||p.caught||age<-.5||age>2)continue;const at=p.state.position,volume=crashVoiceVolume(Math.hypot(position.x-at[0],position.y-at[1],(position.z??0)-at[2]));if(!volume)continue;
   if(play){play(p.designId,volume,p.id);continue;}
   let voice=voices.get(p.id);if(!voice){voice={design:p.designId,volume};voice.sound=createCarHitAudio({host,getDesign:()=>voice.design,getVolume:()=>voice.volume});voices.set(p.id,voice);}voice.design=p.designId;voice.volume=volume;voice.sound();
  }
 }};
}
