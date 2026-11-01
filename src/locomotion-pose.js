// Visual pose only: metres/radians in the glTF's +Y-up, +Z-forward frame.
// Physics and the camera continue to follow the unchanged capsule position.
const mix=(a,b,t)=>a+(b-a)*t;
const ease=t=>t*t*(3-2*t);
export function locomotionPose(player){
 const weight=player.poseWeight??0,run=ease(player.runBlend??0),phase=player.gaitPhase??0,air=ease(player.airBlend??0);
 const angles={},translations={},rotations={};
 for(const [side,offset,sign] of [['Left',0,-1],['Right',Math.PI,1]]){
  const p=phase+offset,swing=Math.sin(p),lift=Math.max(0,Math.sin(p-.35));
  // Thigh leads; the knee folds later during recovery, then extends for landing.
  const hip=-swing*mix(.32,.67,run)*weight;
  const knee=(.055+lift*lift*mix(.48,1.12,run))*weight;
  const stance=(1-swing)*.5;
  angles[side+'Leg']=mix(hip,side==='Left'?-.24:-.10,air);angles[side+'Knee']=mix(knee,side==='Left'?.62:.45,air);
  angles[side+'Ankle']=mix((-(hip+knee)*mix(.78,.55,run)*stance+.075*(1-swing)*.5)*weight,-.16,air);
  angles[side+'Arm']=mix(swing*mix(.23,.48,run)*weight-mix(.025,.10,run)*weight,-.35,air);
  angles[side+'Elbow']=mix(-.10-weight*(mix(.10,1.05,run)+.07*Math.sin(p-.5)),-.70,air);
  rotations[side+'Arm']=[angles[side+'Arm'],0,sign*mix(.045+.025*weight,.13,air)];
 }
 rotations.UpperBody=[mix(mix(.015,.135,run)*weight,.07,air),.045*Math.sin(phase)*weight*(1-air),-.012*Math.cos(phase)*weight*(1-air)];
 rotations.Head=[-.6*rotations.UpperBody[0],-.45*rotations.UpperBody[1],-.4*rotations.UpperBody[2]];
 rotations.Player=[0,0,.012*Math.cos(phase)*weight*(1-air)];
 translations.Player=[.005*Math.cos(phase)*weight*(1-air),-.012+mix(.010,.021,run)*(1-Math.cos(phase*2))*.5*weight*(1-air),0];
 translations.UpperBody=[0,.0015*Math.sin((player.animationTime??0)*2.4)*(1-weight)*(1-air),0];
 const reach=Math.max(0,Math.min(1,player.interactionWeight??0));
 if(reach){
  const arrest=player.interactionMotion==='arrest',effort=.025*Math.sin((player.animationTime??0)*4);
  rotations.UpperBody[0]=mix(rotations.UpperBody[0],arrest?.08:.16+effort,reach);
  rotations.UpperBody[1]=mix(rotations.UpperBody[1],arrest?0:-.09,reach);
  rotations.Head[0]=mix(rotations.Head[0],-.09,reach);
  for(const [side,sign]of [['Left',-1],['Right',1]]){
   const forward=arrest||side==='Right';
   rotations[side+'Arm']=[mix(angles[side+'Arm'],forward?-.65+effort:-.08,reach),0,sign*mix(.045,forward?.09:.05,reach)];
   angles[side+'Elbow']=mix(angles[side+'Elbow'],forward?-.72:-.16,reach);
  }
 }
 return {angles,translations,rotations};
}
