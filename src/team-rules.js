export const MIN_PLAYERS=4,MAX_PLAYERS=20;
export const teamCounts=count=>{const teams=Math.floor(count/4);return {officers:teams,thieves:teams,pedestrians:count-2*teams};};
