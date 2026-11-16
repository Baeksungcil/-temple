import {createChurchSign} from './church-sign.js';
import {addStainedWindow} from './stained-glass.js';
import * as THREE from 'three';
import {LAYOUT_ROOMS as ROOMS,SIDE_ROWS} from './navigation.js';
function marble(){const c=document.createElement('canvas');c.width=c.height=1024;const ctx=c.getContext('2d');ctx.fillStyle='#e4e2dd';ctx.fillRect(0,0,1024,1024);for(let i=0;i<130;i++){ctx.beginPath();ctx.lineWidth=.3+(i%4)*.3;ctx.strokeStyle='rgba(95,85,72,'+(.03+(i%3)*.025)+')';for(let x=0;x<=1024;x+=8){const y=i*9+Math.sin(x*.009+i)*25+Math.sin(x*.03+i*.8)*5;if(x===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;}
export function upgradeInterior(scene){const textures=marble(),cache=new Map();scene.traverse(o=>{if(!o.isMesh)return;const convert=m=>{if(!m.isMeshToonMaterial)return m;if(!cache.has(m.uuid)){const dark=m.color.getHSL({}).l<.38;const n=new THREE.MeshStandardMaterial({color:m.color.clone(),map:dark?null:textures,bumpMap:dark?null:textures,bumpScale:.045,roughness:dark?.8:.86,metalness:0,side:m.side});n.name='Matte architectural stone';cache.set(m.uuid,n);}return cache.get(m.uuid);};o.material=Array.isArray(o.material)?o.material.map(convert):convert(o.material);});}
export function createCampus(scene){
 const stone=new THREE.MeshStandardMaterial({color:'#e1d5bf',roughness:.95,map:marble()}),gold=new THREE.MeshStandardMaterial({color:'#ac8852',roughness:.95}),wood=new THREE.MeshStandardMaterial({color:'#634d3e',roughness:.98}),glass=new THREE.MeshStandardMaterial({color:'#c8dce6',emissive:'#d4e6f1',emissiveIntensity:.35,roughness:1});
 function box(w,h,d,m,x,y,z){const a=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);a.position.set(x,y,z);a.castShadow=true;a.receiveShadow=true;scene.add(a);return a;}
 function label(text,x,y,z,angle=0){const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#eee4cd';ctx.fillRect(0,0,512,128);ctx.strokeStyle='#ac8852';ctx.lineWidth=8;ctx.strokeRect(8,8,496,112);ctx.fillStyle='#493a2b';ctx.font='bold 48px sans-serif';ctx.textAlign='center';ctx.fillText(text,256,82);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const a=new THREE.Mesh(new THREE.PlaneGeometry(4,1),new THREE.MeshBasicMaterial({map:t,side:THREE.DoubleSide}));a.name='room sign '+text;a.position.set(x,y,z);a.rotation.y=angle;scene.add(a);}
 createChurchSign(scene);
 for(const room of ROOMS.slice(1)){const cx=room.cx;
  box(22,.2,42,stone,cx,-.12,6);box(22,.3,42,stone,cx,10.9,6);
  box(.4,11,42,stone,cx+(cx<0?-10.8:10.8),5.4,6);
  const entry=cx+(cx<0?10.8:-10.8);box(.4,11,19,stone,entry,5.4,-4.5);box(.4,11,16,stone,entry,5.4,19);box(.4,6,6,stone,entry,8,8);
  box(22,11,.4,stone,cx,5.4,-14.8);box(22,11,.4,stone,cx,5.4,26.8);
  for(let z=-12;z<=24;z+=6){for(const side of [-1,1]){box(.5,9,.6,gold,cx+side*10.4,4.5,z);addStainedWindow(scene,{x:cx+side*10.55,y:4.3,z:z+2.5,width:3.5,height:4.6,rotation:-side*Math.PI/2});}box(21,.22,.22,gold,cx,10.3,z);}
  for(let x=-9;x<=9;x+=3)box(.14,.15,41,gold,cx+x,10.3,6);
  for(const z of SIDE_ROWS)for(const side of [-1,1]){box(2.8,.18,.8,wood,cx+side*4,.85,z);box(2.8,1,.15,wood,cx+side*4,1.25,z+.45);for(const dx of [-1,1])box(.18,.8,.7,wood,cx+side*4+dx,.4,z);}
  for(let z=-12;z<=24;z+=4)for(let x=-8;x<=8;x+=4)box(3.85,.012,3.85,(x+z)%8?stone:gold,cx+x,.015,z);
  label(room.name,cx,9.2,-14.5);
  if(room.id==='prayer'){box(.2,3,.2,gold,cx,4.8,-14.3);box(1.7,.2,.2,gold,cx,5.3,-14.3);box(4.5,1.2,2,stone,cx,.65,-12);}
  
 }
 for(const side of [-1,1]){box(13.5,.2,6.4,stone,side*17.8,-.12,8);box(13.5,.3,6.4,stone,side*17.8,5.4,8);for(const z of [4.8,11.2])box(13.5,5.5,.3,stone,side*17.8,2.7,z);label(side<0?'기도실 ←':'→ 고해성사실',side*10.7,6.3,8,-side*Math.PI/2);}
}
export function batchArchitecture(scene){
 scene.updateMatrixWorld(true);const groups=new Map();
 for(const mesh of [...scene.children]){if(!mesh.isMesh||mesh.isInstancedMesh||Array.isArray(mesh.material)||mesh.material.transparent)continue;const key=mesh.geometry.type+JSON.stringify(mesh.geometry.parameters||mesh.geometry.uuid)+mesh.material.uuid;const list=groups.get(key)||[];list.push(mesh);groups.set(key,list);}
 for(const list of groups.values()){if(list.length<3)continue;const first=list[0],instances=new THREE.InstancedMesh(first.geometry,first.material,list.length);instances.castShadow=list.some(m=>m.castShadow);instances.receiveShadow=list.some(m=>m.receiveShadow);for(let i=0;i<list.length;i++){instances.setMatrixAt(i,list[i].matrixWorld);scene.remove(list[i]);}instances.computeBoundingSphere();scene.add(instances);}
}
