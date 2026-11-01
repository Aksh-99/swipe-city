import {withoutUnavailableRoom} from './room-invite.js';
import {normalizeRoomCode} from './room-protocol.js';
import {PLAYER_COLORS} from './multiplayer-debug.js';
export function mountRoomPanel(client,characters,getCharacter,getTransport=()=> 'pedestrian',getHairColor=()=> 'natural'){
 const panel=document.createElement('aside');panel.id='multiplayer';panel.open=true;
 panel.innerHTML=`<div class="room-card-heading">Room <span id="room-count">Players: 0/20</span></div>
 <div class="room-content"><div id="room-entry"><label for="player-name">Your name</label><input id="player-name" maxlength="24" value="Player" autocomplete="nickname">
 <button id="room-create" type="button">Create lobby</button><label for="room-code">Join with a room code</label><div class="room-join-row"><input id="room-code" maxlength="6" placeholder="ABC234" autocomplete="off" autocapitalize="characters"><button id="room-join" type="button">Join</button></div>
 <p class="room-hint">Your chosen design has a matching officer uniform; one thief and one officer per four players. The host chooses the round length with 4–20 players.</p></div>
 <div id="room-active" hidden><div class="room-code-display">Room <strong id="room-active-code"></strong></div><h2 id="room-stage">Waiting room</h2><p id="room-movement-note" hidden></p><p id="room-progress" role="status"></p><p id="room-connection" role="status"></p><ol id="room-roster"></ol>
 <p id="room-start-hint" class="room-hint"></p><label id="room-duration-label" for="room-duration">Round length (minutes)<input id="room-duration" type="number" min="1" max="60" step="1" value="10"></label><button id="room-start" type="button" disabled>START MATCH</button>
 <button id="room-copy" type="button">Copy invite link</button><button id="room-leave" type="button">Leave game</button><input id="room-link" readonly hidden aria-label="Invite link"></div>
 <p id="room-notice" role="status"></p><p id="room-error" role="status"></p></div>`;
 document.body.append(panel);const $=id=>panel.querySelector('#'+id),name=$('player-name'),code=$('room-code'),error=$('room-error');
 const invited=normalizeRoomCode(new URL(location.href).searchParams.get('room'));if(invited)code.value=invited;
 let actionError='';const perform=async fn=>{actionError='';error.textContent='';try{await fn();}catch(e){actionError=e.message;error.textContent=e.message;}};
 $('room-create').onclick=()=>perform(async()=>{const hair=getHairColor();await client.create(name.value,getCharacter(),getTransport());if(hair!=='natural')await client.chooseCharacter(client.session.characterId,hair);});
 $('room-join').onclick=()=>perform(async()=>{const hair=getHairColor();await client.join(code.value,name.value,getCharacter(),getTransport());if(hair!=='natural')await client.chooseCharacter(client.session.characterId,hair);});
 $('room-start').onclick=()=>perform(()=>client.startMatch(Number($('room-duration').value)*60_000));
 code.oninput=()=>code.value=normalizeRoomCode(code.value).replace(/[^A-Z0-9]/g,'');code.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();$('room-join').click();}};
 $('room-leave').onclick=async()=>{const leaving=client.leave();window.dispatchEvent(new Event('swipe-leave-game'));await leaving;};
 $('room-copy').onclick=async()=>{const url=new URL(location.href);url.searchParams.set('room',client.view().roomCode);url.hash='';try{await navigator.clipboard.writeText(url.href);$('room-copy').textContent='Link copied';setTimeout(()=>$('room-copy').textContent='Copy invite link',1800);}catch{$('room-link').hidden=false;$('room-link').value=url.href;$('room-link').select();}};
 let activeRoom=null,previousPhase=null,recoveredRoom=null;
 client.subscribe(state=>{
  if(state.phase==='solo'&&state.unavailableRoomCode&&recoveredRoom!==state.unavailableRoomCode){
   recoveredRoom=state.unavailableRoomCode;const clean=withoutUnavailableRoom(location.href,recoveredRoom);if(clean!==location.href)history.replaceState(history.state,'',clean);if(normalizeRoomCode(code.value)===recoveredRoom)code.value='';panel.open=true;
  }else if(!state.unavailableRoomCode)recoveredRoom=null;
  if(state.phase==='connected'&&state.roomCode!==activeRoom){
   activeRoom=state.roomCode;const url=new URL(location.href);url.searchParams.set('room',activeRoom);history.replaceState(history.state,'',url);
  }else if(state.phase==='solo'&&!state.roomCode&&activeRoom){
   activeRoom=null;const url=new URL(location.href);url.searchParams.delete('room');history.replaceState(history.state,'',url);
  }
  panel.classList.toggle('match-active',!!state.roomCode&&state.matchPhase!=='waiting');
  $('room-duration-label').hidden=!state.isHost||state.matchPhase!=='waiting';
  const joined=!!state.roomCode,busy=['joining','reconnecting'].includes(state.phase);$('room-entry').hidden=joined;$('room-active').hidden=!joined;
  if(state.matchPhase!==previousPhase){if(state.matchPhase==='playing')panel.open=false;else if(state.matchPhase==='waiting')panel.open=true;previousPhase=state.matchPhase;}
  if(!joined&&state.joinHint){code.value=state.joinHint.roomCode;name.value=state.joinHint.name;}
  $('room-create').disabled=busy;$('room-join').disabled=busy;$('room-count').textContent=`Players: ${state.players.length}/20`;
  $('room-active-code').textContent=state.roomCode??'';$('room-stage').textContent=state.preparing?'Spawning in Times Square…':state.matchPhase==='ended'?"Time's up":state.matchPhase==='playing'?'Match in progress':state.canStart?'Ready to start':state.isHost?'Waiting for players':'Waiting for host';
  $('room-progress').textContent=`Players: ${state.players.length}/20`;$('room-movement-note').hidden=state.matchPhase!=='waiting'||state.phase!=='connected';$('room-movement-note').textContent='You can explore now. Use arrow keys to move and Shift to run. Rounds need at least 4 players; maximum 20.';
  $('room-connection').textContent=state.phase==='connected'?`Connected · Player ${state.playerNumber}${state.isHost?' · Host':''}`:state.phase==='joining'?'Joining room…':state.phase==='reconnecting'?'Reconnecting…':'';
  $('room-start').hidden=!state.isHost||state.matchPhase!=='waiting';$('room-start').disabled=!state.canStart;
  $('room-start-hint').hidden=state.matchPhase==='playing';$('room-start-hint').textContent=state.matchPhase==='ended'?'Round complete. The host can open a rematch from the result screen.':state.canStart?`${state.players.length} players: ${Math.floor(state.players.length/4)} officers and ${Math.floor(state.players.length/4)} thieves. Ready to start.`:state.players.length>=4?'Preparing players. The host will start the round.':state.isHost?'Waiting for at least 4 players.':'Waiting for players and the host to start.';
  error.textContent=actionError||state.error;$('room-notice').textContent=state.notice;$('room-roster').replaceChildren();
  for(const player of state.players){const item=document.createElement('li');item.style.setProperty('--player-color',PLAYER_COLORS[player.slot%PLAYER_COLORS.length]);item.textContent=`Player ${player.number}${player.id===state.yourId?' (you)':''} · ${player.name}${player.id===client.snapshot?.hostId?' · Host':''}${!player.ready?' · Preparing':player.background?' · idle':''}`;$('room-roster').append(item);}
 });
 return {panel,invitedRoom:invited||null};
}
