import {Quaternion,Vector3} from 'three';
function sample(track,t,rotation=false){if(!track)return null;const ts=track.times,vs=track.values;let j=0;while(j<ts.length-2&&ts[j+1]<t)j++;const u=Math.max(0,Math.min(1,(t-ts[j])/(ts[j+1]-ts[j]||1)));return rotation?new Quaternion(...vs[j]).slerp(new Quaternion(...vs[Math.min(j+1,vs.length-1)]),u).toArray():vs[j].map((v,k)=>v+(vs[Math.min(j+1,vs.length-1)][k]-v)*u);}
export function sampleRigPose(data,p){
 const phase=((p.gaitPhase??0)/(Math.PI*2)%1+1)%1;
 const run=Math.max(0,Math.min(1,p.runBlend??0));
 const weight=Math.max(0,Math.min(1,p.poseWeight??0));
 const age=(p.animationTime??0)-(p.carHitAt??-Infinity);
 const reaction=p.carHitAt>=0&&age>=0&&age<4?Math.min(1,age/.18,(4-age)/.35):0;
 const result={};
 for(const name of Object.keys(data.nodes)){
  if(weight===0&&!data.idle&&!reaction){result[name]={rotation:[0,0,0,1],translation:[0,0,0]};continue;}
  const rest=data.nodes[name],idle=data.idle?.[name]??rest;
  const w=data.clips.walking,r=data.clips.running,wt=w.tracks[name],rt=r.tracks[name];
  const qw=new Quaternion(...(sample(wt?.rotation,phase*w.duration,true)??rest.rotation));
  const qr=new Quaternion(...(sample(rt?.rotation,phase*r.duration,true)??rest.rotation));
  const standing=data.clips.standing?.tracks[name];
  const idleRotation=new Quaternion(...idle.rotation);
  const idleTranslation=[...idle.translation];
  if(reaction&&standing){
   idleRotation.slerp(new Quaternion(...(sample(standing.rotation,age,true)??idle.rotation)),reaction);
   const st=sample(standing.translation,age)??idle.translation;
   for(let i=0;i<3;i++)idleTranslation[i]+=(st[i]-idleTranslation[i])*reaction;
  }
  const q0=new Quaternion(...rest.rotation);
  const absolute=idleRotation.slerp(qw.slerp(qr,run),weight);
  const delta=q0.clone().invert().multiply(absolute);
  const tw=sample(wt?.translation,phase*w.duration)??rest.translation;
  const tr=sample(rt?.translation,phase*r.duration)??rest.translation;
  const translation=new Vector3(...tw.map((v,i)=>idleTranslation[i]+(v+(tr[i]-v)*run-idleTranslation[i])*weight-rest.translation[i])).applyQuaternion(q0.clone().invert());
  translation.set(translation.x/rest.scale[0],translation.y/rest.scale[1],translation.z/rest.scale[2]);
  result[name]={rotation:delta.toArray(),translation:translation.toArray()};
 }
 return result;
}
