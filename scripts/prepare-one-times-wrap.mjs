import{readFile,writeFile}from'node:fs/promises';import{Vector3}from'three';import{CollisionWorld}from'../src/collision.js';
globalThis.fetch=async u=>new Response(await readFile('public'+u));const w=new CollisionWorld(JSON.parse(await readFile('public/data/nyc/manifest.json')).files);w.radius=300;await w.stream(new Vector3(-85,-200,0));
const n=new Vector3(.49317,.86993,0).normalize(),r=new Vector3(-n.y,n.x,0),panels=[];
for(const [lo,hi,kind]of [[5,17,'chess'],[18,31,'danger'],[32,60,'coke'],[70,84,'samsung'],[85,101,'britbox']]){
 const z=(lo+hi)/2,upper=lo>=70,c=new Vector3(upper?-87.49:-78.635,upper?-200.59:-176.857,z);
 const hit=w.ray(c.clone().addScaledVector(n,4),n.clone().negate(),8,true);if(!hit)throw Error('front missing');
 const normal=hit.face.normal.clone().setZ(0).normalize();panels.push({kind,part:'front',center:hit.point.clone().addScaledVector(normal,.35).toArray(),normal:normal.toArray(),width:upper?10.5:9.8,height:hi-lo});
 for(const side of [-1,1]){const h=w.ray(c.clone().addScaledVector(n,-6).addScaledVector(r,side*35),r.clone().multiplyScalar(-side),40,true);const normal=h.face.normal.clone().setZ(0).normalize();panels.push({kind,part:'return',center:h.point.clone().addScaledVector(normal,.35).toArray(),normal:normal.toArray(),width:7.5,height:hi-lo});}
}
// Meet the front and return planes at shared corners, preserving source setbacks.
for(const front of panels.filter(p=>p.part==='front')){
 const sides=panels.filter(p=>p.kind===front.kind&&p.part==='return'),a=front.normal,da=a[0]*front.center[0]+a[1]*front.center[1];
 const corners=sides.map(s=>{const b=s.normal,db=b[0]*s.center[0]+b[1]*s.center[1],det=a[0]*b[1]-a[1]*b[0];return new Vector3((da*b[1]-a[1]*db)/det,(a[0]*db-da*b[0])/det,front.center[2]);});
 front.center=corners[0].clone().add(corners[1]).multiplyScalar(.5).toArray();front.width=corners[0].distanceTo(corners[1]);
 sides.forEach((s,i)=>{const dir=new Vector3(-s.normal[1],s.normal[0],0);if(dir.dot(new Vector3(...a))>0)dir.negate();s.width=10;s.center=corners[i].clone().addScaledVector(dir,5).toArray();});
}
await writeFile('public/data/one-times-wrap.json' ,JSON.stringify({panels},null,2)+'\n');
