import { Cartesian3, Cartographic, Color, ComponentDatatype, Geometry, GeometryAttribute, GeometryInstance, Primitive, PrimitiveType, BoundingSphere, PerInstanceColorAppearance, ColorGeometryInstanceAttribute } from 'cesium';
import { Vector2, ShapeUtils } from 'three';
import { plazaAppearance } from './plaza-lighting.js';
import { toLocal,toWorld } from './coordinates.js';
import {cutGroundTriangle} from './ground-cutouts.js';
import {SUBWAY_ENTRANCES} from './streetscape-config.js';
import {roadWidth,crossingPaintPoints} from './street-proportions.js';
// Bake the bounded OSM surface layer into five color batches instead of hundreds
// of corridor primitives. Centerlines and plaza polygons are source geography;
// lane/sidewalk widths without source width tags are explicit visual estimates.
export function streetSurfaces(streets){
  const batches=new Map();
  function vertex(point,height,color){
    if(!batches.has(color))batches.set(color,[]);
    const world=toWorld({x:point.x,y:point.y,z:0});const geo=Cartographic.fromCartesian(world);
    const onGround=Cartesian3.fromRadians(geo.longitude,geo.latitude,height);
    batches.get(color).push(onGround.x,onGround.y,onGround.z);
  }
  function triangle(a,b,c,height,color){for(const tri of cutGroundTriangle([a,b,c],SUBWAY_ENTRANCES))for(const p of tri)vertex(p,height,color);}
  function ribbons(points,width,height,color,crossing=false){
    for(let i=1;i<points.length;i++){
      const a=points[i-1],b=points[i],dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);if(length<.05)continue;
      // Keep surfaces within the same small Times Square section.
      if(Math.min(a.x,b.x)>600||Math.max(a.x,b.x)<-600||Math.min(a.y,b.y)>650||Math.max(a.y,b.y)<-650)continue;
      const nx=-dy/length*width/2,ny=dx/length*width/2;
      const parts=crossing?Math.ceil(length/.9):1;
      for(let k=0;k<parts;k++){
        const start=crossing?k*.9/length:0,end=crossing?Math.min(1,(k*.9+.45)/length):1;
        const p={x:a.x+dx*start,y:a.y+dy*start},q={x:a.x+dx*end,y:a.y+dy*end};
        const v=[{x:p.x+nx,y:p.y+ny},{x:p.x-nx,y:p.y-ny},{x:q.x-nx,y:q.y-ny},{x:q.x+nx,y:q.y+ny}];
        triangle(v[0],v[1],v[2],height,color);triangle(v[0],v[2],v[3],height,color);
      }
    }
  }
  for(const way of streets.elements){
    const t=way.tags??{},g=way.geometry;if(!g||g.length<2||g.some(p=>!p))continue;
    if(['steps','elevator','platform','construction','proposed','service'].includes(t.highway)||(t.level&&t.level!=='0')||t.tunnel==='yes')continue;
    if(!g.some(p=>p.lon>=-73.9918&&p.lon<=-73.9802&&p.lat>=40.7538&&p.lat<=40.7639))continue;
    const points=g.map(p=>toLocal(Cartesian3.fromDegrees(p.lon,p.lat)));
    if(t.area==='yes'&&t.highway==='pedestrian'){
      const polygon=points.map(p=>new Vector2(p.x,p.y));if(polygon[0].distanceTo(polygon.at(-1))<.01)polygon.pop();
      for(const [a,b,c] of ShapeUtils.triangulateShape(polygon,[]))triangle(polygon[a],polygon[b],polygon[c],.07,'#8b9295');continue;
    }
    if(t.highway==='footway'||t.highway==='path'){
      if(t.footway==='crossing')ribbons(crossingPaintPoints(points),3.5,.09,'#e0dfd8',true);
      // Raised, traversable sidewalks and ramps are rendered by street-details.
      continue;
    }
    const {original,width}=roadWidth(t);
    if(t['sidewalk:both']!=='separate')ribbons(points,original+5,.015,'#9ca2a3');ribbons(points,width,.035,t.highway==='pedestrian'?'#8b9295':'#39434c');
  }
  const instances=[];
  for(const [color,positions] of batches){
    const values=new Float64Array(positions),normals=new Float32Array(positions.length),st=new Float32Array(positions.length/3*2);
    for(let i=0;i<positions.length;i+=3){const p=Cartesian3.normalize(new Cartesian3(positions[i],positions[i+1],positions[i+2]),new Cartesian3());normals.set([p.x,p.y,p.z],i);const local=toLocal(new Cartesian3(positions[i],positions[i+1],positions[i+2]));st.set([local.x,local.y],i/3*2);}
    const indices=Uint32Array.from({length:positions.length/3},(_,i)=>i);
    const geometry=new Geometry({attributes:{position:new GeometryAttribute({componentDatatype:ComponentDatatype.DOUBLE,componentsPerAttribute:3,values}),normal:new GeometryAttribute({componentDatatype:ComponentDatatype.FLOAT,componentsPerAttribute:3,values:normals}),st:new GeometryAttribute({componentDatatype:ComponentDatatype.FLOAT,componentsPerAttribute:2,values:st})},indices,primitiveType:PrimitiveType.TRIANGLES,boundingSphere:BoundingSphere.fromVertices(values)});
    instances.push(new GeometryInstance({geometry,attributes:{color:ColorGeometryInstanceAttribute.fromColor(Color.fromCssColorString(color))}}));
  }
  // The paving shader uses metre coordinates, not normalized image UVs.
  return new Primitive({geometryInstances:instances,appearance:plazaAppearance(),compressVertices:false,asynchronous:false});
}
