import {WORLD_SCALE as S} from './world-scale.js';
import * as THREE from 'three';
import {OBSTACLES,LAYOUT_ROOMS as ROOMS} from './navigation.js';
const box=(minX,maxX,minZ,maxZ,height=11,minY=0)=>new THREE.Box3(new THREE.Vector3(minX,minY,minZ),new THREE.Vector3(maxX,height,maxZ));
export const CAMERA_WALLS=[];
for(const side of [-1,1]){
 const x=side*12.7;CAMERA_WALLS.push(box(x-.3,x+.3,-37.5,5),box(x-.3,x+.3,11,27.5),box(x-.3,x+.3,5,11,11,5));
 const a=Math.min(side*11,side*24.5),b=Math.max(side*11,side*24.5);CAMERA_WALLS.push(box(a,b,4.65,4.95,5.5),box(a,b,11.05,11.35,5.5));
}
for(const room of ROOMS.slice(1)){
 const outer=room.cx+(room.cx<0?-10.8:10.8),inner=room.cx+(room.cx<0?10.8:-10.8);
 CAMERA_WALLS.push(box(outer-.2,outer+.2,-15,27),box(inner-.2,inner+.2,-15,5),box(inner-.2,inner+.2,11,27),box(inner-.2,inner+.2,5,11,11,5),box(room.cx-11,room.cx+11,-15,-14.6),box(room.cx-11,room.cx+11,26.6,27));
}
for(const wall of CAMERA_WALLS){wall.min.x*=S;wall.min.z*=S;wall.max.x*=S;wall.max.z*=S;}for(const o of OBSTACLES)CAMERA_WALLS.push(box(o.minX,o.maxX,o.minZ,o.maxZ,o.height??(Math.abs((o.maxX-o.minX)/S-2.4)<.01?10:1.8)));
const direction=new THREE.Vector3(),hit=new THREE.Vector3(),ray=new THREE.Ray();
export function cameraPosition(target,wanted){
 direction.copy(wanted).sub(target);const distance=direction.length();if(distance<.01)return wanted.clone();direction.normalize();ray.set(target,direction);let allowed=distance;
 for(const wall of CAMERA_WALLS){if(wall.containsPoint(target))continue;if(ray.intersectBox(wall,hit)){const d=target.distanceTo(hit)-.3;if(d>0&&d<allowed)allowed=d;}}
 return target.clone().addScaledVector(direction,Math.max(.6,allowed));
}
