import { chromium } from 'playwright';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:960,height:640}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error'){errors.push(m.text());console.log('CONSOLE',m.text().slice(0,500));}});
const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.glb':'model/gltf-binary','.wasm':'application/wasm'};
await page.route('**/*',async route=>{
  const url=new URL(route.request().url());let pathname=decodeURIComponent(url.pathname);if(pathname==='/')pathname='/index.html';
  try{const body=await readFile(path.join(process.cwd(),'dist',pathname));await route.fulfill({status:200,contentType:types[path.extname(pathname)]||'application/octet-stream',body});}
  catch(e){console.log('MISSING',pathname);await route.fulfill({status:404,body:'Missing'});}
});
try {
  await page.goto('https://prototype.test'+(process.env.CHECK_QUERY||''));
  await page.waitForFunction(()=>window.prototypeDebug||document.querySelector('#status')?.textContent.startsWith('Unable'),null,{timeout:90000});
  if(errors.length||await page.locator('#status').textContent().then(text=>text.startsWith('Unable')))throw new Error('Scene initialization failed: '+errors.join('\n'));
  console.log('PLAYER READY');
  if(!await page.evaluate(()=>getComputedStyle(document.querySelector('#world')).position==='absolute'&&document.querySelector('canvas').getBoundingClientRect().width===innerWidth))throw new Error('Game stylesheet did not produce a full-screen canvas');
  for(let i=0;i<10&&!await page.evaluate(()=>window.prototypeDebug.city.loaded.size);i++){
    await page.waitForTimeout(2000);
    console.log('LOADING',await page.evaluate(()=>({status:document.querySelector('#status').textContent,pending:window.prototypeDebug.city.tileset._statistics.numberOfPendingRequests,processing:window.prototypeDebug.city.tileset._statistics.numberOfTilesProcessing,selected:window.prototypeDebug.city.tileset._selectedTiles.length,rendering:window.prototypeDebug.viewer.useDefaultRenderLoop})));
  }
  await page.waitForFunction(()=>window.prototypeDebug.city.loaded.size>0,null,{timeout:90000});
  await page.waitForTimeout(3000);
  const initial=await page.evaluate(()=>({ads:window.prototypeDebug.viewer.scene.billboardAdCount,mapView:document.querySelector('#phone-map').getAttribute('viewBox'),status:document.querySelector('#status').textContent,position:window.prototypeDebug.player.position.toArray(),tiles:document.querySelector('#tiles').textContent,colliders:document.querySelector('#colliders').textContent,fps:document.querySelector('#fps').textContent}));
  console.log('INITIAL',JSON.stringify(initial));
  if(!initial.ads)throw new Error('No billboard ads fitted to actual city walls');
  const streetDetails=await page.evaluate(()=>{const d=window.prototypeDebug.streetDetails;return {sidewalkPaths:d.sidewalkPaths,poles:d.poles,vehicleHeads:d.vehicleHeads,pedestrianHeads:d.pedestrianHeads,phase:d.phase};});
  if(streetDetails.sidewalkPaths<100||streetDetails.poles<40||streetDetails.vehicleHeads<20)throw new Error('Mapped sidewalks and signal assemblies did not initialize');
  const streetscape=await page.evaluate(()=>window.prototypeDebug.streetscape);
  if(streetscape.entrances!==21||streetscape.scaffolds<8||streetscape.streetLamps<200)throw new Error('Subway entrances, scaffolds, or surrounding street lamps did not initialize');
  const storefronts=await page.evaluate(()=>{const s=window.prototypeDebug.storefronts;return {total:s.total,named:s.named,delis:s.delis};});
  if(storefronts.total!==21||storefronts.named!==14||storefronts.delis!==4)throw new Error('Requested storefronts did not initialize');
  const markerBefore=await page.locator('#phone-map > g:last-child').getAttribute('transform');
  if(await page.locator('#phone-map path').count()<10)throw new Error('Phone map did not render the street network');
  await page.screenshot({path:'../times-square-preview.png'});
  await page.keyboard.down('ArrowUp');await page.waitForTimeout(2000);await page.keyboard.up('ArrowUp');
  const walked=await page.evaluate(()=>window.prototypeDebug.player.position.toArray());
  const markerAfter=await page.locator('#phone-map > g:last-child').getAttribute('transform');
  if(markerBefore===markerAfter)throw new Error('Phone map marker did not follow the player');
  await page.keyboard.down('ShiftLeft');await page.keyboard.down('ArrowUp');await page.waitForFunction(()=>window.prototypeDebug.player.running&&window.prototypeDebug.player.speed===8);await page.waitForTimeout(1500);await page.keyboard.up('ArrowUp');await page.keyboard.up('ShiftLeft');
  const ran=await page.evaluate(()=>window.prototypeDebug.player.position.toArray());
  await page.evaluate(()=>window.prototypeDebug.viewer.useDefaultRenderLoop=false);
  const yawBefore=await page.evaluate(()=>window.prototypeDebug.camera.yaw);
  await page.mouse.move(350,300);await page.mouse.down();await page.mouse.move(430,340,{steps:5});
  await page.waitForFunction(before=>Math.abs(window.prototypeDebug.camera.yaw-before)>.01,yawBefore);
  // Verify dragging separately from the click-to-capture camera mode.
  const yawAfter=await page.evaluate(()=>window.prototypeDebug.camera.yaw);
  await page.mouse.up();
  await page.click('canvas',{position:{x:350,y:300}});
  await page.waitForFunction(()=>document.pointerLockElement?.tagName==='CANVAS');
  const lockedYawBefore=await page.evaluate(()=>window.prototypeDebug.camera.yaw);
  await page.evaluate(()=>{window.lockedCameraYaws=[];window.addEventListener('pointermove',()=>{if(document.pointerLockElement)window.lockedCameraYaws.push(window.prototypeDebug.camera.yaw);});});
  await page.mouse.move(390,320,{steps:3});
  // Headless Chromium emits a native recentering move after each locked move,
  // with the opposite delta. Verify the handled movement before that recenter.
  await page.waitForFunction(before=>window.lockedCameraYaws.some(yaw=>Math.abs(yaw-before)>.01),lockedYawBefore);
  await page.keyboard.press('Escape');
  // Headless synthetic Escape may not trigger Chromium's native pointer-lock
  // release shortcut; release explicitly before testing the normal UI button.
  await page.evaluate(()=>document.exitPointerLock());
  await page.waitForFunction(()=>!document.pointerLockElement);
  await page.evaluate(()=>window.prototypeDebug.viewer.useDefaultRenderLoop=true);
  await page.click('#reset');await page.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('Ready'),null,{timeout:60000});
  const reset=await page.evaluate(()=>window.prototypeDebug.player.position.toArray());
  await page.click('#red-steps');await page.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('Ready'),null,{timeout:60000});
  await page.waitForTimeout(1500);
  const stepsView=await page.evaluate(()=>({position:window.prototypeDebug.player.position.toArray(),plaza:window.prototypeDebug.plaza}));
  if(stepsView.plaza.steps!==27||stepsView.plaza.barriers!==28)throw new Error('Plaza details not initialized');
  await page.screenshot({path:'../times-square-steps-preview.png'});
  await page.click('#reset');await page.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('Ready'),null,{timeout:60000});
  await page.evaluate(()=>{const d=window.prototypeDebug;d.camera.yaw=-.85;d.camera.pitch=-.03;d.camera.update(d.player);});
  await page.waitForTimeout(1500);await page.screenshot({path:'../times-square-street-preview.png'});
  await page.click('#visit-subway');await page.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('Ready'),null,{timeout:60000});
  await page.waitForTimeout(1500);await page.screenshot({path:'../times-square-subway-preview.png'});
  // Fixed simulation steps exercise the same player controller without making
  // software-WebGL frame rate determine how far the character walks.
  const subway=await page.evaluate(()=>{const d=window.prototypeDebug;for(let i=0;i<340;i++)d.player.update(1/60,new Set(['ArrowUp']),d.camera.yaw);d.camera.yaw+=Math.PI;d.camera.pitch=.08;d.camera.update(d.player);return {position:d.player.position.toArray(),cameraHeight:d.viewer.camera.positionCartographic.height};});
  if(subway.position[2]>-2.5)throw new Error('Subway entrance did not allow descending below the street');
  if(subway.cameraHeight>0)throw new Error('Subway camera was forced above the street');
  await page.waitForTimeout(1500);await page.screenshot({path:'../times-square-subway-landing-preview.png'});
  const streetscapeData=JSON.parse(await readFile('public/data/streetscape.json','utf8'));
  const shed=streetscapeData.scaffolds.find(s=>s.name==='West 45th Street / sidewalk shed');
  await page.evaluate(async s=>{const d=window.prototypeDebug;d.player.reset();d.player.position.set(s.center[0]-s.along[0]*(s.length/2+3),s.center[1]-s.along[1]*(s.length/2+3),.17);await d.collision.stream(d.player.position);d.camera.yaw=Math.atan2(s.along[0],s.along[1]);d.camera.pitch=.08;d.camera.update(d.player);},shed);
  await page.waitForTimeout(1500);await page.screenshot({path:'../times-square-scaffold-preview.png'});
  await page.click('#visit-shops');await page.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('Ready · Disney Store'),null,{timeout:60000});
  await page.waitForTimeout(1500);await page.screenshot({path:'../times-square-disney-preview.png'});
  if(await page.locator('#visit-shops').textContent()!=='Next shop')throw new Error('Shop tour did not advance');
  for(const id of ['grand-slam','times-pizza','duffy-deli','mms','hersheys','playbox','avenue21','city-sole','hard-rock','taco-bell']){
   await page.evaluate(async id=>{const d=window.prototypeDebug;await d.reset({shop:d.storefronts.fronts.find(s=>s.id===id)});},id);
   await page.waitForTimeout(1500);await page.screenshot({path:`../times-square-shop-${id}.png`});
  }
  const result={streetDetails,streetscape,storefronts,subway,stepsView,initial,walked,ran,markerBefore,markerAfter,yawBefore,yawAfter,reset,errors};console.log('RESULT',JSON.stringify(result));
  await writeFile('../browser-results.json',JSON.stringify(result,null,2));
  if(errors.length)process.exitCode=1;
  if(Math.hypot(walked[0]-initial.position[0],walked[1]-initial.position[1])<.05)throw new Error('Arrow-key movement did not advance the player');
  if(Math.abs(yawAfter-yawBefore)<.01)throw new Error('Mouse dragging did not orbit the camera');
  if(Math.hypot(...reset)>.06)throw new Error('Reset did not restore the plaza spawn');
}finally{await browser.close();}
