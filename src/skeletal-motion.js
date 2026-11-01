import {sampleRigPose} from './rig-pose.js';
import {RIG_LOADERS} from './rig-manifest.js';
import {createTaskQueue} from './resource-loading.js';
export {SKELETAL_BONES} from './rig-manifest.js';
const rigKey=(design,character)=>design+(character==='pedestrian'?'_officer':'');
// Share downloads, bound concurrent parsing, and allow retries after failures.
export function createRigStore(loaders,{concurrency=2,timeoutMs=30000}={}){
 const loaded=new Map(),pending=new Map(),schedule=createTaskQueue(concurrency);
 return {
  has:key=>Object.hasOwn(loaders,key),get:key=>loaded.get(key),
  load(key){
   if(loaded.has(key))return Promise.resolve(loaded.get(key));
   if(pending.has(key))return pending.get(key);
   if(!Object.hasOwn(loaders,key))return Promise.reject(new Error('Unknown character animation: '+key));
   const promise=schedule(async()=>{
    let timer;
    try{
     const module=await Promise.race([Promise.resolve().then(loaders[key]),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Character animation timed out: '+key)),timeoutMs);})]);
     const data=module.default??module;
     if(!data?.nodes||!data.clips?.walking||!data.clips?.running)throw new Error('Invalid character animation: '+key);
     loaded.set(key,data);return data;
    }finally{clearTimeout(timer);}
   }).finally(()=>pending.delete(key));
   pending.set(key,promise);return promise;
  }
 };
}
const rigs=createRigStore(RIG_LOADERS);
export const usesSkeletalRig=(design,character)=>rigs.has(rigKey(design,character));
export const skeletalRigReady=(design,character)=>!!rigs.get(rigKey(design,character));
export const loadSkeletalRig=(design,character)=>rigs.load(rigKey(design,character));
export const skeletalPose=(player,design,character)=>{
 const data=rigs.get(rigKey(design,character));
 return data?sampleRigPose(data,player):{};
};
