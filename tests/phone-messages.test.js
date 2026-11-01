import test from 'node:test';import assert from 'node:assert/strict';
import {mountPhotoMessages} from '../src/phone-messages.js';
class Node{constructor(){this.children=[];this.className='';this.textContent='';this.hidden=false;this.attributes={};}append(...nodes){this.children.push(...nodes);}replaceChildren(...nodes){this.children=nodes;}setAttribute(k,v){this.attributes[k]=v;}}
const fixture=()=>{const pane=new Node();let captures=0;const inbox=mountPhotoMessages(pane,{document:{createElement:()=>new Node()},onCamera:()=>captures++});return{pane,inbox,captures:()=>captures};};
test('Messages retains pending and paid photo requests with landmark, sender and actual reward',()=>{
 const f=fixture(),tasks=[{id:'a',sender:'Mom',name:'Disney Store',reward:90,completedAt:null},{id:'b',sender:'Dad',name:'FDNY Engine 54',reward:20,completedAt:1000}];
 f.inbox.update(tasks);const [heading,summary,list,empty]=f.pane.children;assert.equal(heading.textContent,'Photo requests');assert.equal(summary.textContent,'1 pending · 1 completed');assert(empty.hidden);assert.equal(list.children.length,2);
 assert.equal(list.children[0].children[0].textContent,'Mom');assert.match(list.children[0].children[1].textContent,/Disney Store/);assert.match(list.children[0].children[2].textContent,/\$90/);
 list.children[0].children[3].onclick();assert.equal(f.captures(),1);
 assert.match(list.children[1].children[1].textContent,/FDNY Engine 54/);assert.equal(list.children[1].children[2].textContent,'✓ Completed · $20 paid');assert.equal(list.children[1].children.length,3);
});
test('unchanged snapshots do not rebuild the inbox and completion removes only the camera action',()=>{
 const f=fixture(),tasks=[{id:'a',sender:'Friend',name:'McDonald’s',reward:50}];assert(f.inbox.update(tasks));const original=f.pane.children[2].children[0];assert.equal(f.inbox.update(structuredClone(tasks)),false);assert.equal(f.pane.children[2].children[0],original);
 tasks[0].completedAt=2000;assert(f.inbox.update(tasks));assert.match(f.pane.children[2].children[0].children[2].textContent,/\$50 paid/);assert.equal(f.pane.children[2].children[0].children.length,3);
});
test('leaving a round clears old requests, and request text is rendered as text with a safe reward fallback',()=>{
 const f=fixture();f.inbox.update([{name:'<img src=x>',sender:'<script>',reward:999}]);const card=f.pane.children[2].children[0];assert.equal(card.children[0].textContent,'<script>');assert.equal(card.children[1].textContent,'Can you take a picture of <img src=x>?');assert.match(card.children[2].textContent,/\$30/);
 f.inbox.update([]);assert.equal(f.pane.children[2].children.length,0);assert.equal(f.pane.children[3].hidden,false);
});
