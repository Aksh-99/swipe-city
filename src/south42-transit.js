import {Material} from 'cesium';
import {addBatches,addFaces} from './street-details.js';
import {architectureNightAppearance} from './architecture-lighting.js';
import {createSouth42TransitGeometry} from './south42-transit-geometry.js';
const CELLS={subway:[0,0,2048,512],routes:[0,512,2048,192],entry:[0,704,2048,128],ribbon:[0,832,2048,192],shed:[0,1024,1024,192],notice:[1024,1024,512,640],info:[0,1216,1024,832],credit:[1536,1024,512,128]};
export function south42SignAtlas(){
 const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=2048;const c=canvas.getContext('2d');
 for(const [kind,[x,y,w,h]]of Object.entries(CELLS)){
  c.save();c.translate(x,y);c.beginPath();c.rect(0,0,w,h);c.clip();c.textAlign='center';c.textBaseline='middle';
  const fill=color=>{c.fillStyle=color;c.fillRect(0,0,w,h);};
  const text=(v,yy,size,color='#ece8d1',xx=w/2,max=w*.94,font='bold',family='Arial')=>{c.fillStyle=color;c.font=`${font} ${size}px ${family}, sans-serif`;c.fillText(v,xx,yy,max);};
  switch(kind){
   case 'subway':{
    // Original typography with a field of warm bulbs clipped to the letters.
    c.shadowColor='#d69230';c.shadowBlur=9;text('Subway',h*.51,448,'#a77d40',w/2,w*.94,'bold','Georgia');c.shadowBlur=0;
    c.globalCompositeOperation='source-atop';
    for(let yy=27;yy<h;yy+=15)for(let xx=16;xx<w;xx+=15){c.fillStyle='#684725';c.beginPath();c.arc(xx+2,yy+2,5.4,0,Math.PI*2);c.fill();c.fillStyle='#ffe4a0';c.beginPath();c.arc(xx,yy,4.2,0,Math.PI*2);c.fill();c.fillStyle='#fff1d0';c.beginPath();c.arc(xx-1,yy-1,1.5,0,Math.PI*2);c.fill();}
    c.globalCompositeOperation='source-over';break;
   }
   case 'routes':{
    const routes=[['N','#d4b33b'],['Q','#d4b33b'],['R','#d4b33b'],['W','#d4b33b'],['S','#718087'],['1','#c9424c'],['2','#c9424c'],['3','#c9424c'],['7','#a861a7']];
    routes.forEach(([v,color],i)=>{const xx=(i+.5)*w/routes.length,r=83;c.fillStyle='#b6b29a';c.beginPath();c.arc(xx,h/2,r+4,0,Math.PI*2);c.fill();c.fillStyle=color;c.beginPath();c.arc(xx,h/2,r,0,Math.PI*2);c.fill();text(v,h*.51,132,i<4?'#1c2c34':'#eeeede',xx,r*1.75);});break;
   }
   case 'entry':fill('#122128');text('Times Sq–42 St',h*.50,90,'#e7e8df',w*.38,w*.68,'normal');text('MTA',h*.52,71,'#c9d5df',w*.88,w*.17);break;
   case 'ribbon':fill('#112538');text('one times square',h*.50,130,'#dce8f0',w*.37,w*.66,'normal');text('NEW YORK',h*.51,68,'#a4cde6',w*.84,w*.25,'normal');break;
   case 'shed':fill('#173c35');c.strokeStyle='#819c88';c.lineWidth=5;c.strokeRect(10,10,w-20,h-20);text('SIDEWALK OPEN',h*.40,75);text('PLEASE USE COVERED WALKWAY',h*.77,32,'#b4c7bb');break;
   case 'notice':fill('#e0dfd0');c.fillStyle='#c8a941';c.fillRect(0,0,w,103);text('PEDESTRIAN',54,60,'#253a40');text('WALKWAY',184,66,'#263a42');text('OPEN',273,54,'#3d5753');text('↔',388,166,'#273f45');text('ONE TIMES SQUARE',554,33,'#435b5b');break;
   case 'info':{
    fill('#c8d3ce');c.fillStyle='#142c36';c.fillRect(0,0,w,163);text('Times Sq–42 St',61,88,'#e2e5d9',w/2,w*.92,'normal');text('SUBWAY',132,33,'#a7c0cb');
    c.strokeStyle='#9caeab';c.lineWidth=3;for(let xx=40;xx<w;xx+=77){c.beginPath();c.moveTo(xx,194);c.lineTo(xx,h-116);c.stroke();}for(let yy=220;yy<h-116;yy+=55){c.beginPath();c.moveTo(31,yy);c.lineTo(w-31,yy);c.stroke();}
    for(const [color,xx]of [['#427593',260],['#b9645b',500],['#b1973f',720]]){c.strokeStyle=color;c.lineWidth=17;c.beginPath();c.moveTo(xx-130,205);c.lineTo(xx,428);c.lineTo(xx,697);c.stroke();for(const yy of [335,429,562,670]){c.fillStyle='#e6e5d5';c.beginPath();c.arc(xx+(yy<428?(yy-428)*.60:0),yy,9,0,Math.PI*2);c.fill();}}
    text('STATION INFORMATION',h-47,48,'#2b4b56');break;
   }
   case 'credit':fill('#18252c');text('CITYSCREENS',h*.52,64,'#c5cece');break;
  }c.restore();
 }return {canvas,cells:CELLS};
}
const mat=(type,body,uniforms={},translucent=false)=>new Material({fabric:{type,uniforms,source:`czm_material czm_getMaterial(czm_materialInput materialInput){vec2 uv=materialInput.st;czm_material m=czm_getDefaultMaterial(materialInput);m.diffuse=vec3(.003);${body}return m;}`},translucent});
export function addSouth42Transit(viewer,collision){
 const g=createSouth42TransitGeometry();collision.addStatic('south42-subway-and-scaffolds',g.collision);
 addBatches(viewer,g.batches,false,false,architectureNightAppearance(g.night));addBatches(viewer,g.emissive);addBatches(viewer,g.paving,true);
 const glass=mat('South42RedFrameGlass',`float kind=floor(uv.x/256.0);uv.x=mod(uv.x,256.0);float pane=step(.14,fract(uv.x/2.0));float reflected=step(.65,fract(uv.x*.2+uv.y*.07));vec3 col=mix(vec3(.031,.057,.064),vec3(.080,.12,.115),reflected);float panels=step(.78,fract(uv.x*.37))*step(.5,uv.y)*step(uv.y,3.6);float ceiling=step(.9,fract(uv.x*.42))*step(4.05,uv.y);m.emission=col*(.65+.35*pane)+panels*vec3(.11,.098,.070)+ceiling*vec3(.12,.13,.095);m.alpha=1.0;`);
 addFaces(viewer,g.glass,glass,(f,u,v)=>[(f.kind||0)*256+u*f.width,v*f.height]);
 const poster=mat('South42TransitPosters','m.emission=texture(image,uv).rgb*.66;m.alpha=1.0;',{image:'/billboards/portrait-atlas.webp'});
 addFaces(viewer,g.posters,poster,(f,u,v)=>[(f.ad%4+.003+u*.994)/4,(1-Math.floor(f.ad/4)+.003+v*.994)/2]);
 const wide=mat('South42TransitWideAds','m.emission=texture(image,uv).rgb*.65;m.alpha=1.0;',{image:'/billboards/atlas.webp'});
 addFaces(viewer,g.wideAds,wide,(f,u,v)=>[(f.ad%2+.003+u*.994)/2,(1-Math.floor(f.ad/2)+.003+v*.994)/2]);
 const stripe=mat('OneTimesReferenceStripes',`vec2 p=uv*vec2(22.0,18.0);float stripe=step(.37,fract(p.x));float blue=step(.82,fract(p.x));float rings=1.0-smoothstep(.05,.09,abs(length(vec2((fract(p.x)-.25)*1.3,(fract(p.y)-.5)*1.0))-.11));m.emission=mix(vec3(.011,.024,.082),vec3(.46,.48,.38),stripe);m.emission=mix(m.emission,vec3(.024,.044,.36),blue);m.emission*=1.0-rings*.78;m.alpha=1.0;`);
 addFaces(viewer,g.stripeScreens,stripe,(f,u,v)=>[u,v]);
 const atlas=south42SignAtlas(),signs=mat('South42SubwaySigns',`float shade=floor(uv.x)/100.0;uv.x=fract(uv.x)/.98;vec4 texel=texture(image,uv);if(texel.a<.16)discard;m.emission=texel.rgb*shade;m.alpha=1.0;`,{image:Material.DefaultImageId});signs.uniforms.image=atlas.canvas;
 addFaces(viewer,g.labels,signs,(f,u,v)=>{const [x,y,w,h]=atlas.cells[f.kind];return [Math.round((f.shade??.73)*100)+((x+2+u*(w-4))/2048)*.98,(2048-y-h+2+v*(h-4))/2048];});
 const glow=mat('South42CanopyLight','vec2 p=uv-.5;m.emission=vec3(.47,.36,.20);m.alpha=exp(-dot(p,p)*17.0)*.085;',{},true);addFaces(viewer,g.pools,glow,(f,u,v)=>[u,v],true);
 return {portalFacades:g.portalFacades.length,scaffolds:g.scaffolds.length,scaffoldMeters:g.scaffolds.reduce((s,f)=>s+f.length,0),billboards:g.posters.length+g.wideAds.length+g.stripeScreens.length,silverBollards:g.bollards.length,subway:'7 Times Square exterior',atlasSize:[2048,2048]};
}
