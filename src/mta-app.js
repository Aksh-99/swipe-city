import {planBusTrip,stopPosition} from './mta-planner.js';
export function mountMtaApp({getPlayer,getAccess,getMap,onOpen,document:doc=globalThis.document}){
 const $=id=>doc.getElementById(id),button=$('phone-mta-open'),panel=$('phone-mta'),select=$('mta-street'),result=$('mta-result'),clear=$('mta-clear');let plan=null,key='';
 function render(){const police=getAccess()==='police';let message;
  if(police){message='Buses are for pedestrians. Officer Manson uses NYPD cars.';getMap()?.setBusTrip(null);}
  else if(!plan)message='Choose a street to find your bus.';
  else if(plan.arrived)message=`You’re near W ${plan.street} St. Walk to your destination.`;
  else if(plan.walking)message=`Walk to W ${plan.street} St from ${plan.destination.name} · ${plan.destination.location}. You’re already near this stop.`;
  else message=`Board ${plan.board.name} · ${plan.board.location}. ${plan.stops.slice(1).map(s=>s.name).join(' → ')}. Exit at ${plan.destination.name}, then walk to W ${plan.street} St.`;
  if(result.textContent!==message)result.textContent=message;
  select.disabled=police;clear.hidden=!plan;
  const nextKey=police?'police':plan?`${plan.board?.id}/${plan.destination.id}/${plan.arrived}`:'';
  if(key!==nextKey){key=nextKey;getMap()?.setBusTrip(police?null:plan);}
 }
 function choose(){const position=getPlayer()?.position;plan=select.value&&position?planBusTrip(position,Number(select.value)):null;render();}
 button.addEventListener('click',()=>{onOpen();panel.hidden=button.dataset?.phoneApp==='mta'?false:!panel.hidden;button.setAttribute('aria-expanded',String(!panel.hidden));render();if(!panel.hidden)select.focus();});
 select.addEventListener('change',choose);
 clear.addEventListener('click',()=>{plan=null;select.value='';render();});
 return {update(){render();},arrive(stop){if(!plan||!stop||stop.kind!=='bus')return;plan=stop.id===plan.destination.id?{...plan,arrived:true}:planBusTrip(stopPosition(stop),plan.street);render();}};
}
