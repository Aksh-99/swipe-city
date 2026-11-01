import {CHARACTER_DESIGNS} from './character-designs.js';
import {Vector3} from 'three';
import {NPC_PEDESTRIANS} from './npc-config.js';
import {createAvatar} from './avatar.js';
import {DetailMesh} from './detail-mesh.js';
export function npcCollisionGeometry(){
 const mesh=new DetailMesh();for(const n of NPC_PEDESTRIANS){const p=new Vector3(...n.position);mesh.tube(p.clone().add(new Vector3(0,0,.04)),p.clone().add(new Vector3(0,0,1.72)),.25,null,true,10);}return new Float32Array(mesh.collision);
}
export function addNpcPedestrians(viewer,collision,getPlayer){
 let active=false;const start=performance.now(),people=NPC_PEDESTRIANS.map((n,index)=>{
  const pose={position:new Vector3(...n.position),heading:n.heading,speed:0,running:false,gaitPhase:0,runBlend:0,poseWeight:0,airBlend:0,animationTime:0};
  const avatar=createAvatar(viewer,()=>pose,{characterId:n.characterId,designId:CHARACTER_DESIGNS[index%CHARACTER_DESIGNS.length].id,show:()=>active&&collision.ready(pose.position)&&pose.position.distanceToSquared(getPlayer().position)<70*70});return {...n,pose,avatar};
 });
 return {people,setLightFaces(faces){for(const n of people)n.avatar.lighting.setFaces(faces);},
  update(enabled){if(enabled!==active){active=enabled;if(active)collision.addStatic('npc-pedestrians',npcCollisionGeometry());else{collision.loaded.get('npc-pedestrians')?.geometry.dispose();collision.loaded.delete('npc-pedestrians');}}
   const elapsed=(performance.now()-start)/1000;for(const [i,n]of people.entries())n.pose.animationTime=elapsed+i*2.1;
  },destroy(){this.update(false);for(const n of people)n.avatar.destroy();}};
}
