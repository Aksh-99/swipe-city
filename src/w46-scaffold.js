import {Vector3} from 'three';
import extension from '../public/data/w46-scaffold.json' with {type:'json'};
// Street-view sidewalk shed: structural steel, corrugated deck and a protected walking tunnel.
export const W46_SCAFFOLD_EXTENSION=extension.fronts;
export function buildW46Scaffold(mesh,glow,f){
 const c=new Vector3(...f.center),n=new Vector3(...f.normal),r=new Vector3(-n.y,n.x,0),w=f.width,p=(x,y,z)=>c.clone().addScaledVector(r,x).addScaledVector(n,y).setZ(z),box=(x,y,z,a,d,h,col,solid=false)=>mesh.box(p(x,y,z),r,n,a,d,h,col,solid),tube=(x,y,z,X,Y,Z,radius=.035,col='#a4ada6',solid=false)=>mesh.tube(p(x,y,z),p(X,Y,Z),radius,col,solid,8);
 const roof=4.15,outer=2.4;let posts=0,braces=0;
 box(0,1.15,roof,w,2.75,.12,'#777f75',true);
 box(0,outer+.08,roof+.16,w,.12,.36,'#294c41');
 for(let x=-w/2+.15;x<w/2;x+=.25)box(x,1.15,roof-.08,.045,2.7,.07,'#a0a59a');
 for(let x=-w/2+.16;x<w/2;x+=2.5){const end=Math.min(x+2.5,w/2-.04);posts++;
  for(const y of [.14,outer]){tube(x,y,.17,x,y,roof+.15,.052,'#b5bcb3',true);box(x,y,.23,.26,.26,.12,'#7a8177',true);for(const z of [1.75,2.35,3.9]){box(x,y,z,.14,.14,.07,'#7d8a7d');}}
  for(const z of [1.15,2.35,3.9])tube(x,outer,z,end,outer,z);
  if(posts%3===1){for(const z of [.4,2.15])tube(x,outer,z,end,outer,z,.025);for(let k=-1.7;k<end-x;k+=.28){const a=Math.max(0,k),b=Math.min(end-x,k+1.7);if(b>a){tube(x+a,outer,.4+a-k,x+b,outer,.4+b-k,.008,'#929c90');tube(end-a,outer,.4+a-k,end-b,outer,.4+b-k,.008,'#929c90');}}}
  tube(x,outer,.4,end,outer,3.9);tube(x,outer,3.9,end,outer,.4);braces+=2;
  tube(x,.14,roof-.3,x,outer,roof-.3,.055);tube(x,.14,roof-.8,x,outer,roof-.3);
  for(const z of [roof+.23,roof+1.13])tube(x,outer,z,end,outer,z,.03,'#294c41');tube(x,outer,roof,x,outer,roof+1.15,.035,'#294c41');
  glow.box(p(x+.7,1.1,roof-.17),r,n,1.2,.10,.05,'#dbe6cc');
 }
 const walkways=[];for(let x=-w/2+.8;x<w/2-.6;x+=.7)walkways.push(p(x,1.15,.17));
 return {posts,braces,walkways,roof};
}
