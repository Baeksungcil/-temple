import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {installCanvas} from './canvas-fixture.js';
import {createVisitor,poseVisitor} from '../src/character.js';
import {WORLD_SCALE as S} from '../src/world-scale.js';
import {ROOM_TREES,walkable,ROOMS} from '../src/navigation.js';
import {addStainedWindow} from '../src/stained-glass.js';

test('seated lower legs and shoes stay in front of the deep pew seat',t=>{
 installCanvas(t);const v=createVisitor(new THREE.Scene());
 poseVisitor(v,{yaw:0,sitBlend:1,prayBlend:0,phase:0,walking:false});v.root.updateMatrixWorld(true);
 const seatFront=v.root.position.z-.4*S;
 for(const {knee} of v.legs){const lowerLeg=new THREE.Box3().setFromObject(knee);assert.ok(lowerLeg.max.z<seatFront-.03,'Shins must clear the front edge, not pass through the seat');}
 const pelvis=new THREE.Box3().setFromObject(v.body.children[0]);assert.ok(Math.abs(pelvis.min.y-.94)<.01);assert.ok(pelvis.max.z>seatFront,'Pelvis remains supported by the seat');
 poseVisitor(v,{yaw:0,sitBlend:0,prayBlend:0,phase:0,walking:false});assert.ok(Math.abs(v.body.position.z)<1e-9);
});
test('glass has four square corners including both upper corners',t=>{
 installCanvas(t);const scene=new THREE.Scene(),panel=addStainedWindow(scene,{x:0,y:0,z:0,width:4,height:5,project:false});
 const p=panel.geometry.attributes.position;
 for(const [x,y] of [[-2,0],[2,0],[-2,5],[2,5]]){assert.ok(Array.from({length:p.count},(_,i)=>i).some(i=>Math.abs(p.getX(i)-x)<1e-5&&Math.abs(p.getY(i)-y)<1e-5));}
 assert.equal(panel.name,'rectangular stained glass');
});
test('both large room trees have blocked footprints and leave central room access open',()=>{
 assert.equal(ROOM_TREES.length,2);
 for(const t of ROOM_TREES){assert.equal(walkable(t.x*S,t.z*S),false);const room=ROOMS.find(r=>r.id===t.room);assert.ok(t.x*S>room.minX&&t.x*S<room.maxX);assert.ok(walkable(room.cx,8*S));}
});
