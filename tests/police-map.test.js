import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {mountPoliceMap,POLICE_MAP_CARS} from '../src/police-map.js';import {TimesSquareMap} from '../src/minimap.js';import {mapDocument} from './map-test-helper.js';
test('officer map shows every usable NYPD car and accepts keyboard/map selection while hiding bus markers',async t=>{
 const f=mapDocument();const before=globalThis.document;globalThis.document=f.document;t.after(()=>{globalThis.document=before;});
 const map=new TimesSquareMap(JSON.parse(await readFile(new URL('../public/data/streets-osm.json',import.meta.url))));let selected;
 map.onPoliceDestination(id=>selected=id);map.setPoliceTravel({officer:true,sourceId:POLICE_MAP_CARS[0].id,enabled:true});
 assert.equal(map.policeMarkers.size,POLICE_MAP_CARS.length);assert.equal(map.policeLayer.getAttribute('display'),'');assert([...map.busMarkers.values()].every(n=>n.getAttribute('display')==='none'));
 map.policeMarkers.get(POLICE_MAP_CARS[1].id).dispatchEvent(new Event('click'));assert.equal(selected,POLICE_MAP_CARS[1].id);
 map.setPoliceTravel({officer:false});assert.equal(map.policeLayer.getAttribute('display'),'none');assert([...map.busMarkers.values()].every(n=>n.getAttribute('display')===''));
});
test('destination controls only travel for a movable officer near an NYPD car; role changes restore civilian mode',async()=>{
 class Node extends EventTarget{constructor(){super();this.children=[];this.value='';this.hidden=false;this.textContent='';}append(...children){this.children.push(...children);}setAttribute(){}blur(){}}
 const parent=new Node(),nodes=new Map();let access='police',nearby=null,enabled=true,canMove=true,mapClick,mapState;const trips=[];
 const map={onPoliceDestination:fn=>mapClick=fn,setPoliceTravel:s=>mapState=s},transport={view:()=>({nearby,enabled,coolingDown:false,busy:false})};
 const app=mountPoliceMap({document:{createElement:()=>new Node(),getElementById:()=>parent},getAccess:()=>access,getTransport:()=>transport,getMap:()=>map,canTravel:()=>canMove,onTravel:async id=>trips.push(id)});
 const [status,label,select,button]=parent.children[0].children;assert(select.disabled);assert.equal(select.children.length,POLICE_MAP_CARS.length+1);await mapClick(POLICE_MAP_CARS[1].id);assert.equal(trips.length,0);
 nearby={allowed:true,portal:POLICE_MAP_CARS[0]};app.update();assert.equal(select.disabled,false);await mapClick(POLICE_MAP_CARS[1].id);assert.deepEqual(trips,[POLICE_MAP_CARS[1].id]);assert.equal(mapState.enabled,true);
 canMove=false;app.update();await mapClick(POLICE_MAP_CARS[2].id);assert.equal(trips.length,1);assert(button.disabled);
 access='pedestrian';app.update();assert(parent.children[0].hidden);assert.equal(mapState.officer,false);
});
