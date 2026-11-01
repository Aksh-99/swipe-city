import test from 'node:test';
import assert from 'node:assert/strict';
import {createCarHitAudio} from '../src/car-hit-audio.js';
test('car-hit voices start immediately and use the correct male/female clip for every design',async()=>{
 let design='blonde',starts=0,stops=0;const listeners={},voices=[];
 class Context {
  constructor(){this.state='suspended';this.destination={};}
  async resume(){this.state='running';}
  async decodeAudioData(bytes){return {kind:bytes.byteLength===8?'female':'male'};}
  createBufferSource(){return {connect(){},start(){starts++;voices.push(this.buffer.kind);},stop(){stops++;}};}
 }
 const host={AudioContext:Context,fetch:async url=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(url.includes('female')?8:16)}),addEventListener:(name,fn)=>listeners[name]=fn};
 const play=createCarHitAudio({getDesign:()=>design,host});
 await new Promise(resolve=>setImmediate(resolve));
 play();assert.equal(starts,0,'waits for browser audio unlock');
 listeners.keydown();
 for(design of ['african_fem','asian_fem','blonde','indian_fem','irish']){const before=starts;play();assert.equal(starts,before+1,'no timer or delayed callback');}
 assert.deepEqual(voices,Array(5).fill('female'));
 for(design of ['white_male','bald','african','asian','indian']){const before=starts;play();assert.equal(starts,before+1);} 
 assert.deepEqual(voices.slice(5),Array(5).fill('male'));
 assert.equal(starts,10);assert.equal(stops,9,'repeated impacts replace the previous voice instead of layering');
});
