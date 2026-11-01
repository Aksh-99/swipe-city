// Fit the prototype perimeter to shared intersections in the bundled OSM
// extract. Keep the boundary streets and their mapped outer sidewalks open.
import {readFile,writeFile} from 'node:fs/promises';
import {localPoint} from '../src/street-layout.js';
import {roadWidth} from '../src/street-proportions.js';
const streets=JSON.parse(await readFile('public/data/streets-osm.json'));
const roadTypes=new Set(['primary','secondary','tertiary','residential','unclassified']);
const roads=name=>streets.elements.filter(w=>w.tags?.name===name&&roadTypes.has(w.tags.highway));
const key=p=>`${p.lat}/${p.lon}`;
function corner(street,avenue){
 const a=roads(street),b=roads(avenue),points=new Map(b.flatMap(w=>w.geometry.map(p=>[key(p),p])));
 const matches=a.flatMap(w=>w.geometry.filter(p=>points.has(key(p))));
 if(!matches.length)throw new Error(`Missing mapped intersection: ${street} / ${avenue}`);
 const geo=matches[0],p=localPoint(geo);
 return {street,avenue,position:[p.x,p.y],latitude:geo.lat,longitude:geo.lon};
}
const intersections=[corner('West 42nd Street','8th Avenue'),corner('West 42nd Street','6th Avenue'),corner('West 49th Street','6th Avenue'),corner('West 49th Street','8th Avenue')];
const edgeNames=['West 42nd Street','6th Avenue','West 49th Street','8th Avenue'];
const planes=intersections.map((entry,i)=>{
 const a=entry.position,b=intersections[(i+1)%4].position,dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy),normal=[-dy/length,dx/length];
 const centerOffset=normal[0]*a[0]+normal[1]*a[1];
 let margin=Math.max(...roads(edgeNames[i]).map(w=>roadWidth(w.tags).original/2))+2;
 const sidewalkWays=[];
 for(const way of streets.elements.filter(w=>w.tags?.footway==='sidewalk'&&w.tags.tunnel!=='yes'&&(!w.tags.level||w.tags.level==='0')&&w.geometry?.every(Boolean))){
  const points=way.geometry.map(localPoint),halfWidth=(Math.max(2.2,Math.min(6,parseFloat(way.tags.width)||3.7)))/2;
  for(let j=1;j<points.length;j++){
   const p=points[j-1],q=points[j],sx=q.x-p.x,sy=q.y-p.y,segmentLength=Math.hypot(sx,sy);
   if(segmentLength<.01||Math.abs((sx*dx+sy*dy)/(segmentLength*length))<.95)continue;
   for(const point of [p,q]){
    const along=((point.x-a[0])*dx+(point.y-a[1])*dy)/length,side=normal[0]*point.x+normal[1]*point.y-centerOffset;
    if(along<0||along>length||side>=0||side< -24)continue;
    margin=Math.max(margin,-side+halfWidth+.35);sidewalkWays.push(way.id);
   }
  }
 }
 return {name:edgeNames[i],normal,offset:centerOffset-margin,centerOffset,margin,sidewalkWayIds:[...new Set(sidewalkWays)]};
});
// W49 is scenery only: the playable edge stops at its south curb.
planes[2].offset=planes[2].centerOffset+7;planes[2].margin=-7;
const polygon=planes.map((plane,i)=>{
 const previous=planes[(i+3)%4],a=previous.normal,b=plane.normal,det=a[0]*b[1]-a[1]*b[0];
 return [(previous.offset*b[1]-a[1]*plane.offset)/det,(a[0]*plane.offset-previous.offset*b[0])/det];
});
await writeFile('public/data/play-area.json',JSON.stringify({version:1,label:'W 42nd–48th Street · Sixth–Eighth Avenue · W49 closed',source:'Bundled OpenStreetMap street intersections and sidewalk traces; estimated widths where unmapped.',intersections,planes,polygon},null,2)+'\n');
console.log('Mapped playable perimeter:',planes.map(p=>`${p.name}: ${p.margin.toFixed(1)} m outward from centerline`).join('; '));
