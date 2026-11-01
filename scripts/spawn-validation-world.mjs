import {readFile,readdir} from 'node:fs/promises';
import {CollisionWorld} from '../src/collision.js';import {Vector3} from 'three';import {makeStreetLayout} from '../src/street-layout.js';import {createSidewalkGeometry,createSignalGeometry} from '../src/street-detail-geometry.js';import {createCurbBollardGeometry} from '../src/curb-bollard-geometry.js';import {stationaryVehicles} from '../src/vehicle-collision.js';
export async function spawnValidationWorld(){
 globalThis.fetch=async url=>new Response(await readFile(new URL('../public'+url,import.meta.url)));
 const manifest=JSON.parse(await readFile(new URL('../public/data/nyc/manifest.json',import.meta.url))),world=new CollisionWorld(manifest.files);world.radius=2000;await world.stream(new Vector3());
 const streets=JSON.parse(await readFile(new URL('../public/data/streets-osm.json',import.meta.url))),layout=makeStreetLayout(streets);
 for(const [i,g]of [createSidewalkGeometry(layout),createSignalGeometry(layout),createCurbBollardGeometry(layout)].entries())if(g.collision?.length)world.addStatic('street-'+i,g.collision);
 for(const file of await readdir(new URL('../src',import.meta.url))){if(!file.endsWith('.js')||file==='main.js')continue;const source=await readFile(new URL('../src/'+file,import.meta.url),'utf8');if(!source.includes('DetailMesh')||!source.includes('collision'))continue;const names=[...source.matchAll(/export function (create\w+)\(/g)].map(m=>m[1]);if(!names.length)continue;const module=await import('../src/'+file);for(const name of names){if(module[name].length)continue;const g=module[name]();if(g?.collision?.length)world.addStatic(file+name,g.collision);}}
 world.getVehicles=()=>stationaryVehicles;
 return {world,layout};
}
