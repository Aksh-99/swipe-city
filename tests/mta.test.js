import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {MTA_BUSES,MTA_STREETS,planBusTrip,stopPosition,streetDistance} from '../src/mta-planner.js';
import streets from '../src/mta-streets.json' with {type:'json'};
import {TimesSquareMap} from '../src/minimap.js';
import {mapDocument} from './map-test-helper.js';
import {mountMtaApp} from '../src/mta-app.js';
test('every destination street uses measured OSM geometry and every recommended ride follows the playable portal loop',()=>{
 for(const n of MTA_STREETS){assert(streets[n].length);assert.equal(streetDistance(streets[n][0][0],n),0);
  for(const position of [[0,0,0],[-300,-50,0],[100,200,0]]){const plan=planBusTrip(position,n);assert(plan);assert.equal(plan.destination.kind,'bus');
   if(plan.arrived||plan.walking){assert.equal(plan.stops.length,0);continue;}
   assert(plan.stops.length>=2&&plan.stops.length<=MTA_BUSES.length);assert.equal(plan.stops.at(-1).id,plan.destination.id);
   for(let i=1;i<plan.stops.length;i++)assert.equal(plan.stops[i-1].nextId,plan.stops[i].id);
  }
 }
 assert.equal(planBusTrip([0,0,0],49),null);
 assert.equal(planBusTrip(null,42),null);
});
test('only bus stops have circle markers; selected boarding bus blinks and 911 remains a diamond',async t=>{
 const f=mapDocument(),old=globalThis.document;globalThis.document=f.document;t.after(()=>globalThis.document=old);
 const map=new TimesSquareMap(JSON.parse(await readFile(new URL('../public/data/streets-osm.json',import.meta.url))));
 const all=node=>[node,...node.children.flatMap(all)];
 assert.equal(all(f.map).filter(n=>n.tag==='circle').length,MTA_BUSES.length);
 const plan=planBusTrip([0,0,0],47);map.setBusTrip(plan);
 assert.match(map.busMarkers.get(plan.board.id).getAttribute('class'),/mta-board-blink/);
 assert.match(map.busMarkers.get(plan.destination.id).getAttribute('class'),/mta-destination/);
 map.setDispatchCalls([{id:'911',number:1,position:[0,0,0]}]);assert.equal(all(f.map).filter(n=>n.tag==='circle').length,MTA_BUSES.length);
 map.setBusTrip(null);assert([...map.busMarkers.values()].every(n=>n.getAttribute('class')==='mta-map-stop'));
});
test('MTA app selects a trip, tracks arrival, clears it and respects officer bus restrictions',()=>{
 class Node extends EventTarget{constructor(){super();this.hidden=true;this.value='';this.textContent='';}setAttribute(){}focus(){this.focused=true;}}
 const ids=Object.fromEntries(['phone-mta-open','phone-mta','mta-street','mta-result','mta-clear'].map(k=>[k,new Node()]));let access='pedestrian',marked,opened=0;
 const app=mountMtaApp({document:{getElementById:k=>ids[k]},getPlayer:()=>({position:{x:0,y:0}}),getAccess:()=>access,getMap:()=>({setBusTrip:p=>marked=p}),onOpen:()=>opened++});
 ids['phone-mta-open'].dispatchEvent(new Event('click'));assert.equal(opened,1);assert.equal(ids['phone-mta'].hidden,false);
 ids['mta-street'].value='47';ids['mta-street'].dispatchEvent(new Event('change'));assert.match(ids['mta-result'].textContent,/Board Bus/);assert(marked.board);
 app.arrive(marked.destination);assert.match(ids['mta-result'].textContent,/Walk to your destination/);assert(marked.arrived);
 access='police';app.update();assert(ids['mta-street'].disabled);assert.equal(marked,null);assert.match(ids['mta-result'].textContent,/NYPD/);
 access='pedestrian';ids['mta-clear'].dispatchEvent(new Event('click'));assert.equal(marked,null);assert.equal(ids['mta-street'].value,'');
});
