import {TRANSPORT_PORTALS} from './transport-config.js';
import {MTA_BUSES,stopPosition,stopStreet} from './mta-planner.js';
import {mapPoint,MAP_ROTATION,MAP_POLYGON,MAP_VIEWBOX,MAP_FRAME} from './minimap-layout.js';
export {mapPoint} from './minimap-layout.js';
import {ROAD_WIDTH_SCALE,ROAD_TYPES} from './street-proportions.js';
import {Cartesian3} from 'cesium';
import {STEPS,plazaPoint} from './plaza-layout.js';
import {toLocal} from './coordinates.js';
const NS='http://www.w3.org/2000/svg';
function svg(tag,attrs){const element=document.createElementNS(NS,tag);for(const [key,value] of Object.entries(attrs))element.setAttribute(key,value);return element;}
export class TimesSquareMap {
  constructor(streets){
    const map=document.getElementById('phone-map');this.map=map;
    map.setAttribute('viewBox',MAP_VIEWBOX);
    map.setAttribute('preserveAspectRatio','none');
    map.append(svg('rect',{x:MAP_FRAME.x,y:MAP_FRAME.y,width:MAP_FRAME.width,height:MAP_FRAME.height,fill:'#1b3643'}));
    const polygon=MAP_POLYGON.map(p=>`${p.x},${p.y}`).join(' ');
    document.getElementById('map-clip').replaceChildren(svg('polygon',{points:polygon}));
    const roads=svg('g',{'clip-path':'url(#map-clip)'});map.append(roads);roads.append(svg('polygon',{points:polygon,fill:'#1b3643',stroke:'#547181','stroke-width':4}));const named=[];
    for(const way of streets.elements){
      const t=way.tags??{},g=way.geometry;
      if(!g||g.length<2||['steps','elevator','service','platform','construction','proposed'].includes(t.highway)||t.tunnel==='yes'||(t.level&&t.level!=='0'))continue;
      if(!g.some(p=>p.lon>=-73.9918&&p.lon<=-73.9802&&p.lat>=40.7538&&p.lat<=40.7639))continue;
      const points=g.filter(Boolean).map(p=>mapPoint(toLocal(Cartesian3.fromDegrees(p.lon,p.lat))));
      if(points.length<2)continue;
      const d=points.map((p,i)=>`${i?'L':'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
      const plaza=t.highway==='pedestrian';
      if(t.area==='yes'&&plaza){roads.append(svg('path',{d:d+' Z',fill:'#245558',stroke:'#438180','stroke-width':3}));continue;}
      if(['footway','path'].includes(t.highway))continue;
      named.push({name:t.name,points});
      const major=['Broadway','7th Avenue','6th Avenue','8th Avenue','Avenue of the Americas'].includes(t.name);
      roads.append(svg('path',{d,fill:'none',stroke:plaza?'#428b80':'#5a7784','stroke-width':(major?25:15)*(ROAD_TYPES.has(t.highway)?ROAD_WIDTH_SCALE:1),'stroke-linejoin':'round','stroke-linecap':'round'}));
      if(t.name==='Broadway')roads.append(svg('path',{d,fill:'none',stroke:'#75cdb9','stroke-width':5}));
    }
    const sample=(names,axis,value)=>{
      for(const line of named.filter(line=>names.includes(line.name)))for(let i=1;i<line.points.length;i++){
        const a=line.points[i-1],b=line.points[i],delta=b[axis]-a[axis];if(Math.abs(delta)<.01)continue;
        const t=(value-a[axis])/delta;if(t<0||t>1)continue;
        const p={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};if(p.x>30&&p.x<650&&p.y>20&&p.y<910)return p;
      }
      return null;
    };
    const labels=[];
    for(const [label,names] of [['8 AV',['8th Avenue']],['7 AV',['7th Avenue']],['6 AV',['6th Avenue','Avenue of the Americas']]]){
      const p=sample(names,'y',440);if(p)labels.push([label,p.x+(label==='8 AV'?34:-12),p.y,-90]);
    }
    for(const [number,suffix] of [[49,'th'],[47,'th'],[45,'th'],[42,'nd']]){
      const p=sample([`West ${number}${suffix} Street`],'x',330);if(p)labels.push([`W ${number}`,p.x,p.y+(number===49?24:-4),0]);
    }
    for(const [name,x,y,angle] of labels){
      const text=svg('text',{x,y,fill:'#c2d6de','font-size':30,'font-family':'Arial,sans-serif',transform:`rotate(${angle} ${x} ${y})`});text.textContent=name;roads.append(text);
    }
    const bowTie=svg('text',{x:450,y:425,fill:'#8fd6c5','font-size':30,'font-family':'Arial,sans-serif'});bowTie.textContent='TIMES';roads.append(bowTie);
    const square=svg('text',{x:450,y:458,fill:'#8fd6c5','font-size':30,'font-family':'Arial,sans-serif'});square.textContent='SQUARE';roads.append(square);
    const steps=[[-5,0],[5,0],[5,STEPS.length],[-5,STEPS.length]].map(([x,y])=>mapPoint(plazaPoint(x,y)));
    roads.append(svg('path',{d:steps.map((p,i)=>`${i?'L':'M'}${p.x},${p.y}`).join(' ')+' Z',fill:'#cf3055',stroke:'#fff','stroke-width':2}));
    const stepLabel=svg('text',{x:steps[0].x+12,y:steps[0].y-8,fill:'#fa9cad','font-size':24,'font-family':'Arial,sans-serif'});stepLabel.textContent='RED STEPS';roads.append(stepLabel);
    this.busMarkers=new Map();
    for(const stop of MTA_BUSES){const p=mapPoint({x:stopPosition(stop)[0],y:stopPosition(stop)[1]});
      const marker=svg('g',{'aria-label':`${stop.name} · W ${stopStreet(stop)} St · ${stop.location}`,class:'mta-map-stop',transform:`translate(${p.x} ${p.y})`});
      const title=svg('title',{});title.textContent=`${stop.name} · ${stop.location}`;
      const label=svg('text',{y:5,'text-anchor':'middle',fill:'#fff','font-size':15,'font-weight':'bold'});label.textContent=stop.number;
      marker.append(title,svg('circle',{r:16,fill:'#145dad',stroke:'#c9e6ff','stroke-width':3}),label);roads.append(marker);this.busMarkers.set(stop.id,marker);
    }
    this.policeMarkers=new Map();this.policeLayer=svg('g',{'aria-label':'NYPD cars',display:'none'});roads.append(this.policeLayer);
    for(const car of TRANSPORT_PORTALS.filter(p=>p.kind==='police')){
      const point=mapPoint({x:car.doors[0].position[0],y:car.doors[0].position[1]}),marker=svg('g',{class:'police-map-car',transform:`translate(${point.x} ${point.y})`,role:'button',tabindex:0,'aria-label':`${car.name} · ${car.location}`});
      const title=svg('title',{});title.textContent=`${car.name} · ${car.location}`;
      const label=svg('text',{y:5,'text-anchor':'middle',fill:'#fff','font-size':16,'font-weight':'bold'});label.textContent=car.name.match(/\d+/)?.[0]??'P';
      marker.append(title,svg('rect',{x:-24,y:-18,width:48,height:36,rx:9,fill:'#195eb4',stroke:'#e0efff','stroke-width':3}),label);
      marker.addEventListener('click',()=>this.policeDestination?.(car.id));marker.addEventListener('keydown',e=>{if(['Enter','Space'].includes(e.code)){e.preventDefault();this.policeDestination?.(car.id);}});
      this.policeLayer.append(marker);this.policeMarkers.set(car.id,marker);
    }
    this.marker=svg('g',{'aria-label':'Player location'});
    this.marker.append(svg('path',{d:'M 0 -50 L 28 27 L 0 13 L -28 27 Z',fill:'#087f6b',stroke:'#fff','stroke-width':6,'stroke-linejoin':'round'}));
    map.append(this.marker);
    this.dispatchLayer=svg('g',{'aria-label':'Reported last-seen locations'});map.append(this.dispatchLayer);this.dispatchMarkers=new Map();
  }
  onPoliceDestination(fn){this.policeDestination=fn;}
  setPoliceTravel({officer=false,sourceId=null,enabled=false}={}){
    this.policeLayer.setAttribute('display',officer?'':'none');
    for(const node of this.busMarkers.values())node.setAttribute('display',officer?'none':'');
    for(const [id,node]of this.policeMarkers){node.setAttribute('class',`police-map-car${id===sourceId?' police-map-source':''}`);node.setAttribute('aria-disabled',String(!enabled||id===sourceId));}
  }
  setBusTrip(plan){
    for(const [id,node] of this.busMarkers){const board=!plan?.arrived&&id===plan?.board?.id,destination=id===plan?.destination?.id;node.setAttribute('class',`mta-map-stop${board?' mta-board-blink':''}${destination?' mta-destination':''}`);}
  }
  setDispatchCalls(calls=[]){
    const ids=new Set(calls.map(call=>call.id));
    for(const [id,node] of this.dispatchMarkers)if(!ids.has(id)){node.remove();this.dispatchMarkers.delete(id);}
    for(const call of calls){
      if(this.dispatchMarkers.has(call.id)){const p=mapPoint({x:call.position[0],y:call.position[1]});this.dispatchMarkers.get(call.id).setAttribute('transform',`translate(${p.x} ${p.y})`);continue;}
      const description=call.kind==='jaywalking'?`Jaywalking · Player ${call.number} · 20-second GPS alert`:call.description?`911 report · ${call.description} · ${call.location} · Caller: Player ${call.number}`:`911 · Caller: Player ${call.number}`;
      const p=mapPoint({x:call.position[0],y:call.position[1]}),node=svg('g',{class:'dispatch-map-alert',transform:`translate(${p.x} ${p.y})`,'aria-label':description});
      const title=svg('title',{});title.textContent=description;
      node.append(title,svg('path',{d:'M0 -22 L22 0 L0 22 L-22 0 Z',fill:'#ff344e',stroke:'#ffe3e7','stroke-width':4}));
      this.dispatchMarkers.set(call.id,node);this.dispatchLayer.append(node);
    }
  }
  update(player){const p=mapPoint(player.position);this.marker.setAttribute('transform',`translate(${p.x} ${p.y}) rotate(${player.heading*180/Math.PI-MAP_ROTATION})`);}
}
