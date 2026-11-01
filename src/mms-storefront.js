import{west48Local}from'./west48-config.js';
import {Vector3} from 'three';
const UP=new Vector3(0,0,1);

// A shallow, source-fitted architectural layer. The streamed NYC building
// remains behind the closed glass, including its original collision triangles.
export function createMmsStorefront(mesh,store){
 const interiors=[],glass=[],labels=[],candies=[],referenceAds=[],lights=[];
 const trim='#354956',edge='#809398';
 for(const [side,f] of store.facades.entries()){
  // The W49 north corner now has the photographed SPIN/DimSum frontage.
  const q=west48Local(f.center);if(f.fullBrand&&((q.d>145&&f.normal[0]*.4815+f.normal[1]*.8764>.7)||(q.d>126&&f.normal[0]*.8764-f.normal[1]*.4815>.7)))continue;
  const normal=new Vector3(...f.normal),right=new Vector3(-normal.y,normal.x,0),origin=new Vector3(...f.center),half=f.width/2;
  const p=(x,y,z)=>origin.clone().addScaledVector(right,x).addScaledVector(normal,y).setZ(z);
  const box=(x,y,z,w,d,h,color,solid=false)=>mesh.box(p(x,y,z),right,normal,w,d,h,color,solid);
  const face=(x,y,z,w,h,extra={})=>({center:p(x,y,z),normal,right,width:w,height:h,...extra});
  box(0,.13,6.95,f.width,.22,13.5,'#182f3c');
  box(0,.28,.30,f.width,.44,.26,'#51595a',true);
  // A continuous display spans several glass bays rather than restarting in
  // every window. Ground and upper floors use different panorama bands.
  const sections=Math.max(2,Math.ceil(f.width/18)),sectionWidth=f.width/sections;
  for(let section=0;section<sections;section++){
   const x=-half+(section+.5)*sectionWidth;
   interiors.push(face(x,.35,2.32,sectionWidth,3.85,{band:0}));
   interiors.push(face(x,.35,9.12,sectionWidth,8.48,{band:1}));
  }
  glass.push(face(0,.39,6.93,f.width,12.90,{side}));
  // Narrow dark aluminum grid, broad ribbed service band, and thin upper rail.
  const bays=Math.round(f.width/2.35),bayWidth=f.width/bays;
  for(let i=0;i<=bays;i++){
   const x=-half+i*bayWidth;box(x,.52,6.99,.075,.22,13.22,trim,i===0||i===bays);
   box(x-.018,.635,7.00,.016,.016,13.18,edge);
  }
  for(const z of [.43,2.96,4.20,4.86,7.15,9.37,11.51,13.45])box(0,.52,z,f.width,.22,.065,trim);
  box(0,.55,4.53,f.width,.33,.54,'#2b3841');
  for(let z=4.31;z<4.80;z+=.068)box(0,.732,z,f.width,.028,.019,'#718084');
  box(0,.48,9.40,f.width,.18,.16,'#52626b');
  box(0,.53,13.58,f.width,.38,.20,'#687d84');
  // Doors are close to the corner, like the reference; no bulky store canopy.
  const doorX=side===0?half-4.1:-half+4.1;
  box(doorX,.59,1.87,3.70,.07,2.80,'#1a343b');
  interiors.push(face(doorX,.635,1.89,3.42,2.60,{band:0,door:true}));
  for(const dx of [-1.82,-.91,0,.91,1.82])box(doorX+dx,.71,1.87,.065,.17,2.82,edge);
  box(doorX,.71,3.31,3.7,.17,.11,edge);
  for(const dx of [-1.35,-.48,.48,1.35])mesh.tube(p(doorX+dx,.86,1.22),p(doorX+dx,.86,2.03),.024,'#d4d9d4');
  box(doorX,.79,.51,3.64,.29,.15,'#778581',true);
  labels.push(face(doorX,.67,3.74,4.25,.55,{kind:'entrance'}));
  // Interior uplight strips and their shallow sidewalk spill.
  for(let x=-half+1;x<half;x+=4.7)box(x,.37,8.8,.10,.04,7.65,side===0?'#0585aa':'#dfaa53');
  lights.push({center:p(0,1.75,.183),normal:UP,right,up:normal,width:f.width,height:5.0});
  // A rooftop LED fascia, visually separate from the transparent retail floors.
  const adWidth=side===0?24:25,adX=side===0?half-12.4:0;
  if(f.fullBrand)box(0,.56,17.07,f.width,.70,6.37,'#f8d918');else box(adX,.56,17.07,adWidth+.40,.70,6.37,'#242b30');
  labels.push(face(adX,.93,17.07,adWidth,6.0,{kind:'billboard'}));
  for(const z of [14.00,20.13])box(adX,.93,z,(f.fullBrand?f.width:adWidth+.2),.08,.06,'#f54d23');
  if(side===0){
   // The red-character advertising artwork is sampled from the supplied photo,
   // with UVs selecting the original sign, rather than inventing a mascot mural.
   box(-half+2.2,.65,9.10,4.25,.72,8.52,'#283147');
   referenceAds.push(face(-half+2.2,1.03,9.10,3.94,8.24));
  }
 }
 const corner=new Vector3(...store.corner),frontNormal=new Vector3(...store.facades[0].normal),sideNormal=new Vector3(...store.facades[1].normal),out=frontNormal.clone().add(sideNormal).normalize();
 const post=corner.clone().addScaledVector(out,.82);
 mesh.tube(post.clone().setZ(3.0),post.clone().setZ(15.42),.105,'#6d7d84');
 const colors=['#eb192b','#ffe51c','#ff8d0a','#30c85b','#1095df'];
 const angles=[0,1.18,0,-.20,1.10];
 for(let i=0;i<5;i++){
  const normal=out.clone().applyAxisAngle(UP,angles[i]),right=new Vector3(-normal.y,normal.x,0),center=post.clone().addScaledVector(out,.19).setZ(4.32+i*2.38),radius=i===2?1.10:1.02;
  // Rounded shallow sign body with a bright metallic rim and two readable faces.
  mesh.tube(center.clone().addScaledVector(normal,-.14),center.clone().addScaledVector(normal,.14),radius,colors[i],false,40);
  for(const direction of [-1,1]){
   const edgeCenter=center.clone().addScaledVector(normal,direction*.15);
   for(let j=0;j<40;j++){
    const point=a=>edgeCenter.clone().addScaledVector(right,Math.cos(a)*radius).addScaledVector(UP,Math.sin(a)*radius);
    mesh.tube(point(j/40*Math.PI*2),point((j+1)/40*Math.PI*2),.031,'#d7e3cd',false,5);
   }
   candies.push({center:center.clone().addScaledVector(normal,direction*.18),normal:normal.clone().multiplyScalar(direction),right:right.clone().multiplyScalar(direction),width:radius*2,height:radius*2,tile:i});
  }
 }
 return {interiors,glass,labels,candies,referenceAds,lights};
}
