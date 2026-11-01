import test from 'node:test';import assert from 'node:assert/strict';
import {HAIR_COLORS,normalizeHairColor} from '../src/hair-colors.js';
import {appearanceDescription} from '../src/appearances.js';
import {CharacterLighting} from '../src/character-rendering.js';
import {createRoomsHandler} from '../server/rooms.js';
import {createTestDatabase} from './d1-test-helper.js';
import {encodeMovement} from '../server/transport.js';
import {readFile} from 'node:fs/promises';
test('hair colors affect only their dedicated shader mask; natural preserves the original textures',async()=>{
 const lighting=new CharacterLighting();for(const c of HAIR_COLORS){lighting.setHairColor(c.id);assert.equal(lighting.shader.uniforms.u_hairTintEnabled.value,c.hex?1:0);}lighting.destroy();
 assert.equal(normalizeHairColor('forged'),'natural');assert.match(appearanceDescription('tourist','blonde'),/blonde hair/);assert(!appearanceDescription('tourist','blonde').includes('dark hair'));
 for(const path of ['public/player.glb','public/characters/tourist.glb','public/characters/commuter.glb','public/characters/pedestrian.glb']){const b=await readFile(new URL('../'+path,import.meta.url)),n=b.readUInt32LE(12),g=JSON.parse(b.subarray(20,20+n)),p=g.meshes[0].primitives[0],a=g.accessors[p.attributes._HAIR];assert(a);assert.equal(a.count,g.accessors[p.attributes.POSITION].count);assert.equal(a.normalized,true);}
});
test('server validates and publishes waiting-room hair colors, preserves them at match start, and rejects mid-round changes',async t=>{
 const store=createTestDatabase();t.after(()=>store.close());let time=100000;const handler=createRoomsHandler({now:()=>time});
 const post=async(path,body)=>{const r=await handler(new Request('https://times.test'+path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}),{DB:store.db});return {status:r.status,...await r.json()};};
 let room;const members=[];for(const characterId of ['explorer','tourist','pedestrian','commuter']){const m=await post(room?`/api/rooms/${room}/join`:'/api/rooms',{name:characterId,characterId});assert.equal(m.status,201);room=m.roomCode;members.push(m);}
 const action=(m,a,data={})=>post(`/api/rooms/${room}/${a}`,{token:m.sessionToken,...data});
 const bad=await action(members[0],'character',{characterId:'explorer',hairColor:'evil'});assert.equal(bad.status,400);
 const changed=await action(members[0],'character',{characterId:'explorer',hairColor:'blonde'});assert.equal(changed.status,200);assert.equal(changed.players.find(p=>p.id===members[0].yourId).hairColor,'blonde');
 for(const m of members)await action(m,'ready');const match=await action(members[0],'start');assert.equal(match.status,200);assert.equal(match.players.find(p=>p.id===members[0].yourId).hairColor,'blonde');
 const blocked=await action(members[0],'character',{characterId:'explorer',hairColor:'pink'});assert.equal(blocked.code,'MATCH_STARTED');
 const encoded=JSON.parse(encodeMovement(match.players[0].state,JSON.stringify({...match.players[0].state,_hairColor:'blonde'})));assert.equal(encoded._hairColor,'blonde');
});
