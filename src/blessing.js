import {PRAYER_DURATION,PRAYER_TEXT} from './prayer.js';
import * as THREE from 'three';
import {createVisitor,poseVisitor} from './character.js';
import {blessingFront,blessingApproach,priestPath,clearPriestSegment} from './blessing-motion.js';
import {placeBlessingHands,configureBlessingPriest} from './blessing-pose.js';

export function createBlessing({scene,character,canvas,camera,controls,getPeople=()=>[],clock=()=>performance.now()/1000}){
 const button=document.querySelector('#blessing-toggle'),player=scene.getObjectByName('visitor');
 const body=player.children[0],groups=body.children.filter(o=>o.type==='Group');
 const playerModel=character.getVisitor?.()||{root:player,body,head:groups[0],arms:groups.filter(g=>Math.abs(g.position.y-.43)<.01).map((shoulder,i)=>({shoulder,elbow:shoulder.children.find(o=>o.type==='Group'),side:i?1:-1}))};
 const priest=createVisitor(scene,{shirt:'#f4ead6',pants:'#eee4cd',hair:'#60564e',skin:'#e9bf9e'});
 priest.root.name='blessing-priest';priest.root.visible=false;configureBlessingPriest(priest);
 priest.root.traverse(o=>o.userData.noNavigation=true);
 const gold=new THREE.MeshStandardMaterial({color:'#caa151',roughness:.7});
 for(const x of [-.2,.2]){const stole=new THREE.Mesh(new THREE.BoxGeometry(.09,.63,.05),gold);stole.position.set(x,.3,-.3);priest.body.add(stole);}
 const notice=document.createElement('p');notice.id='blessing-status';notice.setAttribute('role','status');document.querySelector('#app').append(notice);
 let active=false,startedPrayer=false,origin,goal,spawn,path=[],phase='idle',time=0,prayerTime=0,replan=0;
 const prayer=document.createElement('section');prayer.id='blessing-prayer';prayer.hidden=true;prayer.setAttribute('aria-label','함께 드리는 기도');prayer.innerHTML='<b>함께 드리는 기도</b><p></p><small></small>';prayer.querySelector('p').textContent=PRAYER_TEXT;document.querySelector('#app').append(prayer);
 let prayerStartedAt=0,previousCameraOffset=null;
 function setPhase(value){phase=value;canvas.dataset.blessingPhase=value;}
 function people(){player.updateMatrixWorld(true);const head=playerModel.head.getWorldPosition(new THREE.Vector3());return [...getPeople(),{x:head.x,z:head.z,radius:.88}];}
 function showPrayerView(){if(camera&&controls){
   if(!previousCameraOffset)previousCameraOffset=camera.position.clone().sub(controls.target);
   const side=origin.x>0?-1:1,back=origin.seated?-3:3;
   const offset=new THREE.Vector3(Math.cos(origin.yaw)*5.6*side+Math.sin(origin.yaw)*back,4.8,-Math.sin(origin.yaw)*5.6*side+Math.cos(origin.yaw)*back).normalize().multiplyScalar(previousCameraOffset.length());
   camera.position.copy(controls.target).add(offset);controls.update();
  }
 }
 function finish(completed){for(const arm of [...priest.arms,...playerModel.arms])arm.shoulder.position.z=0;if(previousCameraOffset&&camera&&controls){camera.position.copy(controls.target).add(previousCameraOffset);controls.update();previousCameraOffset=null;}active=false;prayer.hidden=true;priest.root.visible=false;setPhase('idle');button.setAttribute('aria-pressed','false');button.querySelector('span').textContent='안수기도';notice.textContent=completed?'안수기도를 마쳤습니다. 평안이 함께하시길 바랍니다.':'';if(startedPrayer&&character.getSnapshot().praying)document.querySelector('#pray').click();}
 button.onclick=()=>{
  if(active){finish(false);return;}
  if(canvas.dataset.characterState==='transition'||document.querySelector('#app').classList.contains('video-view'))return;
  origin=character.getSnapshot();const obstacles=people();goal=blessingFront(origin,obstacles);
  const approach=goal&&blessingApproach(origin,goal,obstacles);
  if(!approach){notice.textContent='앞쪽에 신부님이 설 공간이 부족합니다. 앞이 비어 있는 곳에서 다시 눌러 주세요.';return;}
  showPrayerView();
  startedPrayer=!origin.praying;if(startedPrayer)document.querySelector('#pray').click();
  spawn=approach.start;path=approach.path;time=0;prayerTime=0;replan=0;active=true;
  priest.root.position.set(spawn.x,0,spawn.z);priest.root.visible=true;setPhase('approaching');
  button.setAttribute('aria-pressed','true');button.querySelector('span').textContent='기도 마치기';notice.textContent='신부님이 다가오십니다.';
 };
 function walk(dt){
  const obstacles=people(),position=priest.root.position;replan-=dt;
  if(replan<=0){path=priestPath(position,goal,obstacles);replan=.65;}
  let budget=dt*3.4,moved=false;
  while(path.length&&budget>0){
   const waypoint=path[0],dx=waypoint.x-position.x,dz=waypoint.z-position.z,distance=Math.hypot(dx,dz);
   if(distance<.005){path.shift();continue;}
   const step=Math.min(distance,budget,.09),next={x:position.x+dx/distance*step,z:position.z+dz/distance*step};
   if(!clearPriestSegment(position,next,obstacles)){replan=0;break;}
   position.x=next.x;position.z=next.z;budget-=step;moved=true;
   priest.root.rotation.y=Math.atan2(-dx,-dz);if(step===distance)path.shift();
  }
  priest.head.rotation.y=0;for(const arm of priest.arms)arm.shoulder.position.z=0;poseVisitor(priest,{yaw:priest.root.rotation.y,sitBlend:0,prayBlend:0,walking:moved,phase:time*8,time});
  return Math.hypot(position.x-goal.x,position.z-goal.z)<.015;
 }
 return {update(dt){
  if(!active)return;const p=character.getSnapshot();
  if(!p.praying||p.seated!==origin.seated||Math.hypot(p.x-origin.x,p.z-origin.z)>.2||Math.abs(Math.atan2(Math.sin(p.yaw-origin.yaw),Math.cos(p.yaw-origin.yaw)))>.1||document.querySelector('#app').classList.contains('video-view')){finish(false);return;}
  time+=dt;
  if(phase==='approaching'||phase==='leaving'){
   if(walk(dt)){
    if(phase==='leaving'){finish(true);return;}
    setPhase('praying');showPrayerView();prayerTime=0;prayerStartedAt=clock();prayer.hidden=false;
   }else{notice.textContent=phase==='leaving'?'평안이 함께하시길 바랍니다.':'신부님이 의자와 방문객을 피해 다가오십니다.';return;}
  }
  if(phase==='praying'){
   prayerTime=clock()-prayerStartedAt;priest.root.rotation.y=Math.atan2(priest.root.position.x-origin.x,priest.root.position.z-origin.z);
   priest.head.rotation.y=0;for(const arm of priest.arms)arm.shoulder.position.z=0;poseVisitor(priest,{yaw:priest.root.rotation.y,sitBlend:0,prayBlend:0,walking:false,phase:0,time});
   const blend=THREE.MathUtils.smoothstep(Math.min(prayerTime,PRAYER_DURATION-prayerTime),0,1.1);
   canvas.dataset.blessingHandError=placeBlessingHands(priest,playerModel,blend).toFixed(4);
   if(notice.textContent!=='신부님과 손을 잡고 함께 기도합니다.')notice.textContent='신부님과 손을 잡고 함께 기도합니다.';const remaining=Math.max(0,Math.ceil(PRAYER_DURATION-prayerTime))+'초';if(prayer.querySelector('small').textContent!==remaining)prayer.querySelector('small').textContent=remaining;canvas.dataset.blessingPrayerSeconds=prayerTime.toFixed(2);
   if(prayerTime>=PRAYER_DURATION){prayer.hidden=true;goal=spawn;path=[];replan=0;setPhase('leaving');}
  }
  canvas.dataset.blessingX=priest.root.position.x.toFixed(4);canvas.dataset.blessingZ=priest.root.position.z.toFixed(4);
  canvas.dataset.blessingYaw=priest.root.rotation.y.toFixed(4);
 }};
}

