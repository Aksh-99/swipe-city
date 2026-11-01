import {Vector3} from 'three';
const UP=new Vector3(0,0,1);

export function createDisneyRetail(mesh,store,shops){
 const windows=[],glass=[],labels=[],logos=[],screens=[],lights=[];
 for(const f of shops){
  const normal=new Vector3(...f.normal),right=new Vector3(-normal.y,normal.x,0),origin=new Vector3(...f.center),half=f.width/2,disney=f.id==='disney';
  const p=(x,y,z)=>origin.clone().addScaledVector(right,x).addScaledVector(normal,y).setZ(z);
  const box=(x,y,z,w,d,h,color,solid=false)=>mesh.box(p(x,y,z),right,normal,w,d,h,color,solid);
  const face=(x,y,z,w,h,extra={})=>({center:p(x,y,z),normal,right,width:w,height:h,...extra});
  const trim=disney?'#b3b9b9':f.kind==='fashion'?'#a78c65':'#687b82',doorX=disney?half-3.15:0,doorWidth=disney?4.6:3.6;
  box(0,.10,4.93,f.width,.20,8.93,'#223139');
  box(0,.28,.40,f.width,.40,.40,'#656c6c',true);
  // Preserve the portrait display proportions instead of stretching a single
  // mannequin or shoe display across an entire broad shop front.
  const displays=disney?1:Math.max(2,Math.round(f.width/5)),displayWidth=(f.width-.12)/displays;
  for(let i=0;i<displays;i++)windows.push(face(-half+.06+(i+.5)*displayWidth,.22,4.58,displayWidth,7.92,{art:f.art,disney,section:'whole',flip:!disney&&i%2===1}));
  glass.push(face(0,.26,4.79,f.width-.10,8.54));
  const bays=Math.max(4,Math.round(f.width/(disney?2.0:2.65))),bw=f.width/bays;
  for(let j=0;j<=bays;j++){
   const x=-half+j*bw;box(x,.36,4.91,.074,.21,8.96,trim,j===0||j===bays);
   box(x-.018,.473,4.91,.017,.02,8.90,'#d0d6ce');
  }
  for(const z of [.63,2.44,4.24,6.05,7.86,9.34])box(0,.36,z,f.width,.21,.065,trim);
  // Wide pale piers divide the stores, like the reference retail frontage.
  for(const x of [-half+.06,half-.06])box(x,.31,4.86,.16,.37,9.02,'#adb5b7',true);
  box(0,.35,9.34,f.width,.35,.16,'#afbabc');
  // Closed double glass doors with deep metal frames and pull handles.
  box(doorX,.43,2.34,doorWidth+.20,.22,3.72,'#1c292d');
  windows.push(face(doorX,.56,2.36,doorWidth-.12,3.49,{art:f.art,disney,section:'door'}));
  for(const dx of [-doorWidth/2,0,doorWidth/2])box(doorX+dx,.62,2.34,.09,.18,3.72,trim);
  box(doorX,.63,4.21,doorWidth,.18,.11,trim);
  for(const dx of [-.22,.22])mesh.tube(p(doorX+dx,.78,1.20),p(doorX+dx,.78,2.39),.028,'#d1d7d1');
  box(doorX,.72,.52,doorWidth,.35,.13,'#8c9795',true);
  if(disney){
   // Red script is the actual Disney wordmark, mounted over the grid of glass.
   logos.push(face(-.45,.68,6.52,12.45,5.437));
   labels.push(face(doorX,.67,4.55,4.1,.32,{kind:'disney-small'}));
   box(doorX,.72,4.96,4.95,.75,.12,'#b8c0c0');
   for(let x=-half+.45;x<half-.4;x+=2.15)mesh.tube(p(x,.24,8.73),p(x+1.30,.24,8.73),.017,'#ffe6aa');
  }else{
   const signZ=f.kind==='variety'?8.22:5.28,signH=f.kind==='variety'?.82:1.02;
   box(0,.52,signZ,f.width-.24,.38,signH+.16,f.kind==='fashion'?'#19191a':f.kind==='variety'?'#d44889':'#1b3037');
   labels.push(face(0,.723,signZ,f.width-.50,signH,{kind:f.id}));
   if(f.kind==='fashion'){
    box(0,.95,4.66,f.width-.22,1.20,.19,'#191c20');
    labels.push(face(-half+1.07,.59,2.83,1.34,3.12,{kind:'sale'}));
   }else if(f.kind==='sneakers'){
    for(const z of [4.72,5.84])box(0,.73,z,f.width-.35,.05,.035,'#87f8cf');
    labels.push(face(half-1.21,.56,2.89,1.64,2.7,{kind:'new-drops'}));
   }
   for(const x of [-half+.25,half-.25])box(x,.44,2.79,.052,.10,4.20,f.kind==='variety'?'#ffe5f2':'#ffe5b5');
  }
  lights.push({center:p(0,1.35,.185),normal:UP,right,up:normal,width:f.width,height:4.5});
 }
 // One architectural LED frontage follows the entire original podium; the
 // return wraps onto W 45th Street. These are thin steel sign structures, not
 // a replacement building volume. Surveyed city tiles stay untouched.
 for(const [index,f] of store.facades.entries()){
  const normal=new Vector3(...f.normal),right=new Vector3(-normal.y,normal.x,0),origin=new Vector3(...f.center),half=f.width/2;
  const p=(x,y,z)=>origin.clone().addScaledVector(right,x).addScaledVector(normal,y).setZ(z);
  const box=(x,y,z,w,d,h,color,solid=false)=>mesh.box(p(x,y,z),right,normal,w,d,h,color,solid);
  const face=(x,y,z,w,h,extra={})=>({center:p(x,y,z),normal,right,width:w,height:h,...extra});
  box(0,.21,22.03,f.width,.48,24.93,'#121d27');
  screens.push(face(0,.463,22.03,f.width-.035,24.49,{u0:index===0?0:.58,u1:1}));
  for(const z of [9.59,34.49])box(0,.50,z,f.width+.10,.21,.25,'#1a2731');
  for(const x of [-half+.03,half-.03])box(x,.47,22.03,.18,.24,24.93,'#1c2931');
  for(let x=-half+.8;x<half-.4;x+=6.9){
   mesh.tube(p(x,-.65,10.8),p(x,-.65,34.15),.085,'#34434c');
   mesh.tube(p(x,-2.0,11.8),p(x,-.65,29.0),.070,'#34434c');
   const x1=Math.min(x+6.6,half-.4);mesh.tube(p(x,-.7,13.0),p(x1,-.7,33.8),.042,'#303e47');
  }
  if(index===1){
   // The same building's return has display windows beneath the wraparound ad.
   const bays=8,bw=f.width/bays;
   box(0,.12,4.90,f.width,.26,8.80,'#23343a');
   for(let i=0;i<4;i++)windows.push(face(-half+(i+.5)*f.width/4,.28,4.83,f.width/4,8.44,{art:3,section:'whole',disney:false,flip:i%2===1}));
   glass.push(face(0,.33,4.83,f.width-.12,8.44));
   for(let i=0;i<=bays;i++)box(-half+i*bw,.43,4.87,.085,.25,8.89,'#94a4a8');
   for(const z of [.46,3.24,6.0,9.33])box(0,.44,z,f.width,.25,.10,'#94a4a8');
   box(0,.37,.42,f.width,.40,.42,'#646e70',true);
  }
 }
 return {windows,glass,labels,logos,screens,lights,shops:shops.length};
}
