// Rendering and solo exploration must not depend on a multiplayer match
// granting movement. Waiting-room exploration is local; the round server
// still accepts movement only after the host starts a four-player match.
export function canControlLocalPlayer(room){
 return !room||room.phase==='solo'||(room.phase==='connected'&&room.matchPhase==='waiting'&&!room.preparing)||room.canMove===true;
}
export function canShowLocalPlayer(camera){
 // Hide only when the collision-aware camera retracts into the character.
 return !camera.aiming&&(camera.aimBlend??0)<.5&&(camera.distanceToPlayer===undefined||camera.distanceToPlayer>.6);
}
export function createPlayerSession({localAvatar,remotePlayers,prepareSpawn,onAppearance=()=>{},debugPlayers=false}){
 const showSelf=self=>{
  localAvatar.setDesign?.(self.designId);localAvatar.select(self.characterId);localAvatar.setHairColor?.('natural');localAvatar.setDebugPlayer(debugPlayers?self.slot:null);
  onAppearance(self.characterId);
 };
 return {
  async onJoin(self,snapshot){
   showSelf(self);
   await localAvatar.ready?.();
   if(snapshot.matchPhase!=='playing')await prepareSpawn(self);
  },
  async onSpawn(self,snapshot){showSelf(self);await localAvatar.ready?.();return prepareSpawn(self,snapshot);},
  onSnapshot(snapshot,yourId){
   remotePlayers.sync(snapshot,yourId);
   const self=yourId&&snapshot.players.find(p=>p.id===yourId);
   if(self)showSelf(self);
   else if(!yourId)localAvatar.setDebugPlayer(null);
  }
 };
}
