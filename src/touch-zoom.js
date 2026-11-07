import * as THREE from 'three';

// A short two-finger tap zooms in once. Moving fingers remain OrbitControls pinch.
export function setupTwoFingerZoom(canvas,camera,controls,onZoom,cancelWalk){
 const fingers=new Map();let gesture=null;
 canvas.addEventListener('pointerdown',e=>{
  if(e.pointerType!=='touch')return;fingers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(fingers.size===2){gesture={started:performance.now(),valid:true};cancelWalk();}
  else if(fingers.size>2&&gesture)gesture.valid=false;
 });
 canvas.addEventListener('pointermove',e=>{const p=fingers.get(e.pointerId);if(p&&gesture&&Math.hypot(e.clientX-p.x,e.clientY-p.y)>12)gesture.valid=false;});
 function end(e,cancelled){
  if(!fingers.has(e.pointerId))return;fingers.delete(e.pointerId);if(cancelled&&gesture)gesture.valid=false;
  if(fingers.size===0&&gesture){const tap=gesture;gesture=null;if(!cancelled&&tap.valid&&performance.now()-tap.started<400&&controls.enabled&&controls.enableZoom){
   const offset=camera.position.clone().sub(controls.target),distance=offset.length(),next=THREE.MathUtils.clamp(distance*.78,controls.minDistance,controls.maxDistance);
   if(distance>0){camera.position.copy(controls.target).add(offset.multiplyScalar(next/distance));controls.update();onZoom(next);canvas.dataset.twoFingerZoom=String(Number(canvas.dataset.twoFingerZoom||0)+1);}
  }}
 }
 canvas.addEventListener('pointerup',e=>end(e,false));canvas.addEventListener('pointercancel',e=>end(e,true));
}
