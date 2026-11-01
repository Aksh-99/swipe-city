const SILENT_AUDIO='data:audio/wav;base64,UklGRsQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
// Direct media playback avoids device/output issues in browser Web Audio.
// Each element is primed from a real user gesture and reused for later effects.
export function createMediaAudio(host,urls,{changed=()=>{},failed=()=>{},loaded=()=>{}}={}){
 if(typeof host.Audio!=='function')return null;
 const slots=[];let enabled=false,muted=false;
 function slot(url){const media=new host.Audio(SILENT_AUDIO);media.preload='auto';media.playsInline=true;media.volume=1;const s={url,media,primed:false,busy:false,at:0};slots.push(s);return s;}
 for(const url of urls)for(let i=0;i<(url.includes('gunshot')?6:1);i++)slot(url);
 const reset=media=>{try{media.currentTime=0;}catch{}};
 return {
  get enabled(){return enabled;},
  unlock(){for(const s of slots){if(s.primed||s.busy)continue;const m=s.media;if(m.src!==SILENT_AUDIO)m.src=SILENT_AUDIO;m.volume=0;try{const p=m.play();Promise.resolve(p).then(()=>{s.primed=true;enabled=true;if(!s.busy){m.pause();reset(m);m.volume=1;}changed();}).catch(()=>{});}catch{}}},
  setMuted(value){muted=value;for(const s of slots)s.media.muted=value;},
  play(url,volume=1){
   const pool=slots.filter(s=>s.url===url),s=pool.find(s=>!s.busy)??pool.sort((a,b)=>a.at-b.at)[0]??slot(url),m=s.media;
   s.voice?.stop();m.pause();if(m.src!==url)m.src=url;reset(m);s.busy=true;s.at=Date.now();m.muted=muted;m.volume=Math.max(0,Math.min(1,volume));
   const voice={element:m,stop(){m.pause();s.busy=false;voice.onended?.();},setVolume(value){m.volume=Math.max(0,Math.min(1,value));},onended:null,ready:null};
   s.voice=voice;
   m.onended=()=>{s.busy=false;voice.onended?.();};
   m.onerror=()=>{s.busy=false;failed(url,'The browser could not play this sound.');voice.onended?.();};
   // No await before play(): Safari needs the user gesture's activation.
   try{voice.ready=Promise.resolve(m.play()).then(()=>{s.primed=true;enabled=true;loaded(url);changed();return voice;}).catch(error=>{s.busy=false;failed(url,error.name==='NotAllowedError'?'Audio blocked by browser. Click Enable sound to enable it.':`Sound playback failed: ${error.message}`);voice.onended?.();throw error;});}catch(error){s.busy=false;failed(url,error.message);voice.ready=Promise.reject(error);}
   voice.ready.catch(()=>{});return voice;
  }
 };
}
