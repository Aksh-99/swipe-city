import {renderParamountCorner} from './paramount-corner-materials.js';
import {createParamountCartGeometry} from './paramount-corner-geometry.js';
import {renderVendorGeometry} from './street-vendors.js';
import {Material} from 'cesium';
import {addBatches,addFaces} from './street-details.js';
import {architectureNightAppearance} from './architecture-lighting.js';
import {createBroadwayRetailGeometry} from './broadway-retail-geometry.js';
const CELLS={harbor:[0,0,1536,128],crispy:[0,128,1536,128],stride:[0,256,1536,128],metro:[0,384,1536,128],coffee:[0,512,1536,128],tickets:[0,640,1536,128],books:[0,768,1536,128],studios:[0,896,1536,256],'ticket-room':[0,1152,1536,128],'studio-address':[0,1280,1536,128],kiosk:[0,1408,1536,128],'harbor-blade':[1536,0,512,1536],'harbor-badge':[1536,1536,512,512],hero:[0,1536,1536,512]};
export function broadwayRetailAtlas(){
 const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=2048;const c=canvas.getContext('2d');
 const text=(s,x,y,size,color='#f1e5bd',font='bold',family='Arial',max=1450)=>{c.fillStyle=color;c.font=`${font} ${size}px ${family}, ${family==='Georgia'?'serif':'sans-serif'}`;c.fillText(s,x,y,max);};c.textAlign='center';c.textBaseline='middle';
 for(const [kind,label,bg,color]of [['harbor','HARBOR SHRIMP CO.','#192d35','#f2d8a4'],['crispy','Crispy Co.  •  CHICKEN','#281e1b','#eadbbb'],['stride','STRIDE','#142c4d','#e4e4cf'],['metro','METRO GIFTS','#551d44','#f2e2e3'],['coffee','SQUARE COFFEE','#286248','#efe7d3'],['tickets','BROADWAY TICKETS','#25223c','#e7d9b0'],['books','CITY BOOKS','#3d2928','#eddfc4'],['studios','Broadway Studios','#172a36','#d9dcc8'],['ticket-room','PALLADIUM  •  TIMES SQUARE','#2b2037','#dec8db'],['studio-address','1515 BROADWAY','#192c32','#c8bc99'],['kiosk','TIMES SQUARE  /  NEW YORK','#203840','#bec9c7']]){
  const [x,y,w,h]=CELLS[kind];c.fillStyle=bg;c.fillRect(x,y,w,h);text(label,x+w/2,y+h*.53,h*(kind==='studios'?.58:.67),color,kind==='studios'?'italic bold':'bold',kind==='studios'?'Georgia':'Arial',w*.94);
  if(kind==='harbor'){c.strokeStyle='#b27245';c.lineWidth=3;c.strokeRect(x+5,y+5,w-10,h-10);for(let sx=x+12;sx<x+w;sx+=19){c.fillStyle='#e6c892';c.beginPath();c.arc(sx,y+9,2,0,Math.PI*2);c.arc(sx,y+h-9,2,0,Math.PI*2);c.fill();}}
  if(kind==='crispy'){c.strokeStyle='#b53739';c.lineWidth=7;c.strokeRect(x+4,y+4,w-8,h-8);}
 }
 // Original fictional round seafood seal, repeated on a red/blue corner LED.
 const seal=(x,y,r)=>{c.fillStyle='#294ba0';c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();c.strokeStyle='#ece4c7';c.lineWidth=r*.06;c.stroke();c.beginPath();c.arc(x,y,r*.82,0,Math.PI*2);c.lineWidth=r*.018;c.stroke();
  c.strokeStyle='#e7dbbd';c.lineWidth=r*.09;c.beginPath();c.arc(x,y-r*.16,r*.34,-.25,Math.PI*1.55);c.stroke();c.fillStyle='#e6d4ab';c.beginPath();c.moveTo(x+r*.21,y+r*.04);c.lineTo(x+r*.59,y+r*.09);c.lineTo(x+r*.30,y+r*.32);c.closePath();c.fill();
  text('HARBOR',x,y+r*.33,r*.28,'#eee2bf','bold','Arial',r*1.6);text('SHRIMP CO.',x,y+r*.61,r*.17,'#eee2bf','bold','Arial',r*1.45);
 };
 c.fillStyle='#c82f40';c.fillRect(1536,0,512,1536);c.fillStyle='#244793';c.fillRect(1677,0,230,1536);
 for(const y of [290,1030]){seal(1792,y,203);text('HARBOR SHRIMP',1792,y+291,56,'#f1e3ca','bold','Arial',470);text('SEAFOOD & GRILL',1792,y+366,41,'#f1e3ca','bold','Arial',450);}
 seal(1792,1792,241);
 // An original large theatrical poster, laid out for the wide podium screen.
 c.save();c.beginPath();c.rect(0,1536,1536,512);c.clip();const grad=c.createLinearGradient(0,1536,1536,2048);grad.addColorStop(0,'#f5cc58');grad.addColorStop(1,'#c98530');c.fillStyle=grad;c.fillRect(0,1536,1536,512);
 c.fillStyle='#242a3c';c.beginPath();c.arc(238,1758,155,0,Math.PI*2);c.fill();c.strokeStyle='#efc157';c.lineWidth=5;for(let i=0;i<9;i++){c.beginPath();c.arc(238,1790,30+i*16,Math.PI,Math.PI*2);c.stroke();}
 for(let i=0;i<19;i++){const x=i*86,h=40+(i*43%105);c.fillStyle='#292a39';c.fillRect(x,2048-h,58,h);c.fillStyle='#c28a3e';for(let yy=2048-h+15;yy<2040;yy+=18)c.fillRect(x+14,yy,8,7);}
 text('AFTER HOURS',977,1734,139,'#272b3b','bold','Georgia',1010);text('A NEW YORK MUSICAL',977,1854,50,'#323143','bold','Arial',994);text('THE CITY NEVER STOPS',977,1924,26,'#4a3938','bold','Arial',850);c.restore();
 return {canvas,cells:CELLS};
}
const mat=(type,body,uniforms={})=>new Material({fabric:{type,uniforms,source:`czm_material czm_getMaterial(czm_materialInput materialInput){vec2 uv=materialInput.st;czm_material m=czm_getDefaultMaterial(materialInput);m.diffuse=vec3(.003);${body}m.alpha=1.0;return m;}`}});
export function addBroadwayRetail(viewer,collision){
 const g=createBroadwayRetailGeometry();
 renderParamountCorner(viewer,g.paramount);
 renderVendorGeometry(viewer,collision,createParamountCartGeometry(),'paramount-corner-vendor');collision.addStatic('broadway-reference-retail',g.collision);
 addBatches(viewer,g.batches,false,false,architectureNightAppearance(g.night));addBatches(viewer,g.emissive);addBatches(viewer,g.paving,true);
 const glass=mat('BroadwayRetailNightGlass',`float stripe=smoothstep(.69,.84,fract(uv.x*.19+uv.y*.05));m.emission=mix(vec3(.018,.036,.045),vec3(.056,.087,.106),stripe);`);addFaces(viewer,g.glass,glass,(f,u,v)=>[u*f.width,v*f.height]);
 const windows=mat('BroadwayRestaurantWindows','float shade=floor(uv.x)/100.0;uv.x=fract(uv.x)/.98;m.emission=texture(image,uv).rgb*shade;', {image:'/storefronts/hard-rock-interiors.webp'});
 addFaces(viewer,g.windows.filter(f=>f.column<3),windows,(f,u,v)=>[Math.round(f.shade*100)+((f.column+.04+u*.92)/3)*.98,.015+v*.97]);
 const shoes=mat('BroadwayShoeWindows','m.emission=texture(image,uv).rgb*.40;', {image:'/storefronts/retail-interiors-atlas.webp'});addFaces(viewer,g.windows.filter(f=>f.column===3),shoes,(f,u,v)=>[(2.02+u*.96)/3,.01+v*.98]);
 const atlas=broadwayRetailAtlas(),signs=mat('BroadwayReferenceStoreSigns','float shade=floor(uv.x)/100.0;uv.x=fract(uv.x)/.98;vec4 t=texture(image,uv);if(t.a<.18)discard;m.emission=t.rgb*shade;',{image:Material.DefaultImageId});signs.uniforms.image=atlas.canvas;
 addFaces(viewer,[...g.labels,...g.hero.map(f=>({...f,kind:'hero',shade:.72}))],signs,(f,u,v)=>{const [x,y,w,h]=atlas.cells[f.kind];return [Math.round(f.shade*100)+((x+2+u*(w-4))/2048)*.98,(2048-y-h+2+v*(h-4))/2048];});
 for(const kind of ['portrait','landscape']){const cols=kind==='portrait'?4:2,m=mat('BroadwayReferenceAd'+kind,'m.emission=texture(image,uv).rgb*.68;', {image:kind==='portrait'?'/billboards/portrait-atlas.webp':'/billboards/atlas.webp'});addFaces(viewer,g.posters.filter(f=>f.atlas===kind),m,(f,u,v)=>[(f.art%cols+.004+u*.992)/cols,(1-Math.floor(f.art/cols)+.004+v*.992)/2]);}
 return {stores:7,facades:6,bollards:g.posts.length,kiosks:g.kiosks.length,ads:g.posters.length+g.hero.length,doors:g.doors.length};
}
