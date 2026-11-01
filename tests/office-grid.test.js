import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Vector3} from 'three';
import {CollisionWorld} from '../src/collision.js';
import {OFFICE_GRID as G} from '../src/office-grid.js';
import {createDistrictGeometry} from '../src/district-geometry.js';
globalThis.fetch=async p=>new Response(await readFile('public'+p));
test('W44 grid covers the entire measured office front to its actual roofline',async()=>{
 const manifest=JSON.parse(await readFile('public/data/nyc/manifest.json'));
 const world=new CollisionWorld(manifest.files);world.radius=400;await world.stream(new Vector3(...G.center));
 assert(G.width>27&&G.width>G.originalWidth*2.5);assert(G.top>22&&G.top>G.originalTop+8);
 const c=new Vector3(...G.center),n=new Vector3(...G.normal),r=new Vector3(-n.y,n.x,0);
 for(let x=-G.width/2+.01;x<G.width/2;x+=.6)for(const z of [.30,3,10,14.3,20,G.top-.03]){
  const p=c.clone().addScaledVector(r,x).addScaledVector(n,.4).setZ(z),hit=world.ray(p,n.clone().negate(),.8,true);
  assert(hit&&Math.abs(hit.distance-.54)<.003,'grid fits real source at '+x+','+z);
 }
 const g=createDistrictGeometry(),faces=g.curtain.filter(f=>f.fullOfficeGrid);assert.equal(faces.length,1);
 assert.equal(faces[0].width,G.width);assert.equal(faces[0].height,G.top-G.bottom);
 assert(Math.abs(faces[0].center.z+faces[0].height/2-G.top)<1e-6);
 for(const vertices of g.batches.values())assert(vertices.every(Number.isFinite));
});
