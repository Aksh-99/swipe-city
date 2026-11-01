import test from 'node:test';
import assert from 'node:assert/strict';
import {Vector3} from 'three';
import {CollisionWorld} from '../src/collision.js';
import {observedPerson,WitnessSelection} from '../src/witness-selection.js';
import {reportLocation} from '../src/report-location.js';
import {PLAY_AREA} from '../src/play-area.js';
import {SUSPECT_SELECTION_LIFETIME} from '../src/dispatch-rules.js';

const person=(id,x,y,characterId='commuter')=>({id,characterId,position:new Vector3(x,y,.17)});
const view={selfId:'self',position:new Vector3(0,0,.17),cameraPosition:new Vector3(0,-5,1.6),cameraDirection:new Vector3(0,1,0),people:[person('self',0,0),person('businessman',0,6)]};

test('camera chooses the visible nearby person, excluding self, off-center, behind-camera and distant players',()=>{
 const result=observedPerson(view);assert.equal(result.playerId,'businessman');assert.equal(result.description,'Male · dark suit · beard');assert(!('role' in result));
 for(const candidate of [person('self',0,6),person('distant',0,12.1),person('behind',0,-9),person('off-center',5,6)])assert.equal(observedPerson({...view,people:[candidate]}),null);
 assert.equal(observedPerson({...view,people:[person('side',1,7,'tourist'),person('center',0,7)]}).playerId,'center');
 assert.equal(observedPerson({...view,collision:{ready:()=>false}}),null,'unloaded collision cannot offer a report through unknown geometry');
});

test('actual collision triangles prevent observing a person through a wall',()=>{
 const collision=new CollisionWorld([]);
 collision.addStatic('wall',new Float32Array([-2,3,0,2,3,0,2,3,4,-2,3,0,2,3,4,-2,3,4]));
 assert.equal(observedPerson({...view,collision}),null);
 assert.equal(observedPerson({...view,people:[person('before-wall',0,2)],collision}).playerId,'before-wall');
});

test('R selection is brief, follows room ownership, and clears when the selected member leaves',()=>{
 const selection=new WitnessSelection(),update=(time,extra={})=>selection.update({...view,enabled:true,context:'room/self',time,...extra});
 update(1000);assert.equal(selection.capture(1000).locked,true);
 update(2000,{cameraDirection:new Vector3(1,0,0)});assert.equal(selection.get(2000).playerId,'businessman');
 update(1000+SUSPECT_SELECTION_LIFETIME,{cameraDirection:new Vector3(1,0,0)});assert.equal(selection.get(1000+SUSPECT_SELECTION_LIFETIME),null);
 update(10_000);selection.capture(10_000);update(11_000,{people:[]});assert.equal(selection.get(11_000),null);
 update(12_000);selection.capture(12_000);update(13_000,{context:'different/self',cameraDirection:new Vector3(1,0,0)});assert.equal(selection.get(13_000),null);
 update(14_000);selection.capture(14_000);update(15_000,{enabled:false});assert.equal(selection.get(15_000),null);
});

test('dispatch street names use the existing real OSM intersections',()=>{
 for(const corner of PLAY_AREA.intersections){
  const suffix=corner.street.includes('42nd')?'W 42nd St':'W 49th St';
  const location=reportLocation(corner.position);assert(location.includes(suffix),location);assert(location.includes(corner.avenue),location);
 }
 assert.match(reportLocation([0,0,.17]),/^Times Square · near W 4[2-9](nd|rd|th) St/);
});
