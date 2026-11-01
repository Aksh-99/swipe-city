import {PLAY_AREA} from './play-area.js';
const a=PLAY_AREA.intersections[0].position,b=PLAY_AREA.intersections[1].position,length=Math.hypot(b[0]-a[0],b[1]-a[1]);
const east=[(b[0]-a[0])/length,(b[1]-a[1])/length],north=[-east[1],east[0]];
export const MAP_ROTATION=Math.atan2(-east[1],east[0])*180/Math.PI;
export function mapPoint(p){return {x:360+east[0]*p.x+east[1]*p.y,y:470-north[0]*p.x-north[1]*p.y};}
export const MAP_POLYGON=PLAY_AREA.polygon.map(([x,y])=>mapPoint({x,y}));
const xs=MAP_POLYGON.map(p=>p.x),ys=MAP_POLYGON.map(p=>p.y);
// Fit the entire playable district without padded empty bands.
export const MAP_FRAME=Object.freeze({x:Math.min(...xs),y:Math.min(...ys),width:Math.max(...xs)-Math.min(...xs),height:Math.max(...ys)-Math.min(...ys)});
const {width,height}=MAP_FRAME;
export const MAP_VIEWBOX=`${MAP_FRAME.x} ${MAP_FRAME.y} ${width} ${height}`;
