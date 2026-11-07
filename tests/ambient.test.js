import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createAmbientSimulation} from '../src/ambient-simulation.js';
import {createAmbientVisitors} from '../src/ambient-visitors.js';
import {SEATS,walkable,nearestSeat} from '../src/navigation.js';
import {installCanvas} from './canvas-fixture.js';

function seeded(){let n=17;return()=>((n=(n*1664525+1013904223)>>>0)/4294967296);}
test('thirty visitors repeatedly walk, sit and stand without using occupied seats',()=>{
 const occupied=new Map(),sim=createAmbientSimulation({occupied,random:seeded()});
 assert.equal(sim.people.length,30);assert.equal(sim.people.filter(p=>p.mode==='seated').length,18);
 const humanSeat=SEATS.find(s=>!occupied.has(s.id));occupied.set(humanSeat.id,'human');
 const modes=new Set();
 for(let frame=0;frame<3600;frame++){
  sim.update(.1);
  assert.equal(occupied.get(humanSeat.id),'human');
  const assigned=sim.people.filter(p=>p.seatId).map(p=>p.seatId);assert.equal(new Set(assigned).size,assigned.length);
  for(const p of sim.people){
   modes.add(p.mode);assert.ok([p.x,p.z,p.yaw,p.sitBlend].every(Number.isFinite));
   if(p.mode==='walking'||p.mode==='idle')assert.ok(walkable(p.x,p.z));
   if(p.seatId)assert.equal(occupied.get(p.seatId),p.id);
  }
 }
 assert.ok(modes.has('sitting'));assert.ok(modes.has('standing'));
 assert.ok(sim.people.every(p=>p.cycles>=1),'Each visitor reaches a new seat');
});
test('seat selection skips occupied seats',()=>{
 const seat=SEATS[0],position={x:seat.x,z:seat.z-2};
 const found=nearestSeat(position,undefined,s=>s.id!==seat.id);assert.notEqual(found?.id,seat.id);
});
test('ambient rendering batches thirty visitors and excludes their meshes from floor navigation',t=>{
 installCanvas(t);const scene=new THREE.Scene(),canvas={dataset:{}},renderer=createAmbientVisitors({scene,canvas}),simulation=createAmbientSimulation({random:seeded()});
 renderer.receive(simulation.snapshot());renderer.update(.1);
 assert.equal(canvas.dataset.ambientVisitors,'30');assert.equal(canvas.dataset.ambientSeated,'18');
 assert.ok(scene.children.length<100);assert.ok(scene.children.every(mesh=>mesh.isInstancedMesh&&mesh.count===30&&mesh.userData.noNavigation));
 renderer.receive([]);renderer.update(.1);assert.ok(scene.children.every(mesh=>mesh.count===0));
});
