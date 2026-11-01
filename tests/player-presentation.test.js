import test from 'node:test';import assert from 'node:assert/strict';
import {Player,FIXED_STEP} from '../src/player.js';import {samplePresentation} from '../src/player-presentation.js';
const world={ready:()=>true,resolve:p=>p,ground:()=>0};
test('render samples fill the gaps between physics ticks without changing simulation',()=>{
 const p=new Player(world);p.update(FIXED_STEP,new Set(['ArrowUp']),0);const physical=p.position.clone(),before=p.previousPresentation.position.clone(),a=samplePresentation(p,0),b=samplePresentation(p,.5),c=samplePresentation(p,1);
 assert(a.position.equals(before));assert(c.position.equals(physical));assert(Math.abs(b.position.y-(before.y+physical.y)/2)<1e-10);assert(p.position.equals(physical));assert(b.gaitPhase>a.gaitPhase&&b.gaitPhase<c.gaitPhase);
});
test('interpolated turns cross the angle boundary smoothly and teleport/reset snaps',()=>{
 const p=new Player(world);p.heading=Math.PI-.02;p.snapPresentation();p.heading=-Math.PI+.02;assert(Math.abs(samplePresentation(p,.5).heading-Math.PI)<1e-8);
 p.position.set(100,50,.17);p.snapPresentation();assert(samplePresentation(p,0).position.equals(p.position));p.reset();assert(samplePresentation(p,.5).position.equals(p.position));
});
test('presentation clamps render fractions and never extrapolates through obstacles',()=>{
 const p=new Player(world);p.update(FIXED_STEP,new Set(['ArrowUp']),0);assert(samplePresentation(p,-1).position.equals(p.previousPresentation.position));assert(samplePresentation(p,2).position.equals(p.position));
});
