import {Material} from 'cesium';
import {addBatches,addFaces} from './street-details.js';
import {architectureNightAppearance} from './architecture-lighting.js';
import {createBusGeometry} from './bus-geometry.js';
export function busSignAtlas(labels){
 const canvas=document.createElement('canvas'),cell=256,columns=8,rows=Math.ceil(labels.length/columns);canvas.width=columns*cell;canvas.height=rows*cell;const c=canvas.getContext('2d');
 for(const [i,f]of labels.entries()){
  const b=f.bus,w=cell*f.width/f.height,city=b.kind==='city',tour=b.kind==='tour',gold='#d8b775',blue='#155783';
  c.save();c.translate(i%columns*cell,Math.floor(i/columns)*cell);c.beginPath();c.rect(0,0,cell,cell);c.clip();c.scale(cell/w,1);c.textAlign='center';c.textBaseline='alphabetic';
  const text=(t,y,size,color='#dee4dc',font='Arial')=>{c.fillStyle=color;c.font=`bold ${size}px ${font}`;c.fillText(t,w/2,y,w-16);};
  c.fillStyle=city?'#c8cfc9':tour?'#672931':'#c7c6b8';c.fillRect(0,0,w,cell);
  if(f.kind==='destination'||f.kind==='rear'){
   c.fillStyle='#061217';c.fillRect(0,0,w,cell);
   text(f.kind==='rear'?(b.route||'NEW YORK'):b.destination,183,171,'#dab865','monospace');
   // LED matrix is drawn into the small shared atlas, with no animation or
   // per-character geometry and no simulated live arrival information.
   c.fillStyle='#07121a88';for(let y=0;y<cell;y+=8)c.fillRect(0,y,w,2);for(let x=0;x<w;x+=8)c.fillRect(x,0,2,cell);
  }else if(f.kind==='livery'||f.kind==='tour-brand'){
   if(city){text('MTA  NEW YORK CITY BUS',171,130,'#1c527c');}
   else if(tour){text('BIG BUS  NEW YORK',180,160,gold);}
   else{text('OurBus   ·   URBAN SHERPA',178,145,'#444e41');}
  }else if(f.kind==='nose'){text(city?'MTA':tour?'BIG BUS':'OurBus',181,183,city?blue:tour?gold:'#464e46');}
  else if(f.kind==='fleet'){c.fillStyle='#22343d';c.fillRect(0,0,w,cell);text(f.text,190,199,'#d5ded6');}
  else if(f.kind==='access'){
   c.fillStyle=blue;c.fillRect(0,0,w,cell);const cx=w/2;c.strokeStyle='#eef2e6';c.lineWidth=15;c.beginPath();c.arc(cx-19,160,51,.07,Math.PI*1.82);c.stroke();c.beginPath();c.moveTo(cx,63);c.lineTo(cx,143);c.lineTo(cx+50,143);c.lineTo(cx+69,204);c.lineTo(cx+91,198);c.stroke();c.beginPath();c.moveTo(cx,91);c.lineTo(cx+52,91);c.stroke();c.fillStyle='#eef2e6';c.beginPath();c.arc(cx,34,17,0,Math.PI*2);c.fill();
  }else if(f.kind==='stop-icon'){
   c.clearRect(0,0,w,cell);c.fillStyle=city?blue:tour?'#843d36':'#58653a';c.beginPath();c.arc(w/2,cell/2,cell*.49,0,Math.PI*2);c.fill();
   c.fillStyle='#e3e7df';c.fillRect(w/2-65,65,130,125);c.beginPath();c.roundRect(w/2-65,47,130,79,19);c.fill();
   c.fillStyle=city?blue:tour?'#843d36':'#58653a';c.fillRect(w/2-49,72,98,61);c.fillRect(w/2-24,53,48,8);
   c.beginPath();c.arc(w/2-43,160,9,0,Math.PI*2);c.arc(w/2+43,160,9,0,Math.PI*2);c.fill();
   c.fillStyle='#e3e7df';c.fillRect(w/2-57,184,18,20);c.fillRect(w/2+39,184,18,20);
  }else if(f.kind==='stop-routes'){
   c.fillStyle='#dedfd6';c.fillRect(0,0,w,cell);c.fillStyle='#a84035';c.fillRect(0,0,w,56);text('NO STANDING',24,19,'#f0e8d8');text('BUS STOP',47,23,'#f0e8d8');
   c.fillStyle=city?blue:tour?'#672931':'#536449';c.fillRect(4,62,w-8,139);
   const routeSize=city?43:tour?32:23;b.routes.forEach((route,j)=>text(route,97+j*(b.routes.length===3?42:51),routeSize,city?'#e8e5d8':gold));
   text(city?'LOCAL SERVICE':tour?'SIGHTSEEING':'ADVENTURE SHUTTLE',223,13,'#34424a');text('TIMES SQUARE',246,13,'#53616a');
  }else if(f.kind==='info'){
   c.fillStyle='#e3e4d8';c.fillRect(0,0,w,cell);c.fillStyle='#315473';c.fillRect(0,0,w,30);text('BUS INFORMATION',21,14,'#e7e8d9');
   // A printed diagram, not a current schedule or fabricated arrival time.
   c.strokeStyle='#2f6684';c.lineWidth=5;c.beginPath();c.moveTo(22,50);c.lineTo(22,166);c.lineTo(w-26,188);c.stroke();
   for(let j=0;j<5;j++){const y=52+j*27;c.fillStyle='#e2e6da';c.beginPath();c.arc(22,y,5,0,Math.PI*2);c.fill();c.strokeStyle='#384d5a';c.lineWidth=1.5;c.stroke();c.fillStyle='#9baba9';c.fillRect(37,y-2,w-53,3);}
   text(b.road==='7th Avenue'?'7 AVENUE':'WEST 42 ST',220,15,'#294350');text('NEW YORK',243,14,'#344a56');
  }c.restore();
 }return {canvas,columns,rows};
}
function material(type,source,uniforms={},translucent=false){return new Material({fabric:{type,uniforms,source:`czm_material czm_getMaterial(czm_materialInput materialInput){czm_material m=czm_getDefaultMaterial(materialInput);vec2 uv=materialInput.st;m.diffuse=vec3(.004);${source}return m;}`},translucent});}
export function addBuses(viewer,collision){
 const g=createBusGeometry();collision.addStatic('bus-stops-and-buses',g.collision);
 addBatches(viewer,g.batches,false,false,architectureNightAppearance(g.night));addBatches(viewer,g.emissive);addBatches(viewer,g.asphalt,true);addBatches(viewer,g.shadows,false,true);
 const windows=material('TimesSquareBusGlass',`vec2 q=fract(uv);float reflection=smoothstep(.15,.21,fract(q.x*.72+q.y*.25));float seat=step(.28,q.x)*step(q.x,.70)*step(.08,q.y)*step(q.y,.31);vec3 sky=mix(vec3(.025,.049,.070),vec3(.072,.125,.153),reflection*.8);m.emission=sky+seat*vec3(.029,.030,.024)+pow(q.y,6.0)*vec3(.025,.042,.056);m.alpha=1.0;`);
 addFaces(viewer,g.glass,windows,(f,u,v)=>[u,v]);
 // Repeated liveries, pictograms and stop panels share atlas cells, including
 // the two readable sides of each pole. Seven buses need only one small atlas.
 const entries=[],cache=new Map(),index=new Map();
 for(const label of g.labels){
  const b=label.bus,content=label.kind==='destination'?b.destination:label.kind==='rear'?(b.route||'NEW YORK'):label.kind==='fleet'?label.text:label.kind==='stop-routes'?b.routes.join('/'):label.kind==='info'?b.road:'';
  const key=[label.kind,b.kind,content].join('|');if(!cache.has(key)){cache.set(key,entries.length);entries.push(label);}index.set(label,cache.get(key));
 }
 const atlas=busSignAtlas(entries);
 const signs=material('TimesSquareBusSigns','float kind=floor(uv.x);vec4 color=texture(image,vec2(fract(uv.x),uv.y));if(color.a<.1)discard;float light=kind>1.5?.76:kind>.5?.48:.34;m.emission=color.rgb*light;m.alpha=1.0;',{image:Material.DefaultImageId});signs.uniforms.image=atlas.canvas;
 addFaces(viewer,g.labels,signs,(f,u,v)=>{const i=index.get(f),kind=['destination','rear'].includes(f.kind)?2:['stop-icon','stop-routes','info'].includes(f.kind)?1:0;return [kind+(i%atlas.columns+.003+u*.994)/atlas.columns,(atlas.rows-1-Math.floor(i/atlas.columns)+.003+v*.994)/atlas.rows];});
 const light=material('TimesSquareBusHeadlightSpill','vec2 q=uv-.5;m.emission=vec3(.68,.70,.59);m.alpha=exp(-dot(q,q)*14.0)*.065;',{},true);
 addFaces(viewer,g.pools,light,(f,u,v)=>[u,v],true);
 return {stops:g.buses.length,cityBuses:g.buses.filter(b=>b.kind==='city').length,coaches:g.buses.filter(b=>b.kind==='coach').length,sightseeingBuses:g.buses.filter(b=>b.kind==='tour').length,stationary:true};
}
