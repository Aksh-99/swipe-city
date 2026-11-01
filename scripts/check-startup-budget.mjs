import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
const base='dist/client/',manifest=JSON.parse(readFileSync(base+'.vite/manifest.json'));
const roots=Object.keys(manifest).filter(key=>manifest[key].isEntry||key==='src/main.js');
assert(roots.includes('src/main.js'),'main game must be present in the manifest');
const initial=new Set();
function visit(key){if(initial.has(key))return;initial.add(key);for(const dep of manifest[key]?.imports??[])visit(dep);}
roots.forEach(visit);
const motion=Object.keys(manifest).filter(key=>/motion-[^/]+\.json$/.test(key)||/motion-[^/]+\.js$/.test(manifest[key].file));
assert.equal(motion.length,20,'all twenty animations must remain independently available');
assert.equal(motion.filter(key=>initial.has(key)).length,0,'no animation may enter the static game import graph');
const bytes=key=>gzipSync(readFileSync(base+manifest[key].file)).length;
const total=motion.reduce((n,key)=>n+bytes(key),0),sizes=motion.map(bytes);
console.log(JSON.stringify({animationPacks:motion.length,initialAnimationPacks:0,allAnimationGzipBytes:total,selectedAnimationGzipBytes:{min:Math.min(...sizes),max:Math.max(...sizes)},avoidedAnimationDownloadPercent:Math.round((1-Math.max(...sizes)/total)*100)},null,2));
