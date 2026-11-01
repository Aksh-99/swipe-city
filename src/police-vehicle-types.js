// Metres. Authored patrol exteriors, with different wheelbases and cabin
// silhouettes; no manufacturer asset or driving/gameplay dependency.
export const POLICE_VEHICLE_TYPES=Object.freeze({
 sedan:Object.freeze({name:'Patrol sedan',length:5.12,width:1.93,height:1.51,wheelRadius:.35,axles:[-1.46,1.48],belt:1.02,cabin:{rear:-1.63,front:.93,roofRear:-1.00,roofFront:.38,roof:1.48},windows:2}),
 suv:Object.freeze({name:'Patrol SUV',length:5.05,width:2.02,height:1.89,wheelRadius:.39,axles:[-1.48,1.48],belt:1.14,cabin:{rear:-2.09,front:.87,roofRear:-1.74,roofFront:.35,roof:1.84},windows:3}),
 van:Object.freeze({name:'Patrol transport van',length:5.64,width:2.08,height:2.29,wheelRadius:.38,axles:[-1.78,1.79],belt:1.18,cabin:{rear:-2.56,front:1.72,roofRear:-2.45,roofFront:1.04,roof:2.24},windows:3})
});
