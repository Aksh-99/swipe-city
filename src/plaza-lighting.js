import { PerInstanceColorAppearance } from 'cesium';
import landmarks from '../public/data/landmarks.json' with {type:'json'};
// Static screen-light approximation, evaluated in local metres on actual street
// surfaces. This keeps lighting cheap without an extra scene or reflection pass.
export function lightSpillGLSL(position='p'){
 const colors=[[.20,.35,1],[1,.16,.05],[.95,.25,.60],[.6,.45,1],[.8,1,.15],[1,.28,.08],[1,.36,.28],[.65,.12,1]];
 // Share illumination across each collage instead of adding a light per poster.
 const groups=new Map();
 for(const s of landmarks.screens.filter(s=>s.center[2]<40&&s.height>4)){
  const key=s.name.split(' / poster ')[0],weight=s.width*s.height;
  if(!groups.has(key))groups.set(key,{...s,center:[0,0,0],weight:0,width:s.width});
  const g=groups.get(key);g.weight+=weight;for(let i=0;i<3;i++)g.center[i]+=s.center[i]*weight;g.width=Math.max(g.width,s.width);
 }
 const lights=[...groups.values()].sort((a,b)=>b.weight-a.weight).slice(0,18).map(g=>({...g,center:g.center.map(v=>v/g.weight)}));
 return lights.map(s=>{
  const [x,y,z]=s.center,[nx,ny]=s.normal,c=colors[s.ad%8],width=s.width;
  return `{vec2 delta=${position}-vec2(${(x+nx*3).toFixed(3)},${(y+ny*3).toFixed(3)});float along=dot(delta,vec2(${(-ny).toFixed(5)},${nx.toFixed(5)}));float across=dot(delta,vec2(${nx.toFixed(5)},${ny.toFixed(5)}));float light=exp(-abs(across)/20.0-along*along/${(width*width*.5).toFixed(2)});glow+=vec3(${c.map(v=>v.toFixed(3)).join(',')})*light*.26;}`;
 }).join('\n');
}
export function plazaAppearance(){
 return new PerInstanceColorAppearance({translucent:false,closed:false,renderState:{cull:{enabled:false}},
 vertexShaderSource:`in vec3 position3DHigh;in vec3 position3DLow;in vec4 color;in vec2 st;in float batchId;out vec4 v_color;out vec2 v_local;void main(){vec4 p=czm_computePosition();v_color=color;v_local=st;gl_Position=czm_modelViewProjectionRelativeToEye*p;}`,
 fragmentShaderSource:`in vec4 v_color;in vec2 v_local;void main(){
 vec2 p=v_local;vec2 grid=vec2(dot(p,vec2(.848,-.53)),dot(p,vec2(.53,.848)));
 float grain=fract(sin(dot(floor(p*40.0),vec2(12.9898,78.233)))*43758.5453);
 float sidewalk=step(.64,v_color.r)*step(v_color.r,.69);
 vec2 tileSize=mix(vec2(.6,1.2),vec2(1.5,1.5),sidewalk);
 vec2 cell=abs(fract(grid/tileSize)-.5);float seam=smoothstep(.485,.5,max(cell.x,cell.y));
 float paving=step(.45,v_color.r)*step(v_color.r,.75);
 vec3 base=v_color.rgb*(.38+sidewalk*.12)*(.91+grain*.12)*(1.0-seam*.28*paving);
 vec3 glow=vec3(0);${lightSpillGLSL()}
 float polished=.75+.25*sin(grid.x*13.0)*sin(grid.y*7.0);
 out_FragColor=vec4(base+glow*polished,1.0);
 }`});
}
