import {Vector3} from 'three';import {Material} from 'cesium';import {DetailMesh} from './detail-mesh.js';import {addBatches,addFaces} from './street-details.js';import {architectureNightAppearance} from './architecture-lighting.js';import {WEST45} from './west45-config.js';import corner from '../public/data/marriott-corner.json' with {type:'json'};
const KINDS=['marriott','nodumping'];
export function marriottReplacesFacade(f){if(f.street!=='Broadway')return false;return f.center[1]>15&&f.center[1]<45&&f.center[0]<-12;}
export function createMarriottReference(){const mesh=new DetailMesh(),glow=new DetailMesh(),labels=[],glass=[],photos=[],walkways=[],media=[];
 const main=WEST45.fronts.find(f=>f.id==='w45-18');
 const faces=[{...main,kind:'south'},...corner.fronts.slice(0,1).map(f=>({...f,kind:'east'}))];
 for(const f of faces){const c=new Vector3(...f.center),n=new Vector3(...f.normal),r=new Vector3(-n.y,n.x,0),p=(x,y,z)=>c.clone().addScaledVector(r,x).addScaledVector(n,y).setZ(z),box=(x,y,z,w,d,h,col,solid=false)=>mesh.box(p(x,y,z),r,n,w,d,h,col,solid),face=(x,y,z,w,h,kind,target=labels,extra={})=>target.push({center:p(x,y,z),normal:n,right:r,width:w,height:h,kind,...extra});
 if(f.kind==='south'){
  // Solid hotel podium with a continuous, recessed retail ribbon below.
  for(let x=-f.width/2+1.6;x<34;x+=3.3){face(x,.07,2.8,3.12,5.1,'glass',glass);for(const dx of [-1.62,1.62])box(x+dx,.18,2.8,.10,.18,5.3,'#454e4b');}
  for(const z of [.3,5.45])box(0,.20,z,f.width,.32,.18,'#6e776c');
  box(-26,1.1,3.9,18,2.35,.24,'#c2bda6',true);face(-26,2.3,4.24,17.7,.52,'marriott');
  for(let x=-33;x<-19;x+=1.35)glow.box(p(x,1.4,3.75),r,n,.13,.12,.035,'#f7e0ac');
  // Long high louvers replace the invented curtain wall on the blank podium.
  box(-17,.14,10.5,40,.22,3.2,'#262e2d');for(let x=-37;x<3;x+=.18)box(x,.29,10.5,.035,.06,3.17,'#72776c');
  
  // Contemporary wraparound display is fitted directly to the complete source front.
  for(let x=-f.width/2+3;x<f.width/2-3;x+=.5)walkways.push(p(x,3.6,.17));
 }else{
  // The Broadway faces are covered by the source-triangle retail and screen layer.

 }
 }
 // Loading equipment and covered cases stay on the Minskoff sidewalk side.
 const o=new Vector3(...WEST45.origin),e=new Vector3(...WEST45.east),N=new Vector3(...WEST45.north),q=(t,d,z)=>o.clone().addScaledVector(e,t).addScaledVector(N,d).setZ(z);
 for(const t of [218,221]){const c=q(t,-7.1,.9);mesh.box(c,e,N,2.0,.85,1.4,'#909991',true);for(const x of [-.85,.85])mesh.box(c.clone().addScaledVector(e,x),e,N,.06,.89,1.44,'#3f4949');labels.push({center:c.clone().addScaledVector(N,.46),normal:N,right:e,width:1.3,height:.64,kind:'nodumping'});}
 for(const t of [214,225]){const c=q(t,-4.8,.47);mesh.box(c,e,N,1.7,.08,.78,'#888e87',true);for(let x=-.7;x<.8;x+=.14)mesh.tube(c.clone().addScaledVector(e,x).setZ(.15),c.clone().addScaledVector(e,x).setZ(.85),.018,'#a7ada3');for(const dx of [-.65,.65])mesh.box(c.clone().addScaledVector(e,dx).setZ(.09),e,N,.45,.55,.07,'#777f7a',true);}
 for(const t of [215,220,225]){const c=q(t,-3.2,.03);mesh.box(c,e,N,.34,.34,.05,'#c66732');mesh.tube(c.clone().setZ(.06),c.clone().setZ(.68),.10,'#e87939',true,8);mesh.tube(c.clone().setZ(.34),c.clone().setZ(.45),.082,'#eee0b9',false,8);}
 return {mesh,glow,labels,glass,photos,walkways,media,faces};}
function campaignCanvas(kind){const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=1024;const c=canvas.getContext('2d'),text=(s,x,y,size,color='#f3e9c7',font='bold Arial',max=970)=>{c.fillStyle=color;c.font=font.replace(' ',` ${size}px `);c.textAlign='center';c.textBaseline='middle';c.fillText(s,x,y,max);};
 if(kind==='blue'){
 c.fillStyle='#075b9a';c.fillRect(0,0,1024,1024);c.strokeStyle='#1683ba';c.lineWidth=3;for(let y=0;y<1024;y+=9){c.beginPath();c.moveTo(0,y);c.lineTo(1024,y);c.stroke();}
 // The reference's Mr Peanut silhouette: brimmed hat, peanut head, monocle, smile and raised glove.
 c.strokeStyle='#172b35';c.lineWidth=12;c.fillStyle='#e4d07b';c.beginPath();c.moveTo(560,175);c.bezierCurveTo(435,130,455,355,510,420);c.bezierCurveTo(435,530,520,640,640,633);c.bezierCurveTo(765,638,803,498,729,417);c.bezierCurveTo(820,245,721,140,560,175);c.fill();c.stroke();
 c.fillStyle='#182b35';c.fillRect(490,57,260,151);c.beginPath();c.ellipse(621,205,195,36,-.04,0,Math.PI*2);c.fill();text('MR. PEANUT',621,143,33,'#f3edd7');
 c.fillStyle='#243840';for(const x of [552,690]){c.beginPath();c.ellipse(x,300,31,12,-.15,0,Math.PI*2);c.fill();}c.fillStyle='#eef2db';c.beginPath();c.ellipse(545,320,52,44,-.18,0,Math.PI*2);c.fill();c.stroke();c.beginPath();c.moveTo(623,320);c.lineTo(596,393);c.lineTo(640,401);c.stroke();c.beginPath();c.moveTo(548,445);c.bezierCurveTo(600,485,672,473,702,435);c.bezierCurveTo(652,533,587,529,548,445);c.fill();c.stroke();
 c.strokeStyle='#182e38';c.lineWidth=27;c.beginPath();c.moveTo(514,472);c.lineTo(424,529);c.lineTo(389,404);c.stroke();c.fillStyle='#f3efda';c.beginPath();c.ellipse(384,378,32,57,-.35,0,Math.PI*2);c.fill();c.stroke();c.fillStyle='#133b5b';c.fillRect(0,680,1024,344);text('PLANTERS',255,810,63,'#e8d77e','bold Georgia',420);
 }else if(kind==='unlimited'){c.fillStyle='#1b2d2a';c.fillRect(0,0,1024,1024);c.strokeStyle='#5a8971';c.lineWidth=5;for(let i=0;i<7;i++){c.beginPath();c.ellipse(650,400,210-i*12,260-i*14,.27,0,Math.PI*2);c.stroke();}text('UNLTD',470,370,200,'#d28c50','bold Arial',940);text('boost mobile',780,805,63);text('UNLIMITED POSSIBILITIES',470,924,30,'#b8ceba');}
 else if(kind==='planters'){const grad=c.createLinearGradient(0,0,0,1024);grad.addColorStop(0,'#16498d');grad.addColorStop(.5,'#4d3263');grad.addColorStop(1,'#e1c260');c.fillStyle=grad;c.fillRect(0,0,1024,1024);text('PLANTERS',512,170,150,'#f1d886','bold Georgia');text('Deluxe',512,340,120,'#e9c9c6','italic Georgia');text('Mixed Nuts',512,440,86);for(let i=0;i<25;i++){c.fillStyle=['#b98643','#e4b77c','#c49253'][i%3];c.beginPath();c.ellipse(70+(i*147%890),600+(i*71%300),60,29,i*.8,0,Math.PI*2);c.fill();}c.fillStyle='#f7f5d9';c.fillRect(620,735,375,248);text('SEA',808,807,95,'#1e2943','bold Arial',350);text('SALT',808,909,95,'#1e2943','bold Arial',350);}
 else{c.fillStyle=kind==='nodumping'?'#af3037':'#27312f';c.fillRect(0,0,1024,1024);if(kind==='sunglass'){text('sunglass hut',512,520,650,'#f5f2de','normal Arial');}else if(kind==='marriott'){text('Marriott',512,420,570,'#b7413c','bold Georgia');text('MARQUIS',512,805,210);}else{text('NO',512,250,180);text('DUMPING',512,515,140);text('GARBAGE',512,775,130);}}
 return canvas;}
export function addMarriottReference(viewer,collision){const g=createMarriottReference();addBatches(viewer,g.mesh.batches,false,false,architectureNightAppearance({frontNormal:WEST45.north,lights:[]}));addBatches(viewer,g.glow.batches);collision.addStatic('w45-marriott-reference',new Float32Array(g.mesh.collision));
 for(const kind of KINDS){const m=new Material({fabric:{type:'MarriottReference_'+kind,uniforms:{image:Material.DefaultImageId},source:'czm_material czm_getMaterial(czm_materialInput i){czm_material m=czm_getDefaultMaterial(i);vec3 color=texture(image,i.st).rgb;m.diffuse=color*.12;m.emission=color*.70;m.alpha=1.;return m;}'}});m.uniforms.image=campaignCanvas(kind);addFaces(viewer,g.labels.filter(f=>f.kind===kind),m,(f,u,v)=>[f.u0===undefined?u:f.u0+u*(f.u1-f.u0),v]);}
 const glass=new Material({fabric:{type:'MarriottReferenceShopGlass',source:'czm_material czm_getMaterial(czm_materialInput i){czm_material m=czm_getDefaultMaterial(i);vec2 uv=i.st;float glow=step(.91,fract(uv.x*2.4))*step(.6,uv.y);vec3 color=vec3(.025,.055,.064)+vec3(.14,.11,.065)*glow;m.diffuse=color*.4;m.emission=color*.6;m.specular=.18;m.shininess=40.;m.alpha=1.;return m;}'}});addFaces(viewer,g.glass,glass,(f,u,v)=>[u,v]);
 const photo=new Material({fabric:{type:'MarriottInsetVideo',uniforms:{image:'/billboards/portrait-atlas.webp'},source:'czm_material czm_getMaterial(czm_materialInput i){czm_material m=czm_getDefaultMaterial(i);m.diffuse=vec3(.005);m.emission=texture(image,i.st).rgb*.7;m.alpha=1.;return m;}'}});addFaces(viewer,g.photos,photo,(f,u,v)=>[(2+u)/4,v/2]);return g;}
