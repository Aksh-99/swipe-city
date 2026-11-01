import {Material} from 'cesium';
import {addBatches,addFaces} from './street-details.js';
import {architectureNightAppearance} from './architecture-lighting.js';
import {createStreetVendorGeometry} from './street-vendor-geometry.js';
import {STREET_VENDORS} from './street-vendor-config.js';

function hotDog(c,x,y,w){
 c.save();c.translate(x,y);c.scale(w/300,w/300);c.fillStyle='#101b263e';c.beginPath();c.ellipse(0,27,154,32,0,0,Math.PI*2);c.fill();
 const bun=c.createLinearGradient(0,-40,0,50);bun.addColorStop(0,'#f0ca78');bun.addColorStop(.4,'#d99b46');bun.addColorStop(1,'#9b5829');c.fillStyle=bun;
 c.beginPath();c.roundRect(-150,-35,300,77,38);c.fill();c.fillStyle='#633721';c.beginPath();c.roundRect(-130,-20,260,39,21);c.fill();
 const sausage=c.createLinearGradient(0,-18,0,19);sausage.addColorStop(0,'#df8c4b');sausage.addColorStop(.36,'#ad4d27');sausage.addColorStop(1,'#6a2c21');c.fillStyle=sausage;c.beginPath();c.roundRect(-138,-19,276,37,19);c.fill();
 c.strokeStyle='#f3ce3a';c.lineWidth=7;c.lineCap='round';c.beginPath();for(let i=0;i<=22;i++){const x=-120+i*11;i?c.lineTo(x,Math.sin(i*1.7)*9):c.moveTo(x,0);}c.stroke();
 c.fillStyle='#f5d78b';for(let i=0;i<25;i++){const x=-125+(i*61%250),y=22+(i%3)*4;c.save();c.translate(x,y);c.rotate(i*.6);c.fillRect(-2,-1,6,2);c.restore();}c.restore();
}
function nuts(c,x,y,scale){
 c.save();c.translate(x,y);c.scale(scale,scale);c.fillStyle='#a2552b';c.beginPath();c.moveTo(-66,25);c.lineTo(64,25);c.lineTo(15,137);c.closePath();c.fill();c.fillStyle='#cc995d';c.beginPath();c.moveTo(-66,25);c.lineTo(15,137);c.lineTo(-8,24);c.closePath();c.fill();
 for(let i=0;i<32;i++){const x=Math.sin(i*15.73)*62,y=Math.cos(i*8.17)*20+(i%5)*7;c.save();c.translate(x,y);c.rotate(i*.73);c.fillStyle=['#d7a95c','#ae7034','#e1bd72','#8d552b'][i%4];c.beginPath();c.ellipse(0,0,16,9,0,0,Math.PI*2);c.fill();c.strokeStyle='#79502866';c.lineWidth=1;c.beginPath();c.moveTo(-9,-2);c.quadraticCurveTo(0,3,9,-2);c.stroke();c.restore();}c.restore();
}
function cartAtlas(labels){
 const image=document.createElement('canvas'),rows=Math.ceil(labels.length/4),cell=256;image.width=cell*4;image.height=cell*rows;const c=image.getContext('2d');
 labels.forEach((f,i)=>{
  const left=i%4*cell,top=Math.floor(i/4)*cell,w=cell*f.width/f.height;
  c.save();c.beginPath();c.rect(left,top,cell,cell);c.clip();c.translate(left,top);c.scale(cell/w,1);c.textAlign='center';
  const text=(label,y,size=40,color='#f5efcc',max=w-22)=>{c.fillStyle=color;c.font=`bold ${size}px Arial`;c.fillText(label,w/2,y,max);};
  const blue=f.scheme==='blue-yellow';
  c.fillStyle=f.kind.startsWith('nuts')?'#dfcb72':blue?'#164f86':'#a6382c';c.fillRect(0,0,w,256);
  if(f.kind==='food-item'){
   c.fillStyle='#17282d';c.fillRect(0,0,w,256);c.strokeStyle='#d2bd58';c.lineWidth=4;c.strokeRect(3,3,w-6,250);
   text(['CHICKEN + RICE','GYRO PITA','HOT DOG + FRIES','GRILLED KEBAB'][f.art],240,24,'#f2df97',w-14);
  }else if(f.kind==='grill-heading'||f.kind==='kiosk-heading'){
   c.fillStyle=f.kind==='grill-heading'?'#24454a':'#185384';c.fillRect(0,0,w,256);
   text(f.kind==='grill-heading'?'HALAL  •  CHICKEN  •  GYRO  •  RICE':'COLD DRINKS  •  SNACKS',177,140,'#f1df9b',w-50);
  }else if(f.kind==='grill-apron'||f.kind==='kiosk-apron'){
   c.fillStyle=f.kind==='grill-apron'?'#173c3d':'#1d5685';c.fillRect(0,0,w,256);c.strokeStyle='#d8c76b';c.lineWidth=6;c.strokeRect(7,7,w-14,242);
   text(f.kind==='grill-apron'?'NEW YORK HALAL GRILL':'TIMES SQUARE',93,67,'#f4e9bd');
   text(f.kind==='grill-apron'?'CHICKEN • LAMB • KEBAB':'COLD DRINKS',169,58,'#dfd090');
   text(f.kind==='grill-apron'?'FRESH FROM THE GRILL':'WATER • SODA • SNACKS',228,26,'#d8e5df');
  }else if(f.kind==='grill-board'){
   c.fillStyle='#1b3335';c.fillRect(0,0,w,256);text('HALAL',51,35,'#ead796');text('GRILL',96,36,'#ead796');text('CHICKEN',147,23);text('OVER RICE',179,23);text('GYRO • FALAFEL',232,16);
  }else if(f.kind.endsWith('valance')){
   c.fillStyle=f.kind==='nuts-valance'?'#d6d0b9':blue?'#dbb931':'#c24c35';c.fillRect(0,0,w,256);
   c.fillStyle=f.kind==='nuts-valance'?'#a53228':blue?'#1d5687':'#ead28b';c.font='italic bold 178px Arial';c.fillText(f.kind==='nuts-valance'?'NUTS 4 NUTS':blue?'SABRETT':'NEW YORK HOT DOGS',w/2,188,w-58);
  }else if(f.kind.endsWith('heading')){
   c.fillStyle=f.kind==='nuts-heading'?'#8e2c27':'#15334e';c.fillRect(0,0,w,256);text(f.kind==='nuts-heading'?'HONEY ROASTED':'HOT DOGS  •  PRETZELS  •  DRINKS',179,147,'#eed393',w-70);
  }else if(f.kind==='hotdog-apron'||f.kind==='hotdog-side'){
   c.strokeStyle='#e8c35d';c.lineWidth=7;c.strokeRect(8,8,w-16,240);text('NEW YORK',48,29,'#e0c472');text('HOT DOGS',113,72,'#fff0bf');hotDog(c,w/2,170,w*.71);text('PRETZELS  ·  COLD DRINKS',238,21,'#e6d8a2');
  }else if(f.kind==='nuts-apron'||f.kind==='nuts-side'){
   c.fillStyle='#a2362d';c.fillRect(0,0,w,67);text('HONEY ROASTED',50,45,'#f4ddb3');text('NUTS 4 NUTS',121,58,'#983126');nuts(c,w/2,155,.49);text('FRESH • WARM • CRUNCHY',242,23,'#4f3c2b');
  }else if(f.kind==='hotdog-menu'){
   c.fillStyle='#e9c43d';c.fillRect(0,0,w,256);text('HOT DOG',34,27,'#193851');text('$5',130,95,'#a5312b');hotDog(c,w/2,172,w*.87);text('NEW YORK',231,23,'#193851');
  }else if(f.kind==='drink-menu'){
   c.fillStyle='#e4cf76';c.fillRect(0,0,w,256);text('COLD',35,28,'#18446a');text('DRINKS',69,28,'#18446a');
   c.fillStyle='#5997b6';c.beginPath();c.roundRect(w/2-24,102,48,91,10);c.fill();c.fillStyle='#e2dfc5';c.fillRect(w/2-22,131,44,31);c.fillStyle='#2b5997';c.fillRect(w/2-14,87,28,16);text('$3',242,45,'#a13829');
  }else if(f.kind==='nuts-menu'){
   c.fillStyle='#e2c344';c.fillRect(0,0,w,256);text('$2',81,87,'#bf3629');text('PEANUTS',112,24,'#604122');text('3 FOR $5',159,37,'#b53728');text('CASHEWS',202,22,'#665222');text('PECANS',233,24,'#665222');
  }else if(f.kind==='no-standing'){
   c.fillStyle='#a63739';c.fillRect(0,0,w,256);c.strokeStyle='#e6e2d0';c.lineWidth=5;c.strokeRect(6,6,w-12,244);text('NO',59,39,'#eee9d9');text('STANDING',103,31,'#eee9d9');text('ANYTIME',150,31,'#eee9d9');
   c.strokeStyle='#eee9d9';c.lineWidth=7;c.beginPath();c.moveTo(w*.22,206);c.lineTo(w*.78,206);c.lineTo(w*.63,191);c.moveTo(w*.78,206);c.lineTo(w*.63,221);c.stroke();
  }else if(f.kind==='bin-poster'){
   const palettes=[['#122e44','#4291a3'],['#163d48','#428573'],['#1e374d','#7b8eb0']],colors=palettes[f.art],g=c.createLinearGradient(0,0,w,256);g.addColorStop(0,colors[0]);g.addColorStop(1,colors[1]);c.fillStyle=g;c.fillRect(0,0,w,256);
   for(let j=0;j<12;j++){c.fillStyle=j%2?'#12283988':'#aad8c120';const h=30+(j*41%95);c.fillRect(j*w/12,240-h,w/13,h);}
   text('KEEP',55,31,'#f2e7c8');text('TIMES SQUARE',94,26,'#f2e7c8');text('CLEAN',149,52,'#f4edd2');text('A LITTLE CARE',191,18,'#d2e8dc');text('GOES A LONG WAY',215,15,'#d2e8dc');
  }else if(f.kind.startsWith('bin-')){
   c.fillStyle=f.kind==='bin-bottles'?'#246894':f.kind==='bin-paper'?'#387b54':'#344c43';c.fillRect(0,0,w,256);text(f.kind==='bin-bottles'?'CANS + BOTTLES':f.kind==='bin-paper'?'PAPER':'TRASH',171,105,'#e6eadb',w-38);
  }
  c.restore();
 });return {image,rows};
}

export function renderVendorGeometry(viewer,collision,g,id){
 const atlas=cartAtlas(g.labels),indices=new Map(g.labels.map((f,i)=>[f,i]));
 addBatches(viewer,g.paving,true);
 addBatches(viewer,g.batches,false,false,architectureNightAppearance(g.night));
 addBatches(viewer,g.emissive);addBatches(viewer,g.shadow,false,true);
 collision.addStatic(id,g.collision);
 // Cesium caches a Fabric by type and deep-clones it on the next use. Keep
 // DOM canvases out of that template: cloning HTMLCanvasElement throws and
 // previously aborted startup before the recruiting station was created.
 const signs=new Material({fabric:{type:'TimesSquareVendorMenus',uniforms:{image:Material.DefaultImageId},source:`czm_material czm_getMaterial(czm_materialInput materialInput){czm_material m=czm_getDefaultMaterial(materialInput);m.diffuse=vec3(.004);m.emission=texture(image,materialInput.st).rgb*.53;m.alpha=1.0;return m;}`}});
 signs.uniforms.image=atlas.image;
 addFaces(viewer,g.labels,signs,(f,u,v)=>{const i=indices.get(f);return [(i%4+.006+u*.988)/4,(atlas.rows-1-Math.floor(i/4)+.006+v*.988)/atlas.rows];});
 if(g.photoMenus?.length){
  const photos=new Material({fabric:{type:'TimesSquareFoodPhotos',uniforms:{image:'/storefronts/food-menu-photos.webp'},source:`czm_material czm_getMaterial(czm_materialInput materialInput){czm_material m=czm_getDefaultMaterial(materialInput);m.diffuse=vec3(.004);m.emission=texture(image,materialInput.st).rgb*.55;m.alpha=1.0;return m;}`}});
  addFaces(viewer,g.photoMenus,photos,(f,u,v)=>[(f.art%2+.008+u*.984)/2,(1-Math.floor(f.art/2)+.008+v*.984)/2]);
 }
 const glass=new Material({fabric:{type:'TimesSquareVendorGlass',source:`czm_material czm_getMaterial(czm_materialInput materialInput){vec2 uv=materialInput.st;float shine=smoothstep(.61,.89,fract(uv.x+uv.y*.45));czm_material m=czm_getDefaultMaterial(materialInput);m.diffuse=vec3(.015);m.emission=vec3(.11,.19,.22)+shine*vec3(.10,.16,.18);m.alpha=.13+shine*.07;return m;}`},translucent:true});
 addFaces(viewer,g.glass,glass,(f,u,v)=>[u,v],true);
 const light=new Material({fabric:{type:'TimesSquareVendorLightPools',source:`czm_material czm_getMaterial(czm_materialInput materialInput){vec2 p=materialInput.st-.5;czm_material m=czm_getDefaultMaterial(materialInput);m.diffuse=vec3(.01);m.emission=vec3(.92,.73,.42);m.alpha=exp(-dot(p,p)*14.0)*.095;return m;}`},translucent:true});
 addFaces(viewer,g.pools,light,(f,u,v)=>[u,v],true);
}

export function addStreetVendors(viewer,collision){
 const g=createStreetVendorGeometry();renderVendorGeometry(viewer,collision,g,'nasdaq-street-vendors');
 return {hotDogCarts:STREET_VENDORS.carts.filter(c=>c.kind==='hotdog').length,nutCarts:STREET_VENDORS.carts.filter(c=>c.kind==='nuts').length,silverBollards:g.posts.length,recyclingBins:STREET_VENDORS.bins.length,signalPole:STREET_VENDORS.pole.id};
}
