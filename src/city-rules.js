import streets from '../public/data/report-streets.json' with {type:'json'};
import pedestrianCrossings from '../public/data/jaywalking-crossings.json' with {type:'json'};
// Only the mapped zebra crossings served by a visible pedestrian head count.
// Trim curb landings so walking along a sidewalk cannot trigger a fine.
export function pedestrianCrossing(position){
 let best=null;
 for(const crossing of pedestrianCrossings.crossings){
  const points=crossing.points,lengths=points.slice(1).map((b,i)=>Math.hypot(b[0]-points[i][0],b[1]-points[i][1])),total=lengths.reduce((a,b)=>a+b,0);let offset=0;
  for(let i=0;i<lengths.length;i++){const a=points[i],b=points[i+1],length=lengths[i];if(!length)continue;const dx=(b[0]-a[0])/length,dy=(b[1]-a[1])/length,t=Math.max(0,Math.min(length,(position[0]-a[0])*dx+(position[1]-a[1])*dy)),along=offset+t,distance=Math.hypot(position[0]-a[0]-t*dx,position[1]-a[1]-t*dy);offset+=length;
   if(along<1||along>total-1||distance>crossing.width/2)continue;
   if(!best||distance<best.distance)best={id:crossing.id,group:crossing.group,distance};
  }
 }
 return best;
}
export const MEDICAL_FINE=200,JAYWALK_FINE=40,ALERT_MS=20_000;
export {PHOTO_REWARD,photoReward} from './photo-rewards.js';
// Shared camera targets use the existing modeled storefront and facade anchors.
export const PHOTO_LANDMARKS=Object.freeze([
  {
    "id": "barclays",
    "name": "Barclays building",
    "position": [
      122.88919595930969,
      298.8372325649893,
      0
    ]
  },
  {
    "id": "morgan",
    "name": "Morgan Stanley building",
    "position": [
      6.173699575984934,
      252.53238300955067,
      0
    ]
  },
  {
    "id": "nasdaq",
    "name": "Nasdaq building",
    "position": [
      -33.76645743404413,
      -180.5907747867355,
      0.0
    ]
  },
  {
    "id": "mms",
    "name": "M&M’s store",
    "position": [
      118.2238777446245,
      247.1474949578557,
      0
    ]
  },
  {
    "id": "hardrock",
    "name": "Hard Rock Cafe",
    "position": [
      -103.85259034363345,
      -120.06193984024699,
      0
    ]
  },
  {
    "id": "harry-potter",
    "name": "Harry Potter and the Cursed Child",
    "position": [
      -155.3578636737107,
      -112.42404328558924,
      0
    ]
  },
  {
    "id": "port-authority",
    "name": "Port Authority Bus Terminal",
    "position": [
      -382.79919477201724,
      -90.92191580847683,
      0
    ]
  },
  {
    "id": "disney",
    "name": "Disney Store",
    "position": [
      32.37179331043815,
      30.424451959025504,
      0
    ]
  },
  {
    "id": "fdny",
    "name": "FDNY Engine 54 / Ladder 4 / Battalion 9",
    "position": [
      -123.9358539938174,
      313.38178339956414,
      0
    ]
  },
  {
    "id": "mcdonalds",
    "name": "McDonald’s",
    "position": [
      2.797958988154792,
      -35.85947235608889,
      0
    ]
  }
]);
export function nearestRoad(position){let best=null;for(const s of streets.segments){const dx=s.b[0]-s.a[0],dy=s.b[1]-s.a[1],length=dx*dx+dy*dy;if(!length)continue;const t=Math.max(0,Math.min(1,((position[0]-s.a[0])*dx+(position[1]-s.a[1])*dy)/length)),distance=Math.hypot(position[0]-s.a[0]-t*dx,position[1]-s.a[1]-t*dy);if(!best||distance<best.distance)best={...s,distance,group:Math.abs(dy)/Math.sqrt(length)>.68?0:1};}return best;}
export {pedestrianWalk} from './signal-cycle.js';
export function photoInView(position,heading,landmark){const dx=landmark.position[0]-position[0],dy=landmark.position[1]-position[1],distance=Math.hypot(dx,dy);return distance>=5&&distance<=95&&Number.isFinite(heading)&&(Math.sin(heading)*dx+Math.cos(heading)*dy)/distance>.78;}
export function createPhotoTasks(choose){const pool=[...PHOTO_LANDMARKS],tasks=[],count=3+((choose(3)%3)+3)%3;for(let i=0;i<count;i++){const [landmark]=pool.splice(((choose(pool.length)%pool.length)+pool.length)%pool.length,1);tasks.push({id:landmark.id,landmarkId:landmark.id,name:landmark.name,position:landmark.position,sender:['Mom','Dad','Friend','Sister','Mom'][i],dueAfter:5000+i*90_000,reward:20+((choose(71)%71)+71)%71,completedAt:null});}return tasks;}
