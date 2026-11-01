import {createRoomsHandler} from './rooms.js';
const rooms=createRoomsHandler();
export default {
 async fetch(request,env){
  const api=await rooms(request,env);if(api)return api;
  if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
  const path=new URL(request.url).pathname,documentRequest=path==='/'||path==='/index.html'||request.headers.get('Sec-Fetch-Dest')==='document'||request.headers.get('Accept')?.includes('text/html');
  // Never validate a cached document against a new release: a 304 can keep
  // references to hashed bundles that no longer exist.
  let assetRequest=request;if(documentRequest){const headers=new Headers(request.headers);headers.delete('If-None-Match');headers.delete('If-Modified-Since');assetRequest=new Request(request,{headers});}
  const asset=await env.ASSETS.fetch(assetRequest);
  const response=new Response(asset.body,asset);
  if(documentRequest||response.headers.get('Content-Type')?.includes('text/html')){response.headers.set('Cache-Control','no-store');response.headers.set('CDN-Cache-Control','no-store');response.headers.delete('ETag');response.headers.delete('Last-Modified');}
  return response;
 }
};
