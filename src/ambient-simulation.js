import {SEATS,findPath,moveWithCollision,smoothstep,walkable} from './navigation.js';
import {WORLD_SCALE as S} from './world-scale.js';

export const AMBIENT_COUNT=30;
const seats=SEATS.filter(s=>s.room==='nave');
const approach=seat=>({x:seat.x,z:seat.z-1.15*S});
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);

// Runs on the world server so every connected visitor sees the same thirty people.
export function createAmbientSimulation({occupied=new Map(),players=new Map(),random=Math.random}={}){
 const people=Array.from({length:AMBIENT_COUNT},(_,i)=>({id:'ambient:'+i,x:0,z:0,yaw:0,mode:'idle',sitBlend:0,seatId:null,moving:false,timer:0,path:[],target:null,cycles:0,stalled:0}));
 function choose(p){
  const candidates=seats.filter(s=>s.id!==p.previousSeat&&!occupied.has(s.id)&&!people.some(q=>q!==p&&q.target?.id===s.id)&&walkable(approach(s).x,approach(s).z));
  const offset=Math.floor(random()*candidates.length);
  for(let n=0;n<candidates.length;n++){
   const seat=candidates[(offset+n)%candidates.length],path=findPath(p,approach(seat));
   if(path.length){p.target=seat;p.path=path;p.mode='walking';p.stalled=0;return;}
  }
  p.mode='idle';p.timer=2;
 }
 function blocked(point,p){
  return [...players.values(),...people].some(q=>q!==p&&!q.seated&&q.mode!=='seated'&&distance(point,q)<.65);
 }
 function begin(p,mode,to){p.mode=mode;p.from={x:p.x,z:p.z};p.to=to;p.elapsed=0;p.moving=false;p.yaw=0;}
 people.forEach((p,i)=>{
  if(i<18){const seat=seats[1+(i*17)%(seats.length-1)];Object.assign(p,{x:seat.x,z:seat.z,mode:'seated',sitBlend:1,seatId:seat.id,timer:18+i*4});occupied.set(seat.id,p.id);}
  else{const j=i-18;p.x=(j%2?1:-1)*1.2*S;p.z=(21-Math.floor(j/2)*5)*S;choose(p);}
 });
 function update(dt){
  dt=Math.min(Math.max(dt,0),.15);
  for(const p of people){
   p.moving=false;
   if(p.mode==='seated'){
    p.timer-=dt;if(p.timer<=0){const seat=SEATS.find(s=>s.id===p.seatId),exit=approach(seat);if(!blocked(exit,p))begin(p,'standing',exit);}
   }else if(p.mode==='sitting'||p.mode==='standing'){
    p.elapsed+=dt;const t=smoothstep(p.elapsed/.85);p.x=p.from.x+(p.to.x-p.from.x)*t;p.z=p.from.z+(p.to.z-p.from.z)*t;p.sitBlend=p.mode==='sitting'?t:1-t;
    if(p.elapsed>=.85){
     if(p.mode==='sitting'){p.mode='seated';p.timer=22+random()*25;p.cycles++;}
     else{if(occupied.get(p.seatId)===p.id)occupied.delete(p.seatId);p.previousSeat=p.seatId;p.seatId=null;choose(p);}
    }
   }else if(p.mode==='walking'){
    const goal=p.path[0];
    if(!goal){
     if(!p.target||occupied.has(p.target.id)){choose(p);continue;}
     // Reserve only when sitting down, leaving walking destinations usable by people.
     occupied.set(p.target.id,p.id);p.seatId=p.target.id;begin(p,'sitting',p.target);p.target=null;continue;
    }
    const d=distance(p,goal),step=Math.min(d,(1.15+(Number(p.id.split(':')[1])%3)*.12)*dt);
    if(d<.035){p.path.shift();continue;}
    const next=moveWithCollision(p,(goal.x-p.x)/d*step,(goal.z-p.z)/d*step);
    if(!blocked(next,p)&&distance(next,p)>.0001){const yaw=Math.atan2(p.x-next.x,p.z-next.z);p.yaw+=Math.atan2(Math.sin(yaw-p.yaw),Math.cos(yaw-p.yaw))*(1-Math.exp(-8*dt));p.x=next.x;p.z=next.z;p.moving=true;p.stalled=0;}
    else{p.stalled+=dt;if(p.stalled>5){p.previousSeat=p.target?.id;choose(p);}}
   }else{p.timer-=dt;if(p.timer<=0)choose(p);}
  }
 }
 function snapshot(){return people.map(({id,x,z,yaw,mode,sitBlend,seatId,moving,cycles})=>({id,x,z,yaw,mode,sitBlend,seatId,moving,cycles}));}
 return {update,snapshot,people};
}
