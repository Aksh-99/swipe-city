import {photoInView,photoReward} from './city-rules.js';
export function createCityGameplay({getRoom,getPlayer,getCamera,getTraffic,phoneApps,onCarHit=()=>{},onMessage=()=>{},getNow=()=>Date.now(),document:doc=globalThis.document}){
 const phone=doc.getElementById('phone'),screen=phone.querySelector('.iphone-screen'),home=doc.getElementById('phone-apps'),cameraPane=phone.querySelector('[data-pane="camera"]');
 const banner=doc.createElement('button');banner.type='button';banner.className='iphone-message-banner';banner.hidden=true;banner.setAttribute('aria-live','polite');screen.append(banner);
 const messages=doc.createElement('section');messages.className='phone-messages';messages.hidden=true;cameraPane.append(messages);const jobs=doc.createElement('section');jobs.className='phone-photo-jobs';cameraPane.prepend(jobs);
 const queue=[];let context='',seen=new Set(),feedback=null,key='',until=0,bannerPhoto=false,touching=new Set(),pending=false;
 function notify(title,body,photo=false){queue.push({title,body,photo});showNext();}
 function showNext(){if(!banner.hidden||!queue.length)return;const {title,body,photo}=queue.shift();banner.replaceChildren();const icon=doc.createElement('span'),content=doc.createElement('span'),meta=doc.createElement('span'),label=doc.createElement('strong'),text=doc.createElement('span');icon.className='iphone-notification-icon';icon.setAttribute('aria-hidden','true');icon.innerHTML='<svg viewBox="0 0 32 32"><path d="M5 5h22v16H15l-7 6v-6H5Z" fill="white"/></svg>';content.className='iphone-notification-content';meta.className='iphone-notification-meta';meta.textContent=photo?'MESSAGES · now':'WALLET · now';label.textContent=title;text.textContent=body;content.append(meta,label,text);banner.append(icon,content);banner.hidden=false;bannerPhoto=photo;until=getNow()+8500;onMessage();}

 banner.onclick=()=>{if(bannerPhoto)phoneApps.open('camera');else phoneApps.open('phone');banner.hidden=true;};
 function update(state){const next=(state.roomCode??'')+'/'+(state.matchId??'');if(next!==context){context=next;seen=new Set();feedback=null;key='';touching.clear();queue.length=0;banner.hidden=true;}
  const active=state.matchPhase==='playing';if(!active){queue.length=0;banner.hidden=true;}const tasks=active?(state.yourRound?.photoTasks??[]):[],nextKey=JSON.stringify(tasks);
  if(nextKey!==key){key=nextKey;phoneApps.setPhotoMessages?.(tasks);messages.replaceChildren();jobs.replaceChildren();messages.hidden=!tasks.length;
   for(const task of tasks){const reward=photoReward(task);const item=doc.createElement('button');item.type='button';item.className='phone-message';const sender=doc.createElement('strong'),body=doc.createElement('span');sender.textContent=task.sender;body.textContent=task.completedAt?`Photo received — $${reward} paid`:`Can you take a picture of ${task.name}? +$${reward}`;item.append(sender,body);item.onclick=()=>phoneApps.open('camera');messages.append(item);const job=doc.createElement('p');job.textContent=(task.completedAt?'✓ ':'📷 ')+task.name+(task.completedAt?' · paid':` · $${reward}`);jobs.append(job);
    if(!task.completedAt&&!seen.has(task.id)){seen.add(task.id);notify(task.sender,`Can you take a picture of ${task.name}? +$${reward}`,true);}
   }
  }

 }
 async function capturePhoto(){const room=getRoom(),state=room?.view();if(state?.matchPhase!=='playing'||state.yourRound?.role!=='PEDESTRIAN')return;const player=getPlayer(),camera=getCamera(),tasks=(state.yourRound.photoTasks??[]).filter(t=>!t.completedAt);if(!tasks.length)return;const task=tasks.find(t=>photoInView(player.position.toArray(),camera.yaw,t));if(!task)throw new Error('Aim at a requested landmark from 5–95 metres away.');const result=await room.cityEvent('photo',{landmarkId:task.landmarkId,heading:camera.yaw});return {reward:result?.yourRound?.feedback?.amount??photoReward(task)};}
 function tick(time,moving){if(!banner.hidden&&getNow()>until)banner.hidden=true;showNext();const room=getRoom(),state=room?.view(),player=getPlayer();if(!player||state?.yourRound?.dead||state?.yourRound?.caught||doc.hidden||!(state?.phase==='solo'||state?.phase==='connected'&&state.matchPhase==='waiting'||state?.matchPhase==='playing'&&state.canMove)){touching.clear();return;}
  const p=player.position,next=new Set(),simulation=getTraffic()?.simulation,cars=simulation?.cars??[];let contact=null;
  for(const car of cars){const recent=car.impactMotion&&simulation.time-car.impactMotion.at<=.2,impactSpeed=car.speed>.2?car.speed:recent?car.impactMotion.speed:0;if(impactSpeed<=.2)continue;const dx=p.x-car.position.x,dy=p.y-car.position.y;if(Math.abs(dx)>5||Math.abs(dy)>5||Math.abs(p.z-car.position.z)>1.4)continue;const along=dx*Math.cos(car.heading)+dy*Math.sin(car.heading),across=-dx*Math.sin(car.heading)+dy*Math.cos(car.heading);if(Math.abs(along)<car.length/2+.5&&Math.abs(across)<(car.width??1.9)/2+.5){next.add(car.id);if(!touching.has(car.id))contact={...car,impactSpeed};}}
  touching=next;if(contact){player.carHitAt=player.animationTime??0;onCarHit();}if(contact&&!pending&&state?.matchPhase==='playing'&&state.yourRound?.role!=='POLICE'){pending=true;room.cityEvent('medical',{carId:contact.id,carSpeed:contact.impactSpeed,carPosition:[contact.position.x,contact.position.y,contact.position.z]}).catch(()=>{}).finally(()=>pending=false);}
 }
 return {update,tick,capturePhoto};
}
