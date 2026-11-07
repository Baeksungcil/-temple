import {walkable} from '../src/navigation.js';
import {WORLD_SCALE as S} from '../src/world-scale.js';
import test from 'node:test';import assert from 'node:assert/strict';import {WebSocket} from 'ws';import {createWorldServer} from './index.js';
const origin='http://127.0.0.1:5182';
async function peer(url){const ws=new WebSocket(url,{origin});const messages=[];ws.on('message',raw=>messages.push(JSON.parse(raw)));await new Promise((r,j)=>{ws.once('open',r);ws.once('error',j)});await wait(()=>messages.find(m=>m.type==='welcome'));return {ws,messages};}
async function wait(fn,attempts=100){for(let i=0;i<attempts;i++){const result=fn();if(result)return result;await new Promise(r=>setTimeout(r,10));}throw Error('Message timeout');}
test('server validates origin, movement, chat size and spam',async()=>{const world=createWorldServer({port:0,origins:[origin]});const port=await world.ready;let p;try{const status=await new Promise(r=>{const ws=new WebSocket('ws://127.0.0.1:'+port+'/world',{origin:'https://wrong.invalid'});ws.on('error',()=>{});ws.on('unexpected-response',(req,res)=>{r(res.statusCode);req.destroy();});});assert.equal(status,403);p=await peer('ws://127.0.0.1:'+port+'/world');p.ws.send(JSON.stringify({type:'move',x:999,z:999,yaw:0}));const self=await wait(()=>p.messages.find(m=>m.type==='self'));assert.ok(self.state.x<3*S&&self.state.z<24*S);p.ws.send(JSON.stringify({type:'sit',seatId:'missing'}));await wait(()=>p.messages.find(m=>m.code==='seat_too_far'));p.ws.send(JSON.stringify({type:'chat',text:'x'.repeat(201)}));await wait(()=>p.messages.find(m=>m.code==='chat_length'));for(let i=0;i<4;i++)p.ws.send(JSON.stringify({type:'chat',text:'hello '+i}));await wait(()=>p.messages.find(m=>m.code==='chat_rate'));}finally{p?.ws.terminate();await world.close();}});

test('seat ownership is exclusive and releases on disconnect',async()=>{
 const world=createWorldServer({port:0,origins:[origin]});const port=await world.ready;let a,b;
 async function approach(p,x,z){let state=p.messages.find(m=>m.type==='welcome').state;for(let n=1;n<=50&&Math.hypot(state.x-x,state.z-z)>.12;n++){const dx=x-state.x,dz=z-state.z,len=Math.hypot(dx,dz),step=Math.min(.22,len);p.ws.send(JSON.stringify({type:'move',x:state.x+dx/len*step,z:state.z+dz/len*step,yaw:0,seq:n}));state=(await wait(()=>p.messages.find(m=>m.type==='self'&&m.seq===n))).state;await new Promise(r=>setTimeout(r,65));}return state;}
 try{a=await peer('ws://127.0.0.1:'+port+'/world');b=await peer('ws://127.0.0.1:'+port+'/world');await approach(a,-2.3*S,18*S);await approach(b,-2.3*S,18*S);const seatId='nave:-1:18:4.2';a.ws.send(JSON.stringify({type:'sit',seatId}));await wait(()=>a.messages.find(m=>m.state?.seated));b.ws.send(JSON.stringify({type:'sit',seatId}));await wait(()=>b.messages.find(m=>m.code==='seat_occupied'));a.ws.terminate();await wait(()=>!world.occupied.has(seatId));b.ws.send(JSON.stringify({type:'sit',seatId}));await wait(()=>b.messages.find(m=>m.state?.seated));b.ws.send(JSON.stringify({type:'pray',value:true}));const prayer=await wait(()=>b.messages.find(m=>m.state?.praying));assert.equal(prayer.state.seated,true);b.ws.send(JSON.stringify({type:'stand'}));const standing=await wait(()=>b.messages.find(m=>m.type==='self'&&!m.state.seated));assert.ok(walkable(standing.state.x,standing.state.z),'Standing must land in a walkable aisle');
 }finally{a?.ws.terminate();b?.ws.terminate();await world.close();}
});

test('ambient visitors are shared, reserve seats and do not inflate real player count',async()=>{
 const world=createWorldServer({port:0,origins:[origin]}),port=await world.ready;let a,b;
 try{
  a=await peer('ws://127.0.0.1:'+port+'/world');b=await peer('ws://127.0.0.1:'+port+'/world');
  const first=await wait(()=>a.messages.find(m=>m.type==='ambient'));
  const second=await wait(()=>b.messages.find(m=>m.type==='ambient'));
  assert.equal(first.people.length,30);assert.deepEqual(first.people.map(p=>p.id),second.people.map(p=>p.id));
  assert.equal(world.players.size,2);
  const seated=world.ambient.people.find(p=>p.mode==='seated'),person=world.players.get(a.messages.find(m=>m.type==='welcome').id);
  person.x=seated.x;person.z=seated.z-2;
  a.ws.send(JSON.stringify({type:'sit',seatId:seated.seatId}));await wait(()=>a.messages.find(m=>m.code==='seat_occupied'));
  assert.equal(world.occupied.get(seated.seatId),seated.id);
 }finally{a?.ws.terminate();b?.ws.terminate();await world.close()}
});

test('wishes reach connected visitors, validate content and limit repeated sends',async()=>{
 const world=createWorldServer({port:0,origins:[origin]}),port=await world.ready;let a,b;
 try{
  a=await peer('ws://127.0.0.1:'+port+'/world');b=await peer('ws://127.0.0.1:'+port+'/world');
  a.ws.send(JSON.stringify({type:'wish',text:'가족 모두 건강하기',requestId:'wish-test'}));
  const wish=await wait(()=>b.messages.find(m=>m.type==='wish'));assert.equal(wish.text,'가족 모두 건강하기');assert.equal(wish.requestId,'wish-test');
  await wait(()=>a.messages.find(m=>m.type==='wish'));
  a.ws.send(JSON.stringify({type:'wish',text:'   '}));await wait(()=>a.messages.find(m=>m.code==='wish_length'));
  a.ws.send(JSON.stringify({type:'wish',text:'x'.repeat(201)}));
  for(let n=0;n<3;n++)a.ws.send(JSON.stringify({type:'wish',text:'소원 '+n}));
  await wait(()=>a.messages.find(m=>m.code==='wish_rate'));
  assert.equal(a.messages.filter(m=>m.type==='wish').length,3);assert.equal(a.messages.filter(m=>m.type==='chat').length,0);
 }finally{a?.ws.terminate();b?.ws.terminate();await world.close()}
});

test('all clients receive the same automatic balloon and late arrivals see its current event',async()=>{
 const world=createWorldServer({port:0,origins:[origin]}),port=await world.ready;let a,b,c;
 try{
  a=await peer('ws://127.0.0.1:'+port+'/world');b=await peer('ws://127.0.0.1:'+port+'/world');
  const first=await wait(()=>a.messages.find(m=>m.type==='wish'&&m.source==='ambient'),900);
  const second=await wait(()=>b.messages.find(m=>m.eventId===first.eventId));assert.deepEqual(second,first);assert.ok(first.senderId.startsWith('ambient:'));assert.ok([first.x,first.z].every(Number.isFinite));
  c=await peer('ws://127.0.0.1:'+port+'/world');const replay=await wait(()=>c.messages.find(m=>m.type==='wish-sync'));
  assert.ok(Number.isFinite(replay.serverTime));assert.ok(replay.wishes.some(m=>m.eventId===first.eventId));
 }finally{a?.ws.terminate();b?.ws.terminate();c?.ws.terminate();await world.close()}
});
