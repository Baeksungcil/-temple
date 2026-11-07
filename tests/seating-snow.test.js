import test from 'node:test';import assert from 'node:assert/strict';import * as THREE from 'three';
import {installCanvas} from './canvas-fixture.js';import {createVisitor,poseVisitor} from '../src/character.js';import {createSnow} from '../src/snow.js';
test('seated pelvis rests on the 0.94-high seat and clears the backrest',t=>{
 installCanvas(t);const scene=new THREE.Scene(),v=createVisitor(scene);poseVisitor(v,{yaw:0,walking:false,phase:0,sitBlend:1,prayBlend:0});v.root.updateMatrixWorld(true);
 const pelvis=new THREE.Box3().setFromObject(v.body.children[0]),head=new THREE.Box3().setFromObject(v.head);
 assert.ok(Math.abs(pelvis.min.y-.94)<.01);assert.ok(head.max.z-v.root.position.z<.375*Math.sqrt(3));
});
test('snow falls, remains finite, and does not block navigation picking',()=>{
 const snow=createSnow(new THREE.Scene()),p=snow.flakes.geometry.attributes.position;const before=p.getY(0);snow.update(.1);assert.ok(p.getY(0)<before);assert.equal(snow.flakes.userData.noNavigation,true);assert.ok([...p.array].every(Number.isFinite));
});
