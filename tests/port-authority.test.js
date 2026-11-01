import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Vector3} from 'three';
import {PORT_AUTHORITY as T} from '../src/port-authority-config.js';
import {createPortAuthorityGeometry,terminalAxes} from '../src/port-authority-geometry.js';
import {CollisionWorld} from '../src/collision.js';
import {Player,FIXED_STEP} from '../src/player.js';
import {makeStreetLayout,nearestSegment} from '../src/street-layout.js';
import {createSidewalkGeometry,createSignalGeometry} from '../src/street-detail-geometry.js';
import {createStreetscapeGeometry} from '../src/streetscape-geometry.js';
import {createBusGeometry} from '../src/bus-geometry.js';
import {createLyricGeometry} from '../src/lyric-geometry.js';
const json=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url)));
globalThis.fetch=async p=>new Response(await readFile(new URL('../public'+p,import.meta.url)));
const world=new CollisionWorld((await json('public/data/nyc/manifest.json')).files),g=createPortAuthorityGeometry();
const layout=makeStreetLayout(await json('public/data/streets-osm.json'));
const poles=new Map((await json('public/data/street-details.json')).poles.map(p=>[p.id,p.position]));layout.signals=layout.signals.filter(s=>poles.has(s.id));for(const s of layout.signals)s.position.fromArray(poles.get(s.id));
for(const [id,data]of [['terminal',g],['sidewalks',createSidewalkGeometry(layout)],['signals',createSignalGeometry(layout)],['streetscape',createStreetscapeGeometry()],['buses',createBusGeometry()],['lyric',createLyricGeometry()]])world.addStatic(id,data.collision);
world.radius=650;await world.stream(new Vector3(...T.center));
const horizontal=(a,b)=>a.clone().sub(b).setZ(0).length();
function walk(points,run){
 const player=new Player(world,{bounded:false});player.position.copy(points[0]);
 for(const target of points.slice(1)){
  let steps=0;while(horizontal(player.position,target)>.14&&steps++<2600){const d=target.clone().sub(player.position);player.update(FIXED_STEP,new Set(run?['ArrowUp','ShiftLeft']:['ArrowUp']),Math.atan2(d.x,d.y));}
  assert(horizontal(player.position,target)<.16,`blocked from ${points[0].toArray()} to ${target.toArray()} at ${player.position.toArray()}, running=${run}`);
  assert(player.position.z<.4,'stay at pavement level');
 }
}
test('Port Authority layers attach to unchanged source walls below the source roof',()=>{
 for(const f of T.facades){const {p,n}=terminalAxes(f);for(const x of [-.485,0,.485])for(const z of [1.5,8,19,26]){
  const hit=world.ray(p(x*f.width,2,z),n.clone().negate(),3,true);assert(hit&&Math.abs(hit.distance-2.18)<.07,`${f.id} source fit`);
 }}
 for(const batches of [g.batches,g.paving,g.emissive])for(const values of batches.values())assert(values.every(Number.isFinite));
 for(const f of g.labels)assert(new Vector3(-f.normal.y,f.normal.x,0).dot(f.right)>.999,'no mirrored lettering');
});
test('visit position, covered sidewalks and corner turn support walking and running',()=>{
 const spawn=new Vector3(...T.view.position);
 assert(!world.ray(spawn.clone().setZ(700),new Vector3(0,0,-1),701,true),'visit starts outside building');
 assert(horizontal(spawn,world.resolve(spawn.clone()))<.02,'visit starts clear of furniture');
 for(const route of g.routes)for(const run of [false,true])for(const reverse of [false,true])walk(reverse?[...route.points].reverse():route.points,run);
 const corner=g.routes.find(r=>r.id==='corner').points;
 walk([spawn,corner[2],...corner.slice(3)],true);
 const northEnd=g.routes.find(r=>r.id==='eighth-north').points.at(-1),southStart=g.routes.find(r=>r.id==='eighth-south').points[0];
 walk([northEnd,southStart],false);walk([southStart,northEnd],true);
 // Cross the adjoining Eighth Avenue approach using the bundled OSM crossing.
 const crossing=nearestSegment(spawn.clone().setZ(0),layout.crossings).path;
 const points=crossing.points.map(p=>p.clone().setZ(.17));walk(points,false);walk([...points].reverse(),true);
});
test('terminal doors, brick supports and stainless bollards stop the player',()=>{
 const props=new CollisionWorld([]);props.addStatic('terminal',g.collision);
 for(const f of T.facades){const {at,n}=terminalAxes(f),s=f.id==='forty-second'?47:f.id==='eighth-north'?43:28;
  const player=new Player(world,{bounded:false});player.position.copy(at(s,2.8,.18));
  for(let i=0;i<80;i++)player.update(FIXED_STEP,new Set(['ArrowUp','ShiftLeft']),Math.atan2(-n.x,-n.y));
  assert(player.position.clone().sub(at(s,0,0)).dot(n)>.55,'closed door stops sprint');
 }
 for(const item of g.bollards){const p=new Vector3(...item.position),n=new Vector3(...item.normal),player=new Player(props,{bounded:false});player.position.copy(p).addScaledVector(n,1.15);
  let closest=Infinity;
  for(let i=0;i<40;i++){player.update(FIXED_STEP,new Set(['ArrowUp','ShiftLeft']),Math.atan2(-n.x,-n.y));closest=Math.min(closest,horizontal(player.position,p));}
  // A round post can deflect the capsule sideways. Check every sampled
  // distance, rather than incorrectly forbidding a slide around its side.
  assert(closest>.48&&closest<.56,'bollard prevents penetration during sprint');
 }
 for(const item of g.columns){
  const probe=item.position.clone().addScaledVector(item.normal,.76),resolved=props.resolve(probe.clone());
  assert(horizontal(resolved,item.position)>.94,'brick support has a solid capsule collider');
  // The last two visible columns lie beyond the existing playable boundary.
  // Test their colliders directly; movement there is intentionally clamped.
  const across=item.position.x*.848-item.position.y*.53;if(Math.abs(across)>358)continue;
  const player=new Player(props,{bounded:false});player.position.copy(item.position).addScaledVector(item.normal,1.7);
  let closest=Infinity;
  for(let i=0;i<40;i++){player.update(FIXED_STEP,new Set(['ArrowUp','ShiftLeft']),Math.atan2(-item.normal.x,-item.normal.y));closest=Math.min(closest,horizontal(player.position,item.position));}
  assert(closest>.94&&closest<1.04,'column prevents penetration during sprint');
 }
});
