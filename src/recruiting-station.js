import{Material}from'./canvas-material.js';

import {addBatches,addFaces} from './street-details.js';
import {architectureNightAppearance} from './architecture-lighting.js';
import {createRecruitingGeometry} from './recruiting-geometry.js';
import {RECRUITING_STATION} from './recruiting-config.js';

function star(c,x,y,r,color){c.fillStyle=color;c.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,s=i%2?r*.382:r;c.lineTo(x+Math.cos(a)*s,y+Math.sin(a)*s);}c.closePath();c.fill();}
function flagTexture(){
 const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=768;const c=canvas.getContext('2d'),h=canvas.height/13;
 for(let i=0;i<13;i++){c.fillStyle=i%2?'#dfe4dd':'#b12732';c.fillRect(0,i*h,1536,h+.5);}
 const w=614,hh=h*7;c.fillStyle='#113d75';c.fillRect(0,0,w,hh);
 for(let row=0;row<9;row++)for(let col=0;col<(row%2?5:6);col++)star(c,(col+(row%2?1:.5))*w/6,(row+.5)*hh/9,19,'#e7ece5');
 // Subtle LED cells, not simulated motion or an animated billboard ad.
 c.fillStyle='#08131b22';for(let y=0;y<768;y+=4)c.fillRect(0,y,1536,1);for(let x=0;x<1536;x+=4)c.fillRect(x,0,1,768);
 return canvas;
}
function signAtlas(labels){
 const canvas=document.createElement('canvas'),cell=384,rows=Math.ceil(labels.length/4);canvas.width=cell*4;canvas.height=rows*cell;const c=canvas.getContext('2d');
 labels.forEach((f,i)=>{
  c.save();c.beginPath();c.rect(i%4*cell,Math.floor(i/4)*cell,cell,cell);c.clip();c.translate(i%4*cell,Math.floor(i/4)*cell);const w=cell*f.width/f.height;c.scale(cell/w,1);c.textAlign='center';
  const text=(t,y,size,color='#d8e1df')=>{c.fillStyle=color;c.font=`bold ${size}px Arial`;c.fillText(t,w/2,y,w-30);};
  c.fillStyle='#1b303e';c.fillRect(0,0,w,cell);
  if(f.kind==='seal'){
   const names=['ARMY','MARINE CORPS','NAVY','AIR FORCE'];
   c.fillStyle='#ada683';c.beginPath();c.arc(w/2,192,179,0,Math.PI*2);c.fill();c.fillStyle='#172f50';c.beginPath();c.arc(w/2,192,165,0,Math.PI*2);c.fill();
   c.strokeStyle='#acb9bb';c.lineWidth=3;c.beginPath();c.arc(w/2,192,123,0,Math.PI*2);c.stroke();
   text('UNITED STATES',81,25);text(names[f.index],318,28);
   // Small architectural medallions, interpreted rather than counterfeit
   // official seal artwork. The service names remain legible at close range.
   star(c,w/2,178,65,'#bec6b8');c.fillStyle='#adab86';c.fillRect(w/2-70,239,140,7);
   for(let j=0;j<7;j++)star(c,w/2-66+j*22,262,6,'#bdc6c0');
  }else if(f.kind==='services'){
   text('U.S. AIR FORCE',135,67);text('& SPACE FORCE',241,65);text('RECRUITING',327,42,'#8baabf');
  }else{
   text('200 W 43RD STREET',151,87);text('TIMES SQUARE',287,75,'#9cbbca');
  }c.restore();
 });return {canvas,rows};
}
function material(type,source,uniforms={},translucent=false){return new Material({fabric:{type,uniforms,source:`czm_material czm_getMaterial(czm_materialInput materialInput){czm_material m=czm_getDefaultMaterial(materialInput);vec2 uv=materialInput.st;m.diffuse=vec3(.006);${source}return m;}`},translucent});}
export function addRecruitingStation(viewer,collision){
 const g=createRecruitingGeometry();collision.addStatic('recruiting-station',g.collision);
 addBatches(viewer,g.batches,false,false,architectureNightAppearance(g.night));addBatches(viewer,g.emissive);addBatches(viewer,g.shadow,false,true);
 const flags=material('RecruitingFlagGlass','vec3 rgb=texture(image,uv).rgb;float sheen=smoothstep(.68,.94,fract(uv.x*2.0+uv.y*.14));m.emission=rgb*(.72+sheen*.12)+vec3(.01,.014,.025);m.alpha=1.0;',{image:flagTexture()});
 addFaces(viewer,g.flags,flags,(f,u,v)=>[u,v]);
 const panels=material('RecruitingSteelMesh','vec2 cell=fract(uv*vec2(115.0,150.0));float hole=1.0-smoothstep(.14,.30,length(cell-.5));float brush=sin(uv.y*2800.0)*.008;float band=step(.93,fract(uv.y*5.0));m.emission=mix(vec3(.22,.265,.29)+brush,vec3(.055,.09,.115),hole*.6)-band*.027;m.alpha=1.0;');
 addFaces(viewer,g.panels,panels,(f,u,v)=>[u,v]);
 const glass=material('RecruitingDoors','float stripe=step(.78,fract(uv.x*4.0+uv.y*.35));m.emission=vec3(.038,.076,.105)+stripe*vec3(.034,.066,.095)+smoothstep(.2,.9,uv.y)*vec3(.018,.034,.043);m.alpha=1.0;');
 addFaces(viewer,g.glass,glass,(f,u,v)=>[u,v]);
 const atlas=signAtlas(g.labels),index=new Map(g.labels.map((f,i)=>[f,i]));
 addFaces(viewer,g.labels,material('RecruitingExteriorLabels','m.emission=texture(image,uv).rgb*.48;m.alpha=1.0;',{image:atlas.canvas}),(f,u,v)=>{const i=index.get(f);return [(i%4+.005+u*.99)/4,(atlas.rows-1-Math.floor(i/4)+.005+v*.99)/atlas.rows];});
 const light=material('RecruitingFlagSpill','vec2 p=uv-.5;vec3 glow=mix(vec3(.18,.29,.59),vec3(.55,.24,.26),uv.x);m.emission=glow;m.alpha=exp(-dot(p,p)*15.0)*.08;',{},true);
 addFaces(viewer,g.pools,light,(f,u,v)=>[u,v],true);
 return {station:RECRUITING_STATION,flagWalls:g.flags.length,silverBollards:g.posts.length,footprintSource:RECRUITING_STATION.source.url};
}
