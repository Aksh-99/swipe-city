import {Material} from 'cesium';
import {addBatches,addFaces} from './street-details.js';
import {architectureNightAppearance} from './architecture-lighting.js';
import {ATTRACTIONS} from './attractions-config.js';
import {createAttractionsGeometry} from './attractions-geometry.js';
const CELLS={'dave-logo':[0,0,1024,768],'dave-blade':[1024,0,256,1024],'mt-blade':[1280,0,256,1536],'mt-medallion':[1536,0,512,512],diner:[0,768,1024,128],liberty:[0,896,512,128],applebees:[512,896,512,128],'dave-door':[0,1024,1024,128],'mt-entrance':[0,1152,1024,128],barrier:[0,1280,512,128]};
export function attractionsAtlas(labels){
 const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=2048;const c=canvas.getContext('2d'),first=new Map(labels.map(f=>[f.kind,f]));
 for(const [kind,rect]of Object.entries(CELLS)){
  const f=first.get(kind);if(!f)continue;
  const [x,y,pw,h]=rect,w=h*f.width/f.height;
  c.save();c.translate(x,y);c.beginPath();c.rect(0,0,pw,h);c.clip();c.scale(pw/w,1);c.textAlign='center';c.textBaseline='middle';
  const fill=color=>{c.fillStyle=color;c.fillRect(0,0,w,h);};
  const text=(s,yy,size,color='#efdfb8',font='bold',family='Arial',max=w*.91)=>{c.save();c.fillStyle=color;c.font=`${font} ${size}px ${family}, ${family==='Georgia'?'serif':'sans-serif'}`;c.fillText(s,w/2,yy,max);c.restore();};
  const border=(color,inset,line)=>{c.strokeStyle=color;c.lineWidth=line;c.strokeRect(inset,inset,w-2*inset,h-2*inset);};
  if(kind==='dave-logo'){
   const grad=c.createRadialGradient(w*.35,h*.30,1,w/2,h/2,w*.65);grad.addColorStop(0,'#2838bc');grad.addColorStop(1,'#13217b');c.fillStyle=grad;c.beginPath();c.ellipse(w/2,h/2,w*.485,h*.475,0,0,Math.PI*2);c.fill();
   c.strokeStyle='#4563cd';c.lineWidth=h*.014;c.stroke();c.save();c.translate(w/2,h/2);c.rotate(-.19);c.translate(-w/2,-h/2);
   text('DAVE &',h*.40,h*.26,'#e47a34','bold','Arial',w*.79);text('BUSTER’S',h*.625,h*.21,'#e47a34','bold','Arial',w*.80);c.restore();
  }else if(kind==='dave-blade'){
   fill('#1c3897');border('#bd734c',w*.035,w*.018);border('#8497c4',w*.10,w*.023);
   const logo=yy=>{c.fillStyle='#244bb0';c.beginPath();c.ellipse(w/2,yy,w*.34,w*.26,0,0,Math.PI*2);c.fill();text('DAVE &',yy-w*.065,w*.14,'#f1ac60');text('BUSTER’S',yy+w*.075,w*.12,'#f1ac60');};
   logo(h*.095);logo(h*.90);
   for(const [word,y,size]of [['EAT',.25,.54],['&',.335,.27],['DRINK',.41,.43],['&',.493,.27],['PLAY',.57,.50],['&',.65,.27],['WATCH',.733,.42]])text(word,h*y,w*size,word==='&'?'#efb95f':'#e6e8d8','bold','Arial',w*.74);
  }else if(kind==='mt-blade'){
   fill('#363e5b');border('#b89950',w*.035,w*.05);
   const letters=[...'MADAME',null,...'TUSSAUDS'],slot=h/15;
   for(const [i,letter]of letters.entries()){
    const y=i*slot;if(!letter){c.fillStyle='#19293c';c.fillRect(w*.05,y,w*.9,slot);continue;}
    c.fillStyle=i%2?'#3e455f':'#344564';c.fillRect(w*.07,y+2,w*.86,slot-4);c.strokeStyle='#ac9359';c.lineWidth=2;c.strokeRect(w*.07,y+2,w*.86,slot-4);
    text(letter,y+slot*.54,Math.min(w*.77,slot*1.13),'#d0ad60','normal','Georgia');
   }
  }else if(kind==='mt-medallion'){
   c.fillStyle='#9d4637';c.beginPath();c.arc(w/2,h/2,w*.485,0,Math.PI*2);c.fill();c.strokeStyle='#c5a365';c.lineWidth=w*.025;c.stroke();
   text('Madame',h*.32,h*.14,'#d9bb7d','italic bold','Georgia');text('Tussauds',h*.50,h*.17,'#e2c384','italic bold','Georgia');text('NEW YORK',h*.69,h*.072,'#d6bd85');
  }else if(kind==='diner'){
   c.clearRect(0,0,w,h);c.font=`bold ${h*.90}px Arial, sans-serif`;c.strokeStyle='#193243';c.lineWidth=h*.055;c.strokeText('DINER',w/2,h*.53,w*.93);text('DINER',h*.53,h*.90,'#285dac');
  }else if(kind==='liberty'){fill('#222e33');text('LIBERTY',h*.53,h*.74,'#c14d47');
  }else if(kind==='applebees'){fill('#20392d');text('Applebee’s',h*.52,h*.82,'#d7d8bb');
  }else if(kind==='dave-door'){fill('#132a36');text('EAT   DRINK   PLAY   WATCH',h*.53,h*.73,'#d6e2d5');
  }else if(kind==='mt-entrance'){fill('#6e2833');text('MADAME TUSSAUDS  •  NEW YORK',h*.52,h*.68,'#dcc596');
  }else{fill('#c4ccc3');text('TIMES SQUARE',h*.52,h*.75,'#223d4c');}
  c.restore();
 }
 return {canvas,cells:CELLS};
}
function mat(type,source,uniforms={},translucent=false){return new Material({fabric:{type,uniforms,source:`czm_material czm_getMaterial(czm_materialInput materialInput){czm_material m=czm_getDefaultMaterial(materialInput);vec2 uv=materialInput.st;m.diffuse=vec3(.003);${source}return m;}`},translucent});}
export function addAttractions(viewer,collision){
 const g=createAttractionsGeometry();collision.addStatic('42nd-street-attractions',g.collision);
 addBatches(viewer,g.batches,false,false,architectureNightAppearance(g.night));addBatches(viewer,g.emissive);addBatches(viewer,g.paving,true);
 const glass=mat('AttractionsNightGlass',`float kind=floor(uv.x/512.0);uv.x=mod(uv.x,512.0);float reflection=step(.74,fract(uv.x*.35+uv.y*.039));float band=step(.95,fract(uv.y/3.17));vec3 base=mix(vec3(.025,.043,.048),vec3(.048,.081,.083),reflection);float warm=step(.5,kind);vec2 pane=fract(uv/vec2(1.23,3.1));float interior=step(.20,pane.x)*step(pane.x,.85)*step(.22,pane.y)*step(pane.y,.70);m.emission=base*(1.0-band*.50)+warm*interior*vec3(.067,.033,.015);m.alpha=1.0;`);
 addFaces(viewer,g.glass,glass,(f,u,v)=>[f.kind*512+u*f.width,v*f.height]);
 const stone=mat('AttractionsSandstone',`vec2 q=uv/vec2(1.62,.64);q.x+=mod(floor(q.y),2.0)*.5;vec2 b=fract(q);float joint=max(1.0-smoothstep(.004,.018,b.x),1.0-smoothstep(.006,.024,b.y));float grain=fract(sin(dot(uv,vec2(117.9,442.3)))*5283.3);vec3 base=vec3(.60,.56,.45)*(1.0-joint*.28)*(.95+grain*.07);m.emission=base*mix(vec3(.33,.32,.35),vec3(.22,.25,.30),smoothstep(5.0,40.0,uv.y));m.alpha=1.0;`);
 addFaces(viewer,g.stone,stone,(f,u,v)=>[u*f.width,v*f.height]);
 const atlas=attractionsAtlas(g.labels),signs=mat('TimesSquareAttractionsSigns',`float shade=floor(uv.x)/100.0;uv.x=fract(uv.x)/.98;vec4 texel=texture(image,uv);if(texel.a<.18)discard;m.emission=texel.rgb*shade;m.alpha=1.0;`,{image:Material.DefaultImageId});
 // Never put a Canvas into Cesium's reusable Fabric template cache.
 signs.uniforms.image=atlas.canvas;
 addFaces(viewer,g.labels,signs,(f,u,v)=>{const [x,y,w,h]=atlas.cells[f.kind],pad=2;return [Math.round(f.shade*100)+((x+pad+u*(w-2*pad))/2048)*.98,(2048-y-h+pad+v*(h-2*pad))/2048];});
 const portrait=mat('AttractionsPortraitAds','m.emission=texture(image,uv).rgb*.66;m.alpha=1.0;',{image:'/billboards/portrait-atlas.webp'}),landscape=mat('AttractionsLandscapeAds','m.emission=texture(image,uv).rgb*.65;m.alpha=1.0;',{image:'/billboards/atlas.webp'});
 const atlasUV=(cols,rows)=>(f,u,v)=>[(f.ad%cols+.004+u*.992)/cols,(rows-1-Math.floor(f.ad/cols)+.004+v*.992)/rows];
 addFaces(viewer,g.posters,portrait,atlasUV(4,2));addFaces(viewer,g.landscape,landscape,atlasUV(2,2));
 const glow=mat('AttractionsEntranceGlow','vec2 q=uv-.5;m.emission=vec3(.41,.26,.24);m.alpha=exp(-dot(q,q)*17.0)*.095;',{},true);addFaces(viewer,g.pools,glow,(f,u,v)=>[u,v],true);
 return {places:ATTRACTIONS.places.length,facades:ATTRACTIONS.facades.length,canopies:1,sculptedHands:1,bollards:g.bollards.length,barriers:g.barriers.length,signs:g.labels.length,ads:g.posters.length+g.landscape.length};
}
