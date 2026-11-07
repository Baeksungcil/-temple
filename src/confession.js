import * as THREE from 'three';
import {WORLD_SCALE as S} from './world-scale.js';
export const CONFESSION_POINT=Object.freeze({x:34*S,z:-9*S});
export const nearConfession=p=>Math.hypot(p.x-CONFESSION_POINT.x,p.z-CONFESSION_POINT.z)<3.6;

export function createConfession({scene,camera,character,canvas}){
 const wood=new THREE.MeshStandardMaterial({color:'#493326',roughness:.95}),velvet=new THREE.MeshStandardMaterial({color:'#653442',roughness:1}),gold=new THREE.MeshStandardMaterial({color:'#c2a168',roughness:.8});
 const booth=new THREE.Group();booth.name='confession booth';scene.add(booth);
 const x=CONFESSION_POINT.x,z=CONFESSION_POINT.z;
 function box(w,h,d,mat,px,py,pz){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(px,py,pz);m.userData.noNavigation=true;booth.add(m);return m;}
 box(5*S,3.8,.22,wood,x,1.9,z-2.2*S);
 for(const side of [-1,1])box(.22,3.8,2.6*S,wood,x+side*2.4*S,1.9,z-1.1*S);
 box(5*S,.22,2.6*S,wood,x,3.85,z-1.1*S);
 for(const side of [-1,1])box(1.7*S,2.8,.12,velvet,x+side*1.55*S,1.5,z-.15*S);
 box(1.2*S,.28,.65*S,wood,x,.25,z-.8*S);
 for(let i=-3;i<=3;i++)box(.035,1.2,.1,gold,x+i*.14*S,2,z-2.02*S);
 const light=new THREE.PointLight('#ffcf88',35,8);light.position.set(x,2.8,z-.8*S);booth.add(light);
 const app=document.querySelector('#app'),open=document.createElement('button');open.id='confession-open';open.textContent='고해성사';open.hidden=true;app.append(open);
 const panel=document.createElement('section');panel.id='confession-panel';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','confession-title');
 panel.innerHTML='<div class="chat-heading"><b id="confession-title">고해성사</b><button id="confession-close" type="button" aria-label="고해성사 창 닫기">×</button></div><p>마음에 담긴 이야기를 적어 보세요.</p><form id="confession-form"><label class="sr-only" for="confession-input">고해성사 내용</label><textarea id="confession-input" rows="4" maxlength="300" placeholder="이곳에 마음을 적어 주세요" inputmode="text" enterkeyhint="enter"></textarea><button type="submit">보내기</button></form><small>이 화면에서만 나타나며 서버에 전송하거나 저장하지 않습니다.</small>';
 app.append(panel);const field=panel.querySelector('textarea');
 const bubbles=document.createElement('div');bubbles.id='confession-bubbles';bubbles.setAttribute('aria-live','polite');app.append(bubbles);
 let active=false;const floating=[];
 function close(){active=false;panel.hidden=true;field.blur();character.setViewingVideo(false);open.focus({preventScroll:true});}
 open.onclick=()=>{if(!nearConfession(character.getSnapshot()))return;active=true;panel.hidden=false;document.querySelector('#chat-panel').classList.add('collapsed');character.setViewingVideo(true);field.focus();};
 panel.querySelector('#confession-close').onclick=close;panel.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
 panel.querySelector('form').onsubmit=e=>{e.preventDefault();const text=field.value.trim();if(!text)return;const bubble=document.createElement('p');bubble.className='confession-bubble';bubble.textContent=text;bubbles.append(bubble);const p=character.getSnapshot();floating.push({element:bubble,point:new THREE.Vector3(p.x,2.8,p.z),elapsed:0});while(floating.length>3)floating.shift().element.remove();field.value='';close();};
 const projected=new THREE.Vector3();
 return{update(dt){const nearby=nearConfession(character.getSnapshot());open.hidden=!nearby||active||app.classList.contains('video-view');if(active&&!nearby)close();for(let i=floating.length-1;i>=0;i--){const b=floating[i];b.elapsed+=dt;if(b.elapsed>=8){b.element.remove();floating.splice(i,1);continue;}projected.copy(b.point);projected.y+=b.elapsed*.8;projected.project(camera);b.element.hidden=projected.z>1;const rect=canvas.getBoundingClientRect();b.element.style.left=(projected.x*.5+.5)*rect.width+'px';b.element.style.top=(-projected.y*.5+.5)*rect.height+'px';b.element.style.opacity=String(Math.min(1,(8-b.elapsed)/2));}canvas.dataset.confessionNearby=String(nearby);canvas.dataset.confessionBubbles=String(floating.length);}};
}
