import test from 'node:test';
import assert from 'node:assert/strict';
import {Vector3} from 'three';
import {readFile} from 'node:fs/promises';
import {DISTRICT} from '../src/district-config.js';
import {west43Facade,WEST43_VISIT} from '../src/west43-reference.js';
import {createDistrictGeometry,districtAxes} from '../src/district-geometry.js';
import {CollisionWorld} from '../src/collision.js';
import {makeStreetLayout} from '../src/street-layout.js';
import {createSidewalkGeometry} from '../src/street-detail-geometry.js';
globalThis.fetch=async p=>new Response(await readFile('public'+p));
test('W43 finishes preserve surveyed walls and existing landmark scope',()=>{
 const changed=DISTRICT.facades.map(west43Facade).filter(f=>f.referenceStyle);
 assert.equal(changed.length,20);
 for(const f of changed){const original=DISTRICT.facades.find(v=>v.id===f.id);assert.deepEqual(f.center,original.center);assert.deepEqual(f.normal,original.normal);assert.equal(f.width,original.width);assert.equal(f.top,original.top);assert.equal(f.street,'West 43rd Street');assert.equal(f.screen,false);}
 assert.deepEqual(new Set(changed.map(f=>f.referenceStyle)),new Set(['diner','casablanca','tony','parking','silver','mexican','townhall','sondheim','glassoffice','service']));
 assert(DISTRICT.facades.filter(f=>f.street!=='West 43rd Street').every(f=>west43Facade(f)===f));
 const g=createDistrictGeometry();assert(g.labels.some(f=>f.vertical&&f.kind==='parking'));assert(g.labels.filter(f=>f.kind==='tony').length>=3);
});
test('W43 visit and detailed sidewalk corridors have capsule clearance',async()=>{
 const manifest=JSON.parse(await readFile('public/data/nyc/manifest.json'));
 const world=new CollisionWorld(manifest.files);world.radius=350;await world.stream(new Vector3(...WEST43_VISIT.view.position));
 world.addStatic('district',createDistrictGeometry().collision);
 world.addStatic('sidewalks',createSidewalkGeometry(makeStreetLayout(JSON.parse(await readFile('public/data/streets-osm.json')))).collision);
 const p=new Vector3(...WEST43_VISIT.view.position);assert(!world.ray(p.clone().setZ(700),new Vector3(0,0,-1),699.5,true),'outdoor visit');assert(p.distanceTo(world.resolve(p.clone()))<.04,'clear visit');
 for(const f of DISTRICT.facades.map(west43Facade).filter(f=>f.referenceStyle)){
  const a=districtAxes(f);
  for(const x of [-f.width*.35,0,f.width*.35]){const p=a.p(x,1.5,.17),q=world.resolve(p.clone());assert(p.clone().sub(q).setZ(0).length()<.04,`${f.id} clear sidewalk`);}
 }
});
