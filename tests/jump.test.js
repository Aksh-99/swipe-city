import test from 'node:test';
import assert from 'node:assert/strict';
import {Vector3} from 'three';
import {Player,FIXED_STEP,CONTROLLER} from '../src/player.js';
import {CollisionWorld} from '../src/collision.js';
import {DetailMesh} from '../src/detail-mesh.js';
import {samplePresentation} from '../src/player-presentation.js';
import {locomotionPose} from '../src/locomotion-pose.js';
import {DEFAULT_ROOM_STATE,copyPlayerState,playerState,validPlayerState} from '../src/room-protocol.js';
import {RemoteTrack} from '../src/remote-players.js';

const flat=()=>({ready:()=>true,resolve:p=>p,ground:()=>0});
const ticks=(p,n,keys=new Set())=>{for(let i=0;i<n;i++)p.update(FIXED_STEP,keys,0);};
const held=new Set(['Space']);
const obstacleWorld=boxes=>{
 const mesh=new DetailMesh(),world=new CollisionWorld([]);
 for(const [x,y,z,width,depth,height] of boxes)mesh.box(new Vector3(x,y,z),new Vector3(1,0,0),new Vector3(0,1,0),width,depth,height,null,true);
 world.addStatic('obstacles',new Float32Array(mesh.collision));return world;
};

test('Space jumps about one metre, lands, and requires release before another jump',()=>{
 const p=new Player(flat());let peak=0,landedAt=0;
 for(let i=0;i<120;i++){p.update(FIXED_STEP,held,0);peak=Math.max(peak,p.position.z);if(i>1&&p.grounded&&!landedAt)landedAt=(i+1)*FIXED_STEP;}
 assert(peak>1&&peak<1.15);assert(landedAt>.85&&landedAt<1.05);
 assert.equal(p.position.z,0);assert.equal(p.velocityZ,0);assert.equal(p.airBlend,0);
 ticks(p,1);ticks(p,1,held);assert(p.velocityZ>0);assert(!p.grounded);
 ticks(p,1);const velocity=p.velocityZ;ticks(p,1,held);
 assert(p.velocityZ<velocity,'a fresh press in midair cannot double jump');
});

test('a press just before landing is buffered, and late midair presses expire',()=>{
 const p=new Player(flat());p.position.z=.10;p.grounded=false;p.velocityZ=-1;
 ticks(p,1,held);let launched=false;
 for(let i=0;i<12;i++){p.update(FIXED_STEP,held,0);if(p.velocityZ>0)launched=true;}
 assert(launched,'landing consumes a recent press even while Space remains held');
 const late=new Player(flat());late.position.z=2;late.grounded=false;late.velocityZ=0;
 ticks(late,90,held);assert(late.grounded);assert.equal(late.position.z,0);assert.equal(late.velocityZ,0);
});

test('curb-edge grace permits a prompt jump but expires after leaving the ledge',()=>{
 const floor={...flat(),ground:p=>p.y<.4?.8:0},make=()=>{const p=new Player(floor);p.position.set(0,.39,.8);while(p.grounded)p.update(FIXED_STEP,new Set(['ArrowUp']),0);return p;};
 const early=make();ticks(early,1,new Set(['ArrowUp','Space']));assert(early.velocityZ>0);
 const late=make();ticks(late,8,new Set(['ArrowUp']));ticks(late,1,new Set(['ArrowUp','Space']));assert(late.velocityZ<0);
});

test('sprint direction stays responsive in the air and the walking cycle pauses',()=>{
 const p=new Player(flat());ticks(p,30,new Set(['ArrowUp','ShiftLeft']));const phase=p.gaitPhase,start=p.position.clone();
 ticks(p,6,new Set(['ArrowUp','ShiftLeft','Space']));assert(p.position.y>start.y+.79);assert(Math.abs(p.speed-8)<1e-8);assert.equal(p.gaitPhase,phase);assert.equal(p.airBlend,1);
 ticks(p,1,new Set(['ArrowRight','ShiftLeft','Space']));assert(p.position.x>start.x);assert(p.heading>0);
});

test('jump lands on actual curb/stair triangles and can launch from their surface',()=>{
 const boxes=Array.from({length:5},(_,i)=>{const start=.6+i*.4,height=(i+1)*.17;return [0,(start+8)/2,height/2,4,8-start,height];});
 const p=new Player(obstacleWorld(boxes));let peak=0;
 for(let i=0;i<120;i++){p.update(FIXED_STEP,new Set(['ArrowUp','Space']),0);peak=Math.max(peak,p.position.z);}
 assert(peak>1);assert(p.position.y>5);assert(p.grounded);assert(Math.abs(p.position.z-.85)<.002);
 ticks(p,1);ticks(p,1,held);assert(p.position.z>.85);assert(p.velocityZ>0);
});

test('solid walls block a sprinting jump and ceilings cancel upward velocity',()=>{
 const p=new Player(obstacleWorld([[0,3,2,20,.04,4]]));ticks(p,120,new Set(['ArrowUp','ShiftLeft','Space']));
 assert(p.position.y<2.67);assert(p.grounded);assert(p.position.z<.01);
 const ceiling=new Player(obstacleWorld([[0,0,2.2,4,4,.10]]));let peak=0,hit=false;
 for(let i=0;i<90;i++){ceiling.update(FIXED_STEP,held,0);peak=Math.max(peak,ceiling.position.z);if(i<15&&ceiling.velocityZ===0&&ceiling.position.z>.1)hit=true;}
 assert(hit);assert(peak<=2.15-CONTROLLER.height+.002);assert(ceiling.grounded);assert.equal(ceiling.position.z,0);
});

test('reset/transport and unavailable collision clear queued jump state',()=>{
 let ready=false;const p=new Player({...flat(),ready:()=>ready});ticks(p,1,held);ready=true;ticks(p,10,held);
 assert(p.grounded);assert.equal(p.velocityZ,0,'holding Space across a streaming pause cannot launch an unseen jump');
 ticks(p,1);ticks(p,1,held);assert(p.airBlend>0);p.reset();
 assert.equal(p.jumpHeld,false);assert.equal(p.jumpBuffer,0);assert.equal(p.airBlend,0);assert.equal(p.velocityZ,0);assert(p.grounded);
 p.position.z=1; // Restored saved pose, before the first physics tick.
 ticks(p,1,held);assert(p.velocityZ<0);assert(!p.grounded,'a restored airborne pose must land before jumping again');
});

test('local and remote airborne poses blend smoothly, including old stored room states',()=>{
 const p=new Player(flat());p.update(FIXED_STEP,held,0);const mid=samplePresentation(p,.5);
 assert(mid.position.z>p.previousPresentation.position.z&&mid.position.z<p.position.z);assert(mid.airBlend>0&&mid.airBlend<p.airBlend);
 let previous=locomotionPose(p);
 for(let i=0;i<80;i++){p.update(FIXED_STEP,held,0);const pose=locomotionPose(p);for(const key of Object.keys(pose.angles))assert(Math.abs(pose.angles[key]-previous.angles[key])<.2,`${key}: smooth takeoff/landing`);previous=pose;}
 const old={...DEFAULT_ROOM_STATE};delete old.airBlend;assert(validPlayerState(old));assert.equal(copyPlayerState(old).airBlend,0);
 for(const bad of [NaN,Infinity,-.01,1.01,'1',null])assert(!validPlayerState({...DEFAULT_ROOM_STATE,airBlend:bad}));
 const state=playerState(p);assert(validPlayerState(state));assert.equal(state.airBlend,p.airBlend);
 const track=new RemoteTrack();track.push({sequence:1,updatedAt:1000,state:old});track.push({sequence:2,updatedAt:1100,state:{...DEFAULT_ROOM_STATE,position:[0,0,1.17],airBlend:1}});
 const remote=track.sample(1050);assert.equal(remote.airBlend,.5);assert(Math.abs(remote.position.z-.67)<1e-10);
 assert(locomotionPose(remote).angles.LeftKnee>locomotionPose(old).angles.LeftKnee);
});
