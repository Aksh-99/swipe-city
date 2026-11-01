import {Vector3} from 'three';
import {FontLoader} from 'three/addons/loaders/FontLoader.js';
import {TextGeometry} from 'three/addons/geometries/TextGeometry.js';
import fontData from 'three/examples/fonts/helvetiker_bold.typeface.json' with {type:'json'};
const UP=new Vector3(0,0,1);

function inside(x,y,polygon){
 let hit=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
  const a=polygon[i],b=polygon[j];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)hit=!hit;
 }return hit;
}
function addMetalLetters(mesh,p,normal,right,lights){
 const font=new FontLoader().parse(fontData),text="HERSHEY'S",geometry=new TextGeometry(text,{font,size:1,depth:.11,curveSegments:3,bevelEnabled:true,bevelThickness:.008,bevelSize:.006,bevelSegments:1});
 geometry.computeBoundingBox();const b=geometry.boundingBox,w=b.max.x-b.min.x,h=b.max.y-b.min.y,positions=geometry.attributes.position,normals=geometry.attributes.normal;
 const letterWidth=7.5,letterHeight=2.05,left=-6.15-letterWidth/2,bottom=4.60;
 const letterPoint=(x,y,z)=>p(left+(x-b.min.x)/w*letterWidth,.61+z,bottom+(y-b.min.y)/h*letterHeight);
 for(let i=0;i<positions.count;i+=3){const vertices=[0,1,2].map(j=>letterPoint(positions.getX(i+j),positions.getY(i+j),positions.getZ(i+j)));mesh.emit(vertices,[[0,1,2]],normals.getZ(i)>.8?'#c7cece':'#657273');}
 // Small lamp faces follow the actual glyph outlines, including counters. The
 // raised metal letters and LED bulbs remain one shared batch each.
 const shapes=font.generateShapes(text,1).map(s=>s.extractPoints(4));
 for(let x=.065;x<letterWidth;x+=.12)for(let y=.07;y<letterHeight;y+=.14){
  const gx=b.min.x+x/letterWidth*w,gy=b.min.y+y/letterHeight*h;
  if(shapes.some(s=>inside(gx,gy,s.shape)&&!s.holes.some(hole=>inside(gx,gy,hole))))lights.push({center:p(left+x,.742,bottom+y),normal,right,width:.045,height:.045});
 }
 geometry.dispose();
}

export function createHersheysStorefront(mesh,store){
 const windows=[],glass=[],screens=[],labels=[],bulbs=[],lights=[];
 const corner=new Vector3(...store.corner),front=store.facades[0],side=store.facades[1],frontN=new Vector3(...front.normal),sideN=new Vector3(...side.normal),segments=[];
 const a0=Math.atan2(frontN.y,frontN.x);let a1=Math.atan2(sideN.y,sideN.x);while(a1<a0)a1+=Math.PI*2;
 const arcLength=store.radius*(a1-a0),total=front.width+arcLength+side.width;
 segments.push({...front,start:0,end:front.width});
 for(let i=0;i<12;i++){
  const a=a0+(a1-a0)*i/12,b=a0+(a1-a0)*(i+1)/12,na=new Vector3(Math.cos(a),Math.sin(a),0),nb=new Vector3(Math.cos(b),Math.sin(b),0),normal=na.clone().add(nb).normalize();
  segments.push({kind:'curve',center:corner.clone().addScaledVector(na,store.radius/2).addScaledVector(nb,store.radius/2).toArray(),normal:normal.toArray(),width:na.distanceTo(nb)*store.radius,start:front.width+arcLength*i/12,end:front.width+arcLength*(i+1)/12});
 }
 segments.push({...side,start:front.width+arcLength,end:total});
 for(const f of segments){
  const normal=new Vector3(...f.normal),right=new Vector3(-normal.y,normal.x,0),origin=new Vector3(...f.center),half=f.width/2;
  const p=(x,y,z)=>origin.clone().addScaledVector(right,x).addScaledVector(normal,y).setZ(z);
  const curved=f.kind==='curve';
  const box=(x,y,z,w,d,h,color,solid=false)=>mesh.box(p(x,y,z),right,normal,curved?w*(1+(y+d/2)/store.radius)+.012:w,d,h,color,solid);
  const face=(x,y,z,w,h,extra={})=>({center:p(x,y,z),normal,right,width:curved?w*(1+y/store.radius)+.003:w,height:h,...extra});
  // Thin retail cladding: no replacement building mass. Closed glazing gets
  // its own collision surface so the rounded skin cannot be walked through.
  box(0,-.04,5.15,f.width,.16,10.04,'#26373c');
  box(0,.10,.37,f.width,.24,.37,'#6b7373',true);
  mesh.quad(p(-half,.17,.4),p(half,.17,.4),p(half,.17,6),p(-half,.17,6),null,true);
  const sections=curved?1:f.kind==='front'?2:1,part=f.width/sections;
  for(let i=0;i<sections;i++){
   const x=-half+(i+.5)*part;
   windows.push(face(x,.13,3.13,part,5.08,{kind:'interior',u0:curved?.80:0,u1:curved?.82:1}));
   windows.push(face(x,.13,8.09,part,3.66,{kind:'upper',u0:curved?.80:0,u1:curved?.82:1}));
  }
  glass.push(face(0,.195,5.25,f.width,9.72));
  for(const z of [.57,5.89,6.16,10.03])box(0,.30,z,f.width,.30,z===6.16?.28:.09,'#859093');
  if(!curved){
   const bays=Math.round(f.width/2.45),bw=f.width/bays;
   for(let i=0;i<=bays;i++){
    const x=-half+i*bw;box(x,.28,5.26,.065,.22,9.64,'#728488');
    box(x-.012,.397,5.26,.013,.015,9.61,'#c4ceca');
   }
   // Exposed diagonal steel and long ceiling lamps behind the clerestory.
   for(let x=-half+1;x<half-1;x+=5.9){
    mesh.tube(p(x,.16,6.38),p(Math.min(x+2.65,half-.2),.16,9.68),.065,'#aeb8b6');
    mesh.tube(p(x,.16,9.72),p(Math.min(x+4.95,half-.25),.16,8.96),.029,'#fff8d4');
   }
   for(let z=1.9;z<5.3;z+=1.6)box(0,.32,z,f.width,.10,.028,'#a2afb0');
  }
  // The blue ad is continuous across the front, rounded corner and side.
  box(0,.19,20.46,f.width+.008,.68,20.63,'#152027');
  screens.push(face(0,.541,20.46,f.width+.006,20.18,{u0:f.start/total,u1:f.end/total}));
  for(const z of [10.29,30.66])box(0,.57,z,f.width+.005,.15,.17,'#18262b');
  box(0,.30,10.10,f.width,.95,.22,'#1d2428');
  if(f.kind==='front'){
   // The entrance occupies the left portion of the glass frontage, with
   // chocolate-brown vertical slats, silver letters, and a red marquee.
   const doorX=-6.15;
   box(doorX,.25,3.52,11.7,.24,5.60,'#321f1b');
   for(let x=doorX-5.73;x<doorX+5.73;x+=.125)box(x,.389,3.54,.042,.035,5.57,'#5f4130');
   windows.push(face(doorX,.423,2.45,8.3,3.68,{kind:'door',u0:.05,u1:.80}));
   for(const x of [doorX-4.23,doorX-2.12,doorX,doorX+2.12,doorX+4.23])box(x,.50,2.48,.11,.17,3.76,'#141b1e');
   for(const x of [doorX-2.4,doorX-1.8,doorX-.31,doorX+.31,doorX+1.8,doorX+2.4])mesh.tube(p(x,.65,1.45),p(x,.65,2.53),.025,'#c5cbc8');
   box(doorX,.49,4.36,10.8,.25,.18,'#8b181d');
   box(doorX,1.01,4.25,11.8,1.48,.23,'#a02229');
   box(doorX,1.735,4.22,11.8,.10,.37,'#b42930');
   box(doorX,1.79,4.41,11.94,.13,.055,'#de6a59');
   box(doorX,1.80,4.035,11.94,.14,.055,'#6f141b');
   labels.push(face(doorX,1.797,4.225,10.95,.25,{kind:'canopy'}));
   for(let x=doorX-5.2;x<doorX+5.3;x+=1.3)bulbs.push({center:p(x,1.10,4.095),normal:new Vector3(0,0,-1),right,up:normal,width:.11,height:.11});
   addMetalLetters(mesh,p,normal,right,bulbs);
   // A narrow blue hanging product banner behind the right hand glass.
   box(5.9,.24,3.81,1.75,.06,3.95,'#1457a0');
   labels.push(face(5.9,.285,4.22,1.68,1.55,{kind:'jolly'}));
  }
  if(!curved)lights.push({center:p(0,1.8,.184),normal:UP,right,up:normal,width:f.width,height:4.3});
 }
 return {windows,glass,screens,labels,bulbs,lights,cornerPanels:12};
}
