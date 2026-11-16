import * as THREE from 'three';

export function configureBlessingPriest(priest){
 // Keep the same limb proportions as every visitor, at a slightly adult height.
 priest.root.scale.setScalar(.92);priest.head.scale.setScalar(.95);
}

// Solve to the palm surface (.09 beyond the wrist center), using unchanged arm meshes.
function reachHand(visitor,arm,target,blend){
 visitor.root.updateMatrixWorld(true);
 const start=arm.shoulder.position.clone(),local=visitor.body.worldToLocal(target.clone());
 const delta=local.sub(start),distance=Math.max(.001,Math.min(delta.length(),.619)),direction=delta.normalize();
 const upper=.27,lower=.35,along=(upper*upper-lower*lower+distance*distance)/(2*distance);
 const pole=new THREE.Vector3(arm.side*.8,-.35,.15);pole.addScaledVector(direction,-pole.dot(direction)).normalize();
 const joint=start.clone().addScaledVector(direction,along).addScaledVector(pole,Math.sqrt(Math.max(0,upper*upper-along*along)));
 const upperQ=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,-1,0),joint.clone().sub(start).normalize());
 const wrist=start.clone().addScaledVector(direction,distance);
 const lowerQ=upperQ.clone().invert().multiply(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,-1,0),wrist.sub(joint).normalize()));
 arm.shoulder.quaternion.slerp(upperQ,blend);arm.elbow.quaternion.slerp(lowerQ,blend);
 visitor.root.updateMatrixWorld(true);
 return arm.elbow.localToWorld(new THREE.Vector3(0,-lower,0));
}

export function placeBlessingHands(priest,player,blend=1){
 // Turn the shoulder toward the visitor instead of leaning the head into theirs.
 const turn=THREE.MathUtils.degToRad(20)*blend;priest.root.rotation.y=player.root.rotation.y+Math.PI+turn;
 priest.body.rotation.x=0;priest.body.position.z=0;priest.head.rotation.x=.06;priest.head.rotation.y=-turn;
 priest.root.updateMatrixWorld(true);player.root.updateMatrixWorld(true);
 const priestArm=priest.arms[1],playerArm=player.arms[0];
 priestArm.shoulder.position.z=-.08*blend;playerArm.shoulder.position.z=-.08*blend;priest.root.updateMatrixWorld(true);player.root.updateMatrixWorld(true);
 const a=priestArm.shoulder.getWorldPosition(new THREE.Vector3()),b=playerArm.shoulder.getWorldPosition(new THREE.Vector3());
 const ratio=priest.root.scale.x/(priest.root.scale.x+player.root.scale.x);
 const contact=a.clone().lerp(b,ratio);
 const priestHand=reachHand(priest,priestArm,contact,blend),playerHand=reachHand(player,playerArm,contact,blend);
 return priestHand.distanceTo(playerHand);
}

