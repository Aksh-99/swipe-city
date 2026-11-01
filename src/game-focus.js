// Cesium prevents pointerdown's default focus change. Explicitly return the
// keyboard to the scene after the player uses a phone or lobby control.
export function focusGameCanvas(canvas,doc=globalThis.document){
 if(doc.activeElement&&doc.activeElement!==canvas)doc.activeElement.blur?.();
 canvas.focus({preventScroll:true});
}
