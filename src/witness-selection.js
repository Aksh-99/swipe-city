import {Vector3} from 'three';
import {appearanceDescription} from './appearances.js';
import {SUSPECT_VIEW_DISTANCE,SUSPECT_SELECTION_LIFETIME} from './dispatch-rules.js';

// Local camera/visibility stays on this client. The only report intent sent to
// the server is a selected member ID, never a camera, description or secret role.
export function observedPerson({selfId,position,cameraPosition,cameraDirection,people,collision,maxAngle=.17,bodyTarget=false,maxDistance=SUSPECT_VIEW_DISTANCE}){
 if(!cameraPosition||!cameraDirection||!position||collision?.ready?.(position)===false)return null;
 let best=null;
 for(const person of people){
  if(person.id===selfId||!person.position)continue;
  const distance=position.distanceTo(person.position);if(distance>maxDistance)continue;
  const chest=person.position.clone().add(new Vector3(0,0,1.35));
  if(bodyTarget){
   // Pick the closest point on the standing body to the camera ray. Aiming
   // at a head, waist or legs must work as well as aiming at the chest.
   let bestOffset=Infinity;
   for(let z=.25;z<=1.75;z+=.1){const point=person.position.clone().add(new Vector3(0,0,z)),along=point.clone().sub(cameraPosition).dot(cameraDirection);if(along<=0)continue;const offset=point.distanceTo(cameraPosition.clone().addScaledVector(cameraDirection,along));if(offset<bestOffset){bestOffset=offset;chest.copy(point);}}
  }
  const delta=chest.clone().sub(cameraPosition),length=delta.length();
  if(length<.1)continue;const direction=delta.divideScalar(length),alignment=direction.dot(cameraDirection);
  if(alignment<Math.cos(bodyTarget?Math.atan2(.35,length):maxAngle))continue;
  const hit=collision?.ray(cameraPosition,direction,length);
  if(hit&&hit.distance<length-.3)continue;
  const score=(1-alignment)*100+distance*.001;
  if(!best||score<best.score)best={playerId:person.id,description:appearanceDescription(person.characterId,'natural'),distance,score,...(person.interaction?.motion==='reach'?{activity:'pickpocketing'}:{})};
 }
 return best&&{playerId:best.playerId,description:best.description,distance:best.distance,...(best.activity?{activity:best.activity}:{})};
}

export class WitnessSelection{
 constructor(){this.context=null;this.current=null;this.selected=null;}
 update({context,enabled,time,...view}){
  if(context!==this.context||!enabled){this.clear();this.context=context;if(!enabled)return null;}
  this.current=observedPerson(view);
  if(this.selected&&(time-this.selected.observedAt>=SUSPECT_SELECTION_LIFETIME||!view.people.some(p=>p.id===this.selected.playerId)))this.selected=null;
  return this.get(time);
 }
 capture(time){if(!this.current)return null;this.selected={...this.current,observedAt:time,locked:true};return this.get(time);}
 get(time){if(this.selected&&time-this.selected.observedAt>=SUSPECT_SELECTION_LIFETIME)this.selected=null;return this.selected??this.current;}
 clear(){this.current=null;this.selected=null;}
}
