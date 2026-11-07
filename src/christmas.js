import {ROOM_TREES} from './navigation.js';
import * as THREE from 'three';
// Original procedural holiday decorations; no external assets or downloads.
export function decorateChristmas(scene){
 const group=new THREE.Group();group.name='Christmas decorations';scene.add(group);
 const green=new THREE.MeshStandardMaterial({color:'#173f30',roughness:.92}),red=new THREE.MeshStandardMaterial({color:'#a52231',roughness:.72}),gold=new THREE.MeshStandardMaterial({color:'#e3b86d',roughness:.55,metalness:.1}),wood=new THREE.MeshStandardMaterial({color:'#5d3c28',roughness:1}),glow=new THREE.MeshBasicMaterial({color:'#ffe6ad'});
 const twinkle=Array.from({length:6},(_,i)=>new THREE.MeshBasicMaterial({color:['#ffe6ad','#ffc8a4','#bde6ff','#ffedba','#d1f5d5','#ffd6b8'][i],toneMapped:false}));const colors=twinkle.map(m=>m.color.clone());let bulb=0;const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
 function add(geometry,material,x,y,z){if(material===glow)material=twinkle[bulb++%twinkle.length];const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh;}
 function star(x,y,z,size){const shape=new THREE.Shape();for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,r=i%2?size*.44:size;const px=Math.cos(a)*r,py=Math.sin(a)*r;i?shape.lineTo(px,py):shape.moveTo(px,py);}shape.closePath();return add(new THREE.ShapeGeometry(shape),glow,x,y,z);}
 function tree(x,z,size=1){add(new THREE.CylinderGeometry(.22,.3,.65,8),wood,x,.32,z);for(let k=0;k<4;k++)add(new THREE.ConeGeometry((1.12-k*.23)*size,1.35*size,12),green,x,(1.12+k*.72)*size,z);star(x,4.05*size,z,.33*size);for(let k=0;k<4;k++)for(let i=0;i<9;i++){const a=i/9*Math.PI*2+k*.6,r=(.98-k*.21)*size;add(new THREE.SphereGeometry(.095*size,7,5),i%3===0?red:i%3===1?gold:glow,x+Math.cos(a)*r,(.82+k*.72)*size,z+Math.sin(a)*r);}for(const dx of [-.6,.45]){const p=add(new THREE.BoxGeometry(.55,.45,.5),dx<0?red:gold,x+dx,.24,z+.4);add(new THREE.BoxGeometry(.07,.46,.51),dx<0?gold:red,p.position.x,.24,p.position.z);} }
 let treeCount=0;function placedTree(x,z,size){const start=group.children.length;tree(x,z,size);const factor=1.32;for(const mesh of group.children.slice(start)){mesh.position.x=x+(mesh.position.x-x)*factor;mesh.position.z=z+(mesh.position.z-z)*factor;mesh.position.y*=factor;mesh.scale.multiplyScalar(factor);}treeCount++;}
 placedTree(-7.8,-27,1.45);placedTree(7.8,-27,1.45);placedTree(-10.8,20,.85);placedTree(10.8,20,.85);
 // Small trees at column bases, within existing column collision footprints.
 for(const z of [14,6,-2,-10])for(const side of [-1,1])placedTree(side*9,z,.63);
 // Room corners stay outside the side-room walkable bounds.
 for(const cx of [-34,34])for(const side of [-1,1])for(const z of [-14.4,26.4])placedTree(cx+side*10.6,z,.64);
 // Large room trees stay below the ceiling and have four dense spiral light strings.
 for(const t of ROOM_TREES){
  placedTree(t.x,t.z,t.size);
  const factor=1.32*t.size;
  for(let tier=0;tier<4;tier++)for(let i=0;i<36;i++){
   const fraction=.06+i/36*.86,angle=i/36*Math.PI*5+tier*.6;
   const radius=((1.12-tier*.23)*(1-fraction)+.045)*factor;
   add(new THREE.SphereGeometry(.065*factor,7,5),glow,t.x+Math.cos(angle)*radius,(.445+tier*.72+fraction*1.35)*factor,t.z+Math.sin(angle)*radius);
  }
 }
 document.querySelector('#scene').dataset.largeRoomTrees=String(ROOM_TREES.length);
 document.querySelector('#scene').dataset.roomTreeBulbs=String(ROOM_TREES.length*144);
 function wreath(x,y,z,r=.6){const w=add(new THREE.TorusGeometry(r,.16,7,20),green,x,y,z);for(let i=0;i<10;i++){const a=i/10*Math.PI*2;add(new THREE.SphereGeometry(.055,6,4),glow,x+Math.cos(a)*r,y+Math.sin(a)*r,z+.14);}const l=add(new THREE.ConeGeometry(.22,.4,3),red,x-.17,y-r*.65,z+.19);l.rotation.z=-Math.PI/2;const rr=add(l.geometry,red,x+.17,y-r*.65,z+.19);rr.rotation.z=Math.PI/2;return w;}
 for(const z of [14,6,-2,-10])for(const side of [-1,1])wreath(side*9,4.9,z+1.25,.8);
 // Draped green garland and warm bulbs across the front of the altar canopy.
 const points=[];for(let i=0;i<=30;i++){const t=i/30;points.push(new THREE.Vector3(-4.3+8.6*t,8.9-Math.sin(t*Math.PI)*.75,-17.5));}add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),40,.14,6,false),green,0,0,0);for(let i=0;i<19;i++){const t=i/18;add(new THREE.SphereGeometry(.065,6,4),glow,-4.3+8.6*t,8.9-Math.sin(t*Math.PI)*.75,-17.32);}wreath(0,8,-17.3,.75);star(0,10.2,-17.3,.5);

 // Red-and-gold aisle bows attached to existing pews, away from walking lanes.
 for(const z of [18,15,12,3,0,-3,-6])for(const side of [-1,1]){const x=side*3.65;const bow=add(new THREE.ConeGeometry(.18,.32,3),red,x-.13,1.7,z+.56);bow.rotation.z=-Math.PI/2;const other=add(bow.geometry,red,x+.13,1.7,z+.56);other.rotation.z=Math.PI/2;add(new THREE.SphereGeometry(.09,7,5),gold,x,1.7,z+.6);}
 // Repeating overhead swags and stars create a festive canopy without floor obstacles.
 for(const z of [18,10,2,-6]){const curve=[];for(let i=0;i<=24;i++){const t=i/24;curve.push(new THREE.Vector3(-8.6+17.2*t,8.8-Math.sin(t*Math.PI)*1.15,z));}add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(curve),28,.09,5,false),green,0,0,0);for(let i=0;i<23;i++){const t=i/22;add(new THREE.SphereGeometry(.065,6,4),glow,-8.6+17.2*t,8.8-Math.sin(t*Math.PI)*1.15,z+.12);}star(0,7.05,z,.3);for(const x of [-4.3,4.3])add(new THREE.SphereGeometry(.17,8,6),red,x,7.7,z);}
 document.querySelector('#scene').dataset.christmasTrees=String(treeCount);
 group.updateMatrixWorld(true);const batches=new Map();for(const mesh of [...group.children]){const key=mesh.geometry.type+JSON.stringify(mesh.geometry.parameters)+mesh.material.uuid;const list=batches.get(key)||[];list.push(mesh);batches.set(key,list);}for(const list of batches.values()){if(list.length<3)continue;const instanced=new THREE.InstancedMesh(list[0].geometry,list[0].material,list.length);instanced.castShadow=true;instanced.receiveShadow=true;for(let i=0;i<list.length;i++){instanced.setMatrixAt(i,list[i].matrix);group.remove(list[i]);}instanced.computeBoundingSphere();group.add(instanced);}group.traverse(o=>o.userData.noNavigation=true);
 document.querySelector('#scene').dataset.decorations='christmas';
 return{group,update(time){for(let i=0;i<twinkle.length;i++){const brightness=reduced?1:.2+1.7*Math.pow(.5+.5*Math.sin(time*(1.8+i*.17)+i*1.13),2);twinkle[i].color.copy(colors[i]).multiplyScalar(brightness);}document.querySelector('#scene').dataset.twinkleSample=twinkle[0].color.r.toFixed(3);}};
}
