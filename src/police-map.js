import {TRANSPORT_PORTALS} from './transport-config.js';
export const POLICE_MAP_CARS=TRANSPORT_PORTALS.filter(p=>p.kind==='police');
export function mountPoliceMap({getAccess,getTransport,getMap,canTravel=()=>true,onTravel,document:doc=globalThis.document}){
 const panel=doc.createElement('section');panel.id='police-map-travel';panel.hidden=true;panel.setAttribute('aria-label','NYPD car destinations');
 const status=doc.createElement('p');status.id='police-map-status';status.setAttribute('role','status');
 const label=doc.createElement('label');label.textContent='Travel to an NYPD car';label.setAttribute('for','police-map-destination');
 const select=doc.createElement('select');select.id='police-map-destination';const placeholder=doc.createElement('option');placeholder.value='';placeholder.textContent='Choose a destination';select.append(placeholder);
 for(const car of POLICE_MAP_CARS){const option=doc.createElement('option');option.value=car.id;option.textContent=`${car.name} · ${car.location}`;select.append(option);}
 const button=doc.createElement('button');button.type='button';button.textContent='Travel';button.id='police-map-go';
 panel.append(status,label,select,button);doc.getElementById('phone-map-pane').append(panel);
 let pending=false,error='',map=null;
 function state(){const transport=getTransport()?.view(),source=transport?.nearby?.allowed&&transport.nearby.portal.kind==='police'?transport.nearby.portal:null;return {source,transport,officer:getAccess()==='police',ready:canTravel()&&!!source&&!!transport.enabled&&!transport.busy&&!transport.coolingDown&&!pending};}
 async function go(id=select.value){
  const current=state();if(!current.officer||!current.ready||id===current.source.id||!POLICE_MAP_CARS.some(c=>c.id===id))return;
  pending=true;error='';select.value=id;update();
  try{await onTravel(id);select.value='';}catch(e){error=e.message;}finally{pending=false;update();button.blur?.();}
 }
 function update(){const {source,transport,officer,ready}=state();panel.hidden=!officer;
  const nextMap=getMap();if(nextMap!==map){map=nextMap;map?.onPoliceDestination(id=>go(id));}
  map?.setPoliceTravel({officer,sourceId:source?.id,enabled:ready});
  select.disabled=!officer||!ready;button.disabled=!officer||!ready||!select.value||select.value===source?.id;
  for(const option of select.children)option.disabled=option.value===source?.id;
  const message=error||(pending||transport?.busy?'Travelling…':!canTravel()?'Travel is unavailable right now.':!source?'Move near an NYPD car to choose a destination.':transport?.coolingDown?'Arrived. Please wait before travelling again.':`${source.name} nearby. Tap another car on the map or choose below.`);
  if(status.textContent!==message)status.textContent=message;
 }
 select.addEventListener('change',()=>{error='';update();});button.addEventListener('click',()=>go());update();
 return {update};
}
