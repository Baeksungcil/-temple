import {createHeartBalloons} from './heart-balloons.js';
export function setupWishes({scene,camera,character,canvas}){
 const balloons=createHeartBalloons({scene,camera,canvas});
 const $=s=>document.querySelector(s),open=$('#open-wish'),panel=$('#wish-panel'),field=$('#wish-input'),send=$('#wish-send'),status=$('#wish-status'),hint=$('#wish-sharing');
 let transport=()=>false,connected=false,pending=null,timeout=null;
 const errors={wish_rate:'잠시 기다려 주세요. 소원은 10초에 3개까지 보낼 수 있습니다.',wish_length:'소원을 1~200자로 적어 주세요.'};
 function close(){panel.hidden=true;open.setAttribute('aria-expanded','false');field.blur();open.focus({preventScroll:true});}
 function show(){
  panel.hidden=false;open.setAttribute('aria-expanded','true');
  $('#chat-close').click();status.textContent='';field.focus({preventScroll:true});
 }
 function finish(){clearTimeout(timeout);pending=null;send.disabled=false;}
 open.addEventListener('click',()=>panel.hidden?show():close());$('#wish-close').addEventListener('click',close);
 $('#open-chat').addEventListener('click',()=>{panel.hidden=true;open.setAttribute('aria-expanded','false');});
 panel.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();close();}});
 $('#wish-form').addEventListener('submit',e=>{
  e.preventDefault();if(pending)return;
  const text=field.value.trim();if(!text||[...text].length>200){status.textContent=errors.wish_length;field.focus();return;}
  if(!connected){const position=character.getSnapshot();balloons.receive({text,x:position.x,z:position.z,eventId:crypto.randomUUID(),source:'visitor'});field.value='';close();$('#wish-announcement').textContent='소원이 하늘로 올라갑니다.';return;}
  pending=crypto.randomUUID();send.disabled=true;status.textContent='소원을 보내고 있습니다…';
  if(!transport({type:'wish',text,requestId:pending})){finish();status.textContent='연결을 확인한 뒤 다시 보내 주세요.';return;}
  timeout=setTimeout(()=>{finish();status.textContent='응답이 늦어지고 있습니다. 잠시 후 다시 보내 주세요.';},8000);
 });
 return {
  update:balloons.update,
  setTransport:fn=>{transport=fn;},
  setConnected:value=>{
   if(connected===value)return;connected=value;
   hint.textContent=connected?'지금 접속한 방문객에게 소원이 함께 보입니다. 내용은 저장하지 않습니다.':'지금은 이 화면에서만 소원이 올라갑니다.';
   if(!connected&&pending){finish();status.textContent='연결이 끊겼습니다. 작성한 소원은 그대로 남아 있습니다.';}
  },
  receive:message=>{
   balloons.receive(message);
   if(pending&&message.requestId===pending){finish();field.value='';close();$('#wish-announcement').textContent='소원이 하늘로 올라갑니다.';}
  },
  reject:code=>{finish();status.textContent=errors[code]||'소원을 보내지 못했습니다. 다시 시도해 주세요.';}
 };
}
