import {Material} from 'cesium';
import {addBatches,addFaces} from './street-details.js';
import {architectureNightAppearance} from './architecture-lighting.js';
import {createNorth42Geometry} from './north42-geometry.js';
const CELLS={
 'victory-blade':[0,0,256,1536],'victory-header':[256,0,1792,128],subway:[256,128,1792,256],routes:[256,384,1792,128],
 civic:[256,512,1792,256],citysole:[256,768,1792,128],ribbon:[256,896,1792,384],
 'city-nights':[256,1280,1792,512],'theatre-row':[0,1792,1024,128],gifts:[1024,1792,1024,128],lyric:[0,1920,1024,128],barrier:[1024,1920,1024,128]
};
export function north42SignAtlas(){
 const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=2048;const c=canvas.getContext('2d');
 for(const [kind,[x,y,w,h]]of Object.entries(CELLS)){
  c.save();c.translate(x,y);c.beginPath();c.rect(0,0,w,h);c.clip();c.textAlign='center';c.textBaseline='middle';
  const fill=color=>{c.fillStyle=color;c.fillRect(0,0,w,h);};
  const text=(value,yy,size,color='#e8e4d4',xx=w/2,max=w*.94,font='bold')=>{c.fillStyle=color;c.font=`${font} ${size}px Arial, sans-serif`;c.fillText(value,xx,yy,max);};
  switch(kind){
   case 'victory-blade':{
    fill('#1d315b');c.strokeStyle='#b6a074';c.lineWidth=6;c.strokeRect(15,15,w-30,h-30);
    const letters='NEW VICTORY';for(let i=0;i<letters.length;i++)text(letters[i],120+i*126,158,'#eac65d');break;
   }
   case 'victory-header':text('NEW VICTORY',h*.53,104,'#d5b77b');break;
   case 'subway':
    fill('#354049');c.strokeStyle='#77838a';c.lineWidth=7;c.strokeRect(18,18,w-36,h-36);text('Subway',h*.51,205,'#ed2849',w/2,w*.82,'normal');break;
   case 'routes':{
    fill('#11232a');text('Times Sq–42 St',h*.50,64,'#dde2d6',w*.19,w*.34,'normal');
    const routes=[['1','#e14648'],['2','#e14648'],['3','#e14648'],['7','#ae54a2'],['N','#d6b329'],['Q','#d6b329'],['R','#d6b329'],['W','#d6b329'],['S','#65706f']];
    routes.forEach(([route,color],i)=>{const xx=w*.405+i*111;c.fillStyle=color;c.beginPath();c.arc(xx,64,44,0,Math.PI*2);c.fill();text(route,65,62,i>3&&i<8?'#192b32':'#fff',xx,77);});break;
   }
   case 'civic':{
    text('CIVIC',h*.52,194,'#e2e8e6',w*.43,w*.68,'normal');const xx=w*.85,yy=h*.5,r=h*.36;
    c.fillStyle='#126cef';c.beginPath();c.moveTo(xx,yy-r);c.lineTo(xx+r,yy);c.lineTo(xx,yy+r);c.lineTo(xx-r,yy);c.closePath();c.fill();c.clearRect(xx-r*.25,yy-r*.25,r*.5,r*.5);break;
   }
   case 'citysole':text('C I T Y S O L E',h*.51,90,'#e9d5a7');break;
   case 'ribbon':{
    const bg=c.createLinearGradient(0,0,w,0);bg.addColorStop(0,'#ba5449');bg.addColorStop(.44,'#e4b6a1');bg.addColorStop(1,'#d8c7b3');c.fillStyle=bg;c.fillRect(0,0,w,h);
    text('CITYSOLE',h*.37,132,'#fff3df',w*.36,w*.59);text('THE CITY IS YOURS',h*.73,51,'#423b3c',w*.36,w*.60);
    // An original vector shoe campaign, kept in the shared sign atlas.
    c.save();c.translate(w*.71,h*.18);c.rotate(-.12);c.fillStyle='#333d4c';c.beginPath();c.moveTo(0,110);c.lineTo(32,25);c.lineTo(88,30);c.lineTo(133,93);c.lineTo(256,118);c.quadraticCurveTo(306,126,304,165);c.lineTo(-13,165);c.closePath();c.fill();
    c.strokeStyle='#eee0c7';c.lineWidth=20;c.beginPath();c.moveTo(-11,166);c.lineTo(304,166);c.stroke();c.lineWidth=6;for(let i=0;i<5;i++){c.beginPath();c.moveTo(103+i*22,91+i*5);c.lineTo(94+i*22,118+i*2);c.stroke();}c.restore();break;
   }
   case 'city-nights':text('CITY NIGHTS',h*.42,231,'#d7eafa');text('EVERY POSSIBILITY',h*.79,81,'#b6d4eb',w/2,w*.88,'normal');break;
   case 'theatre-row':text('TIMES SQUARE THEATER',h*.51,79,'#d3bd8c');break;
   case 'lyric':fill('#1d3436');text('LYRIC',h*.51,94,'#cbbd8a');break;
   case 'gifts':fill('#253c40');text('CITY GIFTS',h*.51,90,'#ded8c0');break;
   case 'barrier':fill('#c2c8be');text('TIMES SQUARE',h*.52,94,'#304958');break;
  }c.restore();
 }return {canvas,cells:CELLS};
}
const mat=(type,body,uniforms={},translucent=false)=>new Material({fabric:{type,uniforms,source:`czm_material czm_getMaterial(czm_materialInput materialInput){vec2 uv=materialInput.st;czm_material m=czm_getDefaultMaterial(materialInput);m.diffuse=vec3(.003);${body}return m;}`},translucent});
const along=(f,u)=>f.corners?f.s0+u*(f.s1-f.s0):u*f.width;
export function addNorth42(viewer,collision){
 const g=createNorth42Geometry();collision.addStatic('north42-reference-frontage',g.collision);
 addBatches(viewer,g.batches,false,false,architectureNightAppearance(g.night));addBatches(viewer,g.emissive);addBatches(viewer,g.paving,true);
 const stone=mat('North42NightStone',`vec2 q=uv/vec2(.92,.47);q.x+=mod(floor(q.y),2.0)*.5;vec2 b=fract(q);float seam=max(1.0-smoothstep(.007,.019,b.x),1.0-smoothstep(.013,.034,b.y));float noise=fract(sin(dot(uv,vec2(173.8,394.6)))*5417.9);m.emission=vec3(.55,.51,.43)*(1.0-seam*.30)*(.95+.08*noise)*mix(vec3(.34,.34,.38),vec3(.21,.27,.36),smoothstep(5.0,35.0,uv.y));m.alpha=1.0;`);
 addFaces(viewer,g.stone,stone,(f,u,v)=>[along(f,u),f.corners?f.bottom+v*f.height:v*f.height]);
 const glass=mat('North42NightGlazing',`float pane=step(.10,fract(uv.x/1.9))*step(.12,fract(uv.y/3.3));float reflection=step(.67,fract(uv.x*.23+uv.y*.04));float cell=fract(sin(dot(floor(uv/vec2(1.9,3.3)),vec2(31.7,74.2)))*6753.0);m.emission=mix(vec3(.020,.037,.052),vec3(.052,.094,.119),reflection)*(.67+.33*pane)+step(.89,cell)*pane*vec3(.067,.062,.034);m.alpha=1.0;`);
 addFaces(viewer,g.glass,glass,(f,u,v)=>[along(f,u),f.corners?f.bottom+v*f.height:v*f.height]);
 const windows=mat('North42WarmShopWindows',`float shade=floor(uv.x)/100.0;uv.x=fract(uv.x)/.98;vec3 texel=texture(image,uv).rgb;m.emission=texel*shade+vec3(.012,.019,.022)*step(.83,fract(uv.x*17.0+uv.y*.4));m.alpha=1.0;`,{image:'/storefronts/retail-interiors-atlas.webp'});
 addFaces(viewer,g.interiors,windows,(f,u,v)=>{const t=f.corners?(along(f,u)-f.from)/(f.to-f.from):u;return [Math.round(f.shade*100)+((f.cell+.008+t*.984)/3)*.98,.006+v*.988];});
 const ads=mat('North42BillboardPosters','m.emission=texture(image,uv).rgb*.67;m.alpha=1.0;',{image:'/billboards/portrait-atlas.webp'});
 addFaces(viewer,g.screens,ads,(f,u,v)=>[(f.ad%4+.004+u*.992)/4,(1-Math.floor(f.ad/4)+.004+v*.992)/2]);
 const blue=mat('North42BlueWrap',`float ribbon=exp(-pow((uv.y-.51-.16*sin(uv.x*5.4))/.19,2.0));float grid=step(.96,fract(uv.x*85.0))*step(.90,fract(uv.y*32.0));m.emission=mix(vec3(.008,.049,.13),vec3(.028,.26,.49),ribbon)*(1.0-grid*.17);m.alpha=1.0;`);
 addFaces(viewer,g.blueScreens,blue,(f,u,v)=>[(along(f,u)-f.from)/(f.to-f.from),v]);
 const atlas=north42SignAtlas(),signs=mat('North42ReferenceSigns',`float shade=floor(uv.x)/100.0;uv.x=fract(uv.x)/.98;vec4 color=texture(image,uv);if(color.a<.18)discard;m.emission=color.rgb*shade;m.alpha=1.0;`,{image:Material.DefaultImageId});signs.uniforms.image=atlas.canvas;
 addFaces(viewer,[...g.labels,...g.ribbons],signs,(f,u,v)=>{const t=f.corners?(along(f,u)-f.from)/(f.to-f.from):u,[x,y,w,h]=atlas.cells[f.kind];return [Math.round(f.shade*100)+((x+2+t*(w-4))/2048)*.98,(2048-y-h+2+v*(h-4))/2048];});
 const glow=mat('North42SubwayNeonSpill','vec2 q=uv-.5;m.emission=vec3(.40,.06,.075);m.alpha=exp(-dot(q,q)*17.0)*.10;',{},true);addFaces(viewer,g.pools,glow,(f,u,v)=>[u,v],true);
 return {facades:7,curvedFacets:44,bollards:g.bollards.length,barriers:g.barriers.length,portal:'MTA row 74 exterior',preservedStair:'mta-82',atlasSize:[2048,2048]};
}
