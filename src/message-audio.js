import {getGameAudio,SOUND_URLS} from './game-audio.js';
export function createMessageAudio({host=globalThis}={}){
 const audio=getGameAudio(host);let buffer=null,voice=null;
 audio.load(SOUND_URLS.message).then(value=>buffer=value).catch(()=>{});
 return ()=>{voice?.stop();if(audio.usesMedia){voice=audio.playMedia(SOUND_URLS.message);return;}const context=audio.context;if(!buffer||context?.state!=='running')return;voice=context.createBufferSource();voice.buffer=buffer;voice.connect(audio.destination);voice.start();};
}
