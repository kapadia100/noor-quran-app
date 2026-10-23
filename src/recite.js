// "Recite & Learn" live tutor. Lazy-loaded only when opened.
// A small speech model runs on-device in a Web Worker and is re-run every ~250 ms on the last few seconds of audio;
// the tracker (recite-live.js) highlights each expected word the moment it is heard. Audio never leaves the phone.
import {norm} from './recite-core.js';
import {Tracker} from './recite-live.js';
import {esc} from './lib.js';
import * as I from './icons.js';
const MODEL_BASE='https://kapadia100.github.io/noor-quran-app/models/',MB=19;
const SR=16000,HOP_MS=250,MAXWIN=10,FLAT_MAX=400;
let worker=null,ready=false,panel=null,st=null;
const $=s=>panel.querySelector(s);
const ur=()=>document.documentElement.lang==='ur';
const L=(en,u)=>ur()?u:en;
function getWorker(){if(!worker){worker=new Worker((import.meta.env.BASE_URL||'/')+'recite-worker.js',{type:'module'});worker.onmessage=onMsg}return worker}
function onMsg(e){const m=e.data;
 if(m.type==='progress'&&st){const p=m.total?Math.min(99,Math.round(100*m.loaded/m.total)):0;$('#rcBar').style.width=p+'%';chip('load',L(`Downloading tutor… ${p}%`,`ٹیوٹر ڈاؤن لوڈ ہو رہا ہے… ${p}%`))}
 if(m.type==='ready'){ready=true;localStorage.setItem('qsCtc','1');if(st){$('#rcDl').hidden=true;$('#rcBar').parentNode.hidden=true;$('#rcMic').disabled=false;chip('ready',L('Ready — tap the mic and recite','تیار — مائیک دبائیں اور پڑھیں'))}}
 if(m.type==='error'){window.__reciteErr=m.message;if(st){if(!ready){$('#rcDl').disabled=false;$('#rcDl').hidden=false;$('#rcBar').parentNode.hidden=true}chip('warn',L('Could not load the tutor. Check your connection and try again.','ٹیوٹر لوڈ نہیں ہو سکا۔ انٹرنیٹ چیک کریں۔'))}}
 if(m.type==='run'&&st){st.busy=false;const job=st.job;st.job=null;st.decMs=st.decMs?st.decMs*0.7+m.ms*0.3:m.ms;if(job&&job.gen===st.gen)result(job,m.words,m.ms)}}
function chip(kind,text){if(!panel)return;const c=$('#rcChip');c.className='rc-chip '+kind;c.querySelector('span').textContent=text}

/** Open the panel for surah n starting at ayah a. ctx: {words, txts, ayahUrl(a), event} */
export function open(n,a,ctx){close();st={n,ctx,flat:[],gen:1,idc:0,chunks:[],end:0,cut:0,lastVoice:-9,floor:0.004,lvl:0,busy:false,listening:false,hold:false,sent:0,lineA:0};
 for(let i=a;i<=ctx.txts.length&&st.flat.length<FLAT_MAX;i++){const w=ctx.words?.[i];const list=w?w.map(x=>({t:x.t,tr:x.tr,m:x.m,au:x.au})):ctx.txts[i-1].split(/\s+/).filter(x=>norm(x)).map(t=>({t}));
  list.forEach((x,k)=>st.flat.push({...x,a:i,k,n:norm(x.t)}))}
 st.flat=st.flat.filter(x=>x.n);st.T=new Tracker(st.flat.map(x=>x.n));
 panel=document.createElement('section');panel.id='recite';panel.className='recite';panel.setAttribute('aria-label','Recite and Learn');
 panel.innerHTML=`<div class="rc-h"><span class="rc-ic">${I.icon('tutor')}</span><div class="rc-t"><b>${L('Recite & Learn','تلاوت اور سیکھیں')}</b><small>${L('Live tutor','لائیو ٹیوٹر')} · <span class="rc-ref"></span></small></div><button class="rc-x" aria-label="Close">✕</button></div>
 <div class="rc-line ar" dir="rtl" lang="ar" id="rcLine"></div>
 <div class="rc-fix" id="rcFix" hidden></div>
 <div class="rc-prog" hidden><div id="rcBar"></div></div>
 <div class="rc-chip" id="rcChip"><i></i><span></span></div>
 <div class="rc-lv" aria-hidden="true"><i id="rcLv"></i></div>
 <div class="rc-key"><span class="k-ok">${L('Correct','درست')}</span><span class="k-unc">${L('Unclear','غیر واضح')}</span><span class="k-bad">${L('Check','دیکھیں')}</span></div>
 <div class="bar rc-ctl"><button class="btn" id="rcDl" hidden>${L(`Download tutor (~${MB} MB, once)`,`ٹیوٹر ڈاؤن لوڈ کریں (~${MB} MB، ایک بار)`)}</button><button class="rc-mic" id="rcMic" disabled aria-label="Microphone">${I.icon('mic')}<span>${L('Start','شروع')}</span></button></div>
 <p class="rc-note muted">${L('Checks your words as you recite, not full tajweed. Your voice stays on your phone.','یہ الفاظ چیک کرتا ہے، مکمل تجوید نہیں۔ آپ کی آواز فون سے باہر نہیں جاتی۔')}</p>`;
 document.body.append(panel);$('.rc-x').onclick=close;paint();
 $('#rcMic').onclick=()=>st.listening?stopMic():startMic();
 $('#rcDl').onclick=()=>{$('#rcDl').disabled=true;$('#rcBar').parentNode.hidden=false;load()};
 st.timer=setInterval(tick,100);
 if(window.__reciteFake){ready=true;$('#rcMic').disabled=false;chip('ready','Ready');return}
 if(ready){$('#rcMic').disabled=false;chip('ready',L('Ready — tap the mic and recite','تیار — مائیک دبائیں اور پڑھیں'))}
 else if(localStorage.getItem('qsCtc')){$('#rcBar').parentNode.hidden=false;chip('load',L('Preparing tutor…','ٹیوٹر تیار ہو رہا ہے…'));load()}
 else{$('#rcDl').hidden=false;chip('info',L('First use downloads a small tutor once. After that it works from your phone.','پہلی بار ایک چھوٹا ٹیوٹر ڈاؤن لوڈ ہوگا، پھر یہ فون پر ہی چلے گا۔'))}}
function load(){getWorker().postMessage({type:'load',base:localStorage.getItem('qsAsrBase')||MODEL_BASE})}
export function close(){if(!st)return;stopMic();clearInterval(st.timer);stopAudio();panel?.remove();panel=null;st=null;document.querySelectorAll('.ayah.reciting').forEach(e=>e.classList.remove('reciting'))}

// ---------- word line ----------
function wordClass(i){const T=st.T,m=T.marks[i];if(m)return 'rc-'+m;if(T.prov[i])return 'rc-live';return ''}
function paint(){if(!st||!panel)return;const T=st.T,fl=st.flat;const ci=st.listening?Math.min(T.cursor,fl.length-1):T.p;const cur=fl[ci];
 if(!cur){$('#rcLine').innerHTML=`<span class="rc-done">✓ ${L('Surah complete','سورت مکمل')}</span>`;return}
 if(st.lineA!==cur.a){st.lineA=cur.a;$('.rc-ref').textContent=`${st.n}:${cur.a}`;
  $('#rcLine').innerHTML=fl.map((x,i)=>[x,i]).filter(([x])=>x.a===cur.a).map(([x,i])=>`<span class="rc-w" data-i="${i}">${esc(x.t)}</span>`).join(' ');
  document.querySelectorAll('.ayah.reciting').forEach(e=>e.classList.remove('reciting'));const el=document.getElementById('a'+cur.a);if(el){el.classList.add('reciting');el.scrollIntoView({block:'center',behavior:'smooth'})}}
 for(const s of panel.querySelectorAll('.rc-w')){const i=+s.dataset.i;const c=wordClass(i)+(i===ci&&!T.marks[i]&&!T.prov[i]?' rc-cur':'');if(s.dataset.c!==c){s.dataset.c=c;s.className='rc-w '+c}}}

// ---------- microphone ----------
async function startMic(){if(st.listening)return;st.ctx.event?.();
 if(window.__reciteFake){st.listening=true;micUI();return}
 let stream;try{stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true,channelCount:1}})}
 catch{chip('warn',L('Microphone permission is needed. On iPhone: Settings › Safari › Microphone (or allow when asked).','مائیک کی اجازت درکار ہے۔'));return}
 const AC=window.AudioContext||window.webkitAudioContext;const ac=new AC();await ac.resume().catch(()=>{});
 const src=ac.createMediaStreamSource(stream),proc=ac.createScriptProcessor(2048,1,1);const ratio=ac.sampleRate/SR;
 st.mic={stream,ac,src,proc};
 proc.onaudioprocess=e=>{if(!st||!st.listening)return;const x=e.inputBuffer.getChannelData(0);const n=Math.floor(x.length/ratio),o=new Float32Array(n),w=Math.max(1,Math.round(ratio));
  for(let i=0;i<n;i++){const p=Math.floor(i*ratio);let s=0,c=0;for(let k=0;k<w&&p+k<x.length;k++){s+=x[p+k];c++}o[i]=c?s/c:0}ingest(o)};
 src.connect(proc);proc.connect(ac.destination);st.listening=true;micUI()}
function stopMic(){if(!st)return;if(st.mic){try{st.mic.proc.disconnect();st.mic.src.disconnect();st.mic.stream.getTracks().forEach(t=>t.stop());st.mic.ac.close()}catch{/* ignore */}st.mic=null}
 st.listening=false;st.lvl=0;if(panel){micUI();paint()}}
function micUI(){const b=$('#rcMic');b.classList.toggle('on',st.listening);b.querySelector('span').textContent=st.listening?L('Stop','روکیں'):L('Start','شروع');b.setAttribute('aria-pressed',st.listening);
 if(st.listening)chip('listen',L('Listening — start reciting','سن رہا ہے — پڑھنا شروع کریں'));else if(ready)chip('ready',L('Paused — tap the mic to continue','رکا ہوا — جاری رکھنے کے لیے مائیک دبائیں'));paint()}
/** Append 16 kHz mono samples; track level + voice activity; keep only the audio the tracker can still need. */
function ingest(o){if(st.hold)return;let e=0;for(let i=0;i<o.length;i++)e+=o[i]*o[i];const rms=Math.sqrt(e/o.length);const thr=Math.max(0.01,st.floor*2.5);
 st.chunks.push({s:st.end,a:o});st.end+=o.length;const t=st.end/SR;
 if(rms>thr)st.lastVoice=t;else st.floor=st.floor*0.97+rms*0.03;
 st.lvl=Math.max(Math.min(1,rms*9),st.lvl*0.8);
 const keep=Math.min(st.T.winStart,t-MAXWIN,st.cut/SR)-1;while(st.chunks.length>1&&(st.chunks[0].s+st.chunks[0].a.length)/SR<keep)st.chunks.shift()}
function slice(t0,t1){const s0=Math.max(0,Math.floor(t0*SR)),s1=Math.min(st.end,Math.floor(t1*SR));if(s1<=s0)return new Float32Array(0);const out=new Float32Array(s1-s0);
 for(const c of st.chunks){const a=Math.max(c.s,s0),b=Math.min(c.s+c.a.length,s1);if(b>a)out.set(c.a.subarray(a-c.s,b-c.s),a-s0)}return out}
function tick(){if(!st||!panel)return;const t=st.end/SR;
 // level meter + state chip
 const lv=st.listening?st.lvl:0;$('#rcLv').style.transform=`scaleX(${lv.toFixed(3)})`;$('#rcMic').style.setProperty('--lv',lv.toFixed(3));st.lvl*=0.85;
 if(st.listening&&!st.hold&&!st.fixOpen){const hearing=t-st.lastVoice<0.5;if(hearing!==st.hearing){st.hearing=hearing;chip(hearing?'hear':'listen',hearing?L('Hearing you…','آپ کو سن رہا ہے…'):L('Listening — start reciting','سن رہا ہے — پڑھنا شروع کریں'))}}
 if(!st.listening||st.busy||st.hold||!ready||window.__reciteFake)return;
 const now=performance.now();if(now-st.sent<HOP_MS)return;if(t-st.lastVoice>2.2)return; // nothing new to hear
 const s0=Math.max(st.T.winStart,st.cut/SR,t-MAXWIN);if(t-s0<0.5)return;
 const audio=slice(s0,t);st.sent=now;st.busy=true;const job={id:++st.idc,gen:st.gen,off:s0,t,at:now};st.job=job;getWorker().postMessage({type:'run',id:job.id,audio},[audio.buffer])}

// ---------- tracking ----------
function result(job,ws,ms){const H=ws.map(x=>({w:norm(x.s),t0:job.off+x.t0,t1:job.off+x.t1})).filter(x=>x.w);
 if(navigator.webdriver)(window.__rlog??=[]).push({t:Math.round(performance.now()),aud:job.t,ms,h:H.map(x=>x.w).join(' ')});
 step(H,job.t)}
function step(H,t){const before=new Set(Object.keys(st.T.prov));const ev=st.T.update(H,t);
 if(navigator.webdriver)for(const k of Object.keys(st.T.prov))if(!before.has(k))(window.__rgreen??=[]).push({i:+k,wall:Math.round(performance.now()),aud:t});
 let bad=null;for(const e of ev)if(e.st==='bad')bad={i:e.i,st:e.kind};
 paint();if(bad)showFix(bad);
 if(st.T.p>=st.flat.length){chip('ok',L('Surah complete ✓','سورت مکمل ✓'));stopMic();paint()}}
function showFix(b){const w=st.flat[b.i];const box=$('#rcFix');box.hidden=false;st.fixOpen=true;
 box.innerHTML=`<div class="rc-fh">${b.st==='skip'?L('Missed word','چھوٹا ہوا لفظ'):L('Check this word','یہ لفظ دیکھیں')} · ${st.n}:${w.a}</div><div class="ar rc-fw" dir="rtl" lang="ar">${esc(w.t)}</div>${w.tr?`<div class="rc-ft"><i>${esc(w.tr)}</i>${w.m?` · ${esc(w.m)}`:''}</div>`:''}
 <div class="bar"><button class="btn" id="rcPw">▶ ${L('Word','لفظ')}</button><button class="btn" id="rcPa">▶ ${L('Ayah','آیت')}</button><button class="btn" id="rcGo">${L('Continue','جاری رکھیں')}</button></div>`;
 chip('warn',L('Listen to the correct word, then continue reciting.','درست لفظ سنیں، پھر تلاوت جاری رکھیں۔'));
 $('#rcPw').onclick=async()=>play(w.au||await st.ctx.ayahUrl(w.a));$('#rcPa').onclick=async()=>play(await st.ctx.ayahUrl(w.a));$('#rcGo').onclick=()=>{box.hidden=true;st.fixOpen=false;stopAudio();if(st.listening)micUI()}}
let au=null;function stopAudio(){if(au){au.pause();au=null}if(st){st.hold=false;st.cut=st.end}}
function play(url){stopAudio();if(!url)return;st.hold=true;au=new Audio(url);const done=()=>{if(st){st.hold=false;st.cut=st.end}};au.onended=done;au.onerror=done;au.play().catch(done)}
// test hooks (automation only)
if(navigator.webdriver){
 window.__recite={feed:(text,reps=3)=>{const w=text.split(/\s+/).map(norm).filter(Boolean);for(let r=0;r<reps;r++){const b=Math.max(0,st.T.lockedEnd)+0.1;step(w.map((x,i)=>({w:x,t0:b+i*0.4,t1:b+i*0.4+0.3})),b+w.length*0.4)}},state:()=>st&&{p:st.T.p,cursor:st.T.cursor,marks:{...st.T.marks},prov:{...st.T.prov}}};
 // feed 16 kHz audio through the real ingest/decode path in real time (no microphone needed)
 window.__reciteStream=(a,speed=1)=>new Promise(res=>{st.listening=true;micUI();const step=Math.round(SR*0.04);let i=0;const iv=setInterval(()=>{if(!st){clearInterval(iv);return res()}ingest(Float32Array.from(a.subarray(i,i+step)));i+=step;if(i>=a.length){ingest(new Float32Array(step));if(st.end/SR>a.length/SR+2.6){clearInterval(iv);res()}}},40/speed)});
}
