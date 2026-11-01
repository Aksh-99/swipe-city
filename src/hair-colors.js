export const HAIR_COLORS=Object.freeze([
 ['natural','Natural',null],['black','Black','#151218'],['dark-brown','Dark Brown','#3b241b'],['light-brown','Light Brown','#8e5e38'],['blonde','Blonde','#d8b76b'],['auburn','Auburn','#8c3d27'],['red','Red','#b64032'],['gray','Gray','#85868c'],['white','White','#dfdfe3'],['pink','Pink','#e482b5'],['blue','Blue','#438bd0'],['purple','Purple','#9156bd']
].map(([id,name,hex])=>Object.freeze({id,name,hex})));
export const validHairColor=id=>HAIR_COLORS.some(c=>c.id===id);
export const normalizeHairColor=id=>validHairColor(id)?id:'natural';
export const hairColorLabel=id=>HAIR_COLORS.find(c=>c.id===normalizeHairColor(id)).name;
