import {Vector3,Vector2,ShapeUtils} from 'three';
import {DetailMesh} from './detail-mesh.js';
import {entranceAxes,entrancePoint} from './ground-cutouts.js';
import {SUBWAY_ENTRANCES,SCAFFOLDS,STREET_LAMPS} from './streetscape-config.js';
const UP=new Vector3(0,0,1),X=new Vector3(1,0,0),Y=new Vector3(0,1,0);
const face=(center,normal,width,height,extra={})=>({center,normal,right:new Vector3().crossVectors(UP,normal).normalize(),width,height,...extra});
function globe(mesh,center,r){
 for(let row=0;row<6;row++)for(let col=0;col<12;col++){
  const points=[];for(const [a,b] of [[row,col],[row,col+1],[row+1,col+1],[row+1,col]]){const phi=a*Math.PI/6,theta=b*Math.PI/6;points.push(center.clone().add(new Vector3(Math.sin(phi)*Math.cos(theta)*r,Math.sin(phi)*Math.sin(theta)*r,Math.cos(phi)*r)));}
  mesh.quad(...points,row<3?'#68db97':'#e8f2df');
 }
}
export function createStreetscapeGeometry(){
 const mesh=new DetailMesh(),labels=[],pools=[];
 // A local floor replaces the globe only inside this bounded playable scene.
 // The same aperture outlines cut the OSM streets and sidewalk colliders.
 const outline=[new Vector2(-3000,-3000),new Vector2(3000,-3000),new Vector2(3000,3000),new Vector2(-3000,3000)];
 const holes=SUBWAY_ENTRANCES.map(e=>[[-e.width/2,0],[e.width/2,0],[e.width/2,e.length+e.landing],[-e.width/2,e.length+e.landing]].map(([x,y])=>{const p=entrancePoint(e,x,y);return new Vector2(p.x,p.y);}));
 const points=[...outline,...holes.flat()].map(p=>new Vector3(p.x,p.y,-.028));
 mesh.emit(points,ShapeUtils.triangulateShape(outline,holes),'#222935');
 for(const e of SUBWAY_ENTRANCES){
  const {forward,right}=entranceAxes(e),w=e.width/2,total=e.length+e.landing,grade=.17;
  const pt=(x,y,z)=>entrancePoint(e,x,y,z),box=(x,y,z,width,depth,height,color,solid=false)=>mesh.box(pt(x,y,z),right,forward,width,depth,height,color,solid);
  const floorAt=y=>grade-(e.depth+grade)*Math.min(1,Math.max(0,y/e.length));
  // Visible stair treads over a smooth collision ramp, exactly like TKTS.
  for(let i=0;i<e.steps;i++){
   const y0=i*e.length/e.steps,y1=(i+1)*e.length/e.steps,z=floorAt((i+1)*e.length/e.steps);
   mesh.quad(pt(-w,y0,z),pt(w,y0,z),pt(w,y1,z),pt(-w,y1,z),i%2?'#797d80':'#8e9291');
   mesh.quad(pt(-w,y0,floorAt(y0)),pt(w,y0,floorAt(y0)),pt(w,y0,z),pt(-w,y0,z),'#5c666c');
   box(0,y0+.026,z+.007,e.width,.05,.014,'#d9c474');
  }
  mesh.quad(pt(-w,0,grade),pt(w,0,grade),pt(w,e.length,-e.depth),pt(-w,e.length,-e.depth),null,true);
  mesh.quad(pt(-w,e.length,-e.depth),pt(w,e.length,-e.depth),pt(w,total,-e.depth),pt(-w,total,-e.depth),'#7b8285',true);
  // Enclosed short landing: the prototype has no rail service or station network.
  for(const x of [-w,w]){
   mesh.quad(pt(x,0,-e.depth-.1),pt(x,total,-e.depth-.1),pt(x,total,grade),pt(x,0,grade),'#afb6b1',true);
   for(let z=-e.depth+.35;z<.1;z+=.36)mesh.tube(pt(x,0,z),pt(x,total,z),.008,'#828b86');
   for(let y=.4;y<total;y+=.65)mesh.tube(pt(x,y,-e.depth),pt(x,y,.1),.008,'#828b86');
   box(x, total/2,.27,.16,total,.2,e.covered?'#627b85':'#254d40',true);
   for(const z of [.55,1.17])mesh.tube(pt(x,0,z),pt(x,total,z),.036,e.covered?'#b6c4c7':'#2d6850');
   for(let y=0;y<total+.05;y+=.27)mesh.tube(pt(x,y,.33),pt(x,y,1.17),.022,e.covered?'#96aeb6':'#315b47',true);
   // Below-street handrails follow the flight. They do not span the walkway.
   mesh.tube(pt(x*.92,0,grade+.85),pt(x*.92,e.length,-e.depth+.85),.035,'#c0c7c7');
  }
  mesh.quad(pt(-w,total,-e.depth),pt(w,total,-e.depth),pt(w,total,1.2),pt(-w,total,1.2),'#243e42',true);
  for(let x=-w+.06;x<w;x+=.15)mesh.tube(pt(x,total-.035,-e.depth),pt(x,total-.035,.12),.016,'#71818a');
  mesh.tube(pt(-w,total,1.17),pt(w,total,1.17),.04,'#315b47');
  for(const x of [-w,w]){
   mesh.tube(pt(x,-.08,.17),pt(x,-.08,e.covered?3.2:2.94),e.covered?.065:.07,e.covered?'#9caeb8':'#24523f',true);
   if(!e.covered)globe(mesh,pt(x,-.08,3.03),.18);
  }
  const normal=forward.clone().negate(),signCenter=pt(0,-.095,2.63);
  box(0,-.035,2.63,e.width+.12,.12,.66,'#0b141a');
  labels.push(face(signCenter.clone().addScaledVector(normal,.02),normal,e.width+.04,.6,{kind:'subway',entry:e}));
  if(e.covered){
   for(const x of [-w,w])for(const y of [2.4,4.8,total])mesh.tube(pt(x,y,.25),pt(x,y,3.2-y*.045),.06,'#8fa5b0',true);
   for(const y of [0,2.4,4.8,total])mesh.tube(pt(-w-.15,y,3.25-y*.045),pt(w+.15,y,3.25-y*.045),.065,'#adbec6');
   for(let y=0;y<total;y+=1.2){const end=Math.min(total,y+1.2);mesh.quad(pt(-w-.12,y,3.22-y*.045),pt(w+.12,y,3.22-y*.045),pt(w+.12,end,3.22-end*.045),pt(-w-.12,end,3.22-end*.045),'#82bfd343');}
   mesh.tube(pt(0,0,3.12),pt(0,total,2.76),.035,'#e7f2e7');
  }
  // Lighting and a tiled landing give actual depth when looking down the steps.
  for(const x of [-w+.06,w-.06])mesh.tube(pt(x,e.length*.6,-.1),pt(x,total,-.1),.025,'#e3edc7');
 }
 for(const shed of SCAFFOLDS)addScaffoldGeometry(mesh,shed,labels,pools);
 for(const lamp of STREET_LAMPS){
  const p=new Vector3(...lamp.position),toward=new Vector3(...lamp.towardRoad),right=new Vector3(-toward.y,toward.x,0),tip=p.clone().addScaledVector(toward,1.65).setZ(7.35);
  mesh.box(p.clone().setZ(.25),X,Y,.34,.34,.3,'#3e515d',true);mesh.tube(p.clone().setZ(.22),p.clone().setZ(7),.07,'#74848a',true);
  mesh.tube(p.clone().setZ(6.7),p.clone().addScaledVector(toward,.45).setZ(7.35),.065,'#8b989b');mesh.tube(p.clone().addScaledVector(toward,.45).setZ(7.35),tip,.055,'#8b989b');
  mesh.box(tip,right,toward,.38,.75,.16,'#71838b');mesh.box(tip.clone().setZ(7.26),right,toward,.3,.65,.035,'#f6f3d1');
  pools.push({center:new Vector3(...lamp.sidewalk).setZ(.179),normal:UP,right:X,up:Y,width:12,height:12,kind:1});
 }
 return {batches:mesh.batches,collision:new Float32Array(mesh.collision),labels,pools};
}

// Reused by the reference-led One Times Square construction frontage.
export function addScaffoldGeometry(mesh,shed,labels=[],pools=[]){
  const center=new Vector3(...shed.center),normal=new Vector3(...shed.normal),along=new Vector3(...shed.along),half=shed.length/2,w=shed.width/2,grade=shed.grade??.17;
  const pt=(x,y,z)=>center.clone().addScaledVector(along,x).addScaledVector(normal,y).setZ(z),box=(x,y,z,dx,dy,dz,c,solid=false)=>mesh.box(pt(x,y,z),along,normal,dx,dy,dz,c,solid);
  box(0,0,shed.height+.12,shed.length,shed.width,.24,'#404d4a',true);
  box(0,w,shed.height+.65,shed.length,.11,.95,'#214d40');box(0,-w,shed.height+.65,shed.length,.11,.95,'#264f42');
  for(const x of [-half,half])box(x,0,shed.height+.65,.1,shed.width,.95,'#2d5749');
  for(let x=-half;x<=half+.01;x+=shed.length/Math.ceil(shed.length/3.2)){
   for(const y of [-w,w]){
    box(x,y,grade+.06,.3,.3,.12,'#757d76',true);mesh.tube(pt(x,y,grade+.06),pt(x,y,shed.height+.18),.055,'#87918c',true);
    // Short upper braces leave an open pedestrian passage beneath the shed.
    mesh.tube(pt(x,y,2.15),pt(Math.min(half,x+1.1),y,shed.height),.029,'#9ca6a0');
   }
   mesh.tube(pt(x,-w,shed.height-.15),pt(x,w,shed.height-.15),.075,'#838e87');
   box(x,0,shed.height-.2,.1,2.15,.055,'#fff1c8');
   pools.push({center:pt(x,0,grade+.009),normal:UP,right:along,up:normal,width:5,height:5,kind:0});
  }
  // Pipe scaffold rises above the protective deck, tight to the real facade.
  const back=-w+.16,top=shed.height+1+shed.levels*2.1;
  for(let x=-half;x<=half+.01;x+=shed.length/Math.ceil(shed.length/3.2))mesh.tube(pt(x,back,shed.height),pt(x,back,top),.04,'#7e898c');
  for(let level=0;level<=shed.levels;level++){
   const z=shed.height+1+level*2.1;mesh.tube(pt(-half,back,z),pt(half,back,z),.04,'#8d999c');
   if(level<shed.levels)for(let x=-half;x<half-1;x+=3.2)mesh.tube(pt(x,back,z),pt(Math.min(half,x+3.2),back,z+2.1),.025,'#9ca6a7');
  }
  labels.push(face(pt(0,w+.065,shed.height+.65),normal,Math.min(3.3,shed.length*.3),.55,{kind:'shed'}));
}
