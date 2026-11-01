// Shared timing/range rules. Roles, payouts and successful actions are owned
// by the room server; the renderer only submits intent.
export const THEFT_GOAL=500; // Legacy result compatibility; survival has no cash target.
export const SHOT_LOOT=100;
export const SURGERY_COST=100;
export const SHOT_COOLDOWN_MS=1000;
export const SHOT_RANGE=20;
export const nearShot=(a,b)=>!!a&&!!b&&Math.hypot(a[0]-b[0],a[1]-b[1])<=SHOT_RANGE&&Math.abs(a[2]-b[2])<=2;
export const PICKPOCKET_MS=2400;
export const ARREST_MS=2000;
export const INTERACTION_RANGE=2.2;
export const INTERACTION_HEIGHT=1.1;
export const HOLD_GRACE_MS=1200;
export const WRONGFUL_ARREST_MS=10_000;
export const PEDESTRIAN_WALLET=500;
export const FALSE_REPORT_FINE=120;
export const REPORT_PENALTY_MS=0;
export const RICHEST_REWARD=250;
export const POLICE_ASSIST_REWARD=250;
export const ROUND_ROLES=Object.freeze(['POLICE','THIEF','PEDESTRIAN']);
export const money=value=>{const amount=Number.isFinite(value)?value:0;return `${amount<0?'-':''}$${Math.abs(amount).toLocaleString('en-US')}`;};
export const hasMovementPenalty=(round,time)=>!!round?.dead||!!round?.caught||(round?.penaltyUntil??round?.cooldownUntil??0)>time;
export const interactionDuration=kind=>kind==='pickpocket'?PICKPOCKET_MS:ARREST_MS;
export function nearInteraction(a,b){return !!a&&!!b&&Math.hypot(a[0]-b[0],a[1]-b[1])<=INTERACTION_RANGE&&Math.abs(a[2]-b[2])<=INTERACTION_HEIGHT;}
export function interactionProgress(action,time){return action?Math.max(0,Math.min(1,(time-action.startedAt)/(action.endsAt-action.startedAt))):0;}
