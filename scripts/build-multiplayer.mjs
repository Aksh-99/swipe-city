import {packRiggedModels} from './pack-rigged-models.mjs';
import {build as buildClient} from 'vite';
import {build as buildWorker} from 'esbuild';
import {rmSync,cpSync} from 'node:fs';
import {relative} from 'node:path';
rmSync('dist',{recursive:true,force:true});
await buildClient();
// Copy assets once, excluding superseded static copies from the release.
// Animation JSON is already bundled by Vite, so its static duplicate is unused.
// All original files remain in public/ for source integrity checks.
const superseded=new Set(['irish.glb','asian_fem_officer.glb','blonde_officer.glb','asian_fem.glb','indian.glb','white_male_officer.glb','african_fem.gltf','african_fem-part0.bin','african_fem-part1.bin','indian_officer.glb','asian_officer.glb','bald_officer.glb','indian_fem.glb','african.glb','white_male.glb','bald.glb','blonde.glb','irish_officer.glb','asian.glb','african_officer.glb','african_fem_officer.glb','indian_fem_officer.glb'].map(name=>'characters/'+name));
cpSync('public','dist/client',{recursive:true,filter:source=>{const name=relative('public',source);return !superseded.has(name)&&!(name.startsWith('data/')&&name.endsWith('-motion.json'));}});
await packRiggedModels('dist/client/characters');
await buildWorker({entryPoints:['server/worker.js'],outfile:'dist/server/index.js',bundle:true,format:'esm',platform:'browser',target:'es2022'});
