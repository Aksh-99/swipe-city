import test from 'node:test';import assert from 'node:assert/strict';
import {Material,MaterialAppearance} from 'cesium';
import {Vector3} from 'three';
import {liftBillboardColor,applyBillboardLight,isBillboardMaterial,BILLBOARD_TYPES,BILLBOARD_SATURATION} from '../src/billboard-lighting.js';
import {addFaces} from '../src/street-details.js';
import {lightSpillGLSL} from '../src/plaza-lighting.js';
const material=type=>new Material({fabric:{type,source:'czm_material czm_getMaterial(czm_materialInput i){czm_material m=czm_getDefaultMaterial(i);m.emission=vec3(.87,.3,.12);m.alpha=1.;return m;}'}});
test('original artwork RGB values pass through unchanged',()=>{
 for(const c of [[0,0,0],[1,1,1],[.87,.3,.12],[.3,.5,.8],[.02,.03,.04],[1,0,1]])assert.deepEqual(liftBillboardColor(c),c);
 assert.equal(BILLBOARD_SATURATION,1);
});
test('every registered bespoke LED and atlas screen gets the lift, not glazing, menus or signals',()=>{
 for(const type of BILLBOARD_TYPES)assert(isBillboardMaterial({type}),type);
 for(const type of ['Five48Redstreet','BroadwayReferenceAdportrait','Morgan48ribbonNewsDisplay','Cvs49PaintCampaignportrait','Voco48greenSign'])assert(isBillboardMaterial({type}),type);
 assert(isBillboardMaterial({type:'FutureAd',uniforms:{image:'/billboards/new.webp'}}));
 for(const type of ['TimesSquarePedestrianSignals','TimesSquareSignalLenses','Morgan48SteelCurtainWall','NasdaqRecessedWindowGlass','Two47RestaurantMenus'])assert.equal(isBillboardMaterial({type}),false,type);
});
test('real Cesium billboard material is adjusted once before draw without changing UVs or opacity',()=>{
 const m=material('MarriottModernWrapScreens'),added=[],viewer={scene:{primitives:{add:p=>added.push(p)}}};
 const face={center:new Vector3(0,0,10),normal:new Vector3(0,1,0),right:new Vector3(1,0,0),width:20,height:10};
 addFaces(viewer,[face],m,(_,u,v)=>[u,v]);const source=m.shaderSource;
 assert(source.includes('swipeBillboardLight(result.emission)'));assert(source.includes('m.alpha=1.'));
 assert(added[0].appearance instanceof MaterialAppearance);assert.equal(added[0].appearance.translucent,false);
 addFaces(viewer,[face],m,(_,u,v)=>[u,v]);assert.equal(m.shaderSource,source);
 const untouched=material('TimesSquarePedestrianSignals'),original=untouched.shaderSource;
 applyBillboardLight(untouched);assert.equal(untouched.shaderSource,original);
 for(const p of added)p.destroy();
});
test('original local street lighting is restored without added white wash',()=>{
 const spill=lightSpillGLSL();assert(spill.includes('/20.0-along'));assert(spill.includes('*light*.26'));
});
