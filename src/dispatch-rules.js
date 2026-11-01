import {isPoliceCharacter} from './appearances.js';
export const canWitnessReport=state=>!state?.yourRound?.dead&&!state?.yourRound?.caught&&!isPoliceCharacter(state?.characterId)&&state?.yourRound?.role!=='THIEF';
// One active location per caller keeps this first dispatch prototype bounded.
export const CALL_COOLDOWN=10_000;
export const CALL_LIFETIME=20_000;
export const SUSPECT_VIEW_DISTANCE=12;
// Two metres of network slack; the server checks its own accepted positions.
export const SUSPECT_REPORT_DISTANCE=14;
export const SUSPECT_SELECTION_LIFETIME=30_000;
