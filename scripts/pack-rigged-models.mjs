// Compress release copies only. Every decoded buffer must match the source byte for byte.
import fs from 'node:fs';
import {MeshoptEncoder,MeshoptDecoder} from 'meshoptimizer';
export async function packRiggedModels(directory){
 await Promise.all([MeshoptEncoder.ready,MeshoptDecoder.ready]);
 let before=0,after=0;
 for(const name of fs.readdirSync(directory).filter(n=>n.endsWith('-meshy.glb'))){
  const path=directory+'/'+name,bytes=fs.readFileSync(path),length=bytes.readUInt32LE(12);
  const g=JSON.parse(bytes.subarray(20,20+length)),bin=bytes.subarray(28+length);
  if(g.extensionsRequired?.includes('EXT_meshopt_compression'))continue;
  const indexViews=new Set(g.meshes.flatMap(m=>m.primitives.map(p=>g.accessors[p.indices]?.bufferView)));
  const parts=[];let offset=0,fallback=0;
  const put=data=>{const pad=-offset&3;parts.push(Buffer.alloc(pad));offset+=pad;const start=offset;parts.push(Buffer.from(data));offset+=data.length;return start;};
  for(let i=0;i<g.bufferViews.length;i++){
   const view=g.bufferViews[i],raw=bin.subarray(view.byteOffset??0,(view.byteOffset??0)+view.byteLength);
   const a=g.accessors.find(a=>a.bufferView===i);
   const stride=a?(view.byteStride??({5126:4,5125:4,5123:2,5121:1}[a.componentType]*{SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16}[a.type])):0;
   const mode=indexViews.has(i)?'INDICES':'ATTRIBUTES';
   if(stride && raw.length%stride===0 && (mode==='INDICES'||stride%4===0)){
    const count=raw.length/stride,encoded=MeshoptEncoder.encodeGltfBuffer(raw,count,stride,mode),decoded=new Uint8Array(raw.length);
    MeshoptDecoder.decodeGltfBuffer(decoded,count,stride,encoded,mode);
    if(!Buffer.from(decoded).equals(raw))throw new Error('Lossless verification failed: '+name+' view '+i);
    if(encoded.length<raw.length){
     const start=put(encoded);fallback=(fallback+3)&~3;view.buffer=1;view.byteOffset=fallback;fallback+=raw.length;
     view.extensions={...(view.extensions??{}),EXT_meshopt_compression:{buffer:0,byteOffset:start,byteLength:encoded.length,byteStride:stride,count,mode}};
     continue;
    }
   }
   view.buffer=0;view.byteOffset=put(raw);
  }
  parts.push(Buffer.alloc(-offset&3));const binary=Buffer.concat(parts);
  g.buffers=[{byteLength:binary.length},{byteLength:fallback,extensions:{EXT_meshopt_compression:{fallback:true}}}];
  g.extensionsUsed=[...new Set([...(g.extensionsUsed??[]),'EXT_meshopt_compression'])];
  g.extensionsRequired=[...new Set([...(g.extensionsRequired??[]),'EXT_meshopt_compression'])];
  let json=Buffer.from(JSON.stringify(g));json=Buffer.concat([json,Buffer.alloc(-json.length&3,32)]);
  const header=Buffer.alloc(20),bh=Buffer.alloc(8);header.write('glTF');header.writeUInt32LE(2,4);header.writeUInt32LE(28+json.length+binary.length,8);header.writeUInt32LE(json.length,12);header.writeUInt32LE(0x4e4f534a,16);bh.writeUInt32LE(binary.length);bh.writeUInt32LE(0x004e4942,4);
  const packed=Buffer.concat([header,json,bh,binary]);fs.writeFileSync(path,packed);before+=bytes.length;after+=packed.length;
 }
 console.log(`Lossless roster packing: ${(before/1048576).toFixed(1)} → ${(after/1048576).toFixed(1)} MiB`);
}
