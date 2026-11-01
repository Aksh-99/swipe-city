import {Vector3} from 'three';
import {DetailMesh} from './detail-mesh.js';
const UP=new Vector3(0,0,1);

export function createHardRockGeometry(parentMesh,store){
 const mesh=new DetailMesh();
 const portal=[],labels=[],glass=[],windows=[],marquee=[],guitars=[],logos=[],taco=[],ads=[],lights=[];
 const night={frontNormal:store.facades[0].normal,lights:[]};
 for(const [index,f] of store.facades.entries()){
  const normal=new Vector3(...f.normal),right=new Vector3(-normal.y,normal.x,0),origin=new Vector3(...f.center),half=f.width/2;
  const p=(x,y,z)=>origin.clone().addScaledVector(right,x).addScaledVector(normal,y).setZ(z);
  const box=(x,y,z,w,d,h,color,solid=false)=>mesh.box(p(x,y,z),right,normal,w,d,h,color,solid);
  const face=(x,y,z,w,h,extra={})=>({center:p(x,y,z),normal,right,width:w,height:h,...extra});
  const archX=store.portalX;
  // Thin limestone/brick skins on surveyed walls; no new building volumes.
  box(0,.045,13.0,f.width,.09,25.9,'#858984');
  box(0,.045,(26+f.height)/2,f.width,.09,f.height-26,'#897e68');
  box(0,.24,.47,f.width,.40,.60,'#535957',true);
  for(const z of [5.6,6.0,12.0,17.5,23.2,25.8]){
   box(0,.17,z,f.width,.27,z===25.8?.36:.16,'#a9aba3');
   box(0,.09,z-.16,f.width,.10,.09,'#646b69');
  }
  const bays=Math.round(f.width/4.55),bw=f.width/bays;
  for(let j=0;j<bays;j++){
   const x=-half+(j+.5)*bw,besideArch=index!==0||Math.abs(x-archX)>7.15;
   if(besideArch){
    for(const z of [8.95,14.65,20.0]){
     box(x,.145,z,bw-1.07,.10,4.0,'#263239');
     glass.push(face(x,.207,z,bw-1.27,3.80,{variant:(j+Math.floor(z))%5}));
     for(const dx of [-.5,0,.5])box(x+dx*(bw-1.05),.25,z,.065,.13,4.1,'#777e7b');
     box(x,.25,z-.3,bw-1.05,.13,.07,'#7f847e');
     // Recessed ornamental spandrels between the big lower window bays.
     box(x,.16,z+2.35,bw-1.0,.18,.57,'#636966');
     for(let q=-1;q<=1;q++){
      const cx=x+q*.70;
      mesh.tube(p(cx-.27,.28,z+2.12),p(cx+.27,.28,z+2.54),.035,'#979b92');
      mesh.tube(p(cx+.27,.28,z+2.12),p(cx-.27,.28,z+2.54),.035,'#979b92');
     }
    }
    for(const dx of [-bw/2+.20,bw/2-.20]){
     box(x+dx,.19,15.65,.40,.29,19.2,'#a2a49b');
     for(let z=6.5;z<25.4;z+=.72)box(x+dx,.34,z,.41,.023,.031,'#6e7672');
    }
   }
   for(let z=28.25;z<f.height-1;z+=4.18){
    if(index===0&&Math.abs(x-archX)<7.2&&z<30)continue;
    box(x,.17,z,bw-1.12,.20,3.38,'#554e42');
    glass.push(face(x,.274,z,bw-1.34,3.15,{variant:(j+Math.round(z))%5}));
    box(x,.30,z,.065,.11,3.27,'#b2ac98');
    box(x,.30,z-.20,bw-1.23,.11,.064,'#aba793');
    box(x,.22,z-1.72,bw-.86,.37,.12,'#a19a84');
   }
  }
  // Masonry joints continue over the upper brickwork; narrow relief pilasters
  // and actual window proportions make the Paramount podium recognizable.
  for(let z=26.6;z<f.height;z+=.45)box(0,.097,z,f.width,.015,.015,'#786e5d');
  if(index===0){
   portal.push(face(archX,.385,15.1,12.0,18.0));
   for(const x of [archX-6.12,archX+6.12])box(x,.28,15.18,.24,.42,18.18,'#b0b1a8');
   box(archX,.13,25.50,14.5,.20,3.45,'#92968e');
   labels.push(face(archX,.48,25.44,13.6,13.6/3.6324786325,{kind:'paramount'}));
   labels.push(face(archX,.42,16.18,2.08,1.02,{kind:'address'}));
   // Bronze-and-glass entrance under the projecting theatre canopy.
   box(archX,.39,2.68,15.8,.40,4.65,'#171f20',true);
   for(let j=0;j<5;j++){
    const x=archX+(j-2)*3.05;
    windows.push(face(x,.613,2.74,2.83,4.12,{kind:'restaurant',variant:j}));
    for(const dx of [-1.47,0,1.47])box(x+dx,.68,2.75,.10,.22,4.26,'#9e7950');
    box(x,.70,4.25,2.96,.20,.095,'#b99062');
    box(x,.69,.73,2.94,.18,.30,'#8a6849');
    for(const dx of [-.19,.19])mesh.tube(p(x+dx,.835,1.30),p(x+dx,.835,2.34),.026,'#d3b083');
   }
   // Neighboring Rock Shop, Taco Bell and lobby stay on this same real facade.
   // The north storefronts now use the user's restaurant-row reference.
   for(const shop of [{x:-24.0,w:11.0,kind:'rock-shop'}]){
    box(shop.x,.29,2.67,shop.w,.36,4.69,'#1c282b',true);
    const cells=Math.max(3,Math.round(shop.w/2.6));
    for(let j=0;j<cells;j++){
     const x=shop.x-shop.w/2+(j+.5)*shop.w/cells;
     windows.push(face(x,.486,2.70,shop.w/cells-.12,3.94,{kind:shop.kind,variant:j}));
     box(x-shop.w/cells/2,.56,2.76,.09,.19,4.46,shop.kind==='rock-shop'?'#30413f':'#8b9290');
    }
    box(shop.x,.58,4.80,shop.w,.48,.64,shop.kind==='taco'?'#29203e':'#1b272a');
    if(shop.kind==='taco')taco.push(face(shop.x,.835,4.83,8.8,1.07,{kind:'wordmark'}));
    else labels.push(face(shop.x,.837,4.80,shop.w-.4,.47,{kind:shop.kind}));
   }
   // Marquee is a curved three-dimensional canopy, not a billboard rectangle.
   const width=16.6,parts=48;
   const front=(t,z=0)=>{const u=t*2-1,arch=.70*Math.pow(Math.cos(u*Math.PI/2),2);return p(archX+u*width/2,2.75+.52*(1-u*u),5.30+arch+z);};
   for(let i=0;i<parts;i++){
    const a=i/parts,b=(i+1)/parts,lo=front(a),ro=front(b),lt=front(a,2.00),rt=front(b,2.00);
    const tangent=ro.clone().sub(lo).setZ(0).normalize(),out=new Vector3(tangent.y,-tangent.x,0);if(out.dot(normal)<0)out.negate();
    marquee.push({corners:[lo.clone().addScaledVector(out,.027),ro.clone().addScaledVector(out,.027),rt.clone().addScaledVector(out,.027),lt.clone().addScaledVector(out,.027)],normal:out,right:tangent,width:lo.distanceTo(ro),height:2,u0:a,u1:b});
    mesh.quad(lo,ro,rt,lt,'#39252a',true);
    const back0=p(archX+(a*2-1)*width/2,.55,lo.z),back1=p(archX+(b*2-1)*width/2,.55,ro.z);
    mesh.quad(back0,back1,ro,lo,'#322b2b',true);
    mesh.quad(lt,rt,back1.clone().setZ(rt.z),back0.clone().setZ(lt.z),'#403036',true);
    for(const z of [-.19,-.07,2.07,2.19])mesh.tube(front(a,z),front(b,z),z===-.07||z===2.07?.032:.082,z===-.07||z===2.07?'#f6d5a3':'#8c6b4d',false,8);
    for(const z of [-.18,2.18]){const at=front((a+b)/2,z).addScaledVector(out,.087);mesh.tube(at,at.clone().addScaledVector(out,.025),.041,'#fff0bd',false,8);}
   }
   for(const t of [0,1]){
    const a=front(t,-.18),b=front(t,2.18);mesh.tube(a,b,.084,'#8c6b4d');
    for(let z=.03;z<2.16;z+=.23){const at=front(t,z).addScaledVector(normal,.08);mesh.tube(at,at.clone().addScaledVector(normal,.028),.044,'#fff0bd',false,8);}
    const lo=front(t),hi=front(t,2);mesh.quad(p(archX+(t*2-1)*width/2,.54,lo.z),lo,hi,p(archX+(t*2-1)*width/2,.54,hi.z),'#50363b',true);
   }
   // Raised crest, warm pin bulbs and carved scrollwork over the curved LED.
   const crest=[[-4.1,8.05],[-3.8,8.90],[-2.0,9.56],[0,10.10],[2.0,9.56],[3.8,8.90],[4.1,8.05]];
   const vertices=crest.map(([x,z])=>p(archX+x,3.24,z));
   mesh.emit(vertices,[[0,1,2],[0,2,3],[0,3,4],[0,4,5],[0,5,6]],'#452f33');
   for(let i=0;i<crest.length;i++){
    const a=vertices[i],b=vertices[(i+1)%crest.length];mesh.tube(a,b,.071,'#a08661');
    const count=Math.ceil(a.distanceTo(b)/.22);for(let j=0;j<count;j++){const at=a.clone().lerp(b,j/count).addScaledVector(normal,.08);mesh.tube(at,at.clone().addScaledVector(normal,.02),.038,'#fff1c7',false,8);}
   }
   labels.push(face(archX,3.33,8.91,6.75,1.28,{kind:'hard-rock'}));
   for(const sign of [-1,1])for(let j=0;j<18;j++){
    const a=j/18*Math.PI*2,b=(j+1)/18*Math.PI*2,cx=archX+sign*4.65,cz=8.05;
    mesh.tube(p(cx+Math.cos(a)*.55,3.20,cz+Math.sin(a)*.45),p(cx+Math.cos(b)*.55,3.20,cz+Math.sin(b)*.45),.084,'#8a7561',false,8);
   }
   const medal=p(archX-8.75,1.78,6.86);mesh.tube(medal,medal.clone().addScaledVector(normal,.17),.91,'#927856',false,32);
   logos.push(face(archX-8.75,1.975,6.86,1.47,.91,{kind:'white'}));
   // Tall sunburst guitar and Taco Bell blade above the south corner.
   const guitarX=-half+2.3;
   box(guitarX,.72,12.38,3.28,1.34,14.38,'#312c2b');
   guitars.push(face(guitarX,1.402,12.38,3.02,14.05));
   logos.push(face(guitarX,1.433,6.57,2.22,1.36,{kind:'color'}));
   for(const side of [-1,1])for(let z=5.43;z<19.4;z+=.30){const at=p(guitarX+side*1.57,1.45,z);mesh.tube(at,at.clone().addScaledVector(normal,.025),.042,'#ffe7b2',false,8);}
   box(guitarX,.80,24.9,3.40,1.48,8.90,'#28243a');
   taco.push(face(guitarX,1.554,24.9,3.18,8.65,{kind:'blade'}));
   lights.push({center:p(archX,3.0,.183),normal:UP,right,up:normal,width:18,height:5});
   night.lights.push(
    {position:p(archX,1.0,6.8).toArray(),radius:[12,12,9],color:[.36,.17,.045]},
    {position:p(guitarX,.8,12.4).toArray(),radius:[5,5,9],color:[.18,.075,.020]},
    {position:p(guitarX,1.0,24.9).toArray(),radius:[5,5,6],color:[.10,.025,.16]}
   );
  }else{
   // 43rd Street return: repeated illuminated signs and tall shop windows.
   for(let x=-half+2.6;x<half-2;x+=5.1){
    windows.push(face(x,.30,2.80,4.4,4.34,{kind:'rock-shop',variant:Math.round(x)}));
    for(const dx of [-2.28,2.28])box(x+dx,.39,2.83,.10,.26,4.40,'#777f7b',true);
   }
   for(const x of [-half+5,-half+13,-half+21]){
    box(x,.65,10.0,2.12,1.0,7.9,'#2a273b');
    taco.push(face(x,1.165,10.0,1.95,7.65,{kind:'banner'}));
    night.lights.push({position:p(x,.8,10).toArray(),radius:[4,4,5],color:[.075,.018,.12]});
   }
  }
 }
 // Ground floors and advertising on the two immediately adjacent buildings.
 for(const f of store.neighbors){
  if(f.id==='north'||f.id==='south')continue; // Dedicated 1515 and Touro skins.
  const n=new Vector3(...f.normal),r=new Vector3(-n.y,n.x,0),o=new Vector3(...f.center),p=(x,y,z)=>o.clone().addScaledVector(r,x).addScaledVector(n,y).setZ(z);
  const face=(x,y,z,w,h,extra={})=>({center:p(x,y,z),normal:n,right:r,width:w,height:h,...extra});
  mesh.box(p(0,.08,f.height/2),r,n,f.width,.16,f.height,'#344249');
  const cells=Math.round(f.width/2.5),bw=f.width/cells;
  for(let x=0;x<cells;x++)for(let z=2.6;z<f.height-2;z+=4.3){
   glass.push(face(-f.width/2+(x+.5)*bw,.176,z,bw-.13,4.05,{variant:x%5}));
   mesh.box(p(-f.width/2+x*bw,.25,z),r,n,.12,.21,4.3,'#a7b3b7');
  }
  for(let z=.45;z<f.height;z+=4.3)mesh.box(p(0,.25,z),r,n,f.width,.19,.12,'#9aa9af');
  if(f.id==='south'){
   mesh.box(p(0,.43,20.4),r,n,f.width-.25,.47,22.8,'#1c2831');
   ads.push(face(0,.678,20.4,f.width-.45,22.56,{art:3}));
   labels.push(face(0,.38,6.67,f.width-.2,.86,{kind:'tour'}));
  }else{
   labels.push(face(0,.39,4.8,f.width-.3,.72,{kind:'tickets'}));
   // Refit the lower ad above the glass podium, below the existing upper
   // collage. Its slim support frame rests on the surveyed podium face.
   mesh.box(p(0,.43,19.4),r,n,f.width-.18,.47,8.70,'#1c2831');
   ads.push(face(0,.678,19.4,f.width-.38,8.46,{art:1,atlas:'landscape'}));
   for(const x of [-f.width/2+.4,f.width/2-.4])mesh.tube(p(x,-.30,11.0),p(x,-.30,23.72),.071,'#33424b');
  }
 }
 // Keep collision identical; only the rendering path changes. Physical trim
 // and masonry get the night material while these actual light sources keep
 // their original brightness and bloom.
 for(const value of mesh.collision)parentMesh.collision.push(value);
 const emissiveColors=new Set(['#f6d5a3','#fff0bd','#fff1c7','#ffe7b2']),batches=new Map(),emissive=new Map();
 for(const [color,vertices]of mesh.batches)(emissiveColors.has(color)?emissive:batches).set(color,vertices);
 return {portal,labels,glass,windows,marquee,guitars,logos,taco,ads,lights,batches,emissive,night};
}
