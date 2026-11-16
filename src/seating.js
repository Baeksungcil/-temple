import {SEATS,roomAt,findPath,walkable} from './navigation.js';
import {WORLD_SCALE as S} from './world-scale.js';

export function planEmptySeat(position,occupied=new Set()){
 const room=roomAt(position.x,position.z);
 const seats=SEATS.filter(s=>!occupied.has(s.id)&&(room==='corridor'||s.room===room))
  .sort((a,b)=>Math.hypot(a.x-position.x,a.z-position.z)-Math.hypot(b.x-position.x,b.z-position.z));
 for(const seat of seats){
  const approach={x:seat.x,z:seat.z-1.15*S};if(!walkable(approach.x,approach.z))continue;
  const path=findPath(position,approach);if(path.length)return {seat,approach,path};
 }
 return null;
}
