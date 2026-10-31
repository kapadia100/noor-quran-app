// Fixed-position (never changes page size/scroll); tracked in document coordinates so scrolling does not lag it.
// One floating highlight layer that glides/morphs between the playing ayahs (reader .ayah.playing, Ruqyah .rq-on).
// Purely visual: it only reads element positions in requestAnimationFrame; nothing in the audio path waits for it.
const SEL='.ayah.playing,.rq-on';let el=null,raf=0,cur=null,op=0;
const rm=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
function box(t){const r=t.getBoundingClientRect(),pad=t.classList.contains('rq-on')?6:2;return {x:r.left+scrollX-pad,y:r.top+scrollY-pad,w:r.width+pad*2,h:r.height+pad*2,rad:t.classList.contains('rq-on')?14:18}}
function tick(){raf=0;const t=document.querySelector(SEL);const vis=t&&t.isConnected&&t.offsetParent!==null;
 if(!el){el=document.createElement('div');el.id='qsGlide';el.setAttribute('aria-hidden','true');document.body.appendChild(el)}
 const k=rm()?1:.2;
 if(vis){const b=box(t);if(!cur||op<.02)cur={...b};else for(const p of ['x','y','w','h','rad'])cur[p]+=(b[p]-cur[p])*k;op+=(1-op)*(rm()?1:.15)}
 else op+=(0-op)*(rm()?1:.12);
 if(cur){el.style.transform=`translate3d(${cur.x-scrollX}px,${cur.y-scrollY}px,0)`;el.style.width=cur.w+'px';el.style.height=cur.h+'px';el.style.borderRadius=cur.rad+'px'}
 el.style.opacity=op.toFixed(3);el.classList.toggle('on',!!vis);
 const moving=vis?(()=>{const b=box(t);return ['x','y','w','h'].some(p=>Math.abs(b[p]-cur[p])>.3)})():op>.01;
 if(moving||vis)raf=requestAnimationFrame(tick);else{op=0;el.style.opacity='0';cur=null}}
/** Call whenever the playing ayah changes (or stops). Never awaited. */
export function kick(){if(!raf&&typeof requestAnimationFrame==='function')raf=requestAnimationFrame(tick)}
