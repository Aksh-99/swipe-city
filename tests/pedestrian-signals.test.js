import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {Vector3} from 'three';import {Event,Resource} from 'cesium';
import {makeStreetLayout} from '../src/street-layout.js';
import {signalPhase,pedestrianWalk} from '../src/signal-cycle.js';
import {createSignalGeometry} from '../src/street-detail-geometry.js';
import {addStreetDetails} from '../src/street-details.js';
import {registerAuthoredSignals,clearAuthoredSignals,authoredSignalHeads,signalGroup} from '../src/authored-signals.js';
const streets=JSON.parse(fs.readFileSync('public/data/streets-osm.json')),placements=JSON.parse(fs.readFileSync('public/data/street-details.json')),crossings=JSON.parse(fs.readFileSync('public/data/jaywalking-crossings.json')).crossings;
const placedLayout=()=>{const l=makeStreetLayout(streets),positions=new Map(placements.poles.map(p=>[p.id,p.position]));l.signals=l.signals.filter(p=>positions.has(p.id));for(const p of l.signals)p.position.fromArray(positions.get(p.id));return l;};
const scenes=[['five48','createFive48'],['corner47','createCorner47'],['rockefeller48','createRockefeller48'],['sixth47','createSixth47'],['two47','createTwo47'],['biltmore47','createBiltmore47']];
test('every one of the 122 fined crossings has a visible mapped head with the same authoritative group',()=>{
 const geometry=createSignalGeometry(placedLayout());assert.equal(crossings.length,122);assert.equal(geometry.pedestrians.length,232);
 const byId=new Map(crossings.map(c=>[c.id,c]));
 for(const crossing of crossings){const heads=geometry.pedestrians.filter(h=>h.crossing===crossing.id);assert(heads.length>0,String(crossing.id));for(const h of heads){assert.equal(h.group,crossing.group);assert(h.center.z>2&&h.center.z<3);assert(Math.abs(h.normal.length()-1)<1e-8);const dir=new Vector3(...crossing.points.at(-1)).sub(new Vector3(...crossing.points[0])).normalize();assert(Math.abs(h.normal.dot(dir))>.85);}}
 for(const head of geometry.pedestrians)assert(byId.has(head.crossing));
});
test('all WALK, countdown and STOP atlas cells are valid and agree with fines throughout multiple cycles',()=>{
 for(let t=-64;t<192;t+=.125){const phase=signalPhase(t);assert(!(phase.a===2&&phase.b===2));for(const group of [0,1]){const tile=group?phase.pedB:phase.pedA,vehicle=group?phase.b:phase.a;assert(Number.isInteger(tile)&&tile>=0&&tile<=16);assert.equal(pedestrianWalk(group,t*1000),tile===0);if(tile!==1)assert.equal(vehicle,0);}}
 for(const start of [0,32]){const group=start?0:1;assert(pedestrianWalk(group,start*1000));assert(!pedestrianWalk(group,(start+10)*1000));const tiles=Array.from({length:15},(_,i)=>{const p=signalPhase(start+10+i);return group?p.pedB:p.pedA;});assert.deepEqual(tiles,Array.from({length:15},(_,i)=>i+2));}
});
test('all seven previously painted pedestrian displays and their traffic lamps expose live faces',async()=>{
 clearAuthoredSignals();let ped=0,lenses=0;
 for(const [file,factory]of scenes){const module=await import('../src/'+file+'.js'),scene=module[factory]();assert(scene.signalHeads.length>0,file);for(const h of scene.signalHeads){assert(h.center.toArray().every(Number.isFinite));assert.equal(h.group,undefined);assert(Math.abs(h.normal.length()-1)<1e-8);assert.equal(h.right.dot(h.normal),0);assert([0,1].includes(signalGroup(h)));if(h.kind==='pedestrian')ped++;else{lenses++;assert([0,1,2].includes(h.light));}}registerAuthoredSignals(scene.signalHeads);registerAuthoredSignals(scene.signalHeads);}
 assert.equal(ped,7);assert.equal(lenses,30);assert.equal(authoredSignalHeads().length,ped+lenses);clearAuthoredSignals();
});
test('actual mapped and authored Cesium materials share live uniforms, opaque rendering and the supplied server clock',async t=>{
 t.mock.method(Resource.prototype,'fetchImage',()=>Promise.resolve({width:1,height:1}));
 const beforeDoc=globalThis.document,beforeFetch=globalThis.fetch;
 globalThis.document={createElement:()=>({width:640,height:512,getContext:()=>new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]??(()=>{})})})};
 globalThis.fetch=async()=>new Response(JSON.stringify(placements));
 let now=32000;const primitives=[],preUpdate=new Event(),viewer={scene:{primitives:{add:p=>primitives.push(p)},preUpdate}},collision={addStatic(){}};
 try{
  const detail=await addStreetDetails(viewer,collision,streets,{getTime:()=>now});
  const mappedPed=primitives.find(p=>p.appearance.material?.type==='TimesSquarePedestrianSignals').appearance.material;
  const vehicle=primitives.find(p=>p.appearance.material?.type==='TimesSquareSignalLenses').appearance.material;
  assert.equal(mappedPed.isTranslucent(),false);assert.equal(vehicle.isTranslucent(),false);
  const {createSixth47}=await import('../src/sixth47.js');const extra=createSixth47().signalHeads.map(h=>({...h,group:signalGroup(h)}));
  const added=detail.addAuthoredHeads(extra);assert.equal(added.pedestrianHeads,2);assert.equal(primitives.at(-2).appearance.material,mappedPed);assert.equal(primitives.at(-1).appearance.material,vehicle);
  for(now=0;now<128000;now+=1000){preUpdate.raiseEvent();const phase=signalPhase(now/1000);assert.deepEqual(detail.phase,phase);assert.equal(mappedPed.uniforms.tileA,phase.pedA);assert.equal(mappedPed.uniforms.tileB,phase.pedB);assert.equal(vehicle.uniforms.stateA,phase.a);assert.equal(vehicle.uniforms.stateB,phase.b);}
 }finally{globalThis.document=beforeDoc;globalThis.fetch=beforeFetch;for(const p of primitives)p.destroy();}
});
