import test from 'node:test';import assert from 'node:assert/strict';import {BufferGeometry,BufferAttribute,Ray,Vector3,DoubleSide} from 'three';import {MeshBVH} from 'three-mesh-bvh';import {createCollisionTreeBuilder} from '../src/collision-tree.js';
const triangle=()=>{const g=new BufferGeometry();g.setAttribute('position',new BufferAttribute(new Float32Array([-2,-2,0,2,-2,0,0,2,0]),3));return g;};
test('streamed trees wait asynchronously and preserve the same ground collision after transfer',async()=>{
 const jobs=[],worker={postMessage(job){jobs.push(job);},terminate(){}},build=createCollisionTreeBuilder({makeWorker:()=>worker}),geometry=triangle();let done=false;const result=build(geometry).then(tree=>{done=true;return tree;});await Promise.resolve();assert(!done);assert.equal(jobs.length,1);assert.equal(geometry.attributes.position.array.length,9);
 const copy=triangle(),serialized=MeshBVH.serialize(new MeshBVH(copy));worker.onmessage({data:{id:jobs[0].id,serialized}});const tree=await result;assert.equal(tree.raycastFirst(new Ray(new Vector3(0,0,2),new Vector3(0,0,-1)),DoubleSide).distance,2);
});
test('multiple tile replies resolve their own jobs and worker failure retains safe collision fallback',async()=>{
 const jobs=[],worker={postMessage(job){jobs.push(job);},terminate(){}},build=createCollisionTreeBuilder({makeWorker:()=>worker}),a=build(triangle()),b=build(triangle());const serialized=MeshBVH.serialize(new MeshBVH(triangle()));worker.onmessage({data:{id:jobs[1].id,serialized}});assert(await b);worker.onerror({message:'unavailable'});assert(await a);assert(await build(triangle()));
});
test('the real worker builds a transferable tree while the main thread remains available',async()=>{
 const {Worker}=await import('node:worker_threads');let thread;
 const build=createCollisionTreeBuilder({makeWorker:()=>{thread=new Worker(`const {parentPort}=require('node:worker_threads');globalThis.self={postMessage:(data,transfer)=>parentPort.postMessage(data,transfer)};import(${JSON.stringify(new URL('../src/collision-tree-worker.js',import.meta.url).href)}).then(()=>parentPort.on('message',data=>self.onmessage({data})));`,{eval:true});const adapter={postMessage:(...args)=>thread.postMessage(...args),terminate:()=>thread.terminate()};thread.on('message',data=>adapter.onmessage({data}));thread.on('error',error=>adapter.onerror(error));return adapter;}});
 try{const geometry=triangle(),result=build(geometry);let tick=false;await new Promise(resolve=>setImmediate(()=>{tick=true;resolve();}));assert(tick);const tree=await result;assert.equal(tree.raycastFirst(new Ray(new Vector3(0,0,2),new Vector3(0,0,-1)),DoubleSide).distance,2);}finally{await thread?.terminate();}
});
