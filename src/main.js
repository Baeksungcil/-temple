import {setupBottomMenu} from './bottom-menu.js';
import {createBlessing} from './blessing.js';
import {setupWishes} from './wishes.js';
import {createSnow} from './snow.js';
import {createConfession} from './confession.js';
import {expandArchitecture,WORLD_SCALE} from './world-scale.js';
import {createWindowAtmosphere} from './window-atmosphere.js';
import {createStageCharacters} from './stage-characters.js';
import {updateStainedLight} from './stained-glass.js';
import {setupMobileKeyboard} from './mobile-keyboard.js';
import {decorateChristmas} from './christmas.js';
import {createInteriorLighting} from './interior-lighting.js';
import {setupMedia} from './media.js';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {seoulHour,daylight,validGtm,safeRead} from './state.js';
import './style.css';
import {createCathedral} from './cathedral.js';
import {createCharacterController} from './character.js';
import {createCampus,upgradeInterior,batchArchitecture} from './campus.js';
import {setupLighting} from './lighting.js';
import {createMultiplayer} from './multiplayer.js';
const $=s=>document.querySelector(s), canvas=$('#scene');
function fail(message){$('#status').hidden=true;$('#error').hidden=false;$('#error-text').textContent=message;}
try {
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true}); renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;
const scene=new THREE.Scene();scene.background=new THREE.Color('#30291f');scene.fog=new THREE.Fog('#30291f',80,170);
const camera=new THREE.PerspectiveCamera(38,1,.1,240);camera.position.set(0,3.3,19);
const controls=new OrbitControls(camera,canvas);controls.target.set(0,7,-21);controls.enableDamping=true;controls.minDistance=2;controls.maxDistance=55;controls.maxPolarAngle=Math.PI*.65;
const hemi=new THREE.HemisphereLight(0xb9d5fa,0x4f3422,.22);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffe1b1,3);sun.position.set(4,21,-12);sun.castShadow=false;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-16,right:16,top:16,bottom:-16});sun.shadow.normalBias=.03;scene.add(sun);
const {lamps}=createCathedral(scene);upgradeInterior(scene);createCampus(scene);batchArchitecture(scene);setupLighting(renderer,scene);
const interiorLight=createInteriorLighting(scene,renderer);
const christmas=decorateChristmas(scene);
const atmosphere=createWindowAtmosphere(scene);expandArchitecture(scene);const stageCharacters=createStageCharacters(scene);const snow=createSnow(scene);
canvas.dataset.naveAreaScale='3';
const character=createCharacterController({scene,camera,controls,canvas});
const wishes=setupWishes({scene,camera,character,canvas});
const multiplayer=createMultiplayer({scene,character,canvas,wishes});
const media=setupMedia({scene,camera,renderer,controls,character,canvas});
const confession=createConfession({scene,camera,character,canvas});
const blessing=createBlessing({scene,character,canvas,camera,controls,getPeople:multiplayer.getPeople});
setupMobileKeyboard();setupBottomMenu();
$('#home').onclick=()=>character.cameraHome();


$('#nav-sit').onclick=()=>$('#sit').click();$('#nav-pray').onclick=()=>$('#pray').click();
$('#chat-panel').classList.add('collapsed');
$('#reset').onclick=()=>character.cameraHome();
function resize(){const {width:w,height:h}=document.querySelector("#app").getBoundingClientRect();renderer.setSize(w,h,false);media.resize(w,h);camera.aspect=w/h;camera.fov=w<700?62:55;camera.updateProjectionMatrix();}window.addEventListener('resize',resize);new ResizeObserver(resize).observe(document.querySelector('#app'));screen.orientation?.addEventListener('change',()=>requestAnimationFrame(resize));resize();
let prev=performance.now(),lastLight=0,lastRender=0;const forward=new THREE.Vector3(),right=new THREE.Vector3(),delta=new THREE.Vector3();
function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-prev)/1000,.12);if(document.hidden||now-lastRender<33)return;prev=now;lastRender=now;
if(now-lastLight>1000){lastLight=now;const mode=$('#time').value,h=mode==='live'?seoulHour():({day:12,sunset:18,night:23})[mode],d=daylight(h);document.body.classList.toggle('night',d<.25);hemi.intensity=.055+.075*d;sun.intensity=.06+.12*d;interiorLight.update(d);updateStainedLight(d);atmosphere.setDaylight(d);sun.color.set(h>16&&h<20?'#ffc080':'#ffe8c4');const sky=new THREE.Color('#211e29').lerp(new THREE.Color('#b49c7a'),d);scene.background.copy(sky);scene.fog.color.copy(sky);lamps.forEach(l=>l.intensity=1.4*(25+25*(1-d)));$('#clock').textContent=new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date())+' KST';}
christmas.update(now/1000);atmosphere.update(now/1000);stageCharacters.update(now/1000);snow.update(dt);character.update(dt);blessing.update(dt);multiplayer.update(dt);controls.update();confession.update(dt);wishes.update();renderer.render(scene,camera);media.render();canvas.dataset.drawCalls=String(renderer.info.render.calls);}
renderer.render(scene,camera);$('#status').hidden=true;requestAnimationFrame(frame);canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fail('그래픽 연결이 끊겼습니다. 페이지를 다시 열어 주세요.');});
}catch(e){fail('WebGL 2를 지원하는 최신 브라우저와 하드웨어 가속을 확인해 주세요. '+e.message);}
// Basic consent: no GTM request before affirmative consent.
const gtm=import.meta.env.VITE_GTM_ID?.trim();window.dataLayer=window.dataLayer||[];function gtag(){window.dataLayer.push(arguments);}const consent=(state)=>gtag('consent',state,{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});consent('default');let loaded=false;
function loadAnalytics(){if(!validGtm(gtm)||loaded)return;loaded=true;gtag('consent','update',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});window.dataLayer.push({'gtm.start':Date.now(),event:'gtm.js'});const s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtm.js?id='+encodeURIComponent(gtm);document.head.append(s);}
let choice;try{choice=safeRead(localStorage);}catch{choice=null;}if(choice==='accepted')loadAnalytics();else if(!choice&&validGtm(gtm))$('#consent').hidden=false;
function choose(value){try{localStorage.setItem('temple-consent-v1',value);}catch{}$('#consent').hidden=true;if(value==='accepted')loadAnalytics();else{consent('update');if(loaded)location.reload();}}
$('#accept').onclick=()=>choose('accepted');$('#reject').onclick=()=>choose('denied');$('#privacy').onclick=()=>{$('#consent').hidden=false;$('#consent p').textContent=validGtm(gtm)?'분석 허용은 언제든 철회할 수 있습니다. 광고 저장은 허용하지 않습니다.':'현재 GTM ID가 없어 분석 태그는 비활성화되어 있습니다.';};
let installEvent;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvent=e;$('#install').hidden=false;});$('#install').onclick=async()=>{if(installEvent){await installEvent.prompt();installEvent=null;$('#install').hidden=true;}};
// Apply newly installed offline versions after existing tabs close; no update popup/button.
if('serviceWorker'in navigator&&import.meta.env.PROD){navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'}).catch(()=>console.warn('오프라인 저장을 사용할 수 없습니다.'));}
