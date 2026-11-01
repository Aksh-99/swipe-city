import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {Vector3} from 'three';
import {createParamountCartGeometry} from '../src/paramount-corner-geometry.js';
import {CollisionWorld} from '../src/collision.js';import {Player,FIXED_STEP} from '../src/player.js';
import {BROADWAY_RETAIL as B} from '../src/broadway-retail-config.js';
import {createBroadwayRetailGeometry,retailAxes} from '../src/broadway-retail-geometry.js';
import {createStorefrontGeometry} from '../src/storefront-geometry.js';
import {createSidewalkGeometry,createSignalGeometry} from '../src/street-detail-geometry.js';
import {makeStreetLayout} from '../src/street-layout.js';import {createCurbBollardGeometry} from '../src/curb-bollard-geometry.js';
import {createStreetscapeGeometry} from '../src/streetscape-geometry.js';import {createBusGeometry} from '../src/bus-geometry.js';
const json=async p=>JSON.parse(await readFile('public'+p));globalThis.fetch=async u=>new Response(await readFile('public'+u));
const world=new CollisionWorld((await json('/data/nyc/manifest.json')).files),g=createBroadwayRetailGeometry();world.radius=350;await world.stream(new Vector3(-50,-60,0));
const layout=makeStreetLayout(await json('/data/streets-osm.json')),poles=new Map((await json('/data/street-details.json')).poles.map(p=>[p.id,p.position]));layout.signals=layout.signals.filter(s=>poles.has(s.id));for(const s of layout.signals)s.position.fromArray(poles.get(s.id));
for(const [id,geometry]of [['retail',g],['paramount-cart',createParamountCartGeometry()],['shops',createStorefrontGeometry()],['sidewalks',createSidewalkGeometry(layout)],['signals',createSignalGeometry(layout)],['bollards',createCurbBollardGeometry(layout)],['streetscape',createStreetscapeGeometry()],['buses',createBusGeometry()]])world.addStatic(id,geometry.collision);
const horizontal=(a,b)=>a.clone().sub(b).setZ(0).length();
function travel(route,run=false){const p=new Player(world);p.position.copy(route[0]);for(const t of route.slice(1)){const limit=Math.ceil(horizontal(p.position,t)/(run?8:3.2)*60)+120;let frames=0;while(horizontal(p.position,t)>.15&&frames++<limit){const d=t.clone().sub(p.position);p.update(FIXED_STEP,new Set(run?['ArrowUp','ShiftLeft']:['ArrowUp']),Math.atan2(d.x,d.y));}assert(horizontal(p.position,t)<.16,`route blocked near ${t.toArray()}; player ${p.position.toArray()}`);assert(p.position.z<.4,'no rooftop snapping');}return p;}
test('both Broadway blocks retain source planes, heights and the actual W44 gap',()=>{
 for(const f of B.facades){const {p,n}=retailAxes(f);for(const u of [-.48,0,.48])for(const z of [f.bottom+.1,(f.bottom+f.top)/2,f.top]){const h=world.ray(p(u*f.width,2,z),n.clone().negate(),3,true);assert(h&&Math.abs(h.distance-2.16)<.055,`${f.id}: source facade fit`);}}
 const front=B.facades.find(f=>f.id==='1515-front'),row=B.facades[0],f=retailAxes(front),r=retailAxes(row);assert(f.p(-front.width/2,0,0).distanceTo(r.p(row.width/2,0,0))>20,'the two separate blocks may not be collapsed together');
 for(const vertices of g.batches.values())assert(vertices.every(Number.isFinite));
});
test('restaurant row and 1515 sidewalks are clear when walking or running both ways',()=>{
 for(const id of new Set(g.walkways.map(w=>w.facade))){const route=g.walkways.filter(w=>w.facade===id).map(w=>w.point);for(const reverse of [false,true])for(const run of [false,true])travel(reverse?[...route].reverse():route,run);}
 for(const place of B.places){const spawn=new Vector3(...place.view.position);assert(!world.ray(spawn.clone().setZ(700),new Vector3(0,0,-1),701,true));assert(horizontal(spawn,world.resolve(spawn.clone()))<.025,'visit starts clear of props');const f=B.facades.find(f=>f.id===place.facade),{p}=retailAxes(f);travel([spawn,p(place.offset,2.5,.17)]);}
});
test('shop doors, stainless posts and kiosk remain physical obstacles',()=>{
 for(const door of g.doors){const p=new Player(world);p.position.copy(door.point).addScaledVector(door.normal,1.4);for(let i=0;i<35;i++)p.update(FIXED_STEP,new Set(['ArrowUp','ShiftLeft']),Math.atan2(-door.normal.x,-door.normal.y));const d=p.position.clone().sub(door.point).dot(door.normal);assert(d>.17&&d<.75,`${door.facade} closed door must stop player`);}
 const props=new CollisionWorld([]);props.addStatic('retail',g.collision);for(const post of g.posts){const p=post.position.clone().addScaledVector(post.normal,.2);props.resolve(p);assert(horizontal(p,post.position)>.48);}
 for(const kiosk of g.kiosks){const p=kiosk.point.clone().addScaledVector(kiosk.normal,.20);props.resolve(p);assert(horizontal(p,kiosk.point)>.49);}
});
