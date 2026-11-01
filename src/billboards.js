import {applyBillboardLight} from './billboard-lighting.js';
import{morgan48Replaces}from'./morgan48.js';
import{mmsWholeReplaces}from'./mms-whole.js';
import{rockefeller48Replaces}from'./rockefeller48.js';
import{five48Replaces}from'./five48.js';
import{voco48Replaces}from'./voco48.js';
import{renaissance48Replaces}from'./renaissance48.js';
import{krispy48Replaces}from'./krispy48.js';
import{doughnut48Replaces}from'./hyatt48.js';
import{west48Replaces}from'./west48-config.js';
import{reference48Replaces}from'./fdny-theta48-config.js';
import{sixth47Replaces}from'./sixth47-config.js';
import{tsx47Replaces}from'./tsx47-config.js';
import {addOneTimesWrap} from './one-times-wrap.js';
import {two47Replaces} from './two47-config.js';
import {corner47Replaces} from './corner47-config.js';
import {mid47Replaces} from './mid47-config.js';
import {biltmore47Replaces} from './biltmore47-config.js';
import {carve47Replaces} from './carve47.js';
import {sixth46ReplacesScreen} from './sixth46-config.js';
import {east46ReplacesScreen} from './east46-config.js';
import {w46CornersReplace} from './w46-corner-config.js';
import {west46ReplacesScreen} from './west46-config.js';
import {east45ReplacesScreen} from './east45-config.js';
import {mcdonaldsReplacesScreen} from './mcdonalds-corner.js';
import {west45ReplacesScreen} from './west45-config.js';
import {paramountReplacesScreen} from './paramount-corner-config.js';
import {studiosReplacesScreen} from './studios-config.js';
import {south42ReplacesScreen} from './south42-transit-config.js';
import {fiveTimesReplacesScreen} from './five-times-config.js';
import {east42ReplacesScreen} from './east42-config.js';
import {north42ReplacesScreen} from './north42-config.js';
import { Vector3 } from 'three';
import { Geometry,GeometryAttribute,ComponentDatatype,PrimitiveType,BoundingSphere,GeometryInstance,Primitive,MaterialAppearance,Material,Color,Cartesian3 } from 'cesium';
import { signStructures } from './sign-structures.js';
import { toWorld,worldDirection } from './coordinates.js';
import {storefrontReplacesScreen} from './storefront-config.js';
import {nasdaqReplacesScreen} from './nasdaq-config.js';
import {lyricReplacesScreen} from './lyric-config.js';
import {cinemaReplacesScreen} from './cinema-config.js';
import {attractionReplacesScreen} from './attractions-config.js';
import {avenueReplacesScreen} from './avenue-config.js';
import {broadwayRetailReplacesScreen} from './broadway-retail-config.js';
import {touroReplacesScreen} from './touro-config.js';
// A tiny authored layer over streamed original NYC buildings. Two atlas batches,
// not one draw call or texture per advertisement. Geographic positions are baked
// by prepare-landmarks.mjs against the same surveyed triangles as collision.
export async function addBillboards(viewer){
 const response=await fetch('/data/landmarks.json');if(!response.ok)throw new Error('Times Square landmark details unavailable');
 addOneTimesWrap(viewer);
 const data=await response.json(),screens=data.screens.filter(screen=>!morgan48Replaces(screen)&&!mmsWholeReplaces(screen)&&!rockefeller48Replaces(screen)&&!five48Replaces(screen)&&!voco48Replaces(screen)&&!renaissance48Replaces(screen)&&!krispy48Replaces(screen)&&!doughnut48Replaces(screen)&&!west48Replaces(screen)&&!reference48Replaces(screen)&&!sixth47Replaces(screen)&&!tsx47Replaces(screen)&&screen.name!=='One Times Square · north sign stack'&&!two47Replaces(screen)&&!corner47Replaces(screen)&&!mid47Replaces(screen)&&!biltmore47Replaces(screen)&&!carve47Replaces(screen)&&!sixth46ReplacesScreen(screen)&&!east46ReplacesScreen(screen)&&!w46CornersReplace(screen)&&!west46ReplacesScreen(screen)&&!east45ReplacesScreen(screen)&&!mcdonaldsReplacesScreen(screen)&&!west45ReplacesScreen(screen)&&!paramountReplacesScreen(screen)&&!studiosReplacesScreen(screen)&&!touroReplacesScreen(screen)&&!east42ReplacesScreen(screen)&&!fiveTimesReplacesScreen(screen)&&!south42ReplacesScreen(screen)&&!north42ReplacesScreen(screen)&&!storefrontReplacesScreen(screen)&&!nasdaqReplacesScreen(screen)&&!lyricReplacesScreen(screen)&&!cinemaReplacesScreen(screen)&&!attractionReplacesScreen(screen)&&!avenueReplacesScreen(screen)&&!broadwayRetailReplacesScreen(screen));if(screens.length)viewer.scene.primitives.add(signStructures(screens));
 for(const atlas of ['portrait','landscape']){
  const positions=[],normals=[],uv=[],indices=[];
  for(const screen of screens.filter(s=>s.atlas===atlas)){
   const center=new Vector3(...screen.center),normal=new Vector3(...screen.normal),right=new Vector3().crossVectors(new Vector3(0,0,1),normal);
   const columns=atlas==='portrait'?4:2,rows=2,col=screen.ad%columns,row=1-Math.floor(screen.ad/columns),base=positions.length/3;
   for(const [x,z] of [[-1,-1],[1,-1],[1,1],[-1,1]]){
    const p=toWorld(center.clone().addScaledVector(normal,.06).addScaledVector(right,x*screen.width/2).add(new Vector3(0,0,z*screen.height/2)));positions.push(p.x,p.y,p.z);
    const n=worldDirection(normal);normals.push(n.x,n.y,n.z);
    uv.push((col+(x+1)/2*.994+.003)/columns,(row+(z+1)/2*.994+.003)/rows);
   }
   indices.push(base,base+1,base+2,base,base+2,base+3);
  }
  // Custom facade replacements can consume an entire atlas batch. Cesium
  // cannot upload a zero-byte vertex buffer; omit that draw call.
  if(positions.length===0)continue;
  const geometry=new Geometry({attributes:{position:new GeometryAttribute({componentDatatype:ComponentDatatype.DOUBLE,componentsPerAttribute:3,values:new Float64Array(positions)}),normal:new GeometryAttribute({componentDatatype:ComponentDatatype.FLOAT,componentsPerAttribute:3,values:new Float32Array(normals)}),st:new GeometryAttribute({componentDatatype:ComponentDatatype.FLOAT,componentsPerAttribute:2,values:new Float32Array(uv)})},indices:new Uint16Array(indices),primitiveType:PrimitiveType.TRIANGLES,boundingSphere:BoundingSphere.fromVertices(positions)});
  const columns=atlas==='portrait'?4:2;
  const material=new Material({fabric:{type:'TimesSquareScreen'+atlas,uniforms:{image:atlas==='portrait'?'/billboards/portrait-atlas.webp':'/billboards/atlas.webp'},source:`czm_material czm_getMaterial(czm_materialInput materialInput){
    czm_material m=czm_getDefaultMaterial(materialInput);
    vec2 cell=fract(materialInput.st*vec2(${columns}.0,2.0));
    float edge=step(.012,cell.x)*step(cell.x,.988)*step(.012,cell.y)*step(cell.y,.988);
    vec3 ad=texture(image,materialInput.st).rgb;
    m.diffuse=vec3(.004);m.emission=gl_FrontFacing?ad*edge*.87:vec3(.008);m.alpha=1.0;return m;
  }`}});
  applyBillboardLight(material);
  material.translucent=false;
  viewer.scene.primitives.add(new Primitive({geometryInstances:new GeometryInstance({geometry}),appearance:new MaterialAppearance({material,flat:true,translucent:false,renderState:{cull:{enabled:false},polygonOffset:{enabled:true,factor:-2,units:-4}}}),asynchronous:false}));
 }
 // Real New Year's Eve rooftop feature, at the tower's source roof position.
 viewer.entities.add({position:toWorld({x:-86.5,y:-201.5,z:107}),cylinder:{length:10,topRadius:.12,bottomRadius:.12,material:Color.fromCssColorString('#8d9ca9')}});
 viewer.entities.add({position:toWorld({x:-86.5,y:-201.5,z:112}),ellipsoid:{radii:new Cartesian3(1.8,1.8,1.8),material:Color.fromCssColorString('#d8eeff'),outline:true,outlineColor:Color.fromCssColorString('#7ab8dc'),slicePartitions:12,stackPartitions:8}});
 viewer.scene.billboardAdCount=screens.length;
 return screens;
}
