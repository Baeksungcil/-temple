export function setupBottomMenu(){
 const nav=document.querySelector('#bottom-nav'),left=document.querySelector('#nav-left'),right=document.querySelector('#nav-right');
 const buttons=[...nav.querySelectorAll('button')];let slots=4,stride=70,drag=null,suppressUntil=0,settle;
 function maxIndex(){return Math.max(0,buttons.length-slots);}
 function update(){const max=Math.max(0,nav.scrollWidth-nav.clientWidth);left.disabled=nav.scrollLeft<2;right.disabled=nav.scrollLeft>=max-2;}
 function snap(index,animate=true){
  index=Math.max(0,Math.min(maxIndex(),index));
  nav.scrollTo({left:index*stride,behavior:animate&&!matchMedia('(prefers-reduced-motion: reduce)').matches?'smooth':'instant'});
 }
 function resize(){
  const index=Math.round(nav.scrollLeft/stride),width=nav.clientWidth;if(!width)return;
  slots=Math.max(2,Math.min(6,Math.floor(width/66)));const gap=8,buttonWidth=(width-gap*(slots-1))/slots;stride=buttonWidth+gap;
  nav.style.setProperty('--menu-button-width',buttonWidth+'px');nav.dataset.visibleButtons=String(slots);snap(index,false);update();
 }
 function move(direction){snap(Math.round(nav.scrollLeft/stride)+direction*slots);}
 left.onclick=()=>move(-1);right.onclick=()=>move(1);
 nav.addEventListener('scroll',()=>{update();clearTimeout(settle);if(!drag)settle=setTimeout(()=>snap(Math.round(nav.scrollLeft/stride),false),160);},{passive:true});
 nav.addEventListener('focusin',e=>{
  if(drag)return;const index=buttons.indexOf(e.target.closest('button'));if(index<0)return;
  const first=Math.round(nav.scrollLeft/stride);if(index<first)snap(index);else if(index>=first+slots)snap(index-slots+1);
 });
 nav.addEventListener('pointerdown',e=>{if(!e.isPrimary||e.button>0)return;drag={id:e.pointerId,x:e.clientX,start:nav.scrollLeft,moved:false};clearTimeout(settle);});
 nav.addEventListener('pointermove',e=>{
  if(!drag||e.pointerId!==drag.id)return;const dx=e.clientX-drag.x;
  if(!drag.moved&&Math.abs(dx)>6){drag.moved=true;nav.classList.add('dragging');nav.setPointerCapture(e.pointerId);}
  if(drag.moved){e.preventDefault();nav.scrollLeft=drag.start-dx;}
 },{passive:false});
 function release(e){
  if(!drag||e.pointerId!==drag.id)return;const moved=drag.moved,index=Math.round(nav.scrollLeft/stride);drag=null;nav.classList.remove('dragging');
  if(moved){suppressUntil=performance.now()+300;if(nav.hasPointerCapture(e.pointerId))nav.releasePointerCapture(e.pointerId);snap(index);}
 }
 nav.addEventListener('pointerup',release);nav.addEventListener('pointercancel',release);
 nav.addEventListener('click',e=>{if(performance.now()<suppressUntil){e.preventDefault();e.stopImmediatePropagation();}},true);
 new ResizeObserver(resize).observe(nav);window.addEventListener('resize',resize);resize();
}
