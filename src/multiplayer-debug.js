export const PLAYER_COLORS=Object.freeze(['#ef4444','#3b82f6','#22c55e','#fde047']);
export function mountMultiplayerDebug(client){
 const panel=document.createElement('details');panel.id='multiplayer-debug';panel.open=true;panel.setAttribute('aria-label','Development multiplayer information');
 panel.innerHTML='<summary>Multiplayer · Development</summary><dl><dt>Connection</dt><dd data-field="connection">Disconnected</dd><dt>Room</dt><dd data-field="room">—</dd><dt>Player ID</dt><dd data-field="player">—</dd><dt>Players</dt><dd data-field="players">0/4</dd><dt>Ping</dt><dd data-field="ping">—</dd></dl>';
 document.body.append(panel);const field=id=>panel.querySelector(`[data-field="${id}"]`);
 const unsubscribe=client.subscribe(state=>{
  field('connection').textContent=state.phase==='connected'?(state.preparing?'Preparing spawn':'Connected'):state.phase==='joining'?'Connecting':state.phase==='reconnecting'?'Reconnecting':'Disconnected';
  field('room').textContent=state.roomCode??'—';field('player').textContent=state.playerNumber??'—';field('players').textContent=`${state.players.length}/4`;
  field('ping').textContent=Number.isFinite(state.rtt)?`${Math.round(state.rtt)} ms`:'—';
 });
 return {panel,destroy(){unsubscribe();panel.remove();}};
}
