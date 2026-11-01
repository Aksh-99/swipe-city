import { Cartesian3, Matrix4, Transforms } from 'cesium';
export const ORIGIN = { lon: -73.9855, lat: 40.7580 };
export const frame = Transforms.eastNorthUpToFixedFrame(Cartesian3.fromDegrees(ORIGIN.lon, ORIGIN.lat, 0));
export const inverseFrame = Matrix4.inverseTransformation(frame, new Matrix4());
export const toWorld = (p) => Matrix4.multiplyByPoint(frame, new Cartesian3(p.x,p.y,p.z),new Cartesian3());
export const toLocal = (p) => Matrix4.multiplyByPoint(inverseFrame,p,new Cartesian3());
export const worldDirection = (p) => Matrix4.multiplyByPointAsVector(frame,new Cartesian3(p.x,p.y,p.z),new Cartesian3());
