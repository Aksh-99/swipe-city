import data from '../public/data/report-streets.json' with {type:'json'};
const segmentDistance=([x,y],{a,b})=>{
 const dx=b[0]-a[0],dy=b[1]-a[1],length=dx*dx+dy*dy;
 const t=length?Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/length)):0;
 return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy);
};
export function reportLocation(position){
 let street=null,avenue=null;
 for(const segment of data.segments){const distance=segmentDistance(position,segment),best=segment.kind==='street'?street:avenue;if(!best||distance<best.distance){const next={name:segment.name,distance};if(segment.kind==='street')street=next;else avenue=next;}}
 return `Times Square · near ${street?.name??'the pedestrian plazas'}${avenue&&avenue.distance<=25?' / '+avenue.name:''}`;
}
