import test from 'node:test';import assert from 'node:assert/strict';
import {gunshotVolume,createGunshotAudio} from '../src/gunshot-audio.js';
test('gunshots fade smoothly from same block to neighbouring and distant streets',()=>{
 assert.equal(gunshotVolume(0),1);assert(gunshotVolume(80)>.6);assert(gunshotVolume(240)<.2);assert(gunshotVolume(80)>gunshotVolume(240));assert.equal(gunshotVolume(600),0);
});
test('network gunshot plays once, uses listener distance, updates volume while moving and skips stale events',async()=>{
 const gains=[],sources=[],events={};
 class Context{constructor(){this.state='running';this.destination={};}async decodeAudioData(){return {};}createGain(){const gain={gain:{value:0},connect(){},disconnect(){}};gains.push(gain);return gain;}createBufferSource(){const source={connect(){},start(){this.played=true;},stop(){}};sources.push(source);return source;}}
 const audio=createGunshotAudio({host:{AudioContext:Context,fetch:async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(2)}),addEventListener:(k,v)=>events[k]=v}});await new Promise(r=>setImmediate(r));
 const shot={id:'shot',position:[0,0,0],at:1000};const update=(x,shots=[shot],time=1100)=>audio.update({matchId:'round',shots,time,position:{x,y:0,z:0}});
 update(80);assert.equal(sources.length,1);assert(sources[0].played);assert.equal(gains[1].gain.value,gunshotVolume(80));
 update(240);assert.equal(sources.length,1);assert.equal(gains[1].gain.value,gunshotVolume(240));
 update(80,[{...shot,id:'old',at:-5000}]);assert.equal(sources.length,1);
 update(0,[{...shot,id:'second',at:1200}],1300);assert.equal(sources.length,2);assert.equal(gains[2].gain.value,1);
});
test('officer or thief events arriving before audio unlock remain playable when context resumes',async()=>{
 const sources=[];let context,ready;class Context{constructor(){context=this;this.state='suspended';this.destination={};}decodeAudioData(){return new Promise(r=>ready=r);}createGain(){return {gain:{value:0},connect(){},disconnect(){}};}createBufferSource(){const s={connect(){},start(){sources.push(this);},stop(){}};return s;}async resume(){this.state='running';}}
 const events={},audio=createGunshotAudio({host:{AudioContext:Context,fetch:async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(2)}),addEventListener:(k,v)=>events[k]=v}});await new Promise(r=>setImmediate(r));const state={matchId:'round',shots:[{id:'officer-shot',at:1000,position:[0,0,0]}],position:{x:0,y:0,z:0},time:1100};audio.update(state);assert.equal(sources.length,0);ready({});await new Promise(r=>setImmediate(r));audio.update(state);events.keydown();audio.update({...state,time:1200});assert.equal(sources.length,1);audio.update(state);assert.equal(sources.length,1);
});
