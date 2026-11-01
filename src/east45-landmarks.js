import {Vector3} from 'three';import {vendorOval} from './street-vendor-geometry.js';
export const LIBERTY_EXTRA_PROJECTION=2.2;
export function addLibertyHand(mesh,wallPoint,x){
 const p=(xx,yy,z)=>wallPoint(xx,yy+LIBERTY_EXTRA_PROJECTION*Math.max(0,Math.min(1,(z-4.4)/3.0)),z);
 const copper='#7baba0',light='#99bfb0',shadow='#56877e';
 // Tapered forearm and folded sleeve rise from the entrance canopy.
 mesh.tube(p(x-.20,.56,4.4),p(x,.72,7.5),.45,copper,false,20);for(let j=0;j<8;j++){const a=j*Math.PI/4;mesh.tube(p(x+Math.cos(a)*.38,.62+Math.sin(a)*.22,4.6),p(x+Math.cos(a)*.48,.74+Math.sin(a)*.25,7.4),.045,light);}
 vendorOval(mesh,p,[x,.78,7.8],[.65,.38,.98],copper,18,9);mesh.tube(p(x,.38,7.1),p(x,.38,10.7),.25,shadow,false,16);
 const fingers=[];for(let i=0;i<4;i++){const xx=x-.48+i*.30,z=8.25+Math.sin(i/3*Math.PI)*.25;const points=[[xx,.98,z-.35],[xx,1.16,z+.35],[xx,1.06,z+.93],[xx,.68,z+1.03],[xx,.44,z+.78]];for(let j=1;j<points.length;j++)mesh.tube(p(...points[j-1]),p(...points[j]),.14,copper,false,12);for(const point of points.slice(1,4))vendorOval(mesh,p,point,[.15,.15,.17],light,10,5);fingers.push(points);}
 const thumb=[[x+.52,.73,7.5],[x+.76,1.03,7.9],[x+.45,1.23,8.35],[x+.03,1.20,8.48]];for(let j=1;j<thumb.length;j++)mesh.tube(p(...thumb[j-1]),p(...thumb[j]),.20,copper,false,12);
 // Flared copper bowl with open filigree and a gold sculpted flame.
 for(let j=0;j<24;j++){const a=j*Math.PI/12,b=(j+1)*Math.PI/12;mesh.quad(p(x+Math.cos(a)*.40,.40+Math.sin(a)*.36,10.0),p(x+Math.cos(b)*.40,.40+Math.sin(b)*.36,10.0),p(x+Math.cos(b)*1.15,.40+Math.sin(b)*.62,10.85),p(x+Math.cos(a)*1.15,.40+Math.sin(a)*.62,10.85),copper);mesh.tube(p(x+Math.cos(a)*1.06,.40+Math.sin(a)*.60,10.9),p(x+Math.cos(a)*.94,.40+Math.sin(a)*.55,11.65),.035,light);}
 for(const z of [10.85,11.6])mesh.tube(p(x,.40,z),p(x,.40,z+.12),1.13,light,false,24);vendorOval(mesh,p,[x,.40,12.15],[.62,.46,.90],'#c8ad56',18,9);vendorOval(mesh,p,[x+.24,.40,12.85],[.34,.34,.71],'#e4ca6d',16,8);vendorOval(mesh,p,[x+.02,.40,13.35],[.17,.23,.44],'#d6bb58',12,6);
 return {extraProjection:LIBERTY_EXTRA_PROJECTION,fingers:4,thumbSegments:3,wrist:p(x,.72,6),palm:p(x,.78,7.8),top:13.79};}
export function addPharmacy({mesh,glow,labels,glass},f,{p,n,r}){const w=f.width;const box=(x,y,z,a,d,h,c,solid=false)=>mesh.box(p(x,y,z),r,n,a,d,h,c,solid);box(0,.22,2.45,w,.24,4.6,'#d3c8a9');glass.push({center:p(0,.36,2.2),normal:n,right:r,width:w-.5,height:3.9,kind:'glass'});for(let x=-w/2+.1;x<w/2;x+=1.6)box(x,.46,2.2,.06,.13,4.1,'#717e7b');box(0,.58,4.65,w,1.2,1.0,'#e5dac0',true);labels.push({center:p(0,1.20,4.68),normal:n,right:r,width:w-.20,height:.83,kind:'Duane Reade'});glow.box(p(0,1.24,4.18),r,n,w-.2,.04,.04,'#f6dfac');labels.push({center:p(0,.47,3.0),normal:n,right:r,width:1.0,height:.9,kind:'Walgreens W'});}
export function addPubDetails({mesh,glow,labels,pubSigns,glass,flags},f,{p,n,r}){
 const w=f.width,conn=w>=10,h=conn?Math.min(12.2,f.top-.1):10.0,wood=conn?'#392a26':'#173a2b';
 const box=(x,y,z,a,d,hh,c,solid=false)=>mesh.box(p(x,y,z),r,n,a,d,hh,c,solid),sign=(x,y,z,a,hh,kind)=>pubSigns.push({center:p(x,y,z),normal:n,right:r,width:a,height:hh,kind});
 // Complete shop surface: actual dark wood below a substantial projecting cornice.
 box(0,.14,(h+.2)/2,w,.25,h-.2,wood);
 const bays=conn?4:2,pitch=w/bays;
 for(let j=0;j<bays;j++){const x=-w/2+(j+.5)*pitch;
  for(const z of conn?[6.4,10.0]:[6.15]){for(const dx of [-pitch/2+.18,pitch/2-.18])box(x+dx,.47,z,.19,.24,conn?2.8:3.8,'#574238');for(const zz of [-1.2,1.2])box(x,.47,z+zz,pitch-.30,.22,.16,'#6d5140');box(x,.46,z,.06,.12,2.3,'#927b56');}
  if(conn)for(const z of [4.85,8.4]){box(x,.35,z,pitch-.45,.25,.72,'#594136');box(x,.50,z,pitch-.67,.06,.45,'#3b2a26');}
  // Ground floor door glazing and solid door stiles.
  for(const dx of [-pitch/2+.1,pitch/2-.1])box(x+dx,.50,1.8,.16,.25,3.35,'#263b2f');box(x,.53,1.4,.055,.10,.42,'#c0a46b');
  if(conn)vendorOval(mesh,p,[x,.50,1.5],[.36,.035,.55],'#adb2a4',18,8);
 }
 for(const z of conn?[4.25,7.95,11.6,12.05]:[4.0,8.1,9.7]){box(0,.41,z,w,.60,.22,'#4a362d');box(0,.73,z+.08,w,.08,.055,'#a38b58');}
 for(let x=-w/2+.2;x<w/2;x+=.25)box(x,.63,h-.25,.11,.36,.16,'#6c5340');
 if(conn){
  sign(0,.78,11.72,w-.3,.28,'connolly');sign(0,.76,4.65,w*.70,.70,'connolly');
  // The arched forest-green entrance canopy projects almost two metres.
  const cw=w*.77;for(let j=0;j<20;j++){const a=j/20*Math.PI/2,b=(j+1)/20*Math.PI/2,y0=.3+Math.sin(a)*1.75,y1=.3+Math.sin(b)*1.75,z0=3.52+Math.cos(a)*.76,z1=3.52+Math.cos(b)*.76;mesh.quad(p(-cw/2,y0,z0),p(cw/2,y0,z0),p(cw/2,y1,z1),p(-cw/2,y1,z1),'#184735',true);}
  box(0,2.10,3.55,cw,.15,.6,'#174732');sign(0,2.19,3.57,cw-.15,.49,'awning');
  const bx=w/2-.46,by=1.85;box(bx,by,8.0,.32,3.5,7.6,'#173e2d');for(const side of [-1,1]){const nn=r.clone().multiplyScalar(side),rr=n.clone().multiplyScalar(-side),center=p(bx+side*.175,by,8);pubSigns.push({center,normal:nn,right:rr,width:3.35,height:7.45,kind:'vertical'});for(const yy of [-1.73,1.73])glow.tube(p(bx+side*.19,by+yy,4.23),p(bx+side*.19,by+yy,11.77),.025,'#78c573',false,7);pubSigns.push({center:p(bx+side*.19,by,12.25),normal:nn,right:rr,width:2.50,height:.83,kind:'pubcap'});}
  // A real projecting shamrock sign, rotated toward approaching street traffic.
  const center=p(-w*.14,1.7,13.4),sn=n.clone().multiplyScalar(.82).addScaledVector(r,.57).normalize(),sr=new Vector3(-sn.y,sn.x,0),sp=(x,y,z)=>center.clone().addScaledVector(sr,x).addScaledVector(sn,y).add(new Vector3(0,0,z));
  for(const [dx,z]of [[-.95,-.5],[.95,-.5],[0,.65]]){vendorOval(mesh,sp,[dx,0,z],[1.2,.10,1.05],'#174b33',24,8);let last;for(let i=0;i<=48;i++){const a=i*Math.PI/24,next=sp(dx+Math.cos(a)*1.2,.13,z+Math.sin(a)*1.05);if(last)glow.tube(last,next,.025,'#71c978',false,7);last=next;}}
  pubSigns.push({center:sp(0,.16,0),normal:sn,right:sr,width:3.7,height:2.5,kind:'badge'});mesh.tube(p(-w*.14,0,10.8),center,.075,'#647066');mesh.tube(p(-w*.14+1.5,0,11.8),center.clone().addScaledVector(sr,1.0),.07,'#647066');
 }else{
  // The Perfect Pint has a pale stone band and a fine iron balcony above its green shop windows.
  box(0,.83,3.95,w,1.3,.54,'#b8b3a0');sign(0,.79,8.75,w-.2,.72,'perfect');box(0,.85,9.2,w,1.5,.14,'#3b4336');
  for(let x=-w/2+.14;x<w/2;x+=.34){mesh.tube(p(x,1.57,9.25),p(x,1.57,10.25),.021,'#a59466');const loop=[];for(let j=0;j<=16;j++){const a=j*Math.PI/8;loop.push(p(x+Math.cos(a)*.13,1.57,9.75+Math.sin(a)*.25));}for(let j=1;j<loop.length;j++)mesh.tube(loop[j-1],loop[j],.013,'#ad9866');}box(0,1.57,10.25,w,.08,.07,'#9f8c5d');
 }
 // Angled Irish and American flags, mounted above head height and below the sign blades.
 const count=conn?5:2;for(let i=0;i<count;i++){const x=-w*.38+i*w*.76/Math.max(1,count-1),z=conn?6.0:10.3,end=p(x,2.4,z+.3);mesh.tube(p(x,.1,z+1.7),end,.035,'#b6bbaa');for(let j=0;j<12;j++){const u=j/12,v=(j+1)/12;flags.push({corners:[end.clone().addScaledVector(r,u*1.65),end.clone().addScaledVector(r,v*1.65),end.clone().addScaledVector(r,v*1.65).addScaledVector(n,Math.sin(v*7)*.14).add(new Vector3(0,0,-1.1)),end.clone().addScaledVector(r,u*1.65).addScaledVector(n,Math.sin(u*7)*.14).add(new Vector3(0,0,-1.1))],center:end,normal:n,right:r,width:1.65/12,height:1.1,kind:i%2,u0:u,u1:v});}}
 for(let x=-w/2+.3;x<w/2;x+=.55)glow.box(p(x,.85,h+.05),r,n,.07,.10,.055,'#f1d18e');
 // Framed pavement menu board, set at the curb side of the clear pedestrian lane.
 const ax=-w*.30,ay=3.3;box(ax,ay,.85,.75,.28,1.3,'#d7ce55',true);box(ax,ay+.155,.87,.63,.045,1.14,'#173f30');sign(ax,ay+.185,.87,.59,1.08,'aboard');for(const dx of [-.30,.30])mesh.tube(p(ax+dx,ay-.35,.17),p(ax+dx,ay,1.5),.025,'#d6c954',true);
 return {name:conn?'Connolly’s':'The Perfect Pint',center:f.center,vertical:conn,rooftop:conn,levels:conn?3:2,backdrop:{center:p(0,.28,(h+.2)/2),normal:n,right:r,width:w-.02,height:h-.2,kind:conn?'connolly':'perfect'}};
}
export function pubAtlas(){const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=3584;const c=canvas.getContext('2d');for(let i=0;i<7;i++){const y=i*512;c.fillStyle='#173e2d';c.fillRect(0,y,1024,512);c.strokeStyle='#7aaf68';c.lineWidth=5;c.strokeRect(6,y+6,1012,500);c.fillStyle='#eee4c7';c.textAlign='center';c.textBaseline='middle';if(i===0){c.font='130px Georgia';c.fillText('PUB & RESTAURANT',512,y+180,960);c.font='74px Georgia';c.fillText('ROOF BAR & DINING',512,y+350,960);}if(i===1){c.font='bold 260px Georgia';c.fillStyle='#e6bd68';c.fillText('THE PERFECT PINT',512,y+260,970);}if(i===2){c.font='bold 100px Georgia';c.fillText('PUB',512,y+85);c.font='bold 155px Georgia';c.fillText('CONNOLLY’S',512,y+240,970);c.font='78px Georgia';c.fillText('RESTAURANT',512,y+370);c.font='48px Arial';c.fillText('LIVE MUSIC',512,y+457);}if(i===3){c.font='bold 44px Georgia';Array.from('CONNOLLY’S').forEach((ch,j)=>c.fillText(ch,512,y+36+j*47,175));}if(i===4){c.font='bold 330px Georgia';c.fillText('PUB',512,y+260,900);}if(i===5){c.font='180px Georgia';c.fillText('CONNOLLY’S',512,y+200,970);c.font='80px Georgia';c.fillText('P U B',512,y+390,850);}if(i===6){c.font='bold 110px Georgia';c.fillText('CONNOLLY’S',512,y+100,950);c.font='80px Georgia';c.fillText('LIVE MUSIC',512,y+240,950);c.font='65px Georgia';c.fillText('FOOD & DRINK',512,y+360,950);}}return canvas;}
