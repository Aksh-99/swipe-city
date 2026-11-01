import pedestrians from '../public/data/npc-pedestrians.json' with {type:'json'};
// Authored pedestrians on collision-checked ground in the existing NYC world.
export const NPC_PEDESTRIANS=Object.freeze(pedestrians.map(n=>Object.freeze({...n,position:Object.freeze(n.position)})));
export const npcById=id=>NPC_PEDESTRIANS.find(n=>n.id===id);
