import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {Vector3} from 'three';
import {CollisionWorld} from '../src/collision.js';

// Survey the existing 3 Times Square corner across W43 from Hard Rock.
// Dimensions are derived from NYC mesh planes, not replacement buildings.
globalThis.fetch=async url=>new Response(await readFile('public'+url));
const world=new CollisionWorld(JSON.parse(await readFile('public/data/nyc/manifest.json')).files);
const store=JSON.parse(await readFile('public/data/storefronts.json')).fronts.find(f=>f.id==='hard-rock');
const neighbor=store.neighbors.find(f=>f.id==='south'),seed=new Vector3(...neighbor.center);
await world.stream(seed);
function survey(id,origin,normal){
 const n=normal.clone().setZ(0).normalize(),r=new Vector3(-n.y,n.x,0);
 const hit=world.ray(origin.clone().addScaledVector(n,3).setZ(8),n.clone().negate(),8);
 if(!hit)throw Error('Missing source wall '+id);
 const o=hit.point.clone().setZ(0);
 const supported=x=>{const h=world.ray(o.clone().addScaledVector(r,x).addScaledVector(n,3).setZ(8),n.clone().negate(),5);return h&&Math.abs(h.distance-3)<.04&&Math.abs(h.face.normal.clone().setZ(0).normalize().dot(n))>.999;};
 const edge=sign=>{let inside=0;while(inside<90&&supported(sign*(inside+.25)))inside+=.25;let outside=inside+.25;for(let k=0;k<16;k++){const mid=(inside+outside)/2;if(supported(sign*mid))inside=mid;else outside=mid;}return sign*inside;};
 const low=edge(-1),high=edge(1),a=o.clone().addScaledVector(r,low),b=o.clone().addScaledVector(r,high),center=a.clone().lerp(b,.5).addScaledVector(n,.13),width=high-low-.44,height=34;
 let maxFitError=0;
 for(const x of [-.48,-.25,0,.25,.48])for(const z of [1,3,8,16,26,34]){
  const h=world.ray(center.clone().addScaledVector(r,x*width).addScaledVector(n,3).setZ(z),n.clone().negate(),5);
  if(!h||Math.abs(h.distance-3.13)>.12)throw Error(`${id} skin exceeds source at ${x}, ${z}`);
  maxFitError=Math.max(maxFitError,Math.abs(h.distance-3.13));
 }
 return {id,center:center.toArray(),normal:n.toArray(),width,height,sourceA:a.toArray(),sourceB:b.toArray(),skinOffset:.13,maxFitError};
}
const east=survey('seventh',seed,new Vector3(...neighbor.normal)),corner=new Vector3(...east.sourceB),eastN=new Vector3(...east.normal),northGuess=new Vector3(-eastN.y,eastN.x,0);
const side=world.ray(corner.clone().addScaledVector(eastN,-8).addScaledVector(northGuess,5).setZ(8),northGuess.clone().negate(),12);
if(!side)throw Error('Missing Touro W43 return');
const north=side.face.normal.clone().setZ(0).normalize();if(north.dot(northGuess)<0)north.negate();
const returnFace=survey('west43',side.point,north);
const chamferA=new Vector3(...east.sourceB),chamferB=new Vector3(...returnFace.sourceA),chamferAlong=chamferB.clone().sub(chamferA).normalize(),chamferNormal=new Vector3(chamferAlong.y,-chamferAlong.x,0);
const chamfer=survey('corner',chamferA.clone().lerp(chamferB,.5),chamferNormal);
const view=corner.clone().addScaledVector(eastN,9).addScaledVector(north,6).setZ(.17);
if(world.ray(view.clone().setZ(700),new Vector3(0,0,-1),701))throw Error('Touro inspection spawn is covered');
const result={id:'touro',name:'Touro corner',address:'202 W 43rd Street · 3 Times Square',description:'User-reference Touro podium skin fitted to the original NYC building. Authored granite, lobby glazing, signs and fictional corner advertising; no screenshot pixels or replacement building.',center:east.center,normal:east.normal,corner:corner.toArray(),facades:[east,chamfer,returnFace],screenBottom:9.25,screenTop:31.8,view:{position:view.toArray(),yaw:Math.atan2(corner.x-view.x,corner.y-view.y),pitch:-.14}};
await writeFile('public/data/touro-frontage.json',JSON.stringify(result,null,2)+'\n');
await mkdir('public/licenses',{recursive:true});
await writeFile('public/licenses/touro-font-license.txt',await readFile('node_modules/three/examples/fonts/LICENSE'));
console.log({facades:result.facades.map(f=>({id:f.id,width:f.width,error:f.maxFitError})),corner:result.corner,view:result.view.position});
