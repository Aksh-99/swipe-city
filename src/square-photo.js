export function centerSquare(width,height){if(!(width>0&&height>0))throw Error('The camera is not ready yet.');const side=Math.min(width,height);return {x:(width-side)/2,y:(height-side)/2,side};}
export function drawSquarePhoto(source,destination){const crop=centerSquare(source.width,source.height),context=destination.getContext('2d');if(!context)throw Error('The camera is unavailable.');context.drawImage(source,crop.x,crop.y,crop.side,crop.side,0,0,destination.width,destination.height);return destination;}
// A transient zero-size/unsupported preview must not throw out of Cesium's
// render callback and stop the entire game's render loop.
export function tryDrawSquarePhoto(source,destination){try{drawSquarePhoto(source,destination);return true;}catch{return false;}}
export function captureSquarePhoto(source,doc=globalThis.document){const photo=doc.createElement('canvas');photo.width=photo.height=512;drawSquarePhoto(source,photo);return photo.toDataURL('image/png');}
