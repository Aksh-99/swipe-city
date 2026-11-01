import {normalizeHairColor,hairColorLabel} from './hair-colors.js';
// Legacy room IDs preserve the existing four-player role/transport protocol.
// Each member carries a separate designId for their civilian/officer pair.
export const APPEARANCES=Object.freeze([
 ...['explorer','tourist','pedestrian','commuter'].map((id,i)=>Object.freeze({id,name:['White Male','Bald Man','Officer','Bald Man'][i],description:i===2?'Police uniform':'Civilian clothing',uri:'/characters/'+['white_male','bald','white_male_officer','bald'][i]+'.glb'}))
]);
export const APPEARANCE_IDS=Object.freeze(APPEARANCES.map(a=>a.id));

// Legacy saved selections keep their stable room appearance IDs.
export function normalizeAppearanceId(id){
 return id==='officer'?'pedestrian':id==='courier'?'commuter':id;
}
// Keep the original asset/room ID; authorization uses this exact character ID.
export const OFFICER_CHARACTER_ID='pedestrian';
export const isPoliceCharacter=id=>normalizeAppearanceId(id)===OFFICER_CHARACTER_ID;
export function appearanceDescription(id,hairColor){const description=APPEARANCES.find(a=>a.id===normalizeAppearanceId(id))?.description??'Appearance unavailable';return normalizeHairColor(hairColor)==='natural'?description:description.replace(/ · dark hair/g,'')+` · ${hairColorLabel(hairColor).toLowerCase()} hair`;}
export function selectAppearance(entity,id){
 const appearance=APPEARANCES.find(a=>a.id===normalizeAppearanceId(id));
 if(!appearance)throw new RangeError('Unknown appearance');
 entity.model.uri=appearance.uri??undefined;return appearance;
}
