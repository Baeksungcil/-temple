import * as THREE from 'three';
import {ROOMS} from './navigation.js';

export function createSnow(scene){
 const count=2400,positions=new Float32Array(count*3),speeds=new Float32Array(count),starts=new Float32Array(count*2);let seed=401;
 const random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
 for(let i=0;i<count;i++){const room=ROOMS[i%ROOMS.length],x=room.minX+random()*(room.maxX-room.minX),z=room.minZ+random()*(room.maxZ-room.minZ);positions.set([x,.3+random()*16,z],i*3);starts.set([x,z],i*2);speeds[i]=.32+random()*.38;}
 const pixels=new Uint8Array(32*32*4);for(let y=0;y<32;y++)for(let x=0;x<32;x++){const d=Math.hypot(x-15.5,y-15.5)/15.5,k=(y*32+x)*4;pixels[k]=pixels[k+1]=pixels[k+2]=255;pixels[k+3]=Math.round(255*Math.max(0,1-d)**1.3);}
 const texture=new THREE.DataTexture(pixels,32,32,THREE.RGBAFormat);texture.needsUpdate=true;
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
 const material=new THREE.PointsMaterial({color:'#f2f8ff',map:texture,size:.42,transparent:true,opacity:.9,depthWrite:false,sizeAttenuation:true});
 const flakes=new THREE.Points(geometry,material);flakes.name='falling Christmas snow';flakes.userData.noNavigation=true;flakes.frustumCulled=false;scene.add(flakes);
 const reduced=globalThis.matchMedia?.('(prefers-reduced-motion:reduce)').matches;let time=0;
 return{flakes,update(dt){if(reduced)return;time+=dt;for(let i=0;i<count;i++){positions[i*3]=starts[i*2]+.3*Math.sin(time*.35+i);positions[i*3+1]-=speeds[i]*dt;if(positions[i*3+1]<.1)positions[i*3+1]=16;positions[i*3+2]=starts[i*2+1]+.2*Math.sin(time*.2+i*.6);}geometry.attributes.position.needsUpdate=true;}};
}
