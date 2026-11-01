import {Vector3} from 'three';
// Reconcile physics immediately, easing only presentation; no speed/teleport allowance changes.
export function createPlayerCorrection({getPlayer,getCollision}){
 const offset=new Vector3();
 return {clear(){offset.set(0,0,0);},apply(state){const player=getPlayer(),world=getCollision(),target=new Vector3(...state.position),delta=target.clone().sub(player.position),distance=delta.length();if(distance>3||!world.ready(target)||world.resolve(target.clone()).distanceTo(target)>.05)return false;
  if(distance>.001){const origin=target.clone().add(new Vector3(0,0,.9)),hit=world.ray?.(origin,delta.clone().negate().normalize(),distance);if(hit&&hit.distance<distance)return false;}
  offset.sub(delta);player.position.copy(target);player.previousPresentation?.position.add(delta);return true;
 },present(presentation,dt){offset.multiplyScalar(Math.exp(-Math.max(0,dt)/.14));if(offset.lengthSq()<1e-8)offset.set(0,0,0);presentation.position.add(offset);return presentation;}};
}
