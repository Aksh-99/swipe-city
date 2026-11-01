export const MATCH_DURATION_MS=10*60*1000;
export const validDuration=value=>Number.isInteger(value)&&value>=60_000&&value<=3_600_000&&value%60_000===0;
export const matchDuration=value=>validDuration(value)?value:MATCH_DURATION_MS;

// Both the server and phone derive the deadline from the host's recorded start.
// Refreshing, reconnecting or suspending a tab never starts a new countdown.
export function matchTiming({matchPhase='waiting',startedAt=null,roundResult=null,durationMs=MATCH_DURATION_MS}={},serverTime=Date.now()){
 durationMs=matchDuration(durationMs);
 const started=['playing','ended'].includes(matchPhase)&&Number.isFinite(startedAt)&&startedAt>=0;
 const endsAt=started?startedAt+durationMs:null;
 const expired=started&&(matchPhase==='ended'||serverTime>=endsAt);
 const clockTime=expired&&Number.isFinite(roundResult?.endedAt)?roundResult.endedAt:serverTime;
 const remainingMs=started?Math.max(0,Math.min(durationMs,endsAt-clockTime)):durationMs;
 return {matchPhase:expired?'ended':matchPhase,endsAt,remainingMs:expired&&!roundResult?0:remainingMs,expired};
}

export function formatMatchTime(milliseconds){
 const seconds=Math.ceil(Math.max(0,milliseconds)/1000);
 return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;
}
