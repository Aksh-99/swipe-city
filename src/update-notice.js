// A tab can outlive a deployment. Offer recovery if its old chunk is no longer
// available; never reload a live multiplayer round without the player's click.
export function mountUpdateNotice({host=globalThis,document:doc=host.document}={}){
 const notice=doc.createElement('aside');notice.id='game-update-notice';notice.hidden=true;notice.setAttribute('role','alert');notice.innerHTML='<strong>A fresh version is ready.</strong><span>Reload to get the latest game files. You may need to rejoin your room.</span><button type="button">Reload game</button>';doc.body.append(notice);
 notice.querySelector('button').onclick=()=>host.location.reload();
 const show=()=>{notice.hidden=false;};
 host.addEventListener('vite:preloadError',event=>{event.preventDefault();show();});
 return {show};
}
