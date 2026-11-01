import { readFile,writeFile } from 'node:fs/promises';
import { Vector3 } from 'three';
import { CollisionWorld } from '../src/collision.js';
const manifest=JSON.parse(await readFile('public/data/nyc/manifest.json'));
globalThis.fetch=async url=>new Response(await readFile('public'+url));
const c=new CollisionWorld(manifest.files);c.radius=280;await c.stream(new Vector3(0,-60,0));
const screens=[],up=new Vector3(0,0,1);
function screen(name,center,normal,width,height,ad,atlas='portrait',mount='surveyed facade'){
 screens.push({name,center:center.toArray(),normal:normal.toArray(),width,height,ad,atlas,mount});
}
// Sign stack belongs on the recessed upper tower, behind the street podium.
// Surveyed upper face spans z68..102 and lateral -11..3m from the ray hit.
const towerNormal=new Vector3(.494372,.869250,0).normalize();
const towerRight=new Vector3().crossVectors(up,towerNormal);
const towerFront=new Vector3(-90.968,-198.612,0).addScaledVector(towerRight,-4).addScaledVector(towerNormal,.35);
for(const [z,ad] of [[74.8,3],[84.8,5],[94.8,4]])
 screen('One Times Square · north sign stack',towerFront.clone().setZ(z),towerNormal,10.5,9.6,ad,'portrait','recessed upper tower facade');
// Fit each lower screen to the actual triangle plane; all corners must be
// supported. The explicit clusters follow the Bow Tie, not a city-wide scatter.
function fit(name,from,dir,z,w,h,ad,atlas='portrait'){
 const direction=new Vector3(...dir,0).normalize(),bottom=z-h/2;
 for(const height of [h,h*.72,h*.5]){
  const origin=new Vector3(...from,bottom+height/2),hit=c.ray(origin,direction,90);
  if(!hit||Math.abs(hit.face.normal.z)>.12)continue;
  const normal=hit.face.normal.clone().setZ(0).normalize();if(normal.dot(direction)>0)normal.negate();
  const right=new Vector3().crossVectors(up,normal).normalize();
  for(const width of [w,w*.8,w*.65]){
   let projection=.3;
   const ok=[[-.5,-.5],[.5,-.5],[-.5,.5],[.5,.5],[0,0]].every(([x,y])=>{
    const point=hit.point.clone().addScaledVector(right,x*width).addScaledVector(up,y*height).addScaledVector(normal,5);
    const support=c.ray(point,normal.clone().negate(),20);
    if(!support||support.distance<.5||Math.abs(support.face.normal.z)>.25)return false;
    projection=Math.max(projection,5-support.distance+.3);return true;
   });
   if(ok){screen(name,hit.point.clone().addScaledVector(normal,projection),normal,width,height,ad,atlas,'facade-supported sign structure');return;}
  }
 }
}
const east=[.87,-.493],west=[-.87,.493];
// Deliberately authored billboard clusters at 1500/1501/1515 Broadway and
// the lower Broadway / Seventh Avenue facades. Ads are fictional artwork.
const layouts=[
 ['1500 Broadway / east plaza',[-7,-20],east,24,19,32,3],
 ['1500 Broadway / east plaza',[-16,-42],east,24,18,32,0],
 ['1500 Broadway / east plaza',[-25,-65],east,22,19,29,1],
 ['1500 Broadway / upper sign',[-20,-48],east,53,22,22,6],
 ['1515 Broadway / One Astor Plaza',[-13,-30],west,23,19,30,4],
 ['1515 Broadway / One Astor Plaza',[-25,-55],west,24,20,32,2],
 ['1515 Broadway / One Astor Plaza',[-40,-86],west,24,19,32,3],
 ['1515 Broadway / upper sign',[-26,-60],west,54,18,24,7],
 ['1515 Broadway / north frontage',[0,6],west,20,24,26,5],
 ['1515 Broadway / north frontage',[10,30],west,22,24,30,1],
 ['1515 Broadway / upper sign',[4,18],west,54,22,24,0],
 ['East plaza / 45th Street',[8,13],east,24,19,32,4],
 ['East plaza / 45th Street',[18,36],east,24,19,32,7],
 ['East plaza / upper sign',[14,25],east,54,22,24,3],
 ['Broadway / 43rd Street',[-45,-108],east,23,18,30,5],
 ['Broadway / 43rd Street',[-53,-133],east,23,16,30,6],
 ['Seventh Avenue / southern frontage',[-57,-132],west,24,16,30,0],
 ['3 Times Square / corner',[-65,-154],west,22,14,26,7],
 ['Marriott Marquis / 45th–46th',[19,59],west,21,54,21,2,'landscape'],
 ['Marriott Marquis / Broadway',[34,89],west,21,35,21,0,'landscape'],
];
for(const args of layouts)fit(...args);
// Thin horizontal ribbons below the large screens echo Times Square's tickers.
for(const [name,from,dir] of layouts.filter((x,i)=>i%2===0))fit(name+' / lower ribbon',from,dir,5.7,25,2.5,2,'landscape');

// Large Times Square signs often sit on a low retail podium in front of the
// recessed tower. Their steel supports are attached to a surveyed podium face;
// requiring a tall planar tower wall would incorrectly omit these landmarks.
function podium(name,from,dir,width,height,bottom,ad,atlas='portrait'){
 const direction=new Vector3(...dir,0).normalize(),hit=c.ray(new Vector3(...from,8),direction,75);
 if(!hit||Math.abs(hit.face.normal.z)>.1)return;
 const normal=hit.face.normal.clone().setZ(0).normalize();if(normal.dot(direction)>0)normal.negate();
 const right=new Vector3().crossVectors(up,normal);
 for(const w of [width,width*.8,width*.65]){
  const supported=[-.5,0,.5].every(t=>{
   const p=hit.point.clone().addScaledVector(right,w*t).addScaledVector(normal,4);
   const h=c.ray(p,normal.clone().negate(),12);return h&&Math.abs(h.face.normal.z)<.2;
  });
  if(!supported)continue;
  const center=hit.point.clone().setZ(bottom+height/2).addScaledVector(normal,.6);
  if(screens.some(s=>s.mount==='podium sign gantry'&&new Vector3(...s.center).distanceTo(center)<w*.55))return;
  // Replace overlapping small displays at this same support face.
  for(let i=screens.length-1;i>=3;i--){const p=new Vector3(...screens[i].center);if(p.clone().setZ(0).distanceTo(center.clone().setZ(0))<w*.45&&screens[i].height>4&&screens[i].center[2]<35)screens.splice(i,1);}
  screen(name,center,normal,w,height,ad,atlas,'podium sign gantry');return;
 }
}
podium('East Bow Tie / 1540 Broadway',[-5,-12],east,23,32,8,3);
podium('East Bow Tie / 1530 Broadway',[-16,-40],east,23,38,8,0);
podium('East Bow Tie / 1530 Broadway',[-25,-65],east,22,30,8,1);
podium('1500 Broadway / west facade',[-42,-98],east,21,34,8,6);
podium('1500 Broadway / west facade',[-51,-123],east,18,29,8,5);
podium('1515 Broadway / One Astor Plaza',[-12,-25],west,22,34,8,4);
podium('1515 Broadway / One Astor Plaza',[-25,-55],west,22,32,8,2);
podium('1501 Broadway / Paramount frontage',[-40,-86],west,22,29,8,3);
podium('1501 Broadway / Paramount frontage',[-49,-110],west,22,27,8,7);
podium('3 Times Square / corner',[-64,-147],west,21,32,8,0);
podium('Marriott Marquis / Broadway spectacular',[24,67],west,58,23,12,2,'landscape');
podium('Marriott Marquis / Broadway spectacular',[44,102],west,37,23,12,0,'landscape');
podium('East Bow Tie / 45th Street',[8,13],east,22,36,8,4);
podium('East Bow Tie / 46th Street',[22,46],east,21,36,8,7);

// Duffy Square: screen collages framing the red steps in the north-facing view.
podium('Duffy Square / west theater collage',[37,101],west,24,33,8,2);
podium('Duffy Square / west theater collage',[45,124],west,23,34,8,3);
podium('Duffy Square / west theater collage',[55,147],west,22,33,8,0);
podium('Duffy Square / east collage',[37,101],east,24,36,8,4);
podium('Duffy Square / east collage',[45,124],east,23,36,8,1);
podium('Duffy Square / east collage',[55,147],east,20,35,8,6);
podium('Duffy Square / north sign tower',[47,128],[.348,.938],17,61,9,7);

// Extend the illuminated district onto additional Broadway buildings and the
// street-facing returns at 42nd, 45th, 46th, 47th and 48th. Each new envelope is
// ray-fitted to source facade triangles, with no stand-in building geometry.
const beforeExpansion=screens.length;
for(const args of [
 ['Broadway / 48th west frontage',[66,207],west,23,32,8,1],
 ['Broadway / 48th east frontage',[82,203],east,24,34,8,5],
 ['Broadway / 49th west frontage',[101,273],west,25,35,8,6],
 ['Seventh Avenue / 48th east frontage',[117,220],east,24,31,8,0],
 ['42nd Street / southern west frontage',[-113,-239],west,24,34,8,7],
 ['42nd Street / southern east frontage',[-103,-237],east,22,30,8,2],
])podium(...args);
const north=[.493,.870],south=[-.493,-.870];
for(const args of [
 ['45th Street / east building return',[71,-39],north,19,21,24,5],
 ['45th Street / west building return',[-75,37],south,21,24,26,1],
 ['46th Street / east theater return',[102,29],north,20,23,27,7],
 ['46th Street / west theater return',[-70,124],south,19,25,23,0],
 ['47th Street / east corner collage',[122,107],north,22,24,28,2],
 ['47th Street / west corner collage',[-32,193],south,19,22,25,6],
 ['48th Street / north building return',[65,235],north,24,22,30,3],
 ['42nd Street / east building return',[-42,-263],north,21,24,25,4],
])fit(...args);
// Avoid screens occupying the same physical plane as an existing spectacular.
for(let i=screens.length-1;i>=beforeExpansion;i--){
 const s=screens[i],n=new Vector3(...s.normal),r=new Vector3().crossVectors(up,n);
 if(screens.slice(0,i).some(other=>{const d=new Vector3(...s.center).sub(new Vector3(...other.center));return new Vector3(...other.normal).dot(n)>.97&&Math.abs(d.dot(n))<1.5&&Math.abs(d.dot(r))<(s.width+other.width)*.44&&Math.abs(d.z)<(s.height+other.height)*.44;}))screens.splice(i,1);
}
// Turn selected wide structures into framed montages of individual posters,
// preserving their total envelope and attachment to the actual facade.
for(let i=screens.length-1;i>=3;i--){
 const s=screens[i];if(s.height<25||(!s.name.includes('north sign tower')&&s.width<16)||s.atlas!=='portrait')continue;
 const n=new Vector3(...s.normal),r=new Vector3().crossVectors(up,n),center=new Vector3(...s.center);
 const north=s.name.includes('north sign tower'),cols=north?1:2,rows=north?4:2,gap=.42;
 screens.splice(i,1);
 for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
  const width=(s.width-gap*(cols-1))/cols,height=(s.height-gap*(rows-1))/rows;
  const at=center.clone().addScaledVector(r,(col-(cols-1)/2)*(width+gap)).addScaledVector(up,(row-(rows-1)/2)*(height+gap));
  screen(s.name+' / poster '+(row*cols+col+1),at,n,width,height,(s.ad+row*cols+col*3)%8,'portrait',s.mount);
 }
}
await writeFile('public/data/landmarks.json',JSON.stringify({description:'Reference-guided sign layout on original NYC geometry. Historical facade/sign reconstruction with fictional ads, not a current measured signage survey.',reference:'User-supplied Times Square night photograph; One Times Square; Clear Channel 1535 Broadway sign specification, 2014.',screens},null,2)+'\n');
console.log(JSON.stringify({screenCount:screens.length,byLandmark:screens.map(s=>({name:s.name,width:s.width,center:s.center.map(x=>+x.toFixed(1))}))},null,2));
