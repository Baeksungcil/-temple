import {WORLD_SCALE as S} from '../src/world-scale.js';
import http from 'node:http';
import {createWishEvents} from './wish-events.js';
import {createAmbientSimulation} from '../src/ambient-simulation.js';
import {randomBytes} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {WebSocketServer,WebSocket} from 'ws';
import {walkable,moveWithCollision,roomAt,SEATS,SEAT_INTERACTION_DISTANCE} from '../src/navigation.js';
export function createWorldServer({port=8790,host='127.0.0.1',origins=['http://127.0.0.1:5182','http://localhost:5182'],maxPlayers=100}={}){
 const players=new Map(),occupied=new Map(),names={},metrics={connections:0,rejected:0,moves:0,chats:0,bytesSent:0,ticks:0,maxTickMs:0},started=Date.now();
 const ambient=createAmbientSimulation({occupied,players});
 const wishes=createWishEvents();
 const server=http.createServer((req,res)=>{if(req.url!=='/health'){res.writeHead(404).end();return;}res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify({status:'ok',ambientVisitors:ambient.people.length,players:players.size,capacity:maxPlayers,rooms:Object.fromEntries(['nave','prayer','fellowship','corridor'].map(room=>[room,[...players.values()].filter(p=>p.room===room).length])),uptimeSeconds:Math.round((Date.now()-started)/1000)}));});
 const wss=new WebSocketServer({noServer:true,maxPayload:4096,perMessageDeflate:false});
 function send(ws,data){if(ws.readyState!==WebSocket.OPEN)return;if(ws.bufferedAmount>262144){ws.close(1013,'Slow connection');return;}const text=typeof data==='string'?data:JSON.stringify(data);metrics.bytesSent+=Buffer.byteLength(text);ws.send(text);}
 function broadcast(data){const text=JSON.stringify(data);for(const p of players.values())send(p.ws,text);}
 const publicState=p=>({id:p.id,x:p.x,z:p.z,yaw:p.yaw,seated:p.seated,praying:p.praying,seatId:p.seatId,moving:p.moving});
 function fail(p,code){send(p.ws,{type:'error',code});send(p.ws,{type:'self',state:publicState(p)});}
 server.on('upgrade',(req,socket,head)=>{if(req.url!=='/world'||!origins.includes(req.headers.origin)){socket.end('HTTP/1.1 403 Forbidden\r\n\r\n');return;}if(players.size>=maxPlayers){metrics.rejected++;socket.end('HTTP/1.1 503 Service Unavailable\r\nRetry-After: 10\r\n\r\n');return;}wss.handleUpgrade(req,socket,head,ws=>wss.emit('connection',ws,req));});
 wss.on('connection',ws=>{
  let id;do{id=randomBytes(4).toString('hex');}while(players.has(id));const p={id,ws,x:(players.size%5-2)*1.1*S,z:(22-Math.floor(players.size/5)*1.2)*S,yaw:0,seated:false,praying:false,seatId:null,moving:false,room:'nave',lastMove:performance.now(),window:Date.now(),packets:0,chatTimes:[],wishTimes:[],alive:true};players.set(id,p);names[id]='방문객 '+id.slice(0,4);metrics.connections++;
  send(ws,{type:'welcome',id,capacity:maxPlayers,names,state:publicState(p)});send(ws,{type:'ambient',people:ambient.snapshot(),occupied:[...occupied.keys()]});send(ws,{type:'wish-sync',serverTime:Date.now(),wishes:wishes.getActive()});broadcast({type:'names',names:{[id]:names[id]}});
  ws.on('pong',()=>p.alive=true);ws.on('error',()=>{});
  ws.on('message',raw=>{
   const now=Date.now();if(now-p.window>1000){p.window=now;p.packets=0;}if(++p.packets>40){ws.close(1008,'Rate limit');return;}
   let m;try{m=JSON.parse(raw.toString());}catch{fail(p,'invalid_json');return;}if(!m||typeof m!=='object')return;
   if(m.type==='move'){
    if(![m.x,m.z,m.yaw].every(Number.isFinite)){fail(p,'invalid_move');return;}
    const dt=Math.min(.5,Math.max(.02,(performance.now()-p.lastMove)/1000));p.lastMove=performance.now();
    if(!p.seated&&!p.praying){let dx=m.x-p.x,dz=m.z-p.z,len=Math.hypot(dx,dz),max=4.2*dt+.08;if(len>max){dx*=max/len;dz*=max/len;}const next=moveWithCollision(p,dx,dz);p.moving=Math.hypot(next.x-p.x,next.z-p.z)>.005;p.x=next.x;p.z=next.z;p.yaw=Math.atan2(Math.sin(m.yaw),Math.cos(m.yaw));p.room=roomAt(p.x,p.z);metrics.moves++;}
    send(ws,{type:'self',state:publicState(p),seq:Number.isInteger(m.seq)?m.seq:null});return;
   }
   if(m.type==='sit'){
    const seat=SEATS.find(s=>s.id===m.seatId);if(p.seated||!seat||Math.hypot(p.x-seat.x,p.z-seat.z)>SEAT_INTERACTION_DISTANCE+.15){fail(p,'seat_too_far');return;}if(occupied.has(seat.id)){fail(p,'seat_occupied');return;}
    p.x=seat.x;p.z=seat.z;p.yaw=0;p.seated=true;p.praying=false;p.seatId=seat.id;p.moving=false;occupied.set(seat.id,id);p.room=roomAt(p.x,p.z);
   }else if(m.type==='stand'){
    if(p.seatId)occupied.delete(p.seatId);if(p.seated)p.z-=1.15*S;p.seated=false;p.praying=false;p.seatId=null;p.moving=false;
   }else if(m.type==='pray'){p.praying=!!m.value;p.moving=false;
   }else if(m.type==='rename'){
    const value=typeof m.name==='string'?m.name.normalize('NFKC').replace(/[\u0000-\u001f\u007f]/g,'').trim():'';if(!value||[...value].length>16){fail(p,'invalid_name');return;}names[id]=value;broadcast({type:'names',names:{[id]:value}});
   }else if(m.type==='wish'){
    const text=typeof m.text==='string'?m.text.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,'').trim():'';
    if(!text||[...text].length>200){fail(p,'wish_length');return;}
    p.wishTimes=p.wishTimes.filter(t=>now-t<10000);if(p.wishTimes.length>=3){fail(p,'wish_rate');return;}
    p.wishTimes.push(now);broadcast(wishes.publish({text,x:p.x,z:p.z,senderId:p.id,requestId:typeof m.requestId==='string'?m.requestId.slice(0,64):null}));return;
   }else if(m.type==='chat'){
    p.chatTimes=p.chatTimes.filter(t=>now-t<10000);if(p.chatTimes.length>=3){fail(p,'chat_rate');return;}const text=typeof m.text==='string'?m.text.replace(/[\u0000-\u001f\u007f]/g,' ').trim():'';if(!text||[...text].length>200){fail(p,'chat_length');return;}p.chatTimes.push(now);metrics.chats++;broadcast({type:'chat',id,name:names[id],text,time:now,room:p.room});return;
   }else return;
   send(ws,{type:'self',state:publicState(p)});
  });
  ws.on('close',()=>{if(p.seatId)occupied.delete(p.seatId);players.delete(id);delete names[id];broadcast({type:'leave',id});});
 });
 let lastAmbient=performance.now();
 const tick=setInterval(()=>{const start=performance.now();ambient.update((start-lastAmbient)/1000);lastAmbient=start;const automaticWish=wishes.automatic(ambient.people,players.size>0);if(automaticWish)broadcast(automaticWish);broadcast({type:'ambient',people:ambient.snapshot(),occupied:[...occupied.keys()]});for(const p of players.values())if(performance.now()-p.lastMove>350)p.moving=false;const counts={};for(const room of ['nave','prayer','fellowship','corridor'])counts[room]=[...players.values()].filter(p=>p.room===room).length;
  for(const room of Object.keys(counts)){if(!counts[room])continue;const states=[...players.values()].filter(p=>p.room===room).map(p=>[p.id,Math.round(p.x*100)/100,Math.round(p.z*100)/100,Math.round(p.yaw*100)/100,(p.seated?1:0)|(p.praying?2:0)|(p.moving?4:0)]);const msg=JSON.stringify({type:'snapshot',room,count:players.size,rooms:counts,players:states});for(const p of players.values())if(p.room===room)send(p.ws,msg);}
  metrics.ticks++;metrics.maxTickMs=Math.max(metrics.maxTickMs,performance.now()-start);
 },100);tick.unref();
 const heartbeat=setInterval(()=>{for(const p of players.values()){if(!p.alive){p.ws.terminate();continue;}p.alive=false;p.ws.ping();}},30000);heartbeat.unref();
 const ready=new Promise(resolve=>server.listen(port,host,()=>resolve(server.address().port)));
 async function close(){clearInterval(tick);clearInterval(heartbeat);for(const p of players.values())p.ws.terminate();await new Promise(r=>wss.close(r));await new Promise(r=>server.close(r));}
 return {ready,close,players,metrics,server,occupied,ambient,wishes};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const origins=(process.env.ALLOWED_ORIGINS||'http://127.0.0.1:5182,http://localhost:5182,http://127.0.0.1:5173,http://localhost:5173,http://127.0.0.1:4173,http://localhost:4173').split(',').map(s=>s.trim());
 const world=createWorldServer({port:Number(process.env.PORT||8790),host:process.env.HOST||'127.0.0.1',origins});world.ready.then(port=>console.log('Temple world listening on '+port+'; capacity 100'));
 for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>world.close().then(()=>process.exit(0)));
}
