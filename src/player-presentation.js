const FIELDS=['heading','gaitPhase','runBlend','poseWeight','airBlend','animationTime'];
export function capturePresentation(player){return {position:player.position.clone(),...Object.fromEntries(FIELDS.map(k=>[k,player[k]??0]))};}
// Interpolate the completed simulation states instead of extrapolating into
// obstacles. The physical controller remains fixed at 60 Hz.
export function samplePresentation(player,alpha){
 const previous=player.previousPresentation??capturePresentation(player),t=Math.max(0,Math.min(1,alpha));
 const result={carHitAt:player.carHitAt??-1,position:previous.position.clone().lerp(player.position,t),speed:player.speed,running:player.running};
 for(const key of FIELDS){let delta=(player[key]??0)-previous[key];if(key==='heading')delta=Math.atan2(Math.sin(delta),Math.cos(delta));result[key]=previous[key]+delta*t;}
 return result;
}
