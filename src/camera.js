import { Vector3 } from 'three';
import { toWorld,worldDirection } from './coordinates.js';
export class ThirdPersonCamera {
  constructor(viewer,collision){this.viewer=viewer;this.collision=collision;this.yaw=-2.742;this.pitch=-.10;this.distance=5.5;this.boomLength=null;this.aiming=false;this.aimBlend=0;}
  reset(){this.yaw=-2.742;this.pitch=-.10;this.distance=5.5;this.boomLength=null;this.aiming=false;this.aimBlend=0;}
  setAim(value){this.aiming=!!value;}
  orbit(dx,dy){this.yaw+=dx*.0025;this.pitch=Math.max(-.45,Math.min(1.15,this.pitch+dy*.0025));}
  zoom(delta){this.distance=Math.max(2.5,Math.min(9.5,this.distance*Math.exp(delta*.001)));}
  update(player,dt=1/60) {
    const target=player.position.clone().add(new Vector3(0,0,1.6));
    const boomAt=pitch=>new Vector3(-Math.sin(this.yaw)*Math.cos(pitch),-Math.cos(this.yaw)*Math.cos(pitch),Math.sin(pitch));
    const clearance=direction=>{const hit=this.collision.cameraCast?this.collision.cameraCast(target,direction,this.distance+.3,.16):this.collision.ray(target,direction,this.distance+.3);return hit?Math.max(.08,Math.min(this.distance,hit.distance-.18)):this.distance;};
    let boom=boomAt(this.pitch),distance=clearance(boom);this.obstacleLift=false;
    // Low planters, bikes and rails should lift the chase camera instead of
    // forcing it into the runner's head and hiding the character.
    if(distance<1.4){for(const pitch of[.35,.60,.85,1.10]){if(pitch<=this.pitch)continue;const candidate=boomAt(pitch),available=clearance(candidate);if(available>=Math.min(2.5,this.distance)){boom=candidate;distance=available;this.obstacleLift=true;break;}}}
    // Allow a close camera against a landing wall. A large minimum boom can
    // put the camera on the far side when the character is next to the wall.
    // Retract immediately for safety, then ease out when an obstacle clears.
    const blend=1-Math.exp(-Math.min(Math.max(dt,0),.1)/.16);
    this.boomLength=this.boomLength===null||(this.obstacleLift&&this.boomLength<1.4)?distance:distance<this.boomLength?distance:this.boomLength+(distance-this.boomLength)*blend;
    const position=target.clone().addScaledVector(boom,this.boomLength);
    // The player ground probe starts above the feet to allow curb stepping.
    // A camera needs a downward-only probe: looking above it can mistake a
    // canopy underside for ground and lift the camera through the roof.
    const floorHit=this.collision.ray(position,new Vector3(0,0,-1),3);
    const floor=Math.max(this.collision.groundBase?.(position)??0,floorHit?.point.z??-Infinity);
    position.z=Math.max(floor+.45,position.z);
    // Floor clearance can change the sightline; check that adjusted boom too.
    const adjusted=position.clone().sub(target),length=adjusted.length();
    if(length&&this.collision.cameraCast){const contact=this.collision.cameraCast(target,adjusted.clone().normalize(),length,.16);if(contact)position.copy(target).addScaledVector(adjusted,Math.max(0,contact.distance-.08)/length);}
    this.aimBlend+=(Number(this.aiming)-this.aimBlend)*(1-Math.exp(-Math.min(Math.max(dt,0),.1)/.10));
    const aimDirection=boomAt(this.pitch).negate(),eye=target.clone().addScaledVector(aimDirection,.05);position.lerp(eye,this.aimBlend);
    this.distanceToPlayer=position.distanceTo(target);
    const direction=target.clone().sub(position).normalize().lerp(aimDirection,this.aimBlend).normalize();
    this.position=position;this.direction=direction;
    this.viewer.camera.setView({destination:toWorld(position),orientation:{direction:worldDirection(direction),up:worldDirection(new Vector3(0,0,1))}});
    this.viewer.camera.frustum.fov=(68-34*this.aimBlend)*Math.PI/180;this.viewer.camera.frustum.near=.08;this.viewer.camera.frustum.far=2500;
  }
}
