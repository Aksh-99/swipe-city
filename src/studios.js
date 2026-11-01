import{Material}from'./canvas-material.js';
import {addBatches,addFaces} from './street-details.js';import {architectureNightAppearance} from './architecture-lighting.js';import {createStudiosGeometry} from './studios-geometry.js';
const KINDS=['oldnavy','gap','gifts','cityad','hero','gma','ticker','sports','dark','watch','art','show','studios','gapmap','gapboard'];
export function studiosAtlas(){const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=KINDS.length*256;const c=canvas.getContext('2d');KINDS.forEach((kind,i)=>{c.save();c.translate(0,i*256);const bg={oldnavy:'#142035',gap:'#102044',gifts:'#b2b6b3',cityad:'#d74768',hero:'#ca292f',gma:'#1768cf',ticker:'#0751b4',sports:'#080e16',dark:'#17212c',watch:'#dedcd1',art:'#eaa834',show:'#422b86',studios:'#1b2c38',gapmap:'#1a2a38',gapboard:'#ad3e40'}[kind];c.fillStyle=bg;c.fillRect(0,0,2048,256);c.textAlign='center';c.textBaseline='middle';c.fillStyle='#fff7e5';
 const text=(s,y,size=115,color='#fff7e5',x=1024,max=1950)=>{c.fillStyle=color;c.font=`bold ${size}px ${kind==='gap'?'Georgia':'Arial'}`;c.fillText(s,x,y,max);};
 if(kind==='gma'){for(const x of [360,1680]){c.fillStyle='#f5c753';c.beginPath();c.ellipse(x,128,305,120,0,0,Math.PI*2);c.fill();text('GOOD MORNING',90,65,'#123a98',x,550);text('AMERICA',161,88,'#123a98',x,550);}text('TIMES SQUARE',105,59,'#f6ebd6');text('LIVE FROM NEW YORK',171,32);}
 else if(kind==='hero'){for(let j=0;j<12;j++){c.strokeStyle='rgba(255,210,160,.13)';c.lineWidth=20;c.beginPath();c.moveTo(j*230-200,256);c.lineTo(j*230+200,0);c.stroke();}text('ONE CITY. ENDLESS STORIES.',116,145);text('NEW YORK AFTER DARK',218,36);}
 else if(kind==='cityad'){for(let j=0;j<8;j++){c.fillStyle=['#edce63','#dc629d','#7ea3e2'][j%3];c.beginPath();c.arc(j*300,220,160,0,Math.PI*2);c.fill();}text('FIND YOUR NEW YORK',86,122,'#fff9df');text('STYLE · MUSIC · CITY LIFE',187,61,'#23284b');}
 else if(kind==='art'){for(let j=0;j<14;j++){c.fillStyle=['#ee5142','#ecb52f','#327d6f','#6c4a99'][j%4];c.beginPath();c.ellipse(j*160,120,110,80,j*.4,0,Math.PI*2);c.fill();}text('CITY IN COLOR',128,132);}
 else if(kind==='show'){
 // Draw in the poster's physical portrait aspect, avoiding stretched letters.
 const ratio=(6.24/21.64)/8,W=2048*ratio;c.save();c.scale(1/ratio,1);
 const grad=c.createLinearGradient(0,0,0,256);grad.addColorStop(0,'#141a40');grad.addColorStop(.65,'#5b3486');grad.addColorStop(1,'#21133c');c.fillStyle=grad;c.fillRect(0,0,W,256);
 c.strokeStyle='#bca4d7';c.lineWidth=1;c.strokeRect(3,3,W-6,250);
 c.fillStyle='#ecc792';c.font='bold 5px Arial';c.fillText('THE CITY IS HER STAGE',W/2,17,W-10);
 c.fillStyle='#b08092';c.beginPath();c.arc(W/2,64,10,0,Math.PI*2);c.fill();c.fillStyle='#202035';c.beginPath();c.arc(W/2,58,11,Math.PI,Math.PI*2);c.fill();
 c.fillStyle='#dc536d';c.beginPath();c.moveTo(W/2-7,75);c.lineTo(W/2+8,75);c.lineTo(W/2+22,155);c.lineTo(W/2-24,155);c.closePath();c.fill();
 c.strokeStyle='#d4a18c';c.lineWidth=4;c.beginPath();c.moveTo(W/2-8,80);c.lineTo(W/2-22,110);c.moveTo(W/2+8,80);c.lineTo(W/2+24,103);c.stroke();
 c.fillStyle='#e8cfb9';c.font='italic 9px Georgia';c.fillText('Broadway',W/2,181,W-10);c.font='bold 10px Arial';c.fillText('AFTER',W/2,201,W-10);c.fillText('HOURS',W/2,214,W-10);c.font='bold 4px Arial';c.fillText('NEW YORK • LIVE TONIGHT',W/2,239,W-10);c.restore();
 }
 else if(kind==='gapmap'){
 const ratio=(.79/2.10)/8,W=2048*ratio;c.save();c.scale(1/ratio,1);c.fillStyle='#132638';c.fillRect(0,0,W,256);c.fillStyle='#e5ebdd';c.font='bold 7px Arial';c.fillText('TIMES SQUARE',W/2,18,W-7);c.font='4px Arial';c.fillText('YOU ARE AT BROADWAY / W 44 ST',W/2,31,W-7);
 c.fillStyle='#65797a';c.fillRect(6,44,W-12,177);c.fillStyle='#253d4a';for(let x=10;x<W-5;x+=14)for(let y=50;y<214;y+=24)c.fillRect(x,y,10,18);
 c.strokeStyle='#c7d2c1';c.lineWidth=4;c.beginPath();c.moveTo(W*.22,215);c.lineTo(W*.72,49);c.stroke();c.fillStyle='#e56c58';c.beginPath();c.arc(W*.44,144,4,0,Math.PI*2);c.fill();c.fillStyle='#e4e8d8';c.font='5px Arial';c.fillText('BROADWAY',W*.49,235,W-10);c.font='4px Arial';c.fillText('MAP • SHOPS • THEATRES',W/2,246,W-8);c.restore();
 }
 else if(kind==='gapboard'){
 const ratio=(1.02/1.12)/8,W=2048*ratio;c.save();c.scale(1/ratio,1);c.strokeStyle='#f1bcb0';c.lineWidth=3;c.strokeRect(9,9,W-18,238);c.fillStyle='#ffe7cc';c.font='italic bold 32px Georgia';c.fillText('Broadway',W/2,68,W-22);c.font='bold 38px Arial';c.fillText('TONIGHT',W/2,122,W-22);c.font='15px Arial';c.fillText('LIVE FROM NEW YORK',W/2,181,W-24);c.font='12px Arial';c.fillText('THEATRE DISTRICT',W/2,217,W-24);c.restore();
 }
 else if(kind==='watch'){text('RICHARD MILLE',125,110,'#242b31');}
 else if(kind==='sports'){text('ESPN     NEW YORK SPORTS  •  THE CITY NEVER STOPS',135,105);}
 else if(kind==='ticker'){text('abc   GOOD MORNING AMERICA   •   LIVE FROM TIMES SQUARE   •   NEW YORK',133,98);}
 else {text({oldnavy:'OLD NAVY',gap:'GAP',gifts:'I ♥ NY GIFTS · SOUVENIRS',dark:'',studios:'TIMES SQUARE STUDIOS'}[kind]??'',135,kind==='gap'?178:150,kind==='gifts'?'#1e3444':'#f7f1da');}c.restore();});return canvas;}
export function addStudios(viewer,collision){const g=createStudiosGeometry();collision.addStatic('times-square-studios-reference',g.collision);addBatches(viewer,g.batches,false,false,architectureNightAppearance({frontNormal:[-.94,.34,0],lights:[]}));addBatches(viewer,g.glow);
 const signs=new Material({fabric:{type:'TimesSquareStudiosReferenceSigns',uniforms:{image:studiosAtlas()},source:`czm_material czm_getMaterial(czm_materialInput i){czm_material m=czm_getDefaultMaterial(i);m.diffuse=vec3(.005);m.emission=texture(image,i.st).rgb*.66;m.alpha=1.;return m;}`}});addFaces(viewer,g.signs,signs,(f,u,v)=>[(.002+(f.u0===undefined?u:f.u0+u*(f.u1-f.u0))*.996),(KINDS.length-1-KINDS.indexOf(f.kind)+.006+v*.988)/KINDS.length]);
 const glass=new Material({fabric:{type:'TimesSquareStudiosReferenceGlazing',source:`czm_material czm_getMaterial(czm_materialInput i){vec2 uv=i.st;float kind=floor(uv.x/100.);uv.x=mod(uv.x,100.);czm_material m=czm_getDefaultMaterial(i);float mullion=step(.96,fract(uv.x/1.35));float reflection=.5+.5*sin(uv.x*.6+uv.y*.35);vec3 col=kind>1.5?mix(vec3(.035,.105,.26),vec3(.075,.25,.53),reflection):kind>.5?vec3(.014,.034,.045)+reflection*.018:vec3(.10,.085,.052)+reflection*.035;m.diffuse=col*.25;m.emission=col*(1.-mullion*.65);m.shininess=24.;m.alpha=1.;return m;}`}});addFaces(viewer,g.glass.filter(f=>f.display===undefined),glass,(f,u,v)=>[(f.kind==='blue'?200:f.kind==='studio'?100:0)+u*f.width,v*f.height]);
 const displays=new Material({fabric:{type:'GapPhotographicStoreDisplays',uniforms:{image:'/storefronts/gap-displays.webp'},source:`czm_material czm_getMaterial(czm_materialInput i){czm_material m=czm_getDefaultMaterial(i);vec3 photo=texture(image,i.st).rgb;m.diffuse=photo*.08;m.emission=photo*.75;m.shininess=32.;m.alpha=1.;return m;}`}});
 addFaces(viewer,g.glass.filter(f=>f.display!==undefined),displays,(f,u,v)=>{const aspect=f.width/f.height,photoAspect=.5,x=.5+(u-.5)*Math.min(1,aspect/photoAspect),y=.5+(v-.5)*Math.min(1,photoAspect/aspect);return [(f.display+.006+x*.988)/3,.006+y*.988];});
 return g;}
