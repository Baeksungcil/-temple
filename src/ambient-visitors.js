import * as THREE from 'three';
import {createVisitor,poseVisitor} from './character.js';
import {AMBIENT_COUNT} from './ambient-simulation.js';

export function createAmbientVisitors({scene,canvas}){
 const prototype=createVisitor(new THREE.Scene()),parts=[],states=new Map();
 const colors=['#a9bbdd','#d6b88e','#9dc5b5','#cf9ca7','#b5abd2','#e0c893','#98bbc4','#c6ad98','#b8c88d','#d4adbc'];
 prototype.root.traverse(mesh=>{
  if(!mesh.isMesh)return;
  const instances=new THREE.InstancedMesh(mesh.geometry,mesh.material,AMBIENT_COUNT);
  instances.name='ambient visitors';instances.count=0;instances.frustumCulled=false;instances.userData.noNavigation=true;
  // Tint clothing while preserving skin, facial details and ground shadows.
  if(['d1846c','527a9a'].includes(mesh.material.color?.getHexString()))for(let i=0;i<AMBIENT_COUNT;i++)instances.setColorAt(i,new THREE.Color(colors[i%colors.length]));
  scene.add(instances);parts.push({source:mesh,instances});
 });
 function receive(list){
  const seen=new Set();
  for(const item of list.slice(0,AMBIENT_COUNT)){
   seen.add(item.id);const old=states.get(item.id);
   if(old)old.target=item;else states.set(item.id,{x:item.x,z:item.z,yaw:item.yaw,sitBlend:item.sitBlend,phase:0,target:item});
  }
  for(const id of states.keys())if(!seen.has(id))states.delete(id);
 }
 function update(dt){
  let index=0,seated=0,walking=0;
  for(const state of states.values()){
   const target=state.target,k=1-Math.exp(-12*dt);state.x=THREE.MathUtils.lerp(state.x,target.x,k);state.z=THREE.MathUtils.lerp(state.z,target.z,k);state.sitBlend=THREE.MathUtils.lerp(state.sitBlend,target.sitBlend,k);state.yaw+=Math.atan2(Math.sin(target.yaw-state.yaw),Math.cos(target.yaw-state.yaw))*k;
   state.phase+=dt*6;prototype.root.position.set(state.x,0,state.z);
   poseVisitor(prototype,{yaw:state.yaw,walking:target.moving,phase:state.phase,sitBlend:state.sitBlend,prayBlend:0,time:state.phase/6});
   prototype.root.updateMatrixWorld(true);for(const part of parts)part.instances.setMatrixAt(index,part.source.matrixWorld);
   if(target.mode==='seated')seated++;if(target.moving)walking++;index++;
  }
  for(const {instances} of parts){instances.count=index;instances.instanceMatrix.needsUpdate=true;}
  canvas.dataset.ambientVisitors=String(index);canvas.dataset.ambientSeated=String(seated);canvas.dataset.ambientWalking=String(walking);
 }
 return {receive,update};
}
