import {Material} from 'cesium';
import {addBatches,addFaces} from './street-details.js';
import {architectureNightAppearance} from './architecture-lighting.js';
import {createEast42Geometry} from './east42-geometry.js';
import {EAST42} from './east42-config.js';
const CELLS=Object.fromEntries(['knick','sport','hilton','planet','bank','jewelry','gift','lobby','cafe','wines','market','shed','street'].map((k,i)=>[k,[0,i*128,1024,128]]));
Object.assign(CELLS,{volt:[0,1664,512,128],lime:[0,1792,512,256],blade:[512,1664,512,384],orange:[1024,0,1024,768],network:[1024,768,1024,1024],office:[1024,1792,1024,256]});
export function east42Atlas(){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=2048;const c=canvas.getContext('2d');
 for(const [kind,[x,y,w,h]]of Object.entries(CELLS)){
  c.save();c.translate(x,y);c.beginPath();c.rect(0,0,w,h);c.clip();c.textAlign='center';c.textBaseline='middle';
  const fill=color=>{c.fillStyle=color;c.fillRect(0,0,w,h);};
  const text=(s,yy,size,color='#e1dfcf',font='Arial',xx=w/2,max=w*.92)=>{c.fillStyle=color;c.font=`${size}px ${font}, sans-serif`;c.fillText(s,xx,yy,max);};
  fill('#101e23');
  if(kind==='knick'){fill('#172222');text('THE KNICKERBOCKER',h*.48,62,'#cbb77f','Georgia');text('NEW YORK',h*.86,17,'#9e9477');}
  if(kind==='sport'){fill('#17201b');text('PACE',h*.52,113,'#e4efb7','Arial');}
  if(kind==='volt'){fill('#272826');text('VOLT',h*.52,102,'#e3554d');}
  if(kind==='hilton'){text('Hilton Garden Inn',h*.50,72,'#e0e3d5','Georgia');}
  if(kind==='planet'){fill('#1b111d');c.shadowColor='#eb2545';c.shadowBlur=10;text('PLANET HOLLYWOOD',h*.5,75,'#f26b77');}
  if(kind==='bank'){fill('#56675f');text('BANK OF AMERICA TOWER',h*.49,53,'#d1d3c4');}
  if(kind==='jewelry'){fill('#32282f');text('AURELIA',h*.46,83,'#e6d3cc','Georgia');text('JEWELRY  •  NEW YORK',h*.86,18,'#b9ada4');}
  if(kind==='gift'){fill('#c2bc9d');text('NEW YORK GIFTS',h*.52,85,'#222f30');}
  if(kind==='lobby'){fill('#263a3e');text('151 WEST 42ND',h*.50,63,'#b3b9af');}
  if(kind==='cafe'){fill('#284039');text('PARKSIDE COFFEE',h*.50,73,'#d4ccac','Georgia');}
  if(kind==='wines'){text('BRYANT PARK WINES',h*.52,70,'#cfcebe','Georgia');}
  if(kind==='market'){fill('#292a28');text('42nd STREET MARKET',h*.53,73,'#dac9ac');}
  if(kind==='shed'){fill('#223d34');text('PEDESTRIAN WALKWAY OPEN',h*.47,54,'#d3d5be');text('42ND STREET',h*.86,21,'#a2b1a6');}
  if(kind==='street'){fill('#184538');text('W 42 ST  /  BRYANT PARK',h*.51,64,'#e2e6d5');}
  if(kind==='lime'){fill('#899835');text('PACE',h*.34,95,'#151d22');text('MAKE',h*.60,57,'#e2e5bc');text('YOUR MOVE.',h*.77,61,'#e2e5bc');}
  if(kind==='blade'){fill('#111c22');['P','A','C','E'].forEach((s,i)=>text(s,(i+.5)*h/4,82,'#e9e6d6'));}
  if(kind==='orange'){
   const g=c.createLinearGradient(0,0,w,h);g.addColorStop(0,'#a82d15');g.addColorStop(.55,'#e87535');g.addColorStop(1,'#a84520');c.fillStyle=g;c.fillRect(0,0,w,h);
   c.strokeStyle='#d39a63';c.lineWidth=2;for(let i=0;i<12;i++){c.beginPath();c.moveTo(i*w/10,0);c.lineTo(w/2,h*.80);c.stroke();}
   c.fillStyle='#2b2127';c.beginPath();c.moveTo(w*.17,h);c.lineTo(w*.29,h*.64);c.lineTo(w*.71,h*.64);c.lineTo(w*.83,h);c.fill();
   text('GOLDEN HOUR',h*.25,109,'#f0d2a4','Georgia');text('THE NIGHT IS YOURS.',h*.40,45,'#f1cea4');text('A NEW YORK STORY',h*.87,48,'#e8cbab');text('IN CINEMAS THIS FALL',h*.94,24,'#d6b99a');
  }
  if(kind==='network'){
   fill('#b52434');c.fillStyle='#111d25';c.fillRect(20,20,w-40,h-40);
   const g=c.createRadialGradient(w*.5,h*.35,5,w*.5,h*.35,w*.54);g.addColorStop(0,'#1c6771');g.addColorStop(.6,'#163c51');g.addColorStop(1,'#111d25');c.fillStyle=g;c.fillRect(29,29,w-58,h-58);
   c.strokeStyle='#67a3aa';c.lineWidth=2;
   for(let i=0;i<15;i++){c.beginPath();c.ellipse(w*.5,h*.34,60+i*27,45+i*17,-.6,0,Math.PI*2);c.stroke();}
   text('EVERY',h*.57,140,'#f0e4c7');text('CONNECTION.',h*.71,112,'#f0e4c7');text('A NEW POSSIBILITY.',h*.82,47,'#d3ddc9');text('VOLT',h*.94,105,'#ea5664');
  }
  if(kind==='office'){fill('#17292c');text('ONE BRYANT PARK',h*.45,84,'#c5caba');text('42ND STREET  •  AVENUE OF THE AMERICAS',h*.83,26,'#a2aea5');}
  c.restore();
 }
 return {canvas,cells:CELLS};
}
const mat=(type,body,uniforms={},translucent=false)=>new Material({fabric:{type,uniforms,source:`czm_material czm_getMaterial(czm_materialInput materialInput){vec2 uv=materialInput.st;czm_material m=czm_getDefaultMaterial(materialInput);m.diffuse=vec3(.003);${body}return m;}`},translucent});
export function addEast42(viewer,collision){
 const g=createEast42Geometry();collision.addStatic('east42-bryant-frontage',g.collision);
 addBatches(viewer,g.batches,false,false,architectureNightAppearance(g.night));addBatches(viewer,g.paving,true);addBatches(viewer,g.emissive);
 const brick=mat('East42KnickerbockerBrick',`float row=floor(uv.y/.12);vec2 b=vec2(uv.x/.29+mod(row,2.0)*.5,uv.y/.12);float mortar=max(step(.94,fract(b.x)),step(.89,fract(b.y)));float variation=fract(sin(dot(floor(b),vec2(31.1,47.3)))*12345.3);vec3 col=mix(vec3(.105,.046,.038),vec3(.163,.071,.048),variation);m.emission=mix(col,vec3(.072,.067,.063),mortar)*mix(1.0,.58,smoothstep(10.0,48.0,uv.y));m.alpha=1.0;`);
 addFaces(viewer,g.brick,brick,(f,u,v)=>[u*f.width,v*f.height]);
 const glass=mat('East42NightCurtainWall',`float row=floor(uv.y/3.4);float col=floor(uv.x/1.6);float pane=fract(sin(col*87.21+row*31.73)*8131.9);float reflection=step(.62,fract(uv.x*.056+uv.y*.013));vec3 color=mix(vec3(.025,.065,.078),vec3(.057,.104,.121),reflection);float on=step(.87,pane);color+=on*vec3(.035,.027,.016);float floorLine=step(.975,fract(uv.y/3.4));m.emission=color*(1.0-floorLine*.5)*mix(1.0,.61,smoothstep(12.0,70.0,uv.y));m.alpha=1.0;`);
 addFaces(viewer,g.glass,glass,(f,u,v)=>[u*f.width,v*f.height]);
 const windows=mat('East42RetailWindows',`float shade=floor(uv.x)/100.0;uv.x=fract(uv.x)/.98;m.emission=texture(image,uv).rgb*shade;m.alpha=1.0;`,{image:'/storefronts/retail-interiors-atlas.webp'});
 addFaces(viewer,g.windows,windows,(f,u,v)=>[Math.round(f.shade*100)+(f.cell+.008+u*.984)/3*.98,.008+v*.984]);
 const atlas=east42Atlas(),signs=mat('East42ExteriorSigns',`float shade=floor(uv.x)/100.0;uv.x=fract(uv.x)/.98;m.emission=texture(image,uv).rgb*shade;m.alpha=1.0;`,{image:Material.DefaultImageId});signs.uniforms.image=atlas.canvas;
 addFaces(viewer,g.labels,signs,(f,u,v)=>{const [x,y,w,h]=atlas.cells[f.kind];return [Math.round((f.shade??.68)*100)+(x+2+u*(w-4))/2048*.98,(2048-y-h+2+v*(h-4))/2048];});
 const poster=mat('East42CampaignPosters','m.emission=texture(image,uv).rgb*.62;m.alpha=1.0;',{image:'/billboards/portrait-atlas.webp'});addFaces(viewer,g.posters,poster,(f,u,v)=>[(f.ad%4+.004+u*.992)/4,(1-Math.floor(f.ad/4)+.004+v*.992)/2]);
 const net=mat('East42ScaffoldSafetyNet','vec2 grid=fract(uv*11.0);float thread=max(step(.84,grid.x),step(.84,grid.y));float seam=max(step(.984,fract(uv.x/3.2)),step(.978,fract(uv.y/2.1)));m.emission=mix(vec3(.025,.036,.033),vec3(.073,.081,.068),max(thread,seam));m.alpha=.22+thread*.23+seam*.15;',{},true);
 addFaces(viewer,g.netting,net,(f,u,v)=>[u*f.width,v*f.height],true);
 const glow=mat('East42ScaffoldDownlight','vec2 p=uv-.5;m.emission=vec3(.36,.31,.23);m.alpha=exp(-dot(p,p)*16.0)*.065;',{},true);addFaces(viewer,g.pools,glow,(f,u,v)=>[u,v],true);
 return {facades:g.facades.length,scaffolds:EAST42.scaffolds.length,nettedFacades:g.netting.length,scaffoldMeters:EAST42.scaffolds.reduce((n,s)=>n+s.length,0),silverBollards:g.bollards.length,streetProps:g.obstacles.length,places:EAST42.places.length};
}
