import {readFile,writeFile} from 'node:fs/promises';
import {Vector3} from 'three';
import {CollisionWorld} from '../src/collision.js';
import {DISTRICT} from '../src/district-config.js';
const root='public';globalThis.fetch=async p=>new Response(await readFile(root+p));
const world=new CollisionWorld(JSON.parse(await readFile(root+'/data/nyc/manifest.json')).files);world.radius=400;await world.stream(new Vector3(-160,0,0));
const f=DISTRICT.facades.find(f=>f.id==='district-333'),c=new Vector3(...f.center),n=new Vector3(...f.normal),r=new Vector3(-n.y,n.x,0),p=(x,z)=>c.clone().addScaledVector(r,x).setZ(z);
const fits=x=>[1,10,20].every(z=>{const hit=world.ray(p(x,z).addScaledVector(n,.4),n.clone().negate(),.8,true);return hit&&Math.abs(hit.distance-.54)<.003;});
function edge(sign){let inside=0,outside=sign*40;for(let i=0;i<30;i++){const mid=(inside+outside)/2;if(fits(mid))inside=mid;else outside=mid;}return inside;}
const left=edge(-1)+.004,right=edge(1)-.004;
const roofs=[left,(left+right)/2,right].map(x=>world.ray(p(x,400).addScaledVector(n,-.30),new Vector3(0,0,-1),401,true)?.point.z);if(roofs.some(v=>!Number.isFinite(v)))throw Error('Source roof missing');
const top=Math.min(...roofs)-.003,center=p((left+right)/2,0),width=right-left;let maxError=0;
for(let x=left;x<=right;x+=.4)for(const z of [.3,7,14,20,top-.02]){const hit=world.ray(p(x,z).addScaledVector(n,.4),n.clone().negate(),.8,true);if(!hit)throw Error('Wall gap');maxError=Math.max(maxError,Math.abs(hit.distance-.54));}
const data={sourceFacade:f.id,description:'Full surveyed W44 office front, replacing the isolated 11 m by 14.2 m glass panel. Original building geometry and collision remain unchanged.',center:center.toArray(),normal:f.normal,width,bottom:.18,top,left,right,originalWidth:f.width,originalTop:f.top,maxFitError:maxError,bayWidth:1.22,floorHeight:3.2};
await writeFile('public/data/office-grid.json',JSON.stringify(data,null,2)+'\n');console.log(data);
