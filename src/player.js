import { Vector3 } from 'three';
import {capturePresentation} from './player-presentation.js';
import {constrainPlayArea,PLAY_AREA_PLAYER_RADIUS} from './play-area.js';
export const FIXED_STEP=1/60;
export function movement(keys,yaw) {
  const forward=(keys.has('ArrowUp')||keys.has('KeyW')?1:0)-(keys.has('ArrowDown')||keys.has('KeyS')?1:0),right=(keys.has('ArrowRight')||keys.has('KeyD')?1:0)-(keys.has('ArrowLeft')||keys.has('KeyA')?1:0);
  const v=new Vector3(Math.sin(yaw)*forward+Math.cos(yaw)*right,Math.cos(yaw)*forward-Math.sin(yaw)*right,0);
  if(v.lengthSq()>0)v.normalize(); return v;
}
export const CONTROLLER={walkSpeed:3.2,sprintSpeed:8,acceleration:24,braking:32,turnRate:14,radius:PLAY_AREA_PLAYER_RADIUS,height:1.78,stepHeight:.23,stepDown:.24,gravity:9.81,jumpSpeed:4.6,coyoteTime:.10,jumpBuffer:.12};
const approach=(value,target,amount)=>Math.abs(target-value)<=amount+1e-10?target:value<target?value+amount:value-amount;
export function turnToward(heading,target,maxChange){const delta=Math.atan2(Math.sin(target-heading),Math.cos(target-heading));return heading+Math.max(-maxChange,Math.min(maxChange,delta));}
export class Player {
  // Offline scenery authoring can inspect the older, larger geometry extent.
  // Runtime/local/multiplayer players use the playable perimeter by default.
  constructor(collision,{bounded=true}={}) {this.collision=collision;this.bounded=bounded;this.position=new Vector3();this.reset();}
  reset() {this.position.set(0,0,.05);this.velocityZ=0;this.heading=0;this.speed=0;this.commandSpeed=0;this.running=false;this.runBlend=0;this.poseWeight=0;this.airBlend=0;this.animationTime=0;this.carHitAt=-1;this.gaitPhase=0;this.grounded=true;this.jumpHeld=false;this.jumpBuffer=0;this.coyoteTime=0;this.travelDirection=new Vector3();this.snapPresentation();}
  snapPresentation(){this.previousPresentation=capturePresentation(this);}
  update(dt,keys,yaw) {
    dt=Math.max(0,Math.min(dt,.05));if(!dt)return;
    this.previousPresentation=capturePresentation(this);
    const jumpDown=keys.has('Space'),jumpPressed=jumpDown&&!this.jumpHeld;this.jumpHeld=jumpDown;
    this.jumpBuffer=jumpPressed?CONTROLLER.jumpBuffer:Math.max(0,this.jumpBuffer-dt);
    if(!this.collision.ready(this.position)){this.speed=0;this.commandSpeed=0;this.running=false;this.velocityZ=0;this.jumpBuffer=0;this.coyoteTime=0;this.poseWeight*=Math.exp(-dt/.14);this.runBlend=approach(this.runBlend,0,dt*4);return;}
    // A reload can restore a saved airborne position after reset(). Establish
    // real support before granting the first grounded/edge jump allowance.
    if(this.grounded&&this.coyoteTime===0&&this.position.z>this.collision.ground(this.position,CONTROLLER.radius)+.06)this.grounded=false;
    this.coyoteTime=this.grounded?CONTROLLER.coyoteTime:Math.max(0,this.coyoteTime-dt);
    // A press is consumed once. Brief edge/landing grace keeps curbs forgiving
    // without adding double jumps or automatic hopping when Space is held.
    if(this.jumpBuffer>0&&this.coyoteTime>0){this.velocityZ=CONTROLLER.jumpSpeed;this.grounded=false;this.coyoteTime=0;this.jumpBuffer=0;}
    const input=movement(keys,yaw),hasInput=input.lengthSq()>0,sprint=hasInput&&(keys.has('ShiftLeft')||keys.has('ShiftRight'));
    const targetSpeed=hasInput?(sprint?CONTROLLER.sprintSpeed:CONTROLLER.walkSpeed):0;
    this.commandSpeed=approach(this.commandSpeed,targetSpeed,(targetSpeed>this.commandSpeed?CONTROLLER.acceleration:CONTROLLER.braking)*dt);
    // Input stays camera-relative and responsive; visual facing turns smoothly.
    // Braking keeps the last direction for a short, predictable stopping step.
    if(hasInput)this.travelDirection.copy(input);
    const v=this.travelDirection,previous=this.position.clone();
    this.velocityZ-=CONTROLLER.gravity*dt;
    const count=Math.max(1,Math.ceil(Math.max(this.commandSpeed,Math.abs(this.velocityZ))*dt/.10));
    for(let i=0;i<count;i++){
      const next=this.position.clone().addScaledVector(v,this.commandSpeed*dt/count);next.z+=this.velocityZ*dt/count;
      if(this.bounded)constrainPlayArea(next,CONTROLLER.radius);
      if(!this.collision.ready(next)){this.commandSpeed=0;break;}
      if(this.grounded&&this.velocityZ<=0){const floor=this.collision.ground(next,CONTROLLER.radius),rise=floor-this.position.z;if(rise>=-CONTROLLER.stepDown&&rise<=CONTROLLER.stepHeight){next.z=floor;this.velocityZ=0;}}
      const attemptedZ=next.z;this.collision.resolve(next,CONTROLLER.radius,CONTROLLER.height);
      if(this.velocityZ>0&&next.z<attemptedZ-.00001)this.velocityZ=0;
      if(this.bounded)constrainPlayArea(next,CONTROLLER.radius);
      const floor=this.collision.ground(next,CONTROLLER.radius);
      this.grounded=this.velocityZ<=0&&next.z<=floor+.03;
      if(this.grounded){next.z=floor;this.velocityZ=0;}
      this.position.copy(next);
    }
    const displacement=this.position.clone().sub(previous).setZ(0);
    this.speed=displacement.length()/dt;
    if(this.speed<.025)this.speed=0;
    this.running=!!sprint&&this.speed>CONTROLLER.walkSpeed+.3;
    this.runBlend=approach(this.runBlend,this.running?1:0,dt*4);
    this.airBlend=approach(this.airBlend,this.grounded?0:1,dt*10);
    this.animationTime+=dt;
    const weightTarget=Math.min(1,this.speed/.9);
    this.poseWeight+=(weightTarget-this.poseWeight)*(1-Math.exp(-dt/.14));
    if(this.poseWeight<.001)this.poseWeight=0;
    if(this.speed){this.heading=turnToward(this.heading,Math.atan2(displacement.x,displacement.y),CONTROLLER.turnRate*dt);if(this.grounded)this.gaitPhase+=displacement.length()*(2.5-.75*this.runBlend);}
  }
}
