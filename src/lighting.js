import * as THREE from 'three';
import {HDRLoader} from 'three/addons/loaders/HDRLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
export async function setupLighting(renderer,scene){
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;
 const pmrem=new THREE.PMREMGenerator(renderer);pmrem.compileEquirectangularShader();
 try{const hdr=await new HDRLoader().loadAsync('/lighting/temple-studio.hdr');const env=pmrem.fromEquirectangular(hdr);scene.environment=env.texture;scene.environmentIntensity=.18;hdr.dispose();document.querySelector('#lighting-state').textContent='HDRI 조명 · 무광 재질';document.querySelector('#scene').dataset.lighting='hdri';}
 catch{const room=new RoomEnvironment();scene.environment=pmrem.fromScene(room,.04).texture;room.dispose();document.querySelector('#lighting-state').textContent='기본 실내 조명 · HDRI 불러오기 실패';document.querySelector('#scene').dataset.lighting='fallback';}
 finally{pmrem.dispose();}
}
