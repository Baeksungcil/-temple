import {WORLD_SCALE as S} from '../src/world-scale.js';
import test from 'node:test';import assert from 'node:assert/strict';import {walkable,moveWithCollision,nearestSeat,SEATS,PEW_ROWS} from '../src/navigation.js';
test('central aisle stays open and pews block walking',()=>{for(let z=-15;z<=23;z+=.1)assert.ok(walkable(0,z*S));assert.equal(walkable(5.6*S,18*S),false);assert.equal(walkable(12*S,0),false);assert.equal(walkable(0,-16*S),false);const p=moveWithCollision({x:3.2*S,z:18*S},.15*S,0);assert.equal(p.x,3.2*S);});
test('seat interaction has a limited approach range',()=>{assert.equal(nearestSeat({x:0,z:21*S}),null);assert.ok(nearestSeat({x:3.1*S,z:18*S}));assert.equal(SEATS.filter(s=>s.room==='nave').length,PEW_ROWS.length*6);for(const seat of SEATS)assert.ok(walkable(seat.x,seat.z-1.15*S));});

test('three rooms are connected through walkable corridors',()=>{for(const side of [-1,1]){let p={x:0,z:7.6*S};for(let i=0;i<340;i++)p=moveWithCollision(p,side*.1*S,0);assert.ok(Math.abs(p.x-side*34*S)<.2);}});

test('nearby seating accounts for expanded architecture in all three rooms',()=>{
 for(const seat of SEATS){
  const approach={x:seat.x,z:seat.z-1.7*S};
  if(!walkable(approach.x,approach.z))continue; // Tree footprints remain blocked.
  assert.ok(nearestSeat(approach),'Seat is available from a nearby aisle');
 }
 assert.equal(nearestSeat({x:0,z:21*S}),null,'Entrance stays outside seating range');
 assert.equal(nearestSeat({x:0,z:18*S}),null,'Centre aisle stays outside seating range');
});
