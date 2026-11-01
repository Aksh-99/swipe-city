import {Vector3} from 'three';
import {DetailMesh} from './detail-mesh.js';
import {steelCylinder} from './curb-bollard-geometry.js';
import {PORT_AUTHORITY as T} from './port-authority-config.js';
const UP=new Vector3(0,0,1);

export function terminalAxes(f){
 const c=new Vector3(...f.center),n=new Vector3(...f.normal),r=new Vector3(-n.y,n.x,0);
 const p=(x,y,z)=>c.clone().addScaledVector(r,x).addScaledVector(n,y).setZ(z);
 return {c,n,r,p,at:(station,y,z)=>p(f.cornerEnd*(f.width/2-station),y,z)};
}
// Rectangular I-section steel, including projecting flanges. The diagonal
// members are actual relief, not a cross painted onto a replacement building.
function steelBeam(mesh,a,b,n,width=.32,depth=.36){
 const d=b.clone().sub(a).normalize(),depthAxis=Math.abs(n.dot(d))>.9?UP:n,across=new Vector3().crossVectors(depthAxis,d).normalize();
 function prism(center,w,h,color){
  const vertices=[];for(const p of [a,b])for(const [u,v]of [[-1,-1],[1,-1],[1,1],[-1,1]])vertices.push(p.clone().addScaledVector(across,center+u*w/2).addScaledVector(depthAxis,v*h/2));
  mesh.emit(vertices,[[0,2,1],[0,3,2],[4,5,6],[4,6,7],[0,1,5],[0,5,4],[1,2,6],[1,6,5],[2,3,7],[2,7,6],[3,0,4],[3,4,7]],color);
 }
 prism(0,width,.075,'#748080');prism(-width/2+.026,.052,depth,'#a3ada9');prism(width/2-.026,.052,depth,'#95a29f');
}

export function createPortAuthorityGeometry(){
 const mesh=new DetailMesh(),paving=new DetailMesh(),emissive=new DetailMesh(),glass=[],brick=[],labels=[],pools=[],routes=[],columns=[],canopies=[];
 const night={frontNormal:T.facades[0].normal,lights:[]};
 for(const f of T.facades){
  const {n,r,at}=terminalAxes(f),w=f.width;
  const box=(s,y,z,width,depth,height,color,solid=false)=>mesh.box(at(s,y,z),r,n,width,depth,height,color,solid);
  const face=(s,y,z,width,height,extra={})=>({center:at(s,y,z),normal:n,right:r,width,height,...extra});
  const north=f.id==='forty-second',south=f.id==='eighth-south',wrapWidth=south?0:north?27:24;
  const entry=north?47:south?28:43;
  // All layers are less than one metre off the verified original wall.
  glass.push(face(w/2,.08,17.55,w,16.96,{kind:1}),face(w/2,.12,4.59,w,8.64,{kind:0}));
  box(w/2,.18,.43,w,.24,.49,'#515d5c',true);
  for(const [z,d,h]of [[5.46,.34,.42],[8.97,.94,.54],[9.40,1.04,.23],[25.70,.57,.40],[26.07,.66,.15]])box(w/2,d/2,z,w,d,h,'#788581');
  box(w/2,.51,9.11,w,.18,.12,'#303d41');
  // Repetitive tinted concourse glazing and metal mullions.
  for(let s=.20;s<w;s+=1.67){box(s,.20,4.58,.07,.19,8.55,'#4b5d5e');if(s>wrapWidth)box(s,.21,17.55,.065,.22,16.30,'#45575d');}
  for(const z of [2.96,5.72,7.66,12.75,16.90,21.04,24.40])box(w/2,.22,z,w,.24,.09,'#64736f');
  const count=Math.ceil(w/8.0),bay=w/count;
  for(let j=0;j<=count;j++){
   const s=Math.min(w-.26,Math.max(.26,j*bay));
   if(s>wrapWidth+.2){
    steelBeam(mesh,at(s,.62,9.55),at(s,.62,25.62),n,.34,.43);
    for(const z of [9.85,17.58,25.28]){
     box(s,.89,z,.66,.075,.76,'#818e8b');
     for(const dx of [-.20,.20])for(const dz of [-.25,.25])mesh.tube(at(s+dx,.94,z+dz),at(s+dx,.984,z+dz),.035,'#bbc2b7',false,8);
    }
   }
   if(j<count){
    const a=Math.max(wrapWidth+.30,s+.12),b=(j+1)*bay-.24;
    if(b-a>3){steelBeam(mesh,at(a,.64,9.7),at(b,.64,25.48),n,.34,.42);steelBeam(mesh,at(a,.70,25.48),at(b,.70,9.7),n,.34,.42);}
   }
  }
  for(const z of [13.70,17.65,21.60])steelBeam(mesh,at(wrapWidth+.1,.78,z),at(w-.1,.78,z),n,.20,.25);

  // Large round brick supports and concrete capitals from the supplied view.
  for(let s=.72;s<w;s+=13.4){
   if(Math.abs(s-entry)<8.9)continue;
   const p=at(s,.63,.18),radius=.64,h=8.64;
   mesh.tube(p,p.clone().addScaledVector(UP,h),radius,'#534b46',true,20);
   for(let k=0;k<24;k++){
    const angle=k/24*Math.PI*2,next=(k+1)/24*Math.PI*2;
    const radial=a=>r.clone().multiplyScalar(Math.cos(a)).addScaledVector(n,Math.sin(a));
    const v=(a,z)=>p.clone().addScaledVector(radial(a),radius+.008).setZ(z);
    const nn=radial((angle+next)/2),rr=new Vector3(-nn.y,nn.x,0);
    brick.push({corners:[v(angle,.82),v(next,.82),v(next,8.34),v(angle,8.34)],center:p,normal:nn,right:rr,width:radius*2*Math.PI/24,height:7.52});
   }
   for(const [z,rad,h]of [[.49,.69,.62],[8.54,.73,.37],[8.79,.79,.18]])mesh.tube(at(s,.63,z-h/2),at(s,.63,z+h/2),rad,'#7e8580',false,24);
   columns.push({position:p,normal:n,radius,height:h,facade:f.id});
  }

  // Doors stay closed and solid; the covered pavement in front is walkable.
  box(entry,.18,2.35,13.9,.19,4.28,'#15252c',true);
  glass.push(face(entry,.29,2.34,13.65,4.1,{kind:2}));
  for(let i=0;i<8;i++){
   const s=entry+(i-3.5)*1.67;
   for(const dx of [-.81,0,.81])box(s+dx,.38,2.30,.055,.16,4.16,'#97a7a2');
   for(const dz of [.38,3.46,4.38])box(s,.39,dz,1.65,.17,.065,'#a2afa5');
   for(const dx of [-.14,.14])mesh.tube(at(s+dx,.53,1.05),at(s+dx,.53,1.89),.024,'#c5cdc2');
   labels.push(face(s,.485,2.45,.80,.18,{kind:'door',shade:.47}));
  }
  // Slim steel-and-glass canopy with exposed triangular ribs and hanger rods.
  const canopyWidth=17.8,reach=3.35;
  box(entry,reach/2,4.87,canopyWidth,reach,.15,'#455757',true);
  mesh.quad(at(entry-canopyWidth/2,.13,5.06),at(entry+canopyWidth/2,.13,5.06),at(entry+canopyWidth/2,reach,4.98),at(entry-canopyWidth/2,reach,4.98),'#72837c');
  for(let s=entry-canopyWidth/2;s<entry+canopyWidth/2+.01;s+=1.11){
   steelBeam(mesh,at(s,.1,4.73),at(s,reach,4.73),n,.085,.10);
   mesh.tube(at(s,.2,4.35),at(s,reach,4.72),.035,'#a5b0a6');
  }
  for(const s of [entry-7.8,entry-3.9,entry,entry+3.9,entry+7.8]){
   mesh.tube(at(s,.15,7.1),at(s,reach,4.98),.038,'#bbc4b9');
   emissive.box(at(s,1.72,4.75),r,n,1.6,.16,.035,'#b1b6a1');
  }
  box(entry,reach,4.84,canopyWidth,.16,.38,'#33464b');
  labels.push(face(entry,reach+.091,4.84,15.9,.26,{kind:'entrance',shade:.72}));
  labels.push(face(entry,.46,6.16,16.8,.78,{kind:'fascia',shade:.61}));
  canopies.push({facade:f.id,center:at(entry,1.7,0),width:canopyWidth,clearHeight:4.35});
  pools.push({center:at(entry,2.05,.184),normal:UP,right:r,up:n,width:19,height:4.1});
  night.lights.push({position:at(entry,1.0,4.4).toArray(),radius:[15,15,6],color:[.09,.094,.065]});

  if(!south){
   // Two printed faces meet at the actual source corner. Printed navy vinyl
   // is much dimmer than an LED screen; only the small floodlights glow.
   box(wrapWidth/2,.54,17.75,wrapWidth,.35,16.54,'#273443');
   labels.push(face(wrapWidth/2,.724,17.75,wrapWidth,16.50,{kind:north?'wrap-north':'wrap-east',shade:.48}));
   for(let s=1.0;s<wrapWidth;s+=3.5){
    mesh.tube(at(s,.50,9.33),at(s,1.18,9.44),.045,'#556563');
    box(s,1.18,9.53,.35,.32,.17,'#818981');
    emissive.box(at(s,1.21,9.63),r,n,.24,.21,.025,'#c4c6ac');
   }
   // Red-and-gold Carlo's Bake Shop lettering wraps the corner at street level.
   box(9.65,.32,3.85,17.8,.24,.99,'#743633');
   labels.push(face(9.65,.451,3.85,17.74,.91,{kind:'carlos',shade:.58}));
   for(let s=2.7;s<18;s+=3.2){
    glass.push(face(s,.27,1.85,2.96,2.54,{kind:3}));
    box(s,.36,.71,2.98,.19,.19,'#7c674c');
    for(const dx of [-1.49,1.49])box(s+dx,.40,1.9,.055,.13,2.57,'#9d936f');
   }
  }
  const signStation=south?45:north?65:59;
  box(signStation,.37,2.55,1.25,.32,2.85,'#2a3c44',true);
  labels.push(face(signStation,.539,2.55,1.08,2.58,{kind:'directory',shade:.63}));
  labels.push(face(signStation-3.8,.31,4.03,5.1,.89,{kind:'wayfinding',shade:.58}));
  if(north)labels.push(face(entry-13.5,.36,3.32,3.8,.94,{kind:'subway',shade:.68}));

  // Fill the strip between the historical shell and the curb. Joint lines
  // meet the existing OSM pavement, with a wide route behind the bollards.
  const paveLength=f.walkLength;
  for(let s=0;s<paveLength;s+=2.8){const t=Math.min(paveLength,s+2.8);
   paving.quad(at(s,.18,.176),at(t,.18,.176),at(t,4.60,.176),at(s,4.60,.176),'#7e898b',true);
   paving.quad(at(s,4.60,0),at(t,4.60,0),at(t,4.60,.176),at(s,4.60,.176),'#657379',true);
   mesh.tube(at(s,.3,.182),at(s,4.6,.182),.008,'#535f64',false,4);
  }
  routes.push({id:f.id,points:[at(2.1,2.80,.18),at(paveLength-1.4,2.80,.18)]});
 }
 // Chamfered corner apron closes the small gap between the perpendicular
 // pavement strips. Bollards stop short of the crossing and turning space.
 const ea=terminalAxes(T.facades[0]),na=terminalAxes(T.facades[1]);
 // A narrow folded seam closes the wrap between the two offset wall skins.
 // Without it, a diagonal view would expose the original wall at the corner.
 mesh.quad(ea.at(0,.728,9.5),na.at(0,.728,9.5),na.at(0,.728,26.0),ea.at(0,.728,26.0),'#293e72');
 const corner=new Vector3(...T.center),en=new Vector3(...T.facades[0].normal),nn=new Vector3(...T.facades[1].normal);
 const cap=[ea.at(0,.18,.176),ea.at(0,4.6,.176),corner.clone().addScaledVector(en,3.30).addScaledVector(nn,3.30).setZ(.176),na.at(0,4.6,.176),na.at(0,.18,.176)];
 paving.emit(cap,[[0,1,2],[0,2,3],[0,3,4]],'#7e898b',true);
 for(const item of T.bollards)steelCylinder(mesh,new Vector3(...item.position),new Vector3(...item.normal));
 const turn=corner.clone().addScaledVector(en,2.80).addScaledVector(nn,2.80).setZ(.18);
 routes.push({id:'corner',points:[ea.at(5,2.8,.18),ea.at(0,2.8,.18),turn,na.at(0,2.8,.18),na.at(5,2.8,.18)]});
 return {batches:mesh.batches,paving:paving.batches,emissive:emissive.batches,glass,brick,labels,pools,routes,columns,canopies,bollards:T.bollards,night,collision:new Float32Array([...mesh.collision,...paving.collision])};
}
