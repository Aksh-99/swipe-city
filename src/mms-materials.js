import{Material}from'./canvas-material.js';

import {addFaces} from './street-details.js';

function candyAtlas(){
 const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=256;const c=canvas.getContext('2d');
 for(const [i,color] of ['#e51d30','#f2d80b','#f68b0d','#28b54e','#087ecc'].entries()){
  c.save();c.translate(i*256,0);c.beginPath();c.arc(128,128,126,0,Math.PI*2);c.clip();
  c.fillStyle=color;c.fillRect(0,0,256,256);
  const gloss=c.createRadialGradient(91,65,8,121,113,164);gloss.addColorStop(0,'rgba(255,255,255,.55)');gloss.addColorStop(.35,'rgba(255,255,255,.08)');gloss.addColorStop(.66,'rgba(0,0,0,0)');gloss.addColorStop(1,'rgba(0,0,0,.42)');c.fillStyle=gloss;c.fillRect(0,0,256,256);
  c.strokeStyle='#fff2b4';c.lineWidth=3;c.beginPath();c.arc(128,128,121,0,Math.PI*2);c.stroke();
  c.fillStyle='#fffbed';c.textAlign='center';c.font='bold 151px Georgia';c.fillText('m',128,174);c.restore();
 }
 return canvas;
}
function labelAtlas(){
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;const c=canvas.getContext('2d');
 c.fillStyle='#f8d918';c.fillRect(0,0,1024,256);c.textAlign='center';c.lineJoin='round';
 c.font='bold 194px Arial';c.strokeStyle='#fffbed';c.lineWidth=9;c.strokeText('m&m’s',512,186);c.fillStyle='#48291e';c.fillText('m&m’s',512,186);
 c.font='bold 27px Arial';c.fillText('NEW YORK',512,235);
 c.translate(0,256);c.fillStyle='#183139';c.fillRect(0,0,1024,256);
 // Match the long, shallow entrance transom without stretching its lettering.
 c.scale(.517,1);c.fillStyle='#fffde6';c.font='bold 188px Arial';c.fillText('m&m’s',990,184);
 return canvas;
}
export function addMmsMaterials(viewer,geometry){
 if(!geometry)return;
 const interiors=new Material({translucent:false,fabric:{type:'MmsPanoramaWindows',uniforms:{image:'/storefronts/mms-interior-atlas.webp'},source:`czm_material czm_getMaterial(czm_materialInput materialInput){czm_material m=czm_getDefaultMaterial(materialInput);m.diffuse=vec3(.01);m.emission=texture(image,materialInput.st).rgb*.82;m.alpha=1.0;return m;}`}});
 addFaces(viewer,geometry.interiors,interiors,(f,u,v)=>[f.door?.43+u*.14:.003+u*.994,(1-f.band+.006+v*.988)/2]);
 const glass=new Material({fabric:{type:'MmsReflectiveGlass',source:`czm_material czm_getMaterial(czm_materialInput materialInput){
  czm_material m=czm_getDefaultMaterial(materialInput);vec2 st=materialInput.st;
  float upper=smoothstep(.27,.46,st.y);float streak=pow(max(0.0,sin(st.x*25.0+st.y*8.0)),34.0);
  vec3 tint=mix(vec3(.14,.28,.35),vec3(.035,.47,.88),upper);
  m.diffuse=vec3(.01);m.emission=tint+streak*vec3(.2,.35,.45);m.alpha=.08+upper*.13+streak*.07;return m;
 }`},translucent:true});
 addFaces(viewer,geometry.glass,glass,(f,u,v)=>[u,v],true);
 const candies=new Material({translucent:false,fabric:{type:'MmsCornerCandySigns',uniforms:{image:candyAtlas()},source:`czm_material czm_getMaterial(czm_materialInput materialInput){
  czm_material m=czm_getDefaultMaterial(materialInput);vec2 q=vec2(fract(materialInput.st.x*5.0),materialInput.st.y);
  if(length(q-.5)>.493)discard;m.diffuse=vec3(.01);m.emission=texture(image,materialInput.st).rgb*.97;m.alpha=1.0;return m;
 }`}});
 addFaces(viewer,geometry.candies,candies,(f,u,v)=>[(f.tile+.001+u*.998)/5,.001+v*.998]);
 const labels=new Material({translucent:false,fabric:{type:'MmsStoreLabels',uniforms:{image:labelAtlas()},source:`czm_material czm_getMaterial(czm_materialInput materialInput){czm_material m=czm_getDefaultMaterial(materialInput);m.diffuse=vec3(.008);m.emission=texture(image,materialInput.st).rgb*.94;m.alpha=1.0;return m;}`}});
 addFaces(viewer,geometry.labels,labels,(f,u,v)=>[.002+u*.996,((f.kind==='billboard'?1:0)+.008+v*.984)/2]);
 const ad=new Material({translucent:false,fabric:{type:'MmsReferenceCharacterAd',uniforms:{image:'/storefronts/mms-reference.webp'},source:`czm_material czm_getMaterial(czm_materialInput materialInput){czm_material m=czm_getDefaultMaterial(materialInput);m.diffuse=vec3(.006);m.emission=texture(image,materialInput.st).rgb*.88;m.alpha=1.0;return m;}`}});
 // Only the red-character poster in the user's photograph, not its streets,
 // people, traffic or photographed building, is used as advertising artwork.
 addFaces(viewer,geometry.referenceAds,ad,(f,u,v)=>[(61+u*61)/547,1-(232-v*145)/365]);
}
