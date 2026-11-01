import {Vector3} from 'three';import {Material} from 'cesium';import corners from '../public/data/west45-corners.json' with {type:'json'};import {WEST45} from './west45-config.js';import {DetailMesh} from './detail-mesh.js';import {addBatches,addFaces} from './street-details.js';import {architectureNightAppearance} from './architecture-lighting.js';
export const WEST45_CORNERS=[...WEST45.fronts.filter(f=>['row','construction'].includes(f.style)),...corners];
export function createWest45Corners(){const mesh=new DetailMesh(),glass=[],labels=[];let scaffoldPosts=0;
 for(const f of WEST45_CORNERS){const n=new Vector3(...f.normal),r=new Vector3(-n.y,n.x,0),c=new Vector3(...f.center),w=f.width,p=(x,y,z)=>c.clone().addScaledVector(r,x).addScaledVector(n,y).setZ(z),box=(x,y,z,a,d,h,col,solid=false)=>mesh.box(p(x,y,z),r,n,a,d,h,col,solid),face=(x,y,z,a,h,kind,target=labels)=>target.push({center:p(x,y,z),right:r,normal:n,width:a,height:h,kind});
 if(f.style==='construction'){
  // Concrete members stand proud of the dark unfinished source bays; retain source silhouette.
  const floors=[4.65,9.3,13.95].filter(z=>z<f.top+.1);for(const z of floors)box(0,.15,z,w,.65,.55,'#aaa99b');
  for(let x=-w/2+.18;x<w/2;x+=4.15){box(x,.14,(f.top+.18)/2,.44,.62,f.top-.18,'#b1b0a1');if(x+4.15<w/2){for(let z=4.65;z<f.top-2;z+=4.65)mesh.tube(p(x,.55,z),p(x+4.15,.55,Math.min(z+4.65,f.top)),.045,'#746e60');}}
  // Scaffold posts sit outside the construction fence; 2.9m clear walking headroom.
  for(let x=-w/2+.25;x<w/2;x+=2.6){box(x,1.7,1.52,.09,.09,3.04,'#959f9d',true);scaffoldPosts++;for(const z of [2.9,3.65])mesh.tube(p(x,1.7,z),p(Math.min(x+2.6,w/2),1.7,z),.035,'#9ba3a0');if(x+2.6<w/2)mesh.tube(p(x,1.7,3.6),p(x+2.6,1.7,2.9),.03,'#8b9590');}
  box(0,.88,3.15,w,2.05,.22,'#383d3c',true);box(0,.05,1.35,w,.10,2.55,'#233540');
  box(0,1.96,3.55,w,.12,.65,'#252b32');face(0,2.035,3.55,w-.16,.54,'chess');face(0,.13,1.6,Math.min(7,w-1),1.35,'suffolk');
  for(const x of [-w*.38,w*.38]){face(x,.14,.8,1,.62,'warning');box(x,2.5,.30,1.1,.35,.5,'#c76636',true);}
 }else{
  // No canopy or opaque retail fascia: two continuous glazed storeys wrap the corner.
  const count=Math.ceil(w/2.7),pitch=w/count;
  face(0,.05,5.2,w,10.1,'row',glass);
  for(let i=0;i<=count;i++)box(-w/2+i*pitch,.16,5.2,.055,.10,10.15,'#353e40');
  for(const z of [.22,5.1,10.3])box(0,.19,z,w,.18,z===10.3?.22:.075,'#555e5e');
  for(let i=0;i<count;i++){const x=-w/2+(i+.5)*pitch;if(i%3===1||i===count-1){box(x,.21,4.2,1.75,.05,1.75,'#172023');face(x,.25,4.2,1.65,1.65,'gifts');}if(i%4===0){box(x,.24,1.35,.035,.10,.44,'#b9beb7');}}
  // Pale corner/interval stone pilasters continue from the glass crown to the roof.
  for(const x of [-w/2+.22,w/2-.22]){box(x,.09,(f.top+10.4)/2,.42,.20,f.top-10.4,'#b2ae9c');}
 }
 }
 return {mesh,glass,labels,scaffoldPosts,faces:WEST45_CORNERS};}
export function cornerAtlas(){const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=512;const c=canvas.getContext('2d');for(let i=0;i<4;i++){const x=i*512;c.fillStyle=['#152023','#26303a','#27333d','#e6dfbc'][i];c.fillRect(x,0,512,512);c.textAlign='center';c.textBaseline='middle';if(i===0){c.fillStyle='#fff9e8';c.font='bold 130px Georgia';c.fillText('I',x+110,112);c.fillStyle='#ed2538';c.fillText('♥',x+290,112);c.fillStyle='#fff9e8';c.font='bold 160px Georgia';c.fillText('NY',x+256,277);c.font='bold 77px Georgia';c.fillText('GIFTS',x+256,422);}else if(i===1){c.fillStyle='#ba424f';c.font='66px Georgia';c.fillText('CHESS',x+256,156);c.fillStyle='#f4edda';c.font='bold 40px Arial';c.fillText('BOX OFFICE AHEAD',x+256,285,475);c.fillText('MAKE YOUR MOVE →',x+256,376,475);}else if(i===2){c.fillStyle='#bd3c3d';c.fillRect(x+220,130,260,160);c.fillStyle='#f4efe5';c.font='italic bold 78px Arial';c.fillText('SUFFOLK',x+256,213,455);c.font='26px Arial';c.fillText('AMERICA’S CONTRACTOR',x+256,352);c.fillText('CONSTRUCTION IN PROGRESS',x+256,412);}else{c.fillStyle='#383c37';c.font='bold 58px Arial';c.fillText('DANGER',x+256,170);c.font='35px Arial';c.fillText('CONSTRUCTION AREA',x+256,289,470);c.fillText('KEEP OUT',x+256,370);}}return canvas;}
export function addWest45Corners(viewer,collision){const g=createWest45Corners();addBatches(viewer,g.mesh.batches,false,false,architectureNightAppearance({frontNormal:WEST45.north,lights:[]}));collision.addStatic('west45-eighth-corners',new Float32Array(g.mesh.collision));
 const material=new Material({fabric:{type:'West45CornerLabels',uniforms:{image:Material.DefaultImageId},source:'czm_material czm_getMaterial(czm_materialInput i){czm_material m=czm_getDefaultMaterial(i);vec3 c=texture(image,i.st).rgb;m.diffuse=c*.25;m.emission=c*.55;m.alpha=1.;return m;}'}});material.uniforms.image=cornerAtlas();addFaces(viewer,g.labels,material,(f,u,v)=>[(['gifts','chess','suffolk','warning'].indexOf(f.kind)+.005+u*.99)/4,.005+v*.99]);
 const glazing=new Material({fabric:{type:'West45GiftShopGlass',uniforms:{image:'/storefronts/gap-displays.webp'},source:`czm_material czm_getMaterial(czm_materialInput i){czm_material m=czm_getDefaultMaterial(i);vec2 uv=i.st;float bay=floor(uv.x/2.7);vec2 cell=vec2(fract(uv.x/2.7),clamp((uv.y-.2)/3.3,0.,1.));vec3 display=texture(image,vec2((mod(bay,2.)+cell.x)/3.,cell.y)).rgb;float showroom=1.-smoothstep(3.3,3.6,uv.y);vec3 reflection=vec3(.12,.19,.22)+vec3(.065)*sin(uv.x*.4+uv.y*.7);vec3 color=mix(reflection,display*.65+reflection*.25,showroom);float ceiling=1.-smoothstep(.025,.09,abs(fract(uv.x/2.7)-.5));color+=vec3(.17,.15,.10)*ceiling*(1.-smoothstep(.1,.3,abs(uv.y-3.1)));m.diffuse=color*.35;m.emission=color*.48;m.specular=.35;m.shininess=65.;m.alpha=1.;return m;}`}});addFaces(viewer,g.glass,glazing,(f,u,v)=>[u*f.width,v*f.height]);return g;}
