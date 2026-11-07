import {WORLD_SCALE as S} from '../src/world-scale.js';
import test from 'node:test';import assert from 'node:assert/strict';import * as THREE from 'three';import {cameraPosition} from '../src/camera-navigation.js';
test('camera stays inside the connecting corridor instead of behind its wall',()=>{const target=new THREE.Vector3(17*S,1.95,9*S),wanted=new THREE.Vector3(17*S,4.7,15*S);const result=cameraPosition(target,wanted);assert.ok(result.z<11.05*S);assert.ok(result.z>9*S);assert.ok([result.x,result.y,result.z].every(Number.isFinite));});
