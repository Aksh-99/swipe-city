import {Vector3} from 'three';
import {cutGroundTriangle} from './ground-cutouts.js';
const BOX=[[0,2,1],[0,3,2],[4,5,6],[4,6,7],[0,1,5],[0,5,4],[3,7,6],[3,6,2],[0,4,7],[0,7,3],[1,2,6],[1,6,5]];
export class DetailMesh{
 constructor(cutouts=[]){this.batches=new Map();this.collision=[];this.cutouts=cutouts;}
 emit(vertices,faces,color,solid=false){
  if(color&&!this.batches.has(color))this.batches.set(color,[]);
  for(const face of faces){const triangles=this.cutouts.length?cutGroundTriangle(face.map(i=>vertices[i]),this.cutouts):[face.map(i=>vertices[i])];for(const tri of triangles)for(const v of tri){if(color)this.batches.get(color).push(v.x,v.y,v.z);if(solid)this.collision.push(v.x,v.y,v.z);}}
 }
 quad(a,b,c,d,color,solid=false){this.emit([a,b,c,d],[[0,1,2],[0,2,3]],color,solid);}
 box(center,right,forward,w,d,h,color,solid=false){
  const vs=[];for(const z of [-1,1])for(const [x,y] of [[-1,-1],[1,-1],[1,1],[-1,1]])vs.push(center.clone().addScaledVector(right,x*w/2).addScaledVector(forward,y*d/2).add(new Vector3(0,0,z*h/2)));
  this.emit(vs,BOX,color,solid);
 }
 tube(a,b,r,color,solid=false,sides=8){
  const dir=b.clone().sub(a).normalize(),u=new Vector3().crossVectors(dir,Math.abs(dir.z)>.9?new Vector3(1,0,0):new Vector3(0,0,1)).normalize(),v=new Vector3().crossVectors(dir,u).normalize();
  const vs=[];for(const p of [a,b])for(let i=0;i<sides;i++)vs.push(p.clone().addScaledVector(u,Math.cos(i/sides*Math.PI*2)*r).addScaledVector(v,Math.sin(i/sides*Math.PI*2)*r));
  const faces=[];for(let i=0;i<sides;i++){const j=(i+1)%sides;faces.push([i,j,j+sides],[i,j+sides,i+sides]);if(i>0&&i<sides-1)faces.push([0,i+1,i],[sides,sides+i,sides+i+1]);}
  this.emit(vs,faces,color,solid);
 }
}
