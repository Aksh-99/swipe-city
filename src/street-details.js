import {applyBillboardLight} from './billboard-lighting.js';
import{Material}from'./canvas-material.js';
import {Geometry,GeometryAttribute,ComponentDatatype,GeometryInstance,Primitive,PrimitiveType,BoundingSphere,PerInstanceColorAppearance,ColorGeometryInstanceAttribute,Color,MaterialAppearance} from 'cesium';
import {Vector3} from 'three';
import {toWorld,worldDirection,frame} from './coordinates.js';
import {makeStreetLayout,signalPhase} from './street-layout.js';
import {createSidewalkGeometry,createSignalGeometry} from './street-detail-geometry.js';
import {plazaAppearance} from './plaza-lighting.js';

// Preallocated affine conversion avoids a Cartesian3 and a temporary JS array
// for every scenery vertex during startup.
export function detailWorldPositions(local){const out=new Float64Array(local.length);for(let i=0;i<local.length;i+=3){const x=local[i],y=local[i+1],z=local[i+2];out[i]=frame[0]*x+frame[4]*y+frame[8]*z+frame[12];out[i+1]=frame[1]*x+frame[5]*y+frame[9]*z+frame[13];out[i+2]=frame[2]*x+frame[6]*y+frame[10]*z+frame[14];}return out;}
function geometry(local,uv,normals,localPositions=false){
 const positions=detailWorldPositions(local),indices=new Uint32Array(local.length/3);for(let i=0;i<indices.length;i++)indices[i]=i;
 const attributes={position:new GeometryAttribute({componentDatatype:ComponentDatatype.DOUBLE,componentsPerAttribute:3,values:positions})};
 if(uv)attributes.st=new GeometryAttribute({componentDatatype:ComponentDatatype.FLOAT,componentsPerAttribute:2,values:new Float32Array(uv)});
 if(normals)attributes.normal=new GeometryAttribute({componentDatatype:ComponentDatatype.FLOAT,componentsPerAttribute:3,values:new Float32Array(normals)});
 if(localPositions)attributes.localPosition=new GeometryAttribute({componentDatatype:ComponentDatatype.FLOAT,componentsPerAttribute:3,values:new Float32Array(local)});
 return new Geometry({attributes,indices,primitiveType:PrimitiveType.TRIANGLES,boundingSphere:BoundingSphere.fromVertices(positions)});
}
export function addBatches(viewer,batches,surface=false,translucent=false,appearance=null){
 const instances=[];
 for(const [css,local] of batches){const uv=[];if(surface)for(let i=0;i<local.length;i+=3)uv.push(local[i],local[i+1]);instances.push(new GeometryInstance({geometry:geometry(local,surface?uv:undefined,undefined,!!appearance),attributes:{color:ColorGeometryInstanceAttribute.fromColor(Color.fromCssColorString(css))}}));}
 // Surface ST stores local metres, outside Cesium's compressed [0,1] UV range.
 viewer.scene.primitives.add(new Primitive({geometryInstances:instances,appearance:appearance||(surface?plazaAppearance():new PerInstanceColorAppearance({flat:true,translucent,renderState:{cull:{enabled:false}}})),compressVertices:false,asynchronous:false}));
}
export function addFaces(viewer,faces,material,coords,translucent=false,renderState={}){
 if(!faces.length)return;
 applyBillboardLight(material);
 const local=[],uv=[],normals=[];
 for(const f of faces){const n=worldDirection(f.normal);for(const i of [0,1,2,0,2,3]){const [u,v]=[[0,0],[1,0],[1,1],[0,1]][i],p=f.corners?f.corners[i]:f.center.clone().addScaledVector(f.right,(u-.5)*f.width).addScaledVector(f.up||new Vector3(0,0,1),(v-.5)*f.height);local.push(...p.toArray());normals.push(n.x,n.y,n.z);uv.push(...coords(f,u,v));}}
 // Signal UV bands carry lamp/group IDs as well as texture coordinates.
 viewer.scene.primitives.add(new Primitive({geometryInstances:new GeometryInstance({geometry:geometry(local,uv,normals)}),appearance:new MaterialAppearance({material,flat:true,translucent,renderState:{cull:{enabled:false},...renderState}}),compressVertices:false,asynchronous:false}));
}
function pedestrianAtlas(){
 const canvas=document.createElement('canvas');canvas.width=640;canvas.height=512;const c=canvas.getContext('2d');c.fillStyle='#080d11';c.fillRect(0,0,640,512);
 for(let tile=0;tile<17;tile++){
  c.save();c.translate(tile%5*128,Math.floor(tile/5)*128);c.fillStyle=c.strokeStyle=tile===0?'#f6fff9':'#ff9146';
  if(tile===0){
   c.beginPath();c.arc(65,24,8,0,Math.PI*2);c.fill();c.lineWidth=10;c.lineCap='round';c.lineJoin='round';
   for(const p of [[[62,43],[52,66],[66,83],[80,109]],[[56,66],[49,94],[36,110]],[[61,43],[82,64],[92,65]],[[60,43],[43,55],[36,73]]]){c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();}
  }else{
   c.save();c.translate(tile===1?32:4,18);c.scale(.73,.88);c.beginPath();[[18,46],[18,15],[25,11],[30,15],[30,41],[32,5],[40,2],[45,7],[44,39],[48,9],[56,8],[61,14],[58,42],[62,25],[70,25],[74,32],[70,64],[58,95],[30,95],[18,77],[5,55],[7,47],[15,46],[28,62]].forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();c.restore();
   if(tile>1){c.font='bold 64px monospace';c.textAlign='center';c.fillText(String(17-tile).padStart(2,'0'),91,85,69);}
  }
  // Fine LED matrix breaks up the flat icons when viewed close to the signal.
  c.globalCompositeOperation='source-atop';c.fillStyle='rgba(0,0,0,.3)';for(let x=0;x<128;x+=4)c.fillRect(x,0,1,128);for(let y=0;y<128;y+=4)c.fillRect(0,y,128,1);c.restore();
 }
 return canvas;
}
function streetNameAtlas(names){const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=Math.ceil(names.length/4)*96;const c=canvas.getContext('2d');c.fillStyle='#164d3f';c.fillRect(0,0,canvas.width,canvas.height);names.forEach((name,i)=>{const x=i%4*256,y=Math.floor(i/4)*96;c.strokeStyle='#d9e9df';c.lineWidth=3;c.strokeRect(x+6,y+7,244,82);c.fillStyle='#f3fff6';c.font='bold 41px Arial';c.textAlign='center';c.fillText(name,x+128,y+63,222);});return canvas;}

export async function addStreetDetails(viewer,collision,streets,{getTime=()=>Date.now()}={}){
 const layout=makeStreetLayout(streets);
 const response=await fetch('/data/street-details.json');if(!response.ok)throw new Error('Mapped street details unavailable');
 const placements=await response.json(),positions=new Map(placements.poles.map(p=>[p.id,p.position]));
 layout.signals=layout.signals.filter(s=>positions.has(s.id));for(const s of layout.signals)s.position.fromArray(positions.get(s.id));
 const sidewalks=createSidewalkGeometry(layout),signals=createSignalGeometry(layout);
 collision.addStatic('sidewalks',sidewalks.collision);collision.addStatic('signal-poles',signals.collision);
 addBatches(viewer,sidewalks.batches,true);addBatches(viewer,signals.batches);
 const phase=signalPhase(getTime()/1000),trafficMaterial=new Material({translucent:false,fabric:{type:'TimesSquareSignalLenses',uniforms:{stateA:phase.a,stateB:phase.b},source:`czm_material czm_getMaterial(czm_materialInput materialInput){
  czm_material m=czm_getDefaultMaterial(materialInput);vec2 uv=fract(materialInput.st)/.49;float radius=length(uv-.5);if(radius>.5)discard;
  float group=floor(materialInput.st.x),lamp=floor(materialInput.st.y),state=group<.5?stateA:stateB;float lampOn=1.0-step(.1,abs(lamp-state));
  vec3 color=lamp<.5?vec3(1.0,.055,.012):lamp<1.5?vec3(1.0,.62,.02):vec3(.05,1.0,.44);
  float leds=.87+.13*sin(uv.x*160.0)*sin(uv.y*160.0);m.diffuse=vec3(.008);m.emission=gl_FrontFacing?color*(.025+lampOn*.975)*leds:vec3(.01);m.alpha=1.0;return m;
 }`}});
 addFaces(viewer,signals.lenses,trafficMaterial,(f,u,v)=>[f.group+u*.49,f.light+v*.49]);
 const pedMaterial=new Material({translucent:false,fabric:{type:'TimesSquarePedestrianSignals',uniforms:{image:pedestrianAtlas(),tileA:phase.pedA,tileB:phase.pedB},source:`czm_material czm_getMaterial(czm_materialInput materialInput){
  czm_material m=czm_getDefaultMaterial(materialInput);float group=floor(materialInput.st.x),tile=group<.5?tileA:tileB;vec2 uv=vec2(fract(materialInput.st.x)/.49,materialInput.st.y);
  uv=clamp(uv,vec2(.005),vec2(.995));
  vec2 at=(vec2(mod(tile,5.0),3.0-floor(tile/5.0))+uv)/vec2(5.0,4.0);m.diffuse=vec3(.002);m.emission=gl_FrontFacing?texture(image,at).rgb:vec3(.01);m.alpha=1.0;return m;
 }`}});
 addFaces(viewer,signals.pedestrians,pedMaterial,(f,u,v)=>[f.group+u*.49,v]);
 const names=[...new Set(signals.labels.map(f=>f.name))],rows=Math.ceil(names.length/4),atlas=streetNameAtlas(names);
 const labelMaterial=new Material({fabric:{type:'TimesSquareStreetNames',uniforms:{image:atlas},source:`czm_material czm_getMaterial(czm_materialInput materialInput){czm_material m=czm_getDefaultMaterial(materialInput);m.diffuse=vec3(.02);m.emission=texture(image,materialInput.st).rgb*.7;m.alpha=1.0;return m;}`}});
 addFaces(viewer,signals.labels,labelMaterial,(f,u,v)=>{const i=names.indexOf(f.name);return [(i%4+u)/4,(rows-1-Math.floor(i/4)+v)/rows];});
 let last=-1,current=phase;
 viewer.scene.preUpdate.addEventListener(()=>{const t=Math.floor(getTime()/1000);if(t===last)return;last=t;current=signalPhase(t);trafficMaterial.uniforms.stateA=current.a;trafficMaterial.uniforms.stateB=current.b;pedMaterial.uniforms.tileA=current.pedA;pedMaterial.uniforms.tileB=current.pedB;});
 return {sidewalkPaths:layout.sidewalks.length,sidewalkMeters:Math.round(sidewalks.length),poles:layout.signals.length,vehicleHeads:signals.vehicleHeads,pedestrianHeads:signals.pedestrians.length,addAuthoredHeads(heads){const pedestrians=heads.filter(h=>h.kind==='pedestrian'),vehicles=heads.filter(h=>h.kind==='vehicle');addFaces(viewer,pedestrians,pedMaterial,(f,u,v)=>[f.group+u*.49,v]);addFaces(viewer,vehicles,trafficMaterial,(f,u,v)=>[f.group+u*.49,f.light+v*.49]);return{pedestrianHeads:pedestrians.length,vehicleLenses:vehicles.length};},get phase(){return current;},layout};
}
