import test from 'node:test';
import assert from 'node:assert/strict';
import {Player} from '../src/player.js';
import {samplePresentation} from '../src/player-presentation.js';
import {playerState,copyPlayerState,validPlayerState} from '../src/room-protocol.js';
import {RemoteTrack} from '../src/remote-players.js';

test('car-hit reaction reaches local presentation and multiplayer without interpolation of its trigger',()=>{
 const p=new Player({ready:()=>true,resolve:p=>p,ground:()=>0});
 assert.equal(playerState(p).carHitAt,undefined);
 p.animationTime=10;p.carHitAt=9.5;
 assert.equal(samplePresentation(p,.5).carHitAt,9.5);
 const packet=playerState(p);assert(validPlayerState(packet));
 const copied=copyPlayerState(packet);assert.equal(copied.carHitAt,9.5);
 const track=new RemoteTrack();track.push({state:copied,updatedAt:1000,sequence:1},1000);
 assert.equal(track.sample(1000).carHitAt,9.5);
 for(const bad of [-1,NaN,Infinity,'9',null,11])assert(!validPlayerState({...packet,carHitAt:bad}));
 p.reset();assert.equal(playerState(p).carHitAt,undefined);
});
