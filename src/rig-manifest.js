// Bone names are tiny; animation tracks load only when an avatar needs them.
export const SKELETAL_BONES=Object.freeze(["Bone_020", "Bone_021", "Bone_025", "Bone_026", "Bone_030", "Bone_031", "Bone_045", "Bone_046", "headfront", "mixamorig:Head", "mixamorig:HeadTop_End", "mixamorig:Hips", "mixamorig:LeftArm", "mixamorig:LeftFoot", "mixamorig:LeftForeArm", "mixamorig:LeftHand", "mixamorig:LeftHandIndex1", "mixamorig:LeftHandIndex2", "mixamorig:LeftHandIndex3", "mixamorig:LeftHandIndex4", "mixamorig:LeftHandMiddle1", "mixamorig:LeftHandMiddle2", "mixamorig:LeftHandMiddle3", "mixamorig:LeftHandMiddle4", "mixamorig:LeftHandPinky1", "mixamorig:LeftHandPinky2", "mixamorig:LeftHandPinky3", "mixamorig:LeftHandPinky4", "mixamorig:LeftHandRing1", "mixamorig:LeftHandRing2", "mixamorig:LeftHandRing3", "mixamorig:LeftHandRing4", "mixamorig:LeftHandThumb1", "mixamorig:LeftHandThumb2", "mixamorig:LeftHandThumb3", "mixamorig:LeftHandThumb4", "mixamorig:LeftLeg", "mixamorig:LeftShoulder", "mixamorig:LeftToeBase", "mixamorig:LeftToe_End", "mixamorig:LeftUpLeg", "mixamorig:Neck", "mixamorig:RightArm", "mixamorig:RightFoot", "mixamorig:RightForeArm", "mixamorig:RightHand", "mixamorig:RightHandIndex1", "mixamorig:RightHandIndex2", "mixamorig:RightHandIndex3", "mixamorig:RightHandIndex4", "mixamorig:RightHandMiddle1", "mixamorig:RightHandMiddle2", "mixamorig:RightHandMiddle3", "mixamorig:RightHandMiddle4", "mixamorig:RightHandPinky1", "mixamorig:RightHandPinky2", "mixamorig:RightHandPinky3", "mixamorig:RightHandPinky4", "mixamorig:RightHandRing1", "mixamorig:RightHandRing2", "mixamorig:RightHandRing3", "mixamorig:RightHandRing4", "mixamorig:RightHandThumb1", "mixamorig:RightHandThumb2", "mixamorig:RightHandThumb3", "mixamorig:RightHandThumb4", "mixamorig:RightLeg", "mixamorig:RightShoulder", "mixamorig:RightToeBase", "mixamorig:RightToe_End", "mixamorig:RightUpLeg", "mixamorig:Spine", "mixamorig:Spine1", "mixamorig:Spine2"]);
export const RIG_LOADERS=Object.freeze({
  'african':()=>import('../public/data/african-motion.json', {with:{type:'json'}}),
  'african_fem':()=>import('../public/data/african_fem-motion.json', {with:{type:'json'}}),
  'african_fem_officer':()=>import('../public/data/african_fem_officer-motion.json', {with:{type:'json'}}),
  'african_officer':()=>import('../public/data/african_officer-motion.json', {with:{type:'json'}}),
  'asian':()=>import('../public/data/asian-motion.json', {with:{type:'json'}}),
  'asian_fem':()=>import('../public/data/asian_fem-motion.json', {with:{type:'json'}}),
  'asian_fem_officer':()=>import('../public/data/asian_fem_officer-motion.json', {with:{type:'json'}}),
  'asian_officer':()=>import('../public/data/asian_officer-motion.json', {with:{type:'json'}}),
  'bald':()=>import('../public/data/bald-motion.json', {with:{type:'json'}}),
  'bald_officer':()=>import('../public/data/bald_officer-motion.json', {with:{type:'json'}}),
  'blonde':()=>import('../public/data/blonde-motion.json', {with:{type:'json'}}),
  'blonde_officer':()=>import('../public/data/blonde_officer-motion.json', {with:{type:'json'}}),
  'indian':()=>import('../public/data/indian-motion.json', {with:{type:'json'}}),
  'indian_fem':()=>import('../public/data/indian_fem-motion.json', {with:{type:'json'}}),
  'indian_fem_officer':()=>import('../public/data/indian_fem_officer-motion.json', {with:{type:'json'}}),
  'indian_officer':()=>import('../public/data/indian_officer-motion.json', {with:{type:'json'}}),
  'irish':()=>import('../public/data/irish-motion.json', {with:{type:'json'}}),
  'irish_officer':()=>import('../public/data/irish_officer-motion.json', {with:{type:'json'}}),
  'white_male':()=>import('../public/data/white_male-motion.json', {with:{type:'json'}}),
  'white_male_officer':()=>import('../public/data/white_male_officer-motion.json', {with:{type:'json'}})
});
