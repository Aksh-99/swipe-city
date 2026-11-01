import {TRANSPORT_PORTALS} from './transport-config.js';
import streets from './mta-streets.json' with {type:'json'};
export const MTA_BUSES=TRANSPORT_PORTALS.filter(p=>p.kind==='bus');
export const MTA_STREETS=Array.from({length:7},(_,i)=>42+i);
const xy=p=>Array.isArray(p)?p:[p.x,p.y];
export const stopPosition=stop=>stop.doors[0].approach;
export const distance=(a,b)=>{a=xy(a);b=xy(b);return Math.hypot(a[0]-b[0],a[1]-b[1]);};
export function streetDistance(position,street){
 const p=xy(position);let best=Infinity;
 for(const line of streets[street]??[])for(let i=1;i<line.length;i++){
  const a=line[i-1],b=line[i],dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy||1)));
  best=Math.min(best,Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy));
 }
 return best;
}
export const stopStreet=stop=>MTA_STREETS.reduce((best,n)=>streetDistance(stopPosition(stop),n)<streetDistance(stopPosition(stop),best)?n:best,42);
export function planBusTrip(position,street,buses=MTA_BUSES){
 if(!position||!MTA_STREETS.includes(Number(street))||!buses.length)return null;
 street=Number(street);
 const destination=[...buses].sort((a,b)=>streetDistance(stopPosition(a),street)-streetDistance(stopPosition(b),street))[0];
 if(streetDistance(position,street)<18)return {street,destination,stops:[],arrived:true};
 if(distance(position,stopPosition(destination))<70)return {street,destination,stops:[],walking:true,arrived:false};
 // Choose a reachable boarding bus using the actual directed portal loop.
 const choices=[];
 for(const board of buses){const stops=[board],seen=new Set([board.id]);let current=board;
  while(current.id!==destination.id){current=buses.find(p=>p.id===current.nextId);if(!current||seen.has(current.id))break;seen.add(current.id);stops.push(current);}
  if(current?.id===destination.id&&stops.length>1)choices.push({board,stops,score:distance(position,stopPosition(board))+(stops.length-1)*25});
 }
 choices.sort((a,b)=>a.score-b.score);
 return choices.length?{street,destination,...choices[0],arrived:false}:null;
}
