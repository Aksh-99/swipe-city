import {mountUpdateNotice} from './update-notice.js';
import {guideHTML} from './player-guide.js';
import './player-guide.css';
import {mountAudioControls} from './audio-controls.js';
import {saveDesignSelection} from './design-selection.js';
import {CHARACTER_DESIGNS} from './character-designs.js';
import {mountPhoneApps} from './phone-apps.js';
import './homepage.css';
// Hair customization was removed; discard the old browser-only selection.
try{localStorage.removeItem('swipe-city-hair-color');}catch{}
const $=id=>document.getElementById(id),home=$('home'),dialog=$('home-dialog'),content=$('home-dialog-content');
mountPhoneApps();
mountAudioControls();
mountUpdateNotice();
let loading=false,game=null;
const showDialog=html=>{content.innerHTML=html;dialog.showModal();};
$('home-dialog-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
function playPanel(){showDialog(`<span class="home-kicker">THE CITY IS BETTER WITH FRIENDS</span><h2 id="home-dialog-title">Your crew. Your streets.</h2><p>Create a room, share its code, and invite your crew. The host starts with 4–20 ready players and chooses the timer.</p><div class="home-join-steps"><span>01 · Choose a look</span><span>02 · Create or join</span><span>03 · Learn your role</span></div><form id="home-lobby-form"><label for="home-name">Your name</label><input id="home-name" maxlength="24" value="Player" autocomplete="nickname" required><button class="home-primary" type="submit" name="action" value="create">CREATE A LOBBY <span>↗</span></button><div class="home-or">OR JOIN A FRIEND</div><label for="home-code">Room code</label><div class="home-code-row"><input id="home-code" maxlength="6" placeholder="ABC234" autocomplete="off" autocapitalize="characters"><button class="home-secondary" type="submit" name="action" value="join">JOIN →</button></div><p id="home-form-error" role="status"></p></form>`);
 const code=$('home-code');code.value=new URL(location.href).searchParams.get('room')??'';code.addEventListener('input',()=>code.value=code.value.toUpperCase().replace(/[^A-Z0-9]/g,''));
 $('home-lobby-form').addEventListener('submit',e=>{e.preventDefault();const action=e.submitter?.value??'create';if(action==='join'&&!/^[A-Z0-9]{6}$/.test(code.value)){$('home-form-error').textContent='Enter your friend’s six-character room code.';code.focus();return;}enterGame({action,name:$('home-name').value.trim()||'Player',code:code.value});});
}
async function enterGame({action='explore',name='Player',code=''}={}){
 if(loading)return;loading=true;dialog.close();$('home-loading').hidden=false;$('home-loading').textContent='Opening Times Square…';$('home-play').disabled=true;document.body.dataset.homeLoading='true';
 try{
  if(!game)game=import('./main.js');await game;
  if(document.body.dataset.startupError==='true')throw new Error(document.body.dataset.startupErrorMessage||'The city could not start. Reload to try again.');
  document.body.classList.remove('home-open');home.hidden=true;$('game-shell').inert=false;
  if(action!=='explore'){const panel=$('multiplayer');panel.open=true;$('player-name').value=name;$('room-code').value=code;$(action==='join'?'room-join':'room-create').click();$('player-name').focus();}
 }catch(error){game=null;$('home-loading').textContent=error.message||'Unable to open the city. Please reload and try again.';}
 finally{loading=false;$('home-play').disabled=false;delete document.body.dataset.homeLoading;}
}
$('home-play').addEventListener('click',async()=>{
 showDialog(`<span class="home-kicker">CHOOSE YOUR CHARACTER</span><h2 id="home-dialog-title">Who are you?</h2><p>Choose your look. Your secret role is assigned when the host starts the round; officers get a matching uniform.</p><div class="home-character-grid">${CHARACTER_DESIGNS.map(({id},index)=>`<button type="button" class="home-character" data-design="${id}" aria-label="Choose character ${index+1}"><img src="/characters/${id}.webp" width="240" height="280" alt="" loading="lazy"></button>`).join('')}</div>`);
 const cards=[...content.querySelectorAll('[data-design]')];for(const card of cards)card.onclick=()=>{saveDesignSelection(card.dataset.design);window.dispatchEvent(new CustomEvent('swipe-design',{detail:card.dataset.design}));playPanel();};

});
$('home-how').addEventListener('click',()=>showDialog(guideHTML({titleId:'home-dialog-title'})));
// Review links can still open directly into the existing environment.
if(new URL(location.href).searchParams.has('review'))enterGame();

window.addEventListener('swipe-leave-game',()=>{document.exitPointerLock?.();document.body.classList.add('home-open');home.hidden=false;$('game-shell').inert=true;});
