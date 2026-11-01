// Offline audit only. Runtime coverage is a material on streamed 3D Tiles;
// this does not add the whole city's geometry to the browser's memory.
import {readFile,writeFile} from 'node:fs/promises';
import {Vector3} from 'three';
import {CollisionWorld} from '../src/collision.js';
import {localPoint} from '../src/street-layout.js';
import {LOWER_FACADE,lowerFacadeCoverage} from '../src/lower-facade.js';
import {DISTRICT} from '../src/district-config.js';
const json=async p=>JSON.parse(await readFile(p));
globalThis.fetch=async p=>new Response(await readFile('public'+p));
const manifest=await json('public/data/nyc/manifest.json'),world=new CollisionWorld(manifest.files);world.radius=750;await world.stream(new Vector3(0,40,0));
const streets=await json('public/data/streets-osm.json');
const roads=streets.elements.filter(w=>w.geometry&&/^(West 4[2-9](nd|rd|th) Street|[678]th Avenue|Avenue of the Americas|Broadway)$/.test(w.tags?.name||'')&&['trunk','primary','secondary','tertiary','residential','pedestrian'].includes(w.tags?.highway)&&w.tags?.area!=='yes'&&w.tags?.tunnel!=='yes');
const report={scope:'All street-facing source walls throughout W42–W49 and Sixth–Eighth Avenues, including boundary building faces',method:'One-metre road probes toward both sides at five elevations; source-only NYC wall hits. Original geometry, curated overlays and collision remain unchanged. outsideGenericPanels counts samples outside the generic district rectangles; these include existing detailed landmarks and are not all previously visible holes.',finish:LOWER_FACADE,streets:{},samples:0,covered:0,uncovered:0,outsideGenericPanels:0,verificationLimit:'Material coverage and real Cesium shader pipeline validation; live WebGL appearance and FPS remain unverified.'};
const seen=new Set();
for(const road of roads){
 const points=road.geometry.map(localPoint),entry=report.streets[road.tags.name]??={samples:0,covered:0,outsideGenericPanels:0};
 for(let j=1;j<points.length;j++){
  const a=points[j-1],b=points[j],along=b.clone().sub(a).normalize(),side=new Vector3(-along.y,along.x,0),length=a.distanceTo(b);
  for(let s=.5;s<length;s+=1){const p=a.clone().addScaledVector(along,s);
   // Ignore unrelated continuation roads outside the bounded neighborhood.
   if(!lowerFacadeCoverage(p.clone().setZ(0),0))continue;
   for(const sign of [-1,1])for(const z of [.20,2.0,5.8,10.5,14.19]){
    const hit=world.ray(p.clone().setZ(z),side.clone().multiplyScalar(sign),44,true);
    if(!hit||Math.abs(hit.face.normal.z)>=.45||!lowerFacadeCoverage(hit.point,0))continue;
    const key=road.tags.name+':'+hit.point.toArray().map(v=>Math.round(v*5)).join(',');if(seen.has(key))continue;seen.add(key);
    report.samples++;entry.samples++;
    if(lowerFacadeCoverage(hit.point,hit.face.normal.z)){report.covered++;entry.covered++;}else report.uncovered++;
    const inPanel=DISTRICT.facades.some(f=>{const n=new Vector3(...f.normal),r=new Vector3(-n.y,n.x,0),d=hit.point.clone().sub(new Vector3(...f.center));return Math.abs(d.dot(n))<.5&&Math.abs(d.dot(r))<=f.width/2&&z>=f.bottom&&z<=f.top;});
    if(!inPanel){report.outsideGenericPanels++;entry.outsideGenericPanels++;}
   }
  }
 }
}
await writeFile('docs/lower-facade-coverage.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));if(report.uncovered||report.samples<5000)process.exitCode=1;
