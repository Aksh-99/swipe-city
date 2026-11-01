import {readFile,writeFile} from 'node:fs/promises';
import {Cartesian3} from 'cesium';
import {toLocal} from '../src/coordinates.js';
const source=JSON.parse(await readFile(new URL('../public/data/streets-osm.json',import.meta.url)));
const avenues=new Set(['Broadway','7th Avenue','6th Avenue','8th Avenue','Avenue of the Americas']);
const segments=[];
for(const way of source.elements){
 const name=way.tags?.name;if(!name||!way.geometry||way.tags.tunnel==='yes')continue;
 const match=name.match(/^West (4[2-9])(?:nd|rd|th) Street$/);
 if(!match&&!avenues.has(name))continue;
 const points=way.geometry.map(p=>toLocal(Cartesian3.fromDegrees(p.lon,p.lat)));
 for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i];if(Math.min(a.x,b.x)>500||Math.max(a.x,b.x)<-500||Math.min(a.y,b.y)>550||Math.max(a.y,b.y)<-450)continue;
  segments.push({name:match?`W ${match[1]}${match[1]==='42'?'nd':match[1]==='43'?'rd':'th'} St`:name==='Avenue of the Americas'?'6th Avenue':name,kind:match?'street':'avenue',a:[+a.x.toFixed(3),+a.y.toFixed(3)],b:[+b.x.toFixed(3),+b.y.toFixed(3)]});
 }
}
await writeFile(new URL('../public/data/report-streets.json',import.meta.url),JSON.stringify({source:'Bundled OpenStreetMap street geometry',segments})+'\n');
console.log(`Prepared ${segments.length} real street segments for report locations.`);
