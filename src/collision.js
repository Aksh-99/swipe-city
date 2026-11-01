import {createCollisionTreeBuilder} from './collision-tree.js';
import {createTaskQueue,loadResource} from './resource-loading.js';
import {resolveVehicle} from './vehicle-collision.js';
import{removeVoco48SourceTriangles}from'./voco48-source-mask.js';
import { Box3, BufferAttribute, BufferGeometry, DoubleSide, Line3, Ray, Vector3 } from 'three';
import { MeshBVH } from 'three-mesh-bvh';
const trianglePoint = new Vector3(), capsulePoint = new Vector3(), normal = new Vector3();
export class CollisionWorld {
  constructor(files,{resourceOptions={},concurrency=4}={}) { this.files=files;this.sourceIds=new Set(files.map(f=>f.uri)); this.loaded=new Map(); this.pending=new Map(); this.radius=160; this.error=null;this.buildTree=createCollisionTreeBuilder();this.resourceOptions=resourceOptions;this.enqueue=createTaskQueue(concurrency); }
  distance(tile,p) { const b=tile.bounds; return Math.hypot(Math.max(b[0]-p.x,0,p.x-b[3]),Math.max(b[1]-p.y,0,p.y-b[4])); }
  addStatic(id,positions){
    const geometry=new BufferGeometry();geometry.setAttribute('position',new BufferAttribute(positions,3));
    this.loaded.set(id,{geometry,bvh:new MeshBVH(geometry,{targetLeafSize:12})});
  }
  async load(tile) {
    if(this.loaded.has(tile.uri)) return;
    if(this.pending.has(tile.uri)) return this.pending.get(tile.uri);
    const task=this.enqueue(async()=>{
      const bytes=await loadResource(tile.collision,{...this.resourceOptions,validate:data=>{if(data.byteLength%36)throw new Error(`Invalid collision tile: ${tile.uri}`);}});
      const geometry=new BufferGeometry(); geometry.setAttribute('position',new BufferAttribute(removeVoco48SourceTriangles(new Float32Array(bytes),tile.bounds),3));
      try{const bvh=await this.buildTree(geometry);this.loaded.set(tile.uri,{bvh,geometry});}catch(error){geometry.dispose();throw error;}
    }); this.pending.set(tile.uri,task);
    try {await task;} catch(error){this.error=error;throw error;} finally {this.pending.delete(tile.uri);}
  }
  async stream(p) {
    const near=this.files.filter(f=>this.distance(f,p)<this.radius).sort((a,b)=>this.distance(a,p)-this.distance(b,p));
    const results=await Promise.allSettled(near.map(f=>this.load(f)));
    for(const f of this.files) if(this.distance(f,p)>this.radius+80 && this.loaded.has(f.uri)) {
      this.loaded.get(f.uri).geometry.dispose(); this.loaded.delete(f.uri);
    }
    const failed=results.find(result=>result.status==='rejected');
    if(failed)throw failed.reason;
    this.error=null;
  }
  ready(p) { return this.files.every(f=>this.distance(f,p)>35 || this.loaded.has(f.uri)); }
  resolve(position,radius=.32,height=1.78) {
    // Iterative capsule/triangle separation, using the actual city triangles.
    for(let iteration=0;iteration<4;iteration++) {
      let changed=false;
      const segment=new Line3(position.clone().add(new Vector3(0,0,radius)),position.clone().add(new Vector3(0,0,height-radius)));
      const box=new Box3().setFromPoints([segment.start,segment.end]).expandByScalar(radius);
      for(const {bvh} of this.loaded.values()) bvh.shapecast({
        intersectsBounds: bounds=>bounds.intersectsBox(box),
        intersectsTriangle: triangle=>{
          const distance=triangle.closestPointToSegment(segment,trianglePoint,capsulePoint);
          if(distance>=radius) return false;
          if(distance>1e-7) normal.subVectors(capsulePoint,trianglePoint).divideScalar(distance);
          else {triangle.getNormal(normal); if(normal.dot(new Vector3().subVectors(segment.start,triangle.a))<0)normal.negate();}
          const delta=normal.clone().multiplyScalar(radius-distance+1e-4);
          position.add(delta);segment.start.add(delta);segment.end.add(delta);changed=true;
          return false;
        }
      });
      if(!changed)break;
    }
    for(const car of this.getVehicles?.()??[])resolveVehicle(position,car,radius,height);
    return position;
  }
  ray(origin,direction,max=Infinity,sourceOnly=false) {
    const ray=new Ray(origin,direction); let closest=null;
    for(const [id,{bvh}] of this.loaded) {if(sourceOnly&&!this.sourceIds.has(id))continue;const hit=bvh.raycastFirst(ray,DoubleSide,0,max);if(hit && (!closest || hit.distance<closest.distance)) closest=hit;}
    return closest;
  }
  cameraCast(origin,direction,max,radius=.16){
    // Parallel rays approximate a small swept camera volume, so near-plane
    // corners cannot cut through a pole or a wall missed by the center ray.
    const side=new Vector3().crossVectors(direction,Math.abs(direction.z)>.9?new Vector3(1,0,0):new Vector3(0,0,1)).normalize();
    const up=new Vector3().crossVectors(side,direction).normalize();let closest=this.ray(origin,direction,max);
    for(let i=0;i<8;i++){const angle=i*Math.PI/4,p=origin.clone().addScaledVector(side,Math.cos(angle)*radius).addScaledVector(up,Math.sin(angle)*radius),hit=this.ray(p,direction,max);if(hit&&(!closest||hit.distance<closest.distance))closest=hit;}
    return closest;
  }
  ground(p,radius=0) {
    // Street datum is z=0; explicit subway apertures may supply a lower floor.
    // Keep roof surfaces above the player's step height out of the ground selection.
    const hit=this.ray(new Vector3(p.x,p.y,p.z+.25),new Vector3(0,0,-1),3);
    const base=this.groundBase?this.groundBase(p):0;
    // A round capsule foot rests above a slope's vertical ray hit. Preserve
    // that clearance when following stair ramps instead of snapping the
    // capsule into the ramp each frame. A flat step edge gets no extra snap.
    const normalZ=Math.abs(hit?.face?.normal.z??1);
    const clearance=normalZ>.7?radius*(1/normalZ-1):0;
    return Math.max(base,hit?hit.point.z+clearance:base);
  }
}
