import {Vector3} from 'three';
import {Geometry,GeometryAttribute,ComponentDatatype,GeometryInstance,PrimitiveType,BoundingSphere,Primitive,PerInstanceColorAppearance,ColorGeometryInstanceAttribute,Color} from 'cesium';
import {toWorld} from './coordinates.js';
// Thin steel screen frames and podium supports: detail geometry only. The
// original buildings remain untouched and supply all ground-level collision.
export function signStructures(screens){
 const positions=[],up=new Vector3(0,0,1);
 const triangles=[[0,2,1],[0,3,2],[4,5,6],[4,6,7],[0,1,5],[0,5,4],[3,7,6],[3,6,2],[0,4,7],[0,7,3],[1,2,6],[1,6,5]];
 function beam(a,b,width){
  const axis=b.clone().sub(a).normalize(),r=new Vector3().crossVectors(axis,Math.abs(axis.z)>.9?new Vector3(0,1,0):up).normalize().multiplyScalar(width/2),t=new Vector3().crossVectors(axis,r).normalize().multiplyScalar(width/2);
  const vertices=[];for(const center of [a,b])for(const [x,y] of [[-1,-1],[1,-1],[1,1],[-1,1]])vertices.push(center.clone().addScaledVector(r,x).addScaledVector(t,y));
  for(const face of triangles)for(const i of face){const p=toWorld(vertices[i]);positions.push(p.x,p.y,p.z);}
 }
 for(const s of screens){
  const n=new Vector3(...s.normal),r=new Vector3().crossVectors(up,n),center=new Vector3(...s.center).addScaledVector(n,-.2);
  const corners=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,z])=>center.clone().addScaledVector(r,x*(s.width/2+.12)).addScaledVector(up,z*(s.height/2+.12)));
  for(let i=0;i<4;i++)beam(corners[i],corners[(i+1)%4],.22);
  if(s.mount==='podium sign gantry')for(const side of [-1,1]){
   const top=center.clone().addScaledVector(r,side*s.width*.43).addScaledVector(n,-.4).addScaledVector(up,s.height*.45);
   const base=top.clone().setZ(7.2);beam(base,top,.22);
   beam(base,center.clone().addScaledVector(r,-side*s.width*.43).addScaledVector(n,-.4).addScaledVector(up,s.height*.45),.14);
  }
 }
 const values=new Float64Array(positions),geometry=new Geometry({attributes:{position:new GeometryAttribute({componentDatatype:ComponentDatatype.DOUBLE,componentsPerAttribute:3,values})},indices:Uint32Array.from({length:positions.length/3},(_,i)=>i),primitiveType:PrimitiveType.TRIANGLES,boundingSphere:BoundingSphere.fromVertices(values)});
 return new Primitive({geometryInstances:new GeometryInstance({geometry,attributes:{color:ColorGeometryInstanceAttribute.fromColor(Color.fromCssColorString('#151e28'))}}),appearance:new PerInstanceColorAppearance({flat:true,translucent:false,renderState:{cull:{enabled:false}}}),asynchronous:false});
}
