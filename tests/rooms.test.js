import test from 'node:test';import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRoomsHandler} from '../server/rooms.js';
import worker from '../server/worker.js';
import {DEFAULT_ROOM_STATE,MEMBER_LEASE,BACKGROUND_LEASE} from '../src/room-protocol.js';
import {createTestDatabase} from './d1-test-helper.js';
const toward=(p,d)=>{const length=Math.hypot(p[0],p[1]);return [p[0]-p[0]/length*d,p[1]-p[1]/length*d,p[2]];};
const request=(path,body,origin='https://times.test')=>new Request('https://times.test'+path,{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify(body)});
async function json(handler,db,path,body){const response=await handler(request(path,body),{DB:db});return {status:response.status,...await response.json()};}
test('four independent server handlers share a room, assign distinct avatars and observe each player movement',async()=>{
 let time=100_000;const store=createTestDatabase(),handlers=Array.from({length:4},()=>createRoomsHandler({now:()=>time}));try{
  const first=await json(handlers[0],store.db,'/api/rooms',{name:'Player 1',characterId:'explorer',designId:'bald'});assert.equal(first.status,201);
  const room=first.roomCode,joins=await Promise.all(handlers.slice(1).map((h,i)=>json(h,store.db,`/api/rooms/${room}/join`,{name:'Player '+(i+2),characterId:'explorer'}))),members=[first,...joins];
  for(const m of members)assert.equal(m.status,201);assert.equal(new Set(members.map(m=>m.self.characterId)).size,4);assert.equal(new Set(members.map(m=>m.self.id)).size,4);
  for(const m of members)await json(handlers[0],store.db,`/api/rooms/${room}/ready`,{token:m.sessionToken});
  const started=await json(handlers[0],store.db,`/api/rooms/${room}/start`,{token:first.sessionToken});assert.equal(started.matchPhase,'playing');assert.equal(started.players.find(p=>p.id===first.yourId).designId,'bald');time+=3000;const destinations=members.map((m,i)=>toward(started.players.find(p=>p.id===m.yourId).state.position,i*2));
  for(let i=0;i<4;i++){const state={...DEFAULT_ROOM_STATE,position:destinations[i],heading:.3*i,speed:3.2,poseWeight:1,gaitPhase:.4*i};const r=await json(handlers[i],store.db,`/api/rooms/${room}/sync`,{token:members[i].sessionToken,sequence:2,matchId:started.matchId,revision:1,state});assert.equal(r.status,200);}
  for(let i=0;i<4;i++){const r=await json(handlers[i],store.db,`/api/rooms/${room}/sync`,{token:members[i].sessionToken,sequence:3});assert.equal(r.players.length,4);for(let j=0;j<4;j++){const p=r.players.find(p=>p.id===members[j].self.id);assert.deepEqual(p.state.position,destinations[j]);assert.equal(p.state.gaitPhase,.4*j);}assert.equal(r.players.find(p=>p.id===first.yourId).designId,'bald');assert(!JSON.stringify(r.players).includes('token'));}
 }finally{store.close();}
});
test('a suspended background tab remains in snapshots and retains its character beyond the normal lease',async()=>{
 let time=100_000;const store=createTestDatabase(),h=createRoomsHandler({now:()=>time});try{
  const host=await json(h,store.db,'/api/rooms',{}),room=host.roomCode,guest=await json(h,store.db,`/api/rooms/${room}/join`,{hidden:true});
  for(let sequence=1;sequence<=12;sequence++){time+=20_000;const snapshot=await json(h,store.db,`/api/rooms/${room}/sync`,{token:host.sessionToken,sequence});assert.equal(snapshot.status,200);assert.equal(snapshot.players.length,2);assert.equal(snapshot.players.find(p=>p.id===guest.yourId).background,true);}
  const wake=await json(h,store.db,`/api/rooms/${room}/sync`,{token:guest.sessionToken,sequence:1,hidden:false});assert.equal(wake.status,200);assert.equal(wake.yourId,guest.yourId);assert.equal(wake.players.find(p=>p.id===guest.yourId).background,false);
 }finally{store.close();}
});
test('background slots eventually expire, and stale closing packets cannot shorten a newer background lease',async()=>{
 let time=100_000;const store=createTestDatabase(),h=createRoomsHandler({now:()=>time});try{
  const member=await json(h,store.db,'/api/rooms',{}),path=`/api/rooms/${member.roomCode}/sync`;
  await json(h,store.db,path,{token:member.sessionToken,sequence:2,hidden:true});time+=1000;
  await json(h,store.db,path,{token:member.sessionToken,sequence:1,hidden:false});time+=MEMBER_LEASE+1;
  const live=await json(h,store.db,path,{token:member.sessionToken,sequence:3,hidden:true});assert.equal(live.status,200);
  time+=BACKGROUND_LEASE+1;assert.equal((await json(h,store.db,path,{token:member.sessionToken,sequence:4})).code,'MEMBER_EXPIRED');
  assert.equal((await json(h,store.db,`/api/rooms/${member.roomCode}/join`,{})).players.length,1);
 }finally{store.close();}
});
test('concurrent joins never exceed twenty slots; leave makes the seat available immediately',async()=>{
 const store=createTestDatabase(),h=createRoomsHandler();try{
  const owner=await json(h,store.db,'/api/rooms',{}),room=owner.roomCode;
  const joins=await Promise.all(Array.from({length:29},(_,i)=>json(createRoomsHandler(),store.db,`/api/rooms/${room}/join`,{name:'Guest '+i})));assert.equal(joins.filter(r=>r.status===201).length,19);assert(joins.filter(r=>r.status!==201).every(r=>r.code==='ROOM_FULL'));
  const guest=joins.find(r=>r.status===201);assert.equal((await json(h,store.db,`/api/rooms/${room}/leave`,{token:guest.sessionToken})).status,200);
  assert.equal((await json(h,store.db,`/api/rooms/${room}/join`,{name:'Replacement'})).status,201);
 }finally{store.close();}
});
test('expired connections are reclaimed and reload can resume a live member without taking another slot',async()=>{
 let time=100_000;const store=createTestDatabase(),h=createRoomsHandler({now:()=>time});try{
  const owner=await json(h,store.db,'/api/rooms',{}),room=owner.roomCode,guest=await json(h,store.db,`/api/rooms/${room}/join`,{});
  const resume=await json(createRoomsHandler({now:()=>time}),store.db,`/api/rooms/${room}/sync`,{token:guest.sessionToken,sequence:1});assert.equal(resume.yourId,guest.self.id);assert.equal(resume.players.length,2);
  time+=MEMBER_LEASE+1;assert.equal((await json(h,store.db,`/api/rooms/${room}/sync`,{token:guest.sessionToken,sequence:2})).code,'MEMBER_EXPIRED');
  const fresh=await json(h,store.db,`/api/rooms/${room}/join`,{});assert.equal(fresh.status,201);assert.equal(fresh.players.length,1);
 }finally{store.close();}
});
test('session authorization, sequence order and movement bounds prevent cross-player or malformed updates',async()=>{
 let time=100_000;const store=createTestDatabase(),h=createRoomsHandler({now:()=>time});try{
  const a=await json(h,store.db,'/api/rooms',{}),b=await json(h,store.db,'/api/rooms',{}),path=`/api/rooms/${a.roomCode}/sync`;
  assert.equal((await json(h,store.db,path,{token:b.sessionToken,sequence:1})).status,401);
  const members=[a];for(let i=0;i<3;i++)members.push(await json(h,store.db,`/api/rooms/${a.roomCode}/join`,{}));
  for(const m of members)await json(h,store.db,`/api/rooms/${a.roomCode}/ready`,{token:m.sessionToken});
  const started=await json(h,store.db,`/api/rooms/${a.roomCode}/start`,{token:a.sessionToken});time+=2000;
  const valid={...DEFAULT_ROOM_STATE,position:toward(started.players[0].state.position,8)};assert.equal((await json(h,store.db,path,{token:a.sessionToken,sequence:5,matchId:started.matchId,revision:1,state:valid})).status,200);
  const old=await json(h,store.db,path,{token:a.sessionToken,sequence:4,matchId:started.matchId,revision:1,state:{...valid,position:[1,1,.17]}});assert.deepEqual(old.players[0].state.position,valid.position);
  assert.equal((await json(h,store.db,path,{token:a.sessionToken,sequence:6,state:{...valid,position:[9999,0,0]}})).status,400);
  assert.equal((await h(request(path,{token:a.sessionToken,sequence:6},'https://other.test'),{DB:store.db})).status,403);
 }finally{store.close();}
});
test('multiple players can choose an officer uniform while roles remain server assigned',async()=>{
 const store=createTestDatabase(),h=createRoomsHandler();try{
  const a=await json(h,store.db,'/api/rooms',{}),b=await json(h,store.db,`/api/rooms/${a.roomCode}/join`,{}),path=`/api/rooms/${a.roomCode}/character`;
  const results=await Promise.all([a,b].map(m=>json(createRoomsHandler(),store.db,path,{token:m.sessionToken,characterId:'pedestrian'})));assert.equal(results.filter(r=>r.status===200).length,2);
  const final=await json(h,store.db,`/api/rooms/${a.roomCode}/sync`,{token:a.sessionToken,sequence:1});assert(final.players.every(p=>p.characterId==='pedestrian'));
 }finally{store.close();}
});
test('a disconnected member releases its character after the lease without requiring a new join',async()=>{
 let time=100_000;const store=createTestDatabase(),h=createRoomsHandler({now:()=>time});try{
  const host=await json(h,store.db,'/api/rooms',{}),room=host.roomCode;
  await json(h,store.db,`/api/rooms/${room}/join`,{characterId:'tourist'});
  time+=MEMBER_LEASE-5_000;await json(h,store.db,`/api/rooms/${room}/sync`,{token:host.sessionToken,sequence:1});time+=6_000;
  const result=await json(h,store.db,`/api/rooms/${room}/character`,{token:host.sessionToken,characterId:'tourist'});
  assert.equal(result.status,200);assert.equal(result.players.length,1);assert.equal(result.players[0].characterId,'tourist');
 }finally{store.close();}
});
test('worker routes room APIs ahead of assets and preserves the original game assets',async()=>{
 const store=createTestDatabase();try{
  const env={DB:store.db,ASSETS:{fetch:async r=>new Response('existing city asset '+new URL(r.url).pathname)}};
  const api=await worker.fetch(request('/api/rooms',{}),env);assert.equal(api.status,201);
  assert.equal(await (await worker.fetch(new Request('https://times.test/data/nyc/manifest.json'),env)).text(),'existing city asset /data/nyc/manifest.json');
  assert.equal((await worker.fetch(new Request('https://times.test/?room=ABC234'),env)).status,200);
 }finally{store.close();}
});
test('civilian appearance migration preserves all four sessions, physical poses and background leases',async()=>{
 const time=100_000,room='ABC234',tokens=['1','2','3','4'].map(c=>c.repeat(64));let legacyRows;
 const store=createTestDatabase({beforeMigration(sql,file){
  if(file!=='0002_civilian_appearances.sql')return;
  sql.prepare('INSERT INTO ts_rooms VALUES(?,?,?,?)').run(room,time,time+1_000_000,JSON.stringify(DEFAULT_ROOM_STATE));
  const insert=sql.prepare('INSERT INTO ts_members(token_hash,player_id,room_code,slot,avatar,name,joined_at,last_seen,sequence,state,presence_until) VALUES(?,?,?,?,?,?,?,?,?,?,?)');
  ['explorer','tourist','officer','courier'].forEach((id,i)=>insert.run(createHash('sha256').update(tokens[i]).digest('hex'),'legacy-'+i,room,i,id,'Player '+i,time,time,7+i,JSON.stringify({...DEFAULT_ROOM_STATE,position:[i*3,i*2,.17],gaitPhase:i*.4}),time+(i===2?BACKGROUND_LEASE:MEMBER_LEASE)));
  legacyRows=sql.prepare('SELECT * FROM ts_members ORDER BY slot').all().map(r=>({...r}));
 }});
 try{
  const canonical=['explorer','tourist','pedestrian','commuter'];
  const migrated=store.sql.prepare('SELECT * FROM ts_members ORDER BY slot').all().map(r=>({...r}));
  assert.deepEqual(migrated,legacyRows.map((r,i)=>({...r,avatar:canonical[i],ready:0,state_revision:0,pose_at:0,movement_credit:1.5})));
  assert.deepEqual(store.sql.prepare('PRAGMA foreign_key_check').all(),[]);
  for(let i=0;i<4;i++){
   const snapshot=await json(createRoomsHandler({now:()=>time}),store.db,`/api/rooms/${room}/sync`,{token:tokens[i],sequence:20+i,hidden:i===2});
   assert.equal(snapshot.status,200);assert.equal(snapshot.yourId,'legacy-'+i);assert.equal(snapshot.players.length,4);
   assert.deepEqual(snapshot.players.map(p=>p.characterId),canonical);
   snapshot.players.forEach((p,j)=>assert.deepEqual(p.state.position,[j*3,j*2,.17]));
  }
  // The replacement table retains uniqueness and the room's cascade cleanup.
  assert.throws(()=>store.sql.prepare('UPDATE ts_members SET avatar=? WHERE player_id=?').run('officer','legacy-0'));
  store.sql.prepare('UPDATE ts_members SET avatar=? WHERE player_id=?').run('tourist','legacy-0');assert.equal(store.sql.prepare('SELECT avatar FROM ts_members WHERE player_id=?').get('legacy-0').avatar,'tourist');
  store.sql.prepare('DELETE FROM ts_rooms WHERE code=?').run(room);assert.equal(store.sql.prepare('SELECT count(*) AS n FROM ts_members').get().n,0);
 }finally{store.close();}
});
test('room selection is appearance-only, accepts old saved IDs, and never publishes injected match fields',async()=>{
 const store=createTestDatabase(),h=createRoomsHandler();try{
  assert.equal((await json(h,store.db,'/api/rooms',{characterId:'tourist',role:'THIEF'})).status,400);
  const a=await json(h,store.db,'/api/rooms',{characterId:'officer',state:{...DEFAULT_ROOM_STATE,role:'THIEF',gameplayRole:'POLICE'}});
  assert.equal(a.status,201);assert.equal(a.self.characterId,'pedestrian');
  const b=await json(h,store.db,`/api/rooms/${a.roomCode}/join`,{characterId:'courier'});
  assert.equal(b.status,201);assert.equal(b.self.characterId,'commuter');
  const members=[a,b];for(let i=0;i<2;i++)members.push(await json(h,store.db,`/api/rooms/${a.roomCode}/join`,{}));
  for(const m of members)await json(h,store.db,`/api/rooms/${a.roomCode}/ready`,{token:m.sessionToken});
  const started=await json(h,store.db,`/api/rooms/${a.roomCode}/start`,{token:a.sessionToken});
  const path=`/api/rooms/${a.roomCode}/sync`,state={...DEFAULT_ROOM_STATE,position:toward(started.players[0].state.position,.3),role:'THIEF',gameplayRole:'POLICE',match:{secret:true}};
  const snapshot=await json(h,store.db,path,{token:a.sessionToken,sequence:2,matchId:started.matchId,revision:1,state});assert.equal(snapshot.status,200);
  for(const p of snapshot.players){
   assert.deepEqual(Object.keys(p).sort(),['id','slot','number','characterId','designId','name','ready','revision','background','updatedAt','sequence','state','interaction','dead','caught'].sort());
   assert.equal('role' in p.state,false);assert.equal('gameplayRole' in p.state,false);assert.equal('match' in p.state,false);
  }
  assert.deepEqual(snapshot.players.find(p=>p.id===a.yourId).state.position,state.position);
  assert.equal((await json(h,store.db,`/api/rooms/${a.roomCode}/character`,{token:a.sessionToken,characterId:'tourist',gameplayRole:'THIEF'})).status,400);
  assert(!store.sql.prepare('SELECT state FROM ts_members WHERE player_id=?').get(a.yourId).state.includes('THIEF'));
 }finally{store.close();}
});
