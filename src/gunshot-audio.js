import {getGameAudio,SOUND_URLS} from './game-audio.js';
// About one short Manhattan block (~80m) remains loud; distant blocks fade.
export const gunshotVolume=distance=>distance>=600?0:1/(1+(Math.max(0,distance)/110)**2);
export function createGunshotAudio({host=globalThis,url=SOUND_URLS.gunshot}={}){
 const audio=getGameAudio(host),context=audio.context;if(!context&&!audio.usesMedia)return {update(){}};
 let buffer=null,match=null;const heard=new Set(),voices=new Set();
 audio.load(url).then(decoded=>buffer=decoded).catch(()=>{});
 return {update({matchId,shots=[],time,position,enabled=true}){
  if(match!==matchId){match=matchId;heard.clear();for(const v of voices)v.source.stop();voices.clear();}
  if(!enabled){for(const v of voices)v.source.stop();voices.clear();for(const shot of shots)heard.add(shot.id);return;}
  if(!position)return;
  const volume=p=>gunshotVolume(Math.hypot(position.x-p[0],position.y-p[1],(position.z??0)-p[2]));
  for(const v of voices){const gain=volume(v.position);if(v.source.setVolume)v.source.setVolume(gain);else v.gain.gain.value=gain;}
  for(const shot of shots){
   if(heard.has(shot.id))continue;
   if(time-shot.at>5000||shot.at>time+500){heard.add(shot.id);continue;}
   if(!audio.usesMedia&&(!buffer||context.state!=='running'))continue;
   heard.add(shot.id);
   const value=volume(shot.position);if(value===0)continue;
   if(audio.usesMedia){const source=audio.playMedia(url,value),voice={source,position:shot.position};voices.add(voice);source.onended=()=>voices.delete(voice);continue;}
   const source=context.createBufferSource(),gain=context.createGain();source.buffer=buffer;gain.gain.value=value;
   source.connect(gain);gain.connect(audio.destination);
   const voice={source,gain,position:shot.position};voices.add(voice);source.onended=()=>{voices.delete(voice);gain.disconnect();};source.start();
  }
 }};
}
