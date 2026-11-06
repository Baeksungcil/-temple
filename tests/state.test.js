import test from 'node:test';import assert from 'node:assert/strict';import {seoulHour,daylight,validGtm,safeRead} from '../src/state.js';
test('KST crosses UTC day boundary',()=>{assert.equal(seoulHour(new Date('2026-11-05T18:30:00Z')),3.5);assert.equal(seoulHour(new Date('2026-11-05T03:00:00Z')),12);});
test('lighting stays bounded and night is dark',()=>{assert.equal(daylight(0),0);assert.equal(daylight(12),1);for(let h=0;h<24;h+=.1)assert.ok(daylight(h)>=0&&daylight(h)<=1);});
test('GTM is disabled without a real ID and rejects URL injection',()=>{assert.equal(validGtm(''),false);assert.equal(validGtm('GTM-TEST123'),true);assert.equal(validGtm('GTM-X&foo=bar'),false);});
test('storage rejection does not crash app',()=>{assert.equal(safeRead({getItem(){throw Error('blocked');}}),null);});
