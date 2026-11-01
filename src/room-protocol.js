import {APPEARANCE_IDS} from './appearances.js';
export const ROOM_CAPACITY=20;
export const ROOM_CODE_PATTERN=/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/;
// Stable character IDs also determine Manson's prototype police permissions.
export const AVATAR_IDS=APPEARANCE_IDS;
export const SYNC_INTERVAL=100;
export const HIDDEN_SYNC_INTERVAL=5000;
// Keep a player's authenticated seat through ordinary Wi-Fi drops. Explicit
// Leave still releases it immediately; hidden tabs use the longer lease below.
export const MEMBER_LEASE=90_000;
export const BACKGROUND_LEASE=10*60_000;
export const ROOM_LIFETIME=4*60*60*1000;
const TAU=Math.PI*2;
export const wrapAngle=v=>Math.atan2(Math.sin(v),Math.cos(v));
export function normalizeRoomCode(value){return String(value??'').trim().toUpperCase();}
export function playerState(player){
 return {position:[player.position.x,player.position.y,player.position.z],heading:wrapAngle(player.heading),speed:player.speed,running:!!player.running,gaitPhase:((player.gaitPhase??0)%TAU+TAU)%TAU,runBlend:player.runBlend??0,poseWeight:player.poseWeight??0,airBlend:player.airBlend??0,animationTime:player.animationTime??0,...(player.carHitAt>=0?{carHitAt:player.carHitAt}:{})};
}
// Only physical presentation travels through the walking-room protocol.
// Extra identity/match fields from clients must never become public state.
export function copyPlayerState(s){
 return {position:[...s.position],heading:s.heading,speed:s.speed,running:s.running,gaitPhase:s.gaitPhase,runBlend:s.runBlend,poseWeight:s.poseWeight,airBlend:s.airBlend??0,animationTime:s.animationTime,...(s.carHitAt!==undefined?{carHitAt:s.carHitAt}:{})};
}
export function validPlayerState(s){
 if(!s||!Array.isArray(s.position)||s.position.length!==3||!s.position.every(Number.isFinite))return false;
 const [x,y,z]=s.position,a=x*.848-y*.53,b=x*.53+y*.848;
 return Math.abs(a)<=365&&Math.abs(b)<=475&&z>=-25&&z<=650&&
  Number.isFinite(s.heading)&&Math.abs(s.heading)<=Math.PI+.001&&Number.isFinite(s.speed)&&s.speed>=0&&s.speed<=12&&typeof s.running==='boolean'&&
  Number.isFinite(s.gaitPhase)&&s.gaitPhase>=0&&s.gaitPhase<=TAU&&Number.isFinite(s.runBlend)&&s.runBlend>=0&&s.runBlend<=1&&
  Number.isFinite(s.poseWeight)&&s.poseWeight>=0&&s.poseWeight<=1&&(s.airBlend===undefined||(Number.isFinite(s.airBlend)&&s.airBlend>=0&&s.airBlend<=1))&&Number.isFinite(s.animationTime)&&s.animationTime>=0&&s.animationTime<=1e7&&(s.carHitAt===undefined||(Number.isFinite(s.carHitAt)&&s.carHitAt>=0&&s.carHitAt<=s.animationTime+.5));
}
export const DEFAULT_ROOM_STATE=Object.freeze({position:[0,0,.17],heading:0,speed:0,running:false,gaitPhase:0,runBlend:0,poseWeight:0,airBlend:0,animationTime:0});
