import {WEST45} from './west45-config.js';
const v=a=>`vec2(${a[0].toFixed(6)},${a[1].toFixed(6)})`;
export function west45GLSL(){return `
vec2 west45Coordinates(vec3 p){vec2 q=p.xy-${v(WEST45.origin)};return vec2(dot(q,${v(WEST45.east)}),dot(q,${v(WEST45.north)}));}
float west45Mask(vec3 p){vec2 q=west45Coordinates(p);return step(-12.,q.x)*step(q.x,260.)*step(6.2,abs(q.y))*step(abs(q.y),74.)*step(.18,p.z)*max(step(0.,q.y),1.-step(209.,q.x));}
void west45Finish(vec3 p,vec3 normal,inout vec3 diffuse,inout vec3 emissive,inout float roughness){
 vec2 q=west45Coordinates(p);float t=q.x,north=step(0.,q.y);
 float glass=north*step(134.,t)+(1.-north)*step(169.,t);
 float hotel=(1.-north)*(1.-step(47.,t));float construction=north*(1.-step(65.,t));
 float pale=(1.-north)*step(117.,t)*(1.-step(169.,t));
 vec3 masonry=mix(vec3(.28,.19,.13),vec3(.43,.39,.31),pale);masonry=mix(masonry,vec3(.39,.31,.205),hotel);masonry=mix(masonry,vec3(.19,.205,.195),construction);
 float horizontalWall=abs(dot(normal.xy,${v(WEST45.north)}));float x=horizontalWall>.65?q.x:q.y;
 vec2 brick=fract(vec2(x/.30+mod(floor(p.z/.14),2.)*.5,p.z/.14));float joint=max(step(.94,brick.x),step(.88,brick.y));
 vec2 stone=fract(vec2(x,p.z)/vec2(1.55,.90));float stoneJoint=max(step(.987,stone.x),step(.982,stone.y));masonry*=1.-mix(joint*.23,stoneJoint*.20,pale);
 float pitch=mix(2.55,2.12,hotel),floorH=mix(3.5,3.15,hotel);vec2 window=fract(vec2(x,p.z)/vec2(pitch,floorH));
 float pane=step(.23,window.x)*step(window.x,.77)*step(.20,window.y)*step(window.y,.80);float trim=step(.18,window.x)*step(window.x,.82)*step(.15,window.y)*step(window.y,.85);
 vec2 id=floor(vec2(x,p.z)/vec2(pitch,floorH));float lit=step(.76,fract(sin(dot(id,vec2(28.17,74.21)))*33445.1));
 vec3 windowColor=vec3(.020,.039,.054)+vec3(.10,.075,.040)*lit;vec3 color=mix(masonry,vec3(.48,.44,.35),trim*.65);color=mix(color,windowColor,pane);
 vec2 curtain=fract(vec2(x,p.z)/vec2(north>.5?1.28:1.52,3.46));float frame=max(1.-smoothstep(.012,.035,min(curtain.x,1.-curtain.x)),1.-smoothstep(.012,.025,min(curtain.y,1.-curtain.y)));
 float reflection=.5+.5*sin(x*.17+p.z*.039);vec3 glazing=mix(vec3(.019,.037,.049),vec3(.043,.064,.075),reflection);glazing=mix(glazing,north>.5?vec3(.26,.275,.26):vec3(.13,.16,.16),frame);
 color=mix(color,glazing,glass);float storefront=1.-smoothstep(4.4,5.2,p.z);color=mix(color,vec3(.025,.042,.045),storefront*.86);// The photographed corner has no installed windows: exposed slabs, columns and dark openings.
 if(construction>.5){vec2 structure=fract(vec2(x,p.z)/vec2(4.15,4.65));float slab=step(.86,structure.y),column=1.-step(.13,structure.x);float frame=max(slab,column);float netGrid=max(step(.95,fract(x*10.)),step(.95,fract(p.z*10.)));vec3 voidColor=vec3(.023,.027,.029);vec3 concrete=vec3(.40,.39,.35)*( .91+.09*sin(x*8.3+p.z*4.1));color=mix(voidColor,concrete,frame);color=mix(color,vec3(.35,.12,.065),step(14.,p.z)*(1.-frame)*.65);color+=vec3(.045,.025,.015)*netGrid*(1.-frame);}
 // ROW NYC: smaller sash windows, AC grilles, tan brick and pale stone vertical strips.
 if(hotel>.5){vec2 sash=fract(vec2(x,p.z-10.3)/vec2(2.3,3.12));float opening=step(.30,sash.x)*step(sash.x,.70)*step(.20,sash.y)*step(sash.y,.77);float stoneStrip=step(.91,fract((x+1.3)/18.4));vec3 tanBrick=vec3(.46,.365,.245)*(1.-joint*.18);color=mix(tanBrick,vec3(.54,.52,.45),stoneStrip);color=mix(color,vec3(.045,.072,.083)+vec3(.06,.043,.025)*lit,opening);float ac=step(.30,sash.x)*step(sash.x,.70)*step(.15,sash.y)*step(sash.y,.26);color=mix(color,vec3(.21,.23,.22)*( .65+.35*step(.5,fract(x*18.))),ac);if(p.z<10.3){vec2 paneCell=fract(vec2(x,p.z)/vec2(2.7,5.1));float mullion=1.-step(.018,min(paneCell.x,1.-paneCell.x));float rail=1.-step(.022,min(paneCell.y,1.-paneCell.y));color=mix(vec3(.115,.17,.19)+vec3(.065)*sin(x*.45+p.z*.62),vec3(.075,.085,.086),max(mullion,rail));}}
 // Marriott Marquis: pale concrete wings, a recessed horizontal-window atrium
 // and a low glazed podium above the billboard, rather than a uniform window grid.
 if(north>.5&&t>=134.){
  float podium=1.-step(32.85,p.z);
  vec2 panel=fract(vec2(x,p.z)/vec2(3.6,2.7));
  float joint=max(step(.995,panel.x),step(.993,panel.y));
  vec3 concrete=vec3(.44,.445,.415)*(1.-joint*.11);
  float broadway=step(.55,abs(dot(normal.xy,${v(WEST45.east)})));
  float atrium=broadway*step(20.5,q.y)*step(q.y,56.5);
  float slit=step(.46,fract(x/3.1))*step(fract(x/3.1),.54);
  vec3 wing=mix(concrete,vec3(.065,.095,.115),slit*.85);
  float floorBand=step(.78,fract((p.z-39.8)/3.5));
  vec3 recessed=mix(vec3(.026,.050,.065),vec3(.24,.26,.25),floorBand);
  float bridge=step(72.,p.z)*step(p.z,84.);
  recessed=mix(recessed,vec3(.29,.30,.275),bridge);
  color=mix(wing,recessed,atrium);
  vec3 podiumWall=vec3(.20,.225,.225)*(1.-joint*.12);
  color=mix(color,podiumWall,podium);
  if(p.z>=32.85&&p.z<39.8){
   float mullion=step(.94,fract(x/1.9));
   color=mix(vec3(.035,.073,.092),vec3(.28,.31,.31),mullion);
  }
 }

 diffuse=color*.34;emissive=color*mix(.57,.34,smoothstep(10.,80.,p.z));emissive+=vec3(.11,.076,.038)*lit*pane*(1.-glass)*(1.-construction)*.14;roughness=mix(.82,.29,glass);
}`;}
