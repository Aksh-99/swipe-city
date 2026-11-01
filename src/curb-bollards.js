import {addBatches} from './street-details.js';
import {createCurbBollardGeometry} from './curb-bollard-geometry.js';

export function addCurbBollards(viewer,collision,layout){
 const geometry=createCurbBollardGeometry(layout);
 addBatches(viewer,geometry.batches);
 collision.addStatic('curb-bollards',geometry.collision);
 return {total:geometry.posts.length,posts:geometry.posts};
}
