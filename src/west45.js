import {addWest45Corners} from './west45-corners.js';
import {Vector3} from 'three';
import {Material} from 'cesium';
import {DetailMesh} from './detail-mesh.js';
import {addBatches,addFaces} from './street-details.js';
import {WEST45} from './west45-config.js';
import {architectureNightAppearance} from './architecture-lighting.js';
const STYLE={row:['I ♥ NY GIFTS','#c63b30'],golden:['GOLDEN','#c89a27'],jacobs:['JACOBS','#164e9a'],schoenfeld:['SCHOENFELD','#a42c28'],booth:['BOOTH • PROOF','#e8dfc5'],construction:['SUFFOLK • SIDEWALK OPEN','#194b3e'],imperial:['IMPERIAL THEATRE','#232b32'],musicbox:['MUSIC BOX','#e9e2d0'],marriott:['NEW YORK MARRIOTT MARQUIS','#7e282b'],juniors:["Junior’s • RESTAURANT & BAKERY",'#ed893d']};
export function createWest45Geometry(){
 const mesh=new DetailMesh(),labels=[],photos=[];let canopies=0,blades=0;
 for(const f of WEST45.fronts){
  if(['row','construction','marriott'].includes(f.style))continue;
  const n=new Vector3(...f.normal),r=new Vector3(-n.y,n.x,0),c=new Vector3(...f.center),w=f.width;
  const p=(x,y,z)=>c.clone().addScaledVector(r,x).addScaledVector(n,y).setZ(z);
  const box=(x,y,z,a,b,h,color,solid=false)=>mesh.box(p(x,y,z),r,n,a,b,h,color,solid);
  const face=(x,y,z,a,h,kind,target=labels)=>target.push({center:p(x,y,z),right:r,normal:n,width:a,height:h,kind});
  const [title,color]=STYLE[f.style];
  // Every band follows the surveyed source wall width; no floating full-height panels.
  for(const z of [5.5,Math.min(f.top-.22,10.8)])if(z>5.6||z===5.5)box(0,.10,z,w,.32,.22,'#c4b8a3');
  if(w<5)continue;
  if(f.style==='construction'){
   for(let x=-w/2+.3;x<w/2;x+=3){box(x,1.65,1.65,.10,.10,3.3,'#818a88',true);mesh.tube(p(x,1.65,3),p(Math.min(x+3,w/2),1.65,2.4),.035,'#77817e');}
   box(0,.8,3.35,w,2.1,.22,'#164b3b',true);box(0,.25,2,w,.14,2,'#214c3e');face(0,.34,2,w*.8,.8,f.style);canopies++;continue;
  }
  const theatre=['golden','jacobs','schoenfeld','booth','imperial','musicbox'].includes(f.style);
  const canopy=theatre?Math.min(w-1,15):Math.min(w-1,f.style==='marriott'?23:18);
  box(0,.72,3.45,canopy,1.75,.36,theatre?'#282e31':color,true);
  box(0,1.62,3.65,canopy,.13,.75,color);face(0,1.70,3.65,canopy-.16,.64,f.style);canopies++;
  for(let x=-canopy/2+.24;x<canopy/2;x+=.48)box(x,1.72,3.27,.07,.06,.07,'#ffe1a2');
  // Framed ground-floor doors and photographic display bays.
  for(let x=-w/2+1.35;x<w/2-1;x+=2.8){box(x,.05,1.65,2.45,.12,2.8,'#14232a');for(const dx of [-1.24,0,1.24])box(x+dx,.16,1.65,.065,.12,2.9,'#acaaa0');if(f.style==='row')face(x,.19,1.75,2.25,2.45,f.style,photos);else{box(x,.18,1.2,.055,.10,.42,'#d5c7a2');}}
  if(theatre){
   for(let x=-w/2+1.4;x<w/2-1;x+=3.1){const z=Math.min(8.1,f.top-2);box(x,.11,z,1.6,.12,2.5,'#263a45');for(const dx of [-.9,.9])box(x+dx,.20,z,.18,.34,2.9,'#d2c4ad');for(let a=0;a<12;a++){const q=a*Math.PI/11;box(x+Math.cos(q)*.9,.20,z+1.23+Math.sin(q)*.6,.22,.35,.21,'#d2c4ad');}}
   if(w>16){const x=w*.31,z=Math.min(9,f.top-1.8);box(x,1.25,z,.85,2.5,4.1,color);const bn=r.clone(),br=n.clone().negate();labels.push({center:p(x+.46,1.25,z),right:br,normal:bn,width:2.35,height:3.95,kind:f.style});blades++;}
   if(f.style==='jacobs'||f.style==='schoenfeld'){for(const z of [6.1,9.2]){box(-w*.35,.7,z,3,1.1,.12,'#303538');for(let x=-w*.35-1.4;x<-w*.35+1.5;x+=.35)box(x,1.2,z+.45,.035,.035,.9,'#353a3c');}}
  }
  if(f.style==='juniors'){for(let x=-w/2+.3;x<w/2;x+=.6)box(x,.85,3.06,.30,1.8,.15,'#f6dcb3');}
  if(f.style==='marriott'||f.style==='juniors')for(const x of [-w/2+1,w/2-1]){box(x,.95,.42,1.3,1.1,.7,'#64645c',true);for(let a=0;a<9;a++){const q=a*2.4;mesh.tube(p(x,.95,.65),p(x+Math.cos(q)*.48,.95+Math.sin(q)*.35,1.2+a%3*.25),.13,'#41613d');}}
 }
 return {mesh,labels,photos,canopies,blades,fronts:WEST45.fronts.length};
}
export function west45Atlas(){const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=1024;const c=canvas.getContext('2d');Object.entries(STYLE).forEach(([key,[title,bg]],i)=>{const x=i%4*512,y=Math.floor(i/4)*256;c.fillStyle=bg;c.fillRect(x,y,512,256);c.strokeStyle='#d9c9a4';c.lineWidth=5;c.strokeRect(x+8,y+8,496,240);c.fillStyle=key==='booth'||key==='musicbox'?'#282a29':'#fff3d4';c.textAlign='center';c.textBaseline='middle';c.font=key==='juniors'?'italic bold 60px Georgia':'bold 48px Georgia';c.fillText(title,x+256,y+106,470);c.font='22px Arial';c.fillText(key==='schoenfeld'?'BUENA VISTA SOCIAL CLUB':key==='row'?'SOUVENIRS • NEW YORK CITY':key==='marriott'?'HOTEL ENTRANCE • BROADWAY':key==='juniors'?'CHEESECAKE • NEW YORK':key==='construction'?'CONSTRUCTION IN PROGRESS':'BROADWAY • WEST 45TH STREET',x+256,y+178,465);});return canvas;}
export function addWest45(viewer,collision){const g=createWest45Geometry();g.corners=addWest45Corners(viewer,collision);addBatches(viewer,g.mesh.batches,false,false,architectureNightAppearance({frontNormal:WEST45.north,lights:[]}));collision.addStatic('west45-reference-frontages',new Float32Array(g.mesh.collision));
 const signs=new Material({fabric:{type:'West45ReferenceSigns',uniforms:{image:Material.DefaultImageId},source:'czm_material czm_getMaterial(czm_materialInput i){czm_material m=czm_getDefaultMaterial(i);m.diffuse=texture(image,i.st).rgb*.25;m.emission=texture(image,i.st).rgb*.55;m.alpha=1.0;return m;}'}});signs.uniforms.image=west45Atlas();addFaces(viewer,g.labels,signs,(f,u,v)=>{const i=Object.keys(STYLE).indexOf(f.kind);return [(i%4+.01+u*.98)/4,(3-Math.floor(i/4)+.01+v*.98)/4];});
 const photos=new Material({fabric:{type:'West45StoreDisplays',uniforms:{image:'/storefronts/retail-interiors-atlas.webp'},source:'czm_material czm_getMaterial(czm_materialInput i){czm_material m=czm_getDefaultMaterial(i);m.diffuse=texture(image,i.st).rgb*.35;m.emission=texture(image,i.st).rgb*.30;m.alpha=1.0;return m;}'}});addFaces(viewer,g.photos,photos,(f,u,v)=>[(1+u)/3,v]);return g;
}
