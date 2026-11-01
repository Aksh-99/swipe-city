import {createHardRockFoodGeometry} from './hard-rock-food-geometry.js';
import {renderVendorGeometry} from './street-vendors.js';
export function addHardRockFoodRow(viewer,collision){
 const g=createHardRockFoodGeometry();renderVendorGeometry(viewer,collision,g,'hard-rock-food-row');
 return {carts:g.carts.length,silverBollards:g.posts.length,foodPhotoPanels:g.photoMenus.length,walkwayMeters:30};
}
