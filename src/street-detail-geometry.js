import {Vector3} from 'three';
import {DetailMesh} from './detail-mesh.js';
import {insideSection,nearestSegment} from './street-layout.js';
import {SUBWAY_ENTRANCES} from './streetscape-config.js';
import {sidewalkExpansionFactor} from './street-proportions.js';
const UP=new Vector3(0,0,1),X=new Vector3(1,0,0),Y=new Vector3(0,1,0);
export function createSidewalkGeometry(layout){
 const mesh=new DetailMesh(SUBWAY_ENTRANCES);let length=0;
 for(const path of layout.sidewalks)for(let i=1;i<path.points.length;i++){
  const a=path.points[i-1],b=path.points[i],distance=a.distanceTo(b);if(distance<.05)continue;
  const dir=b.clone().sub(a).normalize(),side=new Vector3(-dir.y,dir.x,0),parts=Math.ceil(distance/1.5);
  const half=path.width/2,edgesA=layout.sidewalkEdges?.(a,dir,path.width)||[half,half],edgesB=layout.sidewalkEdges?.(b,dir,path.width)||[half,half];
  const edges=(t,p)=>edgesA.map((v,j)=>half+(v+(edgesB[j]-v)*t-half)*sidewalkExpansionFactor(p));
  for(let k=0;k<parts;k++){
   const p=a.clone().lerp(b,k/parts),q=a.clone().lerp(b,(k+1)/parts);if(!insideSection(p)||!insideSection(q))continue;
   length+=distance/parts;const h0=layout.sidewalkHeight(p),h1=layout.sidewalkHeight(q);
   const [pLeft,pRight]=edges(k/parts,p),[qLeft,qRight]=edges((k+1)/parts,q);
   const corners=[p.clone().addScaledVector(side,pLeft).setZ(h0),p.clone().addScaledVector(side,-pRight).setZ(h0),q.clone().addScaledVector(side,-qRight).setZ(h1),q.clone().addScaledVector(side,qLeft).setZ(h1)];
   mesh.quad(...corners,'#a7abae',true);
   for(const [u,v] of [[0,3],[2,1]]){
    const c=corners[u],d=corners[v];
    mesh.quad(c.clone().setZ(.025),d.clone().setZ(.025),d,c,'#737e88',true);
    const inset=side.clone().multiplyScalar(u===0?-.13:.13);
    mesh.quad(c.clone().add(inset).addScaledVector(UP,.003),c.clone().addScaledVector(UP,.003),d.clone().addScaledVector(UP,.003),d.clone().add(inset).addScaledVector(UP,.003),'#c5c6c5');
   }
  }
 }
 // Detectable warning panels on the actual crosswalk landings. Muted iron red
 // with a regular raised-dot pattern, instead of a painted fantasy road border.
 for(const crossing of layout.crossings)for(const end of [0,1]){
  const p=crossing.points[end?crossing.points.length-1:0];if(!insideSection(p))continue;
  const dir=crossing.points[end?0:crossing.points.length-1].clone().sub(p).normalize(),side=new Vector3(dir.y,-dir.x,0);
  const center=p.clone().addScaledVector(dir,-.38),z=layout.sidewalkHeight(center)+.008;
  const point=(x,y)=>center.clone().addScaledVector(side,x).addScaledVector(dir,y).setZ(z);
  mesh.quad(point(-1.05,-.28),point(1.05,-.28),point(1.05,.28),point(-1.05,.28),'#8d5149');
  // Low polygon detail is visible close to the avatar; no extra textures.
  for(let x=-.95;x<1;x+=.15)for(let y=-.21;y<.23;y+=.14){const q=point(x,y).addScaledVector(UP,.004);mesh.quad(q.clone().add(new Vector3(-.019,-.019,0)),q.clone().add(new Vector3(.019,-.019,0)),q.clone().add(new Vector3(.019,.019,0)),q.clone().add(new Vector3(-.019,.019,0)),'#ad7263');}
 }
 return {...mesh,collision:new Float32Array(mesh.collision),length};
}

export function createSignalGeometry(layout){
 const mesh=new DetailMesh(),lenses=[],pedestrians=[],labels=[];let vehicleHeads=0;
 function face(center,normal,width,height,info){const right=new Vector3().crossVectors(UP,normal);return {center,normal,width,height,right,...info};}
 for(const pole of layout.signals){
  const p=pole.position.clone(),h=pole.vehicle?6.35:4.05;p.z=.06;
  mesh.box(p.clone().setZ(.17),X,Y,.44,.44,.28,'#465462',true);
  mesh.tube(p.clone().setZ(.27),p.clone().setZ(h),.095,'#83939d',true);
  mesh.tube(p.clone().setZ(.28),p.clone().setZ(.65),.14,'#596c78');
  for(const x of [-.15,.15])for(const y of [-.15,.15])mesh.box(p.clone().add(new Vector3(x,y,.25)),X,Y,.055,.055,.055,'#bac2c5');
  for(const z of [.85,2.1,3.3])mesh.tube(p.clone().setZ(z),p.clone().setZ(z+.055),.109,'#bec6c9');
  if(pole.vehicle){
   const road=pole.road,normal=road.direction.clone().negate();
   const toRoad=road.point.clone().sub(p).setZ(0).normalize();
   const length=Math.max(2.8,Math.min(5.5,road.point.clone().setZ(0).distanceTo(p.clone().setZ(0))));
   const elbow=p.clone().addScaledVector(toRoad,.45).setZ(h+.22),tip=p.clone().addScaledVector(toRoad,length).setZ(h+.24);
   mesh.tube(p.clone().setZ(h-.4),elbow,.085,'#8898a0');mesh.tube(elbow,tip,.072,'#8898a0');
   const center=tip.clone().setZ(h-.67),right=new Vector3().crossVectors(UP,normal);
   mesh.tube(tip,center,.04,'#465462');
   mesh.box(center,right,normal,.49,.26,1.22,'#c88e21');
   mesh.box(center.clone().addScaledVector(normal,.141),right,normal,.405,.035,1.11,'#171d22');
   for(let light=0;light<3;light++){
    const at=center.clone().addScaledVector(UP,.365-light*.365).addScaledVector(normal,.168);
    // Dark visors cast the familiar deep ring around the colored lenses.
    mesh.tube(at,at.clone().addScaledVector(normal,.16),.172,'#202a30',false,12);
    lenses.push(face(at.clone().addScaledVector(normal,.169),normal,.265,.265,{group:pole.group,light}));
   }
   vehicleHeads++;
  }
  for(const ped of pole.pedestrians){
   const n=ped.normal,r=new Vector3().crossVectors(UP,n),center=p.clone().addScaledVector(n,.15).addScaledVector(r,.21).setZ(2.45);
   mesh.box(center,r,n,.56,.22,.53,'#c8912c');
   mesh.box(center.clone().addScaledVector(n,.13),r,n,.485,.04,.438,'#111b21');
   // Small rain hood and rear mounting clamps.
   mesh.box(center.clone().addScaledVector(n,.2).addScaledVector(UP,.265),r,n,.59,.42,.035,'#896d31');
   pedestrians.push(face(center.clone().addScaledVector(n,.155),n,.468,.415,{group:ped.group,crossing:ped.crossing}));
   const box=p.clone().addScaledVector(n,.16).setZ(1.1);mesh.box(box,r,n,.12,.08,.21,'#d6b33b');mesh.tube(box.clone().addScaledVector(n,.05),box.clone().addScaledVector(n,.062),.035,'#222b30');
  }
  // Street names are derived from nearby mapped roads, rather than guessed.
  const nearby=[...layout.roadPaths,...layout.broadway].map(path=>nearestSegment(p,[path])).filter(hit=>hit&&hit.distance<18&&hit.path.tags.name);
  const named=new Map();for(const hit of nearby.sort((a,b)=>a.distance-b.distance))if(!named.has(hit.path.tags.name))named.set(hit.path.tags.name,hit);
  for(const [i,hit] of [...named.values()].slice(0,2).entries()){
   const normal=new Vector3(-hit.direction.y,hit.direction.x,0),center=p.clone().setZ(3.55+i*.34);
   const name=hit.path.tags.name.replace('West ','W ').replace(' Street',' ST').replace('7th Avenue','7 AV').replace('8th Avenue','8 AV').replace('6th Avenue','6 AV');
   mesh.box(center,hit.direction,normal,1.55,.045,.29,'#214d43');
   for(const sign of [-1,1])labels.push(face(center.clone().addScaledVector(normal,.027*sign),normal.clone().multiplyScalar(sign),1.49,.26,{name}));
  }
 }
 return {...mesh,collision:new Float32Array(mesh.collision),lenses,pedestrians,labels,vehicleHeads};
}
