import {Material} from 'cesium';
import {addBatches,addFaces} from './street-details.js';
import {architectureNightAppearance} from './architecture-lighting.js';
import {createLyricGeometry} from './lyric-geometry.js';
import {LYRIC_THEATRE} from './lyric-config.js';

export function lyricSignAtlas(labels){
 const canvas=document.createElement('canvas'),cell=384,columns=4,rows=Math.ceil(labels.length/columns);canvas.width=cell*columns;canvas.height=cell*rows;const c=canvas.getContext('2d');
 for(const [i,f]of labels.entries()){
  c.save();c.translate(i%columns*cell,Math.floor(i/columns)*cell);c.beginPath();c.rect(0,0,cell,cell);c.clip();const w=cell*f.width/f.height;c.scale(cell/w,1);c.textAlign='center';
  c.fillStyle='#121c20';c.fillRect(0,0,w,cell);
  const text=(t,y,size,color='#d9c895',family='Georgia')=>{c.fillStyle=color;c.font=`bold ${size}px ${family}`;c.fillText(t,w/2,y,w-24);};
  if(f.kind==='lyric'){text('LYRIC',162,125);text('THEATRE',291,86);}
  else if(f.kind==='marquee'){text('HARRY POTTER AND THE CURSED CHILD',247,160);}
  else if(f.kind==='exit'){text('LYRIC THEATRE  ·  STAGE DOOR',247,120,'#bdbfa9','Arial');}
  else if(f.kind==='scaffold'){c.fillStyle='#214636';c.fillRect(0,0,w,cell);text('CORE',172,142,'#e2e2d3','Arial');text('SIDEWALK OPEN',310,78,'#cbd5c9','Arial');}
  else if(f.kind==='deli'){c.fillStyle='#19382d';c.fillRect(0,0,w,cell);text('USA BROOKLYN DELICATESSEN',259,180,'#dfd9b9','Arial');}
  else if(f.kind==='deli-banner'){
   c.fillStyle='#b98c49';c.fillRect(0,0,w,cell);c.fillStyle='#18392f';c.fillRect(4,4,w-8,cell-8);text('USA',39,25);text('BROOKLYN',68,20);text('DELICATESSEN',91,15);
   const g=c.createLinearGradient(0,112,0,332);g.addColorStop(0,'#ddab52');g.addColorStop(1,'#7c3e22');c.fillStyle=g;c.fillRect(10,114,w-20,213);
   for(let j=0;j<3;j++){
    const y=143+j*61;c.fillStyle='#d5a454';c.beginPath();c.ellipse(w/2,y,w*.37,16,0,0,Math.PI*2);c.fill();c.fillStyle='#6d3928';c.fillRect(w*.14,y+3,w*.72,9);c.fillStyle='#64944e';c.fillRect(w*.15,y+12,w*.70,5);c.fillStyle='#d7a05b';c.fillRect(w*.16,y+17,w*.68,7);
   }text('NEW YORK',355,18);text('CLASSICS',377,17);
  }else{
   const g=c.createLinearGradient(0,0,0,cell);g.addColorStop(0,'#112229');g.addColorStop(.5,'#645230');g.addColorStop(1,'#101c23');c.fillStyle=g;c.fillRect(0,0,w,cell);
   c.strokeStyle='#bda16a';c.lineWidth=3;c.strokeRect(9,9,w-18,cell-18);
   text('Harry Potter',f.kind==='show'?142:64,f.kind==='show'?103:34);text('AND THE',f.kind==='show'?208:88,f.kind==='show'?36:13);text('CURSED CHILD',f.kind==='show'?304:121,f.kind==='show'?68:23);
   if(f.kind==='poster'){
    // Authored printed poster illustration: skyline, crescent and warm stars.
    c.fillStyle='#d1b474';c.beginPath();c.arc(w*.64,180,29,0,Math.PI*2);c.fill();c.fillStyle='#253333';c.beginPath();c.arc(w*.70,170,27,0,Math.PI*2);c.fill();
    c.fillStyle='#142228';for(let j=0;j<8;j++){const x=w*.13+j*w*.10,h=25+(j*17%55);c.fillRect(x,295-h,w*.08,h);c.beginPath();c.moveTo(x-3,295-h);c.lineTo(x+w*.04,282-h);c.lineTo(x+w*.08+3,295-h);c.fill();}
    c.strokeStyle='#a7884e';c.lineWidth=4;c.beginPath();c.arc(w/2,320,w*.42,Math.PI,Math.PI*2);c.stroke();
    for(let j=0;j<29;j++){const x=19+(j*41%(w-38)),y=138+j*29%127;c.fillStyle='#c3ae72';c.fillRect(x,y,1.5,1.5);}
    text('LIVE ON BROADWAY',345,14);text('LYRIC THEATRE',368,13);
   }
  }c.restore();
 }return {canvas,rows,columns};
}
function mat(type,source,uniforms={},translucent=false){return new Material({fabric:{type,uniforms,source:`czm_material czm_getMaterial(czm_materialInput materialInput){czm_material m=czm_getDefaultMaterial(materialInput);vec2 uv=materialInput.st;m.diffuse=vec3(.004);${source}return m;}`},translucent});}
export function addLyricTheatre(viewer,collision){
 const g=createLyricGeometry();collision.addStatic('lyric-theatre',g.collision);
 addBatches(viewer,g.batches,false,false,architectureNightAppearance(g.night));addBatches(viewer,g.paving,true);addBatches(viewer,g.emissive);
 const brick=mat('LyricNightBrick',`vec2 q=uv/vec2(.29,.092);q.x+=mod(floor(q.y),2.0)*.5;vec2 id=floor(q),b=fract(q);float seam=max(1.0-smoothstep(.025,.055,b.x),1.0-smoothstep(.03,.075,b.y));float noise=fract(sin(dot(id,vec2(13.7,73.1)))*43758.5);vec3 base=mix(vec3(.35,.235,.16),vec3(.56,.355,.215),noise);base=mix(base,vec3(.39,.37,.30),seam*.66);float grain=fract(sin(dot(uv,vec2(591.43,1071.91)))*4312.2);m.emission=base*mix(vec3(.33,.32,.34),vec3(.19,.225,.285),smoothstep(7.0,26.0,uv.y))*(.94+grain*.1);m.alpha=1.0;`);
 addFaces(viewer,g.brick,brick,(f,u,v)=>[u*f.width,v*f.height]);
 const stone=mat('LyricNightLimestone',`vec2 q=uv/vec2(1.6,.61);q.x+=mod(floor(q.y),2.0)*.5;vec2 b=fract(q);float seam=max(1.0-smoothstep(.002,.01,b.x),1.0-smoothstep(.004,.018,b.y));float grain=fract(sin(dot(uv,vec2(198.4,286.8)))*6431.9);vec3 base=vec3(.58,.56,.49)*(1.0-seam*.31)*(.95+grain*.07);m.emission=base*mix(vec3(.31,.32,.35),vec3(.22,.26,.32),smoothstep(7.0,24.0,uv.y));m.alpha=1.0;`);
 addFaces(viewer,g.stone,stone,(f,u,v)=>[u*f.width,v*f.height]);
 const glass=mat('LyricNightGlass',`float reflection=step(.77,fract(uv.x*.52+uv.y*.035));float band=step(.93,fract(uv.y*.38));vec3 tint=mix(vec3(.027,.058,.067),vec3(.069,.111,.122),reflection);float lamp=pow(max(0.0,1.0-length((fract(uv/vec2(2.4,4.5))-.5)*vec2(4.0,7.0))),3.0);m.emission=tint*(1.0-band*.28)+lamp*vec3(.115,.080,.03);m.alpha=1.0;`);
 addFaces(viewer,g.glass,glass,(f,u,v)=>[u*f.width,v*f.height]);
 const logo=mat('LyricOfficialMarquee',`vec4 texel=texture(image,uv);if(texel.a<.16)discard;m.emission=texel.rgb*.69;m.alpha=1.0;`,{image:'/assets/lyric/cursed-child-logo.png'});
 addFaces(viewer,g.logos,logo,(f,u,v)=>[u,v]);
 const atlas=lyricSignAtlas(g.labels),indexes=new Map(g.labels.map((f,i)=>[f,i]));
 // Cache only a string placeholder in Cesium Fabric. Runtime DOM canvases
 // must never become constructors in a reusable material template.
 const signs=mat('LyricExteriorSigns','m.emission=texture(image,uv).rgb*.62;m.alpha=1.0;',{image:Material.DefaultImageId});signs.uniforms.image=atlas.canvas;
 addFaces(viewer,g.labels,signs,(f,u,v)=>{const i=indexes.get(f);return [(i%atlas.columns+.004+u*.992)/atlas.columns,(atlas.rows-1-Math.floor(i/atlas.columns)+.004+v*.992)/atlas.rows];});
 const net=mat('LyricScaffoldNet',`vec2 cell=fract(uv*26.0);float meshLine=max(step(.86,cell.x),step(.86,cell.y));float folds=.86+.14*sin(uv.x*2.7);m.emission=vec3(.030,.084,.063)*folds;m.alpha=.30+meshLine*.27;`,{},true);
 addFaces(viewer,g.netting,net,(f,u,v)=>[u*f.width,v*f.height],true);
 const fence=mat('LyricChainLink',`vec2 diagonal=fract(vec2(uv.x+uv.y,uv.x-uv.y)*9.0);float line=max(1.0-smoothstep(.025,.085,abs(diagonal.x-.5)),1.0-smoothstep(.025,.085,abs(diagonal.y-.5)));if(line<.07)discard;m.emission=vec3(.29,.35,.35)*line;m.alpha=.85;`,{},true);
 addFaces(viewer,g.fence,fence,(f,u,v)=>[u*f.width,v*f.height],true);
 const glow=mat('LyricWalkwayLamps','vec2 q=uv-.5;m.emission=vec3(.62,.51,.30);m.alpha=exp(-dot(q,q)*16.0)*.11;',{},true);
 addFaces(viewer,g.pools,glow,(f,u,v)=>[u,v],true);
 return {theatre:LYRIC_THEATRE,scaffolds:g.scaffolds.length,rails:g.rails.length,constructionBarriers:g.barriers.length,trafficCones:g.cones.length,wingLength:LYRIC_THEATRE.wingLength};
}
