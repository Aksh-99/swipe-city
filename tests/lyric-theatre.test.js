import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Vector3} from 'three';
import {LYRIC_THEATRE as L} from '../src/lyric-config.js';
import {createLyricGeometry,lyricAxes} from '../src/lyric-geometry.js';
import {CollisionWorld} from '../src/collision.js';
import {Player,FIXED_STEP} from '../src/player.js';
import {createStorefrontGeometry} from '../src/storefront-geometry.js';
import {createHardRockFoodGeometry} from '../src/hard-rock-food-geometry.js';
import {createStreetVendorGeometry} from '../src/street-vendor-geometry.js';
import {createNypdPlazaGeometry} from '../src/nypd-plaza-geometry.js';
import {createNasdaqGeometry} from '../src/nasdaq-geometry.js';
import {createRecruitingGeometry} from '../src/recruiting-geometry.js';
import {createStreetscapeGeometry} from '../src/streetscape-geometry.js';
import {createSidewalkGeometry,createSignalGeometry} from '../src/street-detail-geometry.js';
import {createCurbBollardGeometry} from '../src/curb-bollard-geometry.js';
import {makeStreetLayout} from '../src/street-layout.js';
const json=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url)));
globalThis.fetch=async p=>new Response(await readFile(new URL('../public'+p,import.meta.url)));
const world=new CollisionWorld((await json('public/data/nyc/manifest.json')).files),g=createLyricGeometry();
const layout=makeStreetLayout(await json('public/data/streets-osm.json'));
const poles=new Map((await json('public/data/street-details.json')).poles.map(p=>[p.id,p.position]));layout.signals=layout.signals.filter(s=>poles.has(s.id));for(const s of layout.signals)s.position.fromArray(poles.get(s.id));
for(const [id,geometry]of [['lyric',g],['shops',createStorefrontGeometry()],['food',createHardRockFoodGeometry()],['vendors',createStreetVendorGeometry()],['nypd',createNypdPlazaGeometry()],['nasdaq',createNasdaqGeometry()],['recruiting',createRecruitingGeometry()],['streetscape',createStreetscapeGeometry()],['sidewalks',createSidewalkGeometry(layout)],['signals',createSignalGeometry(layout)],['bollards',createCurbBollardGeometry(layout)]])world.addStatic(id,geometry.collision);
await world.stream(new Vector3(...L.center));
const horizontal=(a,b)=>a.clone().sub(b).setZ(0).length();
function walk(route,run){
 const player=new Player(world);player.position.copy(route[0]);const keys=new Set(run?['ArrowUp','ShiftLeft']:['ArrowUp']);
 for(const target of route.slice(1)){
  let i=0;while(horizontal(player.position,target)>.14&&i++<3600){const d=target.clone().sub(player.position);player.update(FIXED_STEP,keys,Math.atan2(d.x,d.y));}
  assert(horizontal(player.position,target)<.16,`route blocked at ${target.toArray()} from ${route[0].toArray()}; actual ${player.position.toArray()}; running=${run}`);
  assert(player.position.z<.40,'walking routes must remain at pavement level');
 }return player;
}
test('Lyric and neighboring architectural skins attach to original NYC walls',()=>{
 for(const f of L.facades){const {p,n}=lyricAxes(f);for(const x of [-.48,0,.48])for(const z of [1,7,f.height]){
  const hit=world.ray(p(x*f.width,2,z),n.clone().negate(),3,true);assert(hit&&Math.abs(hit.distance-2.12)<.06,`${f.id} exceeds surveyed wall`);
 }}
 for(const batches of [g.batches,g.paving,g.emissive])for(const values of batches.values())assert(values.every(Number.isFinite));
 assert([...g.collision].every(Number.isFinite));
});
test('Lyric visit starts clear and entrance doors remain solid when running',()=>{
 const v=new Vector3(...L.view.position);assert(!world.ray(v.clone().setZ(700),new Vector3(0,0,-1),701,true));assert(horizontal(v,world.resolve(v.clone()))<.02);
 const {p,n}=lyricAxes(L.facades[0]),player=new Player(world);player.position.copy(p(-3,2.05,.18));
 for(let i=0;i<80;i++)player.update(FIXED_STEP,new Set(['ArrowUp','ShiftLeft']),Math.atan2(-n.x,-n.y));
 assert(player.position.clone().sub(p(-3,0,0)).dot(n)>.73,'closed entrance must stop the player');
});
test('both sidewalks, covered walkways and street center support arrows and Shift in both directions',()=>{
 for(const route of g.routes)for(const reverse of [false,true])for(const run of [false,true])walk(reverse?[...route.points].reverse():route.points,run);
 // Turn the theatre corner of the route into the existing Broadway approach.
 const byId=id=>g.routes.find(r=>r.id===id).points;
 walk([...byId('service').slice().reverse(),...byId('historic').slice().reverse()],true);
 const f=L.facades[0],ax=lyricAxes(f);walk([new Vector3(...L.view.position),ax.p(-3,2.04,.18),byId('historic')[0]],false);
 const food=createHardRockFoodGeometry();walk(food.walkway,true);walk([...food.walkway].reverse(),false);
});
test('crowd rails, construction barriers, cones and scaffold posts stop capsule movement',()=>{
 const props=new CollisionWorld([]);props.addStatic('lyric',g.collision);
 for(const item of [...g.rails,...g.barriers]){
  // Approach from outside. Starting inside a hollow barrier can validly
  // separate the capsule upward and does not model normal player movement.
  for(const side of [-1,1]){const player=new Player(props);player.position.copy(item.position).addScaledVector(item.normal,side*1.25).setZ(.18);
   for(let i=0;i<35;i++)player.update(FIXED_STEP,new Set(['ArrowUp','ShiftLeft']),Math.atan2(-side*item.normal.x,-side*item.normal.y));
   assert(player.position.clone().sub(item.position).dot(item.normal)*side>.30,'solid curb furniture must stop a running approach');
  }
 }
 for(const item of g.cones){const p=item.position.clone().addScaledVector(item.normal,.10);assert(horizontal(p,props.resolve(p.clone()))>.12,'solid traffic cone');}
 for(const s of g.scaffolds){const c=new Vector3(...s.center),r=new Vector3(...s.along),n=new Vector3(...s.normal),post=c.clone().addScaledVector(r,-s.length/2).addScaledVector(n,s.width/2).setZ(.18);const q=post.clone().addScaledVector(r,.10);assert(horizontal(q,props.resolve(q.clone()))>.20);}
});
