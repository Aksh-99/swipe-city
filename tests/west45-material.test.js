import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
test('45th Street Fabric material assignments match Cesium scalar and vector field types',async()=>{
 const struct=await readFile('node_modules/@cesium/engine/Source/Shaders/Builtin/Structs/material.glsl','utf8');const fields=new Map([...struct.matchAll(/\b(float|vec[234])\s+(\w+)\s*;/g)].map(m=>[m[2],m[1]]));let assignments=0;
 for(const file of ['src/west45.js','src/west45-corners.js','src/shubert-alley.js','src/east45.js','src/mcdonalds-corner.js','src/marriott-front.js','src/marriott-reference.js','src/paramount-corner-materials.js']){const source=await readFile(file,'utf8');for(const [,shader]of source.matchAll(/source:[`']([^`']+)[`']/g)){for(const [,field,value]of shader.matchAll(/\bm\.(\w+)\s*=\s*([^;]+);/g)){assignments++;assert(fields.has(field),file+': unsupported field '+field);if(fields.get(field)==='float')assert(!/\bvec[234]\s*\(/.test(value),file+': '+field+' requires a scalar');}}}
 assert(assignments>=14,'all corner and street material assignments inspected');
});
