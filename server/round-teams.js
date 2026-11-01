export const policeIds=round=>round?.policeIds??(round?.policeId?[round.policeId]:[]);
export const thiefIds=round=>round?.thiefIds??(round?.thiefId?[round.thiefId]:[]);
export const roleFor=(round,id)=>!round?null:policeIds(round).includes(id)?'POLICE':thiefIds(round).includes(id)?'THIEF':'PEDESTRIAN';
export const isOut=(round,id)=>!!round?.dead?.[id]||!!round?.caught?.[id];
export function checkPoliceWin(round,time){
 if(!round.result&&thiefIds(round).every(id=>isOut(round,id))){round.result={winner:'POLICE',reason:'all_caught',stolen:round.stolen,endedAt:time};round.actions={};}
}
export function catchThief(round,id,officer,time){
 round.caught??={};round.caught[id]={at:time,by:officer};round.penalties[id]=Number.MAX_SAFE_INTEGER;delete round.actions[id];
 round.feedback[id]={id:crypto.randomUUID(),kind:'caught',at:time};checkPoliceWin(round,time);
}
