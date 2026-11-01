import {HAIR_COLORS,normalizeHairColor} from './hair-colors.js';
import {CustomShader,CustomShaderMode,LightingModel,UniformType,Matrix4,Cartesian3,Cartesian4} from 'cesium';
import {inverseFrame} from './coordinates.js';

const PALETTE=[[.20,.35,1],[1,.16,.05],[.95,.25,.60],[.60,.45,1],[.8,1,.15],[1,.28,.08],[1,.36,.28],[.65,.12,1]];
export const CHARACTER_LIGHT_LIMIT=4;
const array=v=>Array.isArray(v)?v:[v.x,v.y,v.z];
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));

// Inputs are actual rendered advertisement faces, including curved signs.
// Group a collage/stack into one emitter so it cannot take all four slots.
export function screenLightSources(faces){
 const groups=new Map();
 for(const [index,f] of faces.entries()){
  if(!(f.width>0&&f.height>0))continue;
  const corners=f.corners?.map(array),center=f.center?array(f.center):corners?.length===4?[0,1,2].map(i=>corners.reduce((sum,c)=>sum+c[i],0)/4):null;
  if(!center||!f.normal)continue;
  const normal=array(f.normal),length=Math.hypot(normal[0],normal[1]);
  if(!Number.isFinite(length)||!length||center.some(v=>!Number.isFinite(v)))continue;
  const width=corners?.length===4?Math.hypot(...corners[1].map((v,i)=>v-corners[0][i])):f.width;
  const id=f.lightGroup??f.name?.split(' / poster ')[0]??`screen-${index}`,area=width*f.height;
  let g=groups.get(id);if(!g){g={id,faces:[],area:0,color:[0,0,0]};groups.set(id,g);}
  const color=f.lightColor??PALETTE[(f.ad??f.art??0)%PALETTE.length];
  g.faces.push({center,normal:[normal[0]/length,normal[1]/length,0],width,height:f.height});
  g.area+=area;for(let i=0;i<3;i++)g.color[i]+=color[i]*area;
 }
 return [...groups.values()].map(g=>({...g,color:g.color.map(c=>c/g.area)}));
}

// The nearest point on a real screen rectangle provides broad illumination
// near its lower edge instead of a point floating at the building's centre.
export function sampleScreenLights(sources,position,limit=CHARACTER_LIGHT_LIMIT){
 const p=array(position),samples=[];
 for(const source of sources){
  let closest=null;
  for(const face of source.faces){
   const [nx,ny]=face.normal,dx=p[0]-face.center[0],dy=p[1]-face.center[1];
   const front=clamp((dx*nx+dy*ny+.4)/1.4,0,1);if(!front)continue;
   const along=clamp(-ny*dx+nx*dy,-face.width/2,face.width/2),z=clamp(p[2],face.center[2]-face.height/2,face.center[2]+face.height/2);
   const point=[face.center[0]-ny*along,face.center[1]+nx*along,z];
   const distance=Math.hypot(point[0]-p[0],point[1]-p[1],point[2]-p[2]);
   if(distance>90)continue;
   const intensity=Math.min(.58,.13+Math.sqrt(source.area)*.013)*Math.exp(-distance/29)*front;
   if(!closest||intensity>closest.intensity)closest={id:source.id,position:point,color:source.color,intensity};
  }
  if(closest&&closest.intensity>.008)samples.push(closest);
 }
 return samples.sort((a,b)=>b.intensity-a.intensity||a.id.localeCompare(b.id)).slice(0,limit);
}

export function createCharacterShader(){
 const uniforms={u_hairTint:{type:UniformType.VEC3,value:new Cartesian3(0,0,0)},u_hairTintEnabled:{type:UniformType.FLOAT,value:0},u_eyeToLocal:{type:UniformType.MAT4,value:Matrix4.clone(Matrix4.IDENTITY)}};
 for(let i=0;i<CHARACTER_LIGHT_LIMIT;i++){
  uniforms[`u_screen${i}`]={type:UniformType.VEC4,value:new Cartesian4(0,0,0,0)};
  uniforms[`u_screenColor${i}`]={type:UniformType.VEC3,value:new Cartesian3(0,0,0)};
 }
 const lights=Array.from({length:CHARACTER_LIGHT_LIMIT},(_,i)=>`screenLight(p,n,view,u_screen${i},u_screenColor${i},roughness,metalness,skin,illumination,reflection);`).join('\n');
 return new CustomShader({
  mode:CustomShaderMode.MODIFY_MATERIAL,lightingModel:LightingModel.UNLIT,uniforms,
  fragmentShaderText:`
  void screenLight(vec3 p,vec3 n,vec3 view,vec4 screen,vec3 color,float roughness,float metalness,float skin,inout vec3 illumination,inout vec3 reflection){
   vec3 delta=screen.xyz-p;float distance=max(length(delta),.01);vec3 l=delta/distance;
   float facing=max(0.0,dot(n,l));
   // Restrained wrapped diffuse softens skin. This is a light-diffusion
   // approximation, not subsurface scattering or ray-traced reflections.
   float soft=clamp((dot(n,l)+.25)/1.25,0.0,1.0);
   illumination+=color*screen.w*mix(facing,soft,skin*.55);
   vec3 halfVector=normalize(l+view+vec3(.00001));
   float spec=pow(max(0.0,dot(n,halfVector)),mix(96.0,8.0,roughness));
   float fresnel=.04+.32*pow(1.0-max(0.0,dot(n,view)),5.0);
   reflection+=color*screen.w*spec*mix(fresnel,.65,metalness)*(1.0-roughness*.7);
  }
  void fragmentMain(FragmentInput fsInput,inout czm_modelMaterial material){
   vec3 p=(u_eyeToLocal*vec4(fsInput.attributes.positionEC,1.0)).xyz;
   // Keep the imported fabric/face normal-map detail under the same night
   // lighting, with a restrained blend so generated textures stay smooth.
   vec3 n=normalize(mat3(u_eyeToLocal)*mix(fsInput.attributes.normalEC,material.normalEC,.85));
   vec3 view=normalize(mat3(u_eyeToLocal)*(-fsInput.attributes.positionEC));
   // UNLIT skips Cesium's metallic/roughness material stage. Compact glTF
   // attributes retain each authored cloth, skin, lens and metal response.
   vec3 surface=fsInput.attributes.surface;
   float roughness=surface.x,metalness=surface.y,skin=surface.z;
   vec2 uv=fsInput.attributes.texCoord_0;
   float cloth=smoothstep(.80,.88,roughness);
   float footprint=max(fwidth(uv.x),fwidth(uv.y))*96.0;
   float resolved=1.0-smoothstep(.25,1.0,footprint);
   float weave=sin(uv.x*603.1858)*sin(uv.y*603.1858)*resolved;
   vec3 base=material.diffuse*(1.0+cloth*weave*.022);
   float hairMask=fsInput.attributes.hair*u_hairTintEnabled;
   float strandShade=.55+clamp(dot(base,vec3(.2126,.7152,.0722))*2.5,0.0,.6);
   base=mix(base,u_hairTint*strandShade,hairMask);
   // Ambient and overhead street fill stay in geographic space.
   float overhead=clamp(dot(n,normalize(vec3(.20,-.12,.97)))*.5+.5,0.0,1.0);
   vec3 illumination=vec3(.18,.21,.26)+overhead*vec3(.25,.23,.19);
   vec3 reflection=vec3(0.0);
   ${lights}
   vec3 color=base*illumination+reflection;
   float luminance=dot(color,vec3(.2126,.7152,.0722));
   color=mix(vec3(luminance),color,.94);
   material.diffuse=color/(1.0+color*.18);
  }`
 });
}

export class CharacterLighting{
 constructor(faces=[]){
  this.shader=createCharacterShader();this.sources=screenLightSources(faces);
  this.eyeToLocal=new Matrix4();this.lastPosition=null;
  this.slots=Array.from({length:CHARACTER_LIGHT_LIMIT},()=>({id:null,intensity:0,screen:new Cartesian4(),color:new Cartesian3()}));
 }
 setHairColor(id){const color=HAIR_COLORS.find(c=>c.id===normalizeHairColor(id));this.shader.setUniform('u_hairTintEnabled',color.hex?1:0);if(color.hex){const rgb=[1,3,5].map(i=>Math.pow(parseInt(color.hex.slice(i,i+2),16)/255,2.2));this.shader.setUniform('u_hairTint',Cartesian3.fromArray(rgb));}}
 setFaces(faces){this.sources=screenLightSources(faces);for(const slot of this.slots){slot.id=null;slot.intensity=0;}}
 update(camera,position,dt=1/60){
  // Multiply on the CPU in doubles; shader positions remain local metres,
  // avoiding cancellation between Earth-sized float coordinates.
  Matrix4.multiply(inverseFrame,camera.inverseViewMatrix,this.eyeToLocal);this.shader.setUniform('u_eyeToLocal',this.eyeToLocal);
  const p=array(position),atHead=[p[0],p[1],p[2]+1.4];
  if(this.lastPosition&&Math.hypot(...p.map((v,i)=>v-this.lastPosition[i]))>25)for(const slot of this.slots){slot.id=null;slot.intensity=0;}
  this.lastPosition=[...p];
  const chosen=sampleScreenLights(this.sources,atHead),byId=new Map(chosen.map(s=>[s.id,s]));
  const held=new Set(this.slots.filter(s=>byId.has(s.id)).map(s=>s.id));
  const blend=1-Math.exp(-clamp(dt,0,.1)/.12);
  for(const [i,slot] of this.slots.entries()){
   let target=byId.get(slot.id);
   // Fade departing sources out before changing the slot's position.
   if(!target&&slot.intensity<.012){target=chosen.find(s=>!held.has(s.id));slot.id=target?.id??null;slot.intensity=0;if(target)held.add(target.id);}
   slot.intensity+=((target?.intensity??0)-slot.intensity)*blend;
   if(target){Cartesian4.fromElements(...target.position,slot.intensity,slot.screen);Cartesian3.fromArray(target.color,0,slot.color);}else slot.screen.w=slot.intensity;
   this.shader.setUniform(`u_screen${i}`,slot.screen);this.shader.setUniform(`u_screenColor${i}`,slot.color);
  }
 }
 get activeScreenCount(){return this.slots.filter(s=>s.intensity>.012).length;}
 destroy(){this.shader.destroy();}
}
