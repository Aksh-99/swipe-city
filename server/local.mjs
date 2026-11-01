import {createServer} from 'node:http';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {networkInterfaces} from 'node:os';
import {createSQLiteStore} from './sqlite-store.mjs';
import {createRoomsHandler} from './rooms.js';

export async function createLocalServer({port=8787,host='0.0.0.0',databasePath=resolve('.local/rooms.sqlite'),now=Date.now,chooseRole}={}){
 const store=createSQLiteStore(databasePath),rooms=createRoomsHandler({now,chooseRole});
 const server=createServer(async(req,res)=>{
  try{
   let length=0;const chunks=[];
   for await(const chunk of req){length+=chunk.length;if(length>4096){res.writeHead(413,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Request too large.',code:'INVALID_REQUEST'}));return;}chunks.push(chunk);}
   // Vite keeps the original Host/Origin when proxying /api, preserving the
   // browser's same-origin policy on localhost and on a LAN IP address.
   const url=new URL(req.url??'/',`http://${req.headers.host}`),headers=new Headers();
   for(const [name,value]of Object.entries(req.headers))if(value!==undefined)headers.set(name,Array.isArray(value)?value.join(','):value);
   const request=new Request(url,{method:req.method,headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})});
   const response=await rooms(request,{DB:store.db})??new Response('Room API only. Open the Vite client on port 5173.',{status:404});
   res.writeHead(response.status,Object.fromEntries(response.headers));res.end(req.method==='HEAD'?undefined:Buffer.from(await response.arrayBuffer()));
  }catch(error){console.error('Local room service error:',error.name);if(!res.headersSent)res.writeHead(500,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Local room service interrupted.',code:'SERVICE_ERROR'}));}
 });
 try{await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,host,resolve);});}catch(error){store.close();throw error;}
 return {server,store,port:server.address().port,async close(){await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});store.close();}};
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
 const port=Number(process.env.MP_PORT??8787);if(!Number.isInteger(port)||port<1||port>65535)throw new Error('MP_PORT must be 1–65535');
 const app=await createLocalServer({port,databasePath:resolve(process.env.MP_DATABASE??'.local/rooms.sqlite')});
 console.log(`Times Square multiplayer API: http://localhost:${app.port}`);
 console.log('Start the client in another terminal: npm run dev');
 console.log('Four local windows: http://localhost:5173/?dev=1');
 try{for(const info of Object.values(networkInterfaces()).flat())if(info?.family==='IPv4'&&!info.internal)console.log(`LAN clients: http://${info.address}:5173/?dev=1`);}catch{console.log('LAN clients: use http://<server-LAN-IP>:5173/?dev=1');}
 for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>app.close().then(()=>process.exit(0)));
}
