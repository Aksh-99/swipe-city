// UV crop preserves the artwork's proportions inside a physical display opening.
export function coverCrop(sourceAspect,targetAspect,anchorY=.5){
 if(targetAspect>sourceAspect){const h=sourceAspect/targetAspect;return [0,(1-h)*anchorY,1,h];}
 const w=targetAspect/sourceAspect;return [(1-w)/2,0,w,1];
}
export function cornerPanelUV(f,u,v){
 if(f.panelIndex!==undefined){const crop=coverCrop((1774/12)/(887/2),f.width/f.height,1),x=crop[0]+u*crop[2],y=crop[1]+v*crop[3];return [(f.panelIndex+.012+x*.976)/12,.503+y*.494];}
 const cell=f.kind==='tmobile'?[0,0]:[1,0],uu=f.u0===undefined?u:f.u0+(f.u1-f.u0)*u;return [(cell[0]+.004+uu*.992)/2,(cell[1]+.004+v*.992)/2];
}
export function fittedCornerPanels(screens){return screens.flatMap(f=>{if(!f.kind.startsWith('eagle-'))return [f];const count=6,pitch=f.width/count;return Array.from({length:count},(_,j)=>({...f,center:f.center.clone().addScaledVector(f.right,-f.width/2+(j+.5)*pitch).addScaledVector(f.normal,.02),width:pitch-.16,height:f.height-.16,panelIndex:j+(f.kind==='eagle-lower'?6:0)}));});}
