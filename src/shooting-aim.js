export function shootingAimState({state,target,time,enabled=true,busy=false,grounded=true,aiming=false}){
 const r=state.yourRound,visible=enabled&&state.matchPhase==='playing'&&['POLICE','THIEF'].includes(r?.role)&&!r.dead&&!r.caught;
 if(!visible)return {visible:false};if(!aiming)return {visible:true,kind:'idle',label:'A · Aim',target:null};const key=r.role==='POLICE'?'F':'E';
 if(busy)return {visible:true,kind:'loading',label:'Firing…',target:null};
 if(!state.canMove)return {visible:true,kind:'locked',label:'Movement locked',target:null};
 if(!grounded)return {visible:true,kind:'idle',label:'Land to shoot',target:null};
 if((r.nextShotAt??0)>time)return {visible:true,kind:'loading',label:'Reloading…',target:null};
 return target?{visible:true,kind:'ready',label:`${key} to shoot · ${Math.round(target.distance??0)} m · A to exit`,target}:{visible:true,kind:'idle',label:`${key} to fire · Aim at a room player within 20 m · A to exit`,target:null};
}
export function mountShootingAim({document:doc=globalThis.document,project=()=>null,onToggle=()=>{}}={}){
 const reticle=doc.getElementById('shoot-reticle');reticle.textContent='';const hint=doc.createElement('span'),ring=doc.createElement('div');hint.id='shoot-aim-help';ring.id='shoot-target-ring';ring.setAttribute('aria-hidden','true');const scope=doc.createElement('div');scope.id='shoot-scope';scope.setAttribute('aria-hidden','true');scope.innerHTML='<div class=shoot-scope-lens><i></i><b></b></div>';const toggle=doc.createElement('button');toggle.id='shoot-aim-toggle';toggle.type='button';toggle.hidden=true;toggle.onclick=()=>{onToggle();toggle.blur();};doc.body.append(scope,hint,ring,toggle);hint.hidden=true;ring.hidden=true;scope.hidden=true;
 return {update(input){const view=shootingAimState(input);toggle.hidden=!view.visible;toggle.disabled=!input.state.canMove&&!input.aiming;toggle.textContent=input.aiming?'A · Exit aim':'A · Aim';toggle.setAttribute('aria-pressed',String(!!input.aiming));hint.hidden=!view.visible||!input.aiming;reticle.hidden=scope.hidden=!view.visible||!input.aiming;ring.hidden=true;if(!view.visible)return;reticle.dataset.state=view.kind;hint.dataset.state=view.kind;hint.textContent=view.label;
  if(view.target){const p=project(view.target.position);if(p&&Number.isFinite(p.x)&&Number.isFinite(p.y)){ring.style.left=`${p.x}px`;ring.style.top=`${p.y}px`;ring.hidden=false;}const member=input.state.players?.find(p=>p.id===view.target.targetId);if(member)hint.textContent=`Player ${member.number} · ${view.label}`;}
 }};
}
