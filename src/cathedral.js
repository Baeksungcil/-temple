import {addStainedWindow} from './stained-glass.js';
import * as THREE from 'three';
import {PEW_ROWS} from './navigation.js';
export function createCathedral(scene) {
 const mat=c=>new THREE.MeshToonMaterial({color:c});
 const ivory=mat('#e8dcc2'),cream=mat('#f5e8cb'),gold=mat('#c89b46'),bronze=mat('#493421'),rose=mat('#ac7565'),green=mat('#73867a'),dark=mat('#3a3029'),ochre=mat('#aa7d3d');
 function mesh(g,m,x,y,z){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;scene.add(o);return o;}
 const box=(w,h,d,m,x,y,z)=>mesh(new THREE.BoxGeometry(w,h,d),m,x,y,z);
 const cylinder=(r,h,m,x,y,z)=>mesh(new THREE.CylinderGeometry(r,r,h,12),m,x,y,z);
 const ball=(r,m,x,y,z)=>mesh(new THREE.SphereGeometry(r,12,8),m,x,y,z);
 function arch(r,t,m,x,y,z,side=false){const o=mesh(new THREE.TorusGeometry(r,t,6,36,Math.PI),m,x,y,z);if(side)o.rotation.y=Math.PI/2;return o;}
 box(26,.3,66,ivory,0,-.2,-5);
 const floor=new THREE.InstancedMesh(new THREE.BoxGeometry(2.65,.035,2.65),ivory,160),dummy=new THREE.Object3D();let n=0;
 for(let x=-4;x<=3;x++)for(let j=0;j<20;j++){dummy.position.set(x*3+1.5,0,23-j*3);dummy.updateMatrix();floor.setMatrixAt(n,dummy.matrix);floor.setColorAt(n,new THREE.Color((x+j)%2?'#c8b99e':'#f1e7ce'));n++;}floor.receiveShadow=true;scene.add(floor);
 for(let z=20;z>=-25;z-=6){box(4.6,.006,4.6,gold,0,.023,z);box(4.25,.006,4.25,green,0,.027,z);const diamond=box(2.7,.006,2.7,ivory,0,.031,z);diamond.rotation.y=Math.PI/4;cylinder(1.15,.006,rose,0,.035,z);}
 for(const x of [-6,6])box(.13,.05,61,gold,x,.04,-4);
 for(const side of [-1,1]){
  box(.6,11,42.5,ivory,side*12.7,5.4,-16.25);box(.6,11,16.5,ivory,side*12.7,5.4,19.25);box(.6,6,6,ivory,side*12.7,8,8);box(2.4,.4,65,gold,side*9,10,-5);box(2.6,.4,65,cream,side*9,9.6,-5);

  for(let z=22;z>=-28;z-=8){
   box(2.1,.5,2.1,cream,side*9,.25,z);box(1.7,9,1.7,ivory,side*9,4.9,z);box(2.1,.5,2.1,gold,side*9,9.35,z);
   for(const dx of [-.48,0,.48])cylinder(.075,8.2,cream,side*9+dx,4.9,z+.89);
   arch(3.1,.3,cream,side*9,6.4,z-4,true);arch(3.1,.08,gold,side*9,6.4,z-4,true);
   box(.85,.7,.8,gold,side*9,1.1,z+1);mesh(new THREE.ConeGeometry(.36,1.5,8),cream,side*9,2.15,z+1);ball(.23,cream,side*9,3.06,z+1);const arm=box(.15,.75,.17,cream,side*9+.35,2.55,z+1);arm.rotation.z=-.25;
   addStainedWindow(scene,{x:side*12.32,y:5.25,z:z-3.5,width:4.1,height:4.85,rotation:-side*Math.PI/2});
  }
 }
 const vertices=[],indices=[],segments=32;
 for(let j=0;j<=1;j++)for(let i=0;i<=segments;i++){const a=i/segments*Math.PI;vertices.push(Math.cos(a)*9,10+Math.sin(a)*8,j?26:-10);}
 for(let i=0;i<segments;i++){const a=i,b=i+segments+1;indices.push(a,b,a+1,b,b+1,a+1);}
 const geom=new THREE.BufferGeometry();geom.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geom.setIndex(indices);geom.computeVertexNormals();const vault=gold.clone();vault.side=THREE.DoubleSide;mesh(geom,vault,0,0,0);
 for(let z=24;z>=-8;z-=4){const rib=arch(9,.13,cream,0,10,z);rib.scale.y=8/9;for(let i=1;i<10;i++){const a=i/10*Math.PI;const panel=box(1.45,.1,2.8,ochre,Math.cos(a)*8.88,10+Math.sin(a)*7.86,z-2);panel.rotation.z=a-Math.PI/2;}}
 for(let i=1;i<10;i++){const a=i/10*Math.PI;box(.1,.1,36,cream,Math.cos(a)*8.9,10+Math.sin(a)*7.9,8);}
 // The upper dome opens over the crossing; the long nave vault remains before it.
 const drumMat=ivory.clone();drumMat.side=THREE.DoubleSide;mesh(new THREE.CylinderGeometry(9,9,5,48,1,true,Math.PI/3,Math.PI*4/3),drumMat,0,12.5,-19);for(const y of [10,15]){const ring=mesh(new THREE.TorusGeometry(9,.2,6,48),gold,0,y,-19);ring.rotation.x=Math.PI/2;}arch(9,.28,cream,0,10,-10);const drumGlass=new THREE.MeshStandardMaterial({color:'#f8e6ad',emissive:'#ffe6a0',emissiveIntensity:.4});for(let i=0;i<=8;i++){const a=Math.PI/3+i/8*Math.PI*4/3;const pane=box(1.1,2.4,.1,drumGlass,Math.sin(a)*8.88,12.5,-19+Math.cos(a)*8.88);pane.rotation.y=a;}const domeMat=mat('#9baea4');domeMat.side=THREE.BackSide;mesh(new THREE.SphereGeometry(9,32,16,0,Math.PI*2,0,Math.PI/2),domeMat,0,15,-19);
 for(let i=0;i<16;i++){const a=i/16*Math.PI*2,points=[];for(let j=0;j<=16;j++){const t=j/16*Math.PI/2;points.push(new THREE.Vector3(Math.cos(a)*Math.sin(t)*8.93,15+Math.cos(t)*8.93,-19+Math.sin(a)*Math.sin(t)*8.93));}mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),20,.08,4,false),gold,0,0,0);}
 box(25,15,.6,ivory,0,7.4,-34);arch(7,.55,gold,0,7,-33.5);
 addStainedWindow(scene,{x:0,y:7.35,z:-33.1,width:4.3,height:4.3,project:false});
 
 box(.2,2.2,.2,cream,0,9.5,-32.7);box(1.15,.2,.2,cream,0,9.85,-32.7);
 for(let i=0;i<3;i++)box(12-i*.7,.22,11-i*.7,rose,0,.12+i*.22,-22);
 box(3.9,1.25,1.8,gold,0,1.3,-22);box(4.3,.2,2.1,cream,0,2,-22);
 for(const x of [-3.2,3.2])for(const z of [-18.5,-25]){
  box(1.05,.65,1.05,bronze,x,1.1,z);cylinder(.32,7.1,bronze,x,4.9,z);const points=[];
  for(let i=0;i<=96;i++){const a=i/96*Math.PI*12;points.push(new THREE.Vector3(x+Math.cos(a)*.32,1.45+i/96*6.9,z+Math.sin(a)*.32));}
  mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),96,.09,5,false),gold,0,0,0);box(1,.45,1,gold,x,8.6,z);
 }
 box(7.6,.65,7.8,bronze,0,9.1,-21.7);box(7.9,.13,8.1,gold,0,9.5,-21.7);
 for(const side of [-1,1]){const points=[];for(let i=0;i<=20;i++){const t=i/20;points.push(new THREE.Vector3(side*(3.5*(1-t)),9.6+3.2*t*t,-21.7));}mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),20,.18,6,false),bronze,0,0,0);}
 ball(.3,gold,0,12.8,-21.7);box(.12,1,.12,gold,0,13.4,-21.7);box(.65,.12,.12,gold,0,13.55,-21.7);
 for(const side of [-1,1])for(const z of PEW_ROWS){box(4,.18,.8,bronze,side*5.6,.85,z);box(4,1,.15,bronze,side*5.6,1.25,z+.45);for(const dx of [-1.5,1.5])box(.18,.8,.7,dark,side*5.6+dx,.4,z);}
 const lamps=[],candleMat=new THREE.MeshStandardMaterial({color:'#fff0c4',emissive:'#ffb94f',emissiveIntensity:1.5});
 for(const side of [-1,1])for(const z of [-6]){cylinder(.12,2.7,gold,side*7.4,1.6,z);for(const dx of [-.4,0,.4]){cylinder(.08,.6,cream,side*7.4+dx,3,z);ball(.1,candleMat,side*7.4+dx,3.38,z);}const light=new THREE.PointLight('#ffd18a',30,15,2);light.position.set(side*7.4,4,z);scene.add(light);lamps.push(light);}
 const altarLight=new THREE.PointLight('#ffe0a3',85,28,2);altarLight.position.set(0,9,-28);scene.add(altarLight);
 return {lamps};
}
