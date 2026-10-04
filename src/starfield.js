// One low-resolution 2D sky shared by the page and the sticky scene masks.
// Mask canvases copy the same pixels, so stars never change at a section boundary.
export function starCatalog(count=240){
 let seed=571957;const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};
 return Array.from({length:count},()=>{const tier=random();return {x:random(),y:random(),radius:tier<.8?.35+random()*.3:tier<.97?.7+random()*.2:1+random()*.2,alpha:tier<.8?.14+random()*.17:tier<.97?.32+random()*.18:.57+random()*.12,cool:random()<.22,twinkle:random()<.15,period:4+random()*6,phase:random()*Math.PI*2}});
}
export const starAlpha=(star,time)=>star.alpha*(star.twinkle?1+.12*Math.sin(time*Math.PI*2/star.period+star.phase):1);
export function createStarfield(){
 const canvas=document.createElement('canvas');canvas.className='global-starfield';canvas.setAttribute('aria-hidden','true');document.body.prepend(canvas);
 const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)return {setPaused(){},copyTo(){},dispose(){canvas.remove()}};
 const stars=starCatalog(),copies=new Map();let width=0,height=0,dpr=1,paused=false,raf=0,last=0,clock=0,painted=0,version=0;
 function copyTo(mask,rect){
  if(mask.hidden)return;let entry=copies.get(mask);
  if(!entry){const surface=document.createElement('canvas');surface.setAttribute('aria-hidden','true');mask.append(surface);entry={surface,context:surface.getContext('2d',{alpha:false})};copies.set(mask,entry)}
  if(!entry.context)return;const {surface,context}=entry,w=Math.ceil(rect.width*dpr),h=Math.ceil(rect.height*dpr);if(!w||!h)return;
  const key=[version,rect.left,rect.top,w,h].join(':');if(entry.key===key)return;entry.key=key;
  if(surface.width!==w||surface.height!==h){surface.width=w;surface.height=h}
  context.setTransform(1,0,0,1,0,0);context.fillStyle='#070b10';context.fillRect(0,0,w,h);context.drawImage(canvas,-rect.left*dpr,-rect.top*dpr);entry.rect=rect;
 }
 function paint(){
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#070b10';ctx.fillRect(0,0,width,height);
  const count=Math.min(stars.length,Math.max(80,Math.round(width*height/6000)));
  for(const star of stars.slice(0,count)){ctx.globalAlpha=starAlpha(star,clock);ctx.fillStyle=star.cool?'#b9d5ee':'#e3e9ef';ctx.beginPath();ctx.arc(star.x*width,star.y*height,star.radius,0,Math.PI*2);ctx.fill()}
  ctx.globalAlpha=1;version++;for(const [mask,entry] of copies)if(entry.rect&&!mask.hidden)copyTo(mask,entry.rect);
 }
 function wake(){if(!raf&&!paused&&!document.hidden)raf=requestAnimationFrame(frame)}
 function frame(now){raf=0;if(paused||document.hidden)return;if(last)clock+=Math.min(.1,(now-last)/1000);last=now;if(now-painted>=1000/24){painted=now;paint()}wake()}
 function resize(){width=innerWidth;height=innerHeight;dpr=Math.min(devicePixelRatio||1,1.25);canvas.width=Math.ceil(width*dpr);canvas.height=Math.ceil(height*dpr);paint()}
 function visibility(){last=0;if(document.hidden){cancelAnimationFrame(raf);raf=0}else wake()}
 addEventListener('resize',resize);document.addEventListener('visibilitychange',visibility);resize();wake();
 return {copyTo,setPaused(value){paused=value;last=0;if(paused){cancelAnimationFrame(raf);raf=0}else wake()},dispose(){cancelAnimationFrame(raf);removeEventListener('resize',resize);document.removeEventListener('visibilitychange',visibility);canvas.remove();for(const {surface} of copies.values())surface.remove();copies.clear()}};
}
