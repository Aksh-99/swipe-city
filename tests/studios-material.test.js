import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
test('studio Fabric shaders only write fields supported by the installed Cesium material struct',async()=>{
 const struct=await readFile('node_modules/@cesium/engine/Source/Shaders/Builtin/Structs/material.glsl','utf8');
 const fields=new Set([...struct.matchAll(/\b(?:float|vec[234])\s+(\w+)\s*;/g)].map(m=>m[1]));
 assert(fields.has('shininess'));assert(!fields.has('roughness'));
 const source=await readFile('src/studios.js','utf8');const shaders=[...source.matchAll(/source:`([^`]+)`/g)];assert(shaders.length>=3);
 for(const [,shader] of shaders)for(const [,field] of shader.matchAll(/\bm\.(\w+)\s*=/g))assert(fields.has(field),`Unsupported czm_material field: ${field}`);
});
