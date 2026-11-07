import {WORLD_SCALE as S} from './world-scale.js';
export const PEW_ROWS=Object.freeze([18,15,12,3,0,-3,-6]);
export const LAYOUT_ROOMS=Object.freeze([
{id:'nave',name:'본당',cx:0,minX:-11.4,maxX:11.4,minZ:-15.3,maxZ:23},
{id:'prayer',name:'기도실',cx:-34,minX:-44,maxX:-24,minZ:-14,maxZ:26},
{id:'fellowship',name:'고해성사실',cx:34,minX:24,maxX:44,minZ:-14,maxZ:26}]);
export const ROOMS=LAYOUT_ROOMS.map(r=>({...r,cx:r.cx*S,minX:r.minX*S,maxX:r.maxX*S,minZ:r.minZ*S,maxZ:r.maxZ*S}));
export const CORRIDORS=[{minX:-24,maxX:-11.4,minZ:5.3,maxZ:10.7},{minX:11.4,maxX:24,minZ:5.3,maxZ:10.7}].map(b=>Object.fromEntries(Object.entries(b).map(([k,v])=>[k,v*S])));
export const ROOM_TREES=LAYOUT_ROOMS.slice(1).map(room=>({room:room.id,x:room.cx+Math.sign(room.cx)*6.5,z:-10.5,radius:2.85,size:1.8}));
export const SIDE_ROWS=[18,12,6,0,-6];
export const SEATS=PEW_ROWS.flatMap(z=>[-1,1].flatMap(side=>[4.2,5.6,7].map(x=>({id:'nave:'+side+':'+z+':'+x,x:side*x,z,side,room:'nave'})))).concat(LAYOUT_ROOMS.slice(1).flatMap(room=>SIDE_ROWS.flatMap(z=>[-1,1].flatMap(side=>[-.8,0,.8].map(offset=>({id:room.id+':'+side+':'+z+':'+offset,x:room.cx+side*4+offset,z,side,room:room.id}))))));
export const OBSTACLES=PEW_ROWS.flatMap(z=>[-1,1].map(side=>({minX:side<0?-7.95:3.25,maxX:side<0?-3.25:7.95,minZ:z-.8,maxZ:z+.95}))).concat(LAYOUT_ROOMS.slice(1).flatMap(room=>SIDE_ROWS.flatMap(z=>[-1,1].map(side=>({minX:room.cx+side*4-1.8,maxX:room.cx+side*4+1.8,minZ:z-.8,maxZ:z+.95}))))).concat([-1,1].flatMap(side=>Array.from({length:7},(_,i)=>({minX:side*9-1.2,maxX:side*9+1.2,minZ:22-i*8-1.2,maxZ:22-i*8+1.2}))));
OBSTACLES.push(...ROOM_TREES.map(t=>({minX:t.x-t.radius,maxX:t.x+t.radius,minZ:t.z-t.radius,maxZ:t.z+t.radius,height:10.5})));
for(const seat of SEATS){seat.x*=S;seat.z*=S;}for(const o of OBSTACLES)for(const k of ['minX','maxX','minZ','maxZ'])o[k]*=S;
// Solid sides/back of the confession booth; the central entrance remains open.
OBSTACLES.push({minX:31.5*S,maxX:36.5*S,minZ:-11.35*S,maxZ:-11.05*S},...[-1,1].map(side=>({minX:(34+side*2.4)*S-.12,maxX:(34+side*2.4)*S+.12,minZ:-11.4*S,maxZ:-8.8*S})));
const inside=(p,x,z)=>x>=p.minX&&x<=p.maxX&&z>=p.minZ&&z<=p.maxZ;
export function roomAt(x,z){return ROOMS.find(r=>inside(r,x,z))?.id||'corridor';}
export function walkable(x,z){return Number.isFinite(x)&&Number.isFinite(z)&&[...ROOMS,...CORRIDORS].some(b=>inside(b,x,z))&&!OBSTACLES.some(b=>x>b.minX&&x<b.maxX&&z>b.minZ&&z<b.maxZ);}
export function moveWithCollision(position,dx,dz){let{x,z}=position;const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.15));for(let i=0;i<steps;i++){if(walkable(x+dx/steps,z))x+=dx/steps;if(walkable(x,z+dz/steps))z+=dz/steps;}return{x,z};}
export const SEAT_INTERACTION_DISTANCE=2.15*S;
export function nearestSeat(position,maxDistance=SEAT_INTERACTION_DISTANCE,isAvailable=()=>true){let found=null,best=maxDistance;for(const seat of SEATS){if(!isAvailable(seat))continue;const distance=Math.hypot(seat.x-position.x,seat.z-position.z);if(distance<=best){found=seat;best=distance;}}return found;}
export function smoothstep(t){t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);}

// A* on a half-metre grid; collision checks prevent cutting pew corners.
export function findPath(start,end){
 if(!walkable(end.x,end.z))return [];
 const clear=(a,b)=>{const n=Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.12);for(let i=0;i<=n;i++)if(!walkable(a.x+(b.x-a.x)*i/Math.max(n,1),a.z+(b.z-a.z)*i/Math.max(n,1)))return false;return true;};
 if(clear(start,end))return [end];
 const key=p=>p.x+','+p.z,round=p=>({x:Math.round(p.x*2)/2,z:Math.round(p.z*2)/2}),s=round(start),e=round(end);if(!walkable(s.x,s.z)||!walkable(e.x,e.z))return [];
 const open=[s],g=new Map([[key(s),0]]),parents=new Map(),closed=new Set();let last;
 while(open.length){open.sort((a,b)=>(g.get(key(a))+Math.hypot(a.x-e.x,a.z-e.z))-(g.get(key(b))+Math.hypot(b.x-e.x,b.z-e.z)));const p=open.shift(),k=key(p);if(closed.has(k))continue;closed.add(k);if(k===key(e)){last=p;break;}for(const dx of [-.5,0,.5])for(const dz of [-.5,0,.5]){if(!dx&&!dz)continue;const q={x:p.x+dx,z:p.z+dz},qk=key(q);if(closed.has(qk)||!walkable(q.x,q.z)||!clear(p,q))continue;const cost=g.get(k)+Math.hypot(dx,dz);if(cost<(g.get(qk)??Infinity)){g.set(qk,cost);parents.set(qk,p);open.push(q);}}}
 if(!last)return [];const points=[end];while(key(last)!==key(s)){points.unshift(last);last=parents.get(key(last));}points.unshift(start);const result=[];let i=0;while(i<points.length-1){let j=points.length-1;while(j>i+1&&!clear(points[i],points[j]))j--;result.push(points[j]);i=j;}return result;
}
