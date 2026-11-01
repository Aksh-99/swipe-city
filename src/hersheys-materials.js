import{Material}from'./canvas-material.js';

import {addFaces} from './street-details.js';

function labelsAtlas(){
 const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=512;const c=canvas.getContext('2d');
 c.fillStyle='#b42930';c.fillRect(0,0,2048,256);c.textAlign='center';c.fillStyle='#fff4dd';
 // The physical canopy is long and shallow; compensate instead of squeezing
 // a big square wordmark onto it.
 c.save();c.scale(.183,1);c.font='italic bold 172px Arial';c.fillText("HERSHEY’S CHOCOLATE WORLD",5595,188,10850);c.restore();
 c.translate(0,256);c.fillStyle='#1457a0';c.fillRect(0,0,2048,256);c.scale(7.38,1);
 c.fillStyle='#f4bd38';c.beginPath();c.ellipse(139,123,130,79,0,0,Math.PI*2);c.fill();c.fillStyle='#312a30';c.font='bold 55px Arial';c.fillText('JOLLY',139,113);c.font='bold 40px Arial';c.fillText('RANCHER',139,162);
 return canvas;
}
export function addHersheysMaterials(viewer,geometry){
 if(!geometry)return;
 // The generated atlas has an exact inspected divider at pixel y=553 of 1024.
 const split=471/1024;
 const imagery=new Material({fabric:{type:'HersheysReferenceArt',uniforms:{image:'/storefronts/hersheys-atlas.webp'},source:`czm_material czm_getMaterial(czm_materialInput materialInput){czm_material m=czm_getDefaultMaterial(materialInput);m.diffuse=vec3(.009);m.emission=texture(image,materialInput.st).rgb*.87;m.alpha=1.0;return m;}`}});
 addFaces(viewer,geometry.windows,imagery,(f,u,v)=>[
  .003+(f.u0+u*(f.u1-f.u0))*.994,
  f.kind==='upper'?split*(.875+v*.118):split*(.007+v*.984)
 ]);
 addFaces(viewer,geometry.screens,imagery,(f,u,v)=>[.001+(f.u0+u*(f.u1-f.u0))*.998,split+.002+v*(1-split-.005)]);
 const glass=new Material({fabric:{type:'HersheysGlass',source:`czm_material czm_getMaterial(czm_materialInput materialInput){
  czm_material m=czm_getDefaultMaterial(materialInput);vec2 uv=materialInput.st;float reflection=pow(max(0.0,sin(uv.x*16.0+uv.y*3.5)),28.0);
  m.diffuse=vec3(.01);m.emission=vec3(.14,.27,.31)+reflection*vec3(.27,.34,.34);m.alpha=.13+reflection*.09;return m;
 }`},translucent:true});
 addFaces(viewer,geometry.glass,glass,(f,u,v)=>[u,v],true);
 const labels=new Material({fabric:{type:'HersheysCanopyLabels',uniforms:{image:labelsAtlas()},source:`czm_material czm_getMaterial(czm_materialInput materialInput){czm_material m=czm_getDefaultMaterial(materialInput);m.diffuse=vec3(.01);m.emission=texture(image,materialInput.st).rgb*.88;m.alpha=1.0;return m;}`}});
 addFaces(viewer,geometry.labels,labels,(f,u,v)=>[.003+u*.994,((f.kind==='canopy'?1:0)+.009+v*.982)/2]);
 const bulbs=new Material({fabric:{type:'HersheysLetterBulbs',source:`czm_material czm_getMaterial(czm_materialInput materialInput){vec2 q=materialInput.st-.5;float d=length(q);if(d>.49)discard;czm_material m=czm_getDefaultMaterial(materialInput);m.diffuse=vec3(.015);m.emission=vec3(1.0,.99,.88)*(1.0-d*.55);m.alpha=1.0;return m;}`}});
 addFaces(viewer,geometry.bulbs,bulbs,(f,u,v)=>[u,v]);
}
