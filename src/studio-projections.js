import {Vector3} from 'three';import {STUDIOS} from './studios-config.js';
export const STUDIO_PROJECTIONS=[{id:'upper-screen',z:15.5,height:6.7,depth:3.4,kind:'gma'},{id:'upper-blue-band',z:11.68,height:.72,depth:3.4,kind:'ticker'},{id:'lower-blue-band',z:6.35,height:.72,depth:2.8,kind:'ticker'},{id:'lower-news-band',z:5.42,height:.94,depth:2.8,kind:'sports'}];
const at=(p,z)=>p.clone().setZ(z);
export function studioCorner(){const f=STUDIOS.facades.find(f=>f.id==='studio-front'),s=STUDIOS.facades.find(f=>f.id==='studio-return'),n=new Vector3(...f.normal),m=new Vector3(...s.normal),c=new Vector3(...f.center),d=new Vector3(...s.center);const det=n.x*m.y-n.y*m.x,a=c.dot(n),b=d.dot(m);return new Vector3((a*m.y-n.y*b)/det,(n.x*b-a*m.x)/det,0);}
export function studioProjectionPath(depth){const front=STUDIOS.facades.find(f=>f.id==='studio-front'),side=STUDIOS.facades.find(f=>f.id==='studio-return'),n=new Vector3(...front.normal),m=new Vector3(...side.normal),r=new Vector3(-n.y,n.x,0),s=new Vector3(-m.y,m.x,0),corner=studioCorner(),start=new Vector3(...front.center).addScaledVector(r,front.width/2),end=corner.clone().addScaledVector(s,-5.0),points=[];
 const line=(a,b,normal,wave)=>{const length=a.distanceTo(b),steps=Math.ceil(length/.55);for(let j=0;j<steps;j++){const t=j/steps,base=a.clone().lerp(b,t),d=depth+wave*Math.sin(Math.PI*t)**2;points.push({base,outer:base.clone().addScaledVector(normal,d),normal:normal.clone()});}};
 line(start,corner,n,.65);
 let a=Math.atan2(n.y,n.x),b=Math.atan2(m.y,m.x);while(b>a)b-=Math.PI*2;const steps=Math.ceil(Math.abs(b-a)*depth/.22);for(let j=0;j<steps;j++){let t=j/steps,q=a+(b-a)*t,normal=new Vector3(Math.cos(q),Math.sin(q),0);points.push({base:corner.clone(),outer:corner.clone().addScaledVector(normal,depth),normal});}
 line(corner,end,m,0);points.push({base:end.clone(),outer:end.clone().addScaledVector(m,depth),normal:m.clone()});return points;}
export function addStudioProjections(mesh,signs){const result=[];
 for(const item of STUDIO_PROJECTIONS){const path=studioProjectionPath(item.depth),distances=[0];for(let j=1;j<path.length;j++)distances.push(distances[j-1]+path[j].outer.distanceTo(path[j-1].outer));const total=distances.at(-1),lo=item.z-item.height/2,hi=item.z+item.height/2;
  for(let j=0;j<path.length-1;j++){const a=path[j],b=path[j+1],normal=a.normal.clone().add(b.normal).normalize();
   signs.push({corners:[at(a.outer,lo),at(b.outer,lo),at(b.outer,hi),at(a.outer,hi)],normal,right:b.outer.clone().sub(a.outer).normalize(),width:b.outer.distanceTo(a.outer),height:item.height,kind:item.kind,u0:distances[j]/total,u1:distances[j+1]/total,projection:item.id});
   // Solid horizontal soffits, roof caps and edge rails make the stand-off
   // readable from the sidewalk and stop the camera crossing the screen shell.
   for(const [z,color] of [[lo-.11,'#18232c'],[hi+.10,'#34414a']])mesh.quad(at(a.base,z),at(b.base,z),at(b.outer,z),at(a.outer,z),color,true);
   for(const z of [lo-.06,hi+.04])mesh.quad(at(a.outer,z),at(b.outer,z),at(b.outer,z+.10),at(a.outer,z+.10),'#65717a',true);
   const back=p=>p.outer.clone().addScaledVector(p.normal,-.06);mesh.quad(at(back(a),lo-.05),at(back(b),lo-.05),at(back(b),hi+.12),at(back(a),hi+.12),'#0e1822',true);
  }
  for(const p of [path[0],path.at(-1)])mesh.quad(at(p.base,lo-.11),at(p.outer,lo-.11),at(p.outer,hi+.12),at(p.base,hi+.12),'#24313a',true);
  // Horizontal dark seams follow the exact same curved shell.
  if(item.id==='upper-screen')for(let z=lo+1.12;z<hi;z+=1.12)for(let j=0;j<path.length-1;j++){const a=path[j],b=path[j+1],offset=p=>p.outer.clone().addScaledVector(p.normal,.018);mesh.quad(at(offset(a),z-.045),at(offset(b),z-.045),at(offset(b),z+.045),at(offset(a),z+.045),'#101b28');}
  result.push({...item,segments:path.length-1,corner:studioCorner().toArray(),underside:lo-.11,totalLength:total});
 }
 return result;
}
