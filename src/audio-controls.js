import {getGameAudio,SOUND_URLS} from './game-audio.js';
export function mountAudioControls({host=globalThis,document:doc=host.document}={}){
 const audio=getGameAudio(host),panel=doc.createElement('aside');panel.id='game-audio-controls';panel.setAttribute('aria-label','Game sound');panel.innerHTML='<div><button id="game-sound-enable" type="button">Enable sound</button></div><span id="game-sound-status" role="status"></span>';doc.body.append(panel);
 const enable=panel.querySelector('#game-sound-enable'),label=panel.querySelector('#game-sound-status');
 function update(s){enable.textContent=s.muted?'Sound: Off':s.state==='running'?'Sound: On':'Enable sound';enable.setAttribute('aria-pressed',String(!s.muted&&s.state==='running'));enable.disabled=!s.available;label.textContent=s.errors[0]??(!s.available?'Sound unavailable in this browser.':s.muted?'Muted':s.state==='running'?'':'Click to enable game audio');}
 audio.subscribe(update);
 enable.onclick=()=>{const s=audio.status();if(s.state==='running'&&!s.muted){audio.setMuted(true);return;}audio.setMuted(false);audio.unlock().catch(error=>label.textContent=error.message);};
 for(const url of Object.values(SOUND_URLS))audio.load(url).catch(()=>{});
 return audio;
}
