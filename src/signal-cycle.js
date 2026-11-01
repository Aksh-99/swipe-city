// One illustrative 64-second programme shared by rendering and server rules.
export const SIGNAL_CYCLE_SECONDS=64;
export function signalPhase(seconds){
 const t=((seconds%SIGNAL_CYCLE_SECONDS)+SIGNAL_CYCLE_SECONDS)%SIGNAL_CYCLE_SECONDS;
 const a=t<26?2:t<29?1:0,b=t>=32&&t<58?2:t>=58&&t<61?1:0;
 const ped=(start,end)=>t>=start&&t<end?(t<start+10?0:2+Math.min(14,Math.floor(t-(start+10)))):1;
 return {a,b,pedA:ped(32,57),pedB:ped(0,25)};
}
export const pedestrianWalk=(group,time)=>(group===0?signalPhase(time/1000).pedA:group===1?signalPhase(time/1000).pedB:1)===0;
