import test from 'node:test';import assert from 'node:assert/strict';
import {TabSessionOwner} from '../src/tab-session.js';
import {TestLockManager} from './tab-test-helper.js';
test('a held player identity cannot be restored by another tab, including concurrent copies',async()=>{
 const locks=new TestLockManager(),original=new TabSessionOwner({locks}),copies=Array.from({length:3},()=>new TabSessionOwner({locks}));
 try{assert.equal(await original.claim('player'),true);assert.deepEqual(await Promise.all(copies.map(owner=>owner.claim('player',{resume:true}))),[false,false,false]);assert.equal(original.id,'player');}
 finally{await Promise.all([original,...copies].map(owner=>owner.release()));}
 assert.equal(locks.held.size,0);
});
test('navigation releases the identity so the next document can resume it',async()=>{
 const locks=new TestLockManager(),before=new TabSessionOwner({locks}),after=new TabSessionOwner({locks});
 await before.claim('player');await before.release();assert.equal(await after.claim('player',{resume:true}),true);await after.release();assert.equal(locks.held.size,0);
});
test('unavailable or blocked Web Locks permit fresh memberships without reusing copied credentials',async()=>{
 for(const locks of [null,{request(){return Promise.reject(new Error('Storage access blocked'));}}]){
  const owner=new TabSessionOwner({locks});assert.equal(await owner.claim('copied',{resume:true}),false);assert.equal(await owner.claim('fresh'),true);assert.equal(owner.id,'fresh');await owner.release();
 }
});
