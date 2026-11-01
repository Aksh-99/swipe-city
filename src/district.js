import {Material} from 'cesium';
import {WEST44_TITLES,WEST44_COLORS} from './west44-reference.js';
import {WEST43_NAMES} from './west43-reference.js';
import {addBatches,addFaces} from './street-details.js';
import {architectureNightAppearance} from './architecture-lighting.js';
import {createDistrictGeometry} from './district-geometry.js';
import {DISTRICT} from './district-config.js';
const NAMES={deli:['MIDTOWN DELI','CORNER MARKET','WESTSIDE DELI','FRESH & CO.','CITY GROCERY'],coffee:['BOROUGH COFFEE','NIGHT OWL CAFÉ','42 ROASTERS','METRO COFFEE','AVENUE ESPRESSO'],fashion:['STUDIO NYC','NORTH & WEST','THREAD / NEW YORK','CITY EDITION','DENIM DISTRICT'],restaurant:['WESTSIDE KITCHEN','BROADWAY GRILL','MIDTOWN PIZZA','NOODLE HOUSE','THE CORNER TABLE'],theatre:['THEATRE DISTRICT','LIVE ON STAGE','BROADWAY NIGHTS','BOX OFFICE','TONIGHT ON BROADWAY'],retail:['NEW YORK GIFTS','CITY SPORT','MIDTOWN BEAUTY','BROADWAY MARKET','URBAN OUTFIT'],office:['MIDTOWN NEW YORK','AVENUE OF THE AMERICAS','WESTSIDE OFFICES','LOBBY ENTRANCE','NEW YORK'],shed:['SIDEWALK OPEN','SIDEWALK OPEN','SIDEWALK OPEN','SIDEWALK OPEN','SIDEWALK OPEN']};
Object.assign(NAMES,WEST43_NAMES,{west44:WEST44_TITLES});
const ATLAS_HEIGHT=Math.ceil((Object.values(NAMES).flat().length+1+WEST44_TITLES.length)/5)*160;
export function districtAtlas(){
 const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=ATLAS_HEIGHT;const c=canvas.getContext('2d'),cells={};
 let index=0;Object.entries(NAMES).forEach(([kind,names])=>names.forEach((name,col)=>{
  const x=index%5*400,y=Math.floor(index/5)*160;index++;cells[kind+col]=[x,y,400,160];c.fillStyle=kind==='west44'?WEST44_COLORS[col]:kind==='parking'?'#661b24':kind==='diner'?'#742127':kind==='casablanca'?'#4b2029':kind==='tony'?'#263121':kind==='coffee'?'#203b32':kind==='theatre'?'#301c23':kind==='shed'?'#1b3b2b':'#17282e';c.fillRect(x,y,400,160);
  c.strokeStyle='#7b8073';c.lineWidth=2;c.strokeRect(x+7,y+7,386,146);c.textAlign='center';c.textBaseline='middle';c.fillStyle=kind==='theatre'?'#f0b880':'#d8d7c1';c.font=`${['restaurant','coffee','casablanca','tony','sondheim'].includes(kind)?'italic ':''}bold 33px ${['restaurant','casablanca','tony','sondheim'].includes(kind)?'Georgia':'Arial'}`;c.fillText(name,x+200,y+66,372);
  c.font='15px Arial';c.fillStyle='#9aa49a';c.fillText(kind==='shed'?'PLEASE USE COVERED WALKWAY':kind==='office'?'RECEPTION • STREET ENTRANCE':'NEW YORK  •  TIMES SQUARE',x+200,y+111,355);
 }));const x=index%5*400,y=Math.floor(index/5)*160;index++;cells.parkingVertical=[x,y,100,160];c.fillStyle='#701e26';c.fillRect(x,y,100,160);c.fillStyle='#eed9c0';c.font='bold 28px Arial';for(const [i,l] of [...'PARK↓'].entries())c.fillText(l,x+50,y+17+i*30);for(const [variant,title] of WEST44_TITLES.entries()){
 const x=index%5*400,y=Math.floor(index/5)*160;index++;cells['west44v'+variant]=[x,y,100,160];
 c.fillStyle=WEST44_COLORS[variant];c.fillRect(x,y,100,160);c.fillStyle='#e8d8aa';c.save();c.translate(x,y);c.scale(1,.24);c.font='bold 68px Arial';
 const chars=[...title.replace(/[^a-zA-Z]/g,'').toUpperCase()].slice(0,12),step=146/chars.length;
 chars.forEach((l,i)=>c.fillText(l,50,(8+(i+.5)*step)/.24,86));c.restore();
 }return {canvas,cells};
}
const mat=(type,body,uniforms={},translucent=false)=>new Material({fabric:{type,uniforms,source:`czm_material czm_getMaterial(czm_materialInput materialInput){vec2 uv=materialInput.st;czm_material m=czm_getDefaultMaterial(materialInput);m.diffuse=vec3(.003);${body}return m;}`},translucent});
export function addDistrict(viewer,collision){
 const g=createDistrictGeometry();collision.addStatic('remaining-times-square-frontages',g.collision);
 addBatches(viewer,g.batches,false,false,architectureNightAppearance(g.night));addBatches(viewer,g.bulbs);
 const walls=mat('DistrictStoneAndBrick',`float palette=floor(uv.x/1000.0);uv.x=mod(uv.x,1000.0);vec3 color=palette<.5?vec3(.18,.14,.105):palette<1.5?vec3(.14,.09,.073):palette<2.5?vec3(.16,.18,.17):palette<3.5?vec3(.155,.075,.052):vec3(.085,.125,.145);float brick=step(.5,palette)*step(palette,3.5);vec2 b=vec2(uv.x/.30+mod(floor(uv.y/.13),2.0)*.5,uv.y/.13);float seam=max(step(.955,fract(b.x)),step(.91,fract(b.y)));float joints=max(step(.985,fract(uv.x/1.3)),step(.98,fract(uv.y/.75)));color*=1.0-mix(joints*.28,seam*.37,brick);m.emission=color*mix(.65,.40,smoothstep(4.0,15.0,uv.y));m.alpha=1.0;`);
 addFaces(viewer,g.walls,walls,(f,u,v)=>[f.palette*1000+u*f.width,v*f.height]);
 const curtain=mat('West43OfficeGlazing',`vec2 cell=fract(uv/vec2(1.48,3.45));float frame=max(step(.975,cell.x),step(.975,cell.y));float reflection=.5+.5*sin(uv.x*.29+uv.y*.21);vec3 glass=mix(vec3(.018,.033,.043),vec3(.039,.054,.061),reflection);m.emission=mix(glass,vec3(.065,.074,.078),frame);m.alpha=1.0;`);
 addFaces(viewer,g.curtain.filter(f=>!f.fullOfficeGrid),curtain,(f,u,v)=>[u*f.width,v*f.height]);
 const fullGrid=mat('W44FullOfficeGrid',`vec2 cell=fract(uv/vec2(1.22,3.2));float frame=max(1.0-step(.025,cell.x),1.0-step(.031,cell.y));float reflection=.5+.5*sin(uv.x*.29+uv.y*.21);vec3 glass=mix(vec3(.018,.033,.043),vec3(.039,.054,.061),reflection);m.emission=mix(glass,vec3(.075,.087,.093),frame);m.alpha=1.0;`);
 addFaces(viewer,g.curtain.filter(f=>f.fullOfficeGrid),fullGrid,(f,u,v)=>[u*f.width,v*f.height]);
 const windows=mat('DistrictShopWindows',`float shade=floor(uv.x)/100.0;uv.x=fract(uv.x)/.98;m.emission=texture(image,uv).rgb*shade;m.alpha=1.0;`,{image:'/storefronts/retail-interiors-atlas.webp'});
 addFaces(viewer,g.windows,windows,(f,u,v)=>[Math.round(f.shade*100)+(f.cell+.01+u*.98)/3*.98,.01+v*.98]);
 const atlas=districtAtlas(),signs=mat('DistrictStoreSigns',`float shade=floor(uv.x)/100.0;uv.x=fract(uv.x)/.98;m.emission=texture(image,uv).rgb*shade;m.alpha=1.0;`,{image:Material.DefaultImageId});signs.uniforms.image=atlas.canvas;
 addFaces(viewer,g.labels,signs,(f,u,v)=>{const [x,y,w,h]=atlas.cells[f.west44Vertical?'west44v'+f.variant:f.vertical?'parkingVertical':f.kind+f.variant];return [Math.round(f.shade*100)+(x+2+u*(w-4))/2048*.98,(ATLAS_HEIGHT-y-h+2+v*(h-4))/ATLAS_HEIGHT];});
 const food=mat('East44TruckPhotoMenus','m.emission=texture(image,uv).rgb*.53;m.alpha=1.0;',{image:'/storefronts/food-menu-photos.webp'});
 addFaces(viewer,g.foodMenus,food,(f,u,v)=>[(f.item%2+.012+u*.976)/2,(1-Math.floor(f.item/2)+.012+v*.976)/2]);
 const posters=mat('DistrictPosterCollages','m.emission=texture(image,uv).rgb*.62;m.alpha=1.0;',{image:'/billboards/portrait-atlas.webp'});addFaces(viewer,g.posters,posters,(f,u,v)=>[(f.ad%4+.004+u*.992)/4,(1-Math.floor(f.ad/4)+.004+v*.992)/2]);
 const net=mat('DistrictScaffoldMesh','vec2 grid=fract(uv*13.0);float thread=max(step(.85,grid.x),step(.85,grid.y));m.emission=vec3(.03,.047,.038)+thread*.026;m.alpha=.19+thread*.21;',{},true);addFaces(viewer,g.netting,net,(f,u,v)=>[u*f.width,v*f.height],true);
 const pools=mat('DistrictStreetlightPools','vec2 p=uv-.5;m.emission=vec3(.30,.28,.23);m.alpha=exp(-dot(p,p)*17.0)*.075;',{},true);addFaces(viewer,g.pools,pools,(f,u,v)=>[u,v],true);
 return {facades:DISTRICT.facades.length,scaffolds:g.passages.length,lamps:DISTRICT.lamps.length,posterFaces:g.posters.length,foodTrucks:g.east44Props?.trucks.length??0,souvenirStalls:g.east44Props?.souvenir?1:0,places:DISTRICT.places.length};
}
