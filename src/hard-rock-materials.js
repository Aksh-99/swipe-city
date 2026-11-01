import {Material} from 'cesium';
import {addBatches,addFaces} from './street-details.js';
import {architectureLightGLSL,architectureNightAppearance} from './architecture-lighting.js';

const kinds=['hard-rock','address','rock-shop','lobby','tour','tickets'];
function labels(){
 const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=768;const c=canvas.getContext('2d');
 const data=[['Hard Rock',6.75/1.28],['1501',2.08/1.02],['ROCK SHOP',10.6/.47],['1501 BROADWAY',12.7/.47],['TOUR',11.8/.86],['BROADWAY · TICKETS',16.7/.72]];
 data.forEach(([text,aspect],i)=>{
  const x=i%2*1024,y=Math.floor(i/2)*256;c.save();c.beginPath();c.rect(x,y,1024,256);c.clip();c.translate(x,y);c.scale(4/aspect,1);const w=256*aspect;c.textAlign='center';
  c.fillStyle=i===0?'#452f33':'#172326';c.fillRect(0,0,w,256);
  if(i===0){c.font='italic bold 180px Georgia';c.lineWidth=5;c.strokeStyle='#ffddb7';c.shadowColor='#f65919';c.shadowBlur=10;c.strokeText(text,w/2,182,w-28);c.fillStyle='#ee6d3e';c.fillText(text,w/2,182,w-28);}
  else if(i===1){c.font='83px Georgia';c.fillStyle='#e2d3af';c.fillText(text,w/2,110,w-20);c.font='38px Georgia';c.fillText('BROADWAY',w/2,177,w-22);}
  else{c.font=i===4?'180px Georgia':'bold 142px Arial';c.fillStyle=i===2?'#e9e4d4':'#e6d2a9';c.fillText(text,w/2,181,w-75);}
  c.restore();
 });return canvas;
}
function guitar(){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=2048;const c=canvas.getContext('2d');
 const bg=c.createLinearGradient(0,0,512,0);bg.addColorStop(0,'#5a4134');bg.addColorStop(.14,'#191b1b');bg.addColorStop(.85,'#191b1b');bg.addColorStop(1,'#73523b');c.fillStyle=bg;c.fillRect(0,0,512,2048);
 c.strokeStyle='#cd9b62';c.lineWidth=7;c.beginPath();c.roundRect(15,20,482,2004,75);c.stroke();c.strokeStyle='#a63823';c.lineWidth=4;c.beginPath();c.roundRect(28,35,456,1976,65);c.stroke();
 // Sunburst Les Paul silhouette with neck, bridge, pickups, frets and strings.
 const body=new Path2D('M251 1028 C209 1040 157 1074 169 1150 C184 1220 123 1252 102 1334 C76 1445 117 1612 252 1640 C391 1621 430 1485 405 1380 C393 1297 325 1247 333 1198 C339 1156 392 1136 382 1099 C369 1058 322 1059 299 1104 L293 1030 Z');
 const sun=c.createRadialGradient(255,1350,25,255,1350,310);sun.addColorStop(0,'#edbb54');sun.addColorStop(.46,'#de7939');sun.addColorStop(.79,'#983624');sun.addColorStop(1,'#522b26');c.fillStyle=sun;c.fill(body);c.strokeStyle='#e4b379';c.lineWidth=9;c.stroke(body);
 c.fillStyle='#633e2b';c.fillRect(226,289,59,931);c.strokeStyle='#e0ba75';c.lineWidth=5;c.strokeRect(226,289,59,931);
 c.fillStyle='#52362b';c.beginPath();c.moveTo(226,330);c.lineTo(208,184);c.quadraticCurveTo(250,134,291,184);c.lineTo(285,330);c.closePath();c.fill();c.stroke();
 for(let y=369;y<1198;y+=52){c.strokeStyle='#c5b6a2';c.lineWidth=3;c.beginPath();c.moveTo(226,y);c.lineTo(285,y);c.stroke();if(Math.round((y-369)/52)%2===0){c.fillStyle='#e5d6b7';c.fillRect(246,y+20,21,11);}}
 for(const y of [1195,1306]){c.fillStyle='#e3c797';c.fillRect(203,y,112,48);c.strokeStyle='#5d5649';c.lineWidth=3;c.strokeRect(203,y,112,48);for(let x=217;x<305;x+=15){c.fillStyle='#7f7770';c.beginPath();c.arc(x,y+13,3,0,Math.PI*2);c.fill();}}
 c.fillStyle='#c3b18d';c.fillRect(199,1420,123,25);c.fillRect(201,1471,119,31);
 for(let i=0;i<6;i++){c.strokeStyle=i%2?'#e6d1a0':'#ada99c';c.lineWidth=1.8;c.beginPath();c.moveTo(237+i*7.1,222);c.lineTo(219+i*13,1498);c.stroke();}
 for(let i=0;i<3;i++)for(const side of [-1,1]){c.fillStyle='#b5b0a0';c.beginPath();c.ellipse(255+side*58,210+i*36,17,9,0,0,Math.PI*2);c.fill();}
 for(const [x,y] of [[335,1425],[361,1480],[319,1485],[344,1538]]){c.fillStyle='#c09b43';c.beginPath();c.arc(x,y,13,0,Math.PI*2);c.fill();}
 c.font='italic 29px Georgia';c.textAlign='center';c.fillStyle='#d6b58e';c.fillText('NEW YORK',256,1935);
 return canvas;
}
function marquee(){
 const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=256;const c=canvas.getContext('2d');
 const g=c.createLinearGradient(0,0,2048,256);g.addColorStop(0,'#a73125');g.addColorStop(.22,'#ed873c');g.addColorStop(.50,'#631e27');g.addColorStop(.82,'#a4432c');g.addColorStop(1,'#dd8036');c.fillStyle=g;c.fillRect(0,0,2048,256);
 for(let i=0;i<60;i++){const x=i*37;c.fillStyle=i%3?'#efae7028':'#f2d2a630';c.fillRect(x,160-Math.sin(i*1.7)*60,12,130);}
 c.textAlign='center';c.fillStyle='#fff6da';c.font='bold 117px Arial';c.fillText('LIVE LOUD · NEW YORK',1024,132,1850);c.font='43px Arial';c.fillText('LEGENDARY BURGERS   /   MUSIC   /   ROCK SHOP',1024,207,1700);
 return canvas;
}
function picture(type,image,brightness=1){return new Material({fabric:{type,uniforms:{image},source:`czm_material czm_getMaterial(czm_materialInput materialInput){czm_material m=czm_getDefaultMaterial(materialInput);m.diffuse=vec3(.008);m.emission=texture(image,materialInput.st).rgb*${brightness.toFixed(2)};m.alpha=1.0;return m;}`}});}
function mask(type,image,color){return new Material({fabric:{type,uniforms:{image},source:`czm_material czm_getMaterial(czm_materialInput materialInput){vec4 tex=texture(image,materialInput.st);if(tex.a<.3)discard;czm_material m=czm_getDefaultMaterial(materialInput);m.diffuse=vec3(.01);m.emission=vec3(${color});m.alpha=1.0;return m;}`}});}

export function addHardRockMaterials(viewer,geometry){
 if(!geometry)return;
 addBatches(viewer,geometry.batches,false,false,architectureNightAppearance(geometry.night));
 addBatches(viewer,geometry.emissive);
 const portalFace=geometry.portal[0],vector=v=>`vec3(${v.toArray().map(x=>x.toFixed(5)).join(',')})`;
 const portalMaterial=new Material({fabric:{type:'ParamountCarvedPortal',uniforms:{image:'/storefronts/paramount-portal.webp'},source:`
  ${architectureLightGLSL(geometry.night)}
  czm_material czm_getMaterial(czm_materialInput materialInput){
   vec2 uv=materialInput.st;vec3 p=${vector(portalFace.center)}+${vector(portalFace.right)}*(uv.x-.5)*${portalFace.width.toFixed(3)}+vec3(0.0,0.0,(uv.y-.5)*${portalFace.height.toFixed(3)});
   czm_material m=czm_getDefaultMaterial(materialInput);m.diffuse=vec3(.002);
   m.emission=architectureNightLight(texture(image,uv).rgb,p,${vector(portalFace.normal)});m.alpha=1.0;return m;
  }`}});
 addFaces(viewer,geometry.portal,portalMaterial,(f,u,v)=>[u,v]);
 addFaces(viewer,geometry.labels.filter(f=>f.kind==='paramount'),mask('ParamountScript','/storefronts/paramount-script.svg','.015,.023,.029'),(f,u,v)=>[u,v]);
 addFaces(viewer,geometry.labels.filter(f=>f.kind!=='paramount'),picture('ParamountStoreLabels',labels(),.95),(f,u,v)=>{const i=kinds.indexOf(f.kind);return [(i%2+.002+u*.996)/2,(2-Math.floor(i/2)+.004+v*.992)/3];});
 const windowMaterial=new Material({fabric:{type:'ParamountWindowGlass',source:`czm_material czm_getMaterial(czm_materialInput materialInput){
  czm_material m=czm_getDefaultMaterial(materialInput);float height=materialInput.st.y;
  vec2 uv=vec2(fract(materialInput.st.x)/.99,fract(height/4.18));float variant=floor(materialInput.st.x);
  float reflection=smoothstep(.64,.82,fract(uv.x*2.5+uv.y*.55+variant*.3));
  vec3 cool=mix(vec3(.019,.034,.052),vec3(.052,.078,.103),reflection*.65);
  cool*=mix(1.0,.67,smoothstep(9.0,49.0,height));
  float occupied=step(3.5,variant)*smoothstep(.30,.39,uv.y)*(1.0-smoothstep(.78,.84,uv.y));
  m.diffuse=vec3(.002);m.emission=mix(cool,vec3(.16,.115,.057),occupied);m.alpha=1.0;return m;
 }`}});
 addFaces(viewer,geometry.glass,windowMaterial,(f,u,v)=>[f.variant+u*.99,f.center.z+(v-.5)*f.height]);
 const interiors=picture('HardRockRetailInteriors','/storefronts/hard-rock-interiors.webp',.76);
 addFaces(viewer,geometry.windows,interiors,(f,u,v)=>{const column=f.kind==='restaurant'?0:f.kind==='taco'?2:1,crop=f.kind==='restaurant'?.45:.65,left=(1-crop)/2;return [(column+.005+(left+u*crop)*.990)/3,.006+v*.988];});
 addFaces(viewer,geometry.guitars,picture('HardRockGuitar',guitar(),.98),(f,u,v)=>[u,v]);
 addFaces(viewer,geometry.marquee,picture('HardRockCurvedMarquee',marquee(),1.0),(f,u,v)=>[f.u0+u*(f.u1-f.u0),v]);
 for(const kind of ['white','color'])addFaces(viewer,geometry.logos.filter(f=>f.kind===kind),mask('HardRockLogo'+kind,'/storefronts/hard-rock-logo.webp',kind==='white'?'.96,.93,.83':'1.0,.40,.14'),(f,u,v)=>[u,v]);
 // The original Taco Bell mark is a horizontal black-on-white asset. Keep
 // those exact letterforms for the fascia, and its bell icon on the blades.
 const tacoWord=new Material({fabric:{type:'TacoBellFascia',uniforms:{image:'/storefronts/taco-bell-logo.webp'},source:`czm_material czm_getMaterial(czm_materialInput materialInput){vec3 tex=texture(image,materialInput.st).rgb;float ink=1.0-min(tex.r,min(tex.g,tex.b));czm_material m=czm_getDefaultMaterial(materialInput);m.diffuse=vec3(.01);m.emission=mix(vec3(.08,.04,.15),vec3(.83,.79,1.0),ink);m.alpha=1.0;return m;}`}});
 addFaces(viewer,geometry.taco.filter(f=>f.kind==='wordmark'),tacoWord,(f,u,v)=>[u,v]);
 for(const kind of ['blade','banner']){
  const faces=geometry.taco.filter(f=>f.kind===kind),aspect=faces[0].width/faces[0].height;
  const blade=new Material({fabric:{type:'TacoBell'+kind,uniforms:{image:'/storefronts/taco-bell-logo.webp',aspect},source:`
   float markInk(vec2 uv){vec3 tex=texture(image,uv).rgb;return 1.0-min(tex.r,min(tex.g,tex.b));}
   czm_material czm_getMaterial(czm_materialInput materialInput){
    vec2 uv=materialInput.st;float waves=.5+.5*sin(uv.y*30.0+sin(uv.x*8.0)*2.0);vec3 base=mix(vec3(.16,.015,.43),vec3(.48,.055,.67),waves);
    float iconH=aspect/1.08,textH=aspect/3.22,ink=0.0,y=(uv.y-.55)/iconH;
    if(y>=0.0&&y<=1.0)ink=markInk(vec2(.133*uv.x,y));
    y=(uv.y-.40)/textH;if(y>=0.0&&y<=1.0)ink=markInk(vec2(.154+uv.x*.378,y));
    y=(uv.y-.25)/textH;if(y>=0.0&&y<=1.0)ink=markInk(vec2(.544+uv.x*.450,y));
    czm_material m=czm_getDefaultMaterial(materialInput);m.diffuse=vec3(.01);m.emission=mix(base,vec3(.96,.95,1.0),ink);m.alpha=1.0;return m;
   }`}});
  addFaces(viewer,faces,blade,(f,u,v)=>[u,v]);
 }
 // Fictional advertising reuses the existing licensed/authored atlas, while
 // the neighboring building's real glazing and tower shape stay intact.
 for(const atlas of ['portrait','landscape']){
  const columns=atlas==='portrait'?4:2,faces=geometry.ads.filter(f=>(f.atlas||'portrait')===atlas);
  addFaces(viewer,faces,picture('ParamountNeighborAd'+atlas,atlas==='portrait'?'/billboards/portrait-atlas.webp':'/billboards/atlas.webp',.95),(f,u,v)=>[(f.art%columns+.004+u*.992)/columns,(1-Math.floor(f.art/columns)+.004+v*.992)/2]);
 }
}
