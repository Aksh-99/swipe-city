import {getGameAudio,SOUND_URLS} from './game-audio.js';
const FEMALE_DESIGNS=new Set(['african_fem','asian_fem','blonde','indian_fem','irish']);
export function createCarHitAudio({getDesign,getVolume=()=>1,host=globalThis,femaleUrl=SOUND_URLS.female,maleUrl=SOUND_URLS.male}={}){
 const audio=getGameAudio(host),context=audio.context;if(!context&&!audio.usesMedia)return ()=>{};
 let voice=null,pendingUntil=0;const buffers={};
 for(const [kind,url] of [['female',femaleUrl],['male',maleUrl]])audio.load(url).then(decoded=>{buffers[kind]=decoded;retry();}).catch(()=>{});
 function retry(){if(pendingUntil&&Date.now()<=pendingUntil&&context.state==='running')play();}
 const unsubscribe=audio.subscribe(retry);
 function play(){
  if(audio.usesMedia){voice?.stop();voice=audio.playMedia(FEMALE_DESIGNS.has(getDesign())?femaleUrl:maleUrl,getVolume());return;}
  const buffer=buffers[FEMALE_DESIGNS.has(getDesign())?'female':'male'];
  if(!buffer||context.state!=='running'){pendingUntil=Date.now()+1000;return;}
  pendingUntil=0;
  voice?.stop();voice=context.createBufferSource();voice.buffer=buffer;
  if(context.createGain){const gain=context.createGain();gain.gain.value=getVolume();voice.connect(gain);gain.connect(audio.destination);voice.onended=()=>gain.disconnect();}else voice.connect(audio.destination);voice.start();
 }
 play.dispose=()=>{unsubscribe();voice?.stop();};
 return play;
}
