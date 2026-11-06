import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {seoulHour,daylight,validGtm,safeRead} from './state.js';
import './style.css';
const $=s=>document.querySelector(s), canvas=$('#scene');
function fail(message){$('#status').hidden=true;$('#error').hidden=false;$('#error-text').textContent=message;}
try {
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false}); renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;
const scene=new THREE.Scene();scene.background=new THREE.Color('#e6eadb');scene.fog=new THREE.Fog('#e6eadb',30,90);
const camera=new THREE.PerspectiveCamera(38,1,.1,150);camera.position.set(17,12,22);
const controls=new OrbitControls(camera,canvas);controls.target.set(0,2,0);controls.enableDamping=true;controls.minDistance=7;controls.maxDistance=38;controls.maxPolarAngle=Math.PI*.48;
const hemi=new THREE.HemisphereLight(0xffffff,0x616c49,2.5);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffe1b1,3);sun.position.set(8,16,8);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-16,right:16,top:16,bottom:-16});sun.shadow.normalBias=.03;scene.add(sun);
const mat=(color)=>new THREE.MeshToonMaterial({color});const stone=mat('#ccbe9d'),wood=mat('#af5f46'),wall=mat('#f4dfaf'),roof=mat('#365b54'),trim=mat('#d4aa60'),grass=mat('#819b6c');
function box(w,h,d,m,x,y,z,parent=scene){const a=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);a.position.set(x,y,z);a.castShadow=true;a.receiveShadow=true;parent.add(a);return a;}
function sphere(r,m,x,y,z,parent=scene){const a=new THREE.Mesh(new THREE.IcosahedronGeometry(r,2),m);a.position.set(x,y,z);a.castShadow=true;parent.add(a);return a;}
box(34,.6,30,grass,0,-.5,0);box(17,.12,17,mat('#d8d0b5'),0,-.12,1);
box(10,.65,7,stone,0,.3,0);box(10.5,.18,7.5,stone,0,.7,0);
for(let i=0;i<3;i++)box(3,.22,1.2,stone,0,.12+i*.2,4.6-i*.65);
box(8.8,3,5.7,wall,0,2.3,0);
for(const x of [-4.4,-2.2,0,2.2,4.4])for(const z of [-2.9,2.9]){box(.28,3.3,.28,wood,x,2.4,z);box(.6,.2,.6,trim,x,3.85,z);}
for(const x of [-3.3,-1.1,1.1,3.3]){box(1.85,2.5,.12,wood,x,2.15,2.91);box(1.6,2.2,.1,mat('#e6cea2'),x,2.15,3.01);for(let j=0;j<5;j++)box(.045,2.2,.06,wood,x-.65+j*.325,2.15,3.09);for(let j=0;j<5;j++)box(1.6,.045,.06,wood,x,1.15+j*.5,3.09);}
box(9.4,.3,6.3,wood,0,3.9,0);
// Curved roof surfaces with lifted eaves, built as connected strips.
for(const side of [-1,1]){const segments=20, positions=[],indices=[];for(let i=0;i<=segments;i++){const t=i/segments,z=side*t*4.1,y=5.7-1.65*t+.6*Math.pow(t,5);positions.push(-5.7,y,z,5.7,y,z);}for(let i=0;i<segments;i++){let a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();const m=roof.clone();m.side=THREE.DoubleSide;const mesh=new THREE.Mesh(g,m);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);
for(let x=-5.6;x<=5.7;x+=.32){const pts=[];for(let i=0;i<=20;i++){let t=i/20;pts.push(new THREE.Vector3(x,5.74-1.65*t+.6*t**5,side*t*4.1));}const ridge=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),20,.045,4,false),trim);scene.add(ridge);}}
box(11.7,.17,.23,roof,0,5.76,0);box(2.4,.65,.16,roof,0,3.8,3.35);
for(let i=0;i<9;i++)box(2,.035,.65,stone,0,0,7+i*.95);
const leaves=[mat('#66845a'),mat('#92a778'),mat('#b7bf8b')];for(const [x,z,s] of [[-9,-4,1.4],[9,-5,1.2],[-11,6,.9],[11,7,1]]){box(.5,3*s,.5,wood,x,1.5*s,z);for(let j=0;j<3;j++)sphere(1.6*s,leaves[j],x+(j-1)*.7*s,3*s+j*.7*s,z+(j%2)*.5);}
const lamps=[];for(const x of [-6.5,6.5]){box(.7,.3,.7,stone,x,.15,4);box(.22,1.6,.22,wood,x,1,4);const glow=new THREE.MeshStandardMaterial({color:'#ffdb88',emissive:'#ffaf42',emissiveIntensity:1});box(.7,.85,.7,glow,x,2,4);box(1,.15,1,roof,x,2.5,4);const light=new THREE.PointLight(0xffc06b,0,9,2);light.position.set(x,2.2,4.4);scene.add(light);lamps.push(light);}
const keys=new Set();const keymap={w:'forward',ArrowUp:'forward',s:'back',ArrowDown:'back',a:'left',ArrowLeft:'left',d:'right',ArrowRight:'right'};
canvas.addEventListener('keydown',e=>{if(keymap[e.key]){e.preventDefault();keys.add(keymap[e.key]);}});window.addEventListener('keyup',e=>keys.delete(keymap[e.key]));window.addEventListener('blur',()=>keys.clear());canvas.addEventListener('blur',()=>keys.clear());
document.querySelectorAll('[data-move]').forEach(b=>{b.addEventListener('pointerdown',e=>{b.setPointerCapture(e.pointerId);keys.add(b.dataset.move);});for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,()=>keys.delete(b.dataset.move));});
$('#reset').onclick=()=>{camera.position.set(17,12,22);controls.target.set(0,2,0);controls.update();};
function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.fov=w<700?58:38;camera.updateProjectionMatrix();}window.addEventListener('resize',resize);resize();
let prev=performance.now(),lastLight=0,lastRender=0;const forward=new THREE.Vector3(),right=new THREE.Vector3(),delta=new THREE.Vector3();
function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-prev)/1000,.05);if(document.hidden||now-lastRender<33)return;prev=now;lastRender=now;
if(now-lastLight>1000){lastLight=now;const mode=$('#time').value,h=mode==='live'?seoulHour():({day:12,sunset:18,night:23})[mode],d=daylight(h);document.body.classList.toggle('night',d<.25);hemi.intensity=.35+2*d;sun.intensity=.15+3*d;sun.color.set(h>16&&h<20?'#ffc080':'#ffe8c4');const sky=new THREE.Color('#182a40').lerp(new THREE.Color('#e6eadb'),d);scene.background.copy(sky);scene.fog.color.copy(sky);lamps.forEach(l=>l.intensity=18*(1-d));$('#clock').textContent=new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date())+' KST';}
camera.getWorldDirection(forward);forward.y=0;forward.normalize();right.crossVectors(forward,camera.up).normalize();delta.set(0,0,0);if(keys.has('forward'))delta.add(forward);if(keys.has('back'))delta.sub(forward);if(keys.has('left'))delta.sub(right);if(keys.has('right'))delta.add(right);if(delta.lengthSq()){delta.normalize().multiplyScalar(dt*5);const target=controls.target.clone().add(delta);target.x=THREE.MathUtils.clamp(target.x,-12,12);target.z=THREE.MathUtils.clamp(target.z,-12,12);delta.copy(target).sub(controls.target);camera.position.add(delta);controls.target.copy(target);}controls.update();renderer.render(scene,camera);}
renderer.render(scene,camera);$('#status').hidden=true;requestAnimationFrame(frame);canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fail('그래픽 연결이 끊겼습니다. 페이지를 다시 열어 주세요.');});
}catch(e){fail('WebGL 2를 지원하는 최신 브라우저와 하드웨어 가속을 확인해 주세요. '+e.message);}
// Basic consent: no GTM request before affirmative consent.
const gtm=import.meta.env.VITE_GTM_ID?.trim();window.dataLayer=window.dataLayer||[];function gtag(){window.dataLayer.push(arguments);}const consent=(state)=>gtag('consent',state,{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});consent('default');let loaded=false;
function loadAnalytics(){if(!validGtm(gtm)||loaded)return;loaded=true;gtag('consent','update',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});window.dataLayer.push({'gtm.start':Date.now(),event:'gtm.js'});const s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtm.js?id='+encodeURIComponent(gtm);document.head.append(s);}
let choice;try{choice=safeRead(localStorage);}catch{choice=null;}if(choice==='accepted')loadAnalytics();else if(!choice&&validGtm(gtm))$('#consent').hidden=false;
function choose(value){try{localStorage.setItem('temple-consent-v1',value);}catch{}$('#consent').hidden=true;if(value==='accepted')loadAnalytics();else{consent('update');if(loaded)location.reload();}}
$('#accept').onclick=()=>choose('accepted');$('#reject').onclick=()=>choose('denied');$('#privacy').onclick=()=>{$('#consent').hidden=false;$('#consent p').textContent=validGtm(gtm)?'분석 허용은 언제든 철회할 수 있습니다. 광고 저장은 허용하지 않습니다.':'현재 GTM ID가 없어 분석 태그는 비활성화되어 있습니다.';};
let installEvent;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvent=e;$('#install').hidden=false;});$('#install').onclick=async()=>{if(installEvent){await installEvent.prompt();installEvent=null;$('#install').hidden=true;}};
if('serviceWorker'in navigator&&import.meta.env.PROD){navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'}).then(reg=>{const offer=()=>{if(reg.waiting&&navigator.serviceWorker.controller){$('#update').hidden=false;$('#update').onclick=()=>reg.waiting?.postMessage('SKIP_WAITING');}};offer();reg.addEventListener('updatefound',()=>reg.installing?.addEventListener('statechange',offer));}).catch(()=>{console.warn('오프라인 저장을 사용할 수 없습니다.');});let reloading=false;const controlled=!!navigator.serviceWorker.controller;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(controlled&&!reloading){reloading=true;location.reload();}});}




