import {readFile,writeFile} from 'node:fs/promises';
import {Vector3} from 'three';
import {CollisionWorld} from '../src/collision.js';
import {localPoint} from '../src/street-layout.js';
import {SUBWAY_ENTRANCES} from '../src/streetscape-config.js';
import {insideEntrance} from '../src/ground-cutouts.js';

// Survey the existing NYC mesh, including the actual low station pavilion.
// No replacement building footprints or hand-positioned city blocks.
globalThis.fetch=async url=>new Response(await readFile('public'+url));
const city=new CollisionWorld(JSON.parse(await readFile('public/data/nyc/manifest.json')).files);
const anchor=localPoint({lon:-73.98638,lat:40.75651});await city.stream(anchor);
const north=new Vector3(.493167589,.869934324,0).normalize(),right=new Vector3(-north.y,north.x,0);
function fromInside(direction){const h=city.ray(anchor.clone().setZ(1.5),direction,20);if(!h)throw Error('Missing original NYPD pavilion');return h.point.setZ(0);}
const fore=fromInside(north),aft=fromInside(north.clone().negate()),left=fromInside(right),east=fromInside(right.clone().negate());
const width=left.clone().sub(east).dot(right),depth=fore.clone().sub(aft).dot(north);
const center=anchor.clone().addScaledVector(north,fore.clone().add(aft).multiplyScalar(.5).sub(anchor).dot(north)).addScaledVector(right,left.clone().add(east).multiplyScalar(.5).sub(anchor).dot(right));
const station={id:'nypd',name:'NYPD Times Square station',address:'1471 Broadway',center:center.toArray(),normal:north.toArray(),width,depth,sourceRoof:city.ray(center.clone().setZ(30),new Vector3(0,0,-1),30).point.z,facades:[]};
for(const [id,n,w,d] of [['front',north,width,depth],['east',right.clone().negate(),depth,width],['west',right,depth,width],['rear',north.clone().negate(),width,depth]]){
 const c=center.clone().addScaledVector(n,d/2+.075),r=new Vector3(-n.y,n.x,0);
 for(const x of [-.47,0,.47])for(const z of [1,2.8]){const h=city.ray(c.clone().addScaledVector(r,x*w).addScaledVector(n,2).setZ(z),n.clone().negate(),3);if(!h||Math.abs(h.distance-2.075)>.08)throw Error('Station skin exceeds its real source wall');}
 station.facades.push({id,center:c.toArray(),normal:n.toArray(),width:w});
}
// North view stands on the mapped W43 approach. The source-only roof test
// ensures the visit button never starts in a building or on a roof.
const view=center.clone().addScaledVector(north,depth/2+8.8).addScaledVector(right,-2).setZ(.17);
if(city.ray(view.clone().setZ(700),new Vector3(0,0,-1),701))throw Error('NYPD view is not in the open');
station.view={position:view.toArray(),yaw:Math.atan2(-north.x,-north.y),pitch:-.10};

// The One Times Square east wall and opposite curved Broadway frontage.
function wallAt(y,side,z=2){const h=city.ray(new Vector3(-65,y,z),new Vector3(side,0,0),40);if(!h)throw Error(`Missing plaza wall at ${y}`);const n=h.face.normal.clone().setZ(0).normalize();if(n.x*side>0)n.negate();return {point:h.point.setZ(0),normal:n};}
const towerLow=wallAt(-218,-1),towerHigh=wallAt(-179,-1),towerN=towerLow.normal,towerAlong=towerHigh.point.clone().sub(towerLow.point).normalize();
const scaffolds=[{id:'one-times-square',center:towerLow.point.clone().lerp(towerHigh.point,.5).addScaledVector(towerN,1.9).toArray(),normal:towerN.toArray(),along:towerAlong.toArray(),length:towerLow.point.distanceTo(towerHigh.point),width:3.4,height:3.35,levels:3}];
// Short angled continuation ends beside the rear of the station, leaving its
// glass and north entrance visible, with no low crossbrace across the route.
const end=new Vector3(...scaffolds[0].center).addScaledVector(towerAlong,scaffolds[0].length/2),eastN=right.clone().negate();
const next=center.clone().addScaledVector(north,-depth/2+1.1).addScaledVector(eastN,width/2+1.9),along=next.clone().sub(end).normalize(),normal=new Vector3(along.y,-along.x,0);
scaffolds.push({id:'station-approach',center:end.clone().lerp(next,.5).toArray(),normal:normal.toArray(),along:along.toArray(),length:end.distanceTo(next),width:3.4,height:3.35,levels:1});
const neighbors=[];
for(let y=-216;y<-186;y+=3){
 const a=wallAt(y,1),b=wallAt(y+3,1),c=a.point.clone().lerp(b.point,.5),n=a.normal.clone().add(b.normal).normalize(),r=new Vector3(-n.y,n.x,0),w=a.point.distanceTo(b.point);
 // A curved source facade is followed by short fitted panels, not flattened.
 for(const z of [1,8,17]){const h=city.ray(c.clone().addScaledVector(n,2).setZ(z),n.clone().negate(),3);if(!h||Math.abs(h.distance-2)>.12)throw Error('Neighbor facade exceeds source surface');}
 neighbors.push({id:`broadway-glass-${y}`,center:c.addScaledVector(n,.09).toArray(),normal:n.toArray(),width:w+.025,height:17});
}
const oppositeLow=wallAt(-216,1),oppositeHigh=wallAt(-188,1),oppN=oppositeLow.normal,oppAlong=oppositeHigh.point.clone().sub(oppositeLow.point).normalize();
scaffolds.push({id:'opposite-broadway',center:oppositeLow.point.clone().lerp(oppositeHigh.point,.5).addScaledVector(oppN,2.05).toArray(),normal:oppN.toArray(),along:oppAlong.toArray(),length:oppositeLow.point.distanceTo(oppositeHigh.point),width:3.5,height:3.35,levels:2});
for(const scaffold of scaffolds)scaffold.grade=.075;

const tables=[],planters=[];
for(const side of [-1,1])for(let i=0;i<4;i++){
 const y=-212+i*8,wall=wallAt(y,side),p=wall.point.clone().addScaledVector(wall.normal,7.2).setZ(.075);
 // Respect the existing MTA stairwell, its covered entrance and approaches.
 // Shift a table toward the open plaza until chairs and walking clearance fit.
 let moved=0;while(SUBWAY_ENTRANCES.some(e=>insideEntrance(e,p,2.35))&&moved<5){p.addScaledVector(wall.normal,.2);moved+=.2;}
 if(SUBWAY_ENTRANCES.some(e=>insideEntrance(e,p,2.35)))throw Error('No safe umbrella-table placement near subway');
 if(city.ray(p.clone().setZ(700),new Vector3(0,0,-1),701))throw Error('Seating overlaps a source building');
 tables.push({position:p.toArray(),yaw:(i%2?.12:-.08)+Math.atan2(towerAlong.x,towerAlong.y),umbrella:true,side});
 const planter=wall.point.clone().addScaledVector(wall.normal,5.7).addScaledVector(towerAlong,3.2).setZ(.075);
 if(!SUBWAY_ENTRANCES.some(e=>insideEntrance(e,planter,2.0)))planters.push({position:planter.toArray(),along:towerAlong.toArray(),light:(i+(side===1?1:0))%2===0});
}
const route=[];for(let y=-223;y<=-175;y+=2){const a=wallAt(Math.max(-218,Math.min(-179,y)),-1),b=wallAt(Math.max(-216,Math.min(-186,y)),1);route.push([ (a.point.x+b.point.x)/2,y,.17]);}
const result={description:'Reference-inspired NYPD station skin fitted to its original NYC pavilion. Scaffold and furniture placement are authored from supplied references; this is not a current construction survey.',sources:['https://www.nyc.gov/site/nypd/news/pr1119/nypd-new-york-city-police-foundation-redesigned-substation-crossroads-the-world','https://mapcarta.com/W258646143'],station,scaffolds,neighbors,tables,planters,route};
await writeFile('public/data/nypd-plaza.json',JSON.stringify(result,null,2)+'\n');
console.log({station:{center:station.center,width,depth,roof:station.sourceRoof},scaffolds:scaffolds.map(s=>[s.id,s.length]),umbrellaTables:tables.length,neighborPanels:neighbors.length});
