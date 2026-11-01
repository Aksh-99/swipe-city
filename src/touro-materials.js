import {Material} from 'cesium';
import {addBatches,addFaces} from './street-details.js';
import {architectureNightAppearance} from './architecture-lighting.js';
const kinds=['university','campus','address','blade'];
function signAtlas(){
 const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=512;const c=canvas.getContext('2d');
 for(const [i,kind]of kinds.entries()){
  const aspect=kind==='university'?3.55/4.1:kind==='campus'?7/.19:kind==='address'?2.6/.31:1.09/19.78,w=512*aspect;
  c.save();c.beginPath();c.rect(i*512,0,512,512);c.clip();c.translate(i*512,0);c.scale(1/aspect,1);c.textAlign='center';c.fillStyle=c.strokeStyle='#d4c28e';
  if(kind==='university'){
   c.font='30px Arial';c.textAlign='left';c.fillText('cross river',22,44,w-44);c.fillText('campus',22,76,w-44);c.textAlign='center';
   c.lineWidth=8;c.beginPath();c.moveTo(w*.28,148);c.lineTo(w*.72,148);c.lineTo(w*.72,273);c.quadraticCurveTo(w*.72,321,w/2,346);c.quadraticCurveTo(w*.28,321,w*.28,273);c.closePath();c.stroke();
   c.lineWidth=5;c.beginPath();c.moveTo(w*.39,165);c.lineTo(w*.62,165);c.lineTo(w*.62,191);c.lineTo(w*.54,191);c.lineTo(w*.54,282);c.quadraticCurveTo(w*.5,302,w*.46,282);c.lineTo(w*.46,191);c.lineTo(w*.39,191);c.closePath();c.stroke();
   c.beginPath();c.moveTo(w*.46,143);c.bezierCurveTo(w*.35,109,w*.54,116,w*.56,84);c.bezierCurveTo(w*.70,111,w*.56,134,w*.53,145);c.stroke();
   c.font='bold 64px Arial';c.fillText('TOURO',w/2,416,w-18);c.font='bold 31px Arial';c.fillText('UNIVERSITY',w/2,458,w-26);
  }else if(kind==='campus'){c.font='bold 330px Arial';c.fillText('CROSS RIVER CAMPUS',w/2,372,w-80);}
  else if(kind==='address'){c.font='200px Arial';c.fillText('202 WEST 43RD STREET',w/2,345,w-60);}
  else{c.font='bold 24px Arial';c.fillText('3',w/2,38,w-4);c.font='bold 15px Arial';let y=170;for(const ch of 'TIMES SQUARE'){if(ch===' '){y+=20;continue;}c.fillText(ch,w/2,y,w-5);y+=27;}}
  c.restore();
 }return canvas;
}
export function addTouroMaterials(viewer,g){
 if(!g)return;
 addBatches(viewer,g.batches,false,false,architectureNightAppearance(g.night));addBatches(viewer,g.emissive);
 const glass=new Material({fabric:{type:'TouroNightLobbyGlazing',source:`czm_material czm_getMaterial(czm_materialInput materialInput){
  vec2 uv=vec2(fract(materialInput.st.x)/.99,materialInput.st.y);float variant=mod(floor(materialInput.st.x),16.0),lobby=1.0-step(16.0,materialInput.st.x);
  float pleat=.5+.5*sin(uv.x*113.0+variant*.8),curtain=.5+.5*sin(uv.x*49.0);
  vec3 warm=mix(vec3(.105,.081,.046),vec3(.30,.237,.137),pleat*.24+curtain*.30);
  float floorLine=smoothstep(.16,.19,uv.y),header=1.0-smoothstep(.86,.91,uv.y);
  warm*=.58+.42*floorLine*header;
  float reflection=smoothstep(.64,.96,fract(uv.x*.55+uv.y*.42+variant*.23));
  vec3 color=mix(warm,vec3(.048,.075,.097),reflection*.38);
  float escalator=1.0-smoothstep(.021,.038,abs(uv.y-(.25+uv.x*.39)));
  color=mix(color,vec3(.27,.24,.17),escalator*step(2.5,variant)*lobby*.55);
  czm_material m=czm_getDefaultMaterial(materialInput);m.diffuse=vec3(.005);m.emission=color*mix(.68,1.0,lobby);m.alpha=1.0;return m;
 }`}});
 addFaces(viewer,g.glass,glass,(f,u,v)=>[(f.kind==='transom'?16:0)+f.variant+u*.99,v]);
 // Assign DOM canvas after constructing Fabric: cached templates must never
 // deep-clone HTMLCanvasElement, whose browser constructor is illegal.
 const signs=new Material({fabric:{type:'TouroLobbySigns',uniforms:{image:Material.DefaultImageId},source:`czm_material czm_getMaterial(czm_materialInput materialInput){vec4 tex=texture(image,materialInput.st);czm_material m=czm_getDefaultMaterial(materialInput);m.diffuse=vec3(.003);m.emission=tex.rgb*.48;m.alpha=tex.a;return m;}`},translucent:true});
 signs.uniforms.image=signAtlas();addFaces(viewer,g.labels,signs,(f,u,v)=>[(kinds.indexOf(f.kind)+.003+u*.994)/4,.004+v*.992],true);
 const campaign=new Material({fabric:{type:'TouroContinuousMovieBillboard',uniforms:{image:'/billboards/atlas.webp',title:'/storefronts/touro-campaign.svg',aspect:g.screenAspect},source:`czm_material czm_getMaterial(czm_materialInput materialInput){
  vec2 uv=materialInput.st;float x=clamp((uv.x-.72)*aspect/1.5+.67,.004,.996);
  vec3 film=texture(image,vec2(x*.5,.502+uv.y*.496)).rgb;
  vec3 base=mix(vec3(.018,.023,.070),vec3(.055,.018,.084),uv.y);
  vec3 ad=mix(base,film,smoothstep(.36,.64,uv.x)*(1.0-smoothstep(.95,1.03,uv.x)));
  vec4 titleArt=texture(title,uv);ad=mix(ad,titleArt.rgb,titleArt.a);
  float matrix=.97+.03*sin(uv.x*2900.0)*sin(uv.y*1300.0);
  czm_material m=czm_getDefaultMaterial(materialInput);m.diffuse=vec3(.004);m.emission=ad*matrix*.94;m.alpha=1.0;return m;
 }`}});
 addFaces(viewer,g.screens,campaign,(f,u,v)=>[f.u0+u*(f.u1-f.u0),v]);
}
