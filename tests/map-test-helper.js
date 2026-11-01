// Minimal SVG DOM adapter for exercising the real map constructor/update
// without a browser or an additional DOM dependency.
export class SvgElement extends EventTarget{
 constructor(tag,attributes={}){super();this.tag=tag;this.attributes={...attributes};this.children=[];this.textContent='';this.parent=null;}
 setAttribute(key,value){this.attributes[key]=String(value);}
 getAttribute(key){return this.attributes[key]??null;}
 append(...nodes){for(const node of nodes){node.remove();node.parent=this;this.children.push(node);}}
 replaceChildren(...nodes){for(const node of [...this.children])node.remove();this.append(...nodes);}
 remove(){if(this.parent){this.parent.children=this.parent.children.filter(node=>node!==this);this.parent=null;}}
}
export function mapDocument(){
 const map=new SvgElement('svg',{id:'phone-map',xmlns:'http://www.w3.org/2000/svg',width:164,height:210}),clip=new SvgElement('clipPath',{id:'map-clip'}),defs=new SvgElement('defs');defs.append(clip);map.append(defs,new SvgElement('rect',{width:720,height:940,fill:'#eef2f3'}));
 return {map,clip,document:{getElementById:id=>id==='phone-map'?map:id==='map-clip'?clip:null,createElementNS:(namespace,tag)=>new SvgElement(tag)}};
}
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
export function serializeSvg(node){return `<${node.tag} ${Object.entries(node.attributes).map(([k,v])=>`${k}="${escape(v)}"`).join(' ')}>${escape(node.textContent)}${node.children.map(serializeSvg).join('')}</${node.tag}>`;}
