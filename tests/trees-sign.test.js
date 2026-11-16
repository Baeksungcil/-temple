import test from 'node:test';
import assert from 'node:assert/strict';
import {CHRISTMAS_TREES,TREE_FOOTPRINTS,TREE_SCALE,ROOM_TREES} from '../src/christmas-layout.js';
import {walkable,moveWithCollision,OBSTACLES} from '../src/navigation.js';
import {WORLD_SCALE as S} from '../src/world-scale.js';
import {createChurchSign} from '../src/church-sign.js';
import * as THREE from 'three';

test('every Christmas tree, including entrance and corner trees, blocks its visible footprint',()=>{
 assert.equal(CHRISTMAS_TREES.length,22);
 for(const tree of CHRISTMAS_TREES){
  const radius=1.12*tree.size*TREE_SCALE;
  for(let i=0;i<24;i++){const angle=i/24*Math.PI*2;assert.equal(walkable((tree.x+Math.cos(angle)*radius*.95)*S,(tree.z+Math.sin(angle)*radius*.95)*S),false,JSON.stringify(tree));}
 }
 assert.ok(TREE_FOOTPRINTS.every(t=>OBSTACLES.some(o=>Math.abs((o.minX+o.maxX)/2-t.x*S)<1e-8&&Math.abs((o.minZ+o.maxZ)/2-t.z*S)<1e-8)));
});
test('walking toward a tree stops before entering its branches',()=>{
 const tree=ROOM_TREES[0],start={x:(tree.x+4.2)*S,z:tree.z*S};assert.ok(walkable(start.x,start.z));
 const end=moveWithCollision(start,-10*S,0);assert.ok(walkable(end.x,end.z));assert.ok(end.x>=(tree.x+tree.radius)*S-.001);
});
test('the church sign has a gold frame and high-resolution Korean lettering',t=>{
 const prior=globalThis.document,words=[];const context=new Proxy({createLinearGradient:()=>({addColorStop(){}}),fillText:text=>words.push(text)},{get:(o,k)=>k in o?o[k]:()=>{}});
 globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>context})};t.after(()=>{globalThis.document=prior;});
 const scene=new THREE.Scene(),sign=createChurchSign(scene);assert.ok(words.includes('복음교회'));assert.equal(sign.name,'Gospel Church sign');
 const face=sign.getObjectByName('복음교회 금장 간판');assert.ok(face);assert.equal(face.material.map.image.width,1536);assert.ok(sign.children.length>=7);
});
