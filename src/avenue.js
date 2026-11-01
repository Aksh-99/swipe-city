import {Material} from 'cesium';
import {addBatches,addFaces} from './street-details.js';
import {architectureNightAppearance} from './architecture-lighting.js';
import {createAvenueGeometry} from './avenue-geometry.js';
const CELLS={wordmark:[0,0,2048,512],campaign:[0,512,1536,384],entry:[0,896,2048,128]};
export function avenueAtlas(){
 const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=1024;const c=canvas.getContext('2d');
 c.textAlign='center';c.textBaseline='middle';c.fillStyle='#ed263c';c.font='italic bold 407px Georgia, serif';c.fillText('Avenue',1024,257,1890);
 c.fillStyle='#eee8dc';c.fillRect(0,512,1536,384);c.fillStyle='#bd1532';c.font='italic bold 286px Georgia, serif';c.fillText('Avenue',768,695,1400);
 c.fillStyle='#152329';c.fillRect(0,896,2048,128);c.fillStyle='#d4c6a5';c.font='54px Arial, sans-serif';c.fillText('1472  •  BROADWAY  •  TIMES SQUARE',1024,960,1920);
 return {canvas,cells:CELLS};
}
const material=(type,body,uniforms={},translucent=false)=>new Material({fabric:{type,uniforms,source:`czm_material czm_getMaterial(czm_materialInput materialInput){vec2 uv=materialInput.st;czm_material m=czm_getDefaultMaterial(materialInput);m.diffuse=vec3(.003);${body}return m;}`},translucent});
export function addAvenue(viewer,collision){
 const g=createAvenueGeometry();collision.addStatic('avenue-fashion-corner',g.collision);
 addBatches(viewer,g.batches,false,false,architectureNightAppearance(g.night));addBatches(viewer,g.emissive);addBatches(viewer,g.paving,true);
 const glass=material('AvenueCurtainGlass',`float reflection=smoothstep(.66,.8,fract(uv.x*.13+uv.y*.031));float pane=step(.08,fract(uv.x/2.1))*step(.1,fract(uv.y/4.3));m.emission=mix(vec3(.022,.044,.048),vec3(.063,.113,.103),reflection)*(.6+.4*pane);m.alpha=1.0;`);
 addFaces(viewer,g.glass,glass,(f,u,v)=>[f.s0+u*(f.s1-f.s0),f.bottom+v*f.height]);
 const windows=material('AvenueWarmRetail',`float shade=floor(uv.x)/100.0;uv.x=fract(uv.x)/.98;vec3 texel=texture(image,uv).rgb;float reflection=step(.80,fract(uv.x*8.0+uv.y*.4));m.emission=texel*shade+vec3(.021,.037,.043)*reflection;m.alpha=1.0;`,{image:'/storefronts/retail-interiors-atlas.webp'});
 addFaces(viewer,g.interiors,windows,(f,u,v)=>{const t=(f.s0+u*(f.s1-f.s0)-f.from)/(f.to-f.from);return [(f.row?29:43)+((.012+t*.97)/3)*.98,.01+v*.98];});
 const leds=material('AvenueFashionCollage',`vec3 texel=texture(image,uv).rgb;m.emission=texel*.69;m.alpha=1.0;`,{image:'/billboards/avenue-fashion-collage.webp'});
 addFaces(viewer,g.screens,leds,(f,u,v)=>{const t=(f.s0+u*(f.s1-f.s0)-f.from)/(f.to-f.from),a=f.crop;return [a[0]+(.001+t*.998)*(a[2]-a[0]),a[1]+(.002+v*.996)*(a[3]-a[1])];});
 const atlas=avenueAtlas(),signs=material('AvenueRetailSigns',`float shade=floor(uv.x)/100.0;uv.x=fract(uv.x)/.98;vec4 texel=texture(image,uv);if(texel.a<.18)discard;m.emission=texel.rgb*shade;m.alpha=1.0;`,{image:Material.DefaultImageId});signs.uniforms.image=atlas.canvas;
 addFaces(viewer,g.labels,signs,(f,u,v)=>{const t=(f.s0+u*(f.s1-f.s0)-f.from)/(f.to-f.from),[x,y,w,h]=atlas.cells[f.kind];return [Math.round(f.shade*100)+((x+2+t*(w-4))/2048)*.98,(1024-y-h+2+v*(h-4))/1024];});
 const glow=material('AvenueEntranceGlow','vec2 q=uv-.5;m.emission=vec3(.46,.31,.18);m.alpha=exp(-dot(q,q)*15.0)*.11;',{},true);addFaces(viewer,g.pools,glow,(f,u,v)=>[u,v],true);
 return {facets:19,screenGroups:6,bollards:g.posts.length,doors:g.doors.length,signs:g.labels.length};
}
