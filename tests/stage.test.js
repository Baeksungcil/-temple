import test from 'node:test';import assert from 'node:assert/strict';import * as THREE from 'three';
import {installCanvas} from './canvas-fixture.js';import {createStageCharacters} from '../src/stage-characters.js';
test('pastor stands on platform with four front and six rear choir children',t=>{
 installCanvas(t);globalThis.document.querySelector=()=>({dataset:{}});
 const scene=new THREE.Scene(),stage=createStageCharacters(scene);stage.update(1);
 const pastor=scene.getObjectByName('pastor'),platform=scene.getObjectByName('pastor raised platform');
 assert.equal(pastor.position.y,platform.position.y+platform.geometry.parameters.height/2);
 const children=scene.children.filter(o=>o.name.startsWith('choir-'));
 const front=children.filter(o=>o.name.startsWith('choir-row-1-')),back=children.filter(o=>o.name.startsWith('choir-row-2-'));
 assert.equal(front.length,4);assert.equal(back.length,6);
 assert.ok(children.every(o=>o.position.z>pastor.position.z));
 assert.ok(front.every(a=>back.every(b=>a.position.z>b.position.z&&a.position.y<b.position.y)));
 assert.ok(scene.getObjectByName('Choir Christmas display'));

});
