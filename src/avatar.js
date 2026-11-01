import{SKELETAL_BONES,skeletalPose,usesSkeletalRig,skeletalRigReady,loadSkeletalRig}from'./skeletal-motion.js';
import {gaitVertexShader,gaitUniforms} from './character-gait-shader.js';
import {readDesignSelection} from './design-selection.js';
import {normalizeDesign,designModelUri} from './character-designs.js';
import {CustomShader,UniformType,Cartesian4,LightingModel,CallbackProperty,NodeTransformationProperty,Quaternion,Cartesian3,Cartesian2,Transforms,HeadingPitchRoll,Color,ColorBlendMode,LabelStyle,DistanceDisplayCondition} from 'cesium';
import {PLAYER_COLORS} from './multiplayer-debug.js';
import {CharacterLighting} from './character-rendering.js';
import {CHARACTERS,selectCharacter} from './characters.js';
import {locomotionPose} from './locomotion-pose.js';
import {toWorld} from './coordinates.js';
export function createAvatar(viewer,getPlayer,{characterId='explorer',show=()=>true,name=null,slot=0,designId=null,onError=error=>console.warn('Character unavailable',error.message)}={}){
 let chosenDesign=normalizeDesign(designId??readDesignSelection());
 const modelUri=id=>designModelUri(chosenDesign,id==='pedestrian');
 const lighting=new CharacterLighting(),joints={};let poseCache=null,poseState=[];
 const getPose=()=>{const p=getPlayer(),state=[p.gaitPhase,p.runBlend,p.poseWeight,p.airBlend,p.animationTime,p.interactionWeight,p.interactionMotion];if(!poseCache||state.some((v,i)=>v!==poseState[i])){poseCache=locomotionPose(p);poseState=state;}return poseCache;};
 const names=['Player','UpperBody','Head',...['Left','Right'].flatMap(side=>['Leg','Knee','Ankle','Arm','Elbow'].map(part=>side+part))];
 for(const name of names)joints[name]=new NodeTransformationProperty({
  rotation:new CallbackProperty(()=>{const pose=getPose(),r=pose.rotations[name]??[pose.angles[name]??0,0,0],qx=Quaternion.fromAxisAngle(Cartesian3.UNIT_X,r[0]),qy=Quaternion.fromAxisAngle(Cartesian3.UNIT_Y,r[1]),qz=Quaternion.fromAxisAngle(Cartesian3.UNIT_Z,r[2]);return Quaternion.multiply(qz,Quaternion.multiply(qy,qx,new Quaternion()),new Quaternion());},false),
  translation:new CallbackProperty(()=>Cartesian3.fromArray(getPose().translations[name]??[0,0,0]),false)
 });
 const character=CHARACTERS.find(c=>c.id===characterId)??CHARACTERS[0];
 let selectedId=character.id,rigCache=null,rigKey='',disposed=false,loadingKey='',loading=null,retryAt=0;
 const rigReady=()=>skeletalRigReady(chosenDesign,selectedId);
 const ready=()=>{
  const key=chosenDesign+'/'+selectedId;
  if(loadingKey===key&&loading)return loading;
  loadingKey=key;
  const promise=loadSkeletalRig(chosenDesign,selectedId).then(()=>{if(!disposed&&loadingKey===key){rigCache=null;retryAt=0;viewer.scene.requestRender?.();}});
  loading=promise;
  promise.catch(error=>{if(!disposed&&loadingKey===key){loading=null;retryAt=performance.now()+15000;onError(error);}});
  return promise;
 };
 const loadVisible=()=>{if(!disposed&&show()&&!rigReady()&&performance.now()>=retryAt)ready();};
const getRigPose=()=>{const p=getPlayer(),key=[chosenDesign,selectedId,p.gaitPhase,p.runBlend,p.poseWeight,p.animationTime,p.carHitAt].join('/');if(!rigCache||key!==rigKey){rigKey=key;rigCache=skeletalPose(p,chosenDesign,selectedId);}return rigCache;};
 for(const name of SKELETAL_BONES){const fallback=joints[name];joints[name]=new NodeTransformationProperty({rotation:new CallbackProperty(()=>usesSkeletalRig(chosenDesign,selectedId)?new Quaternion(...(getRigPose()[name]?.rotation??[0,0,0,1])):fallback?.rotation.getValue()??Quaternion.IDENTITY,false),translation:new CallbackProperty(()=>usesSkeletalRig(chosenDesign,selectedId)?Cartesian3.fromArray(getRigPose()[name]?.translation??[0,0,0]):fallback?.translation.getValue()??Cartesian3.ZERO,false)});}
 const entity=viewer.entities.add({
  position:new CallbackProperty(()=>toWorld(getPlayer().position),false),
  orientation:new CallbackProperty(()=>Transforms.headingPitchRollQuaternion(toWorld(getPlayer().position),new HeadingPitchRoll(getPlayer().heading-Math.PI/2,0,0)),false),
  model:{uri:show()?modelUri(character.id):undefined,customShader:new CustomShader({uniforms:{u_skeletal:{type:UniformType.FLOAT,value:usesSkeletalRig(chosenDesign,selectedId)?1:0},u_leftLeg:{type:UniformType.VEC4,value:new Cartesian4()},u_rightLeg:{type:UniformType.VEC4,value:new Cartesian4()},u_leftArm:{type:UniformType.VEC2,value:new Cartesian2()},u_rightArm:{type:UniformType.VEC2,value:new Cartesian2()},u_body:{type:UniformType.VEC2,value:new Cartesian2()}},vertexShaderText:gaitVertexShader,lightingModel:LightingModel.UNLIT,fragmentShaderText:`void fragmentMain(FragmentInput fsInput,inout czm_modelMaterial material){material.diffuse*=.55;}`}),scale:1,minimumPixelSize:0,runAnimations:false,nodeTransformations:joints,shadows:0,show:new CallbackProperty(()=>!!entity.model.uri?.getValue()&&rigReady()&&show(),false)}
 });
 let label=null,debugSlot=null;
 function ensureLabel(){if(label)return;label=viewer.entities.add({position:new CallbackProperty(()=>{const p=getPlayer().position;return toWorld({x:p.x,y:p.y,z:p.z+2.05});},false),
  label:{text:new CallbackProperty(()=>debugSlot===null?(name??''):`Player ${debugSlot+1}`,false),font:'bold 12px Arial',fillColor:new CallbackProperty(()=>Color.fromCssColorString(PLAYER_COLORS[debugSlot??slot]??'#ffffff'),false),outlineColor:Color.BLACK,outlineWidth:2,style:LabelStyle.FILL_AND_OUTLINE,pixelOffset:new Cartesian2(0,-8),showBackground:true,backgroundColor:Color.fromCssColorString('#102030b0'),distanceDisplayCondition:new DistanceDisplayCondition(0,85),show:new CallbackProperty(()=>show()&&(debugSlot!==null||!!name),false)}});}
 if(name)ensureLabel();
 let last=performance.now();const removeRender=viewer.scene.preRender.addEventListener(()=>{const now=performance.now();const shader=entity.model.customShader.getValue(),u=gaitUniforms(getPose());shader.setUniform('u_skeletal',usesSkeletalRig(chosenDesign,selectedId)?1:0);for(const [key,value]of Object.entries(u))shader.setUniform('u_'+key,value.length===4?Cartesian4.fromArray(value):Cartesian2.fromArray(value));loadVisible();if(show()&&!entity.model.uri?.getValue())entity.model.uri=modelUri(selectedId);if(show()&&rigReady())lighting.update(viewer.camera,getPlayer().position,(now-last)/1000);last=now;});
 let hairColor='natural';const setHairColor=id=>{if(id===hairColor)return;hairColor=id;lighting.setHairColor(id);};
 loadVisible();
 return {entity,lighting,setHairColor,ready,setDesign(id){const next=normalizeDesign(id);if(next!==chosenDesign){chosenDesign=next;rigCache=null;retryAt=0;entity.model.uri=show()?modelUri(selectedId):undefined;loadVisible();}},get label(){return label;},setDebugPlayer(slot){debugSlot=Number.isInteger(slot)&&slot>=0&&slot<4?slot:null;if(debugSlot!==null)ensureLabel();entity.model.color=debugSlot===null?Color.WHITE:Color.fromCssColorString(PLAYER_COLORS[debugSlot]);entity.model.colorBlendMode=ColorBlendMode.MIX;entity.model.colorBlendAmount=debugSlot===null?0:.18;},select(id){if(id===selectedId)return CHARACTERS.find(c=>c.id===id);const c=CHARACTERS.find(c=>c.id===id)??CHARACTERS[0];selectedId=c.id;rigCache=null;retryAt=0;entity.model.uri=show()?modelUri(selectedId):undefined;loadVisible();return c;},destroy(){disposed=true;removeRender();viewer.entities.remove(entity);if(label)viewer.entities.remove(label);entity.model.customShader?.getValue()?.destroy();lighting.destroy();}};
}
