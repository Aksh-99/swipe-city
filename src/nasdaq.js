import{Material}from'./canvas-material.js';

import {addBatches,addFaces} from './street-details.js';
import {architectureNightAppearance} from './architecture-lighting.js';
import {createNasdaqGeometry} from './nasdaq-geometry.js';
import {NASDAQ,NASDAQ_WINDOWS} from './nasdaq-config.js';

function canvas(width,height){const image=document.createElement('canvas');image.width=width;image.height=height;return [image,image.getContext('2d')];}
// Authored vector lettering/ribbon; supplied photographs are design references
// only. No Street View pixels or remote image dependency are used by the site.
function logo(c,x,y,h){
 c.save();c.font=`400 ${h}px Arial, Helvetica, sans-serif`;
 const word=c.measureText('Nasdaq').width,total=word+h*1.14,left=x-total/2;
 c.translate(left,y-h*.5);c.fillStyle='#21bce8';
 c.beginPath();[[0,.89],[.30,.03],[.59,.03],[.29,.89]].forEach(([a,b],i)=>i?c.lineTo(a*h,b*h):c.moveTo(a*h,b*h));c.closePath();c.fill();
 c.fillStyle='#078abc';c.beginPath();[[.29,.89],[.59,.03],[.79,.14],[.49,1.0]].forEach(([a,b],i)=>i?c.lineTo(a*h,b*h):c.moveTo(a*h,b*h));c.closePath();c.fill();
 c.fillStyle='#20b7e4';c.beginPath();[[.49,1],[.79,.14],[1.08,.14],[.78,1]].forEach(([a,b],i)=>i?c.lineTo(a*h,b*h):c.moveTo(a*h,b*h));c.closePath();c.fill();
 c.fillStyle='#f1f6fc';c.textAlign='left';c.fillText('Nasdaq',h*1.14,h*.79);c.restore();
}
function towerArt(){
 const [image,c]=canvas(1536,3072),w=NASDAQ.length,h=NASDAQ.screenTop-NASDAQ.screenBottom;c.scale(image.width/w,image.height/h);
 const bg=c.createLinearGradient(0,0,w,h);bg.addColorStop(0,'#063b81');bg.addColorStop(.42,'#062754');bg.addColorStop(1,'#08152c');c.fillStyle=bg;c.fillRect(0,0,w,h);
 const ribbon=c.createLinearGradient(0,0,w,h*.67);ribbon.addColorStop(0,'#05a6dd');ribbon.addColorStop(.5,'#0754a5');ribbon.addColorStop(1,'#073365');
 c.fillStyle=ribbon;c.beginPath();c.moveTo(-5,22);c.lineTo(7,-3);c.lineTo(16,-3);c.lineTo(4,22);c.closePath();c.fill();
 c.fillStyle='#0d437c';c.beginPath();c.moveTo(6,19);c.lineTo(16,-3);c.lineTo(23,-3);c.lineTo(13,19);c.closePath();c.fill();
 c.strokeStyle='#1bb4e133';c.lineWidth=.045;for(let i=0;i<12;i++){c.beginPath();c.moveTo(-4+i*.65,22);c.lineTo(8+i*.65,-3);c.stroke();}
 // Branding below the window grid remains readable from street level.
 logo(c,w/2,h-6.15,2.03);c.textAlign='center';c.fillStyle='#dbeefb';c.font='.77px Arial';c.fillText('REWRITE TOMORROW',w/2,h-3.94,w-1.8);
 c.fillStyle='#63a5c9';c.font='.35px Arial';c.fillText('TIMES SQUARE  /  NEW YORK',w/2,h-1.72,w-2.4);
 return image;
}
function fasciaArt(){
 const [image,c]=canvas(2048,512),w=NASDAQ.length,h=NASDAQ.fasciaTop-NASDAQ.fasciaBottom;c.scale(image.width/w,image.height/h);
 const bg=c.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#0a1019');bg.addColorStop(.6,'#080c13');bg.addColorStop(1,'#101826');c.fillStyle=bg;c.fillRect(0,0,w,h);logo(c,w/2,h*.54,2.32);
 return image;
}
function labelAtlas(labels){
 const rows=Math.ceil(labels.length/4),[image,c]=canvas(2048,rows*256);
 labels.forEach((f,i)=>{const x=i%4*512,y=Math.floor(i/4)*256,w=f.width/f.height;
  c.save();c.beginPath();c.rect(x,y,512,256);c.clip();c.translate(x,y);c.scale(512/w,256);
  const bg=c.createLinearGradient(0,0,w,1);bg.addColorStop(0,f.kind==='entry'?'#162431':'#003481');bg.addColorStop(1,'#061c3c');c.fillStyle=bg;c.fillRect(0,0,w,1);
  if(f.kind==='entry'){c.fillStyle='#b5c9d5';c.textAlign='center';c.font='.49px Arial';c.fillText('4 TIMES SQUARE',w/2,.67,w-.4);}
  else{logo(c,w/2,.42,.51);c.textAlign='center';c.fillStyle='#93cfe8';c.font='.13px Arial';c.fillText('MARKETSITE  ·  NEW YORK',w/2,.83,w-.3);}
  c.restore();
 });return {image,rows};
}
function picture(type,image,brightness=1){return new Material({fabric:{type,uniforms:{image},source:`czm_material czm_getMaterial(czm_materialInput materialInput){czm_material m=czm_getDefaultMaterial(materialInput);m.diffuse=vec3(.002);m.emission=texture(image,materialInput.st).rgb*${brightness.toFixed(3)};m.alpha=1.0;return m;}`}});}
function studioGlass(type,studio){return new Material({fabric:{type,source:`
 czm_material czm_getMaterial(czm_materialInput materialInput){
  vec2 p=materialInput.st;
  float diagonal=smoothstep(.60,.89,fract(p.x*.17+p.y*.056));
  float thin=1.0-smoothstep(.0,.15,abs(fract(p.x*.12+p.y*.021)-.38));
  vec3 color=vec3(.018,.035,.048)+diagonal*vec3(.026,.040,.052)+thin*vec3(.017,.036,.053);
  color+=vec3(.024,.008,.031)*smoothstep(.72,.90,fract(p.x*.31-p.y*.024));
  ${studio?`float floorY=mod(p.y,3.74);
   float ceiling=step(3.18,floorY)*(1.0-step(3.27,floorY))*step(.22,fract(p.x*.32));
   float desk=step(.96,floorY)*(1.0-step(1.18,floorY))*step(.36,fract(p.x*.36));
   color+=ceiling*vec3(.16,.18,.17);color=mix(color,vec3(.032,.045,.050),desk*.76);
   color*=.83+.17*smoothstep(.6,2.7,floorY);`:`color*=.75+.25*(1.0-smoothstep(12.0,39.0,p.y));`}
  czm_material m=czm_getDefaultMaterial(materialInput);m.diffuse=vec3(.002);m.emission=color;m.alpha=1.0;return m;
 }`}});}

export function addNasdaq(viewer,collision){
 const g=createNasdaqGeometry();
 addBatches(viewer,g.batches,false,false,architectureNightAppearance(g.night));
 addBatches(viewer,g.emissive);collision.addStatic('nasdaq-marketsite',g.collision);
 const tower=new Material({fabric:{type:'NasdaqWrappedTower',uniforms:{image:towerArt()},source:`
 czm_material czm_getMaterial(czm_materialInput materialInput){
  vec2 uv=materialInput.st;float s=uv.x*${NASDAQ.length.toFixed(7)},z=${NASDAQ.screenBottom.toFixed(3)}+uv.y*${(NASDAQ.screenTop-NASDAQ.screenBottom).toFixed(3)};
  for(int row=0;row<5;row++){
   float dx=abs(mod(s-mod(float(row),2.0)*.24,${(NASDAQ.length/6).toFixed(7)})-${(NASDAQ.length/12).toFixed(7)});
   if(dx<.605&&abs(z-(23.5+float(row)*4.5))<.665)discard;
  }
  float scan=1.0-.035*(.5+.5*sin(uv.y*5500.0))/(1.0+fwidth(uv.y)*5500.0);
  czm_material m=czm_getDefaultMaterial(materialInput);m.diffuse=vec3(.001);m.emission=texture(image,uv).rgb*scan*.97;m.alpha=1.0;return m;
 }`}});
 addFaces(viewer,g.screens,tower,(f,u,v)=>[(f.s0+u*(f.s1-f.s0))/NASDAQ.length,v]);
 addFaces(viewer,g.fascia,picture('NasdaqBlackFascia',fasciaArt(),.92),(f,u,v)=>[(f.s0+u*(f.s1-f.s0))/NASDAQ.length,v]);
 addFaces(viewer,g.glass.filter(f=>f.kind==='studio'),studioGlass('NasdaqStudioGlass',true),(f,u,v)=>[f.s0+u*(f.s1-f.s0),f.bottom+v*(f.top-f.bottom)]);
 addFaces(viewer,g.glass.filter(f=>f.kind==='curtain'),studioGlass('NasdaqBroadwayCurtainGlass',false),(f,u,v)=>[u*f.width,f.center.z+(v-.5)*f.height]);
 const windows=new Material({fabric:{type:'NasdaqRecessedWindowGlass',source:`
 czm_material czm_getMaterial(czm_materialInput materialInput){
  vec2 uv=vec2(fract(materialInput.st.x)/.99,materialInput.st.y);float variant=floor(materialInput.st.x);
  float reflection=smoothstep(.54,.77,fract(uv.x*.91+uv.y*.28+variant*.24));
  vec3 color=mix(vec3(.016,.029,.041),vec3(.073,.11,.14),reflection*.73);
  float blind=step(.94,fract(uv.y*19.0));color*=1.0-blind*.20;
  float occupied=step(.89,fract(sin(variant*19.41)*138.4));color=mix(color,vec3(.12,.115,.087),occupied*.57);
  czm_material m=czm_getDefaultMaterial(materialInput);m.diffuse=vec3(.002);m.emission=color;m.alpha=1.0;return m;
 }`}});
 addFaces(viewer,[...g.windows,...g.glass.filter(f=>['office','door'].includes(f.kind))],windows,(f,u,v)=>{
  const index=f.variant||0,w=f.kind==='tower'?NASDAQ_WINDOWS[index]:null;
  return [index+(w?(f.s0+u*(f.s1-f.s0)-(w.s-w.width/2))/w.width:u)*.99,v];
 });
 const atlas=labelAtlas(g.labels),indices=new Map(g.labels.map((f,i)=>[f,i]));
 addFaces(viewer,g.labels,picture('NasdaqStudioLabels',atlas.image,.84),(f,u,v)=>{const i=indices.get(f);return [(i%4+.004+u*.992)/4,(atlas.rows-1-Math.floor(i/4)+.005+v*.990)/atlas.rows];});
 addFaces(viewer,g.ads,picture('NasdaqNeighborAds','/billboards/atlas.webp',.88),(f,u,v)=>{
  const ratio=f.width/f.height,cropU=Math.min(1,ratio/1.5),cropV=Math.min(1,1.5/ratio);
  return [(f.art%2+.004+((1-cropU)/2+u*cropU)*.992)/2,(1-Math.floor(f.art/2)+.004+((1-cropV)/2+v*cropV)*.992)/2];
 });
 const pool=new Material({fabric:{type:'NasdaqScaffoldPools',source:`czm_material czm_getMaterial(czm_materialInput materialInput){vec2 p=materialInput.st-.5;czm_material m=czm_getDefaultMaterial(materialInput);m.diffuse=vec3(.01);m.emission=vec3(.59,.75,.80);m.alpha=exp(-dot(p,p)*15.0)*.065;return m;}`},translucent:true});
 addFaces(viewer,g.pools,pool,(f,u,v)=>[u,v],true);
 const lightFaces=g.screens.map(f=>({...f,lightGroup:'nasdaq-screen',lightColor:[.18,.49,1]}));
 return {name:NASDAQ.name,sourceFittedPanels:NASDAQ.wrap.length,screenWindows:NASDAQ_WINDOWS.length,silverBollards:g.posts.length,scaffoldMeters:Math.round(g.coveredMeters),neighborAds:g.ads.length,screenTop:NASDAQ.screenTop,lightFaces};
}
