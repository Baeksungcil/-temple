import test from 'node:test';import assert from 'node:assert/strict';
import {CONFESSION_POINT,nearConfession} from '../src/confession.js';
import {walkable,findPath,ROOMS} from '../src/navigation.js';import {WORLD_SCALE as S} from '../src/world-scale.js';
test('confession entrance is reachable and only shows its action nearby',()=>{
 assert.equal(ROOMS.find(r=>r.id==='fellowship').name,'고해성사실');
 assert.ok(walkable(CONFESSION_POINT.x,CONFESSION_POINT.z));
 assert.ok(findPath({x:34*S,z:8*S},CONFESSION_POINT).length);
 assert.ok(nearConfession(CONFESSION_POINT));assert.equal(nearConfession({x:0,z:0}),false);
 assert.equal(walkable(34*S,-11.2*S),false);
});
