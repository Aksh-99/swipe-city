import {Vector3} from 'three';
import data from '../public/data/office-grid.json' with {type:'json'};
export const OFFICE_GRID=data;
export function addOfficeGrid(mesh,curtain){
 const g=data,c=new Vector3(...g.center),n=new Vector3(...g.normal),r=new Vector3(-n.y,n.x,0),height=g.top-g.bottom;
 const p=(x,y,z)=>c.clone().addScaledVector(r,x).addScaledVector(n,y).setZ(z);
 curtain.push({center:p(0,.22,(g.top+g.bottom)/2),normal:n,right:r,width:g.width,height,fullOfficeGrid:true});
 const box=(x,y,z,w,d,h,color)=>mesh.box(p(x,y,z),r,n,w,d,h,color);
 // A single continuous grid phase covers the complete measured face. The
 // outer frame terminates on its real edges/roof rather than a guessed box.
 for(let x=-g.width/2;x<=g.width/2;x+=g.bayWidth)box(x,.28,(g.top+g.bottom)/2,.050,.12,height,'#67797e');
 box(g.width/2,.28,(g.top+g.bottom)/2,.050,.12,height,'#67797e');
 for(let z=g.bottom;z<=g.top;z+=g.floorHeight)box(0,.28,z,g.width,.13,.10,'#6c7b80');
 box(0,.28,g.top,g.width,.13,.10,'#6c7b80');
}
