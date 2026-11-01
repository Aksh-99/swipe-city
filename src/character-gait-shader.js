// Uploaded models share a centred +Y-up authoring frame (~1.9 units high).
// Apply the existing articulated gait directly to their vertices. This keeps
// all original geometry/textures and avoids downloading another rigged copy.
export const gaitVertexShader=`
vec3 bendX(vec3 p, vec3 pivot, float a) {
  p-=pivot; float c=cos(a),s=sin(a);
  return pivot+vec3(p.x,c*p.y-s*p.z,s*p.y+c*p.z);
}
void vertexMain(VertexInput vsInput, inout czm_modelVertexOutput vsOutput) {
  if(u_skeletal>.5)return;
  vec3 p=vsInput.attributes.positionMC;
  // Local upload coordinates: feet -0.952, crown +0.951.
  float h=(p.y+0.952)/1.903;
  float right=smoothstep(-0.035,0.035,p.x);
  vec4 leg=mix(u_leftLeg,u_rightLeg,right);
  vec2 arm=mix(u_leftArm,u_rightArm,right);
  float legWeight=1.0-smoothstep(0.43,0.54,h);
  vec3 legPose=p;
  legPose=bendX(legPose,vec3(p.x,-0.77,0.0),leg.z*(1.0-smoothstep(0.08,0.14,h)));
  legPose=bendX(legPose,vec3(p.x,-0.38,0.0),leg.y*(1.0-smoothstep(0.28,0.34,h)));
  legPose=bendX(legPose,vec3(p.x,-0.015,0.0),leg.x);
  // Side regions below shoulders are arms; blend at the shoulder seam.
  float armWeight=smoothstep(0.17,0.245,abs(p.x))*smoothstep(0.43,0.55,h)*(1.0-smoothstep(0.76,0.82,h));
  vec3 armPose=bendX(p,vec3(p.x,0.15,0.0),arm.y*(1.0-smoothstep(0.58,0.65,h)));
  armPose=bendX(armPose,vec3(p.x,0.53,0.0),arm.x);
  p=mix(p,legPose,legWeight);
  p=mix(p,armPose,armWeight);
  p=bendX(p,vec3(0.0,0.0,0.0),u_body.x*smoothstep(0.46,0.64,h));
  p.y+=u_body.y;
  vsOutput.positionMC=p;
}`;
export function gaitUniforms(pose){
 const a=pose.angles;
 return {
  leftLeg:[a.LeftLeg,a.LeftKnee,a.LeftAnkle,0],rightLeg:[a.RightLeg,a.RightKnee,a.RightAnkle,0],
  leftArm:[pose.rotations.LeftArm[0],a.LeftElbow],rightArm:[pose.rotations.RightArm[0],a.RightElbow],
  body:[pose.rotations.UpperBody[0],pose.translations.Player[1]+.012]
 };
}
