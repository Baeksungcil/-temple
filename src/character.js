import {planEmptySeat} from './seating.js';
import {setupTwoFingerZoom} from './touch-zoom.js';
import {WORLD_SCALE as S} from './world-scale.js';
import * as THREE from 'three';
import {nearestSeat,moveWithCollision,smoothstep,SEATS,findPath,walkable,roomAt,SEAT_INTERACTION_DISTANCE} from './navigation.js';
import {cameraPosition} from './camera-navigation.js';
export function createVisitor(scene,options={}){
 const root=new THREE.Group();root.name='visitor';root.position.set(0,0,21*S);root.scale.setScalar(.85);scene.add(root);
 const body=new THREE.Group();root.add(body);body.position.y=.8;
 const skin=new THREE.MeshToonMaterial({color:options.skin||'#f1c5a3'}),shirt=new THREE.MeshToonMaterial({color:options.shirt||'#d1846c'}),pants=new THREE.MeshToonMaterial({color:options.pants||'#527a9a'}),hair=new THREE.MeshToonMaterial({color:options.hair||'#543a29'}),shoe=new THREE.MeshToonMaterial({color:'#483f38'}),white=new THREE.MeshToonMaterial({color:'#fff4dd'});
 function sphere(parent,r,material,x,y,z,sx=1,sy=1,sz=1){const m=new THREE.Mesh(new THREE.SphereGeometry(r,14,10),material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=false;parent.add(m);return m;}
 function capsule(parent,r,length,material,y){const m=new THREE.Mesh(new THREE.CapsuleGeometry(r,length,4,10),material);m.position.y=y;m.castShadow=false;parent.add(m);return m;}
 sphere(body,.28,pants,0,0,0,1.2,.7,.8);capsule(body,.3,.2,shirt,.32);sphere(body,.25,pants,0,.33,-.17,1,.85,.35);for(const side of [-1,1]){capsule(body,.055,.35,pants,.55).position.set(side*.17,.55,-.285);sphere(body,.035,white,side*.17,.5,-.34);}
 const head=new THREE.Group();head.position.set(0,.91,-.025);head.scale.setScalar(1.1);body.add(head);sphere(head,.52,skin,0,0,0);sphere(head,.53,hair,0,.19,.05,1,.65,.95);
 sphere(head,.065,skin,-.51,0,0);sphere(head,.065,skin,.51,0,0);
 for(const x of [-.19,.19]){sphere(head,.075,white,x,.025,-.48,1,1,.4);sphere(head,.038,hair,x,.025,-.51,1,1,.5);}
 sphere(head,.065,skin,0,-.07,-.54,1,1,.7);sphere(head,.055,hair,0,-.22,-.48,1,.23,.3);
 const mouth=head.children.at(-1);for(const side of [-1,1])sphere(head,.075,new THREE.MeshToonMaterial({color:'#eba399'}),side*.32,-.12,-.43,1,.4,.2);
 const legs=[],arms=[];
 for(const side of [-1,1]){
  const hip=new THREE.Group();hip.position.set(side*.17,-.02,0);body.add(hip);capsule(hip,.115,.16,pants,-.15);
  const knee=new THREE.Group();knee.position.y=-.3;hip.add(knee);sphere(knee,.115,pants,0,0,0);capsule(knee,.1,.18,pants,-.19);sphere(knee,.13,shoe,0,-.36,-.08,1, .65,1.6);legs.push({hip,knee,side});
  const shoulder=new THREE.Group();shoulder.position.set(side*.34,.43,0);body.add(shoulder);capsule(shoulder,.105,.14,shirt,-.14);
  const elbow=new THREE.Group();elbow.position.y=-.27;shoulder.add(elbow);capsule(elbow,.075,.12,skin,-.13);sphere(elbow,.065,skin,0,-.26,0,1,1.4,.7);arms.push({shoulder,elbow,side});
 }
 const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=64;const ctx=shadowCanvas.getContext('2d'),fade=ctx.createRadialGradient(32,32,5,32,32,32);fade.addColorStop(0,'rgba(0,0,0,.3)');fade.addColorStop(.55,'rgba(0,0,0,.18)');fade.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=fade;ctx.fillRect(0,0,64,64);const shadowTexture=new THREE.CanvasTexture(shadowCanvas);
 const shadow=new THREE.Mesh(new THREE.PlaneGeometry(1.25,1.25),new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false,toneMapped:false}));shadow.name='static alpha disc shadow';shadow.rotation.x=-Math.PI/2;shadow.position.set(0,.07,0);shadow.castShadow=false;shadow.receiveShadow=false;shadow.userData.noNavigation=true;root.add(shadow);
 return {root,body,head,legs,arms,mouth};
}
export function poseVisitor(visitor,state){
  const t=Number.isFinite(state.time)?state.time:0,prayer=.5+.5*Math.sin(t*1.3);
  visitor.root.rotation.y=state.yaw;
  const bob=state.walking?Math.abs(Math.sin(state.phase))*.035:0;visitor.body.position.y=.8+state.sitBlend*.5+bob;visitor.body.position.z=-state.sitBlend*(.4*S+.02);
  visitor.head.rotation.x=-state.prayBlend*(.16+.07*prayer);visitor.head.rotation.z=state.prayBlend*.015*Math.sin(t*.9);visitor.body.rotation.x=-state.prayBlend*(.035+.018*prayer);
  for(const {hip,knee,side} of visitor.legs){hip.rotation.x=state.sitBlend*Math.PI/2+(state.walking?Math.sin(state.phase)*side*.5:0);knee.rotation.x=-state.sitBlend*Math.PI/2+(state.walking?Math.max(0,-Math.sin(state.phase)*side)*.45:0);}
  for(const {shoulder,elbow,side} of visitor.arms){shoulder.rotation.set(0,0,0);elbow.rotation.set(0,0,0);shoulder.rotation.x=state.walking?-Math.sin(state.phase)*side*.35:0;shoulder.rotation.z=-side*.09;elbow.rotation.x=.12;if(state.prayBlend>.001){const start=shoulder.position.clone(),hand=new THREE.Vector3(side*.055,.39+.012*prayer,-.32),v=hand.clone().sub(start),distance=v.length();v.normalize();const pole=new THREE.Vector3(side*.6,-.9,0);pole.addScaledVector(v,-pole.dot(v)).normalize();const reach=(.27*.27-.26*.26+distance*distance)/(2*distance),height=Math.sqrt(Math.max(0,.27*.27-reach*reach));const joint=start.clone().addScaledVector(v,reach).addScaledVector(pole,height);const down=new THREE.Vector3(0,-1,0),upperQ=new THREE.Quaternion().setFromUnitVectors(down,joint.clone().sub(start).normalize()),lowerQ=upperQ.clone().invert().multiply(new THREE.Quaternion().setFromUnitVectors(down,hand.clone().sub(joint).normalize()));shoulder.quaternion.slerp(upperQ,state.prayBlend);elbow.quaternion.slerp(lowerQ,state.prayBlend);}}
}
export function createCharacterController({scene,camera,controls,canvas}){
 const visitor=createVisitor(scene),keys=new Set(),status=document.querySelector('#character-state'),sit=document.querySelector('#sit'),pray=document.querySelector('#pray'),tip=document.querySelector('#action-tip');
 const marker=new THREE.Group();marker.name='walk destination';marker.visible=false;marker.position.y=.09;scene.add(marker);let markerAge=0;
 const ringMat=new THREE.MeshBasicMaterial({color:'#ffe3a1',transparent:true,opacity:1,depthWrite:false,side:THREE.DoubleSide});const ring=new THREE.Mesh(new THREE.RingGeometry(.22,.29,40),ringMat);ring.rotation.x=-Math.PI/2;marker.add(ring);const dot=new THREE.Mesh(new THREE.CircleGeometry(.075,20),ringMat.clone());dot.rotation.x=-Math.PI/2;marker.add(dot);marker.traverse(o=>o.userData.noNavigation=true);
 let occupiedSeats=new Set();const availableSeat=()=>nearestSeat(visitor.root.position,Infinity,seat=>!occupiedSeats.has(seat.id)&&(roomAt(visitor.root.position.x,visitor.root.position.z)==='corridor'||seat.room===roomAt(visitor.root.position.x,visitor.root.position.z)));
 const api={onAction:null}; let path=[],viewing=false,requestedSeat=null,floorGoal=null,networked=false,authority=null; const ray=new THREE.Raycaster(),pointer=new THREE.Vector2(); let tap=null;
 canvas.addEventListener("pointerdown",e=>{tap=e.isPrimary?{x:e.clientX,y:e.clientY,id:e.pointerId,time:performance.now()}:null;});
 canvas.addEventListener("pointercancel",()=>tap=null);
 canvas.addEventListener("pointerup",e=>{if(!tap||viewing||e.pointerId!==tap.id||Math.hypot(e.clientX-tap.x,e.clientY-tap.y)>8||performance.now()-tap.time>550){tap=null;return;}tap=null;const box=canvas.getBoundingClientRect();pointer.set((e.clientX-box.left)/box.width*2-1,-(e.clientY-box.top)/box.height*2+1);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(scene.children,true).find(h=>h.object.type!=="Group"&&h.object.visible&&!h.object.userData.noNavigation);if(!hit||hit.point.y>.22||!walkable(hit.point.x,hit.point.z))return;requestWalk(hit.point);});
 const state={seated:false,praying:false,transition:null,seat:null,phase:0,sitBlend:0,prayBlend:0,yaw:0,walking:false};
 setupTwoFingerZoom(canvas,camera,controls,distance=>{state.userDistance=distance;},()=>{tap=null;requestedSeat=null;path=[];keys.clear();});
 const keymap={w:'forward',ArrowUp:'forward',s:'back',ArrowDown:'back',a:'left',ArrowLeft:'left',d:'right',ArrowRight:'right'};
 const ease=(value,target,dt)=>THREE.MathUtils.lerp(value,target,1-Math.exp(-9*dt));
 function transition(to,yaw,seated){requestedSeat=null;path=[];marker.visible=false;const from=visitor.root.position.clone();state.transition={from,to:new THREE.Vector3(to.x,0,to.z),yaw,elapsed:0,duration:.7,seated};state.praying=false;state.seated=seated;state.cameraMotion={time:0,offset:seated?new THREE.Vector3(-(state.seat?.side||1)*4.8,6.2,-5.8):new THREE.Vector3(0,6.2,6.8)};keys.clear();}
 function walkTo(point){
  requestedSeat=null;if(state.praying)togglePray();
  path=findPath(visitor.root.position,point);canvas.dataset.pathPoints=String(path.length);
  if(path.length){marker.position.set(point.x,.09,point.z);markerAge=0;marker.visible=true;canvas.dataset.tapMarker='visible';}
 }
 function requestWalk(point){
  if(viewing||state.transition||!walkable(point.x,point.z))return false;
  const destination={x:point.x,z:point.z};
  if(state.seated){floorGoal=destination;toggleSit();}else{floorGoal=null;walkTo(destination);}
  return true;
 }
 function toggleSit(){
  if(state.transition)return;
  if(state.seated){api.onAction?.({type:'stand'});transition({x:state.seat.x,z:state.seat.z-1.15*S},0,false);return;}
  if(requestedSeat){requestedSeat=null;path=[];return;}
  const plan=planEmptySeat(visitor.root.position,occupiedSeats);
  if(!plan){tip.textContent='지금 이동할 수 있는 빈자리가 없습니다.';return;}
  if(state.praying)togglePray();
  requestedSeat=plan;path=plan.path;keys.clear();marker.visible=false;
  tip.textContent='가까운 빈자리로 이동합니다.';
 }
 function togglePray(){if(!state.transition){floorGoal=null;if(requestedSeat){requestedSeat=null;path=[];}state.praying=!state.praying;api.onAction?.({type:'pray',value:state.praying});keys.clear();}}
 document.addEventListener('keydown',e=>{if(viewing||e.target.closest('input,select,textarea,[contenteditable="true"]'))return;const k=e.key.length===1?e.key.toLowerCase():e.key;if(keymap[k]){floorGoal=null;path=[];requestedSeat=null;e.preventDefault();keys.add(keymap[k]);}else if(!e.repeat&&k==='e'){e.preventDefault();toggleSit();}else if(!e.repeat&&k==='p'){e.preventDefault();togglePray();}});
 document.addEventListener('keyup',e=>keys.delete(keymap[e.key.length===1?e.key.toLowerCase():e.key]));window.addEventListener('blur',()=>keys.clear());document.addEventListener('visibilitychange',()=>keys.clear());
 document.querySelectorAll('[data-move]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);requestedSeat=null;path=[];keys.add(b.dataset.move);});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>keys.delete(b.dataset.move));});
 sit.onclick=toggleSit;pray.onclick=togglePray;
 function cameraHome(){controls.target.copy(visitor.root.position).add(new THREE.Vector3(0,2.15,0));camera.position.copy(visitor.root.position).add(new THREE.Vector3(0,6.2,6.8));state.userDistance=camera.position.distanceTo(controls.target);controls.update();}
 controls.enablePan=false;controls.minDistance=3.4;controls.maxDistance=12;controls.minPolarAngle=.25;controls.maxPolarAngle=1.43;cameraHome();let cameraGesture=false;
 controls.addEventListener('start',()=>{cameraGesture=true;state.cameraMotion=null;});
 controls.addEventListener('change',()=>{if(cameraGesture)state.userDistance=camera.position.distanceTo(controls.target);});
 controls.addEventListener('end',()=>{state.userDistance=camera.position.distanceTo(controls.target);cameraGesture=false;});
 const forward=new THREE.Vector3(),right=new THREE.Vector3(),delta=new THREE.Vector3(),follow=new THREE.Vector3();let lastLabel='';
 function update(dt){state.time=(state.time||0)+dt;
  if(marker.visible){markerAge+=dt;const t=Math.min(1,markerAge/.9);ring.scale.setScalar(.7+t*1.1);ringMat.opacity=(1-t)*.95;dot.material.opacity=(1-t)*.8;if(t>=1){marker.visible=false;canvas.dataset.tapMarker='hidden';}}state.walking=false;if(viewing)return;
  if(state.transition){const tr=state.transition;tr.elapsed+=dt;visitor.root.position.lerpVectors(tr.from,tr.to,smoothstep(tr.elapsed/tr.duration));state.yaw=0;state.sitBlend=ease(state.sitBlend,tr.seated?1:0,dt);if(tr.elapsed>=tr.duration){visitor.root.position.copy(tr.to);state.seated=tr.seated;state.transition=null;}}
  else if(!state.seated&&!state.praying){
   camera.getWorldDirection(forward);forward.y=0;forward.normalize();right.crossVectors(forward,camera.up).normalize();delta.set(0,0,0);
   if(keys.has('forward'))delta.add(forward);if(keys.has('back'))delta.sub(forward);if(keys.has('left'))delta.sub(right);if(keys.has('right'))delta.add(right);
   let travel=3.4*dt;if(!delta.lengthSq()&&path.length){const goal=path[0];delta.set(goal.x-visitor.root.position.x,0,goal.z-visitor.root.position.z);travel=Math.min(travel,delta.length());if(delta.length()<.12){path.shift();delta.set(0,0,0);}}
   if(delta.lengthSq()){delta.normalize().multiplyScalar(travel);const next=moveWithCollision(visitor.root.position,delta.x,delta.z);const dx=next.x-visitor.root.position.x,dz=next.z-visitor.root.position.z;state.walking=Math.hypot(dx,dz)>.0001;visitor.root.position.set(next.x,0,next.z);if(state.walking){const desired=Math.atan2(-dx,-dz);state.yaw+=Math.atan2(Math.sin(desired-state.yaw),Math.cos(desired-state.yaw))*(1-Math.exp(-12*dt));state.phase+=dt*9;}}
  }
  if(floorGoal&&!state.transition&&!state.seated){const goal=floorGoal;floorGoal=null;walkTo(goal);}
  if(requestedSeat&&!state.transition&&!state.seated){
   if(occupiedSeats.has(requestedSeat.seat.id)){requestedSeat=null;path=[];toggleSit();}
   else if(Math.hypot(visitor.root.position.x-requestedSeat.approach.x,visitor.root.position.z-requestedSeat.approach.z)<.18&&(!networked||(authority&&Math.hypot(authority.x-requestedSeat.seat.x,authority.z-requestedSeat.seat.z)<SEAT_INTERACTION_DISTANCE-.3))){
    const seat=requestedSeat.seat;state.seat=seat;api.onAction?.({type:'sit',seatId:seat.id});transition(seat,0,true);
   }
  }
  state.sitBlend=ease(state.sitBlend,state.transition?.seated||state.seated?1:0,dt);state.prayBlend=ease(state.prayBlend,state.praying?1:0,dt);
  poseVisitor(visitor,state);
  const desired=visitor.root.position.clone().add(new THREE.Vector3(0,2.15+state.sitBlend*.25,0));follow.copy(desired).sub(controls.target).multiplyScalar(1-Math.exp(-10*dt));controls.target.add(follow);camera.position.add(follow);if(state.cameraMotion){state.cameraMotion.time+=dt;const goal=visitor.root.position.clone().add(state.cameraMotion.offset);camera.position.lerp(goal,1-Math.exp(-5*dt));if(state.cameraMotion.time>1.5){state.userDistance=state.cameraMotion.offset.clone().sub(new THREE.Vector3(0,2.15+state.sitBlend*.25,0)).length();state.cameraMotion=null;}}if(!state.cameraMotion){const offset=camera.position.clone().sub(controls.target).normalize().multiplyScalar(state.userDistance||6.6);camera.position.copy(controls.target).add(offset);}camera.position.copy(cameraPosition(controls.target,camera.position));controls.enabled=!state.transition;
  const near=availableSeat();sit.disabled=!!state.transition||(!state.seated&&!near);pray.disabled=!!state.transition;sit.textContent=state.seated?'일어나기':requestedSeat?'이동 취소':'빈자리 앉기';const navSit=document.querySelector('#nav-sit');navSit.querySelector('span').textContent=state.seated?'일어나기':requestedSeat?'이동 취소':'앉기';navSit.setAttribute('aria-label',state.seated?'의자에서 일어나기':requestedSeat?'빈자리 이동 취소':'가까운 빈자리로 이동해서 앉기');navSit.setAttribute('aria-pressed',String(state.seated));navSit.disabled=sit.disabled;const seatReady=!!near&&!state.seated&&!state.transition;navSit.dataset.seatReady=String(seatReady);tip.dataset.seatReady=String(seatReady);navSit.title=state.seated?'의자에서 일어나기':requestedSeat?'빈자리 이동 취소 (E)':near?'가까운 빈자리로 이동해서 앉기 (E)':'빈자리가 없습니다';pray.textContent=state.praying?'기도 마치기':'기도하기';pray.setAttribute('aria-pressed',String(state.praying));
  const label=state.transition?'자세를 바꾸는 중':state.praying?(state.seated?'앉아서 기도 중':'기도 중'):state.seated?'의자에 앉아 있습니다':requestedSeat?'빈자리로 이동 중':state.walking?'걷는 중':'교회를 둘러보세요';
  if(label!==lastLabel){status.textContent=label;lastLabel=label;}tip.textContent=state.transition?'전환 중에는 잠시 기다려 주세요.':state.seated?'바닥을 누르면 일어나서 이동합니다.':state.praying?'기도를 마치면 다시 이동할 수 있습니다.':requestedSeat?'가까운 빈자리로 이동 중입니다. 앉기를 다시 누르면 취소합니다.':near?'앉기를 누르면 가까운 빈자리로 이동해서 앉습니다.':(matchMedia('(pointer:coarse)').matches?'바닥 터치로 이동':'WASD / 방향키 또는 바닥 클릭으로 이동');
  canvas.dataset.cameraDistance=camera.position.distanceTo(controls.target).toFixed(3);canvas.dataset.characterYaw=state.yaw.toFixed(3);canvas.dataset.characterState=state.transition?'transition':state.praying?'praying':state.seated?'seated':state.walking?'walking':'idle';canvas.dataset.characterX=visitor.root.position.x.toFixed(3);canvas.dataset.characterZ=visitor.root.position.z.toFixed(3);
 }
 return Object.assign(api,{setNetworkState:value=>{networked=value;if(!value)authority=null;},confirmPosition:a=>{authority={x:a.x,z:a.z};},setOccupiedSeats:ids=>{occupiedSeats=new Set(ids);},update,cameraHome,walkToPoint:requestWalk,getVisitor:()=>visitor,setViewingVideo:value=>{viewing=value;floorGoal=null;requestedSeat=null;keys.clear();path=[];controls.enabled=!value;},correctBy:(dx,dz)=>{if(!state.transition&&!state.seated&&!state.praying){const next=moveWithCollision(visitor.root.position,dx,dz);visitor.root.position.set(next.x,0,next.z);}},getSnapshot:()=>({x:visitor.root.position.x,z:visitor.root.position.z,yaw:state.yaw,seated:state.seated,praying:state.praying,seatId:state.seat?.id||null,moving:state.walking,autoSeating:!!requestedSeat}),applyAuthority:(a,force=false)=>{const mismatch=a.seated!==state.seated||a.praying!==state.praying||(a.seated&&a.seatId!==state.seat?.id);if(force||mismatch){state.seat=SEATS.find(s=>s.id===a.seatId)||null;transition(a,a.yaw,a.seated);state.praying=a.praying;}else if(!state.transition&&Math.hypot(visitor.root.position.x-a.x,visitor.root.position.z-a.z)>1.1){transition(a,a.yaw,a.seated);state.praying=a.praying;}}});
}
