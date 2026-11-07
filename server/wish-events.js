const LIFETIME=40000;
export const AMBIENT_WISHES=Object.freeze(['모두의 하루에 평안이 가득하기를','가족 모두 건강하고 행복하기를','서로에게 따뜻한 말 한마디를 건네기를','지친 마음에 작은 쉼이 찾아오기를','오늘도 감사할 일이 생기기를','아이들의 웃음이 오래 이어지기를','외로운 이웃에게 친구가 생기기를','새로운 시작에 용기가 함께하기를','소중한 사람들과 오래 함께하기를','세상 곳곳에 사랑과 평화가 닿기를','아픈 마음이 조금씩 나아지기를','서로를 이해하는 하루가 되기를']);

export function createWishEvents({now=()=>Date.now()}={}){
 let active=[],sequence=0,cursor=0,nextAutomatic=now()+5000;
 const prune=()=>{active=active.filter(event=>now()-event.time<LIFETIME);};
 function publish({text,x,z,requestId=null,source='visitor',senderId=null}){
  prune();const event={type:'wish',eventId:'wish:'+now()+':'+(++sequence),text,x,z,requestId,source,senderId,time:now(),ageMs:0,colorIndex:sequence%6};
  active.push(event);if(active.length>16)active.shift();return event;
 }
 function automatic(people,hasViewers){
  prune();if(!hasViewers){nextAutomatic=now()+5000;return null;}
  if(now()<nextAutomatic||!people.length)return null;
  nextAutomatic=now()+12000;
  const person=people[cursor%people.length],text=AMBIENT_WISHES[cursor%AMBIENT_WISHES.length];cursor++;
  return publish({text,x:person.x,z:person.z,source:'ambient',senderId:person.id});
 }
 return {publish,automatic,getActive:()=>{prune();return active.map(event=>({...event,ageMs:Math.max(0,now()-event.time)}));}};
}
