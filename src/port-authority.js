import {Material} from 'cesium';
import {addBatches,addFaces} from './street-details.js';
import {architectureNightAppearance} from './architecture-lighting.js';
import {createPortAuthorityGeometry} from './port-authority-geometry.js';
import {PORT_AUTHORITY} from './port-authority-config.js';

const CELLS={
 'wrap-east':[0,0,1024,1024],'wrap-north':[1024,0,1024,1024],
 fascia:[0,1024,2048,128],entrance:[0,1152,1024,256],carlos:[1024,1152,1024,256],
 wayfinding:[0,1408,1024,256],subway:[1024,1408,1024,256],
 directory:[0,1664,512,384],door:[512,1664,512,384]
};
export function terminalSignAtlas(labels){
 const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=2048;const c=canvas.getContext('2d');
 const first=new Map(labels.map(f=>[f.kind,f]));
 for(const [kind,rect]of Object.entries(CELLS)){
  const f=first.get(kind);if(!f)continue;
  const [x,y,pw,h]=rect,w=h*f.width/f.height;
  c.save();c.translate(x,y);c.beginPath();c.rect(0,0,pw,h);c.clip();c.scale(pw/w,1);
  const fill=(color)=>{c.fillStyle=color;c.fillRect(0,0,w,h);};
  const text=(s,xx,yy,size,color='#e0e5da',weight='bold',family='Arial',max=w-30)=>{c.fillStyle=color;c.font=`${weight} ${size}px ${family}, ${family==='Georgia'?'serif':'sans-serif'}`;c.fillText(s,xx,yy,max);};
  c.textAlign='center';fill('#102632');
  if(kind.startsWith('wrap')){
   fill('#293e72');
   // Printed vinyl has subtle seams; color remains restrained in night light.
   c.fillStyle='#304778';for(let xx=0;xx<w;xx+=w/10)c.fillRect(xx,0,2,h);
   const west=kind==='wrap-north',colors=['#77b94a','#85baca','#d7c679','#6599bb','#d88f90','#95baaf','#578bb4'];
   for(let k=0;k<7;k++){
    c.strokeStyle=colors[k];c.lineWidth=3.8;const step=k*15;
    c.beginPath();
    if(!west){c.moveTo(w*.82+step,-30);c.lineTo(w*.82+step,80);c.bezierCurveTo(w*.82+step,210,w*.67+step,200,w*.67+step,355);c.lineTo(w*.67+step,h+30);}
    else{c.moveTo(-20+step,0);c.lineTo(12+step,330);c.bezierCurveTo(12+step,500,150+step,520,150+step,670);c.bezierCurveTo(150+step,820,300+step,835,w+50,835+step);}
    c.stroke();
   }
   c.textAlign='left';
   const xx=west?w*.28:w*.075;
   text('PORT AUTHORITY',w*.07,70,30,'#d0dbd7','bold','Arial',w*.56);
   text('OF NY & NJ',w*.07,105,24,'#b8c9cd','normal','Arial',w*.4);
   if(!west){
    // Outline bus-terminal diagram, reproduced as crisp native artwork.
    c.strokeStyle='#c9d9dc';c.lineWidth=7;
    c.strokeRect(xx,200,w*.38,130);c.beginPath();c.moveTo(xx-20,200);c.lineTo(xx+w*.17,152);c.lineTo(xx+w*.40,152);c.stroke();
    c.fillStyle='#8dc345';c.fillRect(xx+14,257,w*.11,62);c.fillStyle='#e4cb52';c.fillRect(xx+w*.15,238,w*.11,81);c.fillStyle='#ba6163';c.fillRect(xx+w*.30,188,w*.09,49);
    for(const [line,yy]of [['A WHOLE NEW',439],['BUS TERMINAL',559]])text(line,xx,yy,110,'#e1e6de','bold','Arial',w*.61);
    text('LEARN MORE AT',xx,744,38,'#c6d4d8','normal','Arial',w*.56);
    text('PABUILDS.COM',xx,807,57,'#e39e91','bold','Arial',w*.57);
    text('THE NEXT CHAPTER FOR MIDTOWN',xx,938,24,'#c4d2d6','normal','Arial',w*.56);
   }else{
    text('WE’RE BUILDING',xx,244,61,'#d1dcda','normal','Arial',w*.65);
    for(const [line,yy]of [['THE BUS',363],['TERMINAL OF',476],['THE FUTURE',589]])text(line,xx,yy,108,'#9ccd64','bold','Arial',w*.66);
    text('LEARN MORE AT',xx,698,40,'#cbd9d7','normal','Arial',w*.61);
    text('PABUILDS.COM',xx,757,53,'#a5d36f','bold','Arial',w*.61);
   }
  }else if(kind==='carlos'){
   fill('#73262b');c.strokeStyle='#c5a466';c.lineWidth=3;c.strokeRect(6,7,w-12,h-14);
   text('Carlo’s BAKE SHOP',w/2,181,172,'#e4c483','italic bold','Georgia');
  }else if(kind==='fascia'){
   fill('#263b42');text('PORT AUTHORITY BUS TERMINAL',w/2,93,91,'#cbd7d1');
  }else if(kind==='entrance'){
   text('PORT AUTHORITY BUS TERMINAL   •   ENTRANCE',w/2,176,172,'#d2e3dd');
  }else if(kind==='wayfinding'){
   fill('#17455a');text('↑  BUS GATES   •   TICKETS   •   INFORMATION',w/2,163,78,'#e0e6dc');
  }else if(kind==='subway'){
   fill('#14272a');c.textAlign='left';text('Subway',22,94,73);
   for(const [i,letter]of ['A','C','E'].entries()){
    const xx=58+i*95;c.fillStyle='#1762a2';c.beginPath();c.arc(xx,183,39,0,Math.PI*2);c.fill();c.textAlign='center';text(letter,xx,206,61,'#edf3e9');
   }
   c.textAlign='left';text('42 St',340,154,93,'#d7e3dc','bold','Arial',w-352);
  }else if(kind==='directory'){
   fill('#173a4d');text('PORT',w/2,39,26);text('AUTHORITY',w/2,69,26);text('BUS TERMINAL',w/2,99,18);c.fillStyle='#a0b9bb';c.fillRect(14,114,w-28,2);
   c.textAlign='left';for(const [i,line]of ['↑  BUS GATES','↑  TICKETS','↑  INFORMATION','→  SUBWAY A C E'].entries())text(line,12,152+i*37,16,'#d9e3dd');
   c.fillStyle='#b7c3b4';c.fillRect(17,300,w-34,53);c.strokeStyle='#5a7976';c.lineWidth=2;
   for(let j=0;j<6;j++){c.beginPath();c.moveTo(23,307+j*7);c.lineTo(w-24,307+j*7);c.stroke();}
  }else{
   fill('#23404a');text('ENTRANCE',w/2,h*.69,h*.55,'#d5e0d9');
  }
  c.restore();
 }
 return {canvas,cells:CELLS};
}
function mat(type,source,uniforms={},translucent=false){return new Material({fabric:{type,uniforms,source:`czm_material czm_getMaterial(czm_materialInput materialInput){czm_material m=czm_getDefaultMaterial(materialInput);vec2 uv=materialInput.st;m.diffuse=vec3(.003);${source}return m;}`},translucent});}
export function addPortAuthority(viewer,collision){
 const g=createPortAuthorityGeometry();collision.addStatic('port-authority',g.collision);
 addBatches(viewer,g.batches,false,false,architectureNightAppearance(g.night));addBatches(viewer,g.paving,true);addBatches(viewer,g.emissive);
 const glass=mat('PortAuthorityNightGlass',`float kind=floor(uv.x/512.0);uv.x=mod(uv.x,512.0);float stripe=step(.80,fract(uv.x*.19+uv.y*.04));vec3 tint=mix(vec3(.023,.048,.051),vec3(.044,.082,.087),stripe);float floorBand=step(.935,fract(uv.y/3.3));float lamp=step(.87,fract(uv.x*.58))*step(.73,fract(uv.y/3.3))*step(fract(uv.y/3.3),.76);float bakery=step(2.5,kind);vec3 warm=vec3(.19,.15,.061);vec2 pane=fract(uv/vec2(1.67,3.3));float shelf=step(.46,pane.y)*step(pane.y,.48);float goods=step(.13,pane.x)*step(pane.x,.82)*step(.18,pane.y)*step(pane.y,.39);m.emission=tint*(1.0-floorBand*.5)+lamp*vec3(.31,.30,.17)+bakery*(warm*.22+goods*vec3(.115,.064,.027)+shelf*vec3(.12,.12,.085));m.alpha=1.0;`);
 addFaces(viewer,g.glass,glass,(f,u,v)=>[f.kind*512+u*f.width,v*f.height]);
 const brick=mat('PortAuthorityColumnBrick',`vec2 q=uv/vec2(.22,.075);q.x+=mod(floor(q.y),2.0)*.5;vec2 cell=fract(q);float joint=max(1.0-smoothstep(.025,.06,cell.x),1.0-smoothstep(.025,.065,cell.y));float seed=fract(sin(dot(floor(q),vec2(23.7,61.6)))*3141.7);vec3 base=mix(vec3(.34,.23,.20),vec3(.47,.31,.26),seed);m.emission=mix(base,vec3(.34,.33,.29),joint)*vec3(.31,.33,.38);m.alpha=1.0;`);
 addFaces(viewer,g.brick,brick,(f,u,v)=>[u*f.width,v*f.height]);
 const atlas=terminalSignAtlas(g.labels);
 const signs=mat('PortAuthoritySigns',`float shade=floor(uv.x)/100.0;uv.x=fract(uv.x)/.98;vec3 color=texture(image,uv).rgb;float edge=.92+.08*sin(uv.y*3.14159);m.emission=color*shade*edge;m.alpha=1.0;`,{image:Material.DefaultImageId});
 // Do not put a runtime Canvas into Cesium's cached Fabric template.
 signs.uniforms.image=atlas.canvas;
 addFaces(viewer,g.labels,signs,(f,u,v)=>{const [x,y,w,h]=atlas.cells[f.kind],pad=2;return [Math.round(f.shade*100)+((x+pad+u*(w-2*pad))/2048)*.98,(2048-y-h+pad+v*(h-2*pad))/2048];});
 const glow=mat('PortAuthorityCanopyGlow','vec2 q=uv-.5;m.emission=vec3(.45,.47,.33);m.alpha=exp(-dot(q,q)*17.0)*.095;',{},true);
 addFaces(viewer,g.pools,glow,(f,u,v)=>[u,v],true);
 return {terminal:PORT_AUTHORITY,facades:PORT_AUTHORITY.facades.length,wrapFaces:2,canopies:g.canopies.length,bollards:g.bollards.length};
}
