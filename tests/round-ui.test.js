import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {mountRoundUI} from '../src/round-ui.js';
async function fixture(rematch){
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 class Node extends EventTarget{constructor(){super();this.hidden=false;this.disabled=false;this.textContent='';this.attributes={};this.children=[];}setAttribute(k,v){this.attributes[k]=String(v);}replaceChildren(...nodes){this.children=[...nodes];}append(...nodes){this.children.push(...nodes);}}
 const ids=Object.fromEntries([...html.matchAll(/id="((?:round|interaction|shoot|officer)(?:-[^"]+)?)"/g)].map(m=>[m[1],new Node()]));
 const ui=mountRoundUI({document:{getElementById:id=>ids[id],createElement:()=>new Node()},rematch});return {ui,ids,click:id=>ids[id].dispatchEvent(new Event('click'))};
}
const playing={phase:'connected',roomCode:'ABC234',matchId:'one',matchPhase:'playing',yourRound:{role:'THIEF',stolen:0,wallet:500,survival:true},canMove:true,isHost:true};
test('private role introduction, thief-only counter, goal-survival objective, cooldown and one-time feedback use the assigned role',async()=>{
 const f=await fixture();f.ui.update(playing,1000);assert.equal(f.ids['round-intro-title'].textContent,'YOU ARE THE THIEF');assert.equal(f.ids['round-money'].textContent,'Wallet: $500');assert.equal(f.ids['round-intro'].hidden,false);
 f.ui.update(playing,8000);assert(f.ids['round-intro'].hidden);assert.equal(f.ids['round-role'].hidden,false);
 const stolen={...playing,yourRound:{role:'THIEF',stolen:1050,feedback:{id:'a',kind:'theft',amount:175,stolen:1050,at:8000}}};f.ui.update(stolen,8000);assert.match(f.ids['round-objective'].textContent,/Stay free until 0:00/);assert.match(f.ids['round-toast'].textContent,/\+\$175 stolen/);f.ui.update(stolen,14_000);assert(f.ids['round-toast'].hidden,'polls cannot keep resetting the same award toast');
 const police={...playing,matchId:'two',yourRound:{role:'POLICE',penaltyUntil:25_000,feedback:{id:'b',kind:'wrongful_arrest',at:15_000}}};f.ui.update(police,15_000);assert(f.ids['round-money'].hidden);assert.equal(f.ids['round-intro-title'].textContent,'YOU ARE THE OFFICER');assert.equal(f.ids['round-cooldown'].textContent,'WRITE-UP · Movement locked: 10s');assert.match(f.ids['round-toast'].textContent,/Innocent pedestrian/);f.ui.update(police,25_000);assert(f.ids['round-cooldown'].hidden);
 f.ui.update({...playing,matchId:'three',yourRound:{role:'PEDESTRIAN',wallet:825,feedback:{id:'loss',kind:'wallet_loss',amount:175,wallet:825,at:50_000}}},50_000);assert.equal(f.ids['round-money'].textContent,'Wallet: $825');assert.equal(f.ids['round-money'].hidden,false);assert.match(f.ids['round-toast'].textContent,/−\$175 from your wallet/);assert.equal(f.ids['round-intro-title'].textContent,'YOU ARE A PEDESTRIAN');assert.match(f.ids['round-objective'].textContent,/R to report/);
});
test('correct/timeout result screens and same-room rematch expose the result, with host-only rematch and a clean waiting room',async()=>{
 let count=0;const f=await fixture(async()=>{count++;});
 const ended={...playing,matchPhase:'ended',canMove:false,canRematch:true,roundResult:{winner:'POLICE',reason:'arrested',stolen:375,goal:1000}};f.ui.update(ended,30_000);assert.equal(f.ids['round-result-title'].textContent,'POLICE WIN');assert.equal(f.ids['round-result-reason'].textContent,'THIEF ARRESTED');assert.equal(f.ids['round-result-money'].textContent,'$375 stolen');assert(f.ids['round-role'].hidden);assert.equal(f.ids['round-rematch'].hidden,false);
 f.click('round-rematch');await new Promise(r=>setImmediate(r));assert.equal(count,1);
 f.ui.update({...ended,isHost:false,canRematch:false,roundResult:{winner:'THIEF',reason:'escaped',stolen:1050,goal:1000}},31_000);assert.equal(f.ids['round-result-title'].textContent,'THIEF WINS');assert(f.ids['round-rematch'].hidden);assert.match(f.ids['round-rematch-status'].textContent,/Waiting for the host/);
 f.ui.update({...playing,matchId:null,matchPhase:'waiting',yourRound:null},32_000);assert(f.ids['round-result'].hidden);assert(f.ids['round-intro'].hidden);assert(f.ids['round-toast'].hidden);
});
test('hold meter displays server time progress and resets without a client-side award',async()=>{
 const f=await fixture(),action={kind:'pickpocket',startedAt:1000,endsAt:3400};f.ui.updateInteraction({candidate:null,action,holding:true},2200);assert.equal(f.ids['interaction-progress'].attributes['aria-valuenow'],'50');assert.equal(f.ids['interaction-label'].textContent,'Hold E — Pickpocket');assert(f.ids['interaction-ring'].attributes['stroke-dashoffset'].startsWith('56.55'));f.ui.updateInteraction({candidate:null,action:null},3400);assert(f.ids['interaction-prompt'].hidden);
});
test('false-report fine countdown and final award cards display server-owned penalties and rewards',async()=>{
 const f=await fixture(),ped={...playing,yourRound:{role:'PEDESTRIAN',wallet:130,penaltyUntil:0,penaltyKind:'false_report',feedback:{id:'fine',kind:'false_report',amount:120,at:1000}}};
 f.ui.update(ped,1000);assert(f.ids['round-cooldown'].hidden);assert.match(f.ids['round-toast'].textContent,/−\$120 fine/);f.ui.update(ped,11000);assert(f.ids['round-cooldown'].hidden);
 const ended={...ped,matchPhase:'ended',yourRound:{...ped.yourRound,wallet:1400,reward:500,finalBalance:1400},roundResult:{winner:'POLICE',reason:'arrested',stolen:175,goal:1000,awards:[{kind:'richest',number:2,name:'Witness <b>',balance:900,amount:250},{kind:'police_assist',number:2,name:'Witness <b>',amount:250}]}};
 f.ui.update(ended,14000);assert.equal(f.ids['round-awards'].children.length,2);assert.equal(f.ids['round-awards'].children[0].children[0].textContent,'RICHEST PLAYER');assert.equal(f.ids['round-awards'].children[1].children[0].textContent,'POLICE ASSIST');assert.equal(f.ids['round-awards'].children[0].children[1].textContent,'Player 2 · Witness <b>');assert.equal(f.ids['round-result-reward'].textContent,'Your bonus: +$500 · Final balance: $1,400');
 const first=f.ids['round-awards'].children[0];f.ui.update(ended,15000);assert.equal(f.ids['round-awards'].children[0],first,'polls preserve award cards');
});
test('shot notice shows theft/surgery and death popup remains red, persistent, and clears on rematch',async()=>{
 const f=await fixture();f.ui.update({...playing,yourRound:{role:'PEDESTRIAN',wallet:300,feedback:{id:'hit',kind:'shot',stolen:100,surgery:100,at:1000}}},1000);
 assert.match(f.ids['round-toast'].textContent,/\$100 stolen \+ \$100 surgery/);
 const dead={...playing,yourRound:{role:'PEDESTRIAN',dead:true,wallet:0}};f.ui.update(dead,2000);assert.equal(f.ids['round-dead'].hidden,false);f.ui.update(dead,120000);assert.equal(f.ids['round-dead'].hidden,false);assert(f.ids['round-intro'].hidden);
 f.ui.update({...playing,matchPhase:'waiting',yourRound:null,matchId:null},130000);assert(f.ids['round-dead'].hidden);
});
test('a death notice is visible to every role once, and officer wrong-shot penalties show 30 seconds',async()=>{
 for(const role of ['POLICE','THIEF','PEDESTRIAN']){const f=await fixture(),state={...playing,yourRound:{role,wallet:500},deathNotices:[{id:'death1',number:3,name:'Alex',at:1000}]};f.ui.update(state,1000);assert.equal(f.ids['round-death-notice'].hidden,false);assert.match(f.ids['round-death-notice'].textContent,/Player 3 · Alex has died/);f.ui.update(state,9000);assert(f.ids['round-death-notice'].hidden);}
 const f=await fixture();f.ui.update({...playing,yourRound:{role:'POLICE',wallet:400,penaltyKind:'officer_defamation',penaltyUntil:31000,feedback:{id:'wrongshot',kind:'officer_defamation',amount:100,at:1000}}},1000);assert.equal(f.ids['round-cooldown'].textContent,'DEFAMATION · Movement locked: 30s');assert.match(f.ids['round-toast'].textContent,/−\$100/);
});
