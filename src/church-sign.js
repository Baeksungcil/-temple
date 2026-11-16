import {WORLD_SCALE} from './world-scale.js';
import * as THREE from 'three';

export function paintChurchSign(ctx,w=1536,h=448){
 const background=ctx.createLinearGradient(0,0,w,h);background.addColorStop(0,'#193f36');background.addColorStop(.5,'#0a241e');background.addColorStop(1,'#1c4439');
 ctx.fillStyle=background;ctx.fillRect(0,0,w,h);
 ctx.strokeStyle='#c8a25d';ctx.lineWidth=5;ctx.strokeRect(20,20,w-40,h-40);ctx.strokeStyle='#8f743f';ctx.lineWidth=2;ctx.strokeRect(36,36,w-72,h-72);
 const gold=ctx.createLinearGradient(0,100,0,370);gold.addColorStop(0,'#fff1bb');gold.addColorStop(.5,'#e8c678');gold.addColorStop(1,'#b68e49');
 ctx.fillStyle=gold;ctx.strokeStyle='#c8a25d';ctx.lineWidth=3;
 ctx.beginPath();ctx.arc(232,256,134,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(232,256,121,0,Math.PI*2);ctx.stroke();
 ctx.fillRect(218,171,28,162);ctx.fillRect(174,218,116,25);
 for(const side of [-1,1])for(let i=0;i<5;i++){
  const x=232+side*(88-i*8),y=318-i*13;ctx.save();ctx.translate(x,y);ctx.rotate(side*.7);ctx.beginPath();ctx.ellipse(0,0,13,5,0,0,Math.PI*2);ctx.fill();ctx.restore();
 }
 ctx.textAlign='center';ctx.textBaseline='middle';ctx.shadowColor='#0009';ctx.shadowBlur=8;ctx.shadowOffsetY=5;
 ctx.font='bold 156px "Malgun Gothic",sans-serif';ctx.fillText('복음교회',915,238);ctx.shadowBlur=0;ctx.shadowOffsetY=0;
 ctx.font='25px Georgia,serif';const text='GOSPEL CHURCH',spacing=30,start=915-(text.length-1)*spacing/2;for(let i=0;i<text.length;i++)ctx.fillText(text[i],start+i*spacing,357);
 ctx.strokeStyle='#c8a25d';ctx.lineWidth=2;for(const side of [-1,1]){const x=915+side*292;ctx.beginPath();ctx.moveTo(x,357);ctx.lineTo(x+side*150,357);ctx.stroke();ctx.save();ctx.translate(x+side*166,357);ctx.rotate(Math.PI/4);ctx.fillRect(-5,-5,10,10);ctx.restore();}
}

export function createChurchSign(scene){
 const group=new THREE.Group();group.name='Gospel Church sign';group.scale.set(1/WORLD_SCALE,1,1/WORLD_SCALE);group.position.set(0,8.4,-15.2);scene.add(group);
 const gold=new THREE.MeshStandardMaterial({color:'#c6a463',metalness:.65,roughness:.32}),dark=new THREE.MeshStandardMaterial({color:'#18372d',roughness:.7});
 function box(w,h,d,material,x,y,z){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);group.add(mesh);return mesh;}
 box(6.45,2.03,.19,gold,0,0,0);box(6.28,1.88,.22,dark,0,0,.025);
 const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=448;paintChurchSign(canvas.getContext('2d'));
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 const face=new THREE.Mesh(new THREE.PlaneGeometry(6.15,1.75),new THREE.MeshBasicMaterial({map:texture,toneMapped:false}));face.name='복음교회 금장 간판';face.position.z=.142;group.add(face);
 for(const side of [-1,1]){box(.045,.92,.045,gold,side*2.45,1.45,0);const cap=box(.2,.1,.1,gold,side*2.45,1.03,.07);cap.rotation.z=.05*side;}
 group.traverse(o=>o.userData.noNavigation=true);return group;
}
