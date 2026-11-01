import {Material} from 'cesium';
import {addBatches,addFaces} from './street-details.js';
import {architectureNightAppearance} from './architecture-lighting.js';
import {createCinemaGeometry} from './cinema-geometry.js';
import {CINEMA_PLACES} from './cinema-config.js';

const signKey=f=>`${f.kind}:${(f.width/f.height).toFixed(2)}`;
export function cinemaSignAtlas(labels){
 const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=2048;
 const c=canvas.getContext('2d'),cells={},occupied=Array.from({length:16},()=>Array(16).fill(false));
 const unique=[...new Map(labels.map(f=>[signKey(f),f])).values()].map(f=>{
  const ratio=f.width/f.height;return {f,key:signKey(f),bw:ratio<.8?2:ratio>10?8:4,bh:ratio<.35?8:ratio<.8?4:ratio<3?2:1};
 }).sort((a,b)=>b.bh-a.bh||b.bw-a.bw);
 for(const {f,key,bw,bh}of unique){
  let spot;
  for(let y=0;y<=16-bh&&!spot;y++)for(let x=0;x<=16-bw&&!spot;x++){
   if(occupied.slice(y,y+bh).every(row=>row.slice(x,x+bw).every(v=>!v)))spot=[x,y];
  }
  if(!spot)throw new Error('42nd Street sign atlas overflow');
  const [gx,gy]=spot;for(let y=gy;y<gy+bh;y++)for(let x=gx;x<gx+bw;x++)occupied[y][x]=true;
  const x=gx*128+2,y=gy*128+2,pw=bw*128-4,h=bh*128-4,w=h*f.width/f.height;cells[key]=[x,y,pw,h];
  c.save();c.translate(x,y);c.beginPath();c.rect(0,0,pw,h);c.clip();c.scale(pw/w,1);c.textAlign='center';c.textBaseline='middle';
  const fill=color=>{c.fillStyle=color;c.fillRect(0,0,w,h);};
  const text=(s,yy,size,color='#e6deca',font='bold',family='Arial',xx=w/2,max=w*.94)=>{
   c.fillStyle=color;c.font=`${font} ${size}px ${family}, sans-serif`;c.fillText(s,xx,yy,max);
  };
  const border=(color='#b89c61',inset=h*.025,line=h*.018)=>{c.strokeStyle=color;c.lineWidth=line;c.strokeRect(inset,inset,w-2*inset,h-2*inset);};
  const stack=(word,y0,y1,color='#eee8d0',size=w*.71)=>{
   const gap=(y1-y0)/word.length;for(const [i,letter]of [...word].entries())text(letter,y0+(i+.5)*gap,Math.min(size,gap*1.05),color);
  };
  const regalR=(xx,yy,r)=>{
   c.strokeStyle='#e88838';c.lineWidth=r*.13;c.beginPath();for(let i=0;i<=8;i++){const a=i*Math.PI/4+Math.PI/8;const px=xx+Math.cos(a)*r,py=yy+Math.sin(a)*r;i?c.lineTo(px,py):c.moveTo(px,py);}c.stroke();
   text('R',yy+r*.04,r*1.30,'#eb923c','bold','Arial',xx,r*1.4);
  };
  fill('#14242b');
  switch(f.kind){
   case 'amc-logo':
    c.clearRect(0,0,w,h);c.font=`bold ${h*1.04}px Arial, sans-serif`;c.lineJoin='round';c.strokeStyle='#7e151b';c.lineWidth=h*.05;c.strokeText('amc',w/2,h*.53,w*.87);text('amc',h*.53,h*1.04,'#d5282e','bold','Arial',w/2,w*.87);break;
   case 'amc-marquee':fill('#201e1c');text('amc  EMPIRE 25',h*.52,h*.74,'#e9ce92');break;
   case 'empire-blade':
    fill('#181f22');border('#b8964c',w*.075,w*.045);border('#877046',w*.16,w*.018);
    c.fillStyle='#a72929';c.beginPath();c.ellipse(w/2,h*.081,w*.36,h*.040,0,0,Math.PI*2);c.fill();text('amc',h*.081,w*.39,'#f5e4cb');
    stack('EMPIRE',h*.16,h*.83,'#e9deb0',w*.70);text('25',h*.915,w*.48,'#e8c773');break;
   case 'regal':
    fill('#171d21');if(w/h>7){regalR(w*.38,h*.50,h*.34);text('REGAL',h*.52,h*.72,'#ea8f38','bold','Arial',w*.57,w*.29);}else{text('REGAL',h*.53,h*.72,'#ea8f38');}break;
   case 'regal-vertical':
    fill('#982b30');border('#c4b393',w*.065,w*.018);regalR(w/2,h*.10,w*.33);stack('REGAL',h*.21,h*.97,'#efe6d5',w*.76);break;
   case 'eleven':fill('#263d44');text('11 TIMES SQUARE',h*.52,h*.71,'#c8d8d6','normal');break;
   case 'dolby':fill('#171e24');text('DOLBY CINEMA   •   IMAX   •   LASER',h*.53,h*.70,'#d9e1df');break;
   case 'cinema-banner':fill('#30292a');text('BIG SCREEN.  BIG NIGHTS.',h*.53,h*.65,'#d5d5c8');break;
   case 'westin':fill('#323630');text('WESTIN',h*.52,h*.66,'#d3ccaf','normal');break;
   case 'formats':fill('#162b34');text('4DX   •   RPX',h*.51,h*.72,'#e4e0cd');break;
   case 'five-guys':
    fill('#e2dfd0');text('FIVE GUYS',h*.48,h*.67,'#aa302d');
    for(let xx=0;xx<w;xx+=h*.21){c.fillStyle=(Math.round(xx/(h*.21))%2)?'#b13730':'#dbd8ca';c.fillRect(xx,h*.86,h*.21,h*.14);}break;
   case 'gifts':fill('#d7dfdb');text('NY GIFTS',h*.51,h*.71,'#235875');break;
   case 'bbq':fill('#193d61');text('DALLAS BBQ',h*.52,h*.81,'#df4b3e');break;
   case 'bbq-blade':
    fill('#1c3e60');border('#c8b280',w*.045,w*.025);text('DALLAS',h*.16,w*.29,'#e4ce93');stack('BBQ',h*.29,h*.94,'#e05f44',w*.72);break;
   case 'live-new-york':fill('#203131');text('LIVE',h*.35,h*.48,'#d1cbb2');text('NEW YORK',h*.78,h*.32,'#b4c9c3','normal');break;
   case 'bus-only':c.clearRect(0,0,w,h);text('BUS',h*.27,h*.37,'#dce0d5');text('ONLY',h*.76,h*.37,'#dce0d5');break;
   case 'barrier':fill('#c4ccc3');text('TIMES SQUARE',h*.52,h*.75,'#223d4c');break;
   default:throw new Error(`Unknown cinema sign ${f.kind}`);
  }
  c.restore();
 }
 return {canvas,cells,key:signKey};
}
function mat(type,source,uniforms={},translucent=false){return new Material({fabric:{type,uniforms,source:`czm_material czm_getMaterial(czm_materialInput materialInput){czm_material m=czm_getDefaultMaterial(materialInput);vec2 uv=materialInput.st;m.diffuse=vec3(.003);${source}return m;}`},translucent});}
export function addCinemaBlock(viewer,collision){
 const g=createCinemaGeometry();collision.addStatic('42nd-street-cinemas',g.collision);
 addBatches(viewer,g.batches,false,false,architectureNightAppearance(g.night));addBatches(viewer,g.paving,true);addBatches(viewer,g.emissive);
 const glass=mat('CinemaBlockNightGlass',`float kind=floor(uv.x/512.0);uv.x=mod(uv.x,512.0);float stripe=step(.77,fract(uv.x*.16+uv.y*.041));float floors=step(.952,fract(uv.y/3.75));vec3 tint=mix(vec3(.025,.047,.055),vec3(.057,.092,.099),stripe);vec2 pane=fract(uv/vec2(1.56,3.75));float cell=fract(sin(dot(floor(uv/vec2(1.56,3.75)),vec2(13.1,47.2)))*6743.5);float occupied=step(.85,cell)*step(.18,pane.x)*step(pane.x,.88)*step(.29,pane.y)*step(pane.y,.66);float office=1.0-step(.5,kind);float shop=step(1.5,kind);float reflectedSign=step(.74,fract(uv.x*.13+uv.y*.025))*exp(-uv.y*.07);m.emission=tint*(1.0-floors*.60)+occupied*vec3(.15,.135,.088)*office+shop*vec3(.020,.027,.023)+reflectedSign*vec3(.027,.012,.037);m.alpha=1.0;`);
 addFaces(viewer,g.glass,glass,(f,u,v)=>[f.kind*512+u*f.width,v*f.height]);
 const brick=mat('CinemaBlockBrick',`vec2 q=uv/vec2(.29,.09);q.x+=mod(floor(q.y),2.0)*.5;vec2 b=fract(q);float seam=max(1.0-smoothstep(.024,.055,b.x),1.0-smoothstep(.024,.08,b.y));float seed=fract(sin(dot(floor(q),vec2(17.6,73.4)))*4367.2);vec3 base=mix(vec3(.32,.25,.20),vec3(.46,.36,.27),seed);m.emission=mix(base,vec3(.37,.36,.30),seam*.70)*mix(vec3(.33,.32,.35),vec3(.21,.25,.31),smoothstep(6.0,30.0,uv.y));m.alpha=1.0;`);
 addFaces(viewer,g.brick,brick,(f,u,v)=>[u*f.width,v*f.height]);
 const stone=mat('CinemaBlockLimestone',`vec2 q=uv/vec2(1.8,.65);q.x+=mod(floor(q.y),2.0)*.5;vec2 b=fract(q);float seam=max(1.0-smoothstep(.003,.012,b.x),1.0-smoothstep(.007,.020,b.y));float grain=fract(sin(dot(uv,vec2(283.4,493.8)))*5719.2);m.emission=vec3(.64,.60,.51)*(1.0-seam*.23)*(.95+grain*.06)*mix(vec3(.34,.32,.32),vec3(.24,.26,.30),smoothstep(6.0,25.0,uv.y));m.alpha=1.0;`);
 addFaces(viewer,g.stone,stone,(f,u,v)=>[u*f.width,v*f.height]);
 const atlas=cinemaSignAtlas(g.labels);
 const signs=mat('CinemaBlockSigns',`float shade=floor(uv.x)/100.0;uv.x=fract(uv.x)/.98;vec4 color=texture(image,uv);if(color.a<.18)discard;m.emission=color.rgb*shade;m.alpha=1.0;`,{image:Material.DefaultImageId});signs.uniforms.image=atlas.canvas;
 addFaces(viewer,g.labels,signs,(f,u,v)=>{const [x,y,w,h]=atlas.cells[atlas.key(f)],pad=1;return [Math.round(f.shade*100)+((x+pad+u*(w-2*pad))/2048)*.98,(2048-y-h+pad+v*(h-2*pad))/2048];});
 const portrait=mat('CinemaBlockMoviePosters','m.emission=texture(image,uv).rgb*.69;m.alpha=1.0;',{image:'/billboards/portrait-atlas.webp'});
 const landscape=mat('CinemaBlockBillboards','m.emission=texture(image,uv).rgb*.68;m.alpha=1.0;',{image:'/billboards/atlas.webp'});
 const atlasUV=(columns,rows)=>(f,u,v)=>[(f.ad%columns+.003+u*.994)/columns,(rows-1-Math.floor(f.ad/columns)+.003+v*.994)/rows];
 addFaces(viewer,g.posters,portrait,atlasUV(4,2));addFaces(viewer,g.landscape,landscape,atlasUV(2,2));
 const glow=mat('CinemaCanopyPool','vec2 q=uv-.5;m.emission=vec3(.59,.42,.22);m.alpha=exp(-dot(q,q)*17.0)*.10;',{},true);
 addFaces(viewer,g.pools,glow,(f,u,v)=>[u,v],true);
 return {places:CINEMA_PLACES.length,facades:15,barriers:g.barriers.length,posters:g.posters.length+g.landscape.length,signs:g.labels.length,atlasSize:[atlas.canvas.width,atlas.canvas.height]};
}
