import {readFile,writeFile} from 'node:fs/promises';
import {Vector3} from 'three';
import {CollisionWorld} from '../src/collision.js';
import {makeStreetLayout} from '../src/street-layout.js';
import {containsPlayArea} from '../src/play-area.js';
const fetchNative=globalThis.fetch;
globalThis.fetch=(url,init)=>typeof url==='string'&&url.startsWith('/')?readFile(new URL('../public'+url,import.meta.url)).then(bytes=>new Response(bytes)):fetchNative(url,init);
const manifest=JSON.parse(await readFile(new URL('../public/data/nyc/manifest.json',import.meta.url))),world=new CollisionWorld(manifest.files);
const layout=makeStreetLayout(JSON.parse(await readFile(new URL('../public/data/streets-osm.json',import.meta.url))));
const details=JSON.parse(await readFile(new URL('../public/data/street-details.json',import.meta.url))),poles=new Map(details.poles.map(p=>[p.id,p.position]));
layout.signals=layout.signals.filter(s=>poles.has(s.id));for(const s of layout.signals)s.position.fromArray(poles.get(s.id));
for(const id of ['plaza','streetscape','storefront','nypd-plaza','nasdaq','street-vendor','hard-rock-food','recruiting','lyric','bus','police-vehicle','port-authority','cinema','attractions','avenue','north42','south42-transit','five-times','east42','broadway-retail','district']){
 const mod=await import(`../src/${id}-geometry.js`),create=Object.entries(mod).find(([name])=>/^create.*Geometry$/.test(name))[1];world.addStatic(id,create().collision);
}
const street=await import('../src/street-detail-geometry.js'),bollard=await import('../src/curb-bollard-geometry.js');world.addStatic('sidewalks',street.createSidewalkGeometry(layout).collision);world.addStatic('signals',street.createSignalGeometry(layout).collision);world.addStatic('bollards',bollard.createCurbBollardGeometry(layout).collision);
const desired=[[-8,10],[12,30],[24,60],[42,97],[-26,-45],[-44,-75],[-68,-116],[-87,-150],[-115,-95],[-155,-110],[65,-120],[115,-70],[70,20],[99,65]],result=[];
for(const [index,[x,y]] of desired.entries()){
 const requested=new Vector3(x,y,.17);await world.stream(requested);let position=null;
 for(let radius=0;radius<=65&&!position;radius+=1.5)for(let i=0;i<(radius?32:1);i++){
  const p=requested.clone().add(new Vector3(Math.cos(i*Math.PI/16)*radius,Math.sin(i*Math.PI/16)*radius,0));
  if(!containsPlayArea(p,.8)||!world.ready(p)||result.some(n=>new Vector3(...n.position).distanceTo(p)<9))continue;
  const overhead=world.ray(p.clone().setZ(700),new Vector3(0,0,-1),701,true);if(overhead&&overhead.point.z>.4)continue;
  p.z=world.ground(p,.3);if(p.z>.4||p.z<-.1)continue;
  if(world.resolve(p.clone(),.55,1.8).distanceTo(p)>.03)continue;
  // Enough room to approach the person from either side and hold a theft.
  const approaches=[];for(let j=0;j<8;j++){const q=p.clone().add(new Vector3(Math.cos(j*Math.PI/4)*1.25,Math.sin(j*Math.PI/4)*1.25,0));q.z=world.ground(q,.34);if(Math.abs(q.z-p.z)<.3&&world.resolve(q.clone(),.34,1.78).distanceTo(q)<.03)approaches.push(q);}
  if(approaches.length<4)continue;position=p;break;
 }
 if(!position)throw Error('No safe NPC position '+index);
 result.push({id:`npc-${index+1}`,position:position.toArray().map(v=>+v.toFixed(3)),heading:+((index*1.7)%(Math.PI*2)-Math.PI).toFixed(3),characterId:['commuter','explorer','tourist'][index%3]});
}
await writeFile(new URL('../public/data/npc-pedestrians.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
console.log(`Placed ${result.length} pedestrians outside real buildings and street furniture.`);
