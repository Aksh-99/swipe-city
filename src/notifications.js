export function notificationCenter(doc=globalThis.document){
 let center=doc.getElementById('game-notifications');
 if(!center){center=doc.createElement('section');center.id='game-notifications';center.setAttribute('aria-label','Game notifications');doc.body.append(center);}
 return center;
}
