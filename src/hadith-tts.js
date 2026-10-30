// Listen to a hadith with the voices already on the phone (speechSynthesis). Nothing is downloaded and nothing is claimed unless the device really starts speaking.
import{codeOf,bcpOf}from'./hadith-lang.js';
const SS=()=>globalThis.speechSynthesis||null,UT=()=>globalThis.SpeechSynthesisUtterance||null;
export const supported=()=>!!(SS()&&UT());
/** Voices load asynchronously on iOS and Chrome: wait for them (up to `ms`) instead of trusting the first, often empty, list. */
export function voicesReady(ms=2500){
 const s=SS();if(!s)return Promise.resolve([]);
 const now=()=>{try{return s.getVoices()||[]}catch{return []}};
 const v=now();if(v.length){return Promise.resolve(v)}
 return new Promise(res=>{let done=false;const fin=()=>{if(done)return;done=true;clearTimeout(tm);clearInterval(iv);try{s.removeEventListener?.('voiceschanged',on)}catch{/* ignore */}const l=now();res(l)};
  const on=()=>{if(now().length)fin()};try{s.addEventListener?.('voiceschanged',on)}catch{/* ignore */}
  const iv=setInterval(on,150),tm=setTimeout(fin,ms)})}
const NOVELTY=/\b(novelty|bad news|bahh|bells|boing|bubbles|cellos|deranged|good news|hysterical|pipe organ|trinoids|whisper|zarvox|jester|organ|superstar|wobble|albert|fred|junior|kathy|ralph|agnes|princess|eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley)\b/i;
const GOOD=/enhanced|premium|siri|neural|natural|online|wavenet/i;
/** Best installed voice for a language code ("eng", "en", "urd"...), or null. Prefers voices that work offline, then higher-quality ones. */
export function pickVoice(voices,lang){
 const want=codeOf(lang);if(!want)return null;
 const c=(voices||[]).filter(v=>codeOf(v.lang)===want&&!NOVELTY.test(v.name||''));
 if(!c.length)return null;
 const sc=v=>(v.localService?4:0)+(GOOD.test(v.name||'')?3:0)+(v.default?1:0)-(/compact/i.test(v.name||'')?1:0);
 const best=[...c].sort((a,b)=>sc(b)-sc(a))[0];
 return best}
/** Splits a long text into short pieces at sentence ends (long utterances are cut off by some phones). */
export function splitText(text,max=180){
 const t=String(text||'').replace(/\s+/g,' ').trim();if(!t)return[];
 const parts=t.match(/[^.!?؟۔…;\n]+[.!?؟۔…;]*\s*/g)||[t],out=[];let cur='';
 const push=s=>{s=s.trim();if(s)out.push(s)};
 for(const p of parts){
  if(p.length>max){push(cur);cur='';let w='';for(const word of p.split(/\s+/)){if((w+' '+word).length>max){push(w);w=word}else w=w?w+' '+word:word}push(w);continue}
  if((cur+p).length>max){push(cur);cur=p}else cur+=p}
 push(cur);return out}
// ---- recorded Urdu audio (one file per hadith, hosted outside the app) ----
/** Base URL of pre-recorded Urdu hadith audio: <base>/<book>/<hadithnumber>.m4a. Empty = off (device voice only). localStorage 'qsHadithAudioBase' overrides for testing. */
export const URD_AUDIO_BASE='';
export function audioBase(){try{const o=localStorage.getItem('qsHadithAudioBase');if(o!==null)return o.replace(/\/+$/,'')}catch{/* ignore */}return URD_AUDIO_BASE.replace(/\/+$/,'')}
export function audioUrl(book,n,lang='urd'){const b=audioBase();if(!b||codeOf(lang)!==codeOf('urd')||n===undefined||n===null||n==='')return '';return `${b}/${encodeURIComponent(book)}/${String(n).replace(/\//g,'_')}.m4a`}
let el=null;const A=()=>{if(!el&&globalThis.Audio){el=new Audio();el.preload='auto'}return el};
function playFile(my,c){const a=A();if(!a){fallback(my,c);return}
 c.state='starting';emit();
 a.onplaying=()=>{if(my!==gen)return;c.state='playing';emit()};
 a.onended=()=>{if(my!==gen)return;const d=c.onEnd;cur=null;emit();d?.()};
 a.onerror=()=>{if(my!==gen)return;fallback(my,c)};
 try{a.playbackRate=c.rate||1}catch{/* ignore */}
 if(a.dataset?.src!==c.url||!c.pos){a.src=c.url;if(a.dataset)a.dataset.src=c.url}
 const pr=a.play();if(pr&&pr.catch)pr.catch(e=>{if(my!==gen)return;if(e&&e.name==='NotAllowedError'){fail(my,'error');return}fallback(my,c)})}
// File missing or offline: speak with the device voice if there is one.
function fallback(my,c){if(my!==gen)return;c.url='';if(c.voice&&supported())say();else fail(my,'error')}
const stopFile=()=>{if(el){try{el.pause()}catch{/* ignore */}}};
// ---- one player ----
let cur=null,gen=0,wd=null,listeners=new Set();
const emit=()=>{for(const f of listeners)try{f(info())}catch{/* ignore */}};
export const onChange=f=>{listeners.add(f);return()=>listeners.delete(f)};
export const info=()=>cur?{id:cur.id,state:cur.state,error:cur.error||''}:{id:null,state:'idle',error:''};
const WDMS=()=>(globalThis.window?.__hdWd)??5000;
function say(){
 const my=gen,c=cur;if(!c)return;
 const s=SS(),U=UT();c.state='starting';emit();
 try{s.cancel()}catch{/* ignore */}
 const u=new U(c.chunks[c.i]);u.lang=c.voice.lang||bcpOf(c.lang);u.voice=c.voice;u.rate=c.rate;u.volume=1;
 u.onstart=()=>{if(my!==gen)return;clearTimeout(wd);c.state='playing';emit()};
 u.onend=()=>{if(my!==gen)return;clearTimeout(wd);c.i++;if(c.i<c.chunks.length)say();else{const d=c.onEnd;cur=null;emit();d?.()}};
 u.onerror=e=>{if(my!==gen)return;if(e&&(e.error==='canceled'||e.error==='interrupted'))return;fail(my,'error')};
 clearTimeout(wd);wd=setTimeout(()=>{if(my===gen&&cur&&cur.state==='starting')fail(my,'silent')},WDMS());
 try{s.speak(u)}catch{fail(my,'error')}}
function fail(my,why){if(my!==gen)return;gen++;clearTimeout(wd);try{SS()?.cancel()}catch{/* ignore */}const id=cur?.id;cur=null;emit();errEmit(why,id)}
const errL=new Set();const errEmit=(w,id)=>{for(const f of errL)try{f(w,id)}catch{/* ignore */}};
export const onError=f=>{errL.add(f);return()=>errL.delete(f)};
/** Starts speaking. `id` names what is playing (a card id); `onEnd` runs when the whole text finished. State becomes 'playing' only after the device actually starts. */
export function play({id,text,lang,voice,rate=1,onEnd,url=''}){
 stop();if(!url&&(!supported()||!voice))return false;const chunks=splitText(text);if(!chunks.length&&!url)return false;
 gen++;cur={id,chunks,i:0,voice,lang,rate,onEnd,url,state:'starting'};
 try{dispatchEvent(new CustomEvent('qs:audio',{detail:'hadith'}))}catch{/* ignore */}
 if(url){if(el){el.removeAttribute('src');if(el.dataset)delete el.dataset.src}playFile(gen,cur)}else say();return true}
export function pause(){if(!cur||cur.state==='paused')return;gen++;clearTimeout(wd);if(cur.url){stopFile();cur.pos=1}else{try{SS().cancel()}catch{/* ignore */}}cur.state='paused';emit()}
export function resume(){if(!cur||cur.state!=='paused')return;gen++;try{dispatchEvent(new CustomEvent('qs:audio',{detail:'hadith'}))}catch{/* ignore */}if(cur.url)playFile(gen,cur);else say()}
export function stop(){gen++;clearTimeout(wd);stopFile();const had=!!cur;cur=null;try{SS()?.cancel()}catch{/* ignore */}if(had)emit()}
export function setRate(r){if(cur)cur.rate=r;if(el&&cur?.url)try{el.playbackRate=r}catch{/* ignore */}}
if(typeof window!=='undefined'){addEventListener('qs:audio',e=>{if(e.detail!=='hadith')stop()});addEventListener('pagehide',()=>stop())}
