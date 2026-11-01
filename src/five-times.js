import {Material} from 'cesium';
import {addBatches,addFaces} from './street-details.js';
import {architectureNightAppearance} from './architecture-lighting.js';
import {createFiveTimesGeometry} from './five-times-geometry.js';
const CELLS={tower:[0,0,1024,1536],campaign:[1024,0,1024,768],window:[1024,768,1024,768],logo:[0,1536,1024,160],shed:[0,1696,1024,160],barrier:[0,1856,1024,192],blade:[1536,1536,192,512],entry:[1024,1536,512,160]};
export function fiveTimesAtlas(){
 const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=2048;const c=canvas.getContext('2d');
 let seed=1842;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(const [kind,[x,y,w,h]]of Object.entries(CELLS)){
  c.save();c.translate(x,y);c.beginPath();c.rect(0,0,w,h);c.clip();c.textAlign='center';c.textBaseline='middle';
  const fill=color=>{c.fillStyle=color;c.fillRect(0,0,w,h);};
  const text=(s,yy,size,color='#e6e9e7',xx=w/2,max=w*.91,font='bold')=>{c.fillStyle=color;c.font=`${font} ${size}px Arial, sans-serif`;c.fillText(s,xx,yy,max);};
  if(kind==='tower'){
   fill('#061b8b');
   // Original, deterministic advertising art: a collage of printed paper
   // bundles. It echoes the blue/white reference without reusing its pixels.
   for(let i=0;i<125;i++){
    const px=30+random()*(w-60),py=-70+random()*(h-95),scale=.55+random()*.9;
    c.save();c.translate(px,py);c.rotate((random()-.5)*1.4);c.scale(scale,scale);c.shadowColor='#010825';c.shadowBlur=14;c.shadowOffsetY=15;
    c.fillStyle='#c2c4ce';c.fillRect(-125,-51,250,105);c.shadowBlur=0;c.shadowOffsetY=0;
    for(let k=0;k<7;k++){c.fillStyle=k%2?'#51586a':'#a3a9b7';c.fillRect(-125,44+k*2,250,2);}
    const paper=c.createLinearGradient(-125,-51,125,45);paper.addColorStop(0,'#f2f2eb');paper.addColorStop(.5,'#bcc4d4');paper.addColorStop(1,'#e8e9e4');c.fillStyle=paper;c.fillRect(-125,-58,250,101);
    c.strokeStyle='#434a63';c.lineWidth=3;c.strokeRect(-117,-50,234,85);c.lineWidth=1;c.strokeRect(-111,-44,222,73);
    c.fillStyle='#626b80';c.beginPath();c.ellipse(0,-7,34,32,0,0,Math.PI*2);c.fill();c.fillStyle='#d7dce0';c.beginPath();c.ellipse(1,-8,23,26,0,0,Math.PI*2);c.fill();
    for(const side of [-1,1]){c.fillStyle='#4b5670';c.font='bold 26px Georgia, serif';c.fillText('NY',side*83,-6,48);for(let line=0;line<4;line++)c.fillRect(side*65-17,-33+line*8,34,2);}
    c.fillStyle='#8b93a7';c.fillRect(-12,-57,24,101);c.fillStyle='#d8dce5';c.fillRect(-7,-57,14,101);c.restore();
   }
   c.fillStyle='#071b8b';c.fillRect(0,h-150,w,150);text('CITYWIDE',h-84,76);text('MORE TO DISCOVER',h-30,23,'#a4b9f1');
  }else if(kind==='campaign'){
   fill('#0a1c86');text('A whole city',h*.20,92);text('of possibilities.',h*.355,99,'#f0764c');text('Find your next',h*.53,87);text('great discovery.',h*.665,89);text('CITYWIDE',h*.89,66,'#e4eaf7');
  }else if(kind==='window'){
   fill('#142329');const wash=c.createLinearGradient(0,0,w,0);wash.addColorStop(0,'#263237');wash.addColorStop(.46,'#752e34');wash.addColorStop(.55,'#963238');wash.addColorStop(1,'#1c2b30');c.fillStyle=wash;c.fillRect(0,0,w,h);
   c.fillStyle='#baa796';c.fillRect(18,42,w-36,19);c.fillStyle='#b93940';c.fillRect(w*.44,80,w*.20,h-95);text('MINISO',158,71,'#f2d8d0',w*.54,w*.20);
   for(const x0 of [32,w*.69])for(let shelf=0;shelf<4;shelf++){
    const yy=228+shelf*114;c.fillStyle='#879695';c.fillRect(x0-8,yy+57,w*.28,7);c.fillStyle='#c4bfa7';c.fillRect(x0,yy+62,w*.26,4);
    for(let i=0;i<7;i++){const xx=x0+i*36,colors=['#bcaca7','#c6bf94','#94a6a9','#bb7b83','#a0a4bb'];c.fillStyle=colors[(i+shelf)%colors.length];c.fillRect(xx,yy+5,23,46);c.fillStyle='#dee0cc';c.fillRect(xx+3,yy+13,17,10);}
   }
   for(let i=0;i<7;i++){const xx=64+i*138,yy=h-110;c.fillStyle=['#b1a5aa','#b69b79','#9eb1b3'][i%3];c.beginPath();c.arc(xx,yy,31,0,Math.PI*2);c.arc(xx-22,yy-25,12,0,Math.PI*2);c.arc(xx+22,yy-25,12,0,Math.PI*2);c.fill();c.fillStyle='#333940';for(const s of [-1,1]){c.beginPath();c.arc(xx+s*9,yy-3,3,0,Math.PI*2);c.fill();}}
   c.fillStyle='rgba(79,134,149,.11)';c.beginPath();c.moveTo(0,0);c.lineTo(w*.27,0);c.lineTo(w*.82,h);c.lineTo(w*.61,h);c.fill();
  }else if(kind==='logo'){fill('#a22939');text('MINISO',h*.50,112,'#f4e2df');
  }else if(kind==='blade'){fill('#22313c');[...'MINISO'].forEach((s,i)=>text(s,(i+.5)*h/6,73,'#d7d7c8'));
  }else if(kind==='entry'){fill('#213133');text('5 TIMES SQUARE',h*.50,67,'#c8d2c9');
  }else if(kind==='shed'){fill('#263f35');text('SIDEWALK OPEN',h*.42,58,'#dee0c9');text('42nd STREET  ·  SEVENTH AVENUE',h*.80,26,'#adb9ab');
  }else{fill('#c0c6bc');text('TIMES SQUARE',h*.50,94,'#283f48');}
  c.restore();
 }
 return {canvas,cells:CELLS};
}
const mat=(type,body,uniforms={},translucent=false)=>new Material({fabric:{type,uniforms,source:`czm_material czm_getMaterial(czm_materialInput materialInput){vec2 uv=materialInput.st;czm_material m=czm_getDefaultMaterial(materialInput);m.diffuse=vec3(.003);${body}return m;}`},translucent});
export function addFiveTimes(viewer,collision){
 const g=createFiveTimesGeometry();collision.addStatic('five-times-corner',g.collision);
 addBatches(viewer,g.batches,false,false,architectureNightAppearance(g.night));addBatches(viewer,g.paving,true);addBatches(viewer,g.emissive);
 const glass=mat('FiveTimesTowerGlass',`float band=step(.92,fract(uv.y/3.5));float mullion=step(.965,fract(uv.x/1.43));float reflection=step(.72,fract(uv.x*.119+uv.y*.047));float lit=step(.955,fract(sin(floor(uv.x/1.43)*77.1+floor(uv.y/3.5)*21.8)*7182.1));vec3 col=mix(vec3(.040,.066,.086),vec3(.076,.112,.133),reflection);m.emission=col*(1.0-max(band,mullion)*.6)+lit*vec3(.042,.028,.016);m.alpha=1.0;`);
 addFaces(viewer,g.glass,glass,(f,u,v)=>[u*f.width,v*f.height]);
 const interiors=mat('FiveTimesNeighborWindows','m.emission=texture(image,uv).rgb*.42;m.alpha=1.0;',{image:'/storefronts/retail-interiors-atlas.webp'});addFaces(viewer,g.interiors,interiors,(f,u,v)=>[(f.cell+.008+u*.984)/3,.006+v*.988]);
 const mesh=mat('FiveTimesScaffoldMesh','vec2 q=vec2(uv.x+uv.y,uv.x-uv.y)*8.0;float wire=max(step(.91,fract(q.x)),step(.91,fract(q.y)));if(wire<.5)discard;m.emission=vec3(.12,.18,.14);m.alpha=.75;',{},true);addFaces(viewer,g.meshPanels,mesh,(f,u,v)=>[u*f.width,v*f.height],true);
 const atlas=fiveTimesAtlas(),signs=mat('FiveTimesReferenceSigns',`float shade=floor(uv.x)/100.0;uv.x=fract(uv.x)/.98;vec4 texel=texture(image,uv);if(texel.a<.18)discard;m.emission=texel.rgb*shade;m.alpha=1.0;`,{image:Material.DefaultImageId});signs.uniforms.image=atlas.canvas;
 addFaces(viewer,g.labels,signs,(f,u,v)=>{const [x,y,w,h]=atlas.cells[f.kind],uu=f.uvRange?f.uvRange[0]+u*(f.uvRange[1]-f.uvRange[0]):u;return [Math.round((f.shade??.68)*100)+((x+2+uu*(w-4))/2048)*.98,(2048-y-h+2+v*(h-4))/2048];});
 const poster=mat('FiveTimesNeighborPosters','m.emission=texture(image,uv).rgb*.63;m.alpha=1.0;',{image:'/billboards/portrait-atlas.webp'});addFaces(viewer,g.posters,poster,(f,u,v)=>[(f.ad%4+.003+u*.994)/4,(1-Math.floor(f.ad/4)+.003+v*.994)/2]);
 const glow=mat('FiveTimesCoveredWalkGlow','vec2 p=uv-.5;m.emission=vec3(.38,.30,.24);m.alpha=exp(-dot(p,p)*16.0)*.09;',{},true);addFaces(viewer,g.pools,glow,(f,u,v)=>[u,v],true);
 return {facades:g.facades.length,scaffolds:g.scaffolds.length,scaffoldMeters:g.scaffolds.reduce((n,s)=>n+s.length,0),billboards:g.screens.length+g.posters.length,silverBollards:g.bollards.length,atlasSize:[2048,2048]};
}
