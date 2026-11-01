import {CallbackProperty} from 'cesium';
import {trafficOrientation,createTrafficShader} from './traffic-rendering.js';
import {toWorld} from './coordinates.js';
import {TrafficSimulation,buildTrafficNetwork} from './npc-traffic-sim.js';
const styles=['taxi','silver','black','blue','red','suv','van'];
export function addNpcTraffic(viewer,streets,streetDetails,getPeople=()=>[],{clock=()=>performance.now()}={}){
 const simulation=new TrafficSimulation(buildTrafficNetwork(streets,streetDetails.layout)),models=[];let last=clock(),accumulator=0,people=getPeople();
 for(const car of simulation.cars){const shader=createTrafficShader();
  const entity=viewer.entities.add({name:'City traffic '+car.id,position:new CallbackProperty(()=>toWorld(car.position),false),orientation:new CallbackProperty(()=>trafficOrientation(car.position,car.heading),false),model:{uri:'/traffic/'+styles[car.id%styles.length]+'.glb',customShader:shader,scale:1,runAnimations:false,shadows:0,show:new CallbackProperty(()=>{const p=people[0]?.position;return !p||Math.hypot(p.x-car.position.x,p.y-car.position.y)<230;},false)}});models.push({entity,shader,car,lastBrake:false});
 }
 const remove=viewer.scene.preUpdate.addEventListener(()=>{const now=clock(),dt=Math.min(.1,(now-last)/1000);last=now;if(document.hidden)return;people=getPeople();accumulator=Math.min(.2,accumulator+dt);while(accumulator>=1/30){simulation.update(1/30,streetDetails.phase,{pedestrians:people});accumulator-=1/30;}for(const model of models)if(model.lastBrake!==model.car.braking){model.shader.setUniform('u_brake',model.car.braking?1:0);model.lastBrake=model.car.braking;}});
 return {simulation,count:simulation.cars.length,destroy(){remove();for(const {entity,shader}of models){viewer.entities.remove(entity);shader.destroy();}}};
}
