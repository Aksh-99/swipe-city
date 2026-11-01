// Anchor at the actual trunk foot, not the centre of the canopy bounds.
export function groundTreeGeometry(positions){
 let ground=Infinity;for(let i=1;i<positions.length;i+=3)ground=Math.min(ground,positions[i]);
 let x=0,z=0,count=0;
 for(let i=0;i<positions.length;i+=3)if(positions[i+1]<=ground+.01){x+=positions[i];z+=positions[i+2];count++;}
 x/=count;z/=count;const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
 for(let i=0;i<positions.length;i+=3){positions[i]-=x;positions[i+1]-=ground;positions[i+2]-=z;for(let c=0;c<3;c++){min[c]=Math.min(min[c],positions[i+c]);max[c]=Math.max(max[c],positions[i+c]);}}
 return {min,max};
}
