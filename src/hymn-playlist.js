export function createShuffledPlaylist(tracks,random=Math.random){
 let bag=[],previous;
 return {next(){
  if(!tracks.length)return null;
  if(!bag.length){
   bag=[...tracks];for(let i=bag.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}
   if(bag.length>1&&bag[bag.length-1]===previous)[bag[0],bag[bag.length-1]]=[bag[bag.length-1],bag[0]];
  }
  previous=bag.pop();return previous;
 }};
}
