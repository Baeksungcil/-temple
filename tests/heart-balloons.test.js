import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createHeartBalloons,heartGeometry,wrapWishText,BALLOON_LIFETIME} from '../src/heart-balloons.js';
import {createWishEvents} from '../server/wish-events.js';
import {installCanvas} from './canvas-fixture.js';

test('heart has rounded three dimensional depth',()=>{
 const geometry=heartGeometry();geometry.computeBoundingBox();const size=geometry.boundingBox.getSize(new THREE.Vector3());
 assert.ok(size.x>2&&size.y>1.5&&size.z>.7);assert.ok([...geometry.attributes.position.array].every(Number.isFinite));geometry.dispose();
});
test('wish text wraps Korean and preserves its complete contents',()=>{
 const text='가족 모두 건강하고 행복하기를'.repeat(8),lines=wrapWishText({measureText:value=>({width:value.length*40})},text,900);
 assert.equal(lines.join(''),text);assert.ok(lines.every(line=>line.length*40<=900));
});
test('heart balloons rise slowly, deduplicate shared events and release resources',t=>{
 installCanvas(t);const original=document.createElement;document.createElement=name=>{const canvas=original(name),ctx=canvas.getContext('2d');ctx.measureText=value=>({width:value.length*40});ctx.fillText=()=>{};return canvas;};
 let now=100000;const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(62,1,.1,240),canvas={dataset:{}};camera.position.set(0,3,10);camera.lookAt(0,3,0);camera.updateMatrixWorld();
 const balloons=createHeartBalloons({scene,camera,canvas,now:()=>now}),event={eventId:'heart-1',text:'가족 모두 건강하기',time:now,x:0,z:0,source:'ambient'};
 balloons.receive(event);balloons.receive(event);balloons.update();assert.equal(scene.children.length,1);assert.equal(canvas.dataset.wishBalloons,'1');assert.equal(canvas.dataset.ambientWishBalloons,'1');
 const first=balloons.getSnapshot()[0];now+=10000;balloons.update();const later=balloons.getSnapshot()[0];assert.ok(Math.abs(later.y-first.y-1.35)<.001);
 assert.ok(scene.children[0].children.every(mesh=>mesh.userData.noNavigation));
 let disposed=0;scene.children[0].children[0].material.addEventListener('dispose',()=>disposed++);
 now=event.time+BALLOON_LIFETIME;balloons.update();assert.equal(canvas.dataset.wishBalloons,'0');assert.equal(scene.children.length,0);assert.equal(disposed,1);
 balloons.receive(event);assert.equal(scene.children.length,0,'Expired replay is ignored');
 balloons.receive({...event,eventId:'late',time:1,ageMs:10000});balloons.update();assert.ok(Math.abs(balloons.getSnapshot()[0].y-4.75)<.001,'Replay age is independent of device clock');balloons.clear();
});
test('automatic wishes use visitor positions, synchronize late arrivals and expire',()=>{
 let now=100000;const wishes=createWishEvents({now:()=>now}),people=[{id:'ambient:0',x:4,z:18},{id:'ambient:1',x:-4,z:12}];
 assert.equal(wishes.automatic(people,true),null);now+=5000;const first=wishes.automatic(people,true);
 assert.equal(first.source,'ambient');assert.equal(first.senderId,people[0].id);assert.equal(first.x,4);assert.equal(first.z,18);assert.ok(first.text.length>0);
 assert.deepEqual(wishes.getActive(),[first]);assert.equal(wishes.automatic(people,true),null);now+=12000;const second=wishes.automatic(people,true);assert.equal(second.senderId,people[1].id);
 now+=BALLOON_LIFETIME;assert.deepEqual(wishes.getActive(),[]);
 assert.equal(wishes.automatic(people,false),null);
 for(let i=0;i<20;i++)wishes.publish({text:'소원',x:0,z:0});assert.equal(wishes.getActive().length,16);
});
