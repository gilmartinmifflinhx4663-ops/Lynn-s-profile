/* Independent letter-image animation. MIT licensed. */
const CONFIG=window.LETTER_CONFIG;
const tokens=Array.from(CONFIG.text.trim());
const ASSETS=tokens.filter(ch=>! /\s/.test(ch)).map((ch,i)=>CONFIG.imagesByPosition[i]||[]);
document.querySelector('h1').setAttribute('aria-label',CONFIG.text);
if(CONFIG.exitDuration)document.documentElement.style.setProperty('--exit-duration',CONFIG.exitDuration+'ms');
const words=document.querySelector('#words'),status=document.querySelector('#status'),replay=document.querySelector('#replay'),pause=document.querySelector('#pause');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const states=[]; let introTimers=[],autoTimer,hovered=null,inside=false,paused=false,ready=false,inIntro=false,lastAuto=-1,activeQueue=[],visible=true;
const hitLayer=document.createElement('span');hitLayer.className='hit-layer';let index=0,animIndex=0;
for(const [wi,word] of CONFIG.text.trim().split(/\s+/).entries()){
 if(wi){for(const parent of [words,hitLayer]){const sp=document.createElement('span');sp.className='space';parent.append(sp)}animIndex++}
 const group=document.createElement('span'),hits=document.createElement('span');group.className=hits.className='word';
 for(const ch of word){const el=document.createElement('span');el.className='letter';const char=document.createElement('span');char.className='char';char.textContent=ch;el.append(char);group.append(el);
 const hit=document.createElement('span');hit.className='hit';hit.dataset.index=index;hit.textContent=ch;hits.append(hit);
 states.push({el,char,hit,ch,index,animIndex,loaded:[],last:null,timer:null,exitTimer:null,restoreTimer:null,transition:0,active:false,padding:new Map()});index++;animIndex++}
 words.append(group);hitLayer.append(hits)
}words.append(hitLayer);
function hide(s){
 clearTimeout(s.timer);s.timer=null;
 s.el.style.paddingInline='0em';s.hit.style.paddingInline='0em';
 if(!s.active)return;
 const sticker=s.el.querySelector('.sticker');
 clearTimeout(s.exitTimer);clearTimeout(s.restoreTimer);
 const transition=++s.transition;
 s.active=false;s.el.classList.remove('active','pending');
 activeQueue=activeQueue.filter(i=>i!==s.index);
 s.el.classList.remove('returning','restored');void s.el.offsetWidth;s.el.classList.add('returning');
 const finish=()=>{if(transition!==s.transition||s.active)return;if(sticker?.isConnected)sticker.remove();if(!s.el.querySelector('.sticker')){s.el.classList.remove('returning');s.el.classList.add('restored');clearTimeout(s.restoreTimer);s.restoreTimer=setTimeout(()=>{if(transition===s.transition)s.el.classList.remove('restored')},240)}s.exitTimer=null};
 if(sticker&&!reduced.matches){
  const pose=getComputedStyle(sticker).transform;
  const exitDuration=CONFIG.exitDuration||480;
  sticker.getAnimations().forEach(animation=>animation.cancel());
  sticker.animate([
   {transform:pose,opacity:1,filter:'brightness(1)',offset:0},
   {transform:`${pose} translate(3px,-2px)`,opacity:.82,filter:'brightness(1.6)',offset:.28},
   {transform:`${pose} translate(-2px,1px) scale(.82)`,opacity:.46,filter:'brightness(1.15)',offset:.62},
   {transform:`${pose} scale(.45)`,opacity:0,filter:'brightness(.8)',offset:1}
  ],{duration:exitDuration,easing:'steps(6,end)',fill:'forwards'});
  s.exitTimer=setTimeout(finish,exitDuration+34);
 }else{sticker?.remove();s.el.classList.remove('returning')}
}
function clearIntro(){introTimers.forEach(clearTimeout);introTimers=[];inIntro=false;states.forEach(s=>{s.el.classList.remove('pending');hide(s)});}
function returnLater(s,ms){clearTimeout(s.timer);s.timer=setTimeout(()=>{s.timer=null;if(hovered!==s.index)hide(s)},ms)}
function pixelFrames(angle,y){return [
 {offset:0,opacity:0,filter:'brightness(2)',transform:`translate(${y+7}px,-5px) rotate(${angle}deg) scale(.55)`},
 {offset:.24,opacity:.35,transform:`translate(-3px,3px) rotate(${angle}deg) scale(.72)`},
 {offset:.48,opacity:.68,filter:'brightness(1.5)',transform:`translate(3px,-2px) rotate(${angle/2}deg) scale(.88)`},
 {offset:.72,opacity:.88,transform:`translate(-1px,1px) rotate(${angle/3}deg) scale(1.04)`},
 {offset:1,opacity:1,filter:'brightness(1)',transform:`translateY(${y}px) rotate(${angle/4}deg) scale(1)`}
]}
function show(s,{intro=false,automatic=false}={}){if(reduced.matches||!s.loaded.length)return;if(!intro&&inIntro)clearIntro();clearTimeout(s.timer);clearTimeout(s.exitTimer);clearTimeout(s.restoreTimer);s.timer=s.exitTimer=s.restoreTimer=null;s.transition++;
 const pool=s.loaded.filter(a=>a!==s.last),items=pool.length?pool:s.loaded;const src=items[Math.floor(Math.random()*items.length)];s.last=src;s.active=true;s.el.classList.remove('pending','returning','restored');s.el.classList.add('active');s.el.querySelector('.sticker')?.remove();
 const sticker=document.createElement('span');sticker.className='sticker';const image=document.createElement('img');image.src=src;image.alt='';image.draggable=false;sticker.append(image);s.el.append(sticker);
 const punctuation=['‘','’',"'"].includes(s.ch);s.el.style.setProperty('--height',punctuation?'.72em':(['o','w'].includes(s.ch)?'1.16em':'1.08em'));s.el.style.setProperty('--maxwidth',punctuation?'.62em':'1.4em');s.el.style.setProperty('--offset',punctuation?'-.18em':'0em');const fontSize=parseFloat(getComputedStyle(words).fontSize);
 const baseWidth=states.reduce((sum,item)=>sum+item.char.getBoundingClientRect().width,0)+Math.max(0,CONFIG.text.trim().split(/\s+/).length-1)*.28*fontSize;
 const openingLimit=Math.max(0,(words.clientWidth-baseWidth-24)/(2*states.length*fontSize));
 // Reserve the full image width in the text flow, plus breathing room.
 const imageWidth=s.imageWidths?.get(src)||1.08;
 const glyphWidth=s.char.getBoundingClientRect().width/fontSize;
 const expandedPadding=Math.min(.18,Math.max(.10,(imageWidth-glyphWidth)*.22));
 const padding=intro?Math.min(expandedPadding,openingLimit):expandedPadding;
 s.el.style.paddingInline=s.hit.style.paddingInline=`${padding}em`;
 const angle=[-5,4,-3,5,-4,3,-2][s.animIndex%7],y=[2,-1,1,-2,1,2,-1][s.animIndex%7];sticker.animate(pixelFrames(angle,y),{duration:CONFIG.enterDuration||260,easing:'steps(5,end)',fill:'both'});
 activeQueue=activeQueue.filter(i=>i!==s.index);activeQueue.push(s.index);if(!intro)while(activeQueue.length>4)hide(states[activeQueue.shift()]);
 if(!intro&&hovered!==s.index)returnLater(s,automatic?1000:420);
}
function introDuration(){return 85*Math.max(0,states.filter(s=>s.loaded.length).length-1)+660}
function schedule(first=false){clearTimeout(autoTimer);if(!ready||paused||inside||document.hidden||!visible||reduced.matches)return;
 autoTimer=setTimeout(()=>{let available=states.filter(s=>s.loaded.length&&s.index!==lastAuto);if(!available.length)available=states.filter(s=>s.loaded.length);if(!available.length)return;const s=available[Math.floor(Math.random()*available.length)];lastAuto=s.index;show(s,{automatic:true});schedule()},first?introDuration()+1000+1000*Math.random():1300+1500*Math.random());}
function start(){clearTimeout(autoTimer);clearIntro();activeQueue=[];if(reduced.matches){status.textContent='Reduced motion is active';return}inIntro=true;const items=states.filter(s=>s.loaded.length);items.forEach(s=>s.el.classList.add('pending'));items.forEach((s,i)=>introTimers.push(setTimeout(()=>show(s,{intro:true}),i*40)));
 const shuffled=[...items];for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]]}
 shuffled.forEach((s,i)=>introTimers.push(setTimeout(()=>hide(s),40*Math.max(0,items.length-1)+660+45*i)));introTimers.push(setTimeout(()=>{inIntro=false;status.textContent=paused?'Pixel drift paused':'Move across the title to reveal pixel forms'},introDuration()));schedule(true)}
function point(event){inside=true;clearTimeout(autoTimer);const hit=document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-index]');const next=hit&&words.contains(hit)?Number(hit.dataset.index):null;if(next===hovered)return;const old=hovered;hovered=next;if(old!==null&&states[old].active)hide(states[old]);if(next!==null)show(states[next]);}
words.addEventListener('pointerenter',()=>{inside=true;clearTimeout(autoTimer)});words.addEventListener('pointermove',point);words.addEventListener('pointerdown',point);
function leave(){inside=false;const old=hovered;hovered=null;if(old!==null&&states[old].active)hide(states[old]);schedule(true)}
words.addEventListener('pointerleave',leave);words.addEventListener('pointercancel',leave);words.addEventListener('pointerup',e=>{if(e.pointerType!=='mouse')leave()});
replay.addEventListener('click',start);pause.addEventListener('click',()=>{paused=!paused;pause.textContent=paused?'Resume drift':'Pause drift';pause.setAttribute('aria-pressed',String(paused));status.textContent=paused?'Pixel drift paused':'Move across the title to reveal pixel forms';schedule(true)});
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearTimeout(autoTimer);if(inIntro)clearIntro()}else schedule(true)});new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;schedule(true)},{threshold:.25}).observe(words);reduced.addEventListener('change',()=>{if(reduced.matches){clearIntro();clearTimeout(autoTimer)}else if(ready)start()});
async function load(s,name){const src=`assets/${name}`;const im=new Image();im.src=src;try{await im.decode();s.loaded.push(src);s.imageWidths??=new Map();s.imageWidths.set(src,Math.min(('ow'.includes(s.ch)?1.18:1.08)*im.naturalWidth/im.naturalHeight,1.377));let width=Math.min(1.32*im.naturalWidth/im.naturalHeight,1.62);try{const canvas=document.createElement('canvas');const scale=Math.min(1,160/Math.max(im.naturalWidth,im.naturalHeight));canvas.width=Math.max(1,Math.round(im.naturalWidth*scale));canvas.height=Math.max(1,Math.round(im.naturalHeight*scale));const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(im,0,0,canvas.width,canvas.height);const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;let left=canvas.width,right=-1;for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++)if(data[(y*canvas.width+x)*4+3]>8){left=Math.min(left,x);right=Math.max(right,x)}if(right>=left)width=(right-left+1)/scale*Math.min(1.32/im.naturalHeight,1.62/im.naturalWidth)}catch{}
 const punctuationScale=['‘','’',"'"].includes(s.ch)?.48:1;s.padding.set(src,Math.max(.12,width/1.62*.28)*punctuationScale*.85*.85);
 }catch{}}
Promise.all(states.flatMap((s,i)=>ASSETS[i].map(name=>load(s,name)))).then(()=>{states.forEach((s,i)=>s.loaded.sort((a,b)=>ASSETS[i].indexOf(a.split('/').pop())-ASSETS[i].indexOf(b.split('/').pop())));ready=true;replay.disabled=pause.disabled=false;start()});
function updateLocalClock(){const clock=document.querySelector('#local-clock');if(clock){const now=new Date();clock.textContent=now.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',hour12:false});clock.dateTime=now.toISOString();}}
updateLocalClock();setInterval(updateLocalClock,10000);
