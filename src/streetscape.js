import{Material}from'./canvas-material.js';

import {addBatches,addFaces} from './street-details.js';
import {createStreetscapeGeometry} from './streetscape-geometry.js';
import {SUBWAY_ENTRANCES,SCAFFOLDS,STREET_LAMPS} from './streetscape-config.js';
import {insideEntrance} from './ground-cutouts.js';
const colors={1:'#e63133',2:'#e63133',3:'#e63133',7:'#b338b6',N:'#f6d13b',Q:'#f6d13b',R:'#f6d13b',W:'#f6d13b',S:'#858c92',A:'#235fa6',C:'#235fa6',E:'#235fa6',B:'#ed782a',D:'#ed782a',F:'#ed782a',M:'#ed782a'};
function signAtlas(labels){
 const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=Math.ceil(labels.length/4)*160;const c=canvas.getContext('2d');
 labels.forEach((label,i)=>{const x=i%4*512,y=Math.floor(i/4)*160;c.fillStyle='#081018';c.fillRect(x,y,512,160);c.fillStyle='#f5f4ed';
  // Each physical sign has a different aspect ratio. Compensate in the atlas
  // so route circles stay round and lettering is never stretched by the mesh.
  const ratio=(label.width/label.height)/(512/160),width=512*ratio;c.save();c.translate(x,y);c.scale(1/ratio,1);
  if(label.kind==='subway'){
   let name=label.entry.station.replace('42 St-Port Authority Bus Terminal','42 St–Port Authority').replace('47-50 Sts-Rockefeller Ctr','47–50 Sts Rockefeller Ctr');
   c.fillRect(14,12,width-28,3);c.font='bold 35px Arial';c.textAlign='left';c.fillText(name,17,57,width-34);
   const routes=label.entry.routes.split(' '),spacing=Math.min(43,(width-34)/routes.length),radius=Math.min(18,spacing*.43);
   routes.forEach((route,j)=>{const cx=20+radius+j*spacing,cy=99;c.fillStyle=colors[route]||'#777';c.beginPath();c.arc(cx,cy,radius,0,Math.PI*2);c.fill();c.fillStyle='NQRW'.includes(route)?'#101719':'white';c.font='bold 23px Arial';c.textAlign='center';c.fillText(route,cx,cy+8);});
   c.fillStyle='#c8d2d4';c.textAlign='left';c.font='19px Arial';c.fillText('Subway',18,145);
  }else{c.fillStyle='#245242';c.fillRect(0,0,width,160);c.fillStyle='#edf3dc';c.textAlign='center';c.font='bold 42px Arial';c.fillText('SIDEWALK OPEN',width/2,69);c.font='23px Arial';c.fillText('Please use covered walkway',width/2,112);}
  c.restore();
 });return canvas;
}
export function addStreetscape(viewer,collision){
 const geometry=createStreetscapeGeometry(),opaque=new Map(),glass=new Map();
 for(const [color,positions] of geometry.batches)(color.length===9?glass:opaque).set(color,positions);
 addBatches(viewer,opaque);if(glass.size)addBatches(viewer,glass,false,true);
 collision.addStatic('subway-scaffolding-lamps',geometry.collision);
 collision.groundBase=p=>{const entry=SUBWAY_ENTRANCES.find(e=>insideEntrance(e,p));return entry?-entry.depth:0;};
 // The globe otherwise seals the stairwell at sea-level. A bounded local floor
 // with exact matching apertures is rendered above, retaining geospatial tiles.
 viewer.scene.globe.show=false;
 viewer.scene.screenSpaceCameraController.enableCollisionDetection=false;
 const atlas=signAtlas(geometry.labels),rows=Math.ceil(geometry.labels.length/4),material=new Material({fabric:{type:'TimesSquareSubwaySigns',uniforms:{image:atlas},source:`czm_material czm_getMaterial(czm_materialInput materialInput){czm_material m=czm_getDefaultMaterial(materialInput);m.diffuse=vec3(.01);m.emission=texture(image,materialInput.st).rgb*.85;m.alpha=1.0;return m;}`}});
 const indexes=new Map(geometry.labels.map((label,i)=>[label,i]));
 addFaces(viewer,geometry.labels,material,(f,u,v)=>{const i=indexes.get(f);return [(i%4+.002+u*.996)/4,(rows-1-Math.floor(i/4)+.002+v*.996)/rows];});
 const lightMaterial=new Material({fabric:{type:'TimesSquareSidewalkLights',source:`czm_material czm_getMaterial(czm_materialInput materialInput){czm_material m=czm_getDefaultMaterial(materialInput);vec2 q=materialInput.st-.5;float glow=exp(-dot(q,q)*14.0);m.diffuse=vec3(.04);m.emission=vec3(.72,.76,.67);m.alpha=glow*.13;return m;}`},translucent:true});
 addFaces(viewer,geometry.pools,lightMaterial,(f,u,v)=>[u,v],true);
 return {entrances:SUBWAY_ENTRANCES.length,scaffolds:SCAFFOLDS.length,streetLamps:STREET_LAMPS.length};
}
