import {readFile,writeFile} from 'node:fs/promises';
import {makeStreetLayout} from '../src/street-layout.js';
const layout=makeStreetLayout(JSON.parse(await readFile(new URL('../public/data/streets-osm.json',import.meta.url))));
const placements=JSON.parse(await readFile(new URL('../public/data/street-details.json',import.meta.url)));
const visible=new Set(placements.poles.map(p=>p.id)),groups=new Map();
for(const pole of layout.signals)if(visible.has(pole.id))for(const head of pole.pedestrians)groups.set(head.crossing,head.group);
const crossings=layout.crossings.filter(c=>groups.has(c.id)).map(c=>({id:c.id,group:groups.get(c.id),width:Math.max(2,Math.min(6,parseFloat(c.tags.width)||3)),points:c.points.map(p=>p.toArray().slice(0,2))}));
await writeFile(new URL('../public/data/jaywalking-crossings.json',import.meta.url),JSON.stringify({crossings})+'\n');
console.log(`${crossings.length} crossings with visible pedestrian signals`);
