import {Vector3} from 'three';import {STUDIOS} from './studios-config.js';import {steelCylinder} from './curb-bollard-geometry.js';
const UP=new Vector3(0,0,1);
export function addGapStreetDetails(mesh,signs){const f=STUDIOS.facades.find(f=>f.id==='retail-front'),n=new Vector3(...f.normal),r=new Vector3(-n.y,n.x,0),c=new Vector3(...f.center),p=(x,y,z)=>c.clone().addScaledVector(r,x).addScaledVector(n,y).setZ(z),props=[];
 const box=(x,y,z,w,d,h,color,solid=false)=>mesh.box(p(x,y,z),r,n,w,d,h,color,solid);
 for(const x of [-18,-6,6,18]){const y=6.15,center=p(x,y,.17);const circle=(a,radius,z)=>p(x+Math.cos(a)*radius,y+Math.sin(a)*radius,z),sides=32;
  for(let i=0;i<sides;i++){const a=i*2*Math.PI/sides,b=(i+1)*2*Math.PI/sides;mesh.quad(circle(a,.46,.22),circle(b,.46,.22),circle(b,.65,.89),circle(a,.65,.89),i%4===0?'#a8aaa0':'#8a9289',true);}
  for(let z=.31;z<.90;z+=.065){const rr=.46+(z-.22)/.67*.19;mesh.tube(p(x,y,z),p(x,y,z+.022),rr+.025,'#b0b3a5',false,32);}
  mesh.tube(p(x,y,.89),p(x,y,.915),.61,'#333c2b',true,32);mesh.tube(p(x,y,.90),p(x,y,1.98),.07,'#655340');
  // Dense branches and many separate leaf clusters, rather than a green cube.
  for(let j=0;j<18;j++){const a=j*2.399,rad=.18+(j%4)*.13,z=1.2+(j%5)*.18,xx=x+Math.cos(a)*rad,yy=y+Math.sin(a)*rad;mesh.tube(p(x,y,1.05),p(xx,yy,z),.014,'#6c6950');const vs=[],faces=[],rx=.30+(j%3)*.04,rz=.24;for(let row=0;row<=4;row++)for(let k=0;k<8;k++){const b=row*Math.PI/4,q=k*Math.PI/4;vs.push(p(xx+Math.cos(q)*Math.sin(b)*rx,yy+Math.sin(q)*Math.sin(b)*rx,z+Math.cos(b)*rz));}for(let row=0;row<4;row++)for(let k=0;k<8;k++){const v=row*8+k,next=row*8+(k+1)%8;if(row>0)faces.push([v,next,v+8]);if(row<3)faces.push([next,next+8,v+8]);}mesh.emit(vs,faces,['#3a5938','#527541','#6e854a','#466c3b'][j%4]);}
  props.push({type:'planter',point:center,radius:.66,height:2.0});
 }
 // Silver information kiosk, aligned to the shopfront and readable from plaza.
 const x=11,y=6.1;box(x,y,1.40,.94,.24,2.46,'#89979b',true);box(x,y,2.68,1.00,.28,.09,'#c0c7c4');box(x,y,.28,.98,.46,.20,'#6c7c82',true);
 for(const side of [-1,1])signs.push({center:p(x,y+side*.131,1.48),normal:n.clone().multiplyScalar(side),right:r.clone().multiplyScalar(side),width:.79,height:2.10,kind:'gapmap'});props.push({type:'information-board',point:p(x,y,.17),width:.98,depth:.46,height:2.6});
 for(const bx of [-12,1]){const by=6.1;box(bx,by,.84,1.16,.45,1.33,'#2d3a40',true);for(const side of [-1,1])signs.push({center:p(bx,by+side*.235,.88),normal:n.clone().multiplyScalar(side),right:r.clone().multiplyScalar(side),width:1.02,height:1.12,kind:'gapboard'});props.push({type:'poster-board',point:p(bx,by,.17),width:1.16,depth:.45,height:1.33});}
 for(const bx of [-20,-15,-10,-5,0,5,10,15,20]){const point=p(bx,4.5,.17);steelCylinder(mesh,point,n);props.push({type:'bollard',point,radius:.17,height:1.08});}
 return props;
}
