// Scroll is the only clock for the narrative. Backward travel replays the same state.
export const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
export const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
export function sampleSteps(rects,focus,{lastTravel}={}){
 if(!rects.length)return {index:0,local:0,progress:0};
 let index=0;for(let i=0;i<rects.length;i++)if(rects[i].top<=focus)index=i;
 const rect=rects[index],travel=index===rects.length-1&&lastTravel!=null?lastTravel:rect.height;
 const local=clamp((focus-rect.top)/Math.max(1,travel));return {index,local,progress:clamp((index+local)/rects.length)};
}
export function transitionAt(stage,local,reduced=false,span=.38){return stage===0||reduced?1:smooth(local/span)}
export function craftFor(kind,stage){
 if(kind==='sputnik')return 'sputnik';
 if(kind==='human')return stage===2?'voskhod2':'vostok';
 if(kind==='moon')return stage===3?'luna9':stage===5?'lunokhod1':null;
 if(kind==='venus')return stage===2?'venera9':null;
 if(kind==='mars')return stage>0?'mars3':null;
 if(kind==='stations')return stage===0?'salyut1':'mir';
 return null;
}
export function sceneBlend(kind,stage,local,reduced=false,span=.38){
 const current=craftFor(kind,stage),previous=craftFor(kind,Math.max(0,stage-1)),t=transitionAt(stage,local,reduced,span);
 const different=previous!==current;
 const outgoing=different&&previous?(current?1-smooth(t/.46):1-smooth(t/.68)):0;
 const incoming=!different?1:current?(previous?smooth((t-.54)/.46):smooth((t-.32)/.68)):0;
 const weights={};if(previous&&outgoing>0)weights[previous]=outgoing;if(current&&incoming>0)weights[current]=incoming;
 const close=['moon','venus','mars'].includes(kind)?(previous?1:0)*(1-t)+(current?1:0)*t:0;
 const main=Object.entries(weights).sort((a,b)=>b[1]-a[1])[0];
 return {current,previous,t,close,weights,main:main&&main[1]>.52?main[0]:'planet'};
}
export function mirAssembly(stage,local){
 if(stage<2)return [0,0,0];
 if(stage===2)return [smooth(local/.42),0,0];
 return [1,smooth(local/.24),smooth((local-.27)/.27)];
}

export function planetComposition(close){
 const shift=smooth(close/.6);return {scale:1+3.4*close,y:-10.2*shift,z:-4.5*shift};
}
