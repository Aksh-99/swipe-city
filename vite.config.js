import { defineConfig } from 'vite';
import { cpSync, mkdirSync, readdirSync } from 'node:fs';
import {sites} from './build/sites-vite-plugin.ts';
const copyCesium = () => {
  mkdirSync('public/cesium', { recursive: true });
  for (const dir of ['Assets', 'Workers', 'Widgets', 'ThirdParty'])
    cpSync(`node_modules/cesium/Build/Cesium/${dir}`, `public/cesium/${dir}`, { recursive: true });
};
copyCesium();
export default defineConfig({plugins:[sites({mockAuth:false})],define:{CESIUM_BASE_URL:JSON.stringify('/cesium')},build:{manifest:true,copyPublicDir:false,outDir:'dist/client',chunkSizeWarningLimit:6000,rollupOptions:{output:{manualChunks:{engine:['cesium','three','three-mesh-bvh'],...Object.fromEntries(readdirSync('public/data').filter(name=>name.endsWith('-motion.json')&&name!=='hoodie-motion.json').map(name=>['motion-'+name.replace('-motion.json',''),['./public/data/'+name]]))}}}},server:{allowedHosts:['terminal.local'],port:5173,strictPort:true,proxy:{'/api':{target:process.env.MP_API_URL??'http://127.0.0.1:8787',changeOrigin:false}}}});
