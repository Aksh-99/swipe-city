import{addGracePlaza}from'../src/grace-plaza.js';
import{addBryantPark}from'../src/bryant-park.js';
import{addSeventh49Corners}from'../src/seventh49-corners.js';
import{addBarclays49}from'../src/barclays49.js';
import{addSuperdry49}from'../src/superdry49.js';
import{addCitiBike48}from'../src/citibike48.js';
import{addHyatt49}from'../src/hyatt49.js';
import{addCvs49}from'../src/cvs49.js';
import{addPlaza}from'../src/plaza.js';
import{addStreetDetails}from'../src/street-details.js';
import{addStreetscape}from'../src/streetscape.js';
import{addStorefronts}from'../src/storefronts.js';
import{addNasdaq}from'../src/nasdaq.js';
import{addStudios}from'../src/studios.js';
import{Material as CanvasMaterial}from'../src/canvas-material.js';
import{readFile}from'node:fs/promises';
import{addMorgan48}from'../src/morgan48.js';
import{addMmsWhole}from'../src/mms-whole.js';
import{addRockefeller48}from'../src/rockefeller48.js';
import{addFive48}from'../src/five48.js';
import{addVoco48}from'../src/voco48.js';
import{addRenaissance48}from'../src/renaissance48.js';
import{addKrispy48}from'../src/krispy48.js';
import{addHyatt48}from'../src/hyatt48.js';
import{addWest48}from'../src/west48.js';
import{addFdnyTheta48}from'../src/fdny-theta48.js';
import{addSixth47}from'../src/sixth47.js';
import{addTsx47}from'../src/tsx47.js';
import{addOneTimesWrap}from'../src/one-times-wrap.js';
import {addTwo47} from '../src/two47.js';
import {addCorner47} from '../src/corner47.js';
import {addMid47} from '../src/mid47.js';
import {addBiltmore47} from '../src/biltmore47.js';
import {addCarve47} from '../src/carve47.js';
import {addDistrictParking} from '../src/district-parking.js';
import {addSixth46} from '../src/sixth46.js';
import {addSixth46Parking} from '../src/sixth46-parking.js';
import {addEast46} from '../src/east46.js';
import {addW46Corners} from '../src/w46-corners.js';
import {addWest46Parking} from '../src/west46-parking.js';
import {addWest46} from '../src/west46.js';
import {addEast45} from '../src/east45.js';
import {addMcdonaldsCorner} from '../src/mcdonalds-corner.js';
import {addMarriottFront} from '../src/marriott-front.js';
import {addMarriottReference} from '../src/marriott-reference.js';
import {addShubertAlley} from '../src/shubert-alley.js';
import {addWest45} from '../src/west45.js';
import {addDistrict} from '../src/district.js';
import {addSouth42Transit} from '../src/south42-transit.js';
import {addFiveTimes} from '../src/five-times.js';
import {addEast42} from '../src/east42.js';
import {addNorth42} from '../src/north42.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {PrimitiveCollection,Material,Resource} from 'cesium';
import {CollisionWorld} from '../src/collision.js';
import {addStreetVendors} from '../src/street-vendors.js';
import {addHardRockFoodRow} from '../src/hard-rock-food-row.js';
import {addRecruitingStation} from '../src/recruiting-station.js';
import {addLyricTheatre} from '../src/lyric-theatre.js';
import {addBuses} from '../src/buses.js';
import {addPortAuthority} from '../src/port-authority.js';
import {addCinemaBlock} from '../src/cinema-block.js';
import {addAttractions} from '../src/attractions.js';
import {addAvenue} from '../src/avenue.js';
import {addBroadwayRetail} from '../src/broadway-retail.js';
import {createTouroGeometry} from '../src/touro-geometry.js';
import {addTouroMaterials} from '../src/touro-materials.js';

// A DOM canvas cannot be constructed with `new HTMLCanvasElement()`.
// Match that browser contract so Cesium's deep clone fails here too if a
// runtime canvas leaks into a reusable Fabric template. Drawing is stubbed;
// this test covers real Cesium render setup, not pixels or WebGL execution.
class DomCanvas{constructor(){throw new TypeError('Illegal constructor: HTMLCanvasElement');}}
const context=()=>new Proxy({measureText:text=>({width:String(text).length*10}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})}, {
 get:(object,key)=>key in object?object[key]:()=>{},
 set:(object,key,value)=>(object[key]=value,true)
});
const makeCanvas=()=>Object.assign(Object.create(DomCanvas.prototype),{width:300,height:150,getContext:()=>context()});

test('full scenery startup accepts native DOM canvases and leaves Fabric templates reusable',async t=>{
 const globals=['document','HTMLCanvasElement','HTMLImageElement','HTMLVideoElement','ImageBitmap','OffscreenCanvas','Path2D'],prior=new Map(globals.map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
 globalThis.document={createElement:tag=>{assert.equal(tag,'canvas');return makeCanvas();}};
 globalThis.HTMLCanvasElement=DomCanvas;
 for(const name of globals.slice(2))globalThis[name]=class {};
 // Image download/decode is a separate browser concern. Keep the actual
 // Material and Primitive constructors while replacing only network I/O.
 t.mock.method(Resource.prototype,'fetchImage',()=>Promise.resolve(makeCanvas()));
 t.mock.method(globalThis,'fetch',async path=>new Response(await readFile('public'+path)));
 try{
  const viewer={scene:{primitives:new PrimitiveCollection()}},collision=new CollisionWorld([]);
  viewer.scene.preUpdate={addEventListener(){}};viewer.scene.globe={};viewer.scene.screenSpaceCameraController={};
  const canvas=makeCanvas();
  new Material({fabric:{type:'UnsafeCanvasRegression',uniforms:{image:canvas},components:{diffuse:'texture(image, materialInput.st).rgb'}}});
  assert.throws(()=>Material.fromType('UnsafeCanvasRegression'),/Illegal constructor/,'reproduce the cached native canvas failure');
  for(let j=0;j<2;j++){const material=new CanvasMaterial({fabric:{type:'SafeCanvasRegression',uniforms:{image:canvas},components:{diffuse:'texture(image, materialInput.st).rgb'}}});assert.equal(material.uniforms.image,canvas);assert.equal(Material.fromType('SafeCanvasRegression').uniforms.image,Material.DefaultImageId);}
  addPlaza(viewer,collision);
  await addStreetDetails(viewer,collision,JSON.parse(await readFile('public/data/streets-osm.json')));
  addStreetscape(viewer,collision);addStorefronts(viewer,collision);addNasdaq(viewer,collision);addStudios(viewer,collision);
  assert.equal(addOneTimesWrap(viewer).length,15);
  const s47=addSixth47(viewer,collision);addFdnyTheta48(viewer,collision);addWest48(viewer,collision);addHyatt48(viewer);addHyatt49(viewer,collision);addCvs49(viewer,collision);addBarclays49(viewer,collision);addSuperdry49(viewer,collision);addSeventh49Corners(viewer,collision);addBryantPark(viewer,collision);addGracePlaza(viewer,collision);addKrispy48(viewer,collision);assert.equal(s47.carts.length,3);assert.equal(s47.flags.length,6);
  const s46=addSixth46(viewer,collision);assert(s46.posts>20);addSixth46Parking(viewer,collision);
  const districtParking=addDistrictParking(viewer,collision);assert(districtParking.vehicles.length>200);
  const carve=addCarve47(viewer,collision);assert(carve.covers.length===3&&carve.labels.length>4);
  const biltmore=addBiltmore47(viewer,collision);assert(biltmore.menus.length===5);assert(biltmore.skin.length>300);
  const mid47=addMid47(viewer,collision);assert(mid47.skin.length>1000&&mid47.scaffolds.length===1);
  const corner47=addCorner47(viewer,collision);assert(corner47.curved.length===16&&corner47.stalls.length===1);
  const tsx=addTsx47(viewer,collision);assert.equal(tsx.carts.length,3);assert(tsx.screens.length>20);tsx.setCampaign(1);
  addRenaissance48(viewer,collision);addVoco48(viewer,collision);addFive48(viewer,collision);addRockefeller48(viewer,collision);addMmsWhole(viewer,collision);addMorgan48(viewer,collision);addCitiBike48(viewer,collision);const two47=addTwo47(viewer,collision);assert(two47.barriers.length===4&&two47.gates.length===2);
  const e46=addEast46(viewer,collision);assert(e46.stalls.length===4&&e46.cranes.length===2&&e46.lifts.length===2);
  const corners=addW46Corners(viewer,collision);assert.equal(corners.birds.length,1);assert(corners.screens.length>=8);
  const parking=addWest46Parking(viewer,collision);assert(parking.vehicles.length>=8);
  const w46=addWest46(viewer,collision);assert(w46.scaffoldPosts>15&&w46.arches>8);
  const e45=addEast45(viewer,collision);assert(e45.stalls>=4&&e45.trees>=8&&e45.scaffoldPosts>10);
  const mcd=addMcdonaldsCorner(viewer,collision);assert.equal(mcd.screens.length,3);
  const front=addMarriottFront(viewer);assert(front.triangles>500&&front.screenBands===2);
  const marriott=addMarriottReference(viewer,collision);assert.equal(marriott.media.length,0);
  const shubert=addShubertAlley(viewer,collision);assert(shubert.tables>=3&&shubert.bollards.length===4);
  const w45=addWest45(viewer,collision);assert(w45.canopies>=6&&w45.blades>=4);assert(collision.loaded.has('west45-reference-frontages'));
  const vendors=addStreetVendors(viewer,collision);
  const food=addHardRockFoodRow(viewer,collision);
  addTouroMaterials(viewer,createTouroGeometry());
  const station=addRecruitingStation(viewer,collision);
  const lyric=addLyricTheatre(viewer,collision);
  const buses=addBuses(viewer,collision);
  const terminal=addPortAuthority(viewer,collision);
  const cinema=addCinemaBlock(viewer,collision);
  const attractions=addAttractions(viewer,collision);
  const south42=addSouth42Transit(viewer,collision);assert.equal(south42.portalFacades,2);assert.equal(south42.scaffolds,2);assert(collision.loaded.has('south42-subway-and-scaffolds'));
  const fiveTimes=addFiveTimes(viewer,collision);assert(fiveTimes.scaffolds>=2&&fiveTimes.billboards>=4);assert(collision.loaded.has('five-times-corner'));
  const north42=addNorth42(viewer,collision);assert.equal(north42.curvedFacets,44);assert.equal(north42.preservedStair,'mta-82');assert(collision.loaded.has('north42-reference-frontage'));
  const avenue=addAvenue(viewer,collision);assert.equal(avenue.bollards,8);assert(collision.loaded.has('avenue-fashion-corner'));
  const district=addDistrict(viewer,collision);assert(district.facades>230&&district.lamps>100);assert(collision.loaded.has('remaining-times-square-frontages'));
  const east42=addEast42(viewer,collision);assert(east42.facades>=25&&east42.nettedFacades>=3&&east42.silverBollards>20);assert(collision.loaded.has('east42-bryant-frontage'));
  const retail=addBroadwayRetail(viewer,collision);assert.equal(retail.stores,7);assert.equal(retail.kiosks,1);assert(collision.loaded.has('broadway-reference-retail'));
  assert.equal(attractions.places,2);assert.equal(attractions.sculptedHands,1);assert(collision.loaded.has('42nd-street-attractions'));
  assert.equal(cinema.places,3);assert(collision.loaded.has('42nd-street-cinemas'));
  assert(cinema.barriers>30&&cinema.posters>10);
  assert(vendors.hotDogCarts>0&&food.carts>0);
  assert.equal(station.flagWalls,2);
  assert(collision.loaded.has('recruiting-station'),'startup must reach station creation');
  assert(collision.loaded.has('lyric-theatre'),'startup must reach theatre creation');
  assert.equal(lyric.scaffolds,2);
  assert.equal(buses.stops,7);assert.equal(buses.cityBuses,5);assert.equal(buses.coaches,1);assert.equal(buses.sightseeingBuses,1);assert(collision.loaded.has('bus-stops-and-buses'));
  assert.equal(terminal.wrapFaces,2);assert.equal(terminal.canopies,3);assert(collision.loaded.has('port-authority'));
  const materials=[];for(let i=0;i<viewer.scene.primitives.length;i++){const m=viewer.scene.primitives.get(i).appearance?.material;if(m)materials.push(m);}
  const leds=[];for(let i=0;i<viewer.scene.primitives.length;i++){const p=viewer.scene.primitives.get(i);if(['Two47CampaignsV2','Two47ReferenceCampaignArtwork','Renaissance48MormonAnniversaryBillboard'].includes(p.appearance?.material?.type))leds.push(p);}
  assert.equal(leds.length,2);for(const p of leds){assert.equal(p.appearance.isTranslucent(),false);assert.equal(p.appearance.renderState.blending.enabled,false);assert.equal(p.appearance.renderState.depthMask,true);}
  const tsxCampaign=materials.find(m=>m.type==='Tsx47PanoramicCampaigns');assert(tsxCampaign);assert.equal(tsxCampaign.isTranslucent(),false);assert(tsxCampaign.uniforms.brightness<=.95);assert(tsxCampaign.uniforms.image.endsWith('tsx47-panoramic-campaigns.webp'));
  const menus=materials.filter(m=>m.type==='TimesSquareVendorMenus');
  assert(materials.some(m=>m.type==='TouroContinuousMovieBillboard'&&m.uniforms.title==='/storefronts/touro-campaign.svg'),'the wrapped film campaign must initialize');
  assert(materials.some(m=>m.type==='TouroLobbySigns'&&m.uniforms.image instanceof DomCanvas),'the Touro window lettering must initialize');
  assert.equal(Material.fromType('TouroLobbySigns').uniforms.image,Material.DefaultImageId,'cached Fabric must not clone the runtime canvas');
  assert.equal(menus.length,3,'Nasdaq, Hard Rock and Paramount vendor areas must receive menus');
  assert(menus.every(m=>m.uniforms.image instanceof DomCanvas));
  assert.equal(new Set(menus.map(m=>m.uniforms.image)).size,3,'each cart area retains its own atlas');
  assert(materials.some(m=>m.type==='RecruitingFlagGlass'&&m.uniforms.image instanceof DomCanvas),'flag wall texture must reach a scene primitive');
  assert(materials.some(m=>m.type==='RecruitingExteriorLabels'),'station signage must reach a scene primitive');
  assert(materials.some(m=>m.type==='LyricOfficialMarquee'),'theatre marquee must reach a scene primitive');
  assert(materials.some(m=>m.type==='LyricExteriorSigns'&&m.uniforms.image instanceof DomCanvas),'theatre sign atlas must reach a scene primitive');
  // Construction must also work after Cesium has cached the shared type.
  const fresh=Material.fromType('TimesSquareVendorMenus');
  assert.equal(fresh.uniforms.image,Material.DefaultImageId);
  assert.equal(Material.fromType('LyricExteriorSigns').uniforms.image,Material.DefaultImageId);
  assert.equal(Material.fromType('TimesSquareBusSigns').uniforms.image,Material.DefaultImageId);
  const busSigns=materials.find(m=>m.type==='TimesSquareBusSigns');assert(busSigns.uniforms.image instanceof DomCanvas);assert(busSigns.uniforms.image.width<=4096&&busSigns.uniforms.image.height<=4096,'bounded sign atlas');
  assert.equal(Material.fromType('PortAuthoritySigns').uniforms.image,Material.DefaultImageId);
  const terminalSigns=materials.find(m=>m.type==='PortAuthoritySigns');assert(terminalSigns.uniforms.image instanceof DomCanvas);assert.equal(terminalSigns.uniforms.image.width,2048);assert.equal(terminalSigns.uniforms.image.height,2048);
  assert.equal(Material.fromType('CinemaBlockSigns').uniforms.image,Material.DefaultImageId);
  const cinemaSigns=materials.find(m=>m.type==='CinemaBlockSigns');assert(cinemaSigns.uniforms.image instanceof DomCanvas);assert.equal(cinemaSigns.uniforms.image.width,2048);assert.equal(cinemaSigns.uniforms.image.height,2048);
  assert.equal(Material.fromType('TimesSquareAttractionsSigns').uniforms.image,Material.DefaultImageId);
  assert.equal(Material.fromType('South42SubwaySigns').uniforms.image,Material.DefaultImageId);
  assert.equal(Material.fromType('FiveTimesReferenceSigns').uniforms.image,Material.DefaultImageId);
  assert.equal(Material.fromType('North42ReferenceSigns').uniforms.image,Material.DefaultImageId);
  assert.equal(Material.fromType('AvenueRetailSigns').uniforms.image,Material.DefaultImageId);
  assert.equal(Material.fromType('DistrictStoreSigns').uniforms.image,Material.DefaultImageId);
  assert.equal(Material.fromType('East42ExteriorSigns').uniforms.image,Material.DefaultImageId);
  assert.equal(Material.fromType('BroadwayReferenceStoreSigns').uniforms.image,Material.DefaultImageId);
  assert(materials.some(m=>m.type==='AvenueFashionCollage'&&m.uniforms.image==='/billboards/avenue-fashion-collage.webp'));
  const attractionSigns=materials.find(m=>m.type==='TimesSquareAttractionsSigns');assert(attractionSigns.uniforms.image instanceof DomCanvas);assert.equal(attractionSigns.uniforms.image.width,2048);assert.equal(attractionSigns.uniforms.image.height,2048);
 }finally{
  for(const [key,descriptor]of prior){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}
 }
});

test('packed district signs stay within a bounded atlas without overlapping older storefront cells',async()=>{
 const prior=globalThis.document;globalThis.document={createElement:()=>makeCanvas()};
 try{
  const {districtAtlas}=await import('../src/district.js'),{canvas,cells}=districtAtlas(),rects=Object.entries(cells);
  assert(canvas.width<=4096&&canvas.height<=4096,'bounded GPU texture');
  for(const [name,[x,y,w,h]] of rects){assert(x>=0&&y>=0&&w>0&&h>0&&x+w<=canvas.width&&y+h<=canvas.height,name+' in atlas');}
  for(let i=0;i<rects.length;i++)for(let j=i+1;j<rects.length;j++){
   const [name,a]=rects[i],[other,b]=rects[j];assert(!(a[0]<b[0]+b[2]&&a[0]+a[2]>b[0]&&a[1]<b[1]+b[3]&&a[1]+a[3]>b[1]),name+' distinct from '+other);
  }
  for(const key of ['deli0','diner0','townhall0','parkingVertical','west440','west4414','west44v1'])assert(cells[key],key+' retained');
 }finally{if(prior===undefined)delete globalThis.document;else globalThis.document=prior;}
});
