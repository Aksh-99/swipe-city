import test from 'node:test';import assert from 'node:assert/strict';
import {InteractionController} from '../src/interaction-controller.js';
const flush=()=>new Promise(r=>setImmediate(r));
const state={roomCode:'ABC234',matchId:'one',yourId:'me',yourRound:{action:null}},candidate={kind:'pickpocket',targetId:'npc-1'},action={id:'held',kind:'pickpocket',targetId:'npc-1',startedAt:1000,endsAt:3400};
test('releasing during an in-flight begin cancels the issued action and cannot complete or award it',async()=>{
 let resolve,count=0,finish=0;const client={interactionHeld:false,beginInteraction(){this.interactionHeld=true;return new Promise(r=>resolve=r);},async cancelInteraction(id){assert.equal(id,'held');count++;},async finishInteraction(){finish++;}};
 const controller=new InteractionController({client});controller.update({state,candidate,time:1000,enabled:true,inputHeld:true});assert(controller.press());controller.keyReleased();resolve({yourRound:{action}});await flush();assert.equal(count,1);assert.equal(finish,0);assert.equal(controller.holding,false);assert.equal(client.interactionHeld,false);
});
test('room/round changes release pending holds without leaving the new round locked',async()=>{
 let resolve;const client={interactionHeld:false,beginInteraction(){this.interactionHeld=true;return new Promise(r=>resolve=r);},async cancelInteraction(){},async finishInteraction(){}};
 const controller=new InteractionController({client});controller.update({state,candidate,time:1000,enabled:true});assert(controller.press());assert(controller.busy);
 controller.update({state:{...state,matchId:'two'},candidate,time:2000,enabled:true,inputHeld:false});assert.equal(controller.busy,false);assert.equal(client.interactionHeld,false);resolve({yourRound:{action}});await flush();assert.equal(controller.action,null);assert.equal(controller.busy,false);
});
test('shoot is a single press with no hold or finish request',async()=>{
 let shots=0;const client={interactionHeld:false,async beginInteraction(kind){assert.equal(kind,'shoot');shots++;return {yourRound:{action:null}};},async finishInteraction(){assert.fail('instant shots must not finish a hold');}};
 const c=new InteractionController({client});c.update({state,candidate:{kind:'shoot',targetId:'victim'},time:1000,enabled:true});assert(c.press());await flush();assert.equal(c.busy,false);assert.equal(client.interactionHeld,false);assert.equal(c.press(),false);c.keyReleased();assert(c.press());await flush();assert.equal(shots,2);
});
