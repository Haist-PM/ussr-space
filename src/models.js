import * as T from 'three';
const sphereGeo = new T.SphereGeometry(1,48,32);
const smallSphereGeo=new T.SphereGeometry(1,12,8),mediumSphereGeo=new T.SphereGeometry(1,24,16);
const mats={
 titanium:new T.MeshStandardMaterial({color:0xc5ccd0,metalness:.87,roughness:.29}),
 silver:new T.MeshStandardMaterial({color:0xe1e5e5,metalness:.96,roughness:.2}),
 dark:new T.MeshStandardMaterial({color:0x252d31,metalness:.63,roughness:.5}),
 foil:new T.MeshStandardMaterial({color:0xb79250,metalness:.77,roughness:.47}),
 white:new T.MeshStandardMaterial({color:0xdddcd1,metalness:.13,roughness:.62}),
 glass:new T.MeshStandardMaterial({color:0x091924,metalness:.55,roughness:.12}),
 red:new T.MeshStandardMaterial({color:0xc64b3d,metalness:.35,roughness:.4}),
 marker:new T.MeshBasicMaterial({color:0xef8067,depthTest:true,depthWrite:true})
};
export function mesh(geo,mat,parent,pos=[0,0,0],scale){const m=new T.Mesh(geo,typeof mat==='string'?mats[mat]:mat);m.position.set(...pos);if(scale)m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;parent?.add(m);return m}
function sphere(parent,r,pos,mat='titanium'){return mesh(r<.08?smallSphereGeo:r<.18?mediumSphereGeo:sphereGeo,mat,parent,pos,[r,r,r])}
function cylinder(parent,rt,rb,h,pos,mat='titanium',segments=48){return mesh(new T.CylinderGeometry(rt,rb,h,segments),mat,parent,pos)}
function ring(parent,r,t,pos,mat='titanium',rot=[Math.PI/2,0,0]){const m=mesh(new T.TorusGeometry(r,t,8,80),mat,parent,pos);m.rotation.set(...rot);return m}
export function rod(parent,a,b,r=.012,mat='titanium'){const av=new T.Vector3(...a),bv=new T.Vector3(...b),d=bv.clone().sub(av),m=cylinder(parent,r,r,d.length(),av.clone().add(bv).multiplyScalar(.5).toArray(),mat,8);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return m}
function bolts(parent,r,y,count=12){for(let i=0;i<count;i++){const a=i/count*Math.PI*2;sphere(parent,.022,[Math.cos(a)*r,y,Math.sin(a)*r],'dark')}}
export function hotspot(parent,pos,title,text){const anchor=new T.Object3D();anchor.position.set(...pos);parent.add(anchor);const dot=sphere(anchor,.034,[0,0,0],'marker');dot.castShadow=false;dot.receiveShadow=false;dot.userData={hotspot:true,title,text};return {anchor,dot,title,text,normal:new T.Vector3(0,0,1)}}
export function sputnik(){const root=new T.Group();root.name='Sputnik-1';sphere(root,.29,[0,0,0],'silver');ring(root,.291,.003,[0,0,0],'titanium',[.2,0,0]);const antennaGroup=new T.Group();root.add(antennaGroup);for(let i=0;i<4;i++){const a=Math.PI/4+i*Math.PI/2,base=[Math.cos(a)*.15,-.21,Math.sin(a)*.15],len=i<2?2.4:2.9,end=[Math.cos(a)*.48,-len,Math.sin(a)*.48];rod(antennaGroup,base,end,.006,'silver');sphere(root,.026,base,'dark')}root.rotation.z=-.6;return {root,hotspots:[hotspot(root,[-.18,.20,.18],'Сферический корпус','Герметичная оболочка диаметром 58 см. Внутри находились приборы и источники питания.'),hotspot(root,[.25,-.8,.25],'Четыре антенны','Две пары стержневых антенн разной длины передавали сигналы радиопередатчиков.')]}}
export function vostok(){const root=new T.Group();root.name='Vostok';const capsule=sphere(root,.83,[0,.7,0],'dark');ring(root,.827,.013,[0,.7,0],'titanium',[0,0,0]);ring(root,.83,.01,[0,.7,0],'titanium',[0,Math.PI/2,0]);
// Spherical descent capsule above the biconical instrument module: no solar wings.
const hatch=cylinder(root,.30,.30,.045,[0,.75,.782],'titanium');hatch.rotation.x=Math.PI/2;const window=cylinder(root,.11,.11,.05,[0,.77,.814],'glass');window.rotation.x=Math.PI/2;for(let i=0;i<12;i++){let a=i/12*Math.PI*2;sphere(root,.015,[Math.cos(a)*.26,.75+Math.sin(a)*.26,.813],'dark')}
cylinder(root,.6,.8,.55,[0,-.42,0],'titanium');cylinder(root,.8,.46,.64,[0,-1.015,0],'titanium');ring(root,.805,.025,[0,-.7,0]);cylinder(root,.23,.35,.28,[0,-1.45,0],'dark');cylinder(root,.3,.3,.06,[0,-1.59,0],'silver');
for(let i=0;i<20;i++){const a=i/20*Math.PI*2,m=mesh(new T.BoxGeometry(.1,.38,.028),'dark',root,[Math.cos(a)*.74,-.55,Math.sin(a)*.74]);m.rotation.y=-a+Math.PI/2}
for(let i=0;i<6;i++){const a=i/6*Math.PI*2,xx=Math.cos(a),zz=Math.sin(a);rod(root,[xx*.61,-.23,zz*.61],[xx*.56,.12,zz*.56],.025);sphere(root,.105,[xx*.75,-1,zz*.75],'white')}
for(let i=0;i<4;i++){let a=i/4*Math.PI*2;rod(root,[Math.cos(a)*.72,-.63,Math.sin(a)*.72],[Math.cos(a)*1.18,-.15,Math.sin(a)*1.18],.009)}
const eva=new T.Group();eva.visible=false;root.add(eva);const airlock=cylinder(eva,.34,.34,.75,[1.0,.8,0],'white');airlock.rotation.z=Math.PI/2;ring(eva,.35,.025,[1.4,.8,0],'dark',[0,Math.PI/2,0]);const cosmonaut=new T.Group();cosmonaut.position.set(2.0,1.25,.2);cosmonaut.rotation.z=-.25;eva.add(cosmonaut);sphere(cosmonaut,.15,[0,.35,0],'white');sphere(cosmonaut,.113,[0,.35,.075],'glass');mesh(new T.CapsuleGeometry(.12,.27,6,12),'white',cosmonaut);for(const [a,b] of [[[-.12,.15,0],[-.34,.26,0]],[[.12,.15,0],[.34,.42,0]],[[-.07,-.2,0],[-.2,-.51,.04]],[[.07,-.2,0],[.20,-.48,-.06]]])rod(cosmonaut,a,b,.054,'white');const curve=new T.CatmullRomCurve3([new T.Vector3(1.35,.8,0),new T.Vector3(1.5,1.7,.1),new T.Vector3(2.0,1.7,.2),new T.Vector3(2,1.25,.2)]);mesh(new T.TubeGeometry(curve,28,.007,5,false),'white',eva);
return {root,eva,hotspots:[hotspot(root,[.36,1.3,.53],'Спускаемый аппарат','Сферическая капсула с теплозащитой предназначалась для возвращения космонавта на Землю.'),hotspot(root,[.54,-.62,.60],'Приборный отсек','Содержал системы ориентации, электропитания и тормозную двигательную установку.'),hotspot(root,[0,.76,.86],'Люк и иллюминатор','Элементы капсулы показаны схематично. «Восток» не имел солнечных панелей.') ]}}
export function luna9(){const root=new T.Group();root.name='Luna-9 landed capsule';sphere(root,.55,[0,.05,0],'titanium');ring(root,.55,.018,[0,.08,0],'dark');cylinder(root,.24,.32,.13,[0,.53,0],'dark');cylinder(root,.15,.15,.43,[0,.77,0],'silver');const optical=cylinder(root,.085,.085,.11,[0,.91,.13],'glass');optical.rotation.x=Math.PI/2;
// Four opening stabilizing petals, not a four-legged generic lunar lander.
const petals=new T.Group();root.add(petals);for(let i=0;i<4;i++){const a=i/4*Math.PI*2,pivot=new T.Group();pivot.rotation.y=a;petals.add(pivot);const petal=mesh(new T.SphereGeometry(.66,24,16,Math.PI*.12,Math.PI*.76,Math.PI*.20,Math.PI*.45),new T.MeshStandardMaterial({color:0xa8a69b,metalness:.7,roughness:.42,side:T.DoubleSide}),pivot,[0,-.22,.63]);petal.rotation.x=.88;petal.scale.set(.64,.28,1.15);rod(pivot,[0,-.18,.23],[0,-.32,1.10],.012,'titanium');rod(pivot,[0,.23,.2],[0,.98,.96],.007,'silver');sphere(pivot,.025,[0,.98,.96],'dark')}
bolts(root,.43,.36,12);return {root,petals,hotspots:[hotspot(root,[0,.95,.21],'Телевизионная камера','Панорамная камера передала изображения поверхности после мягкой посадки.'),hotspot(root,[.2,-.18,.9],'Раскрывающиеся лепестки','Четыре лепестка раскрывались после посадки и стабилизировали капсулу.'),hotspot(root,[-.3,.3,.4],'Герметичная капсула','Посадочная станция отделялась от аппарата снижения. Показано её раскрытое состояние.')]}}
export function venera9(){const root=new T.Group();root.name='Venera-9 lander';ring(root,.96,.105,[0,-.87,0],'titanium');cylinder(root,.57,.60,.95,[0,-.14,0],'white');sphere(root,.57,[0,.27,0],'white');ring(root,.58,.025,[0,.05,0],'titanium');ring(root,.59,.03,[0,-.5,0],'titanium');
for(let i=0;i<8;i++){const a=i/8*Math.PI*2;rod(root,[Math.cos(a)*.46,-.43,Math.sin(a)*.46],[Math.cos(a)*.9,-.87,Math.sin(a)*.9],.034);sphere(root,.024,[Math.cos(a)*.6,-.49,Math.sin(a)*.6],'dark')}
// Large aerodynamic braking disk and central communications mast.
cylinder(root,1.01,1.01,.06,[0,.83,0],'foil');ring(root,1.01,.016,[0,.83,0],'titanium');cylinder(root,.21,.31,.31,[0,.59,0],'titanium');cylinder(root,.08,.08,.63,[0,1.16,0],'white');sphere(root,.13,[0,1.50,0],'titanium');for(let i=0;i<6;i++){let a=i/6*Math.PI*2;rod(root,[0,.82,0],[Math.cos(a)*.93,.82,Math.sin(a)*.93],.011,'titanium')}
for(const s of [-1,1]){cylinder(root,.105,.12,.55,[s*.62,-.11,0],'titanium');const lens=cylinder(root,.062,.062,.09,[s*.7,.02,.06],'glass');lens.rotation.z=Math.PI/2;mesh(new T.BoxGeometry(.15,.21,.19),'foil',root,[s*.49,-.15,.33])}
rod(root,[.23,.37,.41],[.4,.7,.73],.013);sphere(root,.04,[.4,.7,.73],'dark');return {root,hotspots:[hotspot(root,[.2,.885,.95],'Аэродинамический тормоз','Диск помогал замедлить спуск в плотной атмосфере Венеры.'),hotspot(root,[.32,.07,.51],'Термозащищённый корпус','Прочный корпус защищал аппаратуру от давления; теплоизоляция задерживала перегрев.'),hotspot(root,[-.68,.08,.1],'Телевизионная камера','«Венера-9» передала первую панораму с поверхности другой планеты.')]}}

// Third pass additions: recognizable silhouettes, not CAD or flight simulation.
let solarTexture;
function solarMaterial(){
 if(!solarTexture&&typeof document!=='undefined'){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;const c=canvas.getContext('2d');c.fillStyle='#112c49';c.fillRect(0,0,512,256);
  for(let y=0;y<8;y++)for(let x=0;x<20;x++){c.fillStyle=(x+y)%3?'#244967':'#315c76';c.fillRect(x*25+2,y*32+2,22,28);c.fillStyle='#879caa';c.fillRect(x*25+11,y*32+2,1,28)}
  solarTexture=new T.CanvasTexture(canvas);solarTexture.colorSpace=T.SRGBColorSpace;
 }
 return new T.MeshStandardMaterial({color:0xa5c4d8,map:solarTexture||null,metalness:.45,roughness:.42,side:T.DoubleSide});
}
function box(parent,w,h,d,pos,mat='titanium'){return mesh(new T.BoxGeometry(w,h,d),mat,parent,pos)}
function panel(parent,w,h,pos){const g=new T.Group();g.position.set(...pos);parent.add(g);box(g,w+.045,h+.045,.035,[0,0,0],'titanium');box(g,w,h,.039,[0,0,.008],solarMaterial());return g}
export function voskhod2(){
 const craft=vostok();craft.eva.removeFromParent();const root=craft.root;root.name='Voskhod-2';const airlock=new T.Group();airlock.position.set(.75,.72,0);root.add(airlock);
 const tube=cylinder(airlock,.43,.43,1.8,[.9,0,0],'white');tube.rotation.z=Math.PI/2;
 for(let i=0;i<12;i++)ring(airlock,.44,.013,[i/11*1.8,0,0],'dark',[0,Math.PI/2,0]);
 ring(airlock,.45,.035,[1.8,0,0],'titanium',[0,Math.PI/2,0]);
 for(let i=0;i<4;i++){const a=i/4*Math.PI*2;sphere(airlock,.12,[.08,Math.sin(a)*.55,Math.cos(a)*.55],'titanium')}
 const astronaut=craft.eva.children.find(o=>o.isGroup)?.clone();if(astronaut){astronaut.position.set(3.35,1.2,.15);root.add(astronaut)}
 const curve=new T.CatmullRomCurve3([new T.Vector3(2.5,.72,0),new T.Vector3(2.6,1.65,.1),new T.Vector3(3.4,1.7,.15),new T.Vector3(3.35,1.2,.15)]);mesh(new T.TubeGeometry(curve,24,.007,5),'white',root);
 craft.hotspots.forEach(h=>h.anchor.removeFromParent());return {root,airlock,astronaut,hotspots:[hotspot(root,[1.6,1.17,.13],'Шлюз «Волга»','Надувной шлюз позволил выйти наружу без разгерметизации всей кабины. Конструкция и тканевые рёбра показаны условно.'),hotspot(root,[.1,1.4,.5],'Кабина «Восхода-2»','В корабле находились Павел Беляев и Алексей Леонов. Визуализация показывает внешнюю конструкцию.'),hotspot(root,[3.3,1.5,.15],'Леонов и страховочный фал','Скафандр и фал — необходимые элементы первого выхода в открытый космос.')]};
}
export function lunokhod1(){
 const root=new T.Group();root.name='Lunokhod-1';cylinder(root,.83,.62,.55,[0,.32,0],'titanium');ring(root,.84,.035,[0,.6,0]);box(root,1.5,.13,1.48,[0,-.01,0],'dark');
 for(const side of [-1,1])for(let i=0;i<4;i++){
  const y=-.22,z=-.63+i*.42,x=side*.95,wheel=cylinder(root,.24,.24,.16,[x,y,z],'dark',24);wheel.rotation.z=Math.PI/2;ring(root,.225,.022,[x+side*.09,y,z],'titanium',[0,Math.PI/2,0]);
  for(let j=0;j<8;j++){const a=j/8*Math.PI*2;rod(root,[x+side*.09,y,z],[x+side*.09,y+Math.cos(a)*.21,z+Math.sin(a)*.21],.012,'titanium')}
  rod(root,[side*.55,0,z],[x,y,z],.03,'dark');
 }
 const lid=new T.Group();lid.position.set(0,.58,-.78);lid.rotation.x=-.7;root.add(lid);const disk=cylinder(lid,.81,.81,.035,[0,.78,0],'titanium');disk.rotation.x=Math.PI/2;const cells=cylinder(lid,.77,.77,.04,[0,.78,.024],solarMaterial());cells.rotation.x=Math.PI/2;
 for(const x of [-.48,.48]){const camera=cylinder(root,.10,.1,.17,[x,.44,.82],'glass');camera.rotation.x=Math.PI/2;rod(root,[x,.45,.45],[x,.44,.82],.025)}
 rod(root,[-.48,.55,-.4],[-.48,1.2,-.4],.016);sphere(root,.07,[-.48,1.2,-.4],'dark');rod(root,[.38,.55,-.2],[.38,1.7,-.2],.012);const antenna=mesh(new T.ConeGeometry(.16,.22,24),'titanium',root,[.38,1.7,-.2]);antenna.rotation.x=-.4;
 return {root,lid,hotspots:[hotspot(root,[.96,-.19,.875],'Восемь колёс','Восемь независимо приводимых колёс позволяли исследовать поверхность Луны.'),hotspot(root,[-.3,1.3,-.4],'Крышка с солнечными элементами','Днём открытая крышка собирала солнечную энергию; ночью закрывалась, сохраняя тепло.'),hotspot(root,[.48,.44,.925],'Телекамеры','Изображения передавались на Землю, откуда операторы управляли движением.') ]};
}
export function mars3(){
 const root=new T.Group();root.name='Mars-3 descent lander';sphere(root,.46,[0,.04,0],'titanium');ring(root,.47,.021,[0,.08,0],'dark');cylinder(root,.18,.28,.16,[0,.48,0],'dark');
 const petals=new T.Group();root.add(petals);
 for(let i=0;i<4;i++){const a=i/4*Math.PI*2,p=new T.Group();p.rotation.y=a;petals.add(p);const leaf=mesh(new T.SphereGeometry(.63,20,12,.2,2.5,.4,1.2),new T.MeshStandardMaterial({color:0xb1aba0,metalness:.72,roughness:.44,side:T.DoubleSide}),p,[0,-.18,.55]);leaf.scale.set(.65,.22,1.08);leaf.rotation.x=.9;rod(p,[0,.2,.12],[0,.78,.87],.01,'silver')}
 cylinder(root,.06,.06,.40,[0,.73,0],'silver');sphere(root,.10,[0,.96,0],'dark');
 const parachute=new T.Group();parachute.position.y=2.4;root.add(parachute);
 const canopy=mesh(new T.SphereGeometry(1.4,24,12,0,Math.PI*2,0,Math.PI/2),new T.MeshStandardMaterial({color:0xd8cbb6,roughness:.9,side:T.DoubleSide}),parachute,[0,0,0]);
 for(let i=0;i<8;i++){const a=i/8*Math.PI*2;rod(parachute,[Math.cos(a)*1.35,0,Math.sin(a)*1.35],[0,-1.8,0],.005,'white')}
 parachute.visible=false;return {root,petals,parachute,hotspots:[hotspot(root,[0,.96,.1],'Посадочная станция','Показана условная внешняя реконструкция. Данные с поверхности передавались лишь около 20 секунд.'),hotspot(root,[.1,-.12,.78],'Раскрывающиеся лепестки','Опорные лепестки помогали установить посадочную станцию на поверхности.') ]};
}
function stationHull(parent,y,length,r){cylinder(parent,r,r,length,[0,y,0],'white');for(const offset of [-.45,0,.45])ring(parent,r+.005,.018,[0,y+offset*length,0],'titanium');for(let i=0;i<6;i++){const a=i/6*Math.PI*2;box(parent,.05,length*.75,.025,[Math.cos(a)*r,y,Math.sin(a)*r],'titanium')};return parent}
export function salyut1(){
 const root=new T.Group();root.name='Salyut-1';stationHull(root,0,2.6,.57);cylinder(root,.36,.57,.6,[0,1.6,0],'titanium');stationHull(root,2.02,.4,.36);cylinder(root,.22,.22,.16,[0,2.31,0],'dark');stationHull(root,-1.57,.52,.42);
 for(const y of [-1.5,1.75])for(const side of [-1,1]){rod(root,[side*.35,y,0],[side*1.05,y,0],.025);panel(root,1.15,.6,[side*1.45,y,0])}
 for(let i=0;i<4;i++){const a=i/4*Math.PI*2;rod(root,[Math.cos(a)*.4,-1.7,Math.sin(a)*.4],[Math.cos(a)*.85,-2.1,Math.sin(a)*.85],.012)}
 root.rotation.z=-.72;return {root,hotspots:[hotspot(root,[.08,.4,.59],'Рабочий отсек','Первая станция стала местом научной работы и длительного пребывания экипажа.'),hotspot(root,[0,2.31,.24],'Стыковочный узел','Через стыковочный узел экипаж попадал на станцию из корабля «Союз».')]};
}
export function mir(){
 const root=new T.Group();root.name='Mir Soviet configuration 1990';stationHull(root,0,2.8,.51);cylinder(root,.32,.51,.58,[0,1.69,0],'titanium');sphere(root,.35,[0,2.14,0],'white');cylinder(root,.20,.2,.25,[0,2.48,0],'dark');
 for(const side of [-1,1]){rod(root,[side*.4,-.25,0],[side*1.1,-.25,0],.025);panel(root,1.8,.78,[side*1.67,-.25,0])}panel(root,.65,1.65,[0,-.25,-.75]);
 const modules=[];
 const kvant=new T.Group();kvant.position.set(0,-2.13,0);root.add(kvant);stationHull(kvant,0,1.25,.38);cylinder(kvant,.21,.21,.22,[0,-.76,0],'dark');modules.push(kvant);
 for(const side of [-1,1]){const g=new T.Group();g.position.set(side*1.28,2.14,0);g.rotation.z=-side*Math.PI/2;root.add(g);stationHull(g,0,1.7,.39);cylinder(g,.2,.39,.4,[0,-1.03,0],'titanium');for(const wing of [-1,1])panel(g,1.45,.6,[wing*1.10,.2,0]);modules.push(g)}
 root.rotation.z=-.4;return {root,modules,hotspots:[hotspot(root,[0,.2,.53],'Базовый блок','Основа жилой и служебной системы станции, запущенная в 1986 году.'),hotspot(root,[0,-2.2,.4],'«Квант»','Первый специализированный научный модуль присоединился в 1987 году.'),hotspot(root,[1.28,2.14,.43],'Модульный принцип','«Квант-2» и «Кристалл» расширили станцию в 1989–1990 годах. Послесоветские модули не показаны.')]};
}
