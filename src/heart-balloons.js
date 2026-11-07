import * as THREE from 'three';

export const BALLOON_LIFETIME=40000;
const palette=['#ed789c','#ec95b8','#e6a2cb','#d98caf','#efaa9c','#d79dbf'];
export function heartGeometry(){
 const shape=new THREE.Shape();shape.moveTo(0,.45);
 shape.bezierCurveTo(-.35,1,-1.15,.85,-1.05,.1);
 shape.bezierCurveTo(-1.03,-.35,-.5,-.7,0,-1.05);
 shape.bezierCurveTo(.5,-.7,1.03,-.35,1.05,.1);
 shape.bezierCurveTo(1.15,.85,.35,1,0,.45);
 // Rounded front and back surfaces, with the heart outline at the widest ring.
 const outline=shape.getSpacedPoints(96),segments=outline.length-1,rings=24,vertices=[],indices=[];
 for(let ring=0;ring<=rings;ring++){
  const phi=ring/rings*Math.PI,radius=Math.sin(phi);
  for(let i=0;i<=segments;i++){const point=outline[i];vertices.push(point.x*radius,(point.y+.08)*radius-.08,.6*Math.cos(phi));}
 }
 for(let ring=0;ring<rings;ring++)for(let i=0;i<segments;i++){
  const a=ring*(segments+1)+i,b=a+segments+1;indices.push(a,b,b+1,a,b+1,a+1);
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();
 const normals=geometry.attributes.normal;
 for(let ring=0;ring<=rings;ring++){
  const a=ring*(segments+1),b=a+segments,v=new THREE.Vector3().fromBufferAttribute(normals,a).add(new THREE.Vector3().fromBufferAttribute(normals,b)).normalize();
  normals.setXYZ(a,v.x,v.y,v.z);normals.setXYZ(b,v.x,v.y,v.z);
 }
 return geometry;
}
export function wrapWishText(context,text,width){
 const lines=[];let line='';
 for(const ch of text){if(ch==='\n'){lines.push(line);line='';continue;}if(line&&context.measureText(line+ch).width>width){lines.push(line);line=ch;}else line+=ch;}
 if(line)lines.push(line);return lines;
}
function textTexture(text){
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=640;const ctx=canvas.getContext('2d');
 text=text.replace(/\s+/g,' ').trim();
 const size=text.length<=20?100:text.length<=50?78:text.length<=100?58:42;
 ctx.font=`600 ${size}px 'Malgun Gothic','Segoe UI',sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';
 const lines=wrapWishText(ctx,text,920),height=size*1.3;
 ctx.fillStyle='#fff9f2';ctx.shadowColor='rgba(108,34,64,.55)';ctx.shadowBlur=5;ctx.shadowOffsetY=2;
 lines.forEach((line,i)=>ctx.fillText(line,512,320+(i-(lines.length-1)/2)*height));
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}

function curvedLabelGeometry(heart){
 const geometry=new THREE.PlaneGeometry(1.65,1.08,16,12),mesh=new THREE.Mesh(heart,new THREE.MeshBasicMaterial()),ray=new THREE.Raycaster(),positions=geometry.attributes.position;
 mesh.updateMatrixWorld();
 for(let i=0;i<positions.count;i++){
  ray.set(new THREE.Vector3(positions.getX(i),positions.getY(i)-.08,2),new THREE.Vector3(0,0,-1));
  const hit=ray.intersectObject(mesh)[0];positions.setZ(i,hit?hit.point.z+.008:0);
 }
 geometry.computeVertexNormals();mesh.material.dispose();return geometry;
}
export function createHeartBalloons({scene,camera,canvas,now=()=>Date.now()}){
 const geometry=heartGeometry(),textGeometry=curvedLabelGeometry(geometry),knotGeometry=new THREE.ConeGeometry(.085,.18,12),shineGeometry=new THREE.SphereGeometry(.15,12,8),items=new Map();
 const target=new THREE.Vector3(),projected=new THREE.Vector3();
 function remove(id){const item=items.get(id);if(!item)return;scene.remove(item.root);item.texture.dispose();for(const material of item.materials)material.dispose();item.string.geometry.dispose();items.delete(id);}
 function receive(event){
  if(!event||typeof event.text!=='string')return;
  const id=event.eventId||event.requestId||crypto.randomUUID();if(items.has(id))return;
  const time=Number.isFinite(event.ageMs)?now()-Math.max(0,event.ageMs):Number.isFinite(event.time)?event.time:now();
  if(now()-time>=BALLOON_LIFETIME)return;
  while(items.size>=16)remove(items.keys().next().value);
  const color=palette[(event.colorIndex||0)%palette.length],root=new THREE.Group();root.name='wish heart balloon';root.userData.noNavigation=true;
  const material=new THREE.MeshPhysicalMaterial({color,emissive:color,emissiveIntensity:.24,roughness:.25,metalness:.12,clearcoat:1,clearcoatRoughness:.16,transparent:true});
  const heart=new THREE.Mesh(geometry,material);root.add(heart);
  const texture=textTexture(event.text),textMaterial=new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});
  const label=new THREE.Mesh(textGeometry,textMaterial);label.position.set(0,-.08,0);root.add(label);
  const knot=new THREE.Mesh(knotGeometry,material);knot.position.y=-1.18;root.add(knot);
  const points=Array.from({length:25},(_,i)=>new THREE.Vector3(Math.sin(i*.23)*.045,-1.23-i*.038,0));
  const stringMaterial=new THREE.LineBasicMaterial({color:'#f6dfcf',transparent:true,opacity:.8});
  const string=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),stringMaterial);root.add(string);
  // Soft highlights make the inflated surface readable even in the dim church.
  const shine=new THREE.Mesh(shineGeometry,new THREE.MeshBasicMaterial({color:'#fff3f0',transparent:true,opacity:.32,depthWrite:false}));shine.position.set(-.58,.47,.43);shine.scale.set(.5,1,.3);shine.rotation.z=-.45;root.add(shine);
  root.scale.setScalar(event.text.length>90?1.15:.85);root.traverse(o=>o.userData.noNavigation=true);scene.add(root);
  items.set(id,{root,texture,string,materials:[material,textMaterial,stringMaterial,shine.material],time,event});
 }
 function update(){
  let visible=0,ambient=0;
  for(const [id,item] of items){
   const age=Math.max(0,(now()-item.time)/1000);if(age>=BALLOON_LIFETIME/1000){remove(id);continue;}
   const {event,root}=item,seed=(event.colorIndex||0)*.8;
   root.position.set(event.x+Math.sin(age*.5+seed)*.2,3.4+age*.135,event.z+Math.sin(age*.28+seed)*.12);
   root.quaternion.copy(camera.quaternion);root.rotateY(Math.sin(age*.6+seed)*.14);root.rotateZ(Math.sin(age*.7+seed)*.045);
   const opacity=Math.min(1,age/.6,(BALLOON_LIFETIME/1000-age)/5);item.materials[0].opacity=opacity;item.materials[1].opacity=opacity;item.materials[2].opacity=opacity*.8;item.materials[3].opacity=opacity*.32;
   target.copy(root.position);projected.copy(target).project(camera);if(projected.z>=-1&&projected.z<=1&&Math.abs(projected.x)<1.3&&Math.abs(projected.y)<1.5)visible++;
   if(event.source==='ambient')ambient++;
  }
  canvas.dataset.wishBalloons=String(items.size);canvas.dataset.visibleWishBalloons=String(visible);canvas.dataset.ambientWishBalloons=String(ambient);
 }
 return {receive,update,clear:()=>{for(const id of [...items.keys()])remove(id);},getSnapshot:()=>[...items.values()].map(item=>({eventId:item.event.eventId,text:item.event.text,source:item.event.source,x:item.root.position.x,y:item.root.position.y,z:item.root.position.z}))};
}
