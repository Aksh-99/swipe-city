import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Vector3} from 'three';
import {DetailMesh} from '../src/detail-mesh.js';
import {replacementTree,clearTreePlacements,treePlacements,treeChunks} from '../src/game-tree-placements.js';
import {instancedTreeAsset,createTreeShader} from '../src/game-trees.js';
import {createMorgan48} from '../src/morgan48.js';
import {createBryantPark} from '../src/bryant-park.js';
import {createWest48} from '../src/west48.js';
import {createFdnyTheta48} from '../src/fdny-theta48.js';
import {createGracePlaza} from '../src/grace-plaza.js';
import {createSixth46Geometry} from '../src/sixth46.js';
import {createSixth47} from '../src/sixth47.js';
import {createRockefeller48} from '../src/rockefeller48.js';
import {createHyatt49} from '../src/hyatt49.js';
import {createHyatt49Street} from '../src/hyatt49-street.js';
import {createSeventh49Corners} from '../src/seventh49-corners.js';
import {createBiltmore47} from '../src/biltmore47.js';
import {createTwo47} from '../src/two47.js';
import {createEast45Geometry} from '../src/east45.js';

test('tree lighting constructs with the real Cesium API without aborting city startup',()=>{
 let shader;
 assert.doesNotThrow(()=>{shader=createTreeShader();});
 try{
  assert(shader.usedVariablesVertex.attributeSet.normalMC);
  assert(!shader.usedVariablesFragment.attributeSet.normalMC);
  assert(shader.varyings.v_treeNormal);
 }finally{shader?.destroy();}
});

test('both uploaded trees retain textured geometry within runtime size and triangle budgets',()=>{
 for(const kind of ['maple','green']){const g=JSON.parse(fs.readFileSync(`public/trees/${kind}.json`)),bin=fs.readFileSync(`public/trees/${kind}.bin`),p=g.meshes[0].primitives[0],pos=g.accessors[p.attributes.POSITION],idx=g.accessors[p.indices],uv=g.accessors[p.attributes.TEXCOORD_0];assert(bin.length<1500000);assert(idx.count/3>20000&&idx.count/3<32000);assert.equal(pos.count,uv.count);assert(pos.min[1]>=-.00001&&pos.max[1]>.98&&pos.max[1]<=1.00001);assert.equal(g.images.length,3);for(const v of g.bufferViews)assert(v.byteOffset+v.byteLength<=bin.length);const v=g.bufferViews[idx.bufferView];for(let i=0;i<idx.count;i++)assert(bin.readUInt32LE(v.byteOffset+i*4)<pos.count);}
});
test('replacement removes old visible geometry while retaining only a narrow solid trunk',()=>{
 clearTreePlacements();const m=new DetailMesh(),p=new Vector3(8,12,.7);replacementTree(m,p,5);replacementTree(m,p,5);assert.equal(treePlacements().length,1);assert.equal(m.batches.size,0);assert(m.collision.length>0);assert.deepEqual(p.toArray(),[8,12,.7]);assert.equal(treePlacements()[0].height,8);assert(Math.max(...m.collision.filter((_,i)=>i%3===2))<4.5);
});
test('each authored street and park registers replacement models with finite grounded positions',()=>{
 clearTreePlacements();for(const make of [createMorgan48,createBryantPark,createWest48,createFdnyTheta48,createGracePlaza,createSixth46Geometry,createSixth47,createRockefeller48,createHyatt49,createHyatt49Street,createSeventh49Corners,createBiltmore47,createTwo47,createEast45Geometry]){const before=treePlacements().length;make();if(make===createTwo47)assert.equal(treePlacements().length,before);else assert(treePlacements().length>before,make.name);}
 const rows=treePlacements();assert(rows.length>90);assert.equal(new Set(rows.map(r=>r.kind)).size,2);for(const r of rows){assert(r.position.every(Number.isFinite));assert(r.position[2]>=.2&&r.position[2]<1.5);assert(r.height>=8&&r.height<=20);}const chunks=treeChunks(rows);assert(chunks.length<rows.length);assert.equal(chunks.reduce((n,c)=>n+c.rows.length,0),rows.length);
});
test('GPU instances convert geographic Z-up positions to glTF Y-up and preserve uniform tree height',()=>{
 const base=JSON.parse(fs.readFileSync('public/trees/maple.json')),chunk={origin:[80,-160,0],rows:[{position:[91,-145,.9],height:6,yaw:Math.PI,kind:'maple'}]},g=instancedTreeAsset(base,chunk,'https://example.com/trees/maple.bin');assert.equal(g.buffers[0].uri,'https://example.com/trees/maple.bin');assert.equal(base.buffers.length,1);const b=Buffer.from(g.buffers[1].uri.split(',')[1],'base64'),v=new Float32Array(b.buffer,b.byteOffset,10);assert.deepEqual(Array.from(v.slice(0,3)).map(n=>Math.round(n*10)/10),[11,.9,-15]);assert.deepEqual(Array.from(v.slice(7)),[6,6,6]);assert(Math.abs(v[4]-1)<1e-6);assert(g.extensionsRequired.includes('EXT_mesh_gpu_instancing'));
});

test('Cesium places every tree trunk back into its original planter in city coordinates',async()=>{
 const {default:ModelUtility}=await import('@cesium/engine/Source/Scene/Model/ModelUtility.js');
 const {Matrix4,Cartesian3}=await import('cesium');
 const {TREE_MODEL_AXES}=await import('../src/game-trees.js');
 const correction=ModelUtility.getAxisCorrectionMatrix(TREE_MODEL_AXES.upAxis,TREE_MODEL_AXES.forwardAxis,new Matrix4());
 clearTreePlacements();for(const make of [createMorgan48,createBryantPark,createWest48,createFdnyTheta48,createGracePlaza,createSixth46Geometry,createSixth47,createRockefeller48,createHyatt49,createHyatt49Street,createSeventh49Corners,createBiltmore47,createTwo47,createEast45Geometry])make();
 for(const chunk of treeChunks(treePlacements())){
  const base=JSON.parse(fs.readFileSync(`public/trees/${chunk.kind}.json`)),g=instancedTreeAsset(base,chunk,'https://example.com/tree.bin'),b=Buffer.from(g.buffers[1].uri.split(',')[1],'base64'),data=new Float32Array(b.buffer,b.byteOffset,b.length/4);
  chunk.rows.forEach((row,i)=>{const p=Matrix4.multiplyByPoint(correction,Cartesian3.fromArray(data,i*3),new Cartesian3());p.x+=chunk.origin[0];p.y+=chunk.origin[1];for(const [j,key]of ['x','y','z'].entries())assert(Math.abs(p[key]-row.position[j])<.00001,`${chunk.kind} ${key}: original ${row.position[j]}, rendered ${p[key]}`);});
 }
});
test('both tree assets have their trunk foot centred exactly at ground level',()=>{
 for(const kind of ['maple','green']){const g=JSON.parse(fs.readFileSync(`public/trees/${kind}.json`)),a=g.accessors[0],v=g.bufferViews[a.bufferView],b=fs.readFileSync(`public/trees/${kind}.bin`);assert.equal(a.min[1],0);let x=0,z=0,n=0;for(let i=0;i<a.count;i++){const o=v.byteOffset+i*12;if(b.readFloatLE(o+4)<=.01){x+=b.readFloatLE(o);z+=b.readFloatLE(o+8);n++;}}assert(n>0);assert(Math.abs(x/n)<1e-7);assert(Math.abs(z/n)<1e-7);}
});

test('street trees tower above characters and Bryant Park keeps mature canopy heights',()=>{
 clearTreePlacements();createMorgan48();const street=treePlacements();for(const row of street)assert(row.height>1.7*4);
 clearTreePlacements();createBryantPark();for(const row of treePlacements())assert(row.height>=16&&row.height<=19.2);
});

test('missing optional tree art reports the problem and still loads the available models',async()=>{
 const {addGameTrees}=await import('../src/game-trees.js'),{Event}=await import('cesium');clearTreePlacements();const m=new DetailMesh();replacementTree(m,new Vector3(0,0,.3),8);replacementTree(m,new Vector3(1,0,.3),8);const added=[],failures=[],shaders=[];
 const result=await addGameTrees({scene:{primitives:{add:model=>added.push(model),remove(){}}}},{resourceOptions:{attempts:1,fetcher:async url=>url.includes('maple')?new Response('',{status:503}):Response.json(JSON.parse(fs.readFileSync('public/trees/green.json')))},loadModel:async options=>{shaders.push(options.customShader);return {errorEvent:new Event()};},onError:error=>failures.push(error)});
 try{assert.equal(added.length,1);assert.equal(result.failures.length,1);assert.equal(failures.length,1);}finally{shaders.forEach(shader=>shader.destroy());}
});
