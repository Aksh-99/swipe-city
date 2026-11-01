import {readFile,writeFile} from 'node:fs/promises';
import {Vector3} from 'three';
import {CollisionWorld} from '../src/collision.js';
import {localPoint,makeStreetLayout,nearestSegment} from '../src/street-layout.js';
import {CINEMA_BLOCK as B} from '../src/cinema-config.js';
import {SUBWAY_ENTRANCES} from '../src/streetscape-config.js';
import {insideEntrance} from '../src/ground-cutouts.js';
import {createDistrictGeometry} from '../src/district-geometry.js';
import {BUS_STOPS} from '../src/bus-config.js';
const json=async p=>JSON.parse(await readFile(p));
globalThis.fetch=async p=>new Response(await readFile('public'+p));
const world=new CollisionWorld((await json('public/data/nyc/manifest.json')).files);world.radius=750;await world.stream(new Vector3(0,40,0));
const origin=new Vector3(...B.origin),east=new Vector3(...B.east),north=new Vector3(...B.north),coordinates=p=>{const d=p.clone().sub(origin);return [d.dot(east),d.dot(north)];},inDistrict=p=>{const [s,t]=coordinates(p);return s>6&&s<544&&t>9&&t<562;};
const preserved=[],preservedFiles=['storefronts','avenue','nasdaq','lyric-theatre','cinema-block','42nd-attractions','north42','south42-transit','five-times','broadway-retail','nypd-plaza','recruiting-station','port-authority','landmarks'];
function collect(d){
 if(!d||typeof d!=='object')return;
 if(d.normal&&d.width>2&&d.center)preserved.push({center:d.center,normal:d.normal,width:d.width+2});
 if(d.normal&&d.a&&d.b){const a=new Vector3(...d.a),b=new Vector3(...d.b);preserved.push({center:a.clone().lerp(b,.5).toArray(),normal:d.normal,width:a.distanceTo(b)+2});}
 for(const v of Object.values(d))if(typeof v==='object')collect(v);
}
for(const file of preservedFiles)collect(await json('public/data/'+file+'.json'));
const protectedPoint=(p,n)=>preserved.some(f=>{const normal=new Vector3(...f.normal),d=p.clone().sub(new Vector3(...f.center));return Math.abs(normal.dot(n))>.92&&Math.abs(d.dot(normal))<3&&Math.abs(d.dot(new Vector3(-normal.y,normal.x,0)))<f.width/2+1;});
const streets=await json('public/data/streets-osm.json'),layout=makeStreetLayout(streets),facades=[],lamps=[],routes=[],seen=new Set();let probeCount=0;
const roads=streets.elements.filter(w=>w.geometry&&/^(West 4[2-9](nd|rd|th) Street|[678]th Avenue|Avenue of the Americas|Broadway)$/.test(w.tags?.name||'')&&['trunk','primary','secondary','tertiary','residential','pedestrian'].includes(w.tags?.highway)&&w.tags?.area!=='yes'&&w.tags?.tunnel!=='yes');
for(const way of roads){
 const points=way.geometry.map(localPoint);
 for(let j=1;j<points.length;j++){
  const from=points[j-1],to=points[j],length=from.distanceTo(to);if(length<3)continue;
  const along=to.clone().sub(from).normalize(),side=new Vector3(-along.y,along.x,0);
  for(let s=2;s<length;s+=9){const p=from.clone().addScaledVector(along,s);if(!(()=>{const [x,y]=coordinates(p);return x>-5&&x<555&&y>0&&y<565;})())continue;
   for(const sign of [-1,1]){
    const direction=side.clone().multiplyScalar(sign),hit=world.ray(p.clone().setZ(2.6),direction,44,true);probeCount++;
    if(!hit||Math.abs(hit.face.normal.z)>.10||!inDistrict(hit.point))continue;
    const n=hit.face.normal.clone().setZ(0).normalize();if(n.dot(direction)>0)n.negate();
    const center=hit.point.clone().setZ(0).addScaledVector(n,.14),right=new Vector3(-n.y,n.x,0);
    if(protectedPoint(center,n))continue;
    if(facades.some(f=>{const d=center.clone().sub(new Vector3(...f.center));return new Vector3(...f.normal).dot(n)>.985&&Math.abs(d.dot(n))<.7&&Math.abs(d.dot(right))<(f.width/2+5.4);}))continue;
    let selected=null;
    for(const width of [15,11,7.2,4.4]){
     const corners=[-.49,0,.49].map(x=>center.clone().addScaledVector(right,x*width));
     if(corners.some(q=>!inDistrict(q)||protectedPoint(q,n)))continue;
     for(const top of [14.2,10.6,6.2]){
      let maxError=0;
      const ok=corners.every(q=>[.42,3.0,5.8,top-.10].every(z=>{const h=world.ray(q.clone().addScaledVector(n,.40).setZ(z),n.clone().negate(),.7,true);probeCount++;if(!h)return false;maxError=Math.max(maxError,Math.abs(h.distance-.54));return Math.abs(h.distance-.54)<.045;}));
      if(ok){selected={width,top,maxError};break;}
     }
     if(selected)break;
    }
    if(!selected)continue;
    const id=facades.length,[gridX,gridY]=coordinates(center),avenue=/Avenue/.test(way.tags.name),core=way.tags.name==='Broadway'||way.tags.name==='7th Avenue',kind=avenue&&gridX>430?'office':core?'retail':id%5===0?'theatre':['deli','coffee','fashion','restaurant'][id%4];
    const walk=center.clone().addScaledVector(n,2.25).setZ(.17),safe=world.resolve(walk.clone()).clone().sub(walk).setZ(0).length()<.02;
    if(!safe)continue;
    const key=way.tags.name+Math.round(gridX/10)+':'+Math.round(gridY/10);if(seen.has(key))continue;seen.add(key);
    facades.push({id:'district-'+id,street:way.tags.name,center:center.toArray(),normal:n.toArray(),width:selected.width,bottom:.18,top:selected.top,kind,palette:id%5,ad:(id*3+1)%8,maxFitError:selected.maxError,scaffold:(!core&&id%6===1&&selected.width>=10),canopy:kind==='restaurant'||kind==='theatre',screen:core&&selected.top>10&&id%2===0,walk:walk.toArray()});
   }
  }
 }
}
world.addStatic('new-frontages',createDistrictGeometry({facades,lamps:[],north:B.north}).collision);
// Lamps use actual sidewalk centerlines, with clear space at stairs, crossings,
// bus bays and the detailed landmark fronts.
for(const path of layout.sidewalks){for(let j=1;j<path.points.length;j++){
 const a=path.points[j-1],b=path.points[j],length=a.distanceTo(b),d=b.clone().sub(a).normalize();if(length<12)continue;
 for(let s=9;s<length-3;s+=29){const mid=a.clone().addScaledVector(d,s);if(!inDistrict(mid))continue;if(world.resolve(mid.clone().setZ(.17)).clone().sub(mid.clone().setZ(.17)).setZ(0).length()>.02)continue;const road=nearestSegment(mid,layout.roadPaths);if(!road)continue;
  const outward=road.point.clone().sub(mid).setZ(0).normalize(),p=mid.clone().addScaledVector(outward,1.20).setZ(.17);
  if(protectedPoint(p,outward)||lamps.some(l=>new Vector3(...l.position).distanceTo(p)<16)||SUBWAY_ENTRANCES.some(e=>insideEntrance(e,p,2))||(nearestSegment(p,layout.crossings)?.distance??99)<5||BUS_STOPS.some(b=>new Vector3(...b.center).distanceTo(p)<b.length/2+4))continue;
  if(world.resolve(p.clone()).clone().sub(p).setZ(0).length()>.02)continue;
  lamps.push({position:p.toArray(),normal:outward.toArray()});
 }
}}
const names=['West 43rd Street','West 45th Street','West 47th Street','West 49th Street','6th Avenue','7th Avenue','8th Avenue'];
for(const name of names){const paths=layout.sidewalks.filter(p=>p.points.length>1);const road=layout.roadPaths.find(p=>p.tags.name===name&&p.points.some(inDistrict));if(!road)continue;
 const clearPath=path=>path.points.slice(1).every((b,i)=>{const a=path.points[i],length=a.distanceTo(b);for(let d=0;d<=length;d+=1){const q=a.clone().lerp(b,d/length).setZ(.17);if(world.resolve(q.clone()).clone().sub(q).setZ(0).length()>.015)return false;}return true;});
 const candidate=paths.filter(clearPath).filter(p=>p.points.every(inDistrict)&&p.points.some(q=>(nearestSegment(q,[road])?.distance??99)<16)).sort((a,b)=>b.points[0].distanceTo(b.points.at(-1))-a.points[0].distanceTo(a.points.at(-1)))[0];
 if(candidate)routes.push({id:name,points:candidate.points.map(p=>p.clone().setZ(.17).toArray())});
}
const places=['West 45th Street','8th Avenue','6th Avenue','West 47th Street','West 49th Street','Broadway'].map(street=>{
 const candidates=facades.filter(f=>f.street===street).sort((a,b)=>Math.abs(coordinates(new Vector3(...a.center))[1]-285)-Math.abs(coordinates(new Vector3(...b.center))[1]-285));
 const f=candidates.find(f=>{const p=new Vector3(...f.center).addScaledVector(new Vector3(...f.normal),3.5).setZ(.17);return world.resolve(p.clone()).clone().sub(p).setZ(0).length()<.02&&!world.ray(p.clone().setZ(700),new Vector3(0,0,-1),699.5,true);});
 if(!f)return null;const n=new Vector3(...f.normal),p=new Vector3(...f.center).addScaledVector(n,3.5).setZ(.17);
 return {id:f.id,name:f.street+' streetscape',shortName:f.street,address:f.street+' · Times Square district',center:f.center,normal:f.normal,view:{position:p.toArray(),yaw:Math.atan2(-n.x,-n.y),pitch:-.10}};
}).filter(Boolean);
await writeFile('public/data/district.json',JSON.stringify({description:'Reference-guided finishes on untouched original NYC street-facing walls. Retail names, temporary scaffolding and advertisements are authored scenery; this is not a current surveyed facade reconstruction.',origin:B.origin,east:B.east,north:B.north,bounds:[6,9,544,562],facades,lamps,routes,places,preserved,preservedFiles,probeCount},null,2)+'\n');
console.log({facades:facades.length,lamps:lamps.length,covered:facades.filter(f=>f.scaffold).length,screens:facades.filter(f=>f.screen).length,streets:[...new Set(facades.map(f=>f.street))],probeCount});
