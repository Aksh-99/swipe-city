import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Vector3} from 'three';
import {TimesSquareMap,mapPoint} from '../src/minimap.js';
import {MAP_FRAME,MAP_POLYGON,MAP_VIEWBOX} from '../src/minimap-layout.js';
import {PLAY_AREA} from '../src/play-area.js';
import {mapDocument} from './map-test-helper.js';

test('phone fits the whole W42–49/Sixth–Eighth area and never pans or zooms with the player',async t=>{
 const fixture=mapDocument(),original=globalThis.document;globalThis.document=fixture.document;t.after(()=>{if(original===undefined)delete globalThis.document;else globalThis.document=original;});
 const streets=JSON.parse(await readFile(new URL('../public/data/streets-osm.json',import.meta.url))),map=new TimesSquareMap(streets);
 assert.equal(fixture.map.getAttribute('viewBox'),MAP_VIEWBOX);assert.equal(fixture.clip.children[0].tag,'polygon');
 for(const point of MAP_POLYGON){assert(point.x>=MAP_FRAME.x&&point.x<=MAP_FRAME.x+MAP_FRAME.width+1e-9);assert(point.y>=MAP_FRAME.y&&point.y<=MAP_FRAME.y+MAP_FRAME.height+1e-9);}
 assert.equal(fixture.map.getAttribute('preserveAspectRatio'),'none');
 assert.equal(MAP_FRAME.x,Math.min(...MAP_POLYGON.map(p=>p.x)));assert.equal(MAP_FRAME.y,Math.min(...MAP_POLYGON.map(p=>p.y)));
 let previous;
 for(const [i,corner] of PLAY_AREA.polygon.entries()){
  map.update({position:new Vector3(...corner,0),heading:i});assert.equal(fixture.map.getAttribute('viewBox'),MAP_VIEWBOX);const transform=map.marker.getAttribute('transform');assert.notEqual(transform,previous);previous=transform;
 }
 const texts=[],scan=node=>{if(node.tag==='text')texts.push(node.textContent);node.children.forEach(scan);};scan(fixture.map);
 for(const label of ['W 42','W 49','6 AV','8 AV','TIMES','SQUARE'])assert(texts.includes(label),label);
 assert(!texts.includes('W 40'));assert(!texts.includes('W 50'));
});

test('911 alerts use reported positions, retain their flashing elements between snapshots, and disappear when cleared',async t=>{
 const fixture=mapDocument(),original=globalThis.document;globalThis.document=fixture.document;t.after(()=>{if(original===undefined)delete globalThis.document;else globalThis.document=original;});
 const streets=JSON.parse(await readFile(new URL('../public/data/streets-osm.json',import.meta.url))),map=new TimesSquareMap(streets);
 const calls=[{id:'call-1',number:1,position:[0,0,.17],description:'Male · dark suit · beard',location:'Times Square · near W 45th St'},{id:'call-2',number:2,position:[50,50,.17]}];
 map.setDispatchCalls(calls);const first=map.dispatchMarkers.get('call-1'),p=mapPoint({x:0,y:0});
 assert.equal(first.getAttribute('transform'),`translate(${p.x} ${p.y})`);assert.equal(first.getAttribute('class'),'dispatch-map-alert');
 assert(first.getAttribute('aria-label').includes('Male · dark suit · beard'));assert(first.getAttribute('aria-label').includes('Caller: Player 1'));assert(!first.getAttribute('aria-label').includes('Player 3'));
 map.setDispatchCalls(calls);assert.equal(map.dispatchMarkers.get('call-1'),first,'polling must not restart the blink animation');assert.equal(map.dispatchLayer.children.length,2);
 map.update({position:new Vector3(10,20,0),heading:1});assert.equal(first.getAttribute('transform'),`translate(${p.x} ${p.y})`,'a call stays at the reported location');
 map.setDispatchCalls([calls[1]]);assert.equal(map.dispatchLayer.children.length,1);assert.equal(first.parent,null);
 map.setDispatchCalls([]);assert.equal(map.dispatchLayer.children.length,0);assert.equal(fixture.map.getAttribute('viewBox'),MAP_VIEWBOX);
});
