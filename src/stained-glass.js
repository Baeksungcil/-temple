import * as THREE from 'three';
export const stainedWindows=[];
let sharedTexture,windowMaterial,floorMaterial,frameMaterial;const geometries=new Map(),lightMaterials=[];
function stainedTexture(){if(sharedTexture)return sharedTexture;const canvas=document.createElement('canvas');canvas.width=384;canvas.height=640;const c=canvas.getContext('2d');c.fillStyle='#263c74';c.fillRect(0,0,384,640);
 const palette=['#2b7cc6','#91dce5','#dfb64d','#c64863','#7e65b0','#4c9a8b','#f4d78d'];
 // Curved mosaic pieces rather than parallel vertical bars.
 for(let row=0;row<9;row++)for(let col=-1;col<5;col++){const x=col*96+(row%2)*48,y=row*82;c.beginPath();c.moveTo(x,y+41);c.quadraticCurveTo(x+48,y-12,x+96,y+41);c.quadraticCurveTo(x+48,y+94,x,y+41);c.fillStyle=palette[(row*3+col+7)%palette.length];c.fill();c.strokeStyle='#78664d';c.lineWidth=2;c.stroke();}
 const cx=192,cy=200;for(let i=0;i<12;i++){const a=i/12*Math.PI*2;c.save();c.translate(cx,cy);c.rotate(a);c.beginPath();c.ellipse(0,-68,24,61,0,0,Math.PI*2);c.fillStyle=palette[i%palette.length];c.fill();c.strokeStyle='#8e754e';c.lineWidth=3;c.stroke();c.restore();}
 c.beginPath();c.arc(cx,cy,32,0,Math.PI*2);c.fillStyle='#fff1af';c.fill();c.strokeStyle='#a47d3a';c.lineWidth=4;c.stroke();
 // Original radial rose tracery, inspired by medieval rose windows; no cross motif.
 function rose(cx,cy,r,n){for(let ring=0;ring<3;ring++){const count=n+ring*6,rad=r*(.35+ring*.25);for(let i=0;i<count;i++){const a=i/count*Math.PI*2;c.save();c.translate(cx+Math.cos(a)*rad,cy+Math.sin(a)*rad);c.rotate(a);c.beginPath();c.ellipse(0,0,r*.14,r*.095,0,0,Math.PI*2);c.fillStyle=['#274da1','#b72e54','#dcb658','#56a6b5'][i%4];c.fill();c.strokeStyle='#cfb57d';c.lineWidth=2;c.stroke();c.restore();}}c.beginPath();c.arc(cx,cy,r*.14,0,Math.PI*2);c.fillStyle='#e7c77f';c.fill();}
 rose(192,440,150,12);
 const shine=c.createLinearGradient(0,0,384,640);shine.addColorStop(0,'rgba(255,255,240,.28)');shine.addColorStop(.6,'rgba(255,255,255,0)');shine.addColorStop(1,'rgba(255,194,100,.15)');c.fillStyle=shine;c.fillRect(0,0,384,640);
 sharedTexture=new THREE.CanvasTexture(canvas);sharedTexture.colorSpace=THREE.SRGBColorSpace;sharedTexture.anisotropy=2;return sharedTexture;}
export function addStainedWindow(scene,{x,y,z,width=4,height=4.8,rotation=0,project=true}){
 stainedWindows.push({x,y,z,width,height,rotation});const texture=stainedTexture(),r=width/2,shape=new THREE.Shape();shape.moveTo(-r,0);shape.lineTo(r,0);shape.lineTo(r,height);shape.lineTo(-r,height);shape.closePath();const geo=new THREE.ShapeGeometry(shape,24),pos=geo.getAttribute('position'),uv=geo.getAttribute('uv');for(let i=0;i<pos.count;i++)uv.setXY(i,(pos.getX(i)+r)/width,pos.getY(i)/height);
 if(!windowMaterial){windowMaterial=new THREE.MeshStandardMaterial({map:texture,emissiveMap:texture,emissive:'#ffffff',emissiveIntensity:.75,roughness:.95,metalness:0,side:THREE.DoubleSide});lightMaterials.push({mat:windowMaterial,kind:'window'});}const mat=windowMaterial;const key=width+','+height;if(geometries.has(key)){geo.dispose();}else geometries.set(key,geo);const panel=new THREE.Mesh(geometries.get(key),mat);panel.name='rectangular stained glass';panel.position.set(x,y,z);panel.rotation.y=rotation;panel.castShadow=false;panel.userData.noNavigation=true;scene.add(panel);
 const outline=[[-r,0],[r,0],[r,height],[-r,height],[-r,0]].map(([x,y])=>new THREE.Vector3(x,y,.025)),border=new THREE.CurvePath();for(let i=1;i<outline.length;i++)border.add(new THREE.LineCurve3(outline[i-1],outline[i]));const frame=new THREE.Mesh(new THREE.TubeGeometry(border,64,.065,5,true),(frameMaterial??=new THREE.MeshStandardMaterial({color:'#c3a16a',roughness:.85})));frame.position.copy(panel.position);frame.rotation.copy(panel.rotation);frame.name='rectangular window surround';scene.add(frame);

 if(project){if(!floorMaterial){floorMaterial=new THREE.MeshBasicMaterial({map:texture,color:'#ffe8c1',transparent:true,opacity:.15,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});lightMaterials.push({mat:floorMaterial,kind:'floor'});}const material=floorMaterial;const pool=new THREE.Mesh(new THREE.PlaneGeometry(width*1.45,height*1.55),material);pool.name='stained glass coloured floor light';pool.rotation.x=-Math.PI/2;pool.rotation.z=x<0?-.48:.48;pool.position.set(x+(x<0?3.5:-3.5),.073,z-1);pool.userData.noNavigation=true;scene.add(pool);}
 return panel;
}
export function updateStainedLight(daylight){for(const {mat,kind}of lightMaterials){if(kind==='window')mat.emissiveIntensity=.35+.65*daylight;else mat.opacity=.025+.17*daylight;}}
