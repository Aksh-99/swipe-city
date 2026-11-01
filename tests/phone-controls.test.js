import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {mountPhoneControls} from '../src/phone-controls.js';

async function phoneFixture(call911){
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');let focused;
 class Node extends EventTarget{
  constructor(){super();this.hidden=false;this.disabled=false;this.textContent='';this.attributes={};this.children=[];}
  setAttribute(k,v){this.attributes[k]=String(v);}focus(){focused=this;}
  replaceChildren(...nodes){this.children=[...nodes];}append(...nodes){this.children.push(...nodes);}
 }
 const ids=Object.fromEntries([...html.matchAll(/id="(phone(?:-[^"]+)?)"/g)].map(m=>[m[1],new Node()]));ids['phone-emergency'].hidden=true;
 const ui=mountPhoneControls({document:{getElementById:id=>ids[id],createElement:()=>new Node()},call911});
 return {ui,ids,get focused(){return focused;},click:id=>ids[id].dispatchEvent(new Event('click'))};
}
const playing={characterId:'tourist',phase:'connected',roomCode:'ABC234',matchPhase:'playing',startedAt:100_000,canMove:true,serverTime:100_000,dispatchCalls:[],suspect:{playerId:'selected-person',description:'Male · dark suit · beard'}};
const flush=()=>new Promise(resolve=>setImmediate(resolve));

test('civilian phone sends only the selected person ID once, shows delivery, and restores the map on end/Escape',async()=>{
 let finish,count=0;const selected=[],f=await phoneFixture(id=>{selected.push(id);count++;return new Promise(resolve=>finish=resolve);});
 assert(f.ids['phone-call-911'].disabled);f.ui.update(playing);assert.equal(f.ids['phone-call-911'].disabled,false);
 f.click('phone-call-911');assert.equal(f.ids['phone-emergency'].hidden,false);assert.equal(f.focused,f.ids['phone-end-call']);
 f.ui.update(playing);f.click('phone-call-911');assert.equal(count,1,'pending call cannot be duplicated by snapshots or clicks');
 assert.deepEqual(selected,['selected-person']);
 finish({yourCall:{id:'call-1'}});await flush();assert.equal(f.ids['phone-call-progress'].textContent,'Report sent');
 f.ui.update({...playing,yourCall:{id:'call-1',createdAt:100_000}});f.click('phone-end-call');assert(f.ids['phone-emergency'].hidden);assert(f.ids['phone-call-911'].disabled);assert.equal(f.focused,f.ids.phone);
 f.ui.update({...playing,serverTime:111_000});f.click('phone-call-911');const escape=new Event('keydown',{cancelable:true});Object.defineProperty(escape,'code',{value:'Escape'});f.ids.phone.dispatchEvent(escape);assert(escape.defaultPrevented);assert(f.ids['phone-emergency'].hidden);finish({yourCall:{id:'call-2'}});await flush();
 const failed=await phoneFixture(async()=>{throw new Error('Connection interrupted. Try again.');});failed.ui.update(playing);failed.click('phone-call-911');await flush();assert.equal(failed.ids['phone-call-progress'].textContent,'Call not sent');assert.match(failed.ids['phone-call-detail'].textContent,/Connection interrupted/);
});

test('report button requires a person, review focuses it, and dispatch shows descriptions, street, call time and a live age without identifying the suspect',async()=>{
 const f=await phoneFixture(async()=>({yourCall:{id:'a'}}));
 f.ui.update({...playing,suspect:null});assert(f.ids['phone-call-911'].disabled);assert(f.ids['phone-suspect'].hidden);assert.match(f.ids['phone-call-hint'].textContent,/look at a person/);assert.equal(f.ui.reviewSuspect(),false);
 f.ui.update({...playing,suspect:{...playing.suspect,locked:true}});assert.equal(f.ui.reviewSuspect(),true);assert.equal(f.focused,f.ids['phone-call-911']);assert.equal(f.ids['phone-suspect-description'].textContent,'Male · dark suit · beard');
 f.ui.update({...playing,selecting:true});assert(f.ids['phone-call-911'].disabled);
 const report={id:'r',kind:'suspect',number:2,description:'Male · dark suit · beard',location:'Times Square · near W 45th St',createdAt:100_000,remainingMs:512_000};
 f.ui.update({...playing,characterId:'pedestrian',dispatchCalls:[report],serverTime:108_000});
 const item=f.ids['phone-dispatch-list'].children[0],lines=item.children.map(n=>n.textContent);
 for(const expected of ['911 REPORT','Suspicious person reported','Male · dark suit · beard','Last seen: Times Square · near W 45th St','Caller: Player 2','Reported: 8 sec ago','8:32 remaining when reported'])assert(lines.includes(expected),expected);
 assert(!lines.some(l=>/Player 3|thief/.test(l)));
 const age=item.children.find(n=>n.attributes.class==='phone-report-age');f.ui.updateTimer({...playing,characterId:'pedestrian'},109_000);assert.equal(age.textContent,'Reported: 9 sec ago');assert.equal(f.ids['phone-dispatch-list'].children[0],item);
});

test('Manson gets a dispatch app with caller labels and no 911 button; changing/leaving sessions removes stale UI',async()=>{
 const f=await phoneFixture(async()=>{throw new Error('Officer must not call');});
 const police={...playing,characterId:'pedestrian',dispatchCalls:[{id:'a',number:1},{id:'b',number:2}]};f.ui.update(police);
 assert.equal(f.ids.phone.attributes['data-mode'],'police');assert.equal(f.ids['phone-app-title'].textContent,'NYPD DISPATCH');assert(f.ids['phone-call-911'].hidden);
 assert.equal(f.ids['phone-dispatch-duty'].textContent,'ON DUTY');assert.equal(f.ids['phone-alert-count'].textContent,'2 alerts');assert.deepEqual(f.ids['phone-dispatch-list'].children.map(n=>n.children.find(c=>c.textContent.startsWith('Caller:')).textContent),['Caller: Player 1','Caller: Player 2']);
 const first=f.ids['phone-dispatch-list'].children[0];f.ui.update(police);assert.equal(f.ids['phone-dispatch-list'].children[0],first);
 f.ui.update({...police,phase:'reconnecting'});assert.equal(f.ids['phone-dispatch-duty'].textContent,'RECONNECTING');
 f.ui.update({...police,dispatchCalls:[]});assert.equal(f.ids['phone-dispatch-list'].children.length,0);assert.equal(f.ids['phone-alert-count'].textContent,'0 alerts');
 f.ui.update(playing);assert.equal(f.ids['phone-call-911'].hidden,false);assert(f.ids['phone-dispatch-list'].hidden);assert.equal(f.ids.phone.attributes['data-mode'],'civilian');
 f.ui.update({...playing,phase:'solo',roomCode:null,canMove:false});assert(f.ids['phone-call-911'].disabled);assert.match(f.ids['phone-call-hint'].textContent,/Join a room/);
});

test('both phone apps show the match clock during calls, reconnects and the final minute, then show zero without a negative countdown',async()=>{
 const f=await phoneFixture(async()=>({yourCall:{id:'a'}}));
 assert.equal(f.ids['phone-time-left'].textContent,'10:00');assert.equal(f.ids['phone-timer-label'].textContent,'Waiting for start');
 f.ui.update(playing);assert.equal(f.ids['phone-time-left'].textContent,'10:00');assert.equal(f.ids['phone-timer-label'].textContent,'Time left');
 f.click('phone-call-911');await flush();assert.equal(f.ids['phone-emergency'].hidden,false);
 f.ui.updateTimer(playing,104_000);assert.equal(f.ids['phone-time-left'].textContent,'9:56');assert.equal(f.ids['phone-emergency'].hidden,false);
 f.ui.update({...playing,phase:'reconnecting',serverTime:140_000,canMove:false});assert.equal(f.ids['phone-time-left'].textContent,'9:20');
 f.ui.update({...playing,characterId:'pedestrian',serverTime:640_000});assert.equal(f.ids['phone-time-left'].textContent,'1:00');assert.equal(f.ids['phone-match-timer'].attributes['data-state'],'urgent');assert.equal(f.ids['phone-app-title'].textContent,'NYPD DISPATCH');
 f.ui.update({...playing,characterId:'pedestrian',matchPhase:'ended',serverTime:700_000,canMove:false});assert.equal(f.ids['phone-time-left'].textContent,'0:00');assert.equal(f.ids['phone-timer-label'].textContent,"Time's up");assert.equal(f.ids['phone-dispatch-duty'].textContent,'MATCH ENDED');
 f.ui.updateTimer({...playing,matchPhase:'ended'},800_000);assert.equal(f.ids['phone-time-left'].textContent,'0:00');
 f.ui.update({phase:'solo',characterId:'tourist',canMove:false});assert.equal(f.ids['phone-time-left'].textContent,'10:00');assert.equal(f.ids['phone-timer-label'].textContent,'Waiting for start');
});

test('the thief has no reporting controls; only a human pedestrian sees their own wallet balance and deduction',async()=>{
 let calls=0;const f=await phoneFixture(async()=>{calls++;return {yourCall:{id:'a'}};});
 f.ui.update({...playing,yourRound:{role:'PEDESTRIAN',wallet:1000}});assert.equal(f.ids['phone-wallet'].hidden,false);assert.equal(f.ids['phone-wallet-balance'].textContent,'$1,000');f.click('phone-call-911');await flush();
 f.ui.update({...playing,yourRound:{role:'THIEF',stolen:175}});assert(f.ids['phone-call-911'].hidden);assert(f.ids['phone-call-911'].disabled);assert(f.ids['phone-call-hint'].hidden);assert(f.ids['phone-suspect'].hidden);assert(f.ids['phone-emergency'].hidden);assert(f.ids['phone-wallet'].hidden);assert.equal(f.ui.reviewSuspect(),false);f.click('phone-call-911');assert.equal(calls,1);
 const victim={...playing,yourRound:{role:'PEDESTRIAN',wallet:825,feedback:{kind:'wallet_loss',amount:175,wallet:825,at:100_000}}};f.ui.update(victim);assert.equal(f.ids['phone-wallet-balance'].textContent,'$825');assert.equal(f.ids['phone-wallet-loss'].textContent,'−$175 stolen');assert.equal(f.ids['phone-wallet-loss'].hidden,false);assert.equal(f.ids['phone-call-911'].hidden,false);
 f.ui.update({...victim,serverTime:107_000});assert(f.ids['phone-wallet-loss'].hidden);assert.equal(f.ids['phone-wallet-balance'].textContent,'$825');f.ui.update({...playing,characterId:'pedestrian',yourRound:{role:'POLICE'}});assert(f.ids['phone-wallet'].hidden);
});
test('the phone distinguishes a false-report fine from theft and cannot report during the movement penalty',async()=>{
 let calls=0;const f=await phoneFixture(async()=>{calls++;});f.ui.update({...playing,canMove:false,yourRound:{role:'PEDESTRIAN',wallet:900,penaltyUntil:110000,feedback:{kind:'false_report',amount:100,at:100000}}});assert.equal(f.ids['phone-wallet-balance'].textContent,'$900');assert.equal(f.ids['phone-wallet-loss'].textContent,'−$100 defamation fine');assert(f.ids['phone-call-911'].disabled);f.click('phone-call-911');assert.equal(calls,0);
});
