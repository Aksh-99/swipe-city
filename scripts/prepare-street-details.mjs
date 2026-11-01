import {readFile,writeFile} from 'node:fs/promises';
import {Vector3} from 'three';
import {CollisionWorld} from '../src/collision.js';
import {makeStreetLayout,nearestSegment} from '../src/street-layout.js';
const streets=JSON.parse(await readFile('public/data/streets-osm.json')),manifest=JSON.parse(await readFile('public/data/nyc/manifest.json'));
globalThis.fetch=async url=>new Response(await readFile('public'+url));
const c=new CollisionWorld(manifest.files);c.radius=800;await c.stream(new Vector3());const layout=makeStreetLayout(streets),poles=[];
function clear(p){
 for(const z of [.8,2,4])for(const d of [[1,0],[-1,0],[0,1],[0,-1]])if(c.ray(p.clone().setZ(z),new Vector3(...d,0),.6))return false;
 const roof=c.ray(p.clone().setZ(800),new Vector3(0,0,-1),801);return !roof||roof.point.z<.5;
}
for(const s of layout.signals){
 const options=[s.position,...s.candidates];
 const at=options.find(p=>clear(p)&&(nearestSegment(p,layout.sidewalks)?.distance??99)<2.8);
 if(!at||poles.some(p=>new Vector3(...p.position).distanceTo(at)<1.2))continue;
 poles.push({id:s.id,position:at.toArray()});
}
await writeFile('public/data/street-details.json',JSON.stringify({description:'Authored M-2A-inspired signal assemblies at OSM signalized crossing corners. Pole offsets checked against the original NYC building mesh; not a surveyed pole inventory. Display timing is illustrative.',poles},null,2)+'\n');
console.log(JSON.stringify({mappedCrossings:layout.crossings.length,poles:poles.length,skipped:layout.signals.length-poles.length}));
