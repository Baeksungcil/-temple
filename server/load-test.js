import {WebSocket} from 'ws';
import {createWorldServer} from './index.js';
import {monitorEventLoopDelay} from 'node:perf_hooks';
import fs from 'node:fs/promises';
const origin='http://127.0.0.1:5182',world=createWorldServer({port:0,origins:[origin]});const port=await world.ready,url='ws://127.0.0.1:'+port+'/world';
const clients=[],pending=new Map(),latencies=[],chatSeen=new Set();let seq=0,snapshots=0;const eventLoop=monitorEventLoopDelay({resolution:10});eventLoop.enable();let interval;
try{
 await Promise.all(Array.from({length:100},(_,index)=>new Promise((resolve,reject)=>{const ws=new WebSocket(url,{origin});const client={ws,state:null,index};clients.push(client);ws.on('error',reject);ws.on('message',raw=>{const m=JSON.parse(raw);if(m.type==='welcome'){client.state=m.state;resolve();}if(m.type==='self'&&pending.has(m.seq)){latencies.push(performance.now()-pending.get(m.seq));pending.delete(m.seq);}if(m.type==='snapshot')snapshots++;if(m.type==='chat'&&m.text==='100-client delivery check')chatSeen.add(index);});})));
 if(world.players.size!==100)throw Error('Expected 100 connections');
 const capacityStatus=await new Promise(resolve=>{const extra=new WebSocket(url,{origin});extra.on('error',()=>{});extra.on('unexpected-response',(req,res)=>{resolve(res.statusCode);req.destroy();});extra.on('open',()=>{extra.close();resolve(101);});});
 if(capacityStatus!==503)throw Error('101st connection not rejected');
 const started=performance.now();interval=setInterval(()=>{const seconds=(performance.now()-started)/1000;for(const c of clients){const n=++seq;pending.set(n,performance.now());c.ws.send(JSON.stringify({type:'move',x:c.state.x+Math.sin(seconds)*.2,z:21-seconds*.8,yaw:0,seq:n}));}},100);
 clients[0].ws.send(JSON.stringify({type:'chat',text:'100-client delivery check'}));
 await new Promise(r=>setTimeout(r,12000));clearInterval(interval);
 if(chatSeen.size!==100)throw Error('Chat not delivered to all peers');
 if(latencies.length<8000)throw Error('Insufficient move acknowledgments');
 latencies.sort((a,b)=>a-b);eventLoop.disable();
 const result={pass:true,scope:'Local single-process CPU/network simulation; includes 100 Node clients, not 100 browser GPUs.',connections:100,durationSeconds:12,capacity101Status:capacityStatus,chatRecipients:chatSeen.size,moveAcknowledgments:latencies.length,snapshots,roundTripP50Ms:+latencies[Math.floor(latencies.length*.5)].toFixed(2),roundTripP95Ms:+latencies[Math.floor(latencies.length*.95)].toFixed(2),eventLoopP95Ms:+(eventLoop.percentile(95)/1e6).toFixed(2),combinedServerAndClientsRssMB:+(process.memoryUsage().rss/1048576).toFixed(1),serverMetrics:world.metrics};
 await fs.writeFile('server/load-result.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{clearInterval(interval);eventLoop.disable();for(const c of clients)c.ws.terminate();await world.close();}
