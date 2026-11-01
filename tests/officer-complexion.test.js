import './helpers/loaded-rigs.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {EntityCollection,Event,Matrix4,JulianDate} from 'cesium';
import {createAvatar} from '../src/avatar.js';

test('Steadfast skin matches civilian face colour in linear glTF space without tinting uniform or equipment',()=>{
 const b=fs.readFileSync('public/characters/indian_fem_officer-meshy.glb');
 const n=b.readUInt32LE(12),g=JSON.parse(b.subarray(20,20+n)),bin=b.subarray(28+n);
 const primitive=g.meshes[0].primitives[0];
 function read(id,columns){const a=g.accessors[id],v=g.bufferViews[a.bufferView],out=[];for(let i=0;i<a.count;i++)out.push(Array.from({length:columns},(_,k)=>bin.readFloatLE((v.byteOffset??0)+(a.byteOffset??0)+i*(v.byteStride??columns*4)+k*4)));return out;}
 const positions=read(primitive.attributes.POSITION,3),colors=read(primitive.attributes.COLOR_0,4);
 let untouchedTorso=0,head=0,hands=0;
 for(let i=0;i<positions.length;i++){
  const [x,y]=positions[i],c=colors[i];assert.equal(c[3],1);
  if(Math.abs(x)<.3&&y>.3&&y<1.30){assert.deepEqual(c,[1,1,1,1]);untouchedTorso++;}
  if(c[0]<1){if(y>1.36)head++;if(Math.abs(x)>.65)hands++;}
 }
 assert(untouchedTorso>1000&&head>500&&hands>200);
 const match=g.extras.complexionMatch;
 const linear=x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4;
 const srgb=x=>x<=.0031308?x*12.92:1.055*x**(1/2.4)-.055;
 for(let i=0;i<3;i++)assert(Math.abs(srgb(linear(match.sourceMedianSRGB[i])*match.linearSkinMultiplier[i])-match.targetMedianSRGB[i])<.002);
 const p={position:{x:0,y:0,z:0},poseWeight:1,runBlend:0,gaitPhase:0,animationTime:0};
 const viewer={entities:new EntityCollection(),scene:{preRender:new Event()},camera:{inverseViewMatrix:Matrix4.IDENTITY}};
 const avatar=createAvatar(viewer,()=>p,{designId:'indian_fem',characterId:'pedestrian'});
 try{
  assert.match(avatar.entity.model.uri.getValue(),/indian_fem_officer-meshy/);
  const pose=()=>avatar.entity.model.nodeTransformations.getValue(JulianDate.now());
  const walk=pose()['mixamorig:LeftForeArm'].rotation;p.runBlend=1;
  assert.notDeepEqual(pose()['mixamorig:LeftForeArm'].rotation,walk);
 }finally{avatar.destroy();}
});
