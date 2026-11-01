import D from '../public/data/white_male-motion.json' with {type:'json'};
import {sampleRigPose} from './rig-pose.js';
export {sampleRigPose} from './rig-pose.js';
export const HOODIE_BONES=Object.keys(D.nodes);
export const usesHoodieRig=(design,character)=>design==='white_male'&&character!=='pedestrian';
export const hoodiePose=p=>sampleRigPose(D,p);
