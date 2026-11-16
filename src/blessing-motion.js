import {walkable,roomAt,ROOMS} from './navigation.js';

export const PRIEST_RADIUS=.20;
export function priestClear(p,people=[]){
 for(let i=0;i<12;i++){const a=i*Math.PI/6;if(!walkable(p.x+Math.cos(a)*PRIEST_RADIUS,p.z+Math.sin(a)*PRIEST_RADIUS))return false;}
 return walkable(p.x,p.z)&&!people.some(o=>Math.hypot(p.x-o.x,p.z-o.z)<PRIEST_RADIUS+(o.radius??.55));
}
export function clearPriestSegment(a,b,people=[]){
 const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.1));
 for(let i=0;i<=n;i++)if(!priestClear({x:a.x+(b.x-a.x)*i/n,z:a.z+(b.z-a.z)*i/n},people))return false;
 return true;
}
export function priestPath(start,end,people=[]){
 if(!priestClear(start,people)||!priestClear(end,people))return [];
 if(clearPriestSegment(start,end,people))return [{...end}];
 const step=.35,key=p=>p.ix+','+p.iz,world=p=>({x:start.x+p.ix*step,z:start.z+p.iz*step});
 const first={ix:0,iz:0,g:0,f:0},open=[first],costs=new Map([['0,0',0]]),closed=new Set();
 let found,iterations=0;
 while(open.length&&iterations++<24000){
  open.sort((a,b)=>b.f-a.f);const node=open.pop(),k=key(node);if(closed.has(k))continue;closed.add(k);const p=world(node);
  if(Math.hypot(p.x-end.x,p.z-end.z)<.65&&clearPriestSegment(p,end,people)){found=node;break;}
  for(const dx of [-1,0,1])for(const dz of [-1,0,1]){
   if(!dx&&!dz)continue;const next={ix:node.ix+dx,iz:node.iz+dz},nk=key(next);if(closed.has(nk))continue;
   const q=world(next),g=node.g+Math.hypot(dx,dz)*step;if(g>=(costs.get(nk)??Infinity)||!clearPriestSegment(p,q,people))continue;
   next.g=g;next.f=g+Math.hypot(q.x-end.x,q.z-end.z);next.parent=node;costs.set(nk,g);open.push(next);
  }
 }
 if(!found)return [];
 const raw=[{...end}];for(let n=found;n;n=n.parent)raw.unshift(world(n));
 const path=[];let i=0;while(i<raw.length-1){let j=raw.length-1;while(j>i+1&&!clearPriestSegment(raw[i],raw[j],people))j--;path.push(raw[j]);i=j;}return path;
}
export function blessingFront(p,people=[]){
 const forward={x:-Math.sin(p.yaw),z:-Math.cos(p.yaw)};
 // Seated visitors face the front of their pew; keep both feet outside its footprint.
 const distances=p.seated?[1.88,1.90]:[1.28,1.30];
 for(const d of distances){const point={x:p.x+forward.x*d,z:p.z+forward.z*d};if(priestClear(point,people))return point;}
 return null;
}
export function blessingApproach(p,end,people=[]){
 const room=ROOMS.find(r=>r.id===roomAt(p.x,p.z))||ROOMS[0];
 const candidates=[{x:room.cx,z:Math.max(room.minZ+1,Math.min(room.maxZ-1,end.z-4))}];
 for(const distance of [5,4,3])for(let i=0;i<12;i++){const a=i*Math.PI/6;candidates.push({x:end.x+Math.cos(a)*distance,z:end.z+Math.sin(a)*distance});}
 for(const start of candidates){if(Math.hypot(start.x-end.x,start.z-end.z)<2.5)continue;const path=priestPath(start,end,people);if(path.length)return {start,path};}
 return null;
}
