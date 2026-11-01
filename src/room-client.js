import {readDesignSelection} from './design-selection.js';
import {SYNC_INTERVAL,HIDDEN_SYNC_INTERVAL,ROOM_CODE_PATTERN,normalizeRoomCode} from './room-protocol.js';
import {matchTiming} from './match-time.js';
import {hasMovementPenalty} from './round-rules.js';
import {canWitnessReport} from './dispatch-rules.js';
const STORAGE_KEY='times-square-room-v1';
export class RoomClient{
 // Browser APIs require their Window receiver in Safari. Keep that receiver
 // when the client calls them as instance methods; injected adapters still work.
 constructor({fetcher=(...args)=>globalThis.fetch(...args),clock=()=>performance.now(),storage=null,ownership=null,isHidden=()=>false,getState=()=>null,getDesign=readDesignSelection,onJoin=()=>{},onSpawn=()=>{},onCorrection=()=>false,onSnapshot=()=>{},setTimer=(fn,delay)=>globalThis.setTimeout(fn,delay),clearTimer=timer=>globalThis.clearTimeout(timer)}={}){
  Object.assign(this,{fetcher,clock,storage,ownership,isHidden,getState,getDesign,onJoin,onSpawn,onCorrection,onSnapshot,setTimer,clearTimer});this.phase='solo';this.session=null;this.snapshot=null;this.listeners=new Set();this.sequence=0;this.generation=0;this.failures=0;this.timer=null;this.offset=Date.now()-clock();this.error='';this.notice='';this.joinHint=null;this.unavailableRoomCode=null;this.inFlight=null;this.resumePending=false;this.switching=false;this.refreshPending=false;this.preparing=false;this.preparedMatchId=null;this.preparedRevision=null;this.interactionHeld=false;
 }
 subscribe(fn){this.listeners.add(fn);fn(this.view());return()=>this.listeners.delete(fn);}
 view(){const players=this.snapshot?.players??[],{matchPhase,endsAt}=matchTiming(this.snapshot??{},this.serverNow()),isHost=!!this.session&&this.snapshot?.hostId===this.session.yourId;return {phase:this.phase,roomCode:this.session?.roomCode??null,yourId:this.session?.yourId??null,playerNumber:this.session?.number??null,characterId:this.session?.characterId??null,transportAccess:this.session?.transportAccess??'pedestrian',dispatchCalls:this.snapshot?.dispatchCalls??[],yourCall:this.snapshot?.yourCall??null,yourObservation:this.snapshot?.yourObservation??null,yourRound:this.snapshot?.yourRound??null,roundResult:this.snapshot?.roundResult??null,gunshots:this.snapshot?.gunshots??[],deathNotices:this.snapshot?.deathNotices??[],capacity:this.snapshot?.capacity??20,matchId:this.snapshot?.matchId??null,players,matchPhase,durationMs:this.snapshot?.durationMs,startedAt:this.snapshot?.startedAt??null,endsAt,isHost,preparing:this.preparing,canRematch:this.phase==='connected'&&!this.switching&&isHost&&matchPhase==='ended',canStart:this.phase==='connected'&&!this.switching&&isHost&&matchPhase==='waiting'&&players.length>=4&&players.length<=20&&players.every(p=>p.ready),canMove:this.phase==='connected'&&matchPhase==='playing'&&!this.switching&&!this.preparing&&this.preparedMatchId===this.snapshot?.matchId&&!hasMovementPenalty(this.snapshot?.yourRound,this.serverNow()),error:this.error,notice:this.notice,joinHint:this.joinHint,unavailableRoomCode:this.unavailableRoomCode,rtt:this.rtt??null};}
 emit(){for(const fn of this.listeners)fn(this.view());}
 persist(){try{if(this.session)this.storage?.setItem(STORAGE_KEY,JSON.stringify({...this.session,sequence:this.sequence}));else this.storage?.removeItem(STORAGE_KEY);}catch{/* Browser storage may be disabled; the current room still works. */}}
 serverNow(){return this.clock()+this.offset;}
 schedule(delay){if(this.refreshPending){delay=0;this.refreshPending=false;}this.clearTimer(this.timer);this.timer=this.setTimer(()=>this.tick(),delay);}
 movement(idle=this.isHidden()){if(this.session&&!this.view().canMove)return null;const state=this.getState();return idle&&state?{...state,speed:0,running:false,poseWeight:0,runBlend:0}:state;}
 async request(path,body,{keepalive=false}={}){
  const controller=new AbortController(),timeout=this.setTimer(()=>controller.abort(),8000),start=this.clock();
  (this.requests??=new Set()).add(controller);
  if(keepalive||body.hidden)(this.keepaliveRequests??=new Set()).add(controller);
  try{
   const response=await this.fetcher(path,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:controller.signal,keepalive:keepalive||!!body.hidden});
   if(!response.headers.get('content-type')?.includes('application/json'))throw new Error('Sign in to the site, then rejoin your room.');
   const data=await response.json();if(!response.ok){const error=new Error(data.error??'Connection interrupted.');error.code=data.code;error.status=response.status;if(['ROOM_NOT_FOUND','ROOM_EXPIRED'].includes(data.code)){this.unavailableRoomCode=path.match(/^\/api\/rooms\/([A-Z0-9]{6})\//)?.[1]??null;this.joinHint=null;error.message='Room not found. That invite is no longer available. Create a new lobby or enter a current six-character code.';}throw error;}
   if(Number.isFinite(data.serverTime)){this.rtt=this.clock()-start;this.offset=data.serverTime-(start+this.rtt/2);}
   return data;
  }finally{this.requests.delete(controller);this.keepaliveRequests?.delete(controller);this.clearTimer(timeout);}
 }
 async apply(snapshot){
  if(!this.session||snapshot.roomCode!==this.session.roomCode)return;
  if(this.snapshot&&snapshot.serverTime<this.snapshot.serverTime)return;
  if((snapshot.roundGeneration??0)<(this.snapshot?.roundGeneration??0))return;
  if(['playing','ended'].includes(this.snapshot?.matchPhase)&&snapshot.matchPhase==='waiting'&&(snapshot.roundGeneration??0)===(this.snapshot?.roundGeneration??0))return;
  if(this.snapshot?.matchPhase==='ended'&&snapshot.matchId===this.snapshot.matchId&&snapshot.matchPhase==='playing')return;
  const self=snapshot.players.find(p=>p.id===this.session.yourId);
  if(self&&self.revision<(this.session.revision??0))return;
  this.snapshot=snapshot;
  if(snapshot.matchPhase==='waiting'){this.preparedMatchId=null;this.preparedRevision=null;this.interactionHeld=false;}
  if(self){this.session.characterId=self.characterId;this.session.designId=self.designId??this.session.designId??this.getDesign();this.session.number=self.number;this.session.revision=self.revision;this.session.transportAccess=snapshot.transportAccess??this.session.transportAccess??'pedestrian';this.sequence=Math.max(this.sequence,self.sequence);}
  if(self&&snapshot.matchPhase==='playing'&&(this.preparedMatchId!==snapshot.matchId||this.preparedRevision!==self.revision)){
   const corrected=this.preparedMatchId===snapshot.matchId&&snapshot.poseCorrection?.playerId===self.id&&this.onCorrection(self,snapshot)===true;
   if(corrected)this.preparedRevision=self.revision;
   else{const generation=this.generation;this.preparing=true;this.emit();
   try{await this.onSpawn(self,snapshot);if(generation!==this.generation)return;this.preparedMatchId=snapshot.matchId;this.preparedRevision=self.revision;}
   finally{if(generation===this.generation)this.preparing=false;}}
  }
  this.persist();this.onSnapshot(snapshot);this.emit();
 }
 async adopt(data,generation){
  if(generation!==this.generation)return;
  const self=data.self??data.players.find(p=>p.id===data.yourId);if(!self)throw new Error('Unable to find your player. Rejoin the room.');
  if(this.ownership&&!await this.ownership.claim(self.id))throw new Error('This player is already open in another tab. Join as a new player.');
  if(generation!==this.generation)return;
  this.session={roomCode:data.roomCode,token:data.sessionToken??this.session?.token,yourId:data.yourId,characterId:self.characterId,designId:self.designId??this.getDesign(),name:self.name,number:self.number,revision:self.revision,transportAccess:data.transportAccess??'pedestrian'};
  this.preparedMatchId=null;this.preparedRevision=null;
  this.sequence=self.sequence;this.snapshot=null;this.persist();await this.onJoin(self,data);
  if(generation!==this.generation)return;
  if(!self.ready){data=await this.request(`/api/rooms/${data.roomCode}/ready`,{token:this.session.token,hidden:!!this.isHidden()});if(generation!==this.generation)return;}
  this.phase='connected';this.error='';this.failures=0;await this.apply(data);if(generation!==this.generation)return;this.resumePending=false;this.schedule(0);
 }
 async connect(path,body){
  if(this.phase==='joining')throw new Error('Wait for the current join to finish.');
  if(this.session&&path===`/api/rooms/${this.session.roomCode}/join`)return this.snapshot;
  if(this.session)await this.leave();const generation=++this.generation;this.phase='joining';this.error='';this.notice='';this.joinHint=null;this.unavailableRoomCode=null;this.emit();
  try{const data=await this.request(path,body);await this.adopt(data,generation);return data;}catch(error){if(generation===this.generation){this.clear();this.error=error.message;this.emit();}throw error;}
 }
 create(name,characterId,transportAccess='pedestrian'){return this.connect('/api/rooms',{name,characterId,designId:this.getDesign(),transportAccess,hidden:!!this.isHidden()});}
 join(value,name,characterId,transportAccess='pedestrian'){const roomCode=normalizeRoomCode(value);if(!ROOM_CODE_PATTERN.test(roomCode))return Promise.reject(new Error('Enter the six-character room code.'));return this.connect(`/api/rooms/${roomCode}/join`,{name,characterId,designId:this.getDesign(),transportAccess,hidden:!!this.isHidden()});}
 async restore(expectedRoom=null){
  let saved;try{saved=JSON.parse(this.storage?.getItem(STORAGE_KEY)??'null');}catch{return false;}
  if(!saved||!ROOM_CODE_PATTERN.test(saved.roomCode)||!/^[a-f0-9]{64}$/.test(saved.token)||!saved.yourId||(expectedRoom&&expectedRoom!==saved.roomCode))return false;
  const generation=++this.generation;this.phase='reconnecting';this.emit();
  const fresh=()=>this.request(`/api/rooms/${saved.roomCode}/join`,{name:saved.name,characterId:saved.characterId,designId:saved.designId??this.getDesign(),transportAccess:saved.transportAccess??'pedestrian',hidden:!!this.isHidden()});
  try{
   if(this.ownership){
    const owned=await this.ownership.claim(saved.yourId,{resume:true});if(generation!==this.generation)return false;
    if(!owned){
     // Discard only this tab's copied credential. Never leave/delete the
     // original player's membership when a duplicate opens or the room is full.
     this.session=null;this.snapshot=null;try{this.storage?.removeItem(STORAGE_KEY);}catch{}
     this.joinHint={roomCode:saved.roomCode,name:saved.name};this.phase='joining';this.emit();
     await this.adopt(await fresh(),generation);if(generation!==this.generation)return false;
     this.notice='This tab joined as a separate player.';this.emit();return true;
    }
   }
   // A failed reload must keep its owned credential. Use the normal sync
   // retry loop and prepare the avatar/spawn only after authentication succeeds.
   this.session=saved;this.sequence=saved.sequence??0;this.resumePending=true;this.emit();
   await this.inFlight?.catch(()=>{});if(generation!==this.generation)return false;
   await this.tick();return generation===this.generation&&this.phase==='connected';
  }catch(error){
   if(generation!==this.generation)return false;
   if(error.code==='MEMBER_EXPIRED'){try{await this.adopt(await fresh(),generation);return true;}catch(error){this.error=error.message;}}else this.error=error.message;
   this.clear(false);this.emit();return false;
  }
 }
 async refresh(){
  this.clearTimer(this.timer);this.timer=null;
  if(this.inFlight){this.refreshPending=true;return this.inFlight;}
  return this.tick();
 }
 async park(){
  const session=this.session;if(!session)return;const state=this.movement(true);this.sequence++;this.persist();
  try{await this.request(`/api/rooms/${session.roomCode}/sync`,{token:session.token,sequence:this.sequence,matchId:this.snapshot?.matchId,revision:session.revision,hidden:false,...(state?{state}:{})},{keepalive:true});}catch{/* Closed tabs fall back to their existing expiry if the final request fails. */}
 }
 async tick(){
  if(!this.session||!['connected','reconnecting'].includes(this.phase))return;
  if(this.inFlight)return this.inFlight;
  if(this.switching){this.schedule(SYNC_INTERVAL);return;}
  const generation=this.generation,start=this.clock(),session=this.session,state=this.movement();
  const request=this.request(`/api/rooms/${session.roomCode}/sync`,{token:session.token,sequence:++this.sequence,matchId:this.snapshot?.matchId,revision:session.revision,hidden:!!this.isHidden(),...(this.interactionHeld&&this.snapshot?.yourRound?.action?{interactionId:this.snapshot.yourRound.action.id}:{}),...(state?{state}:{})});this.inFlight=request;
  try{
   const snapshot=await request;if(generation!==this.generation)return;
   if(this.resumePending){await this.adopt(snapshot,generation);return;}
   this.phase='connected';this.error='';this.failures=0;await this.apply(snapshot);this.schedule(Math.max(0,(this.isHidden()?HIDDEN_SYNC_INTERVAL:SYNC_INTERVAL)-(this.clock()-start)));
  }catch(error){
   if(generation!==this.generation)return;
   if(error.code==='MEMBER_EXPIRED'){
    this.phase='reconnecting';this.error='Rejoining room…';this.emit();
    try{const data=await this.request(`/api/rooms/${session.roomCode}/join`,{name:session.name,characterId:session.characterId,designId:session.designId??this.getDesign(),transportAccess:session.transportAccess??'pedestrian',hidden:!!this.isHidden()});await this.adopt(data,generation);return;}catch(error){if(generation!==this.generation)return;this.error=this.resumePending&&['ROOM_NOT_FOUND','ROOM_EXPIRED'].includes(error.code)?'Your previous room is no longer available. Create a new lobby or enter another room code.':error.message;if(['ROOM_FULL','ROOM_NOT_FOUND','ROOM_EXPIRED'].includes(error.code)){this.clear(false);this.emit();return;}}
   }else if(['ROOM_NOT_FOUND','ROOM_EXPIRED'].includes(error.code)){this.clear();this.error=error.message;this.emit();return;}
   else this.error='Connection interrupted. Reconnecting…';
   this.phase='reconnecting';this.failures++;this.emit();this.schedule(Math.min(3000,200*2**Math.min(4,this.failures)));
  }finally{if(this.inFlight===request)this.inFlight=null;}
 }
 async chooseCharacter(characterId,hairColor){
  if(this.phase!=='connected')throw new Error('Wait until you are connected.');this.switching=true;
  try{await this.inFlight?.catch(()=>{});const session=this.session,generation=this.generation;if(!session)return;
   const snapshot=await this.request(`/api/rooms/${session.roomCode}/character`,{token:session.token,characterId,...(hairColor===undefined?{}:{hairColor}),hidden:!!this.isHidden()});if(generation===this.generation)await this.apply(snapshot);
  }finally{this.switching=false;}
 }
 async control(action,extra={}){
  if(this.phase!=='connected'||!this.session)throw new Error('Wait until you are connected.');
  if(this.switching)throw new Error('Wait for the current request.');
  this.switching=true;this.emit();
  try{await this.inFlight?.catch(()=>{});const session=this.session,generation=this.generation;if(!session)return;
   const payload=typeof extra==='function'?extra():extra;
   const snapshot=await this.request(`/api/rooms/${session.roomCode}/${action}`,{token:session.token,hidden:!!this.isHidden(),...payload});if(generation===this.generation)await this.apply(snapshot);return snapshot;
  }finally{this.switching=false;this.emit();if(this.session)this.schedule(0);}
 }
 async cityEvent(kind,details={}){await this.inFlight?.catch(()=>{});await this.refresh();if(this.phase!=='connected'||!this.session)throw new Error('Join a match first.');const generation=this.generation,snapshot=await this.request(`/api/rooms/${this.session.roomCode}/city-event`,{token:this.session.token,matchId:this.snapshot?.matchId,kind,...details});if(generation===this.generation)await this.apply(snapshot);return snapshot;}
 startMatch(durationMs){return this.control('start',durationMs===undefined?{}:{durationMs});}
 rematch(){return this.control('rematch');}
 async beginInteraction(kind,targetId){
  if(!this.view().canMove)throw new Error('Wait until the round is ready.');
  this.interactionHeld=kind!=='shoot';
  await this.inFlight?.catch(()=>{});await this.refresh();
  try{return await this.control('interact',()=>({command:'begin',kind,targetId,...(kind==='shoot'?{shotId:crypto.randomUUID()}:{}),matchId:this.snapshot?.matchId}));}
  catch(error){this.interactionHeld=false;throw error;}
 }
 finishInteraction(actionId){return this.control('interact',()=>({command:'finish',actionId,matchId:this.snapshot?.matchId}));}
 async cancelInteraction(actionId){this.interactionHeld=false;if(this.phase==='connected'&&!this.switching&&this.snapshot?.yourRound?.action)return this.control('interact',()=>({command:'cancel',actionId,matchId:this.snapshot?.matchId}));}
 resetSpawn(){return this.control('respawn',()=>({matchId:this.snapshot?.matchId}));}
 async observeSuspect(suspectId,activity='suspicious'){
  if(!canWitnessReport(this.view()))throw Object.assign(new Error('Only pedestrian witnesses can send 911 reports.'),{code:'CALL_FORBIDDEN'});
  if(!this.view().canMove)throw new Error('Join a room and start the match before selecting a person.');
  await this.inFlight?.catch(()=>{});await this.refresh();
  if(!this.view().canMove)throw new Error('Wait until you are connected to the match.');
  return this.control('observe',()=>({matchId:this.snapshot?.matchId,suspectId,activity}));
 }
 async call911(suspectId,activity){
  if(!canWitnessReport(this.view()))throw Object.assign(new Error('Only pedestrian witnesses can send 911 reports.'),{code:'CALL_FORBIDDEN'});
  if(!this.view().canMove)throw new Error('Join a room and start the match before calling 911.');
  // R creates a short-lived, server-recorded observation. Reuse its fixed
  // last-seen point rather than revealing where the person has since moved.
  let observation=this.snapshot?.yourObservation;
  if(!observation||observation.suspectId!==suspectId||observation.expiresAt<=this.serverNow())observation=(await this.observeSuspect(suspectId,activity))?.yourObservation;
  if(!observation)throw new Error('Select a nearby person before calling 911.');
  return this.control('call-911',()=>({matchId:this.snapshot?.matchId,observationId:observation.id,...(activity?{activity}:{})}));
 }
 transport(portalId,destinationId=null){if(!this.view().canMove)return Promise.reject(new Error('Start the match before using transport.'));return this.control('transport',()=>({portalId,...(destinationId?{destinationId}:{}),matchId:this.snapshot?.matchId,revision:this.session.revision,sequence:++this.sequence,state:this.getState()}));}
 clear(resetError=true){
  for(const controller of this.requests??[])controller.abort();this.requests?.clear();this.keepaliveRequests?.clear();this.inFlight=null;
  this.clearTimer(this.timer);this.timer=null;this.ownership?.release();this.session=null;this.snapshot=null;this.phase='solo';this.notice='';this.resumePending=false;this.refreshPending=false;this.preparing=false;this.preparedMatchId=null;this.preparedRevision=null;this.interactionHeld=false;if(resetError)this.error='';this.persist();this.onSnapshot({players:[],serverTime:this.serverNow()});
 }
 async leave(){
  const session=this.session;++this.generation;this.clear();this.emit();
  if(session)try{await this.request(`/api/rooms/${session.roomCode}/leave`,{token:session.token});}catch{/* An unreachable member is reclaimed when its lease expires. */}
 }
 stop(){++this.generation;for(const controller of this.requests??[])if(!this.keepaliveRequests?.has(controller))controller.abort();this.requests?.clear();this.inFlight=null;this.clearTimer(this.timer);this.timer=null;this.refreshPending=false;this.ownership?.release();}
}
