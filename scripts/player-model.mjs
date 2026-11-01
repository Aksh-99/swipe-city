// Legacy procedural models, superseded by the supplied Meshy assets.
// Current authoring workflow: scripts/import-meshy-characters.mjs.
import {Group,Mesh,MeshStandardMaterial,SphereGeometry,BufferGeometry,Float32BufferAttribute,Uint8BufferAttribute,TubeGeometry,CatmullRomCurve3,Vector3,TorusGeometry,Color} from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';
import {writeFileSync,mkdirSync} from 'node:fs';
import {APPEARANCES,normalizeAppearanceId} from '../src/appearances.js';
globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(value=>{this.result=value;this.onloadend?.();});}};
const id=normalizeAppearanceId(process.argv[2]??'explorer'),appearance=APPEARANCES.find(a=>a.id===id);if(!appearance)throw new Error('Unknown appearance');
const tourist=id==='tourist',pedestrian=id==='pedestrian',commuter=id==='commuter',female=tourist||commuter;
const displayName=appearance.name;
const material=(color,roughness=.92,metalness=0)=>new MeshStandardMaterial({color,roughness,metalness});
const jacket=material(tourist?'#aa93c3':pedestrian?'#74717c':commuter?'#426675':'#65715b'),trim=material(pedestrian?'#514e58':commuter?'#274753':'#3e4b42'),seam=material(commuter?'#78959e':tourist?'#d9d6bc':pedestrian?'#a49a92':'#90977e'),pants=material(tourist?'#48676d':pedestrian?'#716251':'#26323b'),cargo=material('#303d44'),skin=material(tourist?'#d0a587':commuter?'#b98d72':'#c39473',.58),skinShadow=material('#9f745e',.68),hair=material(tourist?'#b8a071':commuter?'#4a352b':'#302821',.82),white=material('#d9d4c9',.27),iris=material('#47392b',.23),black=material('#151c20'),boot=material(pedestrian?'#d0c7b9':commuter?'#353f4c':tourist?'#b3828b':'#594b3f',.73),sole=material('#25292a',.86),metal=material('#a5a69a',.33,.6),pack=material('#263e40');
skin.userData.skin=.8;skinShadow.userData.skin=.45;
const lips=material(female?'#ab766b':'#a97c69',.56);lips.userData.skin=.55;
const root=new Group();root.name='Player';root.userData={character:displayName,appearanceId:id,reference:'Original authored prototype geometry',heightMetres:1.79,appearance:tourist?'Blonde bob, straw hat, sunglasses, pastel shirt, teal shorts, pink sneakers':commuter?'Braided updo, teal jacket, tan crossbody bag, walking boots':pedestrian?'Short hair, casual gray overshirt, tan trousers and light sneakers':'Balding explorer, moustache, olive jacket and backpack'};
function group(name,parent,p){const g=new Group();g.name=name;g.position.set(...p);parent.add(g);return g;}
function part(name,g,m,p,parent){const n=new Mesh(g,m);n.name=name;n.position.set(...p);parent.add(n);return n;}
function oval(name,m,p,scale,parent){return part(name,new SphereGeometry(1,18,12),m,p,parent).scale.set(...scale);}
function line(name,m,points,r,parent){return part(name,new TubeGeometry(new CatmullRomCurve3(points.map(p=>new Vector3(...p))),Math.max(4,points.length*3),r,6,false),m,[0,0,0],parent);}
// Elliptical contour rings sculpt shoulders, cheeks, jaw, sleeves and trousers.
function contour(name,m,rings,parent,segments=20){rings=[...rings].sort((a,b)=>a[0]-b[0]);const p=[],uv=[],idx=[];rings.forEach(([y,rx,rz,z=0],j)=>{for(let i=0;i<=segments;i++){const a=i/segments*Math.PI*2;p.push(Math.cos(a)*rx,y,Math.sin(a)*rz+z);uv.push(i/segments,j/(rings.length-1));}});for(let j=0;j<rings.length-1;j++)for(let i=0;i<segments;i++){const a=j*(segments+1)+i,b=a+segments+1;idx.push(a,b,a+1,a+1,b,b+1);}const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(p,3));g.setAttribute('uv',new Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return part(name,g,m,[0,0,0],parent);}
const upper=group('UpperBody',root,[0,.98,0]),head=group('Head',upper,[0,.48,0]);if(female)head.scale.x=.95;
contour('ShapedFace',skin,[[.042,.009,.013,.016],[.068,female?.056:.068,.068,.019],[.10,female?.083:.097,.091,.013],[.15,.112,.105],[.19,.119,.107],[.235,.116,.103],[.278,.098,.092],[.306,.07,.065],[.326,.004,.004]],head,32);
oval('Neck',skin,[0,.007,0],[female?.049:.054,.079,.05],head);
if(id==='explorer'){
 // Open crown and a receding band along the sides/back, rather than a cap.
 part('RecedingHair',new SphereGeometry(1,24,10,Math.PI,Math.PI,.85,.94),hair,[0,.177,-.004],head).scale.set(.124,.153,.114);
 for(const s of [-1,1])line('Moustache',hair,[[0,.139,.135],[s*.015,.137,.135],[s*.031,.133,.117]],.0035,head);
}else part('HairCap',new SphereGeometry(1,24,14,0,Math.PI*2,0,1.55),hair,[0,.177,-.006],head).scale.set(.123,.152,.112);
for(const sign of [-1,1]){
 oval('Ear',skin,[sign*.12,.17,-.002],[.020,.034,.017],head);oval('EarFold',skinShadow,[sign*.13,.17,.012],[.010,.022,.007],head);
 oval('EyeWhite',white,[sign*.047,.203,.102],[.023,.010,.009],head);oval('Iris',iris,[sign*.045,.203,.112],[.008,.0085,.003],head);oval('Pupil',black,[sign*.045,.203,.115],[.0035,.005,.002],head);
 oval('EyeCatchlight',white,[sign*.045-.002,.207,.117],[.002,.002,.001],head);
 line('UpperEyelid',skin,[[sign*.024,.202,.110],[sign*.045,.214,.113],[sign*.069,.205,.103]],.003,head);
 line('LowerEyelid',skinShadow,[[sign*.026,.196,.109],[sign*.047,.192,.111],[sign*.068,.196,.104]],.0016,head);
 line('Eyebrow',tourist?material('#807055'):hair,[[sign*.023,.229,.106],[sign*.044,.235,.108],[sign*.071,.229,.100]],female?.0035:.0045,head);
 if(!female)oval('Sideburn',hair,[sign*.113,.232,.014],[.009,.028,.015],head);
 if(id==='explorer')line('SmileFold',skinShadow,[[sign*.026,.151,.112],[sign*.038,.134,.109],[sign*.032,.115,.103]],.0011,head);
}
oval('NoseBridge',skin,[0,.180,.114],[female?.013:.016,.030,.021],head);oval('NoseTip',skin,[0,.158,.135],[female?.017:.020,.012,.012],head);
for(const s of [-1,1]){oval('NostrilWing',skin,[s*.013,.153,.124],[.009,.008,.009],head);oval('Nostril',skinShadow,[s*.009,.148,.132],[.003,.002,.003],head);}
line('UpperLip',lips,[[-.024,.119,.105],[-.009,.122,.114],[0,.119,.117],[.009,.122,.114],[.024,.119,.105]],female?.0029:.0023,head);
line('LowerLip',lips,[[-.022,.117,.106],[0,.113,.115],[.022,.117,.106]],.0028,head);
line('Mouth',skinShadow,[[-.022,.118,.108],[0,.117,.117],[.022,.118,.108]],.0012,head);
if(id==='explorer'){
contour('JacketBody',jacket,[[-.10,.14,.10],[-.075,.175,.118],[.04,.177,.123],[.22,.193,.13],[.34,.21,.119],[.405,.174,.094],[.44,.081,.060]],upper);
contour('JacketHem',trim,[[-.105,.139,.101],[-.075,.176,.121]],upper);
oval('Hood',trim,[0,.415,-.065],[.11,.054,.07],upper);
line('CollarLeft',trim,[[-.07,.435,.053],[-.095,.36,.108],[-.055,.31,.132]],.013,upper);
line('CollarRight',trim,[[.07,.435,.053],[.095,.36,.108],[.055,.31,.132]],.013,upper);
line('Zipper',metal,[[0,-.07,.121],[0,.25,.135],[0,.40,.084]],.0032,upper);
for(const sign of [-1,1]){
 oval('JacketPocket',trim,[sign*.098,.018,.123],[.060,.071,.016],upper);
 line('PocketFlap',seam,[[sign*.041,.064,.140],[sign*.145,.064,.125]],.004,upper);
 line('ShoulderStrap',pack,[[sign*.13,.005,.130],[sign*.145,.30,.115],[sign*.145,.41,0],[sign*.13,.29,-.146]],.018,upper);
 oval('StrapBuckle',metal,[sign*.141,.22,.141],[.021,.025,.008],upper);
}
oval('Backpack',pack,[0,.175,-.173],[.165,.215,.081],upper);
oval('BackpackPanel',trim,[0,.147,-.240],[.128,.154,.014],upper);
line('PackSeam',seam,[[-.12,.03,-.244],[-.13,.25,-.232],[0,.31,-.239],[.13,.25,-.232],[.12,.03,-.244]],.003,upper);
line('PackHandle',pack,[[-.045,.37,-.18],[-.032,.402,-.18],[.032,.402,-.18],[.045,.37,-.18]],.009,upper);
}
if(id!=='explorer'){
 const body=contour('Outfit',jacket,[[-.10,.14,.10],[-.075,female?.163:.175,.118],[.04,female?.151:.177,.114],[.22,female?.170:.193,.125],[.34,female?.190:.21,.112],[.405,female?.161:.174,.09],[.44,.075,.060]],upper);
 if(tourist){const colors=[],p=body.geometry.attributes.position,palette=['#71b8bc','#c08fb1','#b1bd74','#827bb3'].map(c=>new Color(c));for(let i=0;i<p.count;i++){const t=(Math.sin(p.getX(i)*17+p.getY(i)*11)+1)*1.5,a=Math.floor(t),c=palette[a].clone().lerp(palette[Math.min(3,a+1)],t-a);colors.push(c.r,c.g,c.b);}body.material=material('#ffffff');body.material.vertexColors=true;body.geometry.setAttribute('color',new Float32BufferAttribute(colors,3));
  const straw=material('#c8b985'),hairShade=material('#8a7955');oval('HatBrim',straw,[0,.308,0],[.235,.016,.198],head);contour('StrawHatCrown',straw,[[.31,.133,.123],[.33,.131,.120],[.40,.11,.10],[.415,.02,.02]],head);contour('HatBand',trim,[[.327,.134,.124],[.35,.130,.121]],head);
  oval('BobBack',hair,[0,.179,-.046],[.128,.118,.091],head);
  for(const s of [-1,1])for(let i=0;i<4;i++)line('BobLock',i%2?hair:hairShade,[[s*(.075+i*.012),.285,.04-i*.025],[s*(.111+i*.009),.207,.047-i*.029],[s*(.111+i*.008),.108,.032-i*.025],[s*(.094+i*.009),.093,.026-i*.024]],.012,head);
  const lens=material('#203f45',.18),frame=material('#8b866b',.28,.65);
  for(const s of [-1,1]){oval('SunglassLens',lens,[s*.048,.202,.127],[.034,.024,.007],head);const rim=part('SunglassFrame',new TorusGeometry(.031,.0024,6,24),frame,[s*.048,.202,.132],head);rim.scale.set(1.10,.78,1);line('SunglassArm',frame,[[s*.080,.203,.126],[s*.120,.205,.049],[s*.122,.196,.012]],.0025,head);}
  line('SunglassBridge',frame,[[-.017,.210,.128],[0,.216,.137],[.017,.210,.128]],.0025,head);
  line('CameraStrap',black,[[-.095,.38,.075],[-.12,.15,.145],[0,.025,.193],[.12,.15,.145],[.095,.38,.075]],.006,upper);oval('CameraBody',black,[0,.03,.173],[.088,.058,.031],upper);oval('CameraLensRim',metal,[0,.03,.204],[.036,.036,.015],upper);oval('CameraLens',black,[0,.03,.218],[.028,.028,.008],upper);
 }
 if(pedestrian){
  contour('CasualCollar',trim,[[.407,.105,.076],[.438,.080,.062]],upper);
  oval('ShirtPocket',jacket,[-.10,.20,.127],[.052,.052,.009],upper);
  line('PocketSeam',seam,[[-.145,.243,.13],[-.055,.243,.13]],.002,upper);
  for(let y=.04;y<.34;y+=.10)oval('ShirtButton',trim,[0,y,.136],[.004,.004,.003],upper);
  line('ShirtPlacket',trim,[[0,-.03,.124],[0,.20,.130],[0,.36,.108]],.004,upper);
 }
 if(commuter){
  const braidShade=material('#654a38');oval('BraidedBun',hair,[0,.221,-.121],[.085,.066,.062],head);
  for(let i=0;i<18;i++){const a=i/17*Math.PI,x=Math.cos(a)*.116,y=.245+Math.sin(a)*.095;const strand=part('CrownBraid',new SphereGeometry(1,12,8),i%2?hair:braidShade,[x,y,.025+Math.sin(a)*.043],head);strand.scale.set(.019,.013,.016);strand.rotation.z=a+(i%2?.48:-.48);}
  for(let i=0;i<14;i++){const a=i/14*Math.PI*2,strand=part('BunBraid',new SphereGeometry(1,12,8),i%2?hair:braidShade,[Math.cos(a)*.065,.221+Math.sin(a)*.043,-.17],head);strand.scale.set(.020,.013,.012);strand.rotation.z=a;}
  line('JacketZip',metal,[[0,-.075,.120],[0,.23,.135],[0,.42,.07]],.003,upper);
  for(const sign of [-1,1])line('ReflectivePiping',seam,[[sign*.145,-.06,.111],[sign*.162,.27,.085],[sign*.08,.42,.05]],.006,upper);
  line('JacketCollar',trim,[[-.065,.433,.064],[-.085,.37,.101],[0,.325,.131],[.085,.37,.101],[.065,.433,.064]],.010,upper);
  oval('JacketBuckle',metal,[.022,.32,.141],[.019,.014,.005],upper);
  const leather=material('#ae8861',.69),bagTrim=material('#82634a',.76);line('CrossbodyStrap',bagTrim,[[-.145,.42,.073],[-.087,.20,.145],[.068,.0,.142],[.195,-.078,.09]],.012,upper);
  oval('Satchel',leather,[.19,-.093,.055],[.105,.121,.063],upper);oval('SatchelFlap',leather,[.19,-.04,.113],[.10,.046,.014],upper);oval('BagClasp',metal,[.19,-.08,.128],[.010,.018,.007],upper);
  line('BagStitching',bagTrim,[[.104,-.067,.116],[.11,-.174,.111],[.19,-.198,.108],[.27,-.174,.111],[.276,-.067,.116]],.002,upper);
 }
}
contour('Pelvis',pants,[[.82,.13,.10],[.89,.173,.11],[.97,.157,.115],[1.01,.143,.105]],root);
for(const [side,x,sign]of [['Left',-.1,-1],['Right',.1,1]]){
 const leg=group(side+'Leg',root,[x,.88,0]);
 contour('TrouserThigh',pants,[[.02,.076,.094],[-.08,.080,.090],[-.22,.069,.079],[-.35,.062,.065]],leg);
 if(!tourist&&!pedestrian){oval('CargoPocket',cargo,[sign*.063,-.17,.013],[.025,.087,.059],leg);line('CargoFlap',trim,[[sign*.081,-.10,-.025],[sign*.086,-.10,.054]],.005,leg);}
 const knee=group(side+'Knee',leg,[0,-.35,0]);oval('Knee',tourist?skin:pants,[0,-.006,.002],[.063,.066,.067],knee);
 contour('TrouserCalf',tourist?skin:pants,[[.015,.061,.066],[-.08,.065,.067],[-.20,.060,.060],[-.31,.049,.052],[-.35,.048,.048]],knee);
 if(tourist)contour('CrewSock',white,[[-.24,.052,.054],[-.35,.048,.049]],knee);
 const ankle=group(side+'Ankle',knee,[0,-.35,0]);
 const footwear=ankle;
 oval('BootUpper',boot,[0,-.070,.032],[.059,tourist?.061:.091,.095],footwear);
 oval('BootToe',boot,[0,-.120,.079],[.067,.042,.111],footwear);oval('BootSole',sole,[0,-.155,.058],[.069,.014,.125],footwear);
 for(let i=0;i<4;i++)line('Laces',seam,[[-.033,-.056-i*.016,.095],[.033,-.059-i*.016,.100]],.003,footwear);
 const arm=group(side+'Arm',upper,[x*(female?2.15:2.25),.38,0]);
 oval('Shoulder',jacket,[0,-.038,0],[female?.069:.075,.079,.071],arm);
 contour('JacketSleeve',jacket,tourist?[[.012,.058,.060],[-.05,.064,.067],[-.125,.059,.059]]:[[.012,.062,.062],[-.05,.067,.069],[-.16,.058,.057],[-.24,.050,.050]],arm);
 if(tourist)contour('BareUpperArm',skin,[[-.12,.054,.053],[-.18,.050,.049],[-.24,.048,.047]],arm);
 const elbow=group(side+'Elbow',arm,[0,-.24,0]);oval('Elbow',tourist?skin:jacket,[0,-.015,0],[.054,.054,.055],elbow);
 contour('SleeveForearm',tourist?skin:jacket,[[0,.051,.051],[-.08,.053,.049],[-.17,.044,.042],[-.218,.038,.036]],elbow);
 if(!tourist)contour('Cuff',trim,[[-.215,.040,.037],[-.245,.039,.034]],elbow);
 oval('HandPalm',skin,[0,-.274,.005],[.038,.052,.026],elbow);
 for(let finger=0;finger<4;finger++)oval('Finger',skin,[-.025+finger*.016,-.310+Math.abs(finger-1.5)*.004,.006],[.009,.025,.013],elbow);
 oval('Thumb',skin,[sign*.037,-.276,.017],[.014,.026,.017],elbow);
}
// Merge pieces by material inside each animated pivot: detail without hundreds
// of per-piece draw calls. All named animation groups retain their base offsets.
root.traverse(parent=>{if(!parent.isGroup)return;const batches=new Map();for(const child of [...parent.children]){if(!child.isMesh)continue;child.updateMatrix();const g=child.geometry.index?child.geometry.toNonIndexed():child.geometry.clone();g.applyMatrix4(child.matrix);if(!batches.has(child.material))batches.set(child.material,[]);batches.get(child.material).push(g);parent.remove(child);}for(const [m,gs]of batches){const geometry=mergeGeometries(gs,false),surface=new Uint8Array(geometry.attributes.position.count*3);for(let i=0;i<surface.length;i+=3){surface[i]=Math.round(m.roughness*255);surface[i+1]=Math.round(m.metalness*255);surface[i+2]=Math.round((m.userData.skin??0)*255);}geometry.setAttribute('surface',new Uint8BufferAttribute(surface,3,true));const mesh=new Mesh(geometry,m);mesh.name=parent.name+'Finish';parent.add(mesh);}});
const binary=await new GLTFExporter().parseAsync(root,{binary:true,trs:true});mkdirSync('public/characters',{recursive:true});const file=id==='explorer'?'public/player.glb':`public/characters/${id}.glb`;writeFileSync(file,Buffer.from(binary));console.log(displayName,'exported:',binary.byteLength,'bytes');
