import {createMediaAudio} from './media-audio.js';
const sessions=new WeakMap();
export const SOUND_URLS={message:'/audio/iphone-message.wav',gunshot:'/audio/gunshot.wav?v=direct-1',female:'/audio/female-car-hit.wav',male:'/audio/male-car-hit.wav'};
// One output context, installed by the home page before the first Play click.
export function getGameAudio(host=globalThis){
 if(sessions.has(host))return sessions.get(host);
 const Context=host.AudioContext??host.webkitAudioContext;let context=null;try{context=Context?new Context():null;}catch{}
 const master=context?.createGain?.();if(master){master.gain.value=1;master.connect(context.destination);}
 const destination=master??context?.destination,loads=new Map(),errors=new Map(),listeners=new Set();let muted=false,unlocked=false;
 let media=null;
 const status=()=>({available:!!context||!!media,state:media?(media.enabled?'running':'suspended'):context?.state??'unavailable',muted,errors:[...errors.values()]});
 const emit=()=>{for(const fn of listeners)fn(status());};
 media=createMediaAudio(host,Object.values(SOUND_URLS),{changed:emit,failed:(url,message)=>{errors.set(url,message);emit();},loaded:url=>{errors.delete(url);emit();}});
 function unlock(){
  if(muted)return Promise.resolve();
  media?.unlock();
  if(!context)return Promise.resolve();
  // resume() must run synchronously inside the actual click/touch/key handler.
  let resumed;try{resumed=context.state==='running'?Promise.resolve():context.resume();}catch(error){return Promise.reject(error);}
  if(!unlocked&&context.createBuffer){const source=context.createBufferSource();source.buffer=context.createBuffer(1,1,context.sampleRate);source.connect(destination);source.start();unlocked=true;}
  return Promise.resolve(resumed).then(emit);
 }
 for(const event of ['pointerdown','touchend','keydown','click'])host.addEventListener(event,e=>{if(e?.target?.closest?.('#game-sound-enable'))return;unlock().catch(emit);},{capture:true});
 context?.addEventListener?.('statechange',emit);
 host.document?.addEventListener('visibilitychange',()=>{if(!host.document.hidden&&unlocked)unlock().catch(emit);});
 async function load(url){
  if(!context)throw Error('This browser does not support game sound.');
  if(!loads.has(url))loads.set(url,(async()=>{try{const response=await host.fetch(url);if(!response.ok)throw Error(`Sound file failed to load (${response.status??'network'}).`);if(response.headers?.get('content-type')?.includes('text/html'))throw Error('Sound file returned a page instead of audio.');const buffer=await context.decodeAudioData(await response.arrayBuffer());errors.delete(url);emit();return buffer;}catch(error){errors.set(url,error.message);loads.delete(url);emit();throw error;}})());
  return loads.get(url);
 }
 const audio={context,destination,master,usesMedia:!!media,playMedia:(url,volume)=>media.play(url,volume),load,unlock,status,subscribe(fn){listeners.add(fn);fn(status());return()=>listeners.delete(fn);},setMuted(value){muted=!!value;media?.setMuted(muted);if(master)master.gain.value=muted?0:1;emit();},async test(){audio.setMuted(false);if(media){const voice=media.play(SOUND_URLS.gunshot);await voice.ready;return voice;}await unlock();const buffer=await load(SOUND_URLS.gunshot);if(context.state!=='running')throw Error('Sound is blocked. Click Enable sound and try again.');const source=context.createBufferSource();source.buffer=buffer;source.connect(destination);source.start();return source;}};
 sessions.set(host,audio);return audio;
}
