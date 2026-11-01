import {Vector3} from 'three';import {Material} from 'cesium';import {SHUBERT} from './shubert-config.js';import {WEST45} from './west45-config.js';import {DetailMesh} from './detail-mesh.js';import {addBatches,addFaces} from './street-details.js';import {architectureNightAppearance} from './architecture-lighting.js';
export function createShubertGeometry(){const mesh=new DetailMesh(),bulbs=new DetailMesh(),labels=[],windows=[],posters=[],bollards=[];let tables=0;
 for(const f of SHUBERT.fronts){const c=new Vector3(...f.center),n=new Vector3(...f.normal),r=new Vector3(-n.y,n.x,0),w=f.width,p=(x,y,z)=>c.clone().addScaledVector(r,x).addScaledVector(n,y).setZ(z),box=(x,y,z,a,d,h,col,solid=false)=>mesh.box(p(x,y,z),r,n,a,d,h,col,solid),face=(x,y,z,a,h,kind,target=labels)=>target.push({center:p(x,y,z),right:r,normal:n,width:a,height:h,kind});
 if(f.kind==='theatre'){
  // Deep bronze side canopy, dentils, warm recessed downlights and poster frames.
  box(0,1.2,4.35,w,2.65,.28,'#39362c',true);box(0,2.53,4.64,w,.15,.58,'#514634');
  for(const z of [4.38,4.91])box(0,2.57,z,w,.22,.08,'#a38c5e');
  for(let x=-w/2+.2;x<w/2;x+=.38)box(x,2.59,4.84,.13,.08,.13,'#8c7953');
  for(let x=-w/2+.75;x<w/2;x+=2.3){bulbs.box(p(x,1.8,4.19),r,n,.12,.12,.035,'#ffe3b0');box(x,.1,.55,1.5,.18,.8,'#393d36');}
  for(let x=-w/2+1.4;x<w/2-1;x+=2.0){box(x,.14,2.1,1.56,.16,2.40,'#322e27');box(x,.24,2.1,1.40,.08,2.24,'#b09456');face(x,.30,2.1,1.30,2.14,posters.length%6,posters);}
  // Rusticated stone portals and moulded bands on the full theatre side wall.
  for(let x=-w/2+.28;x<w/2;x+=8){box(x,.16,7.4,.65,.42,14.25,'#b6aa90');for(let z=.7;z<14.3;z+=.55)box(x,.21,z,.78,.47,.065,'#d1c3a6');}
  for(const z of [5.3,12.8,14.8])box(0,.15,z,w,.34,.18,'#bcae92');
  for(let x=-w/2+.3;x<w/2;x+=.5)box(x,.26,14.52,.20,.38,.21,'#b7a98e');
  face(w*.20,.34,3.8,3.5,.42,'engagement');
 }else{
  const terrace=f.d0>-30,storeH=5.7;
  for(let x=-w/2+1.2;x<w/2-1;x+=2.5){windows.push({center:p(x,.10,2.7),normal:n,right:r,width:2.34,height:5.0});for(const dx of [-1.22,1.22])box(x+dx,.20,2.7,.08,.15,5.1,'#655e4c');face(x,.25,2.4,.95,.50,'oval');}
  box(0,.95,5.7,w,2.12,.20,'#a49577',true);face(0,2.05,5.98,w-.15,.55,'restaurant');
  if(terrace){box(0,1.04,.26,w,2.25,.20,'#6e5945',true);box(0,2.18,.72,w,.10,.82,'#ee8b4b',true);
   for(let x=-w/2+.1;x<w/2;x+=.55)box(x,2.24,.72,.11,.045,.80,'#f6e1b9');
   for(const z of [.35,1.18])box(0,2.25,z,w,.10,.075,'#243235');
   for(let x=-w/2+.15;x<w/2;x+=1.5)box(x,2.25,.78,.06,.08,1.12,'#263438',true);
   for(let x=-w/2+1.25;x<w/2-1;x+=2.9){const pos=p(x,1.1,.77);mesh.tube(p(x,1.1,.35),pos,.05,'#333b3a',true);box(x,1.1,.79,.80,.63,.075,'#9e7660',true);tables++;
    for(const dx of [-.63,.63]){box(x+dx,1.1,.51,.41,.42,.055,'#e78445');for(const yy of [-.17,.17])for(const xx of [-.16,.16])mesh.tube(p(x+dx+xx,1.1+yy,.3),p(x+dx+xx,1.1+yy,.5),.018,'#343e3b');box(x+dx,1.3,.74,.42,.05,.38,'#ed8b4d');}}
  }
 }
 }
 const o=new Vector3(...WEST45.origin),e=new Vector3(...WEST45.east),n=new Vector3(...WEST45.north),q=(t,d,z)=>o.clone().addScaledVector(e,t).addScaledVector(n,d).setZ(z);
 // The brass row marks the north entrance while leaving a clear central gap.
 for(const t of [156.6,158.1,162.3,164.0]){const p=q(t,-10.2,.17);mesh.tube(p,p.clone().setZ(1.23),.075,'#ae9255',true,12);mesh.tube(p.clone().setZ(1.23),p.clone().setZ(1.28),.077,'#d0b471',false,12);bollards.push(p.toArray());}
 for(const [a,b]of [[156.6,158.1],[162.3,164.]]){let prior=q(a,-10.2,1.01);for(let i=1;i<=12;i++){const s=i/12,next=q(a+(b-a)*s,-10.2,1.01-Math.sin(s*Math.PI)*.19);mesh.tube(prior,next,.014,'#b5b0a0',false,6);prior=next;}}
 // Pedestrian paving follows the mapped alley; small blocks avoid street-wide overlays.
 for(let d=-12;d>-70;d-=1.2){mesh.quad(q(158.3,d,.176),q(161.6,d,.176),q(161.6,d-1.16,.176),q(158.3,d-1.16,.176),'#686b66');}
 return {mesh,bulbs,labels,windows,posters,bollards,tables};}
const titles=['PROOF','CHICAGO','THE LION KING','BUENA VISTA','BROADWAY','THEATRE'];
export function shubertAtlas(){const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=1024;const c=canvas.getContext('2d');const entries=['restaurant','oval','engagement',...titles];entries.forEach((name,i)=>{const x=i%4*512,y=Math.floor(i/4)*320;c.fillStyle=i===0?'#43483e':i===1?'#b7432e':i===2?'#722b30':['#d4cbaa','#9d2628','#c29539','#a73c27','#254954','#4c334f'][(i-3)%6];c.fillRect(x,y,512,320);c.textAlign='center';c.textBaseline='middle';c.strokeStyle='#d3b17a';c.lineWidth=4;c.strokeRect(x+9,y+9,494,302);c.fillStyle='#fff0ce';if(i<3){c.font=i===1?'italic bold 86px Georgia':'bold 43px Arial';c.fillText(i===0?'Junior’s RESTAURANT':i===1?'Junior’s':'STRICTLY LIMITED',x+256,y+125,477);c.font='35px Arial';c.fillText(i===0?'BAKERY • CHEESECAKE':i===1?'NEW YORK':'ENGAGEMENT',x+256,y+215,470);}else{c.save();c.translate(x+256,y+133);c.fillStyle='rgba(22,20,15,.55)';c.beginPath();for(let j=0;j<12;j++){const a=j*Math.PI/6,rr=j%2?50:88;c.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);}c.closePath();c.fill();c.restore();c.font='bold 56px Georgia';c.fillText(name,x+256,y+221,470);c.font='18px Arial';c.fillText('LIVE ON BROADWAY',x+256,y+282,460);}});return canvas;}
export function addShubertAlley(viewer,collision){const g=createShubertGeometry();addBatches(viewer,g.mesh.batches,false,false,architectureNightAppearance({frontNormal:WEST45.east,lights:[{position:SHUBERT.fronts[0].center.map((v,i)=>i===2?4:v),radius:[55,55,10],color:[.20,.17,.12]}]}));addBatches(viewer,g.bulbs.batches);collision.addStatic('shubert-alley-reference',new Float32Array(g.mesh.collision));
 const signs=new Material({fabric:{type:'ShubertAlleySigns',uniforms:{image:Material.DefaultImageId},source:'czm_material czm_getMaterial(czm_materialInput i){czm_material m=czm_getDefaultMaterial(i);vec3 color=texture(image,i.st).rgb;m.diffuse=color*.30;m.emission=color*.42;m.alpha=1.;return m;}'}});signs.uniforms.image=shubertAtlas();const uv=(id,u,v)=>[(id%4+.01+u*.98)/4,(1024-(Math.floor(id/4)*320+320)+3+v*314)/1024];addFaces(viewer,g.labels,signs,(f,u,v)=>uv(['restaurant','oval','engagement'].indexOf(f.kind),u,v));addFaces(viewer,g.posters,signs,(f,u,v)=>uv(3+f.kind,u,v));
 const glass=new Material({fabric:{type:'ShubertJuniorsWindows',uniforms:{image:'/storefronts/hard-rock-interiors.webp'},source:'czm_material czm_getMaterial(czm_materialInput i){czm_material m=czm_getDefaultMaterial(i);vec3 photo=texture(image,i.st).rgb;m.diffuse=mix(vec3(.08,.12,.14),photo,.36);m.emission=photo*.21;m.specular=.18;m.shininess=40.;m.alpha=1.;return m;}'}});addFaces(viewer,g.windows,glass,(f,u,v)=>[u*.49,v]);return g;}
