import * as THREE from 'three';
import {WORLD_SCALE as S} from './world-scale.js';

export function decorateChoir(scene){
 const group=new THREE.Group();group.name='Choir Christmas display';scene.add(group);
 const green=new THREE.MeshStandardMaterial({color:'#174d35',roughness:.85}),red=new THREE.MeshStandardMaterial({color:'#ad243d',roughness:.6}),gold=new THREE.MeshStandardMaterial({color:'#e9bd65',roughness:.45,metalness:.2});
 const colors=['#ffe5a1','#ffa7ac','#b9e5ff','#ffe8bd','#c4f7cb','#ffd2a0'];const lights=colors.map(c=>new THREE.MeshBasicMaterial({color:c,toneMapped:false}));
 const ball=new THREE.SphereGeometry(.075,7,5);let bulb=0;
 function add(geometry,material,x,y,z){const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);group.add(mesh);return mesh;}
 function glow(x,y,z){add(ball,lights[bulb++%lights.length],x,y,z);}
 function star(x,y,z,r){const shape=new THREE.Shape();for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,d=i%2?r*.45:r;i?shape.lineTo(Math.cos(a)*d,Math.sin(a)*d):shape.moveTo(Math.cos(a)*d,Math.sin(a)*d);}shape.closePath();add(new THREE.ShapeGeometry(shape),lights[0],x,y,z);}
 for(const side of [-1,1]){
  const x=side*4.2*S,z=-16.9*S;
  for(let k=0;k<4;k++)add(new THREE.ConeGeometry(1.25-k*.22,1.65,12),green,x,1.1+k*.82,z);
  for(let k=0;k<4;k++)for(let i=0;i<12;i++){const a=i/12*Math.PI*2+k*.4,r=1.1-k*.21;const px=x+Math.cos(a)*r,py=.9+k*.82,pz=z+Math.sin(a)*r;if(i%2)glow(px,py,pz);else add(new THREE.SphereGeometry(.1,7,5),i%4?red:gold,px,py,pz);}
  star(x,4.5,z,.36);
  for(let i=0;i<3;i++){const gift=add(new THREE.BoxGeometry(.65,.5,.6),i%2?gold:red,x+(i-1)*.7,.27,z+.9);add(new THREE.BoxGeometry(.08,.52,.62),i%2?red:gold,gift.position.x,.27,gift.position.z);}
  const wreath=add(new THREE.TorusGeometry(.54,.15,7,24),green,side*3.1*S,3.5,-17.75*S);for(let i=0;i<12;i++){const a=i/12*Math.PI*2;glow(wreath.position.x+Math.cos(a)*.55,3.5+Math.sin(a)*.55,-17.75*S+.13);}
 }
 const curve=[];for(let i=0;i<=36;i++){const t=i/36;curve.push(new THREE.Vector3((-3.8+7.6*t)*S,4.8-.65*Math.sin(t*Math.PI),-17.8*S));}
 add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(curve),40,.1,6,false),green,0,0,0);
 for(let i=0;i<35;i++){const t=i/34;glow((-3.8+7.6*t)*S,4.8-.65*Math.sin(t*Math.PI),-17.8*S+.15);}
 for(const x of [-2.8,-1.4,0,1.4,2.8])star(x*S,4.8-Math.abs(x)*.08,-17.65*S,x===0?.35:.2);
 // Shared geometries/materials are batched to keep the extra ornaments inexpensive.
 group.updateMatrixWorld(true);const batches=new Map();for(const mesh of [...group.children]){const key=mesh.geometry.type+JSON.stringify(mesh.geometry.parameters)+mesh.material.uuid;const list=batches.get(key)||[];list.push(mesh);batches.set(key,list);}
 for(const list of batches.values()){if(list.length<3)continue;const batch=new THREE.InstancedMesh(list[0].geometry,list[0].material,list.length);list.forEach((mesh,i)=>{batch.setMatrixAt(i,mesh.matrix);group.remove(mesh);});batch.computeBoundingSphere();group.add(batch);}
 group.traverse(o=>o.userData.noNavigation=true);
 const reduced=globalThis.matchMedia?.('(prefers-reduced-motion:reduce)').matches;
 return{update(t){lights.forEach((m,i)=>m.color.set(colors[i]).multiplyScalar(reduced?1:.3+1.5*Math.pow(.5+.5*Math.sin(t*(1.5+i*.13)+i),2)));}};
}
