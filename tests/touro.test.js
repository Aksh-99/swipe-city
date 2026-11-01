import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Vector3} from 'three';
import {CollisionWorld} from '../src/collision.js';
import {Player,FIXED_STEP} from '../src/player.js';
import {createTouroGeometry} from '../src/touro-geometry.js';
import {TOURO,touroReplacesScreen} from '../src/touro-config.js';
import {createSidewalkGeometry} from '../src/street-detail-geometry.js';
import {makeStreetLayout} from '../src/street-layout.js';
globalThis.fetch=async url=>new Response(await readFile(new URL('../public'+url,import.meta.url)));
const manifest=JSON.parse(await readFile(new URL('../public/data/nyc/manifest.json',import.meta.url))),world=new CollisionWorld(manifest.files),g=createTouroGeometry();
await world.stream(new Vector3(...TOURO.center));
test('the Touro skin follows all three real NYC podium planes and leaves the source building intact',()=>{
 assert.equal(g.facades.length,3);
 for(const f of g.facades){const n=new Vector3(...f.normal),r=new Vector3(-n.y,n.x,0),c=new Vector3(...f.center);
  for(const x of [-.45,0,.45])for(const z of [1,8,26,34]){
   const hit=world.ray(c.clone().addScaledVector(r,x*f.width).addScaledVector(n,3).setZ(z),n.clone().negate(),5,true);
   assert(hit&&Math.abs(hit.distance-3-f.skinOffset)<.01,`${f.id} must remain on source triangles`);
  }
 }
 const point=new Vector3(...TOURO.view.position);assert.equal(world.ray(point.clone().setZ(700),new Vector3(0,0,-1),701,true),null,'inspection starts in the open street');
 assert(g.lettering.some(l=>l.text==='TOURO'&&l.vertices>1000),'the sign has actual raised glyph geometry');
 assert(g.posts.length>=12);assert([...g.batches.values()].flat().every(Number.isFinite));
});
test('the movie billboard follows the original chamfer with continuous campaign coordinates',()=>{
 assert.equal(g.screens.length,3);assert.equal(g.screens[0].u0,0);assert.equal(g.screens.at(-1).u1,1);
 for(let i=1;i<g.screens.length;i++){
  const a=g.screens[i-1],b=g.screens[i];assert.equal(a.u1,b.u0);
  assert(a.corners[1].distanceTo(b.corners[0])<.02);assert(a.corners[2].distanceTo(b.corners[3])<.02);
 }
 for(const s of g.screens)assert(touroReplacesScreen({...s,center:s.center.toArray(),normal:s.normal.toArray()}),'generic signs cannot cover the new campaign');
 assert.equal(touroReplacesScreen({center:[80,260,25],normal:[-.94,.35,0],width:18,height:24}),false,'unrelated landmarks retain their ads');
});
test('Touro doors remain solid while both sidewalk routes and the corner are passable',async()=>{
 world.addStatic('touro-reference',g.collision);
 const streets=makeStreetLayout(JSON.parse(await readFile(new URL('../public/data/streets-osm.json',import.meta.url))));
 world.addStatic('mapped-sidewalks',createSidewalkGeometry(streets).collision);
 for(const route of g.walkways){
  const player=new Player(world),direction=route.b.clone().sub(route.a).normalize(),length=route.a.distanceTo(route.b);
  player.position.copy(route.a);player.snapPresentation();
  for(let tick=0;tick<Math.ceil((length+.8)/3.2/FIXED_STEP);tick++)player.update(FIXED_STEP,new Set(['ArrowUp']),Math.atan2(direction.x,direction.y));
  assert(player.position.clone().sub(route.a).dot(direction)>length-.2,`${route.id}: the route beneath the canopy must stay open`);
 }
 for(const f of TOURO.facades){
  const player=new Player(world),c=new Vector3(...f.center),n=new Vector3(...f.normal);
  player.position.copy(c).addScaledVector(n,2.6).setZ(.17);player.snapPresentation();
  for(let tick=0;tick<120;tick++)player.update(FIXED_STEP,new Set(['ArrowUp','ShiftLeft']),Math.atan2(-n.x,-n.y));
  const distance=player.position.clone().sub(c).dot(n);
  assert(distance>.35&&distance<1.35,`${f.id}: a running player must stop outside the source wall and glazing`);
 }
 const a=g.screens[0].corners[1].clone().setZ(.17),n=new Vector3(...TOURO.facades[1].normal),corner=a.addScaledVector(n,1.8),resolved=world.resolve(corner.clone());
 assert(resolved.clone().sub(corner).setZ(0).length()<.02,'the exterior corner route must stay clear');
});
