import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Vector3} from 'three';
import {CollisionWorld} from '../src/collision.js';
import {Player,FIXED_STEP} from '../src/player.js';
import {NORTH42 as B,NORTH42_PLACES} from '../src/north42-config.js';
import {createNorth42Geometry,north42CurveFaces,north42CurvePoint} from '../src/north42-geometry.js';
import {cinemaAxes,cinemaStreetPoint,createCinemaGeometry} from '../src/cinema-geometry.js';
import {createAttractionsGeometry} from '../src/attractions-geometry.js';
import {createStreetscapeGeometry} from '../src/streetscape-geometry.js';
import {createSidewalkGeometry,createSignalGeometry} from '../src/street-detail-geometry.js';
import {makeStreetLayout} from '../src/street-layout.js';
import {createBusGeometry} from '../src/bus-geometry.js';
import {createLyricGeometry} from '../src/lyric-geometry.js';
import {SUBWAY_ENTRANCES} from '../src/streetscape-config.js';
import {entrancePoint,entranceCoordinates,insideEntrance} from '../src/ground-cutouts.js';
import {ThirdPersonCamera} from '../src/camera.js';
import {toLocal} from '../src/coordinates.js';
const json=async p=>JSON.parse(await readFile('public'+p));
globalThis.fetch=async p=>new Response(await readFile('public'+p));
const world=new CollisionWorld((await json('/data/nyc/manifest.json')).files),g=createNorth42Geometry();
world.radius=450;await world.stream(new Vector3(...B.curve.center));
const layout=makeStreetLayout(await json('/data/streets-osm.json')),poles=new Map((await json('/data/street-details.json')).poles.map(p=>[p.id,p.position]));
layout.signals=layout.signals.filter(s=>poles.has(s.id));for(const s of layout.signals)s.position.fromArray(poles.get(s.id));
for(const [id,data]of [['north42',g],['cinemas',createCinemaGeometry()],['attractions',createAttractionsGeometry()],['streetscape',createStreetscapeGeometry()],['sidewalks',createSidewalkGeometry(layout)],['signals',createSignalGeometry(layout)],['buses',createBusGeometry()],['lyric',createLyricGeometry()]])world.addStatic(id,data.collision);
world.groundBase=p=>{const e=SUBWAY_ENTRANCES.find(e=>insideEntrance(e,p));return e?-e.depth:0;};
const horizontal=(a,b)=>a.clone().sub(b).setZ(0).length();
function walk(points,run){
 const p=new Player(world);p.position.copy(points[0]);
 for(const target of points.slice(1)){let frames=0;const budget=Math.ceil(horizontal(p.position,target)/(run?8:3.2)*60)+180;
  while(horizontal(p.position,target)>.15&&frames++<budget){const d=target.clone().sub(p.position);p.update(FIXED_STEP,new Set(run?['ArrowUp','ShiftLeft']:['ArrowUp']),Math.atan2(d.x,d.y));}
  assert(horizontal(p.position,target)<.16,`blocked at ${p.position.toArray()} toward ${target.toArray()} (run=${run})`);assert(p.position.z<.4,'route stays at pavement level');
 }return p;
}
test('north W42 frontage and every curved corner facet stay on original source walls',()=>{
 for(const f of B.facades){const a=cinemaAxes(f);for(const x of [-.48,0,.48])for(const z of [f.bottom+.10,(f.bottom+f.top)/2,f.top-.05]){
  const hit=world.ray(a.p(x*f.width,2,z),a.n.clone().negate(),3,true);assert(hit&&Math.abs(hit.distance-2.16)<.05,`${f.id} fit ${hit?.distance}`);
 }}
 const faces=north42CurveFaces(0,B.curve.length,.18,36.4,.16);
 for(const f of faces)for(const u of [.05,.5,.95])for(const z of [.35,16,36.2]){
  const p=f.corners[0].clone().lerp(f.corners[1],u).setZ(z),hit=world.ray(p.addScaledVector(f.normal,2),f.normal.clone().negate(),3,true);
  assert(hit&&Math.abs(hit.distance-2.16)<.035,'rounded facade keeps surveyed footprint');
 }
 for(let i=1;i<faces.length;i++)assert(faces[i-1].corners[1].distanceTo(faces[i].corners[0])<.0001,'curved skins meet without cracks');
 for(const f of [...g.labels,...g.ribbons,...g.blueScreens]){assert(f.right.clone().cross(f.up||new Vector3(0,0,1)).dot(f.normal)>.99,'sign orientation faces outward');}
 for(const batches of [g.batches,g.paving,g.emissive])for(const vertices of batches.values())assert(vertices.every(Number.isFinite));
});
test('north sidewalk, curved corner and W42 road support walking and Shift running both ways',()=>{
 for(const route of g.routes)for(const run of [false,true])for(const reverse of [false,true])walk(reverse?[...route.points].reverse():route.points,run);
 // The main street connects the older cinema section to the new corner.
 walk([cinemaStreetPoint(130,13.0),cinemaStreetPoint(139,13.0)],true);
});
test('new-store shortcut and portal approach remain outside buildings and clear of barriers',()=>{
 const place=NORTH42_PLACES[0],spawn=new Vector3(...place.view.position);
 assert(!world.ray(spawn.clone().setZ(700),new Vector3(0,0,-1),701,true));assert(horizontal(spawn,world.resolve(spawn.clone()))<.03);
 walk([spawn,cinemaStreetPoint(232.1,13.0)],false);
 const portalApproach=g.portal.position.clone().addScaledVector(g.portal.normal,1.1);
 walk([cinemaStreetPoint(232.1,13.0),portalApproach],false);
 const corner=north42CurvePoint(9.4,1.12,.18).point;
 walk([cinemaStreetPoint(244,0),cinemaStreetPoint(244,10.2),corner],true);
});
test('silver posts and colored barriers stop a sprint; subway canopy has headroom',()=>{
 const props=new CollisionWorld([]);props.addStatic('north42',g.collision);
 for(const b of g.barriers){const p=new Player(props);p.position.copy(b.position).addScaledVector(b.normal,1.6);for(let i=0;i<35;i++)p.update(FIXED_STEP,new Set(['ArrowUp','ShiftLeft']),Math.atan2(-b.normal.x,-b.normal.y));assert(p.position.clone().sub(b.position).dot(b.normal)>.55);}
 for(const b of g.bollards){const p=b.position.clone().addScaledVector(b.normal,.20);props.resolve(p);assert(horizontal(p,b.position)>.46);}
 const p=new Player(world);p.position.copy(g.portal.position).addScaledVector(g.portal.normal,1.1).setZ(.18);
 const roof=world.ray(p.position.clone().setZ(1.9),new Vector3(0,0,1),4);assert(roof&&roof.point.z>3.0&&roof.point.z<4.9);
 let observed;const camera=new ThirdPersonCamera({camera:{frustum:{},setView(v){observed=toLocal(v.destination);}}},world);camera.yaw=Math.atan2(g.portal.normal.x,g.portal.normal.y);camera.pitch=1.15;camera.update(p);
 assert(observed.z<3.20&&camera.distanceToPlayer<7.5,`camera remains below canopy: ${observed.z}, boom ${camera.distanceToPlayer}`);
});
test('existing covered subway still descends and returns after new frontage is loaded',()=>{
 const e=SUBWAY_ENTRANCES.find(e=>e.id==='mta-82');assert(e);assert.equal(B.subway.rawMtaIndex,74);assert.equal(B.subway.mode,'exterior-portal');
 const p=new Player(world),yaw=Math.atan2(e.direction[0],e.direction[1]);p.position.copy(entrancePoint(e,0,-1,.17));
 for(let i=0;i<170;i++)p.update(FIXED_STEP,new Set(['ArrowUp']),yaw);
 assert(p.position.z<-e.depth+.15&&p.grounded,'existing stairs remain open');assert(entranceCoordinates(e,p.position).y>e.length);
 for(let i=0;i<190;i++)p.update(FIXED_STEP,new Set(['ArrowDown']),yaw);
 assert(p.position.z>=0&&entranceCoordinates(e,p.position).y<0,'return to street still works');
});
