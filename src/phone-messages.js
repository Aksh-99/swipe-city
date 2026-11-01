import {photoReward} from './photo-rewards.js';
// Small DOM-only inbox: no city assets, polling, storage or extra network calls.
export function mountPhotoMessages(pane,{document:doc=globalThis.document,onCamera=()=>{}}={}){
 pane.className+=' phone-messages-pane';
 const heading=doc.createElement('h3');heading.textContent='Photo requests';
 const summary=doc.createElement('p');summary.className='phone-messages-summary';
 const list=doc.createElement('div');list.className='phone-messages-list';
 const empty=doc.createElement('p');empty.className='phone-messages-empty';empty.textContent='No photo requests yet. New requests will appear here during your match.';
 pane.append(heading,summary,list,empty);let key=null;
 function update(tasks=[]){
  const next=JSON.stringify(tasks);if(next===key)return false;key=next;list.replaceChildren();
  const pending=tasks.filter(task=>!task.completedAt).length;
  summary.textContent=tasks.length?`${pending} pending · ${tasks.length-pending} completed`:'Your photo messages';empty.hidden=tasks.length>0;
  for(const task of tasks){
   const card=doc.createElement('article');card.className='phone-photo-message';
   const sender=doc.createElement('strong');sender.textContent=task.sender??'Friend';
   const body=doc.createElement('p');body.textContent=`Can you take a picture of ${task.name??'this landmark'}?`;
   const status=doc.createElement('span');status.className='phone-photo-message-status';
   status.textContent=task.completedAt?`✓ Completed · $${photoReward(task)} paid`:`Photo reward · $${photoReward(task)}`;
   card.append(sender,body,status);
   if(!task.completedAt){const camera=doc.createElement('button');camera.type='button';camera.textContent='Open Camera';camera.setAttribute('aria-label',`Open camera for ${task.name??'photo request'}`);camera.onclick=onCamera;card.append(camera);}
   list.append(card);
  }
  return true;
 }
 update();return{update};
}
