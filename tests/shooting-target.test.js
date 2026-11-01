import test from 'node:test';import assert from 'node:assert/strict';import {Vector3} from 'three';
import {interactionTarget} from '../src/interaction-targets.js';
test('shoot targets a living aimed-at player including officer, within range and visible; cooldown/death hide prompt',()=>{
 const state={yourId:'thief',yourRound:{role:'THIEF',availablePlayerIds:['victim'],nextShotAt:0}},player={position:new Vector3(),grounded:true},person={id:'victim',characterId:'pedestrian',position:new Vector3(0,5,0)},camera={position:new Vector3(0,-4,1.35),direction:new Vector3(0,1,0)},collision={ready:()=>true,ray:()=>null};
 const find=()=>interactionTarget({state,player,people:[person],camera,collision,time:1000});assert.equal(find().kind,'shoot');
 camera.direction.set(1,0,0);assert.equal(find(),null);camera.direction.set(0,1,0);
 collision.ray=()=>({distance:1});assert.equal(find(),null);collision.ray=()=>null;
 person.position.y=20;assert.equal(find()?.targetId,'victim');person.position.y=20.01;assert.equal(find(),null);person.position.y=5;
 person.position.z=3;assert.equal(find(),null);person.position.z=0;
 person.dead=true;assert.equal(find(),null);person.dead=false;state.yourRound.dead=true;assert.equal(find(),null);state.yourRound.dead=false;
 state.yourRound.nextShotAt=2000;assert.equal(find(),null);
});
test('weapon selects the full body at close range, but misses beside it and respects walls',()=>{
 const player={position:new Vector3(),grounded:true},person={id:'victim',position:new Vector3(0,2,0)},state={yourId:'thief',yourRound:{role:'THIEF',availablePlayerIds:['victim']}},camera={position:new Vector3(0,.05,1.6),direction:new Vector3(0,1,0)},collision={ready:()=>true,ray:()=>null};
 const find=()=>interactionTarget({state,player,people:[person],camera,collision,time:1000});
 for(const height of [.3,.8,1.35,1.7]){camera.direction.copy(new Vector3(0,2,height).sub(camera.position).normalize());assert.equal(find()?.targetId,'victim',`aim height ${height}`);}
 camera.direction.copy(new Vector3(1,2,1.6).sub(camera.position).normalize());assert.equal(find(),null);
 camera.direction.set(0,1,0);collision.ray=()=>({distance:.5});assert.equal(find(),null);
});
