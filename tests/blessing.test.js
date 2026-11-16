import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {SEATS,walkable} from '../src/navigation.js';
import {createVisitor,poseVisitor} from '../src/character.js';
import {installCanvas} from './canvas-fixture.js';
import {priestClear,clearPriestSegment,priestPath,blessingFront,blessingApproach} from '../src/blessing-motion.js';
import {placeBlessingHands,configureBlessingPriest} from '../src/blessing-pose.js';
import {createBlessing} from '../src/blessing.js';

test('every pew seat has a blessing position directly in front and outside the chair',()=>{
 for(const seat of SEATS){const p={...seat,yaw:0,seated:true},front=blessingFront(p);assert.ok(front,seat.id);assert.equal(front.x,p.x);assert.ok(front.z<p.z);assert.ok(priestClear(front));}
});
test('priest approaches occupied pews through clear aisles instead of cutting through benches',()=>{
 for(const seat of SEATS.filter((s,i)=>i%15===0)){
  const p={...seat,yaw:0,seated:true},end=blessingFront(p),approach=blessingApproach(p,end);assert.ok(approach,seat.id);
  let a=approach.start;for(const b of approach.path){assert.ok(clearPriestSegment(a,b),seat.id);a=b;}
  assert.ok(Math.hypot(a.x-end.x,a.z-end.z)<1e-9);
 }
});
test('a visitor standing in the route causes a detour and a blocked destination makes the priest wait',()=>{
 const start={x:0,z:32},end={x:0,z:27},people=[{x:0,z:29.5,radius:.6}];
 const path=priestPath(start,end,people);assert.ok(path.length>1);let a=start;
 for(const b of path){assert.ok(clearPriestSegment(a,b,people));a=b;}
 assert.deepEqual(priestPath(start,end,[{...end,radius:.6}]),[]);
});
test('standing blessing position follows player facing direction',()=>{
 for(let yaw=0;yaw<Math.PI*2;yaw+=Math.PI/4){const p={x:0,z:34,yaw,seated:false},end=blessingFront(p);assert.ok(end);assert.ok(Math.abs((end.x-p.x)*Math.cos(yaw)-(end.z-p.z)*Math.sin(yaw))<1e-8);assert.ok((end.x-p.x)*-Math.sin(yaw)+(end.z-p.z)*-Math.cos(yaw)>0);}
});
test('normal arms hold hands for both seated and standing players',t=>{
 installCanvas(t);const scene=new THREE.Scene(),player=createVisitor(scene),priest=createVisitor(scene);configureBlessingPriest(priest);
 for(const seated of [false,true])for(const yaw of [0,Math.PI/2,Math.PI,Math.PI*1.5])for(const time of [0,1,3,5]){
  player.root.position.set(0,0,34);poseVisitor(player,{yaw,sitBlend:seated?1:0,prayBlend:1,walking:false,phase:0,time});
  const p={x:0,z:34,yaw,seated},front=blessingFront(p,[{x:0,z:34,radius:seated?.48:.72}]);priest.root.position.set(front.x,0,front.z);
  poseVisitor(priest,{yaw:yaw+Math.PI,sitBlend:0,prayBlend:0,walking:false,phase:0,time});scene.updateMatrixWorld(true);
  const crown=player.head.localToWorld(new THREE.Vector3(0,.60,0)),error=placeBlessingHands(priest,player);
  const turn=Math.atan2(Math.sin(priest.root.rotation.y-yaw-Math.PI),Math.cos(priest.root.rotation.y-yaw-Math.PI));assert.ok(Math.abs(turn)<=Math.PI/9+1e-8);assert.ok(error<.025,JSON.stringify({seated,yaw,time,error}));assert.equal(priest.root.position.y,0);assert.ok(priest.root.scale.x/player.root.scale.x<1.1);assert.equal(priest.arms[0].elbow.position.y,-.27);
 }
});

test('heads and torsos stay separated throughout the blessing, including seated prayer',t=>{
 installCanvas(t);const scene=new THREE.Scene(),player=createVisitor(scene),priest=createVisitor(scene);configureBlessingPriest(priest);
 function interval(objects,axis){
  let min=Infinity,max=-Infinity;
  for(const root of objects)root.traverse(mesh=>{if(!mesh.isMesh||mesh.name.includes('shadow'))return;const positions=mesh.geometry.attributes.position;
   for(let i=0;i<positions.count;i++){
    const value=new THREE.Vector3().fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld).dot(axis);min=Math.min(min,value);max=Math.max(max,value);
   }
  });return {min,max};
 }
 for(const seated of [false,true])for(const yaw of [0,Math.PI/4,Math.PI/2,Math.PI,Math.PI*1.5])for(const time of [0,1,3,5,12,19])for(const blend of [0,.25,.5,.75,1]){
  player.root.position.set(0,0,34);poseVisitor(player,{yaw,sitBlend:seated?1:0,prayBlend:1,walking:false,phase:0,time});
  const front=blessingFront({x:0,z:34,yaw,seated});priest.root.position.set(front.x,0,front.z);
  poseVisitor(priest,{yaw:yaw+Math.PI,sitBlend:0,prayBlend:0,walking:false,phase:0,time});placeBlessingHands(priest,player,blend);scene.updateMatrixWorld(true);
  const axis=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw));
  const playerParts=[player.head,...player.body.children.filter(o=>o.isMesh)],priestParts=[priest.head,...priest.body.children.filter(o=>o.isMesh)];
  const a=interval(playerParts,axis),b=interval(priestParts,axis);
  assert.ok(b.min-a.max>.025,JSON.stringify({seated,yaw,time,blend,gap:b.min-a.max}));
 }
});

test('complete blessings hold hands and show the prayer for twenty seconds without crossing pews',t=>{
 installCanvas(t);const createCanvas=document.createElement.bind(document);
 for(const seated of [false,true]){
  const scene=new THREE.Scene(),player=createVisitor(scene),seat=SEATS.find(s=>s.room==='nave'&&s.side===1);
  const state={x:seated?seat.x:0,z:seated?seat.z:34,yaw:seated?0:Math.PI/2,seated,praying:false};
  const button={setAttribute(){},querySelector:()=>({textContent:''})},notice={textContent:'',setAttribute(){},querySelector:()=>({textContent:''})},app={append(){},classList:{contains:()=>false}};
  const pray={click(){state.praying=!state.praying;}};
  document.createElement=name=>name==='canvas'?createCanvas(name):notice;
  document.querySelector=selector=>({'#blessing-toggle':button,'#app':app,'#pray':pray})[selector];
  let clockTime=0;const canvas={dataset:{}},character={getSnapshot:()=>({...state})};
  const camera=new THREE.PerspectiveCamera(),controls={target:new THREE.Vector3(state.x,2,state.z),update(){}};camera.position.copy(controls.target).add(new THREE.Vector3(0,6,6));const before=camera.position.clone();
  const blessing=createBlessing({scene,character,canvas,camera,controls,clock:()=>clockTime}),priest={root:scene.getObjectByName('blessing-priest')};
  let touched=false,arrived=false,prayerFrames=0;
  const animate=time=>{player.root.position.set(state.x,0,state.z);poseVisitor(player,{...state,sitBlend:seated?1:0,prayBlend:state.praying?1:0,walking:false,phase:0,time});};
  animate(0);button.onclick();assert.ok(camera.position.distanceTo(before)>1,'camera must show both characters from the side');assert.equal(canvas.dataset.blessingPhase,'approaching');
  for(let i=0;i<1400&&canvas.dataset.blessingPhase!=='idle';i++){
   clockTime=i*.05;animate(clockTime);blessing.update(.05);assert.ok(priestClear(priest.root.position),'priest crosses a pew');assert.equal(priest.root.position.y,0);
   if(canvas.dataset.blessingPhase==='praying'){
    arrived=true;prayerFrames++;const dx=priest.root.position.x-state.x,dz=priest.root.position.z-state.z;
    assert.ok(Math.abs(dx*Math.cos(state.yaw)-dz*Math.sin(state.yaw))<.02,'not directly ahead');
    if(Number(canvas.dataset.blessingHandError)<.025)touched=true;
   }
  }
  assert.ok(prayerFrames>=399&&prayerFrames<=402,prayerFrames);assert.ok(arrived);assert.ok(touched,'hands must meet');assert.equal(canvas.dataset.blessingPhase,'idle');assert.equal(state.praying,false);assert.ok(camera.position.distanceTo(before)<1e-8,'restore original view after prayer');
 }
});
