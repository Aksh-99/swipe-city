import {SHOT_RANGE} from './round-rules.js';
const roles={
 THIEF:{name:'Thief',goal:'Stay free until the timer ends.',steps:[`Press A to aim, then E to fire. Hit a player within ${SHOT_RANGE} metres to steal $100.`,`A surviving victim also pays $100 for surgery. A victim with less than $100 before the hit is eliminated.`,`Keep moving, watch your wallet, and avoid the officers.`]},
 POLICE:{name:'Officer',goal:'Catch every thief before time runs out.',steps:[`Hold E close to a suspect to arrest, or press A to aim and F to shoot within ${SHOT_RANGE} metres.`,`Shooting an innocent costs $100 and locks movement for 30 seconds. A wrongful arrest locks movement for 10 seconds.`,`Check reports on your phone. Near an NYPD car, open Maps to travel to another police car.`]},
 PEDESTRIAN:{name:'Pedestrian',goal:'Survive, earn money, and help the officers.',steps:[`Watch your phone for photo requests. Open Camera, frame the requested landmark, then take a photo to earn $20–$90.`,`Look at a suspect, press R, then use the phone to call 911. A false report costs $120.`,`Use your MTA app to find a bus. Keep enough money to survive a thief’s next shot.`]}
};
export function guideHTML({role=null,titleId='game-guide-title',playing=false}={}){
 const own=roles[role];
 const controls=[['↑ ↓ ← →','Move'],['Shift','Run'],['Space','Jump'],['Mouse / drag','Look around'],...(!own||role!=='PEDESTRIAN'?[['A','Aim / exit aim']]:[]),...(role==='THIEF'?[['E','Shoot']]:role==='POLICE'?[['F','Shoot'],['Hold E','Arrest']]:role==='PEDESTRIAN'?[['R','Select suspect to report']]:[['E / F','Thief / officer shoots'],['Hold E','Officer arrests'],['R','Select suspect to report']]),['H','Open this guide'],['Esc','Close guide / release mouse']];
 return `<span class="guide-eyebrow">SWIPE CITY / FIELD GUIDE</span><h2 id="${titleId}">${own?`Your role: ${own.name}`:'Your first round, made simple.'}</h2><p class="guide-lead">${own?own.goal:'Gather your crew. Learn your role. Outlast the city.'}</p>
 ${playing?'<p class="guide-live-note">The round continues while this guide is open.</p>':`<ol class="guide-steps"><li><b>Choose your look</b><span>Your appearance doesn’t decide your role.</span></li><li><b>Bring your crew</b><span>Create a room and share its six-character code, or join a friend. You need 4–20 players.</span></li><li><b>Let the host start</b><span>The host sets the timer. Your private role appears when the round begins. Each group of four adds one officer and one thief.</span></li></ol>`}
 <div class="guide-role-list">${(own?[[role,own]]:Object.entries(roles)).map(([id,r])=>`<section class="guide-role" data-role="${id}"><h3>${r.name}</h3>${own?'':`<p>${r.goal}</p>`}<ul>${r.steps.map(s=>`<li>${s}</li>`).join('')}</ul></section>`).join('')}</div>
 <section class="guide-controls"><h3>Your controls</h3><dl>${controls.map(([key,label])=>`<div><dt><kbd>${key}</kbd></dt><dd>${label}</dd></div>`).join('')}</dl></section>
 <details class="guide-details"><summary>Money, street rules & winning</summary><p>Everyone starts with $500. Balances can go below zero. If a thief shoots you when you have less than $100, you are out until the next round.</p><p>Entering a zebra crossing on its pedestrian DON’T WALK signal costs $40. A moving-car collision costs $200. Officers are exempt from these street fines. Parked cars are solid obstacles and have no medical charge.</p><p>Thieves win by surviving the timer. Officers win by catching all thieves. Eliminated players wait for the host’s rematch. Only human players are on the streets.</p></details>
 <p class="guide-footnote">Click the scene to capture the mouse, or drag to look. Use Sound On/Off to control audio.</p>`;
}
export function mountPlayerGuide({document:doc=globalThis.document,host=globalThis,getState=()=>({}),onOpen=()=>{}}={}){
 const button=doc.createElement('button');button.id='game-guide-open';button.type='button';button.textContent='Help · H';button.setAttribute('aria-haspopup','dialog');
 (doc.querySelector('#game-audio-controls > div')??doc.body).append(button);
 const dialog=doc.createElement('dialog');dialog.id='game-guide';dialog.setAttribute('aria-labelledby','game-guide-title');dialog.innerHTML='<button id="game-guide-close" type="button" aria-label="Close help">×</button><div id="game-guide-content"></div><button id="game-guide-resume" type="button">Back to the city</button>';doc.body.append(dialog);
 const content=dialog.querySelector('#game-guide-content');let last='';
 const update=state=>{if(!dialog.open)return;const role=state.matchPhase==='playing'?state.yourRound?.role:null,playing=state.matchPhase==='playing',key=`${role}/${playing}`;if(last!==key){content.innerHTML=guideHTML({role,playing});last=key;}};
 const close=()=>{dialog.close();button.blur();};
 const open=()=>{onOpen();last='';dialog.showModal();update(getState());dialog.querySelector('#game-guide-close').focus();};
 button.onclick=open;dialog.querySelector('#game-guide-close').onclick=close;dialog.querySelector('#game-guide-resume').onclick=close;dialog.addEventListener('click',e=>{if(e.target===dialog)close();});
 host.addEventListener('keydown',e=>{if(e.code!=='KeyH'||e.repeat||e.metaKey||e.ctrlKey||e.altKey||doc.body.classList.contains('home-open')||e.target.closest?.('input,textarea,select,[contenteditable="true"]'))return;e.preventDefault();dialog.open?close():open();});
 return {update,open,get isOpen(){return dialog.open;}};
}
