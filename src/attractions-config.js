import data from '../public/data/42nd-attractions.json' with {type:'json'};
export const ATTRACTIONS=data;
export const ATTRACTION_PLACES=data.places;
export function attractionReplacesScreen(screen){return data.facades.some(f=>{
 const [nx,ny]=f.normal,dx=screen.center[0]-f.center[0],dy=screen.center[1]-f.center[1];
 return Math.abs(nx*screen.normal[0]+ny*screen.normal[1])>.94&&Math.abs(dx*nx+dy*ny)<5&&Math.abs(-dx*ny+dy*nx)<(f.width+screen.width)/2&&screen.center[2]-screen.height/2<f.bottom+f.height&&screen.center[2]+screen.height/2>f.bottom;
});}
