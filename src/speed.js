// t241u: one playback speed for Quran listen (reader), Ruqyah and Hadith audio. Persisted in LS 'qsRate'.
// Bound <audio> elements keep the rate across src changes (each new clip, Bismillah, preloaded next, background).
export const RATES=[0.5,0.75,1,1.25,1.5,2];
const K='qsRate';const els=new Set();const subs=new Set();
export const get=()=>{const r=+(globalThis.localStorage?.getItem(K));return RATES.includes(r)?r:1};
export const fmt=r=>(r===1?'1':String(r).replace(/^0/,''))+'×';
const put=(a,r)=>{try{a.preservesPitch=true;a.webkitPreservesPitch=true;a.mozPreservesPitch=true}catch{/* old */}try{a.defaultPlaybackRate=r;if(a.playbackRate!==r)a.playbackRate=r}catch{/* ignore */}};
/** Keep this element at the saved speed for every clip it plays. */
export function bind(a){if(!a||els.has(a))return a;els.add(a);const f=()=>put(a,get());put(a,get());for(const e of ['loadstart','loadedmetadata','play'])a.addEventListener(e,f);return a}
export function set(r){if(!RATES.includes(r))return;try{localStorage.setItem(K,String(r))}catch{/* ignore */}for(const a of els)put(a,r);for(const f of subs)try{f(r)}catch{/* ignore */}paint()}
export const on=f=>{subs.add(f);return()=>subs.delete(f)};
/** The small gold-ringed pill that sits under the big Pause button. */
export const pill=(ur=false)=>`<button type="button" class="sp-pill" data-sp aria-haspopup="true" aria-expanded="false" aria-label="${ur?'رفتار':'Playback speed'}">${fmt(get())}</button>`;
export function paint(){if(typeof document==='undefined')return;const ur=document.documentElement.lang==='ur';document.querySelectorAll('[data-sp]').forEach(b=>{const v=fmt(get());if(b.textContent!==v)b.textContent=v;b.setAttribute('aria-label',(ur?'رفتار ':'Playback speed ')+v);b.classList.toggle('sp-x',get()!==1)});document.querySelectorAll('.sp-pop .sp-c').forEach(c=>{const on=+c.dataset.r===get();c.classList.toggle('on',on);c.setAttribute('aria-checked',on)})}
function close(){document.querySelectorAll('.sp-pop').forEach(p=>p.remove());document.querySelectorAll('[data-sp]').forEach(b=>b.setAttribute('aria-expanded','false'))}
function open(b){close();const ur=document.documentElement.lang==='ur'||document.documentElement.dir==='rtl';const p=document.createElement('div');p.className='sp-pop';p.setAttribute('role','radiogroup');p.setAttribute('aria-label',ur?'رفتار':'Playback speed');
 p.innerHTML=`<div class="sp-h">${ur?'رفتارِ تلاوت':'Playback speed'}</div><div class="sp-cs">${RATES.map(r=>`<button type="button" role="radio" class="sp-c" data-r="${r}">${fmt(r)}</button>`).join('')}</div>`;
 document.body.appendChild(p);const rc=b.getBoundingClientRect(),w=p.offsetWidth,h=p.offsetHeight;
 p.style.left=Math.max(8,Math.min(innerWidth-w-8,rc.left+rc.width/2-w/2))+'px';p.style.top=Math.max(8,rc.top-h-10)+'px';
 b.setAttribute('aria-expanded','true');paint();p.onclick=e=>{const c=e.target.closest('.sp-c');if(c){set(+c.dataset.r);setTimeout(close,140)}}}
if(typeof document!=='undefined'){document.addEventListener('click',e=>{const b=e.target.closest('[data-sp]');if(b){e.stopPropagation();if(b.getAttribute('aria-expanded')==='true')close();else open(b);return}if(!e.target.closest('.sp-pop'))close()},true);
 document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});addEventListener('hashchange',close)}
