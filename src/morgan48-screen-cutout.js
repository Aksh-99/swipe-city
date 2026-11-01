import{west48Local}from'./west48-config.js';
export const MORGAN48_SCREEN_CUTOUT=[[189.98,201.46],[66.16,70.86],[7.02,29.18]];
const q=p=>{const a=west48Local(p);return[a.t,a.d,p[2]];};
function clip(poly,dist,inside){const out=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],da=dist(a),db=dist(b),ia=inside?da>=0:da<=0,ib=inside?db>=0:db<=0;if(ia)out.push(a);if(ia!==ib)out.push(a.map((v,j)=>v+(b[j]-v)*da/(da-db)));}return out;}
// Subtract only the display opening from authored facade details. The NYC
// building and its collision stay intact behind the screen.
export function cutMorgan48Screen(input){const out=[];for(let i=0;i<input.length;i+=9){const tri=[0,1,2].map(j=>Array.from(input.slice(i+j*3,i+j*3+3))),qs=tri.map(q);if(MORGAN48_SCREEN_CUTOUT.some(([lo,hi],j)=>qs.every(p=>p[j]<=lo)||qs.every(p=>p[j]>=hi))){out.push(...tri.flat());continue;}let remaining=tri;for(let axis=0;axis<3&&remaining.length>=3;axis++)for(const side of[0,1]){const edge=MORGAN48_SCREEN_CUTOUT[axis][side],dist=p=>(q(p)[axis]-edge)*(side?-1:1),outside=clip(remaining,dist,false);for(let j=1;j<outside.length-1;j++)out.push(...outside[0],...outside[j],...outside[j+1]);remaining=clip(remaining,dist,true);if(remaining.length<3)break;}}return out;}
