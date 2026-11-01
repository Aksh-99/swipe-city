import{Material}from'./canvas-material.js';

import {addFaces} from './street-details.js';
const labelKinds=['disney-small','playbox','avenue21','city-sole','sale','new-drops'];

function signAtlas(){
 const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=768;const c=canvas.getContext('2d');
 const signs=[
  ['DISNEY STORE','#22313a','#fff7de',4.1/.32],['PLAYBOX','#d44889','#fff8fb',8.7/.82],
  ['AVENUE 21','#19191a','#dec184',14/1.02],['CITY SOLE','#1b3037','#effffa',13.9/1.02],
  ['SALE','#c82842','#fff1d7',1.34/3.12],['NEW DROPS','#153d38','#d0ffec',1.64/2.7]
 ];
 signs.forEach(([title,bg,fg,aspect],i)=>{
  c.save();c.translate(i%2*1024,Math.floor(i/2)*256);c.fillStyle=bg;c.fillRect(0,0,1024,256);
  c.scale(4/aspect,1);const w=256*aspect;c.textAlign='center';c.fillStyle=fg;
  if(i===4){c.font='bold 27px Arial';c.fillText('WEEKEND',w/2,49,w-7);c.font='bold 40px Arial';c.fillText('SALE',w/2,106,w-8);c.font='bold 51px Arial';c.fillText('30%',w/2,180,w-8);c.font='18px Arial';c.fillText('OFF',w/2,217);}
  else if(i===5){c.font='bold 39px Arial';c.fillText('NEW',w/2,78,w-10);c.fillText('DROPS',w/2,127,w-10);c.font='21px Arial';c.fillText('CITY SOLE',w/2,210,w-10);}
  else{c.font=i===2?'146px Georgia':i===0?'bold 127px Arial':'bold 150px Arial';c.fillText(title,w/2,179,w-55);}
  c.restore();
 });return canvas;
}
export function addDisneyRetailMaterials(viewer,geometry){
 if(!geometry)return;
 const retail=new Material({fabric:{type:'DisneyBlockRetailWindows',uniforms:{image:'/storefronts/retail-interiors-atlas.webp'},source:`czm_material czm_getMaterial(czm_materialInput materialInput){czm_material m=czm_getDefaultMaterial(materialInput);m.diffuse=vec3(.01);m.emission=texture(image,materialInput.st).rgb*.79;m.alpha=1.0;return m;}`}});
 // The three columns are fashion, toy and sneaker interiors, respectively.
 addFaces(viewer,geometry.windows.filter(f=>!f.disney),retail,(f,u,v)=>{
  const tile=f.art===1?0:f.art===2?1:2,crop=f.section==='door'?.35:1,left=(1-crop)/2;
  return [(tile+.008+(left+(f.flip?1-u:u)*crop)*.984)/3,.007+v*.986];
 });
 const toys=new Material({fabric:{type:'DisneyWindowDisplays',uniforms:{image:'/storefronts/window-atlas.webp'},source:`czm_material czm_getMaterial(czm_materialInput materialInput){czm_material m=czm_getDefaultMaterial(materialInput);m.diffuse=vec3(.01);m.emission=texture(image,materialInput.st).rgb*.76;m.alpha=1.0;return m;}`}});
 addFaces(viewer,geometry.windows.filter(f=>f.disney),toys,(f,u,v)=>{const crop=f.section==='door'?.26:1;return [(.008+(1-crop)/2+u*crop*.982)/2,(.008+v*.984)/3];});
 const glass=new Material({fabric:{type:'DisneyBlockGlass',source:`czm_material czm_getMaterial(czm_materialInput materialInput){czm_material m=czm_getDefaultMaterial(materialInput);vec2 uv=materialInput.st;float streak=pow(max(0.0,sin(uv.x*17.0+uv.y*5.0)),34.0);m.diffuse=vec3(.01);m.emission=vec3(.20,.33,.38)+streak*vec3(.31,.36,.40);m.alpha=.09+streak*.11;return m;}`},translucent:true});
 addFaces(viewer,geometry.glass,glass,(f,u,v)=>[u,v],true);
 const logo=new Material({fabric:{type:'DisneyRedScript',uniforms:{image:'/storefronts/disney-wordmark.svg'},source:`czm_material czm_getMaterial(czm_materialInput materialInput){vec4 ink=texture(image,materialInput.st);if(ink.a<.3)discard;czm_material m=czm_getDefaultMaterial(materialInput);m.diffuse=vec3(.01);m.emission=vec3(1.0,.035,.12);m.alpha=1.0;return m;}`}});
 addFaces(viewer,geometry.logos,logo,(f,u,v)=>[u,v]);
 const labels=new Material({fabric:{type:'DisneyBlockShopSigns',uniforms:{image:signAtlas()},source:`czm_material czm_getMaterial(czm_materialInput materialInput){czm_material m=czm_getDefaultMaterial(materialInput);m.diffuse=vec3(.01);m.emission=texture(image,materialInput.st).rgb*.92;m.alpha=1.0;return m;}`}});
 addFaces(viewer,geometry.labels,labels,(f,u,v)=>{const i=labelKinds.indexOf(f.kind);return [(i%2+.004+u*.992)/2,(2-Math.floor(i/2)+.008+v*.984)/3];});
 const led=new Material({fabric:{type:'DisneyBuildingLedWall',uniforms:{image:'/billboards/disney-building-led.webp'},source:`czm_material czm_getMaterial(czm_materialInput materialInput){czm_material m=czm_getDefaultMaterial(materialInput);vec3 ad=texture(image,materialInput.st).rgb;m.diffuse=vec3(.008);m.emission=gl_FrontFacing?ad*.98:vec3(.008);m.alpha=1.0;return m;}`}});
 addFaces(viewer,geometry.screens,led,(f,u,v)=>[.002+(f.u0+u*(f.u1-f.u0))*.996,.004+v*.992]);
}
