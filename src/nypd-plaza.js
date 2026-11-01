import {Material} from 'cesium';
import {addBatches,addFaces} from './street-details.js';
import {createNypdPlazaGeometry} from './nypd-plaza-geometry.js';
import {NYPD_PLAZA} from './nypd-plaza-config.js';

function signAtlas(labels){
 const canvas=document.createElement('canvas'),rows=Math.ceil(labels.length/4);canvas.width=2048;canvas.height=rows*384;const c=canvas.getContext('2d');
 labels.forEach((label,i)=>{
  const x=i%4*512,y=Math.floor(i/4)*384,w=384*label.width/label.height;
  c.save();c.beginPath();c.rect(x,y,512,384);c.clip();c.translate(x,y);c.scale(512/w,1);c.textAlign='center';
  if(label.kind==='badge'){
   // Small architectural crest, drawn as vector artwork rather than sampling
   // the supplied street-view photograph. It is a reference-inspired badge.
   c.fillStyle='#7b8b94';c.fillRect(0,0,w,384);c.save();c.translate(w/2,192);c.scale(.88,.88);
   const shield=new Path2D('M-134 -164 Q0 -207 134 -164 L126 -57 Q116 95 0 193 Q-116 95 -126 -57 Z');
   c.fillStyle='#b7985f';c.fill(shield);c.strokeStyle='#e4c88b';c.lineWidth=5;c.stroke(shield);c.scale(.90,.90);c.fillStyle='#172f4e';c.fill(shield);
   c.fillStyle='#d8b87b';c.font='bold 35px Arial';c.fillText('POLICE',0,-109,217);c.font='18px Arial';c.fillText('DEPARTMENT',0,-78,214);
   c.strokeStyle='#c29c53';c.lineWidth=7;c.beginPath();c.ellipse(0,30,71,86,0,0,Math.PI*2);c.stroke();c.fillStyle='#3c7390';c.fill();
   c.fillStyle='#d2b47a';c.beginPath();c.moveTo(0,-29);c.lineTo(-43,65);c.lineTo(44,65);c.closePath();c.fill();c.fillRect(-13,-44,26,117);
   c.strokeStyle='#204461';c.lineWidth=4;for(let k=-30;k<50;k+=18){c.beginPath();c.moveTo(-42,k);c.lineTo(42,k);c.stroke();}
   c.fillStyle='#ddc187';c.font='17px Arial';c.fillText('CITY OF NEW YORK',0,137,171);c.restore();
  }else if(label.kind==='notice'){
   c.fillStyle='#e6e6d9';c.fillRect(0,0,w,384);c.fillStyle='#e0b644';c.fillRect(0,0,w,67);c.fillStyle='#142b35';c.font='bold 35px Arial';c.fillText('PEDESTRIAN',w/2,45,w-18);c.font='bold 43px Arial';c.fillText('WALKWAY',w/2,121,w-18);
   c.font='27px Arial';c.fillText('OPEN',w/2,164,w-18);c.font='76px Arial';c.fillText('↔',w/2,257,w-26);c.font='19px Arial';c.fillText('ONE TIMES SQUARE',w/2,334,w-18);c.fillRect(12,356,w-24,4);
  }else{
   c.fillStyle='#254d40';c.fillRect(0,0,w,384);c.strokeStyle='#93b39b';c.lineWidth=4;c.strokeRect(8,14,w-16,354);c.fillStyle='#e3eedc';c.font='bold 113px Arial';c.fillText('SIDEWALK OPEN',w/2,168,w-72);c.font='65px Arial';c.fillText('Please use covered walkway',w/2,277,w-70);
  }
  c.restore();
 });return canvas;
}
function imageMaterial(type,image,brightness=1){return new Material({fabric:{type,uniforms:{image},source:`czm_material czm_getMaterial(czm_materialInput materialInput){czm_material m=czm_getDefaultMaterial(materialInput);m.diffuse=vec3(.01);m.emission=texture(image,materialInput.st).rgb*${brightness.toFixed(2)};m.alpha=1.0;return m;}`}});}

export function addNypdPlaza(viewer,collision){
 const g=createNypdPlazaGeometry(),opaque=new Map(),transparent=new Map();
 for(const [color,vertices]of g.batches)(color.length===9?transparent:opaque).set(color,vertices);
 addBatches(viewer,opaque);addBatches(viewer,transparent,false,true);collision.addStatic('nypd-plaza',g.collision);
 const glass=new Material({fabric:{type:'NypdPavilionGlass',source:`
 float tileNoise(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 czm_material czm_getMaterial(czm_materialInput materialInput){
  vec2 uv=vec2(fract(materialInput.st.x)/.99,materialInput.st.y);float kind=floor(materialInput.st.x);
  float reflection=step(.72,fract(uv.x*6.0+uv.y*.21))*smoothstep(.04,.68,uv.y);
  vec3 color=vec3(.085,.15,.16)+reflection*vec3(.13,.19,.19);
  if(kind<.5){
   vec2 cell=floor(uv*vec2(112.0,65.0));float noise=tileNoise(cell);
   float river=1.0-smoothstep(.065,.11,abs(uv.x-.40-.18*sin(uv.y*4.0)));
   float land=step(.17,noise)*step(.68,fract(uv.x*8.0+uv.y*3.4));
   color=mix(vec3(.16,.25,.22),vec3(.19,.32,.33),river);
   color=mix(color,vec3(.29,.27,.16),land*.48)*(noise*.33+.78);
   vec2 cut=fract(uv*vec2(112.0,65.0));color*=.75+.25*step(.05,min(cut.x,cut.y));
   color+=reflection*vec3(.12,.16,.15);
  }else if(kind<1.5){color=vec3(.055,.095,.115)+reflection*.085;}
  else{
   float panes=step(.12,fract(uv.x*2.0+kind*.32));float lit=step(.66,tileNoise(vec2(kind,floor(uv.y*6.0))));
   color=mix(vec3(.12,.22,.28),vec3(.34,.45,.48),panes*.42+reflection*.38);
   color=mix(color,vec3(.44,.37,.23),lit*step(.69,fract(uv.y*5.4))*.53);
  }
  czm_material m=czm_getDefaultMaterial(materialInput);m.diffuse=vec3(.01);m.emission=color;m.alpha=1.0;return m;
 }`}});
 addFaces(viewer,g.glass,glass,(f,u,v)=>[(f.kind==='mosaic'?0:f.kind==='door'?1:2+(f.variant||0))+u*.99,v]);
 const rows=Math.ceil(g.labels.length/4),indexes=new Map(g.labels.map((f,i)=>[f,i]));
 addFaces(viewer,g.labels,imageMaterial('NypdPlazaSignage',signAtlas(g.labels),.87),(f,u,v)=>{const i=indexes.get(f);return [(i%4+.003+u*.994)/4,(rows-1-Math.floor(i/4)+.003+v*.994)/rows];});
 if(g.ads.length)addFaces(viewer,g.ads,imageMaterial('BroadwayPlazaPosters','/billboards/portrait-atlas.webp',.95),(f,u,v)=>{const crop=Math.min(1,(f.width/f.height)/.5);return [(f.art%4+.004+((1-crop)/2+u*crop)*.992)/4,(1-Math.floor(f.art/4)+.004+v*.992)/2];});
 const light=new Material({fabric:{type:'NypdScaffoldLighting',source:`czm_material czm_getMaterial(czm_materialInput materialInput){vec2 p=materialInput.st-.5;czm_material m=czm_getDefaultMaterial(materialInput);m.diffuse=vec3(.04);m.emission=vec3(.81,.82,.69);m.alpha=exp(-dot(p,p)*14.0)*.10;return m;}`},translucent:true});
 addFaces(viewer,g.pools,light,(f,u,v)=>[u,v],true);
 return {station:NYPD_PLAZA.station,scaffolds:2,scaffoldMeters:Math.round(NYPD_PLAZA.scaffolds.filter(s=>s.id!=='opposite-broadway').reduce((sum,s)=>sum+s.length,0)),umbrellas:g.furniture.length,chairs:g.furniture.length*4,planters:NYPD_PLAZA.planters.length,railBarricades:g.barriers.length,silverBollards:g.posts.length,jerseyBarriers:5,advertisements:g.ads.length};
}
