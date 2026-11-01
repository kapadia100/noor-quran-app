// Auto-follow for the playing item (reader ayah, Ruqyah ayah, Qaida item): scroll it fully into the free band between the
// sticky header and the floating player + tab bar. Visual only: never awaited by the audio code. Pauses briefly after the
// user scrolls by hand so we do not fight them.
let manualAt=0;const PAUSE=3500;
if(typeof window!=='undefined'){const mark=()=>{manualAt=Date.now()};
 for(const ev of ['wheel','touchmove'])window.addEventListener(ev,mark,{capture:true,passive:true});
 window.addEventListener('keydown',e=>{if(/^(Page(Up|Down)|Arrow(Up|Down)|Home|End| )$/.test(e.key))mark()},{capture:true})}
const vis=e=>e&&!e.hidden&&getComputedStyle(e).display!=='none'&&getComputedStyle(e).visibility!=='hidden'&&e.getBoundingClientRect().height>0;
/** Free vertical band (viewport px) between the header and the lowest-covering floating bars. */
export function band(){const vh=innerHeight;let top=0,bot=vh;
 const h=document.querySelector('body > header,header');if(vis(h)){const r=h.getBoundingClientRect();if(r.top<=1)top=Math.max(top,r.bottom)}
 // anything fixed/sticky covering the bottom (mini players, tab bar): walk up from the bottom edge at a few x positions
 const fixedAt=(x,y)=>{for(let e=document.elementFromPoint(x,y);e&&e!==document.body;e=e.parentElement){if(e.id==='qsGlide')return false;const p=getComputedStyle(e).position;if(p==='fixed'||p==='sticky')return true}return false};
 const xs=[innerWidth*.25,innerWidth*.5,innerWidth*.75];let miss=0;for(let y=vh-2;y>vh*.5&&miss<36;y-=6){if(xs.some(x=>fixedAt(x,y))){bot=y;miss=0}else miss+=6}
 return {top:top+8,bot:bot-8}}
function scroller(el){for(let p=el.parentElement;p&&p!==document.body;p=p.parentElement){const o=getComputedStyle(p).overflowY;if((o==='auto'||o==='scroll')&&p.scrollHeight>p.clientHeight+1)return p}return null}
/** Bring el fully into view (centered in the band; top-aligned under the header when taller). force=true ignores the manual pause. */
export function follow(el,force=false){if(!el||!el.isConnected)return;if(!force&&Date.now()-manualAt<PAUSE)return;
 const {top,bot}=band(),r=el.getBoundingClientRect(),H=bot-top;
 const delta=r.height<=H?(r.top+r.height/2)-(top+H/2):r.top-top;if(Math.abs(delta)<2)return;
 const behavior=matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth';const sc=scroller(el);
 if(sc)sc.scrollBy({top:delta,behavior});else window.scrollBy({top:delta,behavior})}
