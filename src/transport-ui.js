import {CallbackProperty,Color,Cartesian2,DistanceDisplayCondition,LabelStyle} from 'cesium';
import {Vector3} from 'three';
import {toWorld} from './coordinates.js';
import {TRANSPORT_PORTALS,findTransport} from './transport-config.js';
import {allowedTransport} from './transport-rules.js';

export function mountTransportUI(viewer,getPlayer,getAccess){
 const prompt=document.createElement('div');prompt.id='transport-prompt';prompt.hidden=true;prompt.setAttribute('role','status');
 const text=document.createElement('span'),button=document.createElement('button');button.type='button';button.textContent='Enter · E';prompt.append(text,button);document.body.append(prompt);
 const fade=document.createElement('div');fade.id='transport-fade';fade.setAttribute('aria-hidden','true');document.body.append(fade);
 for(const portal of TRANSPORT_PORTALS)for(const door of portal.doors){
  const origin=new Vector3(...door.position),normal=new Vector3(...door.normal),tangent=new Vector3(...door.tangent);
  const shown=new CallbackProperty(()=>{const player=getPlayer();return !!player&&allowedTransport(getAccess(),portal.kind)&&player.position.distanceToSquared(origin)<28*28;},false);
  const color=Color.fromCssColorString(portal.kind==='bus'?'#9fddcb':'#82baff'),top=portal.kind==='bus'?2.95:2.5;
  const framePoint=(side,z)=>toWorld(origin.clone().addScaledVector(normal,.025).addScaledVector(tangent,side*.43).setZ(door.ground+z));
  viewer.entities.add({position:toWorld(origin.clone().addScaledVector(normal,.14).setZ(door.ground+top)),show:shown,
   label:{text:portal.name,font:'14px Arial',style:LabelStyle.FILL_AND_OUTLINE,fillColor:color,outlineColor:Color.BLACK,outlineWidth:2,showBackground:true,backgroundColor:Color.fromCssColorString('#101b26cc'),backgroundPadding:new Cartesian2(7,5),distanceDisplayCondition:new DistanceDisplayCondition(0,40)}});
  viewer.entities.add({show:shown,polyline:{positions:[framePoint(-1,.12),framePoint(-1,portal.kind==='bus'?2.4:1.25),framePoint(1,portal.kind==='bus'?2.4:1.25),framePoint(1,.12)],width:2,material:color.withAlpha(.65)}});
 }
 return {
  onEnter(fn){button.onclick=fn;},
  show(state){
   prompt.hidden=!state.nearby&&!state.busy;
   button.hidden=!state.nearby?.allowed||state.busy;button.disabled=state.coolingDown||state.needsRelease||state.busy;
   const portal=state.nearby?.portal;button.textContent=portal?.kind==='police'?'Map · E':'Enter · E';const destination=portal&&findTransport(portal.nextId);
   const message=state.busy?'Travelling…':portal?(state.nearby.allowed?portal.kind==='police'?`${portal.name} · Choose any NYPD car on your map${state.coolingDown?' · Please wait':''}`:`${portal.name} → ${destination.name} · ${destination.location}${state.coolingDown||state.needsRelease?' · Step away to enter again':' · Walk into the door'}`:portal.kind==='bus'?'Buses are for pedestrians. Police officers use NYPD vehicles.':'NYPD vehicles are for police officers. Pedestrians use buses.') :'';
   if(text.textContent!==message)text.textContent=message;
   fade.classList.toggle('active',state.busy);
  }
 };
}
