import * as THREE from 'three';
import {PEW_ROWS,LAYOUT_ROOMS as ROOMS,SIDE_ROWS} from './navigation.js';
// Local, deliberately placed light sources. HDRI supplies fill rather than flattening the room.
export function createInteriorLighting(scene,renderer){
 renderer.toneMappingExposure=.9;
 const daylight=[],practicals=[];
 const visitorFill=new THREE.DirectionalLight('#ffe9d4',.6);visitorFill.layers.set(1);scene.add(visitorFill,visitorFill.target);

 function spot(color,intensity,pos,target,angle,shadow=false){const light=new THREE.SpotLight(color,intensity,65,angle,.65,2);light.position.set(...pos);light.target.position.set(...target);light.castShadow=shadow;if(shadow){light.shadow.mapSize.set(1536,1536);light.shadow.bias=-.00015;light.shadow.normalBias=.025;light.shadow.camera.near=.5;light.shadow.camera.far=60;light.shadow.focus=1;}scene.add(light,light.target);return light;}
 // High side windows produce directional pools, soft shadows and warm/cool separation.
 daylight.push(spot('#fff0d8',1750,[10.8,9,17],[-3,0,10],.72,true));
 daylight.push(spot('#d6e5ff',1450,[-10.8,9,-3],[3,0,-10],.8));
 const altar=spot('#ffcc8a',1550,[0,11,-27],[0,2,-22],.75);practicals.push(altar);
 for(const x of [-34,34]){daylight.push(spot('#e5edff',1100,[x+9,8,13],[x-2,0,4],.85));const fill=new THREE.PointLight('#ffca85',140,27,2);fill.position.set(x,7,-5);scene.add(fill);practicals.push(fill);}
 const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d'),g=ctx.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(24,15,10,.32)');g.addColorStop(.5,'rgba(24,15,10,.17)');g.addColorStop(1,'rgba(24,15,10,0)');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);const ao=new THREE.CanvasTexture(c);
 function contact(x,z,w,d){const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshBasicMaterial({map:ao,transparent:true,depthWrite:false,opacity:.85}));mesh.rotation.x=-Math.PI/2;mesh.position.set(x,.061,z);mesh.renderOrder=1;scene.add(mesh);}
 for(const z of PEW_ROWS)for(const side of [-1,1])contact(side*5.6,z,5.4,2.7);
 for(const room of ROOMS.slice(1))for(const z of SIDE_ROWS)for(const side of [-1,1])contact(room.cx+side*4,z,4.2,2.7);
 // Warm emissive window reveals remain visible without expensive volumetric passes.
 const windowMat=new THREE.MeshBasicMaterial({color:'#ffe1a6',transparent:true,opacity:.16,depthWrite:false});
 for(const side of [-1,1])for(const z of [18,10,2,-6]){const pool=new THREE.Mesh(new THREE.PlaneGeometry(2.6,7),windowMat);pool.rotation.x=-Math.PI/2;pool.rotation.z=side*.38;pool.position.set(side*6,.065,z);scene.add(pool);}
 return{update(d){const visitor=scene.getObjectByName('visitor');if(visitor){visitor.traverse(o=>o.layers.enable(1));visitorFill.position.copy(visitor.position).add(new THREE.Vector3(2,5,6));visitorFill.target.position.copy(visitor.position).add(new THREE.Vector3(0,1.5,0));} daylight.forEach((l,i)=>l.intensity=1.8*[1750,1450,1100,1100][i]*(.08+.92*d));practicals.forEach((l,i)=>l.intensity=1.1*(i===0?1550:140)*(1.15-.25*d));scene.environmentIntensity=.035+.065*d;renderer.toneMappingExposure=.68+.04*(1-d);document.querySelector('#scene').dataset.lightProfile=d>.6?'day':d<.2?'night':'dusk';}};
}
