import {clearAuthoredSignals,authoredSignalHeads} from './authored-signals.js';
import {clearTreePlacements} from './game-tree-placements.js';
import {addGameTrees} from './game-trees.js';
import {mountPlayerGuide} from './player-guide.js';
import {captureSquarePhoto,tryDrawSquarePhoto} from './square-photo.js';
import {mountShootingAim} from './shooting-aim.js';
import {createRemoteCarHitAudio} from './remote-car-hit-audio.js';
import {createPlayerCorrection} from './player-correction.js';
import {createMessageAudio} from './message-audio.js';
import {stationaryVehicles} from './vehicle-collision.js';
import {mountPoliceMap} from './police-map.js';
import {createGunshotAudio} from './gunshot-audio.js';
import {createCarHitAudio} from './car-hit-audio.js';
import {readDesignSelection} from './design-selection.js';
import {CHARACTER_DESIGNS} from './character-designs.js';
import {createCityGameplay} from './city-gameplay.js';
import {addNpcTraffic} from './npc-traffic.js';
import {focusGameCanvas} from './game-focus.js';
import {mountPhoneApps} from './phone-apps.js';
import {mountMtaApp} from './mta-app.js';
import{AVENUE_INFILL_VIEWS}from'./avenue-infill.js';
import{addGracePlaza}from'./grace-plaza.js';
import{addBryantPark}from'./bryant-park.js';
import{addSeventh49Corners}from'./seventh49-corners.js';
import{addBarclays49}from'./barclays49.js';
import{addSuperdry49}from'./superdry49.js';
import{addCitiBike48}from'./citibike48.js';
import{addHyatt49}from'./hyatt49.js';
import{addCvs49}from'./cvs49.js';
import{addMorgan48}from'./morgan48.js';
import{addMmsWhole}from'./mms-whole.js';
import{addRockefeller48}from'./rockefeller48.js';
import{addFive48}from'./five48.js';
import{addVoco48}from'./voco48.js';
import{addRenaissance48}from'./renaissance48.js';
import{addKrispy48}from'./krispy48.js';
import{addHyatt48}from'./hyatt48.js';
import{addWest48}from'./west48.js';
import{addFdnyTheta48}from'./fdny-theta48.js';
import{addSixth47}from'./sixth47.js';
import{addTsx47}from'./tsx47.js';
import {addTwo47} from './two47.js';
import {TWO47} from './two47-config.js';
import {addCorner47} from './corner47.js';
import {CORNER47} from './corner47-config.js';
import {addMid47} from './mid47.js';
import {MID47} from './mid47-config.js';
import {addBiltmore47} from './biltmore47.js';
import {BILTMORE47} from './biltmore47-config.js';
import {addCarve47,CARVE47} from './carve47.js';
import {addDistrictParking} from './district-parking.js';
import {addSixth46} from './sixth46.js';
import {SIXTH46} from './sixth46-config.js';
import {addEast46} from './east46.js';
import {EAST46} from './east46-config.js';
import {addW46Corners} from './w46-corners.js';
import {addWest46} from './west46.js';
import {WEST46} from './west46-config.js';
import {addEast45} from './east45.js';
import {EAST45} from './east45-config.js';
import {addMcdonaldsCorner,MCDONALDS} from './mcdonalds-corner.js';
import {addMarriottFront} from './marriott-front.js';
import {addMarriottReference} from './marriott-reference.js';
import {addShubertAlley} from './shubert-alley.js';
import {SHUBERT_VISIT} from './shubert-config.js';
import './style.css';
import {addWest45} from './west45.js';
import {WEST45} from './west45-config.js';
import {PARAMOUNT_VISIT} from './paramount-corner-geometry.js';
import {addStudios} from './studios.js';
import {STUDIOS,GAP_VISIT} from './studios-config.js';
import {APPEARANCES,isPoliceCharacter} from './appearances.js';
import {samplePresentation} from './player-presentation.js';
import {createAvatar} from './avatar.js';
import {canControlLocalPlayer,canShowLocalPlayer,createPlayerSession} from './player-session.js';
import {RoomClient} from './room-client.js';
import {TabSessionOwner} from './tab-session.js';
import {RemotePlayers} from './remote-players.js';
import {mountRoomPanel} from './room-panel.js';
import {mountMultiplayerDebug} from './multiplayer-debug.js';
import {canWitnessReport} from './dispatch-rules.js';
import {hasMovementPenalty} from './round-rules.js';
import {playerState} from './room-protocol.js';
import {TRANSPORT_PORTALS,transportArrival} from './transport-config.js';
import {TransportController} from './transport-controller.js';
import {mountTransportUI} from './transport-ui.js';
import {transportName,transportAccessForCharacter} from './transport-rules.js';
import {placeTransportArrival} from './player-transport.js';
import {addDistrict} from './district.js';
import {DISTRICT_PLACES} from './district-config.js';
import { Viewer, SceneTransforms, DirectionalLight, Color, Cartesian3, Cartographic, Math as CMath, EllipsoidTerrainProvider, JulianDate } from 'cesium';
import { Vector3 } from 'three';
import { NycCitySource } from './city-source.js';
import { CollisionWorld } from './collision.js';
import { Player,FIXED_STEP,movement } from './player.js';
import { ThirdPersonCamera } from './camera.js';
import { toWorld } from './coordinates.js';
import { addBillboards } from './billboards.js';
import { addPlaza } from './plaza.js';
import { addStreetDetails } from './street-details.js';
import { addStreetscape } from './streetscape.js';
import { addStorefronts } from './storefronts.js';
import {TOURO} from './touro-config.js';
import {EAST44_VISITS} from './east44-reference.js';
import {WEST44_VISITS} from './west44-reference.js';
import {EAST43_VISIT} from './west43-east-details.js';
import {WEST43_VISIT} from './west43-reference.js';
import { addCurbBollards } from './curb-bollards.js';
import { addNypdPlaza } from './nypd-plaza.js';
import { NYPD_STATION } from './nypd-plaza-config.js';
import {addPoliceVehicles} from './police-vehicles.js';
import {POLICE_VEHICLES} from './police-vehicle-config.js';
import { addNasdaq } from './nasdaq.js';
import { NASDAQ } from './nasdaq-config.js';
import { addStreetVendors } from './street-vendors.js';
import { addRecruitingStation } from './recruiting-station.js';
import { addHardRockFoodRow } from './hard-rock-food-row.js';
import { RECRUITING_STATION,HARD_ROCK_FOOD_ROW } from './recruiting-config.js';
import { addLyricTheatre } from './lyric-theatre.js';
import { LYRIC_THEATRE } from './lyric-config.js';
import { addBuses } from './buses.js';
import { BUS_STOPS } from './bus-config.js';
import { addPortAuthority } from './port-authority.js';
import { PORT_AUTHORITY } from './port-authority-config.js';
import { addCinemaBlock } from './cinema-block.js';
import { CINEMA_PLACES } from './cinema-config.js';
import { addAttractions } from './attractions.js';
import { ATTRACTION_PLACES } from './attractions-config.js';
import { addAvenue } from './avenue.js';
import { AVENUE } from './avenue-config.js';
import { addNorth42 } from './north42.js';
import { addSouth42Transit } from './south42-transit.js';
import { OPPOSITE_SUBWAY } from './south42-transit-config.js';
import { addFiveTimes } from './five-times.js';
import { FIVE_TIMES_PLACE } from './five-times-config.js';
import { addEast42 } from './east42.js';
import { EAST42_PLACES } from './east42-config.js';
import { NORTH42_PLACES } from './north42-config.js';
import { addBroadwayRetail } from './broadway-retail.js';
import { BROADWAY_RETAIL_PLACES } from './broadway-retail-config.js';
import { STOREFRONTS } from './storefront-config.js';
import { FEATURED_SUBWAY } from './streetscape-config.js';
import { entrancePoint } from './ground-cutouts.js';
import { STEPS_VIEW,STEPS_HEADING } from './plaza-layout.js';
import { TimesSquareMap } from './minimap.js';
import {mountPhoneControls} from './phone-controls.js';
import {containsPlayArea,PLAY_AREA,PLAY_AREA_PLAYER_RADIUS} from './play-area.js';
import {WitnessSelection} from './witness-selection.js';
import {InteractionController} from './interaction-controller.js';
import {interactionTarget} from './interaction-targets.js';
import {mountRoundUI} from './round-ui.js';
const $=id=>document.getElementById(id),status=$('status');
const keys=new Set(),emptyKeys=new Set(); let player,camera,collision,city,minimap,renderPlayer,roomClient,remotePlayers,transport,interaction,pointerHolding=false,reachWeight=0,reachMotion='reach',started=false,localMovementAllowed=true,reportPreparing=false,gunshotAudio=null,remoteCarHitAudio=null,aiming=false;
const development=import.meta.env.DEV||new URL(location.href).searchParams.get('dev')==='1',witness=new WitnessSelection();
function releaseInputs(){keys.clear();pointerHolding=false;dragging=false;interaction?.keyReleased();}
const playerGuide=mountPlayerGuide({getState:()=>roomClient?.view()??{},onOpen:()=>{releaseInputs();setAiming(false);document.exitPointerLock?.();}});
const runningCorrection=createPlayerCorrection({getPlayer:()=>player,getCollision:()=>collision});
let cityGameplay=null,cityTraffic=null;const phoneApps=mountPhoneApps();document.getElementById('phone').addEventListener('phone-app-open',()=>{keys.clear();pointerHolding=false;setAiming(false);});
const mtaApp=mountMtaApp({getPlayer:()=>player,getAccess:()=>currentTransportAccess(),getMap:()=>minimap,onOpen:()=>{releaseInputs();document.exitPointerLock?.();}});
const policeMap=mountPoliceMap({getAccess:currentTransportAccess,getTransport:()=>transport,getMap:()=>minimap,canTravel:()=>{const state=roomClient?.view();return !state||state.phase==='solo'||state.canMove;},onTravel:id=>transport.interact(id)});
const phone=mountPhoneControls({onOpen:()=>{phoneApps.open('phone');releaseInputs();document.exitPointerLock?.();},call911:(suspectId,activity)=>roomClient?.call911(suspectId,activity)});
const roundUI=mountRoundUI({rematch:()=>roomClient.rematch(),onOpen:()=>{releaseInputs();document.exitPointerLock?.();}});
function presentedPeople(state){return (state.players??[]).filter(p=>p.ready).flatMap(p=>{const r=remotePlayers?.players.get(p.id);return r?.presentation?[{id:p.id,characterId:p.characterId,dead:p.dead,caught:p.caught,hairColor:p.hairColor,position:r.presentation.position,interaction:r.interaction}]:[];});}
function currentTransportAccess(){return transportAccessForCharacter(roomClient?.session?.characterId??$('character-select')?.value??APPEARANCES[0].id);}
function updatePhone(state=roomClient?.view()??{phase:'solo'}){
 const characterId=roomClient?.session?.characterId??$('character-select')?.value??APPEARANCES[0].id,time=roomClient?.serverNow()??Date.now();
 const calls=isPoliceCharacter(characterId)?(state.dispatchCalls??[]).filter(call=>call.expiresAt>time):[];
 const observation=state.yourObservation?.expiresAt>time?state.yourObservation:null;
 const suspect=!reportPreparing&&observation?{playerId:observation.suspectId,description:observation.description,activity:observation.activity,locked:true,expiresAt:observation.expiresAt}:witness.get(time);
 phoneApps.setOfficerMode(isPoliceCharacter(characterId));
 phone.update({...state,characterId,suspect,selecting:reportPreparing,dispatchCalls:calls,serverTime:time,canMove:state.canMove&&!transport?.busy&&!interaction?.busy&&!reportPreparing});
 roundUI.update(state,time);playerGuide.update(state);
 minimap?.setDispatchCalls(calls);mtaApp.update();policeMap.update();
 const access=$('transport-access');if(access)access.textContent=transportName(currentTransportAccess());
}
function updateWitness(state=roomClient?.view()??{phase:'solo'}){
 const inRound=started&&state.phase==='connected'&&state.matchPhase==='playing'&&!state.preparing&&!document.hidden&&!transport?.busy&&!interaction?.busy,enabled=inRound&&canWitnessReport(state);
 witness.update({context:`${state.roomCode??''}/${state.matchId??''}/${state.yourId??''}`,enabled,time:roomClient?.serverNow()??Date.now(),selfId:state.yourId,position:player?.position,cameraPosition:camera?.position,cameraDirection:camera?.direction,people:presentedPeople(state),collision});
 $('report-reticle').hidden=!inRound||state.yourRound?.role==='THIEF';$('report-prompt').hidden=!enabled||!witness.current;
 const description=witness.current?.description??'';if($('report-description').textContent!==description)$('report-description').textContent=description;
}
async function reviewPerson(){
 if(reportPreparing)return;
 updateWitness();const person=witness.capture(roomClient?.serverNow()??Date.now());if(!person)return;
 updatePhone();phone.reviewSuspect();reportPreparing=true;updatePhone();
 try{await roomClient.observeSuspect(person.playerId,person.activity);}
 catch(error){witness.clear();status.hidden=false;status.textContent=error.message;}
 finally{reportPreparing=false;updatePhone();phone.reviewSuspect();}
}
$('report-open').addEventListener('click',reviewPerson);
function setAiming(value){aiming=!!value;camera?.setAim(aiming);document.body.classList.toggle('weapon-aiming',aiming);}
function fireWeapon(role){
 const state=roomClient?.view();if(!state?.canMove||state.yourRound?.role!==role||interaction?.busy||transport?.busy)return;
 const target=interactionTarget({state,player,people:presentedPeople(state),camera,collision,time:roomClient.serverNow(),shoot:true});
 roomClient.beginInteraction('shoot',target?.targetId??null).catch(transportError);
}
document.getElementById('officer-shoot').addEventListener('click',event=>{fireWeapon('POLICE');event.currentTarget.blur();});

const viewer=new Viewer('world',{
  animation:false,timeline:false,baseLayerPicker:false,geocoder:false,homeButton:false,sceneModePicker:false,
  navigationHelpButton:false,fullscreenButton:false,selectionIndicator:false,infoBox:false,baseLayer:false,
  terrainProvider:new EllipsoidTerrainProvider(),shadows:false,shouldAnimate:true,msaaSamples:2
});
phoneApps.setCapture(async()=>{viewer.render();const photo=captureSquarePhoto(viewer.canvas);try{const rewarded=await cityGameplay?.capturePhoto();return {url:photo,status:rewarded?`Photo request complete · +$${rewarded.reward}`:'Photo captured'};}catch(error){return {url:photo,status:'Photo captured · '+error.message};}});
viewer.scene.renderError.addEventListener((scene,error)=>fail(error));
viewer.resolutionScale=Math.min(1,1.5/(window.devicePixelRatio||1));
viewer.scene.screenSpaceCameraController.enableInputs=false;
viewer.scene.globe.baseColor=Color.fromCssColorString('#222935');
viewer.scene.globe.enableLighting=false;viewer.scene.globe.depthTestAgainstTerrain=true;
viewer.scene.backgroundColor=Color.fromCssColorString('#040710');
viewer.scene.fog.enabled=true;viewer.scene.fog.density=.00025;
// Fixed local midnight: hiding the sun does not disable its default light.
viewer.clock.currentTime=JulianDate.fromIso8601('2026-06-02T04:00:00Z');
viewer.scene.light=new DirectionalLight({direction:new Cartesian3(-.3,-.4,-1),color:Color.fromCssColorString('#9bafd0'),intensity:.12});
viewer.clock.shouldAnimate=false;viewer.clock.multiplier=0;
viewer.scene.postProcessStages.fxaa.enabled=true;
viewer.scene.skyAtmosphere.show=false;
viewer.scene.sun.show=false;viewer.scene.moon.show=false;
viewer.scene.postProcessStages.bloom.enabled=false;
// No additive bloom: keep the view crisp without a white veil.
// Ambient occlusion remains off; the billboard atlas is batched.
viewer.scene.postProcessStages.ambientOcclusion.enabled=false;
viewer.camera.setView({destination:Cartesian3.fromDegrees(-73.9855,40.7580,3),orientation:{heading:.5,pitch:0,roll:0}});
const canvas=viewer.scene.canvas;canvas.tabIndex=0;
const shootingAim=mountShootingAim({onToggle:()=>{if(aiming||roomClient?.view().canMove)setAiming(!aiming);},project:position=>{const point=SceneTransforms.worldToWindowCoordinates(viewer.scene,toWorld(position.clone().add(new Vector3(0,0,1.35))));if(!point)return null;const rect=canvas.getBoundingClientRect();return {x:point.x+rect.left,y:point.y+rect.top};}});
let dragging=false,dragDistance=0,dragX=0,dragY=0;
canvas.addEventListener('wheel',event=>{event.preventDefault();camera?.zoom(event.deltaY);},{passive:false});
canvas.addEventListener('click',async()=>{
  if(!started)return;
  if(dragDistance>2){dragDistance=0;return;}
  try {await canvas.requestPointerLock();}catch{status.hidden=false;status.textContent='Mouse capture unavailable. Hold the left mouse button and drag to orbit.';}
});
// Cesium cancels pointerdown's default action, which suppresses compatibility
// mousedown/mousemove events. Use pointer events for both camera modes.
canvas.addEventListener('pointerdown',event=>{if(event.button!==0)return;focusGameCanvas(canvas);dragging=true;dragDistance=0;dragX=event.clientX;dragY=event.clientY;});
window.addEventListener('pointerup',()=>dragging=false);
window.addEventListener('pointercancel',()=>dragging=false);
window.addEventListener('pointermove',event=>{
 if(!camera)return;
 if(document.pointerLockElement===canvas){camera.orbit(event.movementX,event.movementY);return;}
 if(!dragging)return;
 const dx=event.clientX-dragX,dy=event.clientY-dragY;dragDistance+=Math.hypot(dx,dy);camera.orbit(dx,dy);dragX=event.clientX;dragY=event.clientY;
});
window.addEventListener('keydown',event=>{if(document.body.classList.contains('home-open')||playerGuide.isOpen)return;if(event.metaKey||event.ctrlKey||event.altKey)return;if(event.target.closest?.('select,input,textarea,button'))return;if(event.code==='Escape'){setAiming(false);}if(event.code==='KeyA'&&['POLICE','THIEF'].includes(roomClient?.view().yourRound?.role)){event.preventDefault();if(!event.repeat&&(aiming||roomClient.view().canMove))setAiming(!aiming);return;}if(event.code==='KeyR'){event.preventDefault();if(!event.repeat)reviewPerson();return;}if(event.code==='KeyF'){event.preventDefault();if(!event.repeat)fireWeapon('POLICE');return;}if(event.code==='KeyE'){event.preventDefault();keys.add('KeyE');if(roomClient?.view().yourRound?.role==='THIEF'){if(!event.repeat){if(!aiming&&!interaction?.candidate&&transport?.nearby?.allowed)transport.interact().catch(transportError);else fireWeapon('THIEF');}return;}if(!event.repeat&&!interaction?.press())transport?.interact().catch(transportError);return;}if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD','ShiftLeft','ShiftRight','Space'].includes(event.code)){event.preventDefault();keys.add(event.code);}});
window.addEventListener('keyup',event=>{keys.delete(event.code);if(event.code==='KeyE')interaction?.keyReleased();});
window.addEventListener('blur',()=>{releaseInputs();setAiming(false);});
document.addEventListener('visibilitychange',()=>{releaseInputs();if(document.hidden)setAiming(false);});
document.addEventListener('pointerlockchange',()=>{releaseInputs();if(document.pointerLockElement!==canvas)setAiming(false);if(started){status.hidden=false;status.textContent=document.pointerLockElement===canvas?'Arrow keys to walk · Shift to run · Esc to release':'Arrow keys to walk · Click the scene to capture the mouse, or drag to orbit.';}});
$('reset').addEventListener('click',()=>reset());
$('red-steps').addEventListener('click',()=>reset(true));
let oppositeSubway=true;const subwayButton=document.createElement('button');subwayButton.id='visit-subway';subwayButton.textContent='Visit opposite subway';$('red-steps').after(subwayButton);subwayButton.addEventListener('click',()=>{reset(oppositeSubway?{shop:OPPOSITE_SUBWAY}:'subway');oppositeSubway=!oppositeSubway;subwayButton.textContent=oppositeSubway?'Visit opposite subway':'Visit subway stairs';});
let shopIndex=0;const shopButton=document.createElement('button');shopButton.id='visit-shops';shopButton.textContent='Visit shops';subwayButton.after(shopButton);shopButton.addEventListener('click',()=>{reset({shop:STOREFRONTS[shopIndex++%STOREFRONTS.length]});shopButton.textContent='Next shop';});
let showHardRockCarts=false;
const hardRockButton=document.createElement('button');hardRockButton.id='visit-hard-rock';hardRockButton.textContent='Hard Rock food carts';shopButton.after(hardRockButton);hardRockButton.addEventListener('click',()=>{reset({shop:showHardRockCarts?STOREFRONTS.find(s=>s.id==='hard-rock'):HARD_ROCK_FOOD_ROW});showHardRockCarts=!showHardRockCarts;hardRockButton.textContent=showHardRockCarts?'Visit Hard Rock entrance':'Hard Rock food carts';});
const nypdButton=document.createElement('button');nypdButton.id='visit-nypd';nypdButton.textContent='Visit NYPD plaza';hardRockButton.after(nypdButton);nypdButton.addEventListener('click',()=>reset({shop:NYPD_STATION}));
const touroButton=document.createElement('button');touroButton.id='visit-touro';touroButton.textContent='Visit Touro corner';nypdButton.after(touroButton);touroButton.addEventListener('click',()=>reset({shop:TOURO}));
let policeCarIndex=0;const policeCarButton=document.createElement('button');policeCarButton.id='visit-police-cars';policeCarButton.textContent='Visit parked NYPD cars';nypdButton.after(policeCarButton);const policeCarVisits=[...POLICE_VEHICLES.filter(c=>c.station),...POLICE_VEHICLES.filter(c=>!c.station)];policeCarButton.addEventListener('click',()=>{const car=policeCarVisits[policeCarIndex++%policeCarVisits.length];reset({shop:{...car,normal:car.right,name:car.name,address:car.road}});});
const nasdaqButton=document.createElement('button');nasdaqButton.id='visit-nasdaq';nasdaqButton.textContent='Visit Nasdaq';nypdButton.after(nasdaqButton);nasdaqButton.addEventListener('click',()=>reset({shop:NASDAQ}));
const recruitingButton=document.createElement('button');recruitingButton.id='visit-recruiting';recruitingButton.textContent='Visit recruiting station';nasdaqButton.after(recruitingButton);recruitingButton.addEventListener('click',()=>reset({shop:RECRUITING_STATION}));
const lyricButton=document.createElement('button');lyricButton.id='visit-lyric';lyricButton.textContent='Visit Lyric Theatre';recruitingButton.after(lyricButton);lyricButton.addEventListener('click',()=>reset({shop:LYRIC_THEATRE}));
let busStopIndex=0;const busButton=document.createElement('button');busButton.id='visit-buses';busButton.textContent='Visit bus stops (1/7)';lyricButton.after(busButton);busButton.addEventListener('click',()=>{reset({shop:BUS_STOPS[busStopIndex]});busStopIndex=(busStopIndex+1)%BUS_STOPS.length;busButton.textContent=`Next bus stop (${busStopIndex+1}/${BUS_STOPS.length})`;});
const terminalButton=document.createElement('button');terminalButton.id='visit-terminal';terminalButton.textContent='Visit Port Authority';busButton.after(terminalButton);terminalButton.addEventListener('click',()=>reset({shop:PORT_AUTHORITY}));
let cinemaIndex=0;const cinemaButton=document.createElement('button');cinemaButton.id='visit-cinemas';cinemaButton.textContent='Visit 42nd Street';terminalButton.after(cinemaButton);cinemaButton.addEventListener('click',()=>{reset({shop:CINEMA_PLACES[cinemaIndex]});cinemaIndex=(cinemaIndex+1)%CINEMA_PLACES.length;cinemaButton.textContent=`Next: ${CINEMA_PLACES[cinemaIndex].shortName}`;});
let attractionIndex=0;const attractionButton=document.createElement('button');attractionButton.id='visit-attractions';attractionButton.textContent='Visit Dave & Buster’s';cinemaButton.after(attractionButton);attractionButton.addEventListener('click',()=>{reset({shop:ATTRACTION_PLACES[attractionIndex]});attractionIndex=(attractionIndex+1)%ATTRACTION_PLACES.length;attractionButton.textContent=`Visit ${ATTRACTION_PLACES[attractionIndex].shortName}`;});
const retailPlaces=[FIVE_TIMES_PLACE,...NORTH42_PLACES,...BROADWAY_RETAIL_PLACES,AVENUE];let retailIndex=0;const retailButton=document.createElement('button');retailButton.id='visit-new-retail';retailButton.textContent='Visit new stores';attractionButton.after(retailButton);retailButton.addEventListener('click',()=>{reset({shop:retailPlaces[retailIndex]});retailIndex=(retailIndex+1)%retailPlaces.length;retailButton.textContent=`Next: ${retailPlaces[retailIndex].name}`;});
let east42Index=0;const east42Button=document.createElement('button');east42Button.id='visit-bryant';east42Button.textContent='42nd St → Bryant Park';retailButton.after(east42Button);east42Button.addEventListener('click',()=>{reset({shop:EAST42_PLACES[east42Index]});east42Index=(east42Index+1)%EAST42_PLACES.length;east42Button.textContent=`Next: ${EAST42_PLACES[east42Index].shortName}`;});
let districtIndex=0;const districtButton=document.createElement('button');districtButton.id='visit-district';districtButton.textContent='Explore updated blocks';east42Button.after(districtButton);districtButton.addEventListener('click',()=>{reset({shop:DISTRICT_PLACES[districtIndex]});districtIndex=(districtIndex+1)%DISTRICT_PLACES.length;districtButton.textContent=`Next: ${DISTRICT_PLACES[districtIndex].shortName}`;});
const west43Button=document.createElement('button');west43Button.id='visit-west43';west43Button.textContent='Visit West 43rd Street';districtButton.after(west43Button);west43Button.addEventListener('click',()=>reset({shop:WEST43_VISIT}));
const east43Button=document.createElement('button');east43Button.id='visit-east43';east43Button.textContent='43rd St · 127A → Sixth Ave';west43Button.after(east43Button);east43Button.addEventListener('click',()=>reset({shop:EAST43_VISIT}));
let west44Index=0;const west44Button=document.createElement('button');west44Button.id='visit-west44';west44Button.textContent='44th St · 267 → Times Square';east43Button.after(west44Button);west44Button.addEventListener('click',()=>{reset({shop:WEST44_VISITS[west44Index]});west44Index=(west44Index+1)%WEST44_VISITS.length;});
let studioIndex=0;const studiosButton=document.createElement('button');studiosButton.id='visit-studios';studiosButton.textContent='1506 Broadway · Studios & Old Navy / GAP';west44Button.after(studiosButton);studiosButton.addEventListener('click',()=>{reset({shop:STUDIOS.visits[studioIndex]});studioIndex=(studioIndex+1)%STUDIOS.visits.length;});
const gapButton=document.createElement('button');gapButton.id='visit-gap';gapButton.textContent='GAP · displays, planters & boards';studiosButton.after(gapButton);gapButton.addEventListener('click',()=>reset({shop:GAP_VISIT}));
const paramountButton=document.createElement('button');paramountButton.id='visit-paramount-corner';paramountButton.textContent='Paramount · W45 corner / NYPD vehicle 6';gapButton.after(paramountButton);paramountButton.addEventListener('click',()=>reset({shop:PARAMOUNT_VISIT}));
let east44Index=0;const east44Button=document.createElement('button');east44Button.id='visit-east44';east44Button.textContent='44th St · shops, trucks & Sixth Ave';west44Button.after(east44Button);east44Button.addEventListener('click',()=>{reset({shop:EAST44_VISITS[east44Index]});east44Index=(east44Index+1)%EAST44_VISITS.length;});
let west45Index=0;const west45Button=document.createElement('button');west45Button.id='visit-west45';west45Button.textContent='45th St · Eighth Ave → Times Square';paramountButton.after(west45Button);west45Button.addEventListener('click',()=>{reset({shop:WEST45.visits[west45Index]});west45Index=(west45Index+1)%WEST45.visits.length;});
const shubertButton=document.createElement('button');shubertButton.id='visit-shubert';shubertButton.textContent='Shubert Alley · Junior’s & theatre';west45Button.after(shubertButton);shubertButton.addEventListener('click',()=>reset({shop:SHUBERT_VISIT}));
let theatreCornerIndex=0;const theatreCornerButton=document.createElement('button');theatreCornerButton.id='visit-theatre-corner';theatreCornerButton.textContent='45th St · Minskoff & Marriott displays';paramountButton.after(theatreCornerButton);theatreCornerButton.addEventListener('click',()=>{const sign=theatreCornerIndex++%2===0?1:-1,n=WEST45.north;reset({shop:{name:sign>0?'Marriott reference displays':'Minskoff stone wall & Lion King blade',address:'West 45th Street near Broadway',normal:n.map(v=>-sign*v),view:{position:[WEST45.origin[0]+WEST45.east[0]*225+n[0]*sign,WEST45.origin[1]+WEST45.east[1]*225+n[1]*sign,.17],yaw:Math.atan2(n[0]*sign,n[1]*sign),pitch:-.28}}});});
const marriottFrontButton=document.createElement('button');marriottFrontButton.id='visit-marriott-front';marriottFrontButton.textContent='Marriott · Broadway front / Swatch & Levi’s';theatreCornerButton.after(marriottFrontButton);marriottFrontButton.addEventListener('click',()=>reset({shop:{name:'Marriott Marquis · Broadway front',address:'1535 Broadway / West 45th Street',normal:WEST45.east,view:{position:[WEST45.origin[0]+WEST45.east[0]*267+WEST45.north[0]*26,WEST45.origin[1]+WEST45.east[1]*267+WEST45.north[1]*26,.17],yaw:Math.atan2(-WEST45.east[0],-WEST45.east[1]),pitch:-.20}}}));
const mcdButton=document.createElement('button');mcdButton.id='visit-mcdonalds';mcdButton.textContent='McDonald’s · glass corner / De Cecco screen';marriottFrontButton.after(mcdButton);mcdButton.addEventListener('click',()=>reset({shop:MCDONALDS.visit}));
const eagleCornerButton=document.createElement('button');eagleCornerButton.id='visit-eagle-tmobile';eagleCornerButton.textContent='American Eagle · reference design';mcdButton.after(eagleCornerButton);eagleCornerButton.addEventListener('click',()=>reset({shop:{name:'American Eagle · two-tier fashion screens & projecting bird',address:'46th Street / Broadway',normal:WEST46.east,view:{position:[27,101,.17],yaw:Math.atan2(-25,3),pitch:-.42}}}));
let citiBike48Scene;const citiBike48Button=document.createElement('button');citiBike48Button.id='visit-citibike48';citiBike48Button.textContent='W48 / Broadway · flower pots & Citi Bike';mcdButton.after(citiBike48Button);citiBike48Button.addEventListener('click',()=>{if(citiBike48Scene)reset({shop:{name:'Krispy Kreme plaza · flower pots & Citi Bike',normal:TWO47.north,view:citiBike48Scene.view}});});
let morgan48Scene;const morgan48Button=document.createElement('button');morgan48Button.id='visit-morgan48';morgan48Button.textContent='W48 / Broadway · Morgan Stanley, plants & kiosk';mcdButton.after(morgan48Button);morgan48Button.addEventListener('click',()=>{if(morgan48Scene)reset({shop:{name:'Morgan Stanley / Fossil · W48 corner',normal:TWO47.north,view:morgan48Scene.view}});});
let mmsWholeScene;const mmsWholeButton=document.createElement('button');mmsWholeButton.id='visit-mms-whole';mmsWholeButton.textContent='W48 / Seventh · M&M’s whole building';mcdButton.after(mmsWholeButton);mmsWholeButton.addEventListener('click',()=>{if(mmsWholeScene)reset({shop:{name:'M&M’s · full building and corner',normal:TWO47.north,view:mmsWholeScene.view}});});
let rockefeller48Scene;const rockefeller48Button=document.createElement('button');rockefeller48Button.id='visit-rockefeller48';rockefeller48Button.textContent='W48 / Sixth · 1221 Avenue of the Americas';mcdButton.after(rockefeller48Button);rockefeller48Button.addEventListener('click',()=>{if(rockefeller48Scene)reset({shop:{name:'1221 Avenue of the Americas · plaza',normal:TWO47.north,view:rockefeller48Scene.view}});});
let five48Scene;const five48Button=document.createElement('button');five48Button.id='visit-five48';five48Button.textContent='W48 / Seventh · FIVE corner & food carts';mcdButton.after(five48Button);five48Button.addEventListener('click',()=>{if(five48Scene)reset({shop:{name:'W48 / Seventh · brick corner',normal:TWO47.north,view:five48Scene.view}});});
let voco48Scene;const voco48Button=document.createElement('button');voco48Button.id='visit-voco48';voco48Button.textContent='W48 / Seventh · VOCO & Daily Green';mcdButton.after(voco48Button);voco48Button.addEventListener('click',()=>{if(voco48Scene)reset({shop:{name:'VOCO & Daily Green · reference corner',normal:TWO47.north,view:voco48Scene.view}});});
let renaissance48Scene;const renaissance48Button=document.createElement('button');renaissance48Button.id='visit-renaissance48';renaissance48Button.textContent='W48 · Renaissance, Olive Garden & tickets';mcdButton.after(renaissance48Button);renaissance48Button.addEventListener('click',()=>{if(renaissance48Scene)reset({shop:{name:'Renaissance · photographed sides',normal:TWO47.north,view:renaissance48Scene.view}});});
let hyatt48Scene;const hyatt48Button=document.createElement('button');hyatt48Button.id='visit-hyatt48';hyatt48Button.textContent='W48 / Broadway · Hyatt & doughnut screen';mcdButton.after(hyatt48Button);hyatt48Button.addEventListener('click',()=>{if(hyatt48Scene)reset({shop:{name:'Hyatt Regency · Broadway corner',normal:TWO47.north,view:hyatt48Scene.view}});});
let west48Scene;for(const[id,title,key]of[['visit-west48','W48 · Ritz, Hurley’s, Walter Kerr & Hyatt','view'],['visit-time49','W49 · The Time New York','timeView']]){const b=document.createElement('button');b.id=id;b.textContent=title;mcdButton.after(b);b.addEventListener('click',()=>{if(west48Scene)reset({shop:{name:title,normal:TWO47.north,view:west48Scene[key]}});});}
let fdnyTheta48Scene;const fdnyTheta48Button=document.createElement('button');fdnyTheta48Button.id='visit-fdny-theta48';fdnyTheta48Button.textContent='W48 / Eighth · FDNY 54 & Hotel Theta';mcdButton.after(fdnyTheta48Button);fdnyTheta48Button.addEventListener('click',()=>{if(fdnyTheta48Scene)reset({shop:{name:'W48 / Eighth · FDNY & Hotel Theta',normal:TWO47.east,view:fdnyTheta48Scene.view}});});
let sixth47Scene;const sixth47Button=document.createElement('button');sixth47Button.id='visit-sixth47';sixth47Button.textContent='W47 / Sixth · towers, blue pavilion & vendors';mcdButton.after(sixth47Button);sixth47Button.addEventListener('click',()=>{if(sixth47Scene)reset({shop:{name:'W47 / Sixth Avenue · reference corners',normal:TWO47.east,view:sixth47Scene.view}});});
let tsx47Scene,tsx47Campaign=0;const tsx47Button=document.createElement('button');tsx47Button.id='visit-tsx47';tsx47Button.textContent='199 W47 · TSX / Tempo / Palace';mcdButton.after(tsx47Button);tsx47Button.addEventListener('click',()=>{if(tsx47Scene)reset({shop:{name:'199 W47 · TSX / Tempo',normal:TWO47.north,view:tsx47Scene.view}});});const tsx47AdButton=document.createElement('button');tsx47AdButton.textContent='TSX screen · Refreshers';tsx47Button.after(tsx47AdButton);tsx47AdButton.addEventListener('click',()=>{tsx47Campaign=1-tsx47Campaign;tsx47Scene?.setCampaign(tsx47Campaign);tsx47AdButton.textContent=tsx47Campaign?'TSX screen · Genshin':'TSX screen · Refreshers';});
const two47Button=document.createElement('button');two47Button.id='visit-two47';two47Button.textContent='W47 · Coke screens & plaza entrance';mcdButton.after(two47Button);two47Button.addEventListener('click',()=>{const d=TWO47;reset({shop:{name:'Two Times Square · reference view',normal:d.north,view:{position:[d.origin[0]+d.east[0]*230-d.north[0]*.2,d.origin[1]+d.east[1]*230-d.north[1]*.2,.17],yaw:Math.atan2(d.east[0]+d.north[0],d.east[1]+d.north[1]),pitch:-.35}}});});
let corner47Index=0;const corner47Button=document.createElement('button');corner47Button.id='visit-corner47';corner47Button.textContent='W47 / Broadway · blue screens & W';mcdButton.after(corner47Button);corner47Button.addEventListener('click',()=>{const d=CORNER47,side=corner47Index++%2?1:-1;reset({shop:{name:side>0?'Morgan Stanley · blue screens':'Dos Caminos / W entrance',normal:d.north,view:{position:[d.origin[0]+d.east[0]*212,d.origin[1]+d.east[1]*212,.17],yaw:Math.atan2(d.north[0]*side,d.north[1]*side),pitch:-.38}}});});
const mid47Button=document.createElement('button');mid47Button.id='visit-mid47';mid47Button.textContent='W47 · Lena Horne, Barrymore & restaurants';mcdButton.after(mid47Button);mid47Button.addEventListener('click',()=>{const e=MID47.east,n=MID47.north,o=MID47.origin;reset({shop:{name:'W47 · Lena Horne / Brooklyn Chop House',normal:n,view:{position:[o[0]+e[0]*115,o[1]+e[1]*115,.17],yaw:Math.atan2(-n[0],-n[1]),pitch:-.3}}});});
const biltmoreButton=document.createElement('button');biltmoreButton.id='visit-biltmore47';biltmoreButton.textContent='W47 · Biltmore, signal & food kiosk';mcdButton.after(biltmoreButton);biltmoreButton.addEventListener('click',()=>reset({shop:BILTMORE47.visit}));
const carveButton=document.createElement('button');carveButton.id='visit-carve47';carveButton.textContent='298 W 47th · small shops';mcdButton.after(carveButton);carveButton.addEventListener('click',()=>reset({shop:CARVE47.visit}));
let sceneryWarning='';
let sixth46Index=0;const sixth46Button=document.createElement('button');sixth46Button.id='visit-sixth46';sixth46Button.textContent='Sixth / W46 · 1177, NAYA & reference vehicles';mcdButton.after(sixth46Button);sixth46Button.addEventListener('click',()=>{reset({shop:SIXTH46.visits[sixth46Index]});sixth46Index=(sixth46Index+1)%SIXTH46.visits.length;});
let east46Index=0;const east46Button=document.createElement('button');east46Button.id='visit-express-east46';east46Button.textContent='Express · gift shops, stalls & cranes';mcdButton.after(east46Button);east46Button.addEventListener('click',()=>{reset({shop:EAST46.visits[east46Index]});east46Index=(east46Index+1)%EAST46.visits.length;});
let west46Index=0;const west46Button=document.createElement('button');west46Button.id='visit-west46';west46Button.textContent='46th St · Eighth Ave → Broadway';mcdButton.after(west46Button);west46Button.addEventListener('click',()=>{reset({shop:WEST46.visits[west46Index]});west46Index=(west46Index+1)%WEST46.visits.length;});
let east45Index=0;const east45Button=document.createElement('button');east45Button.id='visit-east45';east45Button.textContent='45th St · Broadway → Sixth Ave';mcdButton.after(east45Button);east45Button.addEventListener('click',()=>{reset({shop:EAST45.visits[east45Index]});east45Index=(east45Index+1)%EAST45.visits.length;});
const riseButton=document.createElement('button');riseButton.id='visit-riseny';riseButton.textContent='RiseNY · Liberty hand & pharmacy';east45Button.after(riseButton);riseButton.addEventListener('click',()=>reset({shop:EAST45.visits[0]}));const pubButton=document.createElement('button');pubButton.id='visit-connollys';pubButton.textContent='Connolly’s & The Perfect Pint';riseButton.after(pubButton);pubButton.addEventListener('click',()=>reset({shop:EAST45.visits.find(v=>v.name.includes('Connolly'))}));
const placesPanel=document.createElement('details');placesPanel.id='places';const placesSummary=document.createElement('summary');placesSummary.textContent='Visit a landmark';placesPanel.append(placesSummary);const placesList=document.createElement('div');placesList.className='places-list';for(const button of document.querySelectorAll('button[id^="visit-"]'))placesList.append(button);placesPanel.append(placesList);document.body.append(placesPanel);placesList.addEventListener('click',event=>{if(event.target.closest('button'))placesPanel.open=false;});
async function reset(steps=false,{serverSpawn=false}={}){
  if(transport?.busy&&!serverSpawn){status.hidden=false;status.textContent='Finish travelling before resetting.';return;}
  if(roomClient?.session&&!serverSpawn){if(!steps&&roomClient.view().canMove)return roomClient.resetSpawn();status.hidden=false;status.textContent='Start the match to reset your spawn. Landmark visits are available after leaving the room.';return;}
  if(!player)return;
  runningCorrection.clear();setAiming(false);
  const shop=typeof steps==='object'?steps.shop:null;
  const target=new Vector3(0,0,.05);
  if(shop){if(shop.view)target.fromArray(shop.view.position);else target.fromArray(shop.center).addScaledVector(new Vector3(...shop.normal),6).setZ(.17);}
  else if(steps==='subway')target.copy(entrancePoint(FEATURED_SUBWAY,0,-8,.17));else if(steps)target.copy(STEPS_VIEW);
  if(!containsPlayArea(target,PLAY_AREA_PLAYER_RADIUS)){status.hidden=false;status.textContent=`Outside the playable area · ${PLAY_AREA.label}`;return;}
  if(!serverSpawn)transport?.reset();started=false;keys.clear();player.reset();camera.reset();player.position.copy(target);
  if(shop){camera.yaw=Math.atan2(-shop.normal[0],-shop.normal[1]);camera.pitch=.04;if(shop.view){camera.yaw=shop.view.yaw;camera.pitch=shop.view.pitch;}}
  else if(steps==='subway'){camera.yaw=Math.atan2(FEATURED_SUBWAY.direction[0],FEATURED_SUBWAY.direction[1]);camera.pitch=.16;}else if(steps){camera.yaw=STEPS_HEADING-.15;camera.pitch=-.03;}player.heading=camera.yaw;minimap?.update(player);status.hidden=false;status.textContent='Preparing Times Square collision…';
  try {await collision.stream(player.position);
    // A safe spawn must be in an open street/plaza, rather than inside a roof footprint.
    const blocked=p=>{const hit=collision.ray(p.clone().setZ(700),new Vector3(0,0,-1),701,true);return hit&&hit.point.z>.45;};
    if(!serverSpawn&&blocked(player.position)){
      const requested=player.position.clone();let safe=null;for(let r=2;r<=40&&!safe;r+=2)for(let i=0;i<32;i++){const p=requested.clone().add(new Vector3(Math.cos(i*Math.PI/16)*r,Math.sin(i*Math.PI/16)*r,0));if(containsPlayArea(p,PLAY_AREA_PLAYER_RADIUS)&&!blocked(p)){safe=p;break;}}
      if(!safe)throw new Error('No safe plaza spawn found in loaded geometry');player.position.copy(safe);
    }
    player.snapPresentation();renderPlayer=samplePresentation(player,1);camera.update(renderPlayer);status.textContent='Rendering real Times Square buildings…';
    await city.waitUntilVisible(viewer);
    started=true;status.textContent=shop?`Ready · ${shop.name}${shop.address?' · '+shop.address:''}`:'Ready · Arrow keys / WASD to walk · Space to jump · Click the scene for camera control';if(sceneryWarning)status.textContent+=' · '+sceneryWarning;
  }catch(error){fail(error);}
}
function transportError(error){status.hidden=false;status.textContent=error.message;}
async function placeTransportPlayer(state){
 // Prepare streamed destination collision before moving. Keep the local
 // orbit/zoom settings and snap the boom only, rather than networking cameras.
 started=false;keys.clear();runningCorrection.clear();setAiming(false);
 try{
  await collisionStreamTask?.catch(()=>{});
  await placeTransportArrival({player,camera,collision,state,onPlaced(){renderPlayer=samplePresentation(player,1);minimap.update(player);}});
  await city.waitUntilVisible(viewer);started=true;
 }catch(error){started=true;throw error;}
}
function fail(error){document.body.dataset.startupError='true';document.body.dataset.startupErrorMessage=error.message;document.getElementById('w48-scene-check')?.append(' · Startup error: '+error.message);started=false;status.hidden=false;status.textContent=`Unable to start: ${error.message}. Reload to retry.`;console.error(error);}
try {
  city=new NycCitySource();const manifest=await city.load(viewer);
  collision=new CollisionWorld(manifest.files);collision.getVehicles=()=>[...(cityTraffic?.simulation.cars??[]),...stationaryVehicles];player=new Player(collision);camera=new ThirdPersonCamera(viewer,collision);
  // Start the avatar and nearby city downloads before constructing distant scenery.
  const localAvatar=createAvatar(viewer,()=>renderPlayer??player,{show:()=>canShowLocalPlayer(camera)});
  window.addEventListener('swipe-design',e=>localAvatar.setDesign(e.detail));
  const avatarReady=localAvatar.ready();avatarReady.catch(()=>{});
  const entity=localAvatar.entity,characterLighting=localAvatar.lighting;
  camera.update(player);
  const yieldScenery=()=>new Promise(resolve=>setTimeout(resolve,0));
  await yieldScenery();
  minimap=new TimesSquareMap(city.streets);
  // Mount the requested W48 scenes before unrelated district modules can fail.
  const w48Check=document.createElement('output');w48Check.id='w48-scene-check';w48Check.textContent='Loading Morgan Stanley / Fossil…';document.body.append(w48Check);
  clearTreePlacements();clearAuthoredSignals();
  morgan48Scene=addMorgan48(viewer,collision);
  w48Check.textContent='Morgan / Fossil loaded · loading Citi Bike…';
  citiBike48Scene=addCitiBike48(viewer,collision);
  w48Check.textContent='W48 loaded · Morgan/Fossil + '+citiBike48Scene.pots.length+' flower pots · '+citiBike48Scene.docks.length+' bike docks';
  await yieldScenery();
  const plaza=addPlaza(viewer,collision);
  const streetDetails=await addStreetDetails(viewer,collision,city.streets,{getTime:()=>roomClient?.serverNow()??Date.now()});
  const npcTraffic=cityTraffic=addNpcTraffic(viewer,city.streets,streetDetails,()=>[player,...(roomClient?.view().players??[]).filter(p=>p.id!==roomClient?.session?.yourId&&p.ready).map(p=>({position:{x:p.state.position[0],y:p.state.position[1],z:p.state.position[2]}}))]);
  const streetscape=addStreetscape(viewer,collision);
  const storefronts=addStorefronts(viewer,collision);
  const bollards=addCurbBollards(viewer,collision,streetDetails.layout);
  await yieldScenery();
  const nypdPlaza=addNypdPlaza(viewer,collision);
  const nasdaq=addNasdaq(viewer,collision);
  const streetVendors=addStreetVendors(viewer,collision);
  const hardRockFood=addHardRockFoodRow(viewer,collision);
  const recruitingStation=addRecruitingStation(viewer,collision);
  const lyricTheatre=addLyricTheatre(viewer,collision);
  const busStops=addBuses(viewer,collision);
  const policeVehicles=addPoliceVehicles(viewer,collision);
  const portAuthority=addPortAuthority(viewer,collision);
  await yieldScenery();
  const cinemaBlock=addCinemaBlock(viewer,collision);
  const attractions=addAttractions(viewer,collision);
  const avenue=addAvenue(viewer,collision);
  const north42=addNorth42(viewer,collision);
  const south42Transit=addSouth42Transit(viewer,collision);
  await yieldScenery();
  const fiveTimes=addFiveTimes(viewer,collision);
  const east42=addEast42(viewer,collision);
  const broadwayRetail=addBroadwayRetail(viewer,collision);
  await yieldScenery();
  const district=addDistrict(viewer,collision);
  addStudios(viewer,collision);
  addWest45(viewer,collision);
  addMarriottReference(viewer,collision);
  addMarriottFront(viewer);
  addMcdonaldsCorner(viewer,collision);
  addEast45(viewer,collision);
  addWest46(viewer,collision);
  await yieldScenery();
  addDistrictParking(viewer,collision);
  addW46Corners(viewer,collision);
  addEast46(viewer,collision);
  await yieldScenery();
  west48Scene=addWest48(viewer,collision);hyatt48Scene=addHyatt48(viewer);addKrispy48(viewer,collision);fdnyTheta48Scene=addFdnyTheta48(viewer,collision);addSixth46(viewer,collision);sixth47Scene=addSixth47(viewer,collision);addCarve47(viewer,collision);addBiltmore47(viewer,collision);addMid47(viewer,collision);addCorner47(viewer,collision);addTwo47(viewer,collision);renaissance48Scene=addRenaissance48(viewer,collision);voco48Scene=addVoco48(viewer,collision);five48Scene=addFive48(viewer,collision);rockefeller48Scene=addRockefeller48(viewer,collision);mmsWholeScene=addMmsWhole(viewer,collision);tsx47Scene=addTsx47(viewer,collision);
  await yieldScenery();
  addShubertAlley(viewer,collision);
  const hyatt49Scene=addHyatt49(viewer,collision);
  const cvs49Scene=addCvs49(viewer,collision);
  const barclays49Scene=addBarclays49(viewer,collision),superdry49Scene=addSuperdry49(viewer,collision);
  const seventh49Scene=addSeventh49Corners(viewer,collision);
  const bryantParkScene=addBryantPark(viewer,collision);
  const gracePlazaScene=addGracePlaza(viewer,collision);
  streetDetails.addAuthoredHeads(authoredSignalHeads());
  const treeProblem=error=>{if(!sceneryWarning)console.warn('Tree scenery unavailable',error.message);sceneryWarning='Some trees could not load. Reload to retry scenery.';status.hidden=false;status.textContent=sceneryWarning;};
  const replacementTrees=addGameTrees(viewer,{onError:treeProblem}).catch(treeProblem);
  const graceButton=document.createElement('button');graceButton.id='visit-grace-plaza';graceButton.textContent='Bank of America · Grace Plaza';east42Button.after(graceButton);graceButton.addEventListener('click',()=>reset({shop:{name:'Bank of America · Grace Plaza',normal:TWO47.north,view:gracePlazaScene.view}}));
  const parkButton=document.createElement('button');parkButton.id='visit-bryant-park';parkButton.textContent='Bryant Park · W42 / Sixth viewpoint';east42Button.after(parkButton);parkButton.addEventListener('click',()=>reset({shop:{name:'Bryant Park · W42 / Sixth viewpoint',normal:TWO47.north,view:bryantParkScene.view}}));
  for(const[id,title,key]of[['burger49','Burger Man, Ray’s Pizza & Lacoste · W49','neView'],['spin49','Glass corner, SPIN & red billboard · W49','swView']]){const b=document.createElement('button');b.id='visit-'+id;b.textContent=title;hyatt48Button.after(b);b.addEventListener('click',()=>reset({shop:{name:title,normal:TWO47.north,view:seventh49Scene[key]}}));}
  for(const[id,title,scene]of[['barclays49','Barclays · Seventh / W49',barclays49Scene],['superdry49','Superdry & I ♥ NY Gifts · beside Five Guys',superdry49Scene]]){const b=document.createElement('button');b.id='visit-'+id;b.textContent=title;hyatt48Button.after(b);b.addEventListener('click',()=>reset({shop:{name:title,normal:TWO47.north,view:scene.view}}));}
  const cvs49Button=document.createElement('button');cvs49Button.id='visit-cvs49';cvs49Button.textContent='CVS · opposite Hyatt / W49 closed';hyatt48Button.after(cvs49Button);cvs49Button.addEventListener('click',()=>reset({shop:{name:'CVS · view across closed W49',normal:TWO47.north,view:cvs49Scene.view}}));
  const hyatt49Button=document.createElement('button');hyatt49Button.id='visit-hyatt49';hyatt49Button.textContent='Hyatt · W49 Harrison & Broadway Grill';hyatt48Button.after(hyatt49Button);hyatt49Button.addEventListener('click',()=>reset({shop:{name:'Hyatt · W49 reference corner',normal:TWO47.north,view:hyatt49Scene.view}}));

  const w48Review=document.createElement('aside');w48Review.id='w48-update';
  const w48Label=document.createElement('span');w48Label.textContent='W48 update · Morgan Stanley + Citi Bike';
  const visitMorgan=document.createElement('button');visitMorgan.textContent='View Morgan Stanley / Fossil';visitMorgan.addEventListener('click',()=>morgan48Button.click());
  const visitBikes=document.createElement('button');visitBikes.textContent='View flower pots & Citi Bike';visitBikes.addEventListener('click',()=>citiBike48Button.click());
  w48Review.append(w48Label,visitMorgan,visitBikes);document.body.append(w48Review);

  const characterPanel=document.createElement('div');characterPanel.id='character-panel';
  const characterLabel=document.createElement('label');characterLabel.htmlFor='character-select';characterLabel.textContent='Appearance';
  const characterSelect=document.createElement('select');characterSelect.id='character-select';for(const character of APPEARANCES){const option=document.createElement('option');option.value=character.id;option.textContent=character.name;characterSelect.append(option);}
  characterPanel.append(characterLabel,characterSelect);document.body.append(characterPanel);

  const transportLabel=document.createElement('label');transportLabel.htmlFor='transport-access';transportLabel.textContent='Transport access';
  const transportAccess=document.createElement('output');transportAccess.id='transport-access';
  characterPanel.append(transportLabel,transportAccess);updatePhone();
  characterSelect.addEventListener('change',async()=>{
   keys.clear();try{if(roomClient?.session)await roomClient.chooseCharacter(characterSelect.value);else{const character=localAvatar.select(characterSelect.value);status.hidden=false;status.textContent=`Appearance: ${character.name} · arrows / WASD to walk · Shift to run`;transport?.reset();}}catch(error){characterSelect.value=roomClient?.session?.characterId??APPEARANCES[0].id;status.hidden=false;status.textContent=error.message;}updatePhone();characterSelect.blur();
  });
  const reviewKey=new URL(location.href).searchParams.get('view');
  const avenueReviewScenes=Object.fromEntries(Object.entries(AVENUE_INFILL_VIEWS).map(([key,view])=>[key,{view}]));
  for(const [key,view]of Object.entries(AVENUE_INFILL_VIEWS)){const button=document.createElement('button');button.textContent=key==='sixthavenue'?'Sixth Avenue · new facades':'Eighth Avenue · new facades';east42Button.after(button);button.addEventListener('click',()=>reset({shop:{name:button.textContent,normal:TWO47.north,view}}));}
  const reviewScenes={...avenueReviewScenes,graceplaza:gracePlazaScene,bankofamerica:{view:gracePlazaScene.bankView},bryantpark:bryantParkScene,burger49:{view:seventh49Scene.neView},spin49:{view:seventh49Scene.swView},barclays49:barclays49Scene,superdry49:superdry49Scene,morgan48:morgan48Scene,citibike48:citiBike48Scene,hyatt49:hyatt49Scene,cvs49:cvs49Scene};
  const review=reviewScenes[reviewKey];
  await avatarReady;
  await reset(review?{shop:{name:reviewKey,normal:TWO47.north,view:review.view}}:{});
  const screens=await addBillboards(viewer);
  const lightFaces=[...screens,...storefronts.lightFaces,...nasdaq.lightFaces];characterLighting.setFaces(lightFaces);
  remotePlayers=new RemotePlayers({serverClock:()=>roomClient?.serverNow()??Date.now(),createAvatar:(getRemote,info)=>{const avatar=createAvatar(viewer,getRemote,{characterId:info.characterId,designId:info.designId??CHARACTER_DESIGNS[(info.slot??0)%CHARACTER_DESIGNS.length].id,name:development?`Player ${info.number}`:null,slot:info.slot,show:()=>getRemote().position.distanceToSquared(player.position)<200*200});avatar.setDebugPlayer(development?info.slot:null);return avatar;}});
  remotePlayers.setLightFaces(lightFaces);
  const playerSession=createPlayerSession({localAvatar,remotePlayers,debugPlayers:development,onAppearance:id=>{characterSelect.value=id;updatePhone();},
   async prepareSpawn(self,snapshot){
    await localAvatar.ready();
    if(snapshot?.transport?.playerId===self.id){await placeTransportPlayer(self.state);return;}
    keys.clear();const distance=camera.distance;
    await reset({shop:{center:self.state.position,normal:[0,1,0],name:`Player ${self.number} · Times Square`,address:'Times Square',view:{position:self.state.position,yaw:self.state.heading,pitch:.10}}},{serverSpawn:true});
    camera.distance=distance;if(!started)throw new Error('Unable to prepare your spawn. Try reconnecting.');
   }
  });
  let sessionStorage=null;try{sessionStorage=window.sessionStorage;}catch{}
  roomClient=new RoomClient({storage:sessionStorage,ownership:new TabSessionOwner(),isHidden:()=>document.hidden,
   getState:()=>{if(!started)return null;const state=playerState(player);return document.hidden?{...state,speed:0,running:false,poseWeight:0,runBlend:0}:state;},
   onJoin:playerSession.onJoin,onSpawn:playerSession.onSpawn,onCorrection:self=>runningCorrection.apply(self.state),
   onSnapshot(snapshot){playerSession.onSnapshot(snapshot,roomClient?.session?.yourId);}
  });
  gunshotAudio=createGunshotAudio();remoteCarHitAudio=createRemoteCarHitAudio();
  cityGameplay=createCityGameplay({getRoom:()=>roomClient,getPlayer:()=>player,getCamera:()=>camera,getTraffic:()=>cityTraffic,phoneApps,onMessage:createMessageAudio(),onCarHit:createCarHitAudio({getDesign:readDesignSelection})});
  roomClient.subscribe(state=>{
   cityGameplay.update({...state,serverTime:roomClient.serverNow()});
   localMovementAllowed=canControlLocalPlayer(state)&&!document.hidden;if(!localMovementAllowed&&!roomClient.switching&&!interaction?.beginning&&!interaction?.finishing)keys.clear();
   document.body.classList.toggle('in-match',!!state.roomCode&&['playing','ended'].includes(state.matchPhase));
   document.body.classList.toggle('is-thief',state.yourRound?.role==='THIEF');
   if(!state.roomCode||state.matchPhase!=='playing')witness.clear();
   if(started&&state.roomCode&&state.matchPhase==='waiting'){status.hidden=false;status.textContent=`Explore freely · ${state.players.length}/20 players · Minimum 4 to start`;}
   else if(started&&state.roomCode&&state.matchPhase==='ended'){status.hidden=false;status.textContent='Round ended · The host can open a rematch in this room.';}
   else if(started&&state.phase==='solo'){status.hidden=false;status.textContent='Ready · Arrow keys / WASD to walk · Shift to run · Space to jump';}
   characterSelect.disabled=!!state.roomCode||state.phase==='joining'||state.phase==='reconnecting';
   updatePhone(state);
   $('reset').disabled=!!state.roomCode&&!state.canMove;
   for(const button of document.querySelectorAll('button[id^="visit-"],#red-steps'))button.disabled=!!state.roomCode;
   for(const option of characterSelect.options)option.disabled=!!state.roomCode&&state.players.some(p=>p.id!==state.yourId&&p.characterId===option.value);
  });
  interaction=new InteractionController({client:roomClient,onBegin:target=>{player.commandSpeed=0;player.speed=0;player.running=false;player.travelDirection.set(0,0,0);player.heading=Math.atan2(target.position.x-player.position.x,target.position.y-player.position.y);player.snapPresentation();},onChange:view=>roundUI.updateInteraction(view,roomClient.serverNow()),onError:transportError});
  roundUI.onHold(()=>{pointerHolding=true;interaction.press();},()=>{pointerHolding=false;interaction.keyReleased();});
  const roomPanel=mountRoomPanel(roomClient,APPEARANCES,()=>characterSelect.value,currentTransportAccess);
  const transportUI=mountTransportUI(viewer,()=>player,currentTransportAccess);
  transport=new TransportController({portals:TRANSPORT_PORTALS,onChooseDestination:()=>phoneApps.open('maps'),onChange:state=>{transportUI.show(state);if(state.busy)characterSelect.disabled=true;else if(roomClient.view().phase==='solo')characterSelect.disabled=false;},async travel(source,_door,destinationId){
   keys.clear();
   let destination;
   if(roomClient.session){const snapshot=await roomClient.transport(source.id,destinationId);destination=TRANSPORT_PORTALS.find(p=>p.id===snapshot.transport?.destinationId);}
   else{const arrival=transportArrival(source,0,destinationId);destination=arrival.destination;await placeTransportPlayer(arrival.state);}
   mtaApp.arrive(destination);
   status.hidden=false;status.textContent=destination?`Arrived at ${destination.name} · ${destination.location}`:'Transport complete';
  }});
  transportUI.onEnter(()=>transport.interact().catch(transportError));
  if(development)mountMultiplayerDebug(roomClient);
  document.addEventListener('visibilitychange',()=>roomClient.refresh().catch(error=>console.warn('Room visibility update unavailable',error.name)));
  window.addEventListener('pagehide',()=>{releaseInputs();roomClient.park();roomClient.stop();remotePlayers.clear();});
  window.addEventListener('pageshow',event=>{if(event.persisted)roomClient.restore().catch(error=>console.warn('Room restore unavailable',error.name));});
  roomClient.restore(roomPanel.invitedRoom).catch(error=>console.warn('Room restore unavailable',error.name));
  // Local diagnostics expose only this client's already-authorized snapshot.
  window.prototypeDebug={viewer,player,collision,city,camera,minimap,entity,characterLighting,plaza,streetDetails,npcTraffic,streetscape,storefronts,bollards,nypdPlaza,nasdaq,streetVendors,hardRockFood,recruitingStation,lyricTheatre,busStops,policeVehicles,portAuthority,cinemaBlock,attractions,avenue,broadwayRetail,north42,south42Transit,fiveTimes,east42,district,transport,transportPortals:TRANSPORT_PORTALS,reset,get room(){return roomClient.view();},get remotePlayerCount(){return remotePlayers.players.size;}};
  if(document.modelContext?.registerTool){
    const lifecycle=new AbortController();
    try{Promise.resolve(document.modelContext.registerTool({
      name:'reset_to_times_square',title:'Reset to Times Square',
      description:'Reset this walking prototype to its Times Square plaza spawn and camera.',
      inputSchema:{type:'object',properties:{},additionalProperties:false},
      annotations:{readOnlyHint:false,untrustedContentHint:false},
      async execute(input){
        if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length)throw new Error('Expected an empty object');
        await reset();if(!started)throw new Error(status.textContent);
        return {latitude:40.758,longitude:-73.9855,state:'ready'};
      }
    },{signal:lifecycle.signal})).catch(error=>console.warn('Reset tool registration unavailable',error.message));
    }catch(error){console.warn('Reset tool registration unavailable',error.message);}
    window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
  }
}catch(error){fail(error);}
let last=performance.now(),accumulator=0,statsTime=last,frames=0,streamTime=last,streaming=false,collisionStreamTask=null,phoneTime=0,collisionWarning=false,mapTime=0;
viewer.scene.preUpdate.addEventListener(()=>{
  const now=performance.now(),dt=Math.min((now-last)/1000,.25);last=now;frames++;
  const roomState=roomClient?.view()??{phase:'solo'},serverTime=roomClient?.serverNow()??Date.now();
  gunshotAudio?.update({matchId:roomState.matchId,shots:roomState.gunshots,time:serverTime,position:player?.position,enabled:started&&!document.body.classList.contains('home-open')&&['playing','ended'].includes(roomState.matchPhase)});
  if(roomState.matchPhase==='playing')remoteCarHitAudio?.update({matchId:roomState.matchId,players:roomState.players,selfId:roomState.yourId,position:player?.position});
  cityGameplay?.tick(now,movement(keys,camera?.yaw??0).lengthSq()>0);
  if(roomClient&&remotePlayers)remotePlayers.update(serverTime);
  if(interaction){const people=presentedPeople(roomState),enabled=started&&roomState.phase==='connected'&&roomState.matchPhase==='playing'&&!roomState.yourRound?.dead&&!roomState.yourRound?.caught&&!roomState.preparing&&!transport?.busy&&!document.hidden;
   if(aiming&&(!enabled||hasMovementPenalty(roomState.yourRound,serverTime)))setAiming(false);
   const aimTarget=enabled&&aiming?interactionTarget({state:roomState,player,people,camera,collision,time:serverTime,shoot:true}):null;
   shootingAim.update({state:roomState,target:aimTarget,time:serverTime,enabled,busy:interaction.busy||roomClient?.switching,grounded:player?.grounded,aiming});
   const candidate=enabled?interactionTarget({state:roomState,player,people,camera,collision,time:serverTime}):null;
   interaction.update({state:roomState,candidate,time:serverTime,enabled,inputHeld:keys.has('KeyE')||pointerHolding,moving:movement(keys,camera?.yaw??0).lengthSq()>0||keys.has('Space')});
  }
  if(roomClient){
    const state=roomState;
    if(state.roomCode&&state.matchPhase==='ended'&&localMovementAllowed){localMovementAllowed=false;keys.clear();}
  }
  if(started&&!document.body.classList.contains('home-open')){
    accumulator=Math.min(accumulator+dt,.25);
    while(accumulator>=FIXED_STEP){if(roomState.matchPhase!=='ended'&&!hasMovementPenalty(roomState.yourRound,serverTime))player.update(FIXED_STEP,localMovementAllowed&&!transport?.busy&&!interaction?.busy&&!playerGuide.isOpen?keys:emptyKeys,camera.yaw);else{player.speed=0;player.running=false;player.commandSpeed=0;player.travelDirection.set(0,0,0);player.velocityZ=0;player.poseWeight*=Math.exp(-FIXED_STEP/.14);player.runBlend*=Math.exp(-FIXED_STEP/.14);}accumulator-=FIXED_STEP;}
    renderPlayer=runningCorrection.present(samplePresentation(player,accumulator/FIXED_STEP),dt);
    const action=roomState.yourRound?.action,reachTarget=interaction?.holding&&action?Math.min(1,(serverTime-action.startedAt)/220):0;reachWeight+=(reachTarget-reachWeight)*(1-Math.exp(-dt/.13));if(action)reachMotion=action.kind==='arrest'?'arrest':'reach';renderPlayer.interactionWeight=reachWeight;renderPlayer.interactionMotion=reachMotion;
    camera.update(renderPlayer,dt);
    if(now-mapTime>=100&&['maps','mta'].includes(document.getElementById('phone').dataset.app)){minimap.update(player);mapTime=now;}
    if(transport){const activeKeys=localMovementAllowed&&!interaction?.busy?keys:emptyKeys,intent=movement(activeKeys,camera.yaw);transport.update({position:player.position.toArray(),intent:intent.toArray(),access:currentTransportAccess(),enabled:localMovementAllowed&&!interaction?.busy&&!document.hidden})?.catch(transportError);}
    if(now-streamTime>500&&!streaming){streamTime=now;streaming=true;collisionStreamTask=collision.stream(player.position.clone()).then(()=>{if(collisionWarning){collisionWarning=false;status.textContent='Street connection restored.';}}).catch(error=>{if(!collisionWarning)console.warn('Nearby street download interrupted',error.message);collisionWarning=true;status.hidden=false;status.textContent='Retrying nearby street data… Movement pauses at any area that is still loading.';}).finally(()=>streaming=false);}
  }else accumulator=0;
  if(now-phoneTime>=100){const state=roomState;updateWitness(state);updatePhone(state);phoneTime=now;}
});
let previewTime=0;
viewer.scene.postRender.addEventListener(()=>{
  const now=performance.now();
  if(started&&!aiming&&!document.body.classList.contains('home-open')&&document.getElementById('phone').dataset.app==='camera'&&!document.hidden&&now-previewTime>=150){previewTime=now;const preview=document.getElementById('phone-camera-preview');if(preview){const drawn=tryDrawSquarePhoto(viewer.canvas,preview),hint=document.getElementById('phone-camera-hint');hint.hidden=drawn;if(!drawn)hint.textContent='Camera preview is waiting for the next frame…';}}
  if(development&&now-statsTime>500 && player){
    const geo=Cartographic.fromCartesian(toWorld(player.position)),cam=Cartographic.fromCartesian(viewer.camera.positionWC),s=city.stats();
    $('coords').textContent=`${CMath.toDegrees(geo.latitude).toFixed(6)}, ${CMath.toDegrees(geo.longitude).toFixed(6)}`;
    $('height').textContent=`${cam.height.toFixed(2)} m (datum)`;
    $('fps').textContent=(frames*1000/(now-statsTime)).toFixed(0);
    $('tiles').textContent=`${s.loaded} / ${s.visible}`;$('memory').textContent=`${(s.memory/1048576).toFixed(1)} MB`;
    $('colliders').textContent=`${collision.loaded.size} active${collision.pending.size?` · ${collision.pending.size} pending`:''}`;
    $('speed').textContent=`${player.speed.toFixed(1)} m/s`;
    $('state').textContent=!started?'Preparing':!collision.ready(player.position)?'Waiting for nearby tiles':!player.grounded?(player.velocityZ>0?'Jumping':'Falling'):player.speed?(player.running?'Running':'Walking'):'Grounded';
    statsTime=now;frames=0;
  }
});
