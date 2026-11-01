import {nearInteraction,nearShot,SHOT_RANGE} from './round-rules.js';
import {observedPerson} from './witness-selection.js';
export function interactionTarget({state,player,people,camera,collision,time,shoot=false}){
 const role=state.yourRound?.role;if(state.yourRound?.dead||state.yourRound?.caught||!role||!player||collision?.ready?.(player.position)===false||!player.grounded)return null;
 if(role==='THIEF'||role==='POLICE'&&shoot){
  if((state.yourRound.nextShotAt??0)>time)return null;
  const available=new Set(state.yourRound.availablePlayerIds);
  const target=observedPerson({selfId:state.yourId,position:player.position,cameraPosition:camera?.position,cameraDirection:camera?.direction,people:people.filter(p=>available.has(p.id)&&!p.dead&&!p.caught&&nearShot(player.position.toArray(),p.position.toArray())),collision,bodyTarget:true,maxDistance:SHOT_RANGE});
  const person=people.find(p=>p.id===target?.playerId);
  const key=role==='POLICE'?'F':'E';
  return person?{kind:'shoot',targetId:person.id,position:person.position,distance:target.distance,label:`${key} — Shoot`,detail:`Press ${key} to shoot this player.`}:null;
 }
 if(role==='POLICE'&&(state.yourRound.cooldownUntil??0)<=time){
  const nearby=people.filter(p=>!p.dead&&!p.caught&&nearInteraction(player.position.toArray(),p.position.toArray()));
  const target=observedPerson({selfId:state.yourId,position:player.position,cameraPosition:camera?.position,cameraDirection:camera?.direction,people:nearby,collision});
  const person=nearby.find(p=>p.id===target?.playerId);
  return person?{kind:'arrest',targetId:person.id,position:person.position,label:'Hold E — Arrest · F — Shoot',detail:target.description}:null;
 }return null;
}
