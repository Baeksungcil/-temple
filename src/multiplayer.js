import * as THREE from 'three';
import {createAmbientVisitors} from './ambient-visitors.js';
import {createVisitor,poseVisitor} from './character.js';
import {roomAt,ROOMS} from './navigation.js';
export function createMultiplayer({scene,character,canvas,wishes}){
 const status=document.querySelector('#online-status'),log=document.querySelector('#chat-log'),form=document.querySelector('#chat-form'),input=document.querySelector('#chat-input'),sendButton=document.querySelector('#chat-send'),nameForm=document.querySelector('#name-form'),nameInput=document.querySelector('#display-name');
 const local=['localhost','127.0.0.1'].includes(location.hostname),url=globalThis.TEMPLE_PREVIEW_WS||import.meta.env.VITE_WORLD_WS_URL||(local?'ws://127.0.0.1:8790/world':'');
 let socket,id=null,names={},connected=false,sequence=0,accumulator=0,retries=0,lastChatAt=0;const remotes=new Map(),pendingMoves=new Map();const ambient=createAmbientVisitors({scene,canvas});
 const protoScene=new THREE.Scene(),proto=createVisitor(protoScene),parts=[];proto.root.traverse(o=>{if(o.isMesh){const instances=new THREE.InstancedMesh(o.geometry,o.material,99);instances.count=0;instances.frustumCulled=false;instances.castShadow=false;scene.add(instances);parts.push({source:o,instances});}});
 function append(name,text,system=false){const item=document.createElement('p'),strong=document.createElement('strong'),body=document.createElement('span');strong.textContent=system?'안내':name;body.textContent=' '+text;item.append(strong,body);log.append(item);while(log.children.length>50)log.firstElementChild.remove();log.scrollTop=log.scrollHeight;if(!system){const feed=document.querySelector('#chat-feed'),bubble=document.createElement('p'),speaker=document.createElement('b'),textNode=document.createElement('span');speaker.textContent=name;textNode.textContent=text;bubble.append(speaker,textNode);feed.append(bubble);while(feed.children.length>4)feed.firstElementChild.remove();setTimeout(()=>{bubble.classList.add('fading');setTimeout(()=>bubble.remove(),600);},15000);}}
 function send(m){if(connected&&socket?.readyState===WebSocket.OPEN){socket.send(JSON.stringify(m));return true;}return false;}
 function connectionState(text){wishes?.setConnected(connected);status.textContent=text;sendButton.disabled=!connected;input.disabled=!connected;nameInput.disabled=!connected;document.querySelector('#name-save').disabled=!connected;canvas.dataset.online=String(connected);}
 const errorText={seat_occupied:'다른 방문객이 앉은 좌석입니다.',seat_too_far:'좌석 가까이에서 다시 선택해 주세요.',chat_rate:'메시지는 10초에 3개까지 보낼 수 있습니다.',chat_length:'메시지는 1~200자로 입력해 주세요.',invalid_name:'이름은 1~16자로 입력해 주세요.'};
 function connect(){
  if(!url){connectionState('혼자 보기 · 실시간 서버 미설정');append('', '현재는 혼자 둘러보는 모드입니다. 실시간 서버를 연결하면 대화할 수 있습니다.',true);return;}
  if(location.protocol==='https:'&&!url.startsWith('wss://')){connectionState('실시간 서버에 보안 연결(wss)이 필요합니다.');return;}
  connectionState('실시간 서버 연결 중…');socket=new WebSocket(url);
  socket.addEventListener('open',()=>{});
  socket.addEventListener('message',event=>{
   let m;try{m=JSON.parse(event.data);}catch{return;}
   if(m.type==='welcome'){connected=true;retries=0;id=m.id;names=m.names||{};character.applyAuthority(m.state,true);connectionState('접속 중 · 최대 '+m.capacity+'명');canvas.dataset.playerId=id;append('', '서버에 연결되었습니다. 대화는 현재 접속한 방문객에게 전달됩니다.',true);}
   else if(m.type==='ambient'){ambient.receive(m.people||[]);character.setOccupiedSeats(m.occupied||[]);}
   else if(m.type==='names')Object.assign(names,m.names);
   else if(m.type==='self'){if(Number.isInteger(m.seq)){const sent=pendingMoves.get(m.seq);pendingMoves.delete(m.seq);if(sent&&Math.hypot(m.state.x-sent.x,m.state.z-sent.z)>.3)character.correctBy(m.state.x-sent.x,m.state.z-sent.z);}else character.applyAuthority(m.state);}
   else if(m.type==='error'){if(m.code?.startsWith('wish_'))wishes?.reject(m.code);else append('',errorText[m.code]||'요청을 처리하지 못했습니다: '+m.code,true);}
   else if(m.type==='wish-sync'){for(const wish of m.wishes||[])wishes?.receive(wish);}
   else if(m.type==='wish')wishes?.receive(m);
   else if(m.type==='chat')append(m.name,m.text);
   else if(m.type==='leave'){remotes.delete(m.id);delete names[m.id];}
   else if(m.type==='snapshot'){
    connectionState('동시 접속 '+m.count+'/100명');canvas.dataset.population=String(m.count);const seen=new Set();
    for(const p of m.players){if(p[0]===id)continue;seen.add(p[0]);const previous=remotes.get(p[0]);if(previous){previous.tx=p[1];previous.tz=p[2];previous.yaw=p[3];previous.flags=p[4];}else remotes.set(p[0],{x:p[1],z:p[2],tx:p[1],tz:p[2],yaw:p[3],angle:p[3],flags:p[4],phase:0,sitBlend:0,prayBlend:0});}
    for(const key of remotes.keys())if(!seen.has(key))remotes.delete(key);
   }
  });
  socket.addEventListener('close',()=>{const wasConnected=connected;connected=false;id=null;remotes.clear();ambient.receive([]);character.setOccupiedSeats([]);connectionState('연결 끊김 · 혼자 보기');if(wasConnected)append('','서버 연결이 끊겼습니다. 재연결 전에는 대화를 보낼 수 없습니다.',true);if(retries++<5)setTimeout(connect,Math.min(30000,1500*2**retries));});
  socket.addEventListener('error',()=>{connectionState('서버 연결 확인 중 · 혼자 보기');});
 }
 character.onAction=send;wishes?.setTransport(send);
 form.addEventListener('submit',event=>{event.preventDefault();const text=input.value.trim();if(!text||[...text].length>200)return;if(Date.now()-lastChatAt<350)return;if(send({type:'chat',text})){lastChatAt=Date.now();input.value='';}});
 nameForm.addEventListener('submit',event=>{event.preventDefault();send({type:'rename',name:nameInput.value});});
 const panel=document.querySelector('#chat-panel'),open=document.querySelector('#open-chat'),close=document.querySelector('#chat-close');function showChat(value){panel.classList.toggle('collapsed',!value);open.setAttribute('aria-expanded',String(value));if(value&&!input.disabled)input.focus();}showChat(false);open.onclick=()=>showChat(panel.classList.contains('collapsed'));close.onclick=()=>showChat(false);panel.addEventListener('keydown',e=>{if(e.key==='Escape'){showChat(false);open.focus();}});
 function update(dt){
  ambient.update(dt);
  accumulator+=dt;if(accumulator>=.1){accumulator=0;const p=character.getSnapshot();const seq=++sequence;if(send({type:'move',x:p.x,z:p.z,yaw:p.yaw,seq})){pendingMoves.set(seq,{x:p.x,z:p.z});if(pendingMoves.size>200)pendingMoves.delete(pendingMoves.keys().next().value);}const room=roomAt(p.x,p.z);document.querySelector('#room-name').textContent=ROOMS.find(r=>r.id===room)?.name||'연결 통로';canvas.dataset.room=room;}
  let index=0;
  for(const r of remotes.values()){
   const k=1-Math.exp(-12*dt);r.x=THREE.MathUtils.lerp(r.x,r.tx,k);r.z=THREE.MathUtils.lerp(r.z,r.tz,k);r.angle+=Math.atan2(Math.sin(r.yaw-r.angle),Math.cos(r.yaw-r.angle))*k;r.sitBlend=THREE.MathUtils.lerp(r.sitBlend,(r.flags&1)?1:0,k);r.prayBlend=THREE.MathUtils.lerp(r.prayBlend,(r.flags&2)?1:0,k);r.phase+=dt*9;
   proto.root.position.set(r.x,0,r.z);poseVisitor(proto,{yaw:r.angle,sitBlend:r.sitBlend,prayBlend:r.prayBlend,walking:!!(r.flags&4),phase:r.phase,time:r.phase/9});proto.root.updateMatrixWorld(true);for(const part of parts)part.instances.setMatrixAt(index,part.source.matrixWorld);if(++index>=99)break;
  }
  for(const part of parts){part.instances.count=index;part.instances.instanceMatrix.needsUpdate=true;}canvas.dataset.remotePlayers=String(index);
 }
 connect();return{update};
}
