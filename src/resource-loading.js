const sleep=ms=>new Promise(resolve=>globalThis.setTimeout(resolve,ms));
// Bound both the number of active downloads and each attempt's lifetime.
export function createTaskQueue(limit=4){
 let active=0;const waiting=[];
 const pump=()=>{while(active<limit&&waiting.length){const {task,resolve,reject}=waiting.shift();active++;Promise.resolve().then(task).then(resolve,reject).finally(()=>{active--;pump();});}};
 return task=>new Promise((resolve,reject)=>{waiting.push({task,resolve,reject});pump();});
}
export async function loadResource(url,{type='arrayBuffer',fetcher=(...args)=>globalThis.fetch(...args),attempts=3,timeoutMs=10000,wait=sleep,validate=()=>{},setTimer=(fn,ms)=>globalThis.setTimeout(fn,ms),clearTimer=id=>globalThis.clearTimeout(id)}={}){
 for(let attempt=0;attempt<attempts;attempt++){
  const controller=new AbortController();let expired=false;
  const timeout=setTimer(()=>{expired=true;controller.abort();},timeoutMs);
  try{
   const response=await fetcher(url,{signal:controller.signal});
   if(!response.ok)throw Object.assign(new Error(`Resource unavailable (${response.status}): ${url}`),{status:response.status});
   if(response.headers?.get('content-type')?.includes('text/html'))throw new Error(`Resource returned a page: ${url}`);
   const data=await response[type]();validate(data);return data;
  }catch(error){
   if(expired)error=new Error(`Resource request timed out: ${url}`);
   const permanent=error.status>=400&&error.status<500&&![408,429].includes(error.status);
   if(permanent||attempt===attempts-1)throw error;
  }finally{clearTimer(timeout);}
  await wait(250*2**attempt);
 }
}
