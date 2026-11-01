import {Vector3} from 'three';
import {addParamountCorner} from './paramount-corner-geometry.js';
import {PARAMOUNT_NORTH} from './paramount-corner-config.js';
import {DetailMesh} from './detail-mesh.js';
import {steelCylinder} from './curb-bollard-geometry.js';
import {BROADWAY_RETAIL as B} from './broadway-retail-config.js';
const UP=new Vector3(0,0,1);
export function retailAxes(f){const c=new Vector3(...f.center),n=new Vector3(...f.normal),r=new Vector3(-n.y,n.x,0);return {n,r,p:(x,y,z)=>c.clone().addScaledVector(r,x).addScaledVector(n,y).setZ(z)};}
export function createBroadwayRetailGeometry(){
 const mesh=new DetailMesh(),emissive=new DetailMesh(),paving=new DetailMesh(),glass=[],windows=[],labels=[],posters=[],hero=[],doors=[],posts=[],walkways=[],kiosks=[];
 const paramount={labels:[],script:[],facades:[],stone:[]};
 const night={frontNormal:B.facades[0].normal,lights:[]};
 for(const f of B.facades){
  const {p,n,r}=retailAxes(f),w=f.width;
  const box=(x,y,z,dx,dy,dz,c,solid=false)=>mesh.box(p(x,y,z),r,n,dx,dy,dz,c,solid);
  const face=(x,y,z,dx,dz,extra={})=>({center:p(x,y,z),normal:n,right:r,width:dx,height:dz,...extra});
  const sign=(kind,x,y,z,dx,dz,shade=.8)=>labels.push(face(x,y,z,dx,dz,{kind,shade}));
  const ad=(x,z,dx,dz,art,atlas='portrait',y=.50)=>{box(x,y-.10,z,dx+.18,.18,dz+.18,'#152630');posters.push(face(x,y+.01,z,dx,dz,{art,atlas}));};
  function store(x,width,kind,interior=0){
   box(x,.40,2.52,width,.36,4.67,'#203031',true);
   const bays=Math.max(2,Math.round(width/2.15)),pitch=width/bays;
   for(let j=0;j<bays;j++){
    const cx=x-width/2+(j+.5)*pitch;
    windows.push(face(cx,.604,2.40,pitch-.12,4.03,{column:interior,shade:.42}));
    for(const edge of [-pitch/2,pitch/2])box(cx+edge,.66,2.42,.065,.16,4.22,'#9a8b73');
    box(cx,.69,3.70,pitch,.13,.08,'#8b8070');
    if(j===Math.floor(bays/2)){
     box(cx,.71,2.0,.045,.12,3.1,'#bdb7a3');
     for(const side of [-1,1])mesh.tube(p(cx+side*.17,.80,1.1),p(cx+side*.17,.80,1.9),.021,'#d1c8b2');
     doors.push({point:p(cx,.61,.17),normal:n,facade:f.id});
    }
    box(cx,.70,.35,pitch,.14,.18,'#615d55');
   }
   box(x,.50,4.89,width+.09,.56,.70,'#18292c');
   sign(kind,x,.807,4.91,width-.22,.58,.88);
   for(const z of [4.54,5.28])box(x,.58,z,width+.2,.57,.045,'#ad9f7f');
   emissive.box(p(x,.71,4.51),r,n,width-.16,.04,.024,'#beab7f');
  }
  if(f.id==='restaurants'){
   // Keep the existing Paramount masonry, carved spandrels and Hard Rock
   // entrance; these two reference storefronts occupy the north half only.
   store(-7.2,14.1,'harbor',0);store(7.8,14.8,'crispy',2);
   const originalWidth=60.748452758789064,bay=originalWidth/Math.round(originalWidth/4.55);
   for(let j=0;j<Math.round(originalWidth/4.55);j++){
    const sourceX=-originalWidth/2+(j+.5)*bay,x=sourceX-15;if(x<-14||x>14)continue;
    windows.push(face(x,.355,8.95,bay-1.27,3.80,{column:0,shade:.33}));
    if(j%2===0)sign('harbor-badge',x,.39,9.1,1.30,1.30,.70);
   }
   // Layered red/blue panels, cream lettering, perimeter bulbs and robust
   // steel mounts echo the restaurant's tall corner advertising enclosure.
   for(const [z,height]of [[14.0,13.3],[31.5,9.4]]){
    const x=13.0;box(x,.98,z,3.68,1.12,height+.26,'#343737');
    sign('harbor-blade',x,1.555,z,3.44,height,.71);
    for(const side of [-1,1]){
     box(x+side*1.81,1.54,z,.09,.10,height+.22,'#a8997b');
     for(let h=z-height/2;h<=z+height/2;h+=.37)emissive.tube(p(x+side*1.78,1.62,h),p(x+side*1.78,1.65,h),.027,'#d2b782',false,6);
    }
    for(const h of [z-height/2+.7,z+height/2-.7])mesh.tube(p(x,.10,h),p(x,1.0,h),.07,'#728181',false,8);
   }
   // A street-side advertising kiosk like the first reference. Its position
   // leaves the main sidewalk corridor and all restaurant doors accessible.
   const x=-3.8,y=4.7;
   box(x,y,1.38,3.32,.38,2.42,'#65787d',true);
   box(x,y+.207,1.45,3.13,.075,2.13,'#263d48');
   posters.push(face(x,y+.251,1.45,2.93,1.94,{art:0,atlas:'landscape'}));
   sign('kiosk',x,y+.253,2.59,2.9,.13,.62);
   for(const side of [-1,1])box(x+side*1.42,y,.21,.20,.58,.35,'#74898c',true);
   kiosks.push({point:p(x,y,.17),normal:n,width:3.32,depth:.38});
   for(let x=-14;x<14;x+=.7)walkways.push({facade:f.id,point:p(x,2.25,.17)});
   night.lights.push({position:p(0,.7,4.7).toArray(),radius:[18,18,8],color:[.12,.07,.035]},{position:p(13,1.5,16).toArray(),radius:[7,7,14],color:[.14,.018,.025]});
   continue;
  }
  // Independent, source-fitted surfaces preserve the real south chamfer,
  // recessed entrance, W44 return and upper setback of 1515 Broadway.
  box(0,.055,(f.bottom+f.top)/2,w,.11,f.height,'#656c6b');
  if(f.id==='1515-return'){
   for(let x=-w/2+.7;x<w/2;x+=1.3)box(x,.12,(f.bottom+f.top)/2,.023,.035,f.height,'#404c50');
   for(let z=1;z<f.top;z+=1.2)box(0,.12,z,w,.035,.023,'#424c50');
   // Ticket windows and venue posters at the eastern end of the return.
   for(let x=5;x<w/2-1;x+=3.05){box(x,.22,2.5,2.82,.23,4.5,'#20303a',true);ad(x,2.6,2.56,3.8,(Math.round(x)%3)*2,'portrait',.37);}
   box(0,.42,6.50,w-.35,.28,1.9,'#292431');
   sign('ticket-room',0,.575,6.50,w-.60,1.65,.75);
   for(const z of [5.48,7.55,8.02])mesh.tube(p(-w/2+.25,.53,z),p(w/2-.25,.53,z),.035,'#465154');
   for(let x=-w/2+1;x<0;x+=3.0){windows.push(face(x,.34,2.25,2.75,3.75,{column:0,shade:.18}));box(x,.41,2.25,.045,.09,3.7,'#9b917e');}
   for(const x of [-w/2+1.5,-w/2+4.3,-w/2+7.1]){const point=p(x,.69,.17);steelCylinder(mesh,point,n);posts.push({position:point,normal:n});}
   box(12.5,.78,4.65,16.3,1.45,.22,'#253239',true);
   for(let x=-w/2+.5;x<w/2-.5;x+=.7)walkways.push({facade:f.id,point:p(x,2.45,.17)});
  }else{
   glass.push(face(0,.125,(f.bottom+f.top)/2,w-.06,f.height-.06));
   for(let x=-w/2;x<=w/2;x+=2.26)box(x,.24,(f.bottom+f.top)/2,.065,.22,f.height,'#99a5a5');
   for(let z=Math.ceil(f.bottom/3.6)*3.6;z<f.top;z+=3.6)box(0,.23,z,w,.24,.08,'#94a3a4');
  }
  if(f.id==='1515-front'){
   for(const shop of [{x:-17.5,w:12.5,kind:'stride',interior:3},{x:-6.3,w:9.2,kind:'metro',interior:1},{x:3.4,w:9.1,kind:'coffee',interior:0},{x:12.3,w:7.7,kind:'tickets',interior:1},{x:20.4,w:7.8,kind:'books',interior:1}])store(shop.x,shop.w,shop.kind,shop.interior);
   // Large theatrical graphic over a dense lower row of different posters.
   box(-1.8,.39,20.45,42.8,.41,10.97,'#25333c');
   hero.push(face(-1.8,.608,20.45,42.55,10.73));
   for(const [x,width,art,atlas]of [[-20.5,6.7,0,'portrait'],[-13.15,7.1,1,'portrait'],[-5.9,6.7,4,'portrait'],[1.5,7.3,3,'portrait'],[8.9,6.7,6,'portrait'],[16.2,6.9,2,'portrait'],[22.0,3.3,7,'portrait']])ad(x,10.14,width,7.78,art,atlas);
   // The visible metal grid sits in front of the advertisements, matching
   // the photo's segmented glazed podium rather than a floating ad wall.
   for(let x=-w/2+.04;x<w/2;x+=4.09)box(x,.66,16.04,.070,.12,20.32,'#7f9197');
   for(const z of [6.15,14.2,19.8,25.98])box(0,.68,z,w,.11,.09,'#98a7a7');
   for(let x=-w/2+.5;x<w/2-.5;x+=.7)walkways.push({facade:f.id,point:p(x,2.50,.17)});
   for(const x of [-20.8,-17.2,-13.6,-10,0,3.6,7.2,10.8,14.4,18,21.6]){const point=p(x,5.00,.17);steelCylinder(mesh,point,n);posts.push({position:point,normal:n});}
   night.lights.push({position:p(-2,1,18).toArray(),radius:[26,26,14],color:[.16,.12,.037]});
  }else if(f.id==='1515-chamfer'){
   ad(0,18.2,w-.22,16.3,2,'portrait',.59);
   sign('studios',0,.64,7.7,w-.18,1.00,.82);
   windows.push(face(0,.31,3.40,w-.23,5.77,{column:1,shade:.23}));
   box(0,.35,.30,w,.48,.25,'#5a6e73',true);
  }else if(f.id==='1515-entrance'){
   windows.push(face(0,.31,2.44,w-.19,4.31,{column:1,shade:.30}));
   box(0,.31,2.40,w,.30,4.34,null,true);
   for(let x=-w/2+.12;x<w/2;x+=1.36)box(x,.43,2.4,.10,.18,4.35,'#a28f6b');
   sign('studios',0,.44,5.72,w-.14,.88,.76);sign('studio-address',0,.44,6.65,w-.14,.45,.65);
   box(0,.70,4.62,w+.05,1.25,.22,'#1b2e35',true);doors.push({point:p(0,.49,.17),normal:n,facade:f.id});
  }
  if(f.bottom<1){
   paving.quad(p(-w/2,0,.17),p(w/2,0,.17),p(w/2,3.8,.17),p(-w/2,3.8,.17),'#a3a7a5',true);
   box(0,.18,.28,w,.30,.22,'#697779',true);
   mesh.quad(p(-w/2,.145,.17),p(w/2,.145,.17),p(w/2,.145,2.8),p(-w/2,.145,2.8),null,true);
  }
 }
 for(const source of PARAMOUNT_NORTH.facades){const f={...source,sourceId:source.id,id:source.style};addParamountCorner(f,retailAxes(f),{mesh,emissive,paving,glass,doors,walkways,paramount});}
 return {paramount,batches:mesh.batches,emissive:emissive.batches,paving:paving.batches,collision:new Float32Array([...mesh.collision,...paving.collision]),glass,windows,labels,posters,hero,doors,posts,walkways,kiosks,night};
}
