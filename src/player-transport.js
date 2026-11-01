import {Vector3} from 'three';
import {CONTROLLER} from './player.js';
import {containsPlayArea} from './play-area.js';

export async function placeTransportArrival({player,camera,collision,state,onPlaced=()=>{}}){
 const target=new Vector3(...state.position);
 if(!containsPlayArea(target,CONTROLLER.radius))throw new Error('This vehicle exit is outside the playable Times Square area.');
 await collision.stream(target);
 const floor=collision.ground(target,CONTROLLER.radius);
 if(Math.abs(floor-target.z)>.08||collision.resolve(target.clone()).distanceTo(target)>.05)throw new Error('The vehicle exit is blocked. Try again shortly.');
 player.reset();player.position.copy(target);player.heading=state.heading;player.snapPresentation();
 // Teleport only this controller. Orbit, pitch and zoom stay client-local.
 camera.boomLength=null;camera.update(player);onPlaced(player);
}
