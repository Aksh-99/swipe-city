import {allowedTransport,nearTransportDoor,nearPoliceCar,doorCoordinates,TRANSPORT_COOLDOWN} from './transport-rules.js';

// No renderer or room dependency: either a solo callback or a server-approved
// transport request performs the move. Walking into a door and E share this.
export class TransportController{
 constructor({portals,travel,clock=()=>performance.now(),onChange=()=>{},onChooseDestination=()=>{}}){
  Object.assign(this,{portals,travel,clock,onChange,onChooseDestination});this.busy=false;this.nearby=null;this.enabled=false;this.access='pedestrian';this.cooldownUntil=0;this.needsRelease=false;
 }
 update({position,intent=[0,0,0],access,enabled}){
  this.access=access;this.enabled=enabled;let nearby=null,best=Infinity;
  if(enabled&&!this.busy)for(const portal of this.portals)for(const door of portal.doors){
   if(!(access==='police'&&portal.kind==='police'?nearPoliceCar(position,portal):nearTransportDoor(position,door)))continue;
   const q=doorCoordinates(position,door),distance=Math.hypot(q.outward,q.along);
   if(distance<best){nearby={portal,door,allowed:allowedTransport(access,portal.kind)};best=distance;}
  }
  this.nearby=nearby;
  if(enabled&&!this.busy&&!nearby&&this.clock()>=this.cooldownUntil)this.needsRelease=false;
  this.onChange(this.view());
  if(access!=='police'&&nearby?.allowed&&!this.needsRelease&&this.clock()>=this.cooldownUntil&&nearTransportDoor(position,nearby.door,{entering:true})&&intent.reduce((n,v,i)=>n+v*nearby.door.normal[i],0)<-.25)return this.interact();
 }
 view(){return {nearby:this.nearby,busy:this.busy,coolingDown:this.clock()<this.cooldownUntil,needsRelease:this.needsRelease,enabled:this.enabled};}
 async interact(destinationId=null){
  if(!this.enabled||this.busy||!this.nearby?.allowed||this.needsRelease||this.clock()<this.cooldownUntil)return false;
  const {portal,door}=this.nearby;
  if(this.access==='police'&&!destinationId){this.onChooseDestination(portal);return true;}
  if(this.access==='police'&&(!this.portals.some(p=>p.id===destinationId&&p.kind==='police')||destinationId===portal.id))return false;
  this.busy=true;this.needsRelease=this.access!=='police';this.onChange(this.view());
  try{await this.travel(portal,door,destinationId);this.cooldownUntil=this.clock()+TRANSPORT_COOLDOWN;return true;}
  finally{this.busy=false;this.onChange(this.view());}
 }
 reset(){this.nearby=null;this.needsRelease=false;this.cooldownUntil=0;this.onChange(this.view());}
}
