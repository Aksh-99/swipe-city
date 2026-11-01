import parked from '../public/data/district-parking.json' with {type:'json'};
import police from '../public/data/police-vehicles.json' with {type:'json'};
export const stationaryVehicles=[...parked.vehicles,...police.vehicles].map((c,i)=>({id:'parked-'+i,position:{x:c.center[0],y:c.center[1],z:.04},heading:Math.atan2(c.forward[1],c.forward[0]),length:c.length,width:c.width,height:c.height??1.8,speed:0}));
export function vehicleContact(p,car,margin=.32,height=1.78){
 const base=car.position.z??0;if(p.z+height<=base||p.z>=base+(car.height??1.8))return null;
 const dx=p.x-car.position.x,dy=p.y-car.position.y,c=Math.cos(car.heading),s=Math.sin(car.heading);
 const x=dx*c+dy*s,y=-dx*s+dy*c,l=car.length/2+margin,w=(car.width??1.9)/2+margin;
 if(Math.abs(x)>l||Math.abs(y)>w)return null;
 return {x,y,l,w,c,s};
}
export function resolveVehicle(position,car,radius=.32,height=1.78){
 const hit=vehicleContact(position,car,radius,height);if(!hit)return false;
 const {x,y,l,w,c,s}=hit;let dx=0,dy=0;
 if(l-Math.abs(x)<w-Math.abs(y))dx=(x<0?-1:1)*(l-Math.abs(x)+.001);
 else dy=(y<0?-1:1)*(w-Math.abs(y)+.001);
 position.x+=dx*c-dy*s;position.y+=dx*s+dy*c;return true;
}
