import test from 'node:test';
import assert from 'node:assert/strict';
import {planEmptySeat} from '../src/seating.js';
import {createShuffledPlaylist} from '../src/hymn-playlist.js';
import {SEATS,walkable,SEAT_INTERACTION_DISTANCE} from '../src/navigation.js';
import {createCharacterController} from '../src/character.js';
import * as THREE from 'three';
import {installCanvas} from './canvas-fixture.js';

test('sitting plans a route to the nearest reachable empty chair from beyond the old range',()=>{
 const start={x:0,z:36},first=planEmptySeat(start);assert.ok(first);
 assert.ok(Math.hypot(first.seat.x-start.x,first.seat.z-start.z)>SEAT_INTERACTION_DISTANCE);
 const next=planEmptySeat(start,new Set([first.seat.id]));assert.ok(next);assert.notEqual(next.seat.id,first.seat.id);
 let a=start;for(const b of next.path){const n=Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.1);for(let i=0;i<=n;i++)assert.ok(walkable(a.x+(b.x-a.x)*i/n,a.z+(b.z-a.z)*i/n));a=b;}
 assert.equal(planEmptySeat(start,new Set(SEATS.map(s=>s.id))),null);
});
test('ten hymns play in shuffled cycles without immediate repeats at cycle boundaries',()=>{
 const tracks=Array.from({length:10},(_,id)=>({id})),playlist=createShuffledPlaylist(tracks,()=>.25);
 let previous;
 for(let cycle=0;cycle<4;cycle++){const seen=new Set();for(let i=0;i<10;i++){const track=playlist.next();assert.notEqual(track,previous);previous=track;seen.add(track);}assert.equal(seen.size,10);}
 assert.equal(createShuffledPlaylist([]).next(),null);
});
test('one sit click walks to a free seat before sending the server sit action',t=>{
 installCanvas(t);const elements=new Map();
 const element=()=>({dataset:{},textContent:'',disabled:false,addEventListener(){},setAttribute(){},querySelector:()=>({textContent:''})});
 document.querySelector=s=>{if(!elements.has(s))elements.set(s,element());return elements.get(s);};document.querySelectorAll=()=>[];document.addEventListener=()=>{};
 const oldWindow=globalThis.window,oldMatch=globalThis.matchMedia;globalThis.window={addEventListener(){}};globalThis.matchMedia=()=>({matches:false});
 t.after(()=>{globalThis.window=oldWindow;globalThis.matchMedia=oldMatch;});
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(),controls={target:new THREE.Vector3(),addEventListener(){},update(){}},canvas=element();
 const character=createCharacterController({scene,camera,controls,canvas});
 const first=planEmptySeat(character.getSnapshot());character.setOccupiedSeats([first.seat.id]);
 let sent;character.onAction=action=>{if(action.type==='sit'){const p=character.getSnapshot(),seat=SEATS.find(s=>s.id===action.seatId);assert.ok(Math.hypot(p.x-seat.x,p.z-seat.z)<=SEAT_INTERACTION_DISTANCE);sent=action;}};
 character.setNetworkState(true);character.confirmPosition(character.getSnapshot());character.update(.12);assert.equal(elements.get('#nav-sit').disabled,false);elements.get('#sit').onclick();
 assert.equal(character.getSnapshot().autoSeating,true);
 for(let i=0;i<800&&!character.getSnapshot().seated;i++)character.update(.12);
 assert.equal(sent,undefined,'wait for server confirmation before sitting');character.confirmPosition(character.getSnapshot());
 for(let i=0;i<20;i++)character.update(.12);
 assert.ok(sent);assert.notEqual(sent.seatId,first.seat.id);assert.equal(character.getSnapshot().seated,true);assert.equal(character.getSnapshot().autoSeating,false);
 assert.equal(character.walkToPoint({x:999,z:999}),false);assert.equal(character.getSnapshot().seated,true);
 const destination={x:0,z:36};assert.equal(character.walkToPoint(destination),true);assert.equal(character.getSnapshot().seated,false,'floor tap stands immediately');
 for(let i=0;i<500;i++)character.update(.12);const end=character.getSnapshot();assert.equal(end.seated,false);assert.ok(walkable(end.x,end.z));assert.ok(Math.hypot(end.x-destination.x,end.z-destination.z)<.2,'walk to tapped floor after standing');
});
