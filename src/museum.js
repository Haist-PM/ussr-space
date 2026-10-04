import * as T from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {sputnik,vostok,luna9,venera9,voskhod2,lunokhod1,mars3,salyut1,mir,mesh} from './models.js';
import {clamp,smooth,sampleSteps,mirAssembly,sceneBlend,planetComposition,craftFor,craftComposition,transitionDistance} from './story-state.js';
import {applyScreenRotation,nearestMarker,fitDistance,modelBounds,projectHotspot} from './interaction.js';
import {createStarfield} from './starfield.js';
let sky;
const motion=matchMedia('(prefers-reduced-motion: reduce)');
const narrow=()=>innerWidth<761;
const asset=name=>window.__MUSEUM_ASSETS__?.[name]||new URL(`assets/${name}`,document.baseURI).href;
const orbitPoint=p=>new T.Vector3(3.25*Math.cos(p),.87*Math.sin(p),3.08*Math.sin(p));
const SUN=new T.Vector3(-6,2.4,3).normalize();
const factories={sputnik,vostok,luna9,venera9,voskhod2,lunokhod1,mars3,salyut1,mir};
let masks,renderer,environment,environmentTarget,observer,views=[],raf=0,last=0,time=0,phase=2.35,orbits=0,paused=false,lost=false,disposed=false,quality=1,slow=0,frames=0,cpu=0,qa=null;
const textureCache=new Map(),ray=new T.Raycaster();
const labels={earth:'Земля и Спутник-1',sputnik:'Спутник-1',human:'Корабли «Восток» и «Восход-2»',moon:'Луна и автоматические аппараты',venus:'Венера и «Венера-9»',mars:'Марс и «Марс-3»',stations:'«Салют-1» и «Мир»'};
const planetInfo={earth:{file:'earth-day.jpg',tilt:23.44,spin:.013,roughness:.9},moon:{file:'moon.jpg',tilt:6.68,spin:.010,roughness:.94},venus:{file:'venus.jpg',tilt:2.64,spin:-.008,roughness:.99},mars:{file:'mars.jpg',tilt:25.19,spin:.015,roughness:.92}};
function wake(){if(!raf&&!document.hidden&&!lost&&!disposed)raf=requestAnimationFrame(tick)}
function controller(v,key=v.controlKey){
 if(!v.controls.has(key))v.controls.set(key,{q:new T.Quaternion(),x:0,y:0,velocity:new T.Vector2(),lastInput:-99,idle:1,zoom:1,targetZoom:1});return v.controls.get(key);
}
function mount(){
 document.querySelector('#earth')?.remove();document.querySelector('.earth-stage').dataset.scene='earth';
 document.querySelector('.earth-hint').innerHTML='ВРАЩАЙТЕ ПЛАНЕТУ · ПРОКРУЧИВАЙТЕ ДАЛЬШЕ <span>NASA BLUE MARBLE / ХУДОЖЕСТВЕННЫЙ МАСШТАБ</span>';
 document.querySelector('.orbital-label').innerHTML='ПС-1 / СПУТНИК<br><span>04 ОКТЯБРЯ 1957</span><br><span class="orbit-readout">ОРБИТАЛЬНЫЙ ПОЛЁТ</span>';
 for(const host of document.querySelectorAll('[data-scene]')){
  const kind=host.dataset.scene,el=document.createElement('div');el.className=`webgl-view view-${kind}`;el.id=kind==='earth'?'earth':`${kind}-model`;el.tabIndex=0;el.setAttribute('role','group');el.setAttribute('aria-label',labels[kind]+'. Перетаскивание и стрелки вращают главный объект. Колесо прокручивает страницу.');
  el.innerHTML='<span class="view-status">Подготовка сцены…</span><div class="marker-layer"></div><div class="viewer-tools"><span class="drag-label">↔ ВРАЩАТЬ</span><details class="details-menu" hidden><summary>Детали</summary><div class="details-options"></div></details><button class="reset-view" type="button" aria-label="Вернуть удобный ракурс">↺</button></div>';host.prepend(el);
  const section=kind==='earth'?document.querySelector('#home'):host.closest('.narrative');const readout=document.createElement('div');readout.className='detail-card';readout.id=kind+'-detail';readout.hidden=true;readout.innerHTML='<button type="button" class="detail-close" aria-label="Закрыть пояснение">×</button><div aria-live="polite"><strong></strong><p></p></div>';host.after(readout);
  const v={kind,host,el,section,steps:[...section.querySelectorAll('.narrative-step')],scene:null,camera:null,ready:false,building:false,active:false,items:new Map(),planet:null,stage:-1,local:0,progress:0,controls:new Map(),controlKey:planetInfo[kind]?'planet':kind==='human'?'vostok':kind==='stations'?'salyut1':'sputnik',drag:false,pointer:null,readout,hover:null,selected:null,selectedKey:'',detailKey:'',markers:[],rect:null};views.push(v);controller(v);bind(v);v.steps.forEach((step,i)=>{if(i>0&&(craftFor(kind,i)!==craftFor(kind,i-1)||kind==='mars'&&i===2||kind==='moon'&&i===2))step.classList.add('transition-step')});
 }
 const toggle=document.createElement('button');toggle.id='motion-toggle';toggle.className='motion-control';toggle.type='button';toggle.textContent='Ⅱ Пауза движения';toggle.setAttribute('aria-pressed','false');toggle.addEventListener('click',()=>{paused=!paused;sky?.setPaused(paused||motion.matches);toggle.textContent=paused?'▷ Продолжить движение':'Ⅱ Пауза движения';toggle.setAttribute('aria-pressed',String(paused));wake()});document.body.append(toggle);
 document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;const open=views.find(v=>!v.readout.hidden||v.el.querySelector('.details-menu').open);if(open){e.preventDefault();e.stopImmediatePropagation();closeDetail(open,true);open.el.querySelector('.details-menu').open=false}},true);
}
function interact(v){controller(v).lastInput=time;wake()}
function rotate(v,dx,dy){if(!v.camera)return;const c=controller(v);c.y+=dx;c.x+=dy;applyScreenRotation(c.q,dx,dy,v.camera.quaternion)}
function closeDetail(v,focus=false){v.selected=null;v.readout.hidden=true;v.el.dataset.detail='';v.markers.forEach(m=>{m.button.setAttribute('aria-pressed','false');m.option.setAttribute('aria-pressed','false')});if(focus)v.el.focus({preventScroll:true});wake()}
function selectDetail(v,m){if(!m?.visible)return;v.selected=m.index;v.readout.querySelector('strong').textContent=m.hotspot.title;v.readout.querySelector('p').textContent=m.hotspot.text;v.readout.hidden=false;v.el.dataset.detail=m.hotspot.title;v.el.querySelector('.details-menu').open=false;v.markers.forEach(x=>{const on=x===m;x.button.setAttribute('aria-pressed',String(on));x.option.setAttribute('aria-pressed',String(on))});interact(v)}
function markerAt(v,e){const r=v.el.getBoundingClientRect();return nearestMarker(v.markers,e.clientX-r.left,e.clientY-r.top,e.pointerType==='touch'||narrow()?44:32)}
function bind(v){
 v.el.addEventListener('pointerdown',e=>{if(!v.controlKey||e.target.closest('button,details')||e.button!==0)return;v.pointer={x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,t:performance.now(),id:e.pointerId,key:v.controlKey};v.drag=true;controller(v).velocity.set(0,0);v.el.setPointerCapture(e.pointerId);v.el.classList.add('dragging');interact(v)});
 v.el.addEventListener('pointermove',e=>{
  if(v.drag&&v.pointer){const p=v.pointer;if(p.key!==v.controlKey)return;const dt=Math.max(.008,(performance.now()-p.t)/1000),dx=(e.clientX-p.x)*.005,dy=e.pointerType==='touch'?0:(e.clientY-p.y)*.005;rotate(v,dx,dy);controller(v).velocity.set(T.MathUtils.clamp(dx/dt,-1.1,1.1),T.MathUtils.clamp(dy/dt,-1.1,1.1));p.x=e.clientX;p.y=e.clientY;p.t=performance.now();interact(v)}else if(e.pointerType!=='touch'){const m=markerAt(v,e);v.markers.forEach(x=>x.button.classList.toggle('hovered',x===m));v.el.classList.toggle('over-hotspot',!!m)}
 });
 const release=e=>{if(v.pointer&&Math.hypot(e.clientX-v.pointer.startX,e.clientY-v.pointer.startY)<6)selectDetail(v,markerAt(v,e));v.drag=false;v.pointer=null;v.el.classList.remove('dragging');interact(v)};
 v.el.addEventListener('pointerup',release);v.el.addEventListener('pointercancel',()=>{v.drag=false;v.pointer=null;controller(v).velocity.set(0,0);v.el.classList.remove('dragging');interact(v)});
 v.el.addEventListener('pointerleave',()=>{v.el.classList.remove('over-hotspot');v.markers.forEach(m=>m.button.classList.remove('hovered'))});
 v.el.addEventListener('keydown',e=>{if(!v.controlKey||e.target.closest('button,details')||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-'].includes(e.key))return;e.preventDefault();e.stopPropagation();rotate(v,e.key==='ArrowLeft'?-.14:e.key==='ArrowRight'?.14:0,e.key==='ArrowUp'?-.14:e.key==='ArrowDown'?.14:0);const c=controller(v);c.velocity.set(0,0);if(['+','=','-'].includes(e.key))c.targetZoom=T.MathUtils.clamp(c.targetZoom*(e.key==='-'?1.1:.9),.9,1.3);interact(v)});
 v.el.querySelector('.reset-view').addEventListener('click',()=>{const c=controller(v);c.q.identity();c.x=c.y=0;c.velocity.set(0,0);c.targetZoom=1;interact(v)});
 v.readout.querySelector('button').addEventListener('click',()=>closeDetail(v,true));
 // Native touch-action:pan-y keeps vertical scrolling. No wheel interception.
}
function setDetails(v,key){
 if(v.detailKey===key)return;closeDetail(v);v.detailKey=key;v.el.querySelector('.details-menu').open=false;
 const layer=v.el.querySelector('.marker-layer'),options=v.el.querySelector('.details-options');layer.replaceChildren();options.replaceChildren();v.markers=[];
 const item=v.items.get(key);if(!item||v.kind==='earth'){v.el.querySelector('.details-menu').hidden=true;return}
 item.object.hotspots.forEach((h,index)=>{
  const button=document.createElement('button');button.type='button';button.className='hotspot-button';button.setAttribute('aria-label',h.title);button.setAttribute('aria-controls',v.readout.id);button.setAttribute('aria-pressed','false');button.title=h.title;button.innerHTML='<span></span>';layer.append(button);
  const option=document.createElement('button');option.type='button';option.textContent=h.title;option.setAttribute('aria-controls',v.readout.id);option.setAttribute('aria-pressed','false');options.append(option);
  const marker={hotspot:h,index,button,option,x:0,y:0,visible:false};v.markers.push(marker);
  button.addEventListener('click',e=>{e.stopPropagation();selectDetail(v,e.detail===0?marker:markerAt(v,e))});option.addEventListener('click',()=>selectDetail(v,marker));
 });
}
function updateMarkers(v){
 if(!v.markers.length)return;const item=v.items.get(v.detailKey),occluders=[];
 v.scene.traverse(o=>{if(o.isMesh&&!o.userData.hotspot&&isVisible(o)&&!o.material.isShaderMaterial&&!o.material.alphaMap&&o.material.opacity>.45)occluders.push(o)});
 let visibleCount=0;for(const m of v.markers){
  const projection=projectHotspot(m.hotspot,{camera:v.camera,width:v.rect.width,height:v.rect.height,occluders,radius:item.bounds.radius*item.rig.scale.x,raycaster:ray});m.x=projection.x;m.y=projection.y;const visible=projection.visible&&item.alpha>.97;
  m.visible=visible;m.button.hidden=!visible;m.option.hidden=!visible;m.button.style.left=m.x+'px';m.button.style.top=m.y+'px';if(visible)visibleCount++;
 }
 v.el.querySelector('.details-menu').hidden=visibleCount===0;v.el.dataset.visibleMarkers=String(visibleCount);
}
function isVisible(o){for(let p=o;p;p=p.parent)if(!p.visible)return false;return true}
function light(v,planet=false){const scene=v.scene;scene.environment=environment;scene.add(new T.AmbientLight(0x91aacc,planet?.045:.25));const sun=new T.DirectionalLight(0xfff1dc,planet?2.7:3);sun.position.copy(SUN).multiplyScalar(12);if(v.kind==='earth'){sun.castShadow=true;sun.shadow.mapSize.set(narrow()?512:1024,narrow()?512:1024);Object.assign(sun.shadow.camera,{left:-4.5,right:4.5,top:4.5,bottom:-4.5,near:1,far:25});sun.shadow.bias=-.0005;sun.shadow.normalBias=.012}scene.add(sun);if(!planet){const rim=new T.DirectionalLight(0x93bddc,.8);rim.position.set(4,2,-4);scene.add(rim)}}
async function loadTexture(name,color=true){if(!textureCache.has(name))textureCache.set(name,new T.TextureLoader().loadAsync(asset(name)).then(t=>{t.colorSpace=color?T.SRGBColorSpace:T.NoColorSpace;t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());return t}));return textureCache.get(name)}
function atmosphere(parent,r,color,strength=.4){const a=new T.Mesh(new T.SphereGeometry(r,64,40),new T.ShaderMaterial({side:T.BackSide,transparent:true,depthTest:true,depthWrite:false,uniforms:{sun:{value:SUN},tint:{value:new T.Color(color)},strength:{value:strength}},vertexShader:'varying vec3 n;varying vec3 p;void main(){vec4 w=modelMatrix*vec4(position,1.);p=w.xyz;n=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*w;}',fragmentShader:'uniform vec3 sun;uniform vec3 tint;uniform float strength;varying vec3 n;varying vec3 p;void main(){vec3 v=normalize(cameraPosition-p);float rim=pow(1.-abs(dot(normalize(n),v)),3.);float day=smoothstep(-.28,.55,dot(normalize(n),sun));gl_FragColor=vec4(tint,rim*(.05+strength*day));}'}));parent.add(a);return a}
async function planet(v){
 const info=planetInfo[v.kind],rig=new T.Group(),composition=new T.Group(),axis=new T.Group(),surface=new T.Group();rig.add(composition);composition.add(axis);axis.rotation.z=T.MathUtils.degToRad(info.tilt);axis.add(surface);v.scene.add(rig);v.planet={rig,composition,axis,surface,body:null,clouds:null,spin:0};
 const geo=new T.SphereGeometry(2,80,56),mat=new T.MeshStandardMaterial({roughness:info.roughness,metalness:0,envMap:environment,envMapIntensity:.02}),body=mesh(geo,mat,surface);body.castShadow=v.kind==='earth';body.receiveShadow=false;v.planet.body=body;surface.rotation.y=v.kind==='earth'?3.9:1.4;
 if(v.kind==='earth'){const cm=new T.MeshStandardMaterial({color:0xfffbf1,roughness:1,envMap:environment,envMapIntensity:.015,transparent:true,opacity:.87,depthTest:true,depthWrite:false}),clouds=mesh(new T.SphereGeometry(2.009,80,56),cm,surface);clouds.castShadow=false;clouds.receiveShadow=false;v.planet.clouds=clouds;atmosphere(rig,2.035,0x398aca,.4);cm.alphaMap=await loadTexture('earth-clouds.jpg',false);cm.needsUpdate=true}
 if(v.kind==='venus')atmosphere(rig,2.035,0xd1a573,.27);
 if(v.kind==='mars')atmosphere(rig,2.016,0xb78b73,.1);
 mat.map=await loadTexture(info.file);if(v.kind==='moon'||v.kind==='mars'){mat.bumpMap=mat.map;mat.bumpScale=v.kind==='moon'?.075:.026}mat.needsUpdate=true;
 if(v.kind==='earth'){
  const sat=ensure(v,'sputnik');sat.rig.scale.setScalar(.27);v.satellite=sat.rig;sat.object.hotspots.forEach(h=>h.anchor.removeFromParent());sat.object.root.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.envMap=environment;o.material.envMapIntensity=.22}});
  const pts=Array.from({length:241},(_,i)=>orbitPoint(i/240*Math.PI*2));v.orbit=new T.LineLoop(new T.BufferGeometry().setFromPoints(pts),new T.LineBasicMaterial({color:0x7b8e9f,transparent:true,opacity:.3,depthTest:true,depthWrite:false}));v.scene.add(v.orbit);
 }
}
function ensure(v,key){
 if(v.items.has(key))return v.items.get(key);const object=factories[key](),rig=new T.Group(),pose=new T.Group(),centered=new T.Group();rig.add(pose);pose.add(centered);centered.add(object.root);v.scene.add(rig);
 const meshes=[];object.root.traverse(o=>{if(!o.isMesh||o.userData.hotspot)return;o.material=o.material.clone();o.userData.originalOpacity=o.material.opacity;o.userData.originalTransparent=o.material.transparent;meshes.push(o)});
 object.hotspots.forEach(h=>{h.dot.visible=false;h.normal??=new T.Vector3(0,0,1);let best=Infinity;object.root.updateWorldMatrix(true,true);const point=h.anchor.getWorldPosition(new T.Vector3());for(const mesh of meshes){if(!isVisible(mesh))continue;const d=new T.Box3().setFromObject(mesh).distanceToPoint(point);if(d<best){best=d;h.surface=mesh}}});
 let descentBounds,landedBounds;if(key==='mars3'){landedBounds=modelBounds(object.root);object.parachute.visible=true;descentBounds=modelBounds(object.root);object.parachute.visible=false;}
 const bounds=modelBounds(object.root),item={object,rig,pose,centered,bounds,fullBounds:bounds,descentBounds,landedBounds,meshes,alpha:1};v.items.set(key,item);controller(v,key);return item;
}
function opacity(item,amount){item.alpha=amount;for(const mesh of item.meshes){let part=1;for(let p=mesh;p&&p!==item.object.root;p=p.parent)part*=p.userData.reveal??1;const alpha=amount*part*mesh.userData.originalOpacity,m=mesh.material,transparent=mesh.userData.originalTransparent||alpha<.999;if(m.transparent!==transparent){m.transparent=transparent;m.needsUpdate=true}m.opacity=alpha;m.depthWrite=!transparent}}
async function buildView(v){if(v.ready||v.building||disposed)return;v.building=true;v.scene=new T.Scene();v.camera=new T.PerspectiveCamera(38,1,.05,100);light(v,!!planetInfo[v.kind]);try{
 if(planetInfo[v.kind])await planet(v);else ensure(v,v.kind==='human'?'vostok':v.kind==='stations'?'salyut1':'sputnik');
 v.ready=true;v.el.dataset.ready='true';v.el.querySelector('.view-status').textContent='ВРАЩЕНИЕ · ПРОКРУТКА ВНИЗ';wake();
 }catch(e){v.el.dataset.ready='error';v.el.querySelector('.view-status').textContent='3D не загрузилось — рассказ доступен';console.error('Scene load',v.kind,e)}}
function state(v){
 if(!v.steps.length){const r=v.section.getBoundingClientRect();return {index:0,local:clamp(-r.top/Math.max(1,r.height-innerHeight*.2)),progress:clamp(-r.top/r.height)}}
 const rects=v.steps.map(el=>el.getBoundingClientRect()),visual=v.host.closest('.narrative-visual'),r=visual.getBoundingClientRect(),stickyTop=parseFloat(getComputedStyle(visual).top),readingTop=Math.min(innerHeight-80,stickyTop+r.height),focus=narrow()?readingTop+(innerHeight-readingTop)*.45:innerHeight*.55;
 // Distance from entry of the final step until the sticky element is released.
 const lastTravel=v.section.getBoundingClientRect().bottom-rects.at(-1).top-r.height-parseFloat(getComputedStyle(visual).top)+focus;
 const sample=sampleSteps(rects,focus,{lastTravel}),travel=sample.index===rects.length-1?lastTravel:rects[sample.index].height;return {...sample,span:transitionDistance(innerHeight)/Math.max(1,travel)};
}
function caption(v,text,year){const c=v.section.querySelector('.scene-caption'),y=v.section.querySelector('.scene-epoch');if(c)c.textContent=text;if(y)y.textContent=year||'';const step=v.section.querySelector('.scene-step');if(step)step.textContent=String(v.stage+1).padStart(2,'0')+' / '+String(v.steps.length).padStart(2,'0')}
function update(v,dt,rectOverride){
 const sample=state(v),changed=v.stage!==sample.index;v.stage=sample.index;v.local=sample.local;v.progress=sample.progress;if(changed)closeDetail(v);
 const quiet=motion.matches,animate=!quiet&&!paused,stage=v.stage,local=v.local,blend=sceneBlend(v.kind,stage,local,quiet,sample.span),year=v.steps[stage]?.dataset.year||'';
 for(const [key,c] of v.controls){if(!(v.drag&&key===v.controlKey)&&animate&&c.velocity.length()>.0001){applyScreenRotation(c.q,c.velocity.x*dt,c.velocity.y*dt,v.camera.quaternion);c.y+=c.velocity.x*dt;c.x+=c.velocity.y*dt;c.velocity.multiplyScalar(Math.exp(-5*dt))}else if(!animate)c.velocity.set(0,0);c.idle=T.MathUtils.damp(c.idle,!(v.drag&&key===v.controlKey)&&time-c.lastInput>2.3?1:0,8,dt);c.zoom=quiet?c.targetZoom:T.MathUtils.damp(c.zoom,c.targetZoom,7,dt)}
 v.steps.forEach((e,i)=>e.classList.toggle('is-current',i===stage));
 for(const item of v.items.values())item.rig.visible=false;
 let distance=8.4+(quiet?0:smooth(v.progress)*.25),targetRadius=2.02;
 if(v.planet){const c=controller(v,'planet');if(animate){v.planet.surface.rotation.y+=dt*planetInfo[v.kind].spin*c.idle;if(v.planet.clouds)v.planet.clouds.rotation.y+=dt*.0011*c.idle}v.planet.rig.quaternion.copy(c.q);v.planet.composition.rotation.y=quiet?0:smooth(v.progress)*.65;
  if(v.kind==='moon'){const previous=stage-1===2?Math.PI:0,current=stage===2?Math.PI:0;v.planet.composition.rotation.y+=T.MathUtils.lerp(previous,current,blend.t)}
  const composition=planetComposition(blend.close);v.planet.rig.visible=true;v.planet.rig.scale.setScalar(composition.scale);v.planet.rig.position.set(0,composition.y,composition.z);v.el.dataset.planetScale=composition.scale.toFixed(3);v.el.dataset.spin=v.planet.surface.rotation.y.toFixed(5);v.el.dataset.planetManual=c.y.toFixed(4);v.el.dataset.idle=c.idle.toFixed(3);
 }
 for(const [key,weight] of Object.entries(blend.weights)){
  const item=ensure(v,key);item.rig.visible=weight>.001;
  if(key==='mars3'){
   const descent=stage===1?1:stage===2?1-blend.eased:0;item.bounds={center:item.landedBounds.center.clone().lerp(item.descentBounds.center,descent),radius:T.MathUtils.lerp(item.landedBounds.radius,item.descentBounds.radius,descent)};item.object.parachute.visible=descent>.001;item.object.parachute.scale.setScalar(Math.max(.001,descent));item.object.parachute.position.y=2.4*descent;item.object.parachute.userData.reveal=descent;item.object.petals.visible=descent<.999;item.object.petals.scale.setScalar(.3+.7*(1-descent));item.object.petals.userData.reveal=1-descent;item.object.hotspots[1].anchor.visible=descent<.05;
  }
  if(key==='mir'){
   const amounts=mirAssembly(stage,quiet?1:local);item.object.modules.forEach((m,i)=>{m.userData.home??=m.position.clone();m.position.copy(m.userData.home).addScaledVector(m.userData.home.clone().normalize(),(1-amounts[i])*.65);m.visible=amounts[i]>.001;m.scale.setScalar(.8+.2*amounts[i]);m.userData.reveal=amounts[i]});item.object.hotspots.forEach((h,i)=>h.anchor.visible=i===0||i===1&&amounts[0]>.98||i===2&&amounts[2]>.98);v.el.dataset.modules=amounts.map(x=>x.toFixed(3)).join(',');v.el.dataset.assembled=String(amounts.every(x=>x>.999));
  }
  if(key!=='mars3')item.bounds=item.fullBounds;item.centered.position.copy(item.bounds.center).multiplyScalar(-1);item.rig.quaternion.copy(controller(v,key).q);item.pose.rotation.set(.07,quiet?.2:.2+v.progress*.55,0);
  const placement=craftComposition(weight,!!v.planet);item.rig.scale.setScalar(2/item.bounds.radius*placement.scale);item.rig.position.set(0,placement.y,placement.z);opacity(item,weight);
 }
 let main=v.kind==='earth'?'planet':blend.main;
 // The brief dissolve between two craft has no editable object until one dominates.
 if(main==='planet'&&!v.planet)main=null;
 if(v.drag&&v.pointer&&v.controlKey!==main){const held=blend.weights[v.pointer.key]??(v.pointer.key==='planet'?1-blend.close:0);if(held>=.85)main=v.pointer.key;}
 if(v.controlKey!==main){v.drag=false;v.pointer=null;v.el.classList.remove('dragging');v.controlKey=main;controller(v)}
 v.selectedKey=Object.keys(blend.weights).find(k=>blend.weights[k]>.97)||'';setDetails(v,!main||main==='planet'?'':main);v.el.querySelector('.reset-view').disabled=!main;
 const closeNote=blend.close>.7?' · КРУПНЫЙ ПЛАН, МАСШТАБ УСЛОВНЫЙ':'';
 if(v.kind==='earth'){distance=8.2+(quiet?0:smooth(v.progress)*2.4);v.satellite.visible=true;v.satellite.position.copy(orbitPoint(phase));v.satellite.rotation.set(.05,phase*.235,-.6);v.el.dataset.phase=String(Math.round(phase*180/Math.PI));document.querySelector('.orbit-readout').textContent='ФАЗА '+String(Math.round(phase*180/Math.PI)).padStart(3,'0')+'° · МАСШТАБ УСЛОВНЫЙ'}
 else if(v.kind==='sputnik')caption(v,['СПУТНИК-1 / РЕКОНСТРУКЦИЯ','СПУТНИК-1 / СФЕРИЧЕСКИЙ КОРПУС','СПУТНИК-1 / АНТЕННЫ И РАДИОСВЯЗЬ'][stage],year);
 else if(v.kind==='human')caption(v,stage===2?'«ВОСХОД-2» / ШЛЮЗ «ВОЛГА» И ВЫХОД ЛЕОНОВА':stage===1?'«ВОСТОК-6» / ТЕХНИЧЕСКАЯ РЕКОНСТРУКЦИЯ':'«ВОСТОК-1» / ТЕХНИЧЕСКАЯ РЕКОНСТРУКЦИЯ',year);
 else if(v.kind==='moon')caption(v,(stage===3?'«ЛУНА-9» / ПОСАДОЧНАЯ КАПСУЛА':stage===5?'«ЛУНОХОД-1» / ПОДВИЖНАЯ ЛАБОРАТОРИЯ':stage===2?'ЛУНА / ОБРАТНОЕ ПОЛУШАРИЕ':stage===4?'«ЛУНА-16» / ДОСТАВКА ГРУНТА · ЛУНА':'ЛУНА / КАРТА ПОВЕРХНОСТИ')+closeNote,year);
 else if(v.kind==='venus')caption(v,(stage===2?'«ВЕНЕРА-9» / ПОСАДОЧНЫЙ АППАРАТ':'ВЕНЕРА / ОБЛАЧНАЯ ОБОЛОЧКА')+closeNote,year);
 else if(v.kind==='mars'){caption(v,(stage===0?'МАРС / КАРТА ПОВЕРХНОСТИ':stage===1?'«МАРС-3» / РЕКОНСТРУКЦИЯ СПУСКА':stage===2?'«МАРС-3» / МЯГКАЯ ПОСАДКА':'«МАРС-3» / ПЕРЕДАЧА ПРЕКРАТИЛАСЬ')+closeNote,year);const signal=v.section.querySelector('.signal-status');if(signal)signal.textContent=stage===3?'СИГНАЛ ПРЕКРАТИЛСЯ':stage===2?'ПЕРЕДАЧА ≈20 СЕКУНД':'РЕКОНСТРУКЦИЯ'}
 else if(v.kind==='stations')caption(v,stage===0?'«САЛЮТ-1» / ПЕРВАЯ ОРБИТАЛЬНАЯ СТАНЦИЯ':stage===1?'«МИР» / БАЗОВЫЙ БЛОК':stage===2?'«МИР» / БАЗОВЫЙ БЛОК И «КВАНТ»':v.el.dataset.assembled==='true'?'«МИР» / СОВЕТСКАЯ КОНФИГУРАЦИЯ СОБРАНА · 1990':'«МИР» / «КВАНТ-2» → «КРИСТАЛЛ»',year);
 if(blend.t<.995&&blend.current!==blend.previous){const names={luna9:'«ЛУНА-9»',lunokhod1:'«ЛУНОХОД-1»',venera9:'«ВЕНЕРА-9»',mars3:'«МАРС-3»',salyut1:'«САЛЮТ-1»',mir:'«МИР»',vostok:'«ВОСТОК»',voskhod2:'«ВОСХОД-2»'},planetName={moon:'ЛУНА',venus:'ВЕНЕРА',mars:'МАРС'};caption(v,'ПЕРЕХОД / '+(names[blend.previous]||planetName[v.kind])+' → '+(names[blend.current]||planetName[v.kind]),year)}
 v.rect=rectOverride||v.el.getBoundingClientRect();const c=controller(v),r=v.rect,zoom=v.kind==='earth'?c.zoom:T.MathUtils.lerp(controller(v,blend.previous||'planet').zoom,controller(v,blend.current||'planet').zoom,blend.t);v.camera.aspect=r.width/r.height;const required=fitDistance(targetRadius,v.camera.aspect);v.fit=quiet||!v.fit||required>v.fit?required:T.MathUtils.damp(v.fit,required,14,dt);v.fitTarget=required;distance=Math.max(distance*zoom,v.fit)+(v.planet&&v.kind!=='earth'?.7*Math.sin(Math.PI*blend.close):0);const attention=v.planet&&v.kind!=='earth'?-.12*Math.sin(Math.PI*blend.close):0;v.camera.position.set(0,Math.sin(.055)*distance+attention,Math.cos(.055)*distance);v.camera.lookAt(0,attention,0);v.camera.updateProjectionMatrix();v.scene.updateMatrixWorld(true);
 Object.assign(v.el.dataset,{stage:String(stage),progress:v.progress.toFixed(4),local:local.toFixed(4),manual:c.y.toFixed(4),manualVertical:c.x.toFixed(4),main:main||'',craft:v.selectedKey,distance:distance.toFixed(3),transition:blend.t.toFixed(4),weights:JSON.stringify(blend.weights)});v.el.querySelector('.drag-label').textContent=!main?'ПЕРЕХОД СЦЕНЫ':main==='planet'?'↔ ВРАЩАТЬ ПЛАНЕТУ':'↔ ВРАЩАТЬ АППАРАТ';
 updateMarkers(v);
}
function resize(){if(!renderer)return;renderer.setPixelRatio(Math.min(devicePixelRatio||1,narrow()?1.2:1.6)*quality);renderer.setSize(innerWidth,innerHeight,false);wake()}
function tick(now){raf=0;if(disposed||lost||document.hidden)return;const dt=Math.min(.05,last?(now-last)/1000:1/60);last=now;time+=dt;
 const visible=views.filter(v=>v.active&&v.ready);if(visible.length&&!motion.matches&&!paused){phase+=dt*.17;if(phase>=Math.PI*2){phase-=Math.PI*2;orbits++}}
 const start=performance.now();
 for(const v of views){if(!v.mask)continue;const r=v.host.closest('.narrative-visual').getBoundingClientRect();v.mask.hidden=r.bottom<0||r.top>innerHeight;Object.assign(v.mask.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'});sky.copyTo(v.mask,r);}
 renderer.setScissorTest(false);renderer.setClearColor(0,0);renderer.clear();renderer.setScissorTest(true);let calls=0,triangles=0,count=0;
 for(const v of visible){let r=v.el.getBoundingClientRect();const section=v.section.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight||section.bottom<80)continue;v.rect=r;update(v,dt);r=v.rect;const l=Math.max(0,r.left),b=Math.max(0,innerHeight-r.bottom),right=Math.min(innerWidth,r.right),top=Math.min(innerHeight,innerHeight-r.top);renderer.setViewport(r.left,innerHeight-r.bottom,r.width,r.height);renderer.setScissor(l,b,Math.max(0,right-l),Math.max(0,top-b));renderer.clear(true,true,true);renderer.render(v.scene,v.camera);calls+=renderer.info.render.calls;triangles+=renderer.info.render.triangles;count++}
 renderer.setScissorTest(false);frames++;cpu+=performance.now()-start;if(count&&dt>.036){if(++slow>120&&quality>.65){quality=Math.max(.65,quality-.15);slow=0;resize()}}else slow=Math.max(0,slow-1);
 if(qa&&(frames%15===0||paused||motion.matches))qa.querySelector('output').textContent=JSON.stringify({contexts:1,activeViews:count,calls,triangles,dpr:renderer.getPixelRatio(),geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,frames,meanCpuMs:+(cpu/frames).toFixed(2),phase:Math.round(phase*180/Math.PI),completedOrbits:orbits,paused,reducedMotion:motion.matches,contextLost:lost,scenes:visible.map(v=>({kind:v.kind,stage:v.stage,progress:+v.progress.toFixed(3),manual:+controller(v).y.toFixed(3),main:v.controlKey,local:+v.local.toFixed(3),markers:v.markers.filter(m=>m.visible).length}))},null,2);
 const unsettled=visible.some(v=>Math.abs((v.fit||0)-(v.fitTarget||0))>.001||v.drag||[...v.controls.values()].some(c=>c.velocity.length()>.002||Math.abs(c.zoom-c.targetZoom)>.001));if((count&&!paused&&!motion.matches)||unsettled)wake();
}
async function depthAudit(){
 const v=views[0];if(!v.ready)return;const target=new T.WebGLRenderTarget(256,256),pixels=new Uint8Array(256*256*4),white=new T.MeshBasicMaterial({color:0xffffff}),red=new T.MeshBasicMaterial({color:0xff0000}),saved=[];
 const old={phase,manual:controller(v,'planet').q.clone(),my:controller(v,'planet').y,mx:controller(v,'planet').x,paused,body:v.planet.body.material,cloud:v.planet.clouds.visible,orbit:v.orbit.visible};v.planet.body.material=white;v.planet.clouds.visible=false;v.orbit.visible=false;v.satellite.traverse(o=>{if(o.isMesh){saved.push([o,o.material]);o.material=red}});paused=true;const result=[];
 try{renderer.setScissorTest(false);renderer.setRenderTarget(target);for(const angle of [0,.55,-.65])for(const orbitalPhase of [Math.PI/2,Math.PI*1.5]){
  phase=orbitalPhase;controller(v,'planet').y=angle;controller(v,'planet').x=0;controller(v,'planet').q.setFromEuler(new T.Euler(0,angle,0));update(v,0,{width:256,height:256});const counts=[];
  for(const visible of [false,true]){v.planet.rig.visible=visible;renderer.setClearColor(0x000000,1);renderer.clear();renderer.render(v.scene,v.camera);renderer.readRenderTargetPixels(target,0,0,256,256,pixels);let n=0;for(let i=0;i<pixels.length;i+=4)if(pixels[i]>120&&pixels[i+1]<50&&pixels[i+2]<50)n++;counts.push(n)}result.push({rotation:angle,phase:Math.round(orbitalPhase*180/Math.PI),withoutEarth:counts[0],withEarth:counts[1]});
 }}finally{v.planet.rig.visible=true;v.planet.body.material=old.body;v.planet.clouds.visible=old.cloud;v.orbit.visible=old.orbit;saved.forEach(([o,m])=>o.material=m);phase=old.phase;controller(v,'planet').q.copy(old.manual);controller(v,'planet').y=old.my;controller(v,'planet').x=old.mx;paused=old.paused;renderer.setRenderTarget(null);target.dispose();white.dispose();red.dispose();wake()}
 qa.querySelector('pre').textContent=JSON.stringify({passed:result.filter(r=>r.phase===270&&r.withoutEarth>0&&r.withEarth===0).length===3&&result.filter(r=>r.phase===90&&r.withEarth>0).length===3,results:result},null,2);
}
function diagnostics(){if(!new URLSearchParams(location.search).has('qa'))return;qa=document.createElement('details');qa.className='graphics-qa';qa.innerHTML='<summary>Проверка 3D</summary><button class="depth-audit">Проверить глубину</button><output></output><pre></pre>';document.body.append(qa);qa.querySelector('button').addEventListener('click',depthAudit)}
export async function initMuseum(){
 mount();sky=createStarfield();sky.setPaused(paused||motion.matches);try{renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'})}catch(e){document.documentElement.classList.add('webgl-unavailable');document.querySelectorAll('.view-status').forEach(e=>e.textContent='Текст и источники доступны без WebGL');return}
 renderer.domElement.className='webgl-layer';renderer.domElement.setAttribute('aria-hidden','true');renderer.autoClear=false;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.03;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;document.body.append(renderer.domElement);
 masks=document.createElement('div');masks.className='scene-mask-layer';masks.setAttribute('aria-hidden','true');for(const v of views){if(v.kind==='earth')continue;v.mask=document.createElement('div');v.mask.className='scene-mask mask-'+v.kind;v.mask.hidden=true;masks.append(v.mask)}document.body.append(masks);
 const pmrem=new T.PMREMGenerator(renderer),room=new RoomEnvironment();environmentTarget=pmrem.fromScene(room,.02);environment=environmentTarget.texture;room.dispose();pmrem.dispose();resize();
 observer=new IntersectionObserver(entries=>{for(const e of entries){const v=views.find(v=>v.el===e.target);v.active=e.isIntersecting;if(e.isIntersecting)buildView(v);else closeDetail(v)}wake()},{rootMargin:'200px'});views.forEach(v=>observer.observe(v.el));
 addEventListener('scroll',wake,{passive:true});addEventListener('resize',resize);motion.addEventListener('change',()=>{sky.setPaused(paused||motion.matches);wake()});document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;last=0}else wake()});
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;cancelAnimationFrame(raf);raf=0;document.documentElement.classList.add('webgl-unavailable')});renderer.domElement.addEventListener('webglcontextrestored',()=>{lost=false;document.documentElement.classList.remove('webgl-unavailable');resize();wake()});
 addEventListener('pagehide',e=>{if(e.persisted)return;disposed=true;sky.dispose();cancelAnimationFrame(raf);observer.disconnect();const geos=new Set(),mats=new Set(),textures=new Set();views.forEach(v=>v.scene?.traverse(o=>{if(o.geometry)geos.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])if(m){mats.add(m);Object.values(m).forEach(t=>{if(t?.isTexture)textures.add(t)})}}));geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());environmentTarget.dispose();renderer.dispose()});diagnostics();wake();
}
