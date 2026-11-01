import {readFile,writeFile} from 'node:fs/promises';
import {Vector3} from 'three';
import {CollisionWorld} from '../src/collision.js';
import {localPoint,nearestSegment} from '../src/street-layout.js';
import {fitMmsCorner} from './fit-mms-corner.mjs';
import {fitHersheysCorner} from './fit-hersheys-corner.mjs';
import {fitDisneyBlock} from './fit-disney-block.mjs';
import {fitHardRockBlock} from './fit-hard-rock-block.mjs';

const read=async path=>JSON.parse(await readFile(path,'utf8'));
const geocodes=await read('public/data/shop-addresses-nyc.json'),osm=await read('public/data/streets-osm.json'),manifest=await read('public/data/nyc/manifest.json');
globalThis.fetch=async url=>new Response(await readFile('public'+url));
const city=new CollisionWorld(manifest.files);city.radius=900;await city.stream(new Vector3());
const roads=osm.elements.filter(e=>e.geometry?.length>1&&e.tags?.name&&['primary','secondary','tertiary','residential','unclassified','pedestrian'].includes(e.tags.highway)&&e.tags.tunnel!=='yes').map(e=>({id:e.id,tags:e.tags,points:e.geometry.map(localPoint)}));
const up=new Vector3(0,0,1),fronts=[],omitted=[];
let storeNeighbors=[];
const inBounds=p=>Math.abs(p.x*.848-p.y*.53)<345&&Math.abs(p.x*.53+p.y*.848)<466;
const catalog=[
 ['grand-slam','Grand Slam New York','1557 Broadway','Broadway','souvenir',11,'#183d69','https://www.grandslamnewyork.com/pages/About-Us'],
 ['gifts-square','Gifts on the Square','736 7 Avenue','7th Avenue','souvenir',8,'#8c2027','https://www.timessquarenyc.org/retail/gifts-on-the-square'],
 ['love-ny','I Love NY Gifts','1653 Broadway','Broadway','souvenir',8,'#a31d2b','user-provided business and address'],
 ['megamart','NYC Gifts Megamart','761 7 Avenue','7th Avenue','souvenir',10,'#146184','https://megamartnyc.com/'],
 ['big-apple','Big Apple Souvenirs & Gifts','840 7 Avenue','7th Avenue','souvenir',9,'#b52722','user-provided business and address'],
 ['playland','Playland Gifts','711 7 Avenue','7th Avenue','souvenir',5.8,'#a81f31','user-provided business and address'],
 ['giftloft','NYGiftLoft','717 7 Avenue','7th Avenue','souvenir',6.4,'#234c67','https://nygiftloft.com/pages/contact-us'],
 ['times-pizza','New Times Square Pizza','236 West 40 Street','West 40th Street','pizza',7.8,'#a82520','https://newtimessquarepizza.com/'],
 ['delicious-7','Delicious Pizza 2','558 7 Avenue','7th Avenue','pizza',5.7,'#b71e24','user-provided business and address'],
 ['fresh-pizza','$1.50 Fresh Pizza','143 West 40 Street','West 40th Street','pizza',6.8,'#bb2924','https://slicelife.com/restaurants/ny/new-york/10018/99-cents-fresh-pizza-new-york/menu'],
 ['delicious-8','$1.50 Delicious Pizza','618 8 Avenue','8th Avenue','pizza',6.8,'#b5251d','user-provided business and address'],
 ['hand-tossed','$1.50 NYC Hand Tossed Pizza','617 9 Avenue','9th Avenue','pizza',7,'#b82920','user-provided business and address'],
 ['disney','Disney Store','1540 Broadway','Broadway','toys',17,'#182a61','https://stores.disneystore.com/ny/new-york/'],
 ['mms',"M&M’S New York",'1600 Broadway','Broadway','candy',16,'#49221a','https://www.mms.com/en-us/explore/mms-stores/new-york'],
 ['hersheys',"HERSHEY’S Chocolate World",'701 7 Avenue','7th Avenue','chocolate',15,'#41231d','https://www.chocolateworld.com/locations/times-square.html'],
 ['hard-rock','Hard Rock Cafe','1501 Broadway','Broadway','restaurant',16,'#773630','https://cafe.hardrock.com/new-york/'],
];

function fit(item,anchor,roadName,requestedWidth){
 const candidates=roads.filter(r=>r.tags.name===roadName),near=nearestSegment(anchor,candidates);if(!near)return null;
 const toward=anchor.clone().sub(near.point).setZ(0).normalize();
 // Keep the frontage anchored to the requested address while fitting the
 // historical building's actual triangle plane. PAD positions can be parcel
 // centroids, so the storefront is placed on the corresponding street face.
 for(const offset of [0,-2,2,-4,4]){
  const from=near.point.clone().addScaledVector(near.direction,offset).setZ(2.2),hit=city.ray(from,toward,100);
  if(!hit||Math.abs(hit.face.normal.z)>.15)continue;
  const normal=hit.face.normal.clone().setZ(0).normalize();if(normal.dot(toward)>0)normal.negate();
  const right=new Vector3().crossVectors(up,normal).normalize();
  const center=hit.point.clone().setZ(0).addScaledVector(normal,.12);
  if(center.distanceTo(anchor)>100||!inBounds(center.clone().addScaledVector(normal,3)))continue;
  for(const width of [requestedWidth,requestedWidth*.8,requestedWidth*.62]){
   const supports=[-.5,0,.5].every(t=>[1.2,3.1,4.2].every(z=>{
    const p=center.clone().addScaledVector(right,t*width).addScaledVector(normal,3).setZ(z),h=city.ray(p,normal.clone().negate(),5);
    return h&&Math.abs(h.face.normal.z)<.15&&Math.abs(h.distance-3.12)<.9;
   }));
   if(!supports)continue;
   if(fronts.some(f=>{const d=center.clone().sub(new Vector3(...f.center));return normal.dot(new Vector3(...f.normal))>.95&&Math.abs(d.dot(normal))<2&&Math.abs(d.dot(right))<(width+f.width)/2+.4;}))continue;
   const height=['toys','candy','chocolate'].includes(item.kind)?6.6:4.35;
   return {...item,center:center.toArray(),normal:normal.toArray(),width,height,sourceAnchor:anchor.toArray(),road:roadName,placement:'NYC PAD address projected onto original NYC building facade; storefront dimensions and finishes are authored'};
  }
 }
 return null;
}
// Larger flagships claim their distinct frontage before adjacent small stores.
const ordered=[...catalog.slice(12),...catalog.slice(0,12)];
for(const [id,name,address,street,kind,width,color,source] of ordered){
 const row=geocodes.addresses.find(r=>r.query===address),point=row.response.features[0];
 const [lon,lat]=point.geometry.coordinates,anchor=localPoint({lon,lat});
 if(!inBounds(anchor)){omitted.push({id,name,address,reason:'Outside the existing Times Square playable boundary',coordinates:[lon,lat]});continue;}
 const item=fit({id,name,address,kind,color,source,latitude:lat,longitude:lon,authored:false},anchor,street,width);
 if(item){
  if(id==='disney'){const block=fitDisneyBlock(item,city);fronts.push(block.disney);storeNeighbors.push(...block.neighbors);}
  else if(id==='hard-rock'){const block=fitHardRockBlock(item,city);fronts.push(block.hardRock);storeNeighbors.push(...block.neighbors);}
  else fronts.push(id==='mms'?fitMmsCorner(item,city):id==='hersheys'?fitHersheysCorner(item,city):item);
 }else omitted.push({id,name,address,reason:'No clear facade fit in original building mesh'});
}
// Small neighborhood delis are fictional set dressing explicitly requested by
// the user. They occupy real side-street facades, with no invented building mass.
for(const [id,name,from,road,width,color] of [
 ['duffy-deli','Duffy Square Deli',[-63,115],'West 46th Street',7.5,'#235844'],
 ['broadway-deli','Broadway Deli & Grocery',[92,-38],'West 45th Street',7.5,'#215a43'],
 ['fortyfour-deli','44th Street Deli',[-142,10],'West 44th Street',6.8,'#396345'],
 ['corner-deli','Corner Market & Deli',[187,220],'West 48th Street',8,'#3c6049'],
]){
 const anchor=new Vector3(...from,0),item=fit({id,name,address:road,kind:'deli',color,authored:true,source:'User-authorized fictional neighborhood deli'},anchor,road,width);
 if(item)fronts.push(item);else omitted.push({id,name,reason:'No clear facade fit in original building mesh'});
}
fronts.push(...storeNeighbors);
await writeFile('public/data/storefronts.json',JSON.stringify({description:'Named stores at NYC address anchors, fitted to historical NYC city geometry. Authored storefronts, display textures, fictional delis and three fictional glass retail shops; not a photographic or current business survey.',geocodeSource:geocodes.source_url,fronts,omitted},null,2)+'\n');
console.log(JSON.stringify({fronts:fronts.map(f=>({id:f.id,name:f.name,center:f.center,width:f.width})),omitted},null,2));
