import{Material}from'./canvas-material.js';

import {addBatches,addFaces} from './street-details.js';
import {createStorefrontGeometry} from './storefront-geometry.js';
import {STOREFRONTS} from './storefront-config.js';
import {addMmsMaterials} from './mms-materials.js';
import {addHersheysMaterials} from './hersheys-materials.js';
import {addDisneyRetailMaterials} from './disney-retail-materials.js';
import {addHardRockMaterials} from './hard-rock-materials.js';
import {addTouroMaterials} from './touro-materials.js';
const special=['open','pizza','deli','souvenir'];
function signAtlas(){
 const count=STOREFRONTS.length+special.length,rows=Math.ceil(count/4),canvas=document.createElement('canvas');canvas.width=2048;canvas.height=rows*256;const c=canvas.getContext('2d');
 for(let i=0;i<count;i++){
  const f=STOREFRONTS[i],kind=f?'main':special[i-STOREFRONTS.length],x=i%4*512,y=Math.floor(i/4)*256;
  c.save();c.translate(x,y);c.fillStyle=f?.color||'#14201e';c.fillRect(0,0,512,256);
  if(f){
   const flagship=f.height>5,height=flagship?1.82:.93,ratio=((f.width-.3)/height)/2,w=512*ratio;c.scale(1/ratio,1);c.textAlign='center';c.fillStyle='#fff3d8';
   const name=f.name.replace(/^\$1.50 /,'');
   if(f.kind==='toys'){c.font='italic bold 143px Georgia';c.fillText('Disney',w/2,163,w-90);c.font='bold 35px Arial';c.fillText('STORE  ·  TIMES SQUARE',w/2,221,w-60);}
   else if(f.kind==='candy'){c.font='bold 140px Arial';c.fillText('m&m’s',w/2,156,w-100);c.font='bold 34px Arial';c.fillText('NEW YORK',w/2,218);}
   else if(f.kind==='chocolate'){c.font='bold 115px Arial';c.fillText('HERSHEY’S',w/2,140,w-80);c.font='bold 42px Arial';c.fillText('CHOCOLATE WORLD',w/2,213,w-50);}
   else{
    c.font='bold 69px Arial';c.fillText(name.toUpperCase(),w/2,109,w-40);
    c.fillStyle=f.kind==='pizza'?'#ffe176':'#f5deb7';c.font='bold 42px Arial';
    c.fillText(f.kind==='pizza'?'$1.50 CHEESE SLICE':f.kind==='deli'?'DELI  ·  GROCERY  ·  COFFEE':'NYC SOUVENIRS  ·  GIFTS  ·  APPAREL',w/2,180,w-40);
    c.fillStyle='#d9e0dd';c.font='28px Arial';c.fillText(f.address.replace(' Avenue',' AVE').toUpperCase(),w/2,229,w-40);
   }
  }else if(kind==='open'){
   c.strokeStyle='#4fb6de';c.lineWidth=10;c.strokeRect(13,19,486,218);c.textAlign='center';c.fillStyle='#ff756c';c.shadowColor='#ff4030';c.shadowBlur=12;c.font='bold 145px Arial';c.fillText('OPEN',256,181);
  }else{
   // Portrait sidewalk boards share a landscape atlas cell without stretching
   // the lettering. Draw in their physical aspect ratio before UV mapping.
   const ratio=(.58/.87)/2,w=512*ratio;c.scale(1/ratio,1);c.textAlign='center';c.strokeStyle='#e8d7aa';c.lineWidth=3;c.strokeRect(5,10,w-10,236);c.fillStyle='#f9e9b9';c.font='bold 29px Arial';c.fillText(kind==='pizza'?'PIZZA':kind==='deli'?'DELI':'NYC GIFTS',w/2,65,w-15);
   c.font=kind==='pizza'?'bold 50px Arial':'bold 23px Arial';c.fillStyle=kind==='pizza'?'#ffe57c':'#fff3d9';c.fillText(kind==='pizza'?'$1.50':kind==='deli'?'SANDWICHES':'SOUVENIRS',w/2,136,w-15);
   c.font='17px Arial';c.fillText(kind==='pizza'?'HOT CHEESE SLICE':kind==='deli'?'BAGELS · COFFEE':'T-SHIRTS · CAPS',w/2,192,w-15);
  }
  c.restore();
 }
 return {canvas,rows};
}
export function addStorefronts(viewer,collision){
 const geometry=createStorefrontGeometry();addBatches(viewer,geometry.batches);collision.addStatic('storefront-details',geometry.collision);
 addMmsMaterials(viewer,geometry.mms);
 addHersheysMaterials(viewer,geometry.hersheys);
 addDisneyRetailMaterials(viewer,geometry.disney);
 addHardRockMaterials(viewer,geometry.hardRock);
 addTouroMaterials(viewer,geometry.touro);
 const windowMaterial=new Material({fabric:{type:'TimesSquareStoreWindows',uniforms:{image:'/storefronts/window-atlas.webp'},source:`czm_material czm_getMaterial(czm_materialInput materialInput){czm_material m=czm_getDefaultMaterial(materialInput);vec3 tex=texture(image,materialInput.st).rgb;m.diffuse=vec3(.012);m.emission=tex*.76;m.alpha=1.0;return m;}`}});
 addFaces(viewer,geometry.windows,windowMaterial,(f,u,v)=>{
  const col=f.tile%2,row=2-Math.floor(f.tile/2),aspect=f.width/f.height,target=1.5,crop=Math.min(1,aspect/target),left=(1-crop)/2;
  return [(col+.006+(left+u*crop)*.988)/2,(row+.006+v*.988)/3];
 });
 const {canvas,rows}=signAtlas(),signMaterial=new Material({fabric:{type:'TimesSquareStoreSigns',uniforms:{image:canvas},source:`czm_material czm_getMaterial(czm_materialInput materialInput){czm_material m=czm_getDefaultMaterial(materialInput);m.diffuse=vec3(.01);m.emission=texture(image,materialInput.st).rgb*.94;m.alpha=1.0;return m;}`}});
 addFaces(viewer,geometry.signs,signMaterial,(f,u,v)=>{const i=f.sign==='main'?f.index:STOREFRONTS.length+special.indexOf(f.sign);return [(i%4+.002+u*.996)/4,(rows-1-Math.floor(i/4)+.002+v*.996)/rows];});
 const glowMaterial=new Material({fabric:{type:'TimesSquareShopSpill',source:`czm_material czm_getMaterial(czm_materialInput materialInput){czm_material m=czm_getDefaultMaterial(materialInput);vec2 q=materialInput.st-.5;m.diffuse=vec3(.02);m.emission=vec3(1.0,.70,.36);m.alpha=exp(-dot(q,q)*12.0)*.1;return m;}`},translucent:true});
 addFaces(viewer,geometry.lights,glowMaterial,(f,u,v)=>[u,v],true);
 const lightFaces=[
  ...geometry.signs.map(f=>({...f,lightGroup:`shop-sign-${f.index}`,lightColor:[1,.70,.36]})),
  ...(geometry.disney?.screens??[]).map(f=>({...f,lightGroup:'disney-screens',lightColor:[.38,.55,1]})),
  ...(geometry.hersheys?.screens??[]).map(f=>({...f,lightGroup:'hersheys-screens',lightColor:[1,.48,.20]})),
  ...(geometry.mms?.referenceAds??[]).map(f=>({...f,lightGroup:'mms-ads',lightColor:[.9,.75,.23]})),
  ...(geometry.hardRock?.ads??[]).map(f=>({...f,lightGroup:'hard-rock-ads',lightColor:[.9,.27,.37]})),
  ...geometry.touro.screens.map(f=>({...f,lightGroup:'touro-corner-film',lightColor:[.64,.26,.60]})),
 ];
 return {total:STOREFRONTS.length,named:STOREFRONTS.filter(f=>!f.authored).length,delis:STOREFRONTS.filter(f=>f.kind==='deli').length,fronts:STOREFRONTS,lightFaces};
}
