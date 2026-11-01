import {Material} from 'cesium';
import {addBatches,addFaces} from './street-details.js';
import {architectureNightAppearance} from './architecture-lighting.js';
import {createPoliceVehicleGeometry} from './police-vehicle-geometry.js';
export function policeLiveryAtlas(entries){
 const cell=256,columns=8,rows=Math.ceil(entries.length/columns),canvas=document.createElement('canvas');canvas.width=cell*columns;canvas.height=cell*rows;
 const c=canvas.getContext('2d'),blue='#145789';
 for(const [i,label]of entries.entries()){
  const w=cell*label.width/label.height;c.save();c.translate(i%columns*cell,Math.floor(i/columns)*cell);c.beginPath();c.rect(0,0,cell,cell);c.clip();c.scale(cell/w,1);
  const text=(value,x,y,size,color=blue,italic=false,max=w*.95)=>{c.fillStyle=color;c.font=`${italic?'italic ':''}bold ${size}px Arial`;c.textAlign='center';c.fillText(value,x,y,max);};
  if(label.kind==='door'){
   const cx=w*.135;c.fillStyle='#c6a957';c.strokeStyle='#d5c287';c.lineWidth=8;
   c.beginPath();c.moveTo(cx-88,31);c.lineTo(cx+88,31);c.lineTo(cx+75,157);c.quadraticCurveTo(cx+47,217,cx,231);c.quadraticCurveTo(cx-47,217,cx-51,151);c.closePath();c.fill();c.stroke();
   c.fillStyle='#175781';c.beginPath();c.moveTo(cx-63,60);c.lineTo(cx+63,60);c.lineTo(cx+51,151);c.quadraticCurveTo(cx+29,190,cx,203);c.quadraticCurveTo(cx-29,190,cx-51,151);c.closePath();c.fill();
   text('POLICE',cx,48,24,'#133f64',false,170);text('NYC',cx,146,42,'#e3d38d',false,102);text('NYPD',w*.61,211,232,blue,true,w*.67);
  }else if(label.kind==='motto'){
   for(const [j,value]of ['Courtesy','Professionalism','Respect'].entries())text(value,w/2,65+j*75,61,blue,false,w*.93);
  }else if(label.kind==='unit')text(label.car.fleet,w/2,211,216);
  else if(label.kind==='rear')text('NYPD  POLICE',w/2,203,215,blue,true);
  else if(label.kind==='hood')text('POLICE',w/2,213,213,blue,true);
  else if(label.kind==='plate'){
   c.fillStyle='#c3b56d';c.fillRect(0,0,w,cell);c.strokeStyle='#24313a';c.lineWidth=12;c.strokeRect(10,10,w-20,cell-20);text('NEW YORK',w/2,52,44,'#273c48');text(label.car.fleet+'  NY',w/2,205,145,'#253744');
  }c.restore();
 }return {canvas,columns,rows};
}
export function addPoliceVehicles(viewer,collision){
 const g=createPoliceVehicleGeometry();collision.addStatic('parked-nypd-vehicles',g.collision);
 addBatches(viewer,g.batches,false,false,architectureNightAppearance(g.night));addBatches(viewer,g.lamps);addBatches(viewer,g.shadows,false,true);
 const glass=new Material({fabric:{type:'TimesSquarePatrolGlass',source:`czm_material czm_getMaterial(czm_materialInput materialInput){
  czm_material m=czm_getDefaultMaterial(materialInput);vec2 q=fract(materialInput.st);float pane=floor(materialInput.st.x);
  float reflection=smoothstep(.19,.27,fract(q.x*.43+q.y*.74+pane*.15));float rim=pow(q.y,5.0);
  vec3 color=mix(vec3(.013,.027,.041),vec3(.063,.105,.133),reflection*.75)+rim*vec3(.026,.036,.044);
  float warm=exp(-pow((q.x+.25*q.y-.68)*6.0,2.0));color+=warm*vec3(.025,.016,.004);
  m.diffuse=vec3(.003);m.emission=color;m.alpha=1.0;return m;
 }`}});
 addFaces(viewer,g.glass,glass,(f,u,v)=>[f.variant+u*.995,v]);
 const entries=[],indices=new Map(),cache=new Map();
 for(const label of g.labels){const key=label.kind+(label.kind==='unit'||label.kind==='plate'?label.car.fleet:'');if(!cache.has(key)){cache.set(key,entries.length);entries.push(label);}indices.set(label,cache.get(key));}
 const atlas=policeLiveryAtlas(entries);
 const livery=new Material({fabric:{type:'TimesSquarePatrolLivery',uniforms:{image:Material.DefaultImageId},source:`czm_material czm_getMaterial(czm_materialInput materialInput){
  vec4 paint=texture(image,materialInput.st);if(paint.a<.12)discard;czm_material m=czm_getDefaultMaterial(materialInput);m.diffuse=vec3(.003);m.emission=paint.rgb*.37;m.alpha=1.0;return m;
 }`}});livery.uniforms.image=atlas.canvas;
 addFaces(viewer,g.labels,livery,(f,u,v)=>{const i=indices.get(f);return [(i%atlas.columns+.004+u*.992)/atlas.columns,(atlas.rows-1-Math.floor(i/atlas.columns)+.004+v*.992)/atlas.rows];});
 return {count:g.vehicles.length,sedans:g.vehicles.filter(c=>c.type==='sedan').length,suvs:g.vehicles.filter(c=>c.type==='suv').length,vans:g.vehicles.filter(c=>c.type==='van').length,stationVehicles:g.vehicles.filter(c=>c.station).length,stationary:true};
}
