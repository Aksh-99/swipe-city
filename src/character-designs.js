export const CHARACTER_DESIGNS=Object.freeze([
 {id:'white_male',name:'White Male'}, {id:'bald',name:'Bald Man'},
 {id:'african',name:'African Man'}, {id:'asian',name:'Asian Man'}, {id:'indian',name:'Indian Man'},
 {id:'african_fem',name:'African Woman'}, {id:'asian_fem',name:'Asian Woman'},
 {id:'blonde',name:'Blonde Woman'}, {id:'indian_fem',name:'Indian Woman'}, {id:'irish',name:'Irish Woman'}
].map(Object.freeze));
export const normalizeDesign=id=>CHARACTER_DESIGNS.some(d=>d.id===id)?id:'white_male';
const riggedModels=new Set(['irish','asian_fem_officer','blonde_officer','asian_fem','indian','white_male_officer','white_male','blonde','irish_officer','african_fem','indian_officer','asian_officer','bald_officer','indian_fem','african','bald','asian','african_officer','african_fem_officer','indian_fem_officer']);
export function designModelUri(id,officer=false){
 const design=normalizeDesign(id),model=design+(officer?'_officer':'');
 return riggedModels.has(model)?'/characters/'+model+'-meshy.glb?v=rig-7':'/characters/'+model+(design==='african_fem'&&!officer?'.gltf':'.glb')+'?v=lossless-roster-3';
}
