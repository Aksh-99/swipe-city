import {createWest45Corners} from '../src/west45-corners.js';
import test from 'node:test';import assert from 'node:assert/strict';import {Vector3} from 'three';
import {WEST45,west45CoversPoint} from '../src/west45-config.js';import {createWest45Geometry} from '../src/west45.js';import {west45GLSL} from '../src/west45-shader.js';
test('45th Street source finishes cover surveyed walls through their full heights',()=>{
 for(const f of WEST45.fronts){for(const fraction of [0,.25,.5,.75,1]){const p=[...f.center];p[2]=f.bottom+(f.top-f.bottom)*fraction;assert(west45CoversPoint(p),f.id+' at '+p[2]);}}
 for(const side of [-1,1])for(let t=15;t<209;t+=2)for(const z of [1,15,70,150,250]){const p=new Vector3(...WEST45.origin).addScaledVector(new Vector3(...WEST45.east),t).addScaledVector(new Vector3(...WEST45.north),side*12).setZ(z);assert(west45CoversPoint(p.toArray()));}
 assert(!west45CoversPoint([-29.9,-4.82,4]),'preserve corrected Paramount corner');
 const shader=west45GLSL();assert(shader.includes('step(.18,p.z)'));assert(!shader.includes('step(p.z,'),'no artificial upper-floor coverage cap');
});
test('45th Street details retain theatre projections, shop photography and overhead canopies',()=>{const g=createWest45Geometry();assert(g.canopies>=6);assert(g.blades>=4);const corners=createWest45Corners();assert.equal(corners.glass.length,2,'gift shop wraps both street faces');assert(corners.scaffoldPosts>15);assert(corners.labels.some(f=>f.kind==='suffolk'));assert(!g.labels.some(f=>f.kind==='row'),'no red gift-store canopy');for(const [color,positions]of g.mesh.batches){assert(positions.every(Number.isFinite),color);assert(positions.length%9===0);}for(const f of g.labels)assert(f.width>0&&f.height>0);});

test('Eighth Avenue corner skins fit original walls and scaffold walkways remain clear',async()=>{
 const {readFile}=await import('node:fs/promises'),{CollisionWorld}=await import('../src/collision.js');const prior=globalThis.fetch;
 globalThis.fetch=async u=>new Response(await readFile('public'+u));
 try{const world=new CollisionWorld(JSON.parse(await readFile('public/data/nyc/manifest.json')).files);world.radius=500;await world.stream(new Vector3(-230,130,0));const g=createWest45Corners();world.addStatic('corner-details',new Float32Array(g.mesh.collision));
 for(const f of g.faces){const c=new Vector3(...f.center),n=new Vector3(...f.normal),r=new Vector3(-n.y,n.x,0);for(const q of [-.4,0,.4]){const p=c.clone().addScaledVector(r,q*f.width).setZ(3);const hit=world.ray(p.clone().addScaledVector(n,.8),n.clone().negate(),1.2,true);assert(hit&&Math.abs(hit.distance-.98)<.04,f.id+' lies on source wall');}for(let x=-f.width/2+.6;x<f.width/2-.4;x+=.5){const p=c.clone().addScaledVector(r,x).addScaledVector(n,.85).setZ(.17),resolved=world.resolve(p.clone());assert(resolved.sub(p).setZ(0).length()<.02,f.id+' clear walkway '+x);}}
 }finally{globalThis.fetch=prior;}
});
