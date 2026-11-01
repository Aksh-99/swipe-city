import test from 'node:test';import assert from 'node:assert/strict';
import {Vector3} from 'three';import {Event} from 'cesium';
import {loadResource,createTaskQueue} from '../src/resource-loading.js';
import {CollisionWorld} from '../src/collision.js';import {NycCitySource} from '../src/city-source.js';
import {tryDrawSquarePhoto} from '../src/square-photo.js';
const triangle=new Float32Array([-2,-2,0,2,-2,0,0,2,0]);
const tile=(i=0)=>({uri:'tile'+i,collision:'/collision'+i,bounds:[i*70,0,0,i*70+3,3,10]});

test('resource loading retries temporary server failures but does not flood permanent missing files',async()=>{
 let calls=0;const result=await loadResource('/scene',{type:'json',wait:async()=>{},fetcher:async()=>++calls===1?new Response('busy',{status:503}):Response.json({ready:true})});assert.deepEqual(result,{ready:true});assert.equal(calls,2);
 calls=0;await assert.rejects(()=>loadResource('/missing',{wait:async()=>{},fetcher:async()=>{calls++;return new Response('',{status:404});}}),/404/);assert.equal(calls,1);
});
test('a hanging download is aborted and its timer is always released',async()=>{
 let expire,cleared=0,signal;const pending=loadResource('/slow',{attempts:1,setTimer:fn=>{expire=fn;return 1;},clearTimer:()=>cleared++,fetcher:async(url,init)=>{signal=init.signal;return new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(new Error('aborted'))));}});
 expire();await assert.rejects(()=>pending,/timed out/);assert(signal.aborted);assert.equal(cleared,1);
});
test('resource queue bounds active work and continues after a task fails',async()=>{
 const run=createTaskQueue(3);let active=0,peak=0;const jobs=Array.from({length:15},(_,i)=>run(async()=>{peak=Math.max(peak,++active);try{await new Promise(resolve=>setImmediate(resolve));if(i===4)throw Error('test');return i;}finally{active--;}}));const result=await Promise.allSettled(jobs);assert.equal(peak,3);assert.equal(result.filter(r=>r.status==='fulfilled').length,14);assert.equal(active,0);
});
test('one collision download failure does not permanently freeze already loaded streets, and a later retry recovers',async()=>{
 let broken=true;const world=new CollisionWorld([tile(0),tile(1)],{resourceOptions:{attempts:1,fetcher:async url=>url==='/collision1'&&broken?new Response('',{status:503}):new Response(triangle)}});
 try{await assert.rejects(()=>world.stream(new Vector3(0,0,0)));assert(world.error);assert(world.ready(new Vector3(0,0,.17)),'safe loaded streets remain playable');assert(!world.ready(new Vector3(71,0,.17)),'missing local collision must still stop movement');assert.equal(world.pending.size,0);broken=false;await world.stream(new Vector3(71,0,.17));assert(world.ready(new Vector3(71,0,.17)));assert.equal(world.error,null);}finally{for(const row of world.loaded.values())row.geometry.dispose();}
});
test('concurrent collision requests share their tile and never exceed the download limit',async()=>{
 let calls=0,active=0,peak=0;const world=new CollisionWorld([tile(0)],{concurrency:2,resourceOptions:{fetcher:async()=>{calls++;peak=Math.max(peak,++active);await new Promise(resolve=>setImmediate(resolve));active--;return new Response(triangle);}}});
 try{await Promise.all(Array.from({length:8},()=>world.load(tile(0))));assert.equal(calls,1);assert.equal(peak,1);assert.equal(world.pending.size,0);}finally{for(const row of world.loaded.values())row.geometry.dispose();}
});
test('a failed visual tile does not reject an otherwise visible city or leak visibility listeners',async()=>{
 const city=new NycCitySource(),scene={renderError:new Event(),postRender:new Event()};city.error=Error('distant tile unavailable');city.loaded=new Set([{}]);city.visible=new Set([{}]);const ready=city.waitUntilVisible({scene});scene.postRender.raiseEvent();await ready;assert.equal(scene.postRender.numberOfListeners,0);assert.equal(scene.renderError.numberOfListeners,0);
});
test('a zero-size canvas or unavailable preview cannot escape into the game render loop',()=>{
 assert.equal(tryDrawSquarePhoto({width:0,height:100},{}),false);assert.equal(tryDrawSquarePhoto({width:100,height:100},{getContext:()=>null}),false);let drawn=0;assert(tryDrawSquarePhoto({width:100,height:80},{width:20,height:20,getContext:()=>({drawImage:()=>drawn++})}));assert.equal(drawn,1);
});

test('bounded collision downloads prioritize the street under the player before distant geometry',async()=>{
 const order=[],world=new CollisionWorld([tile(2),tile(1),tile(0)],{concurrency:1,resourceOptions:{fetcher:async url=>{order.push(url);return new Response(triangle);}}});try{await world.stream(new Vector3(0,0,.17));assert.deepEqual(order,['/collision0','/collision1','/collision2']);}finally{for(const row of world.loaded.values())row.geometry.dispose();}
});
