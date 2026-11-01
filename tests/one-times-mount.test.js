import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Vector3} from 'three';
import {CollisionWorld} from '../src/collision.js';
test('One Times Square stack mounts on the recessed tall tower at every panel corner',async()=>{
 const prior=globalThis.fetch;globalThis.fetch=async u=>new Response(await readFile('public'+u));
 try{const w=new CollisionWorld(JSON.parse(await readFile('public/data/nyc/manifest.json')).files);w.radius=350;await w.stream(new Vector3(-85,-200,0));
 const screens=JSON.parse(await readFile('public/data/landmarks.json')).screens.filter(s=>s.name==='One Times Square · north sign stack');assert.equal(screens.length,3);
 for(const s of screens){const n=new Vector3(...s.normal),r=new Vector3(-n.y,n.x,0);for(const x of [-.5,0,.5])for(const z of [-.5,.5]){
 const p=new Vector3(...s.center).addScaledVector(r,x*s.width).add(new Vector3(0,0,z*s.height)).addScaledVector(n,1);
 const h=w.ray(p,n.clone().negate(),2,true);assert(h&&Math.abs(h.distance-1.35)<.02,'panel corner must attach to upper source facade');assert(h.point.z>67&&h.point.z<102);}}
 }finally{globalThis.fetch=prior;}
});
