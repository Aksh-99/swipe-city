import data from '../public/data/nasdaq.json' with {type:'json'};
export const NASDAQ=data;
export const NASDAQ_WINDOWS=Array.from({length:30},(_,i)=>({
 s:(i%6+.5)*data.length/6+(Math.floor(i/6)%2?.24:0),
 z:23.5+Math.floor(i/6)*4.5,width:1.18,height:1.30,
}));

export function nasdaqReplacesScreen(screen){
 const surfaces=[...data.wrap.map(f=>({center:f.a.map((v,i)=>(v+f.b[i])/2),normal:f.normal,width:f.length,height:data.screenTop})),...data.returns];
 return surfaces.some(f=>{
  const n=f.normal,d=screen.center.map((v,i)=>v-f.center[i]);
  return Math.abs(n[0]*screen.normal[0]+n[1]*screen.normal[1])>.96&&
   Math.abs(d[0]*n[0]+d[1]*n[1])<2.5&&
   Math.abs(-d[0]*n[1]+d[1]*n[0])<(f.width+screen.width)/2&&
   screen.center[2]-screen.height/2<f.height;
 });
}
