import * as T from 'three';
// Positive screen dx moves the front surface to the right, including tilted objects.
export function applyScreenRotation(q,dx,dy,cameraQuaternion){
 const up=new T.Vector3(0,1,0).applyQuaternion(cameraQuaternion),right=new T.Vector3(1,0,0).applyQuaternion(cameraQuaternion);
 q.premultiply(new T.Quaternion().setFromAxisAngle(up,dx));q.premultiply(new T.Quaternion().setFromAxisAngle(right,dy));q.normalize();return q;
}
export function nearestMarker(markers,x,y,hitSize){
 return markers.filter(m=>m.visible&&Math.abs(m.x-x)<=hitSize/2&&Math.abs(m.y-y)<=hitSize/2).map(m=>({m,d:(m.x-x)**2+(m.y-y)**2})).sort((a,b)=>a.d-b.d||a.m.index-b.m.index)[0]?.m||null;
}
export function fitDistance(radius,aspect,fov=38,fill=.80){
 const half=T.MathUtils.degToRad(fov/2),limiting=Math.min(half,Math.atan(Math.tan(half)*aspect));return radius/(Math.sin(limiting)*fill);
}
// Bounds in the object's parent coordinates, excluding hidden branches and markers.
// Camera/hand rotation never changes these bounds or the framing distance.
export function modelBounds(root){
 root.updateWorldMatrix(true,true);const inv=new T.Matrix4();if(root.parent)inv.copy(root.parent.matrixWorld).invert();
 const points=[];root.traverse(o=>{if(!o.isMesh||o.userData.hotspot)return;for(let p=o;p&&p!==root.parent;p=p.parent)if(!p.visible)return;
  if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();const b=o.geometry.boundingBox,m=new T.Matrix4().multiplyMatrices(inv,o.matrixWorld);
  for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z])points.push(new T.Vector3(x,y,z).applyMatrix4(m));
 });
 const box=new T.Box3().setFromPoints(points),center=box.getCenter(new T.Vector3());let radius=0;for(const p of points)radius=Math.max(radius,p.distanceTo(center));return {center,radius:Math.max(radius,.01)};
}
export function projectHotspot(h,{camera,width,height,occluders,radius,raycaster=new T.Raycaster()}){
 const world=h.anchor.getWorldPosition(new T.Vector3()),normal=h.normal.clone().transformDirection(h.anchor.matrixWorld),direction=camera.position.clone().sub(world),p=world.clone().project(camera);
 const x=(p.x+1)*width/2,y=(1-p.y)*height/2;let visible=true;for(let node=h.anchor;node;node=node.parent)if(!node.visible)visible=false;
 visible=visible&&normal.dot(direction.normalize())>.05&&p.z>-1&&p.z<1&&x>22&&x<width-22&&y>28&&y<height-48;
 let occluded=false;if(visible){const distance=world.distanceTo(camera.position);raycaster.set(camera.position,world.clone().sub(camera.position).normalize());const first=raycaster.intersectObjects(occluders,false)[0],pixelWorld=2*distance*Math.tan(T.MathUtils.degToRad(camera.fov/2))/height;const allowance=first?.object===h.surface?Math.min(radius*.045,pixelWorld*5):pixelWorld*.65;occluded=!!first&&first.distance<distance-allowance;visible=!occluded}
 return {x,y,visible,occluded};
}
