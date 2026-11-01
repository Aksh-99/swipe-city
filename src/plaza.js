import{Material}from'./canvas-material.js';
import {Geometry,GeometryAttribute,ComponentDatatype,GeometryInstance,PrimitiveType,BoundingSphere,Primitive,PerInstanceColorAppearance,ColorGeometryInstanceAttribute,Color,MaterialAppearance,Cartesian3} from 'cesium';
import {createPlazaGeometry} from './plaza-geometry.js';
import {plazaPoint} from './plaza-layout.js';
import {toWorld} from './coordinates.js';
function geometry(local,uv){const positions=[];for(let i=0;i<local.length;i+=3){const p=toWorld({x:local[i],y:local[i+1],z:local[i+2]});positions.push(p.x,p.y,p.z);}const values=new Float64Array(positions),attributes={position:new GeometryAttribute({componentDatatype:ComponentDatatype.DOUBLE,componentsPerAttribute:3,values})};if(uv){const normals=new Float32Array(positions.length);for(let i=0;i<positions.length;i+=9){const a=Cartesian3.fromArray(positions,i),b=Cartesian3.fromArray(positions,i+3),c=Cartesian3.fromArray(positions,i+6);const n=Cartesian3.normalize(Cartesian3.cross(Cartesian3.subtract(b,a,new Cartesian3()),Cartesian3.subtract(c,a,new Cartesian3()),new Cartesian3()),new Cartesian3());for(let j=0;j<3;j++)normals.set([n.x,n.y,n.z],i+j*3);}attributes.normal=new GeometryAttribute({componentDatatype:ComponentDatatype.FLOAT,componentsPerAttribute:3,values:normals});}if(uv)attributes.st=new GeometryAttribute({componentDatatype:ComponentDatatype.FLOAT,componentsPerAttribute:2,values:new Float32Array(uv)});return new Geometry({attributes,indices:Uint32Array.from({length:positions.length/3},(_,i)=>i),primitiveType:PrimitiveType.TRIANGLES,boundingSphere:BoundingSphere.fromVertices(values)});}
export function addPlaza(viewer,collision){
 const {batches,collision:triangles}=createPlazaGeometry();collision.addStatic('duffy-plaza',triangles);
 for(const translucent of [false,true]){
  const instances=[];for(const [css,local] of batches){const color=Color.fromCssColorString(css);if((color.alpha<1)!==translucent)continue;instances.push(new GeometryInstance({geometry:geometry(local),attributes:{color:ColorGeometryInstanceAttribute.fromColor(color)}}));}
  viewer.scene.primitives.add(new Primitive({geometryInstances:instances,appearance:new PerInstanceColorAppearance({flat:true,translucent,renderState:{cull:{enabled:false}}}),asynchronous:false}));
 }
 // Plain wayfinding lettering, painted onto the physical pylon in world space.
 const canvas=document.createElement('canvas');canvas.width=128;canvas.height=768;const ctx=canvas.getContext('2d');ctx.fillStyle='#d62845';ctx.fillRect(0,0,128,768);ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font='bold 128px Arial';['t','k','t','s'].forEach((letter,i)=>ctx.fillText(letter,64,160+i*155));
 const corners=[[6.32,.98,.3],[6.83,.98,.3],[6.83,.98,3.55],[6.32,.98,3.55]].map(p=>plazaPoint(...p));const local=[];for(const i of [0,1,2,0,2,3])local.push(...corners[i].toArray());
 viewer.scene.primitives.add(new Primitive({geometryInstances:new GeometryInstance({geometry:geometry(local,[0,0,1,0,1,1,0,0,1,1,0,1])}),appearance:new MaterialAppearance({material:new Material({fabric:{type:'Image',uniforms:{image:canvas}}}),flat:true,translucent:false,renderState:{cull:{enabled:false}}}),asynchronous:false}));
 return {barriers:28,steps:27};
}
