import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Vector3} from 'three';
import {makeStreetLayout,CURB_HEIGHT,signalPhase} from '../src/street-layout.js';
import {createSidewalkGeometry,createSignalGeometry} from '../src/street-detail-geometry.js';
import {CollisionWorld} from '../src/collision.js';
import {Player,FIXED_STEP} from '../src/player.js';
const streets=JSON.parse(await readFile(new URL('../public/data/streets-osm.json',import.meta.url))),layout=makeStreetLayout(streets);
const world=new CollisionWorld([]),sidewalks=createSidewalkGeometry(layout);world.addStatic('sidewalks',sidewalks.collision);
test('walking and running climb a mapped sidewalk curb and return to street grade',()=>{
 const path=layout.sidewalks.find(p=>p.id===1117867022),a=path.points[2],b=path.points[3],center=a.clone().lerp(b,.5),along=b.clone().sub(a).normalize(),across=new Vector3(along.y,-along.x,0);
 // Leave enough street on each side for a running player to land after the
 // wider road-facing curb. A fixed eight-metre walk ended during the fall.
 const edges=layout.sidewalkEdges(center,along,path.width),start=edges[0]+2,end=edges[1]+2;
 for(const running of [false,true]){
  const player=new Player(world,{bounded:false});player.position.copy(center.clone().addScaledVector(across,-start));
  const yaw=Math.atan2(across.x,across.y),keys=new Set(running?['ArrowUp','ShiftLeft']:['ArrowUp']);let max=0;
  // Include the acceleration ramp while still requiring the same far curb exit.
  const frames=Math.ceil((start+end)/(running?8:3.2)/FIXED_STEP)+24;
  for(let i=0;i<frames;i++){player.update(FIXED_STEP,keys,yaw);max=Math.max(max,player.position.z);}
  assert(max>=CURB_HEIGHT-.01,'player must stand on top of curb');
  assert(player.position.clone().sub(center).dot(across)>end-.3,'curb must not snag the capsule');
  assert(player.position.z<.04,'player must descend back to the street');
 }
});
test('a signal pole blocks the running capsule without closing the crossing',()=>{
 const pole=layout.signals.find(p=>p.position.length()<20),normal=pole.pedestrians[0].normal;
 const geometry=createSignalGeometry({...layout,signals:[pole]}),collision=new CollisionWorld([]);collision.addStatic('pole',geometry.collision);
 const player=new Player(collision,{bounded:false});player.position.copy(pole.position.clone().addScaledVector(normal,2));
 const yaw=Math.atan2(-normal.x,-normal.y);let nearest=Infinity;
 for(let i=0;i<26;i++){player.update(FIXED_STEP,new Set(['ArrowUp','ShiftLeft']),yaw);nearest=Math.min(nearest,player.position.clone().setZ(0).distanceTo(pole.position));}
 assert(nearest>.4,'capsule must remain outside the solid post even when sliding');
 assert(player.position.clone().sub(pole.position).dot(normal)>.32,'pole must stop the direct approach');
 assert(nearest<.8,'test must approach the pole');
});
test('signal cycle separates approaches and never permits WALK against green',()=>{
 for(let t=0;t<128;t+=.2){const p=signalPhase(t);assert(!(p.a===2&&p.b===2));if(p.pedA!==1)assert.equal(p.a,0);if(p.pedB!==1)assert.equal(p.b,0);}
});
test('every signal and street-name face has a valid render normal',()=>{
 const geometry=createSignalGeometry(layout);
 for(const face of [...geometry.lenses,...geometry.pedestrians,...geometry.labels])assert(Math.abs(face.normal.length()-1)<1e-6,'closed crossing polygons must not become zero-direction signal faces');
});
