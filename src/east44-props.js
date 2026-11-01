import {Vector3} from 'three';
import config from '../public/data/east44-props.json' with {type:'json'};
import {DISTRICT} from './district-config.js';
export const EAST44_TRUCKS=config.trucks;
export function addEast44Props(mesh,bulbs,labels,foodMenus){
 for(const [index,t] of config.trucks.entries()){
  const c=new Vector3(...t.center),f=new Vector3(...t.forward),r=new Vector3(...t.right),p=(x,y,z)=>c.clone().addScaledVector(r,x).addScaledVector(f,y).setZ(z);
  const box=(x,y,z,w,l,h,color,solid=false)=>mesh.box(p(x,y,z),r,f,w,l,h,color,solid);
  const side=(s,y,z,w,h,extra={})=>({center:p(s*1.092,y,z),normal:r.clone().multiplyScalar(s),right:f.clone().multiplyScalar(s),width:w,height:h,...extra});
  const color=index?'#3b9c91':'#b14c35',accent=index?'#c9ad49':'#c69638';
  // One stable hull collider; rounded body corners, sloping cab and individual
  // wheels are visual detail. These parked trucks have no portal/game logic.
  box(0,0,1.62,2.13,6.22,3.06,null,true);
  box(0,-.85,1.84,2.15,4.60,2.44,color);box(0,-.85,3.08,2.12,4.53,.12,'#aab4ae');
  for(const s of [-1,1]){
   box(s*1.073,-.85,.71,.045,4.57,.36,accent);
   box(s*1.095,-.85,1.04,.025,4.50,.045,'#d1cdb5');
   for(const y of [-2.15,2.00]){
    mesh.tube(p(s*.91,y,.45),p(s*1.14,y,.45),.43,'#18252a',false,24);
    mesh.tube(p(s*1.145,y,.45),p(s*1.17,y,.45),.26,'#9caaa9',false,24);
    mesh.tube(p(s*1.176,y,.45),p(s*1.19,y,.45),.12,'#5b727a',false,16);
   }
   box(s*1.10,-.7,2.10,.08,2.6,1.05,'#1b3037');
   for(const z of [1.55,2.65])box(s*1.16,-.70,z,.10,2.8,.08,'#b6bdb0');
   box(s*1.27,-.70,1.52,.39,2.82,.09,'#bbc2b6');
   // Raised serving hatch, headroom above a sidewalk customer.
   box(s*1.30,-.70,2.74,.52,2.87,.08,color);
   for(const y of [-1.9,.50])mesh.tube(p(s*1.14,y,1.68),p(s*1.50,y,2.72),.018,'#a6b6b1');
   for(let i=0;i<4;i++)foodMenus.push(side(s,-2.42+i*1.05,.98,.88,.55,{item:i}));
   labels.push(side(s,-.8,2.94,3.5,.27,{kind:'west44',variant:31+index,shade:.82}));
   for(let i=0;i<7;i++)box(s*1.105,-2.8+i*.20,1.40,.022,.06,.15,i%2?accent:'#96b786');
   bulbs.box(p(s*1.16,-.7,2.61),r,f,.03,2.65,.025,'#b8a979');
  }
  // Cab with an inclined windscreen and shaped hood.
  box(0,2.13,1.0,2.10,2.02,.86,color);
  mesh.quad(p(-1.0,3.05,1.43),p(1.0,3.05,1.43),p(.92,2.57,2.51),p(-.92,2.57,2.51),'#283e48');
  box(0,2.04,2.58,1.95,1.12,.12,'#a2b0a9');
  for(const s of [-1,1]){
   mesh.quad(p(s*1.045,1.48,1.4),p(s*1.045,2.99,1.4),p(s*.94,2.56,2.47),p(s*.94,1.48,2.47),'#2f4850');
   box(s*1.07,1.76,1.13,.045,.30,.055,'#c2c5b7');
   mesh.tube(p(s*1.03,2.71,1.72),p(s*1.33,2.71,1.87),.027,'#8e9f9f');box(s*1.36,2.71,1.90,.12,.29,.26,'#2b3e46');
   bulbs.box(p(s*.73,3.12,.98),r,f,.36,.025,.20,'#b6b295');
  }
  box(0,3.10,.71,2.12,.10,.17,'#aeb8b3');box(0,3.14,1.15,.90,.04,.36,'#253841');
  for(let z=1.02;z<1.32;z+=.06)box(0,3.17,z,.82,.025,.022,'#9caaa6');
  for(const y of [-2.25,-.8]){box(0,y,3.25,.72,.75,.22,'#8b9b9a');for(let i=0;i<6;i++)box(-.28+i*.10,y,3.37,.035,.58,.025,'#485b60');}
 }
 // Compact souvenir stall under the north-side shed, with hanging NYC
 // shirts, caps, postcard rack and a small folded display table.
 const front=DISTRICT.facades.find(f=>f.id==='district-111'),c=new Vector3(...front.center),n=new Vector3(...front.normal),r=new Vector3(-n.y,n.x,0),p=(x,y,z)=>c.clone().addScaledVector(r,x).addScaledVector(n,y).setZ(z);
 const box=(x,y,z,w,d,h,col,solid=false)=>mesh.box(p(x,y,z),r,n,w,d,h,col,solid);
 for(const x of [-1.35,1.35])mesh.tube(p(x,.62,.17),p(x,.62,1.98),.026,'#829696',true);
 mesh.tube(p(-1.35,.62,1.98),p(1.35,.62,1.98),.030,'#9caaa7');
 box(0,.61,.96,2.72,.57,.08,'#79776a',true);
 for(const x of [-1.17,1.17])box(x,.61,.56,.055,.48,.78,'#63757b',true);
 for(let i=0;i<7;i++){
  const x=-1.10+i*.36,z=1.53,col=['#bec0ae','#607c8c','#9b7a70','#c7b98f'][i%4];
  mesh.tube(p(x,.62,1.97),p(x,.62,1.84),.011,'#c6c8b8');box(x,.66,z,.25,.04,.44,col);box(x-.16,.66,z+.14,.11,.04,.17,col);box(x+.16,.66,z+.14,.11,.04,.17,col);
  labels.push({center:p(x,.69,z+.03),normal:n,right:r,width:.21,height:.16,kind:'west44',variant:33,shade:.57});
 }
 for(let i=0;i<8;i++){const x=-1.05+i*.29;mesh.tube(p(x,.65,1.02),p(x,.65,1.10),.11,['#456179','#b5aa88','#6c4249'][i%3],false,12);box(x,.77,1.02,.22,.13,.025,'#73837b');}
 box(1.18,.58,1.38,.22,.11,.64,'#948b71');for(let z=1.15;z<1.65;z+=.14)box(1.18,.65,z,.19,.025,.10,'#bfb79e');
 labels.push({center:p(0,.91,.86),normal:n,right:r,width:2.5,height:.19,kind:'west44',variant:33,shade:.69});
 return {trucks:config.trucks,souvenir:{position:p(0,.62,.17).toArray(),facade:front.id}};
}
