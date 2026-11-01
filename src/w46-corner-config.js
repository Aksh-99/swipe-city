import data from '../public/data/w46-billboard-corners.json' with {type:'json'};
export const W46_CORNERS=data;
export function w46CornerKind(p){for(const f of data.fronts){const x=p[0]-f.center[0],y=p[1]-f.center[1],d=x*f.normal[0]+y*f.normal[1],u=-x*f.normal[1]+y*f.normal[0];if(Math.abs(d)<1.6&&Math.abs(u)<f.width/2+.25)return f.kind;}return null;}
export function w46CornersReplace(f){const p=[f.center[0],f.center[1],0];return Boolean(w46CornerKind(p));}
export function w46CornerGLSL(){return `
float w46CornerMaterial(vec3 p){${data.fronts.map(f=>`{vec2 v=p.xy-vec2(${f.center[0]},${f.center[1]});if(abs(dot(v,vec2(${f.normal[0]},${f.normal[1]})))<1.0&&abs(dot(v,vec2(${-f.normal[1]},${f.normal[0]})))<${f.width/2+.25})return ${f.kind==='eagle'?'1.':'2.'};}`).join('\n')}return 0.;}
`;}
