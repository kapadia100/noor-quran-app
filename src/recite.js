// "Practice help" live recitation checker. Lazy-loaded only when opened.
// Speech recognition runs on-device in a Web Worker; microphone audio never leaves the phone.
import {norm,words as hwords,judge} from './recite-core.js';
import {esc} from './lib.js';
const MODEL_BASE='https://kapadia100.github.io/noor-quran-app/models/',MODEL='qs-asr-base',MB=77;
const SR=16000,FRAME=1600,WIN=50;
let worker=null,ready=false,panel=null,st=null;
const $=s=>panel.querySelector(s);
const ur=()=>document.documentElement.lang==='ur';
const L=(en,u)=>ur()?u:en;
function getWorker(){if(!worker){worker=new Worker((import.meta.env.BASE_URL||'/')+'recite-worker.js',{type:'module'});worker.onmessage=onMsg}return worker}
function onMsg(e){const m=e.data;if(!st)return;
 if(m.type==='progress'){const p=m.total?Math.min(99,Math.round(100*m.loaded/m.total)):0;$('#rcBar').style.width=p+'%';$('#rcMsg').textContent=L(`Downloading speech model… ${p}%`,`ماڈل ڈاؤن لوڈ ہو رہا ہے… ${p}%`)}
 if(m.type==='ready'){ready=true;localStorage.setItem('qsAsr','1');$('#rcDl').hidden=true;$('#rcBar').parentNode.hidden=true;$('#rcMic').disabled=false;msg(L('Ready. Tap the mic and start reciting.','تیار ہے۔ مائیک دبائیں اور تلاوت شروع کریں۔'))}
 if(m.type==='error'){window.__reciteErr=m.message;$('#rcDl').disabled=false;msg(L('Could not load the speech model. Check your connection and try again.','ماڈل لوڈ نہیں ہو سکا۔ انٹرنیٹ چیک کریں۔'),'warn')}
 if(m.type==='tx'){st.busy=false;const job=st.jobs[m.id];delete st.jobs[m.id];if(job)handle(job,m.text);pump()}}
function msg(t,cls=''){const e=$('#rcMsg');e.textContent=t;e.className='rc-msg '+cls}

/** Open the panel for surah n starting at ayah a. ctx: {words, txts, ayahUrl(a), toast, event} */
export function open(n,a,ctx){close();st={n,ctx,p:0,flat:[],marks:{},jobs:{},seq:0,busy:false,queue:[],live:0,hold:false,listening:false};
 // flat expected word list from start ayah to end of surah
 for(let i=a;i<=ctx.txts.length;i++){const w=ctx.words?.[i];const list=w?w.map(x=>({t:x.t,tr:x.tr,m:x.m,au:x.au})):ctx.txts[i-1].split(/\s+/).filter(x=>norm(x)).map(t=>({t}));
  list.forEach((x,k)=>st.flat.push({...x,a:i,k,n:norm(x.t)}))}
 st.flat=st.flat.filter(x=>x.n);
 panel=document.createElement('section');panel.id='recite';panel.className='recite';panel.setAttribute('aria-label','Practice help');
 panel.innerHTML=`<div class="rc-h"><b>${L('Practice help','مشق میں مدد')}</b><span class="muted rc-ref"></span><button class="rc-x" aria-label="Close">✕</button></div>
 <p class="rc-note muted">${L('Checks your words as you recite, not full tajweed. Your voice stays on your phone.','یہ الفاظ چیک کرتا ہے، مکمل تجوید نہیں۔ آپ کی آواز فون سے باہر نہیں جاتی۔')}</p>
 <div class="rc-line ar" dir="rtl" lang="ar" id="rcLine"></div>
 <div class="rc-fix" id="rcFix" hidden></div>
 <div class="rc-prog" hidden><div id="rcBar"></div></div>
 <p id="rcMsg" class="rc-msg"></p>
 <div class="bar rc-ctl"><button class="btn" id="rcDl" hidden>${L(`Download speech model (~${MB} MB, once)`,`ماڈل ڈاؤن لوڈ کریں (~${MB} MB، ایک بار)`)}</button><button class="btn rc-mic" id="rcMic" disabled>🎙 ${L('Start','شروع')}</button></div>`;
 document.body.append(panel);$('.rc-x').onclick=close;draw();
 $('#rcMic').onclick=()=>st.listening?stopMic():startMic();
 $('#rcDl').onclick=()=>{$('#rcDl').disabled=true;$('#rcBar').parentNode.hidden=false;load()};
 if(window.__reciteFake){ready=true;$('#rcMic').disabled=false;msg('Ready');return}
 if(ready)$('#rcMic').disabled=false,msg(L('Ready. Tap the mic and start reciting.','تیار ہے۔ مائیک دبائیں اور تلاوت شروع کریں۔'));
 else if(localStorage.getItem('qsAsr')){$('#rcBar').parentNode.hidden=false;msg(L('Loading speech model…','ماڈل لوڈ ہو رہا ہے…'));load()}
 else{$('#rcDl').hidden=false;msg(L('First use downloads a speech model once. After that it works from your phone.','پہلی بار ایک ماڈل ڈاؤن لوڈ ہوگا، پھر یہ فون پر ہی چلے گا۔'))}}
function load(){getWorker().postMessage({type:'load',base:localStorage.getItem('qsAsrBase')||MODEL_BASE,model:MODEL})}
export function close(){stopMic();panel?.remove();panel=null;st=null;document.querySelectorAll('.ayah.reciting').forEach(e=>e.classList.remove('reciting'))}

function draw(){if(!st||!panel)return;const cur=st.flat[st.p];if(!cur){$('#rcLine').innerHTML=`<span class="rc-done">✓ ${L('Surah complete','سورت مکمل')}</span>`;return}
 const a=cur.a,ws=st.flat.map((x,i)=>[x,i]).filter(([x])=>x.a===a);$('.rc-ref').textContent=`${st.n}:${a}`;
 $('#rcLine').innerHTML=ws.map(([x,i])=>{const m=st.marks[i];const c=m?'rc-'+m:i===st.p?'rc-cur':(i<st.p+st.live?'rc-live':'');return `<span class="rc-w ${c}" data-i="${i}">${esc(x.t)}</span>`}).join(' ');
 document.querySelectorAll('.ayah.reciting').forEach(e=>e.classList.remove('reciting'));const el=document.getElementById('a'+a);if(el){el.classList.add('reciting');if(st.lastA!==a){st.lastA=a;el.scrollIntoView({block:'center',behavior:'smooth'})}}}

// ---------- microphone + segmentation ----------
async function startMic(){if(st.listening)return;st.ctx.event?.();
 if(window.__reciteFake){st.listening=true;micUI();return}
 let stream;try{stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true,channelCount:1}})}
 catch{msg(L('Microphone permission is needed. On iPhone: Settings › Safari › Microphone (or allow when asked).','مائیک کی اجازت درکار ہے۔'),'warn');return}
 const AC=window.AudioContext||window.webkitAudioContext;const ac=new AC();await ac.resume().catch(()=>{});
 const src=ac.createMediaStreamSource(stream),proc=ac.createScriptProcessor(4096,1,1);const ratio=ac.sampleRate/SR;
 st.mic={stream,ac,src,proc,rest:new Float32Array(0)};st.buf=[];st.voiced=0;st.sil=0;st.floor=0.004;st.lastPartial=0;
 proc.onaudioprocess=e=>{if(!st||!st.listening)return;const x=e.inputBuffer.getChannelData(0);const outN=Math.floor(x.length/ratio),o=new Float32Array(outN);
  for(let i=0;i<outN;i++){const p=i*ratio,k=Math.floor(p),f=p-k;o[i]=x[k]*(1-f)+(x[k+1]??x[k])*f}
  let r=st.mic.rest,all=new Float32Array(r.length+o.length);all.set(r);all.set(o,r.length);let i=0;for(;i+FRAME<=all.length;i+=FRAME)frame(all.subarray(i,i+FRAME).slice());st.mic.rest=all.slice(i)};
 src.connect(proc);proc.connect(ac.destination);st.listening=true;micUI()}
function stopMic(){if(!st)return;if(st.mic){try{st.mic.proc.disconnect();st.mic.src.disconnect();st.mic.stream.getTracks().forEach(t=>t.stop());st.mic.ac.close()}catch{/* ignore */}st.mic=null}
 if(st.listening&&st.buf?.length&&st.voiced>=4)commit();st.listening=false;if(panel)micUI()}
function micUI(){const b=$('#rcMic');b.classList.toggle('on',st.listening);b.innerHTML=st.listening?`⏹ ${L('Stop','روکیں')}`:`🎙 ${L('Start','شروع')}`;if(st.listening)msg(L('Listening… recite at your normal pace.','سن رہا ہے… معمول کی رفتار سے پڑھیں۔'))}
function frame(f){if(st.hold)return;let e=0;for(const v of f)e+=v*v;const rms=Math.sqrt(e/f.length);const thr=Math.max(0.012,st.floor*2.5);const sp=rms>thr;
 if(!sp)st.floor=st.floor*0.97+rms*0.03;
 st.buf.push(f);if(sp){st.voiced++;st.sil=0}else st.sil++;
 if(!st.voiced){if(st.buf.length>3)st.buf.shift();return}// keep 300ms pre-roll only
 const len=st.buf.length/10;
 if((st.sil>=7&&st.voiced>=4)||len>=14)return commit();
 if(st.sil>=15){st.buf=[];st.voiced=0;st.sil=0;return}// short noise blip
 const now=performance.now();if(st.voiced>=6&&now-st.lastPartial>1200&&!st.busy&&!st.queue.length){st.lastPartial=now;send('partial',join(st.buf))}}
const join=b=>{const o=new Float32Array(b.length*FRAME);b.forEach((f,i)=>o.set(f,i*FRAME));return o};
function commit(){const audio=join(st.buf);st.buf=[];st.voiced=0;st.sil=0;st.seq++;send('commit',audio)}
function send(kind,audio,extra){const id=++st.idc||(st.idc=1);const job={kind,seq:st.seq,id,...extra};if(kind==='commit')job.audio=audio.slice();
 if(kind==='partial'){st.queue=st.queue.filter(q=>q.job.kind!=='partial')}st.queue.push({job,audio});pump()}
function pump(){if(!st||st.busy||!st.queue.length)return;const {job,audio}=st.queue.shift();st.jobs[job.id]=job;st.busy=true;getWorker().postMessage({type:'tx',id:job.id,audio,second:job.kind==='verify'},[audio.buffer])}

// ---------- judging ----------
const windowE=()=>st.flat.slice(st.p,st.p+WIN).map(x=>x.n);
function handle(job,text){if(!st)return;const H=hwords(text);if(navigator.webdriver)(window.__rlog??=[]).push([job.kind,text]);
 if(job.kind==='partial'){if(job.seq!==st.seq)return;st.live=H.length?judge(windowE(),H).done:0;return draw()}
 st.live=0;if(!H.length)return draw();
 if(job.kind==='verify'){// second opinion (beam search, padded): red only where BOTH decodes flag the same word
  const j=judge(job.E,H),flag=new Set(j.marks.filter(m=>m.st==='wrong'||m.st==='skip').map(m=>m.k));
  return apply(job.first,job.base,k=>flag.has(k))}
 const E=windowE();const j=judge(E,H);
 if(job.audio&&j.marks.some(m=>m.st==='wrong'||m.st==='skip')){// don't show red yet: confirm with a second decode (a few hundred ms)
  st.queue.unshift({job:{kind:'verify',id:++st.idc,seq:st.seq,E,first:j,base:st.p},audio:job.audio});return pump()}
 apply(j,st.p,()=>true)}
/** Apply a judged segment. confirm(k) says whether a red candidate at window index k is confirmed. */
function apply(j,base,confirm){if(!st||base!==st.p)return;let bad=null;
 for(const m of j.marks){const i=base+m.k;const red=(m.st==='wrong'||m.st==='skip')&&confirm(m.k);st.marks[i]=m.st==='ok'?'ok':red?'bad':'unc';if(red)bad??={i,st:m.st}}
 if(!j.done){const c=st.p;st.marks[c]=st.marks[c]||'try';msg(L('Unclear — please repeat from the highlighted word.','واضح نہیں — نشان زدہ لفظ سے دوبارہ پڑھیں۔'),'soft');draw();return}
 st.p+=j.done;if(st.marks[st.p]==='try')delete st.marks[st.p];
 if(bad)showFix(bad);else if(j.marks.some(m=>m.st!=='ok'))msg(L('Some words were unclear (amber). Repeat them if you like, or continue.','کچھ الفاظ واضح نہیں تھے (پیلے)۔ چاہیں تو دہرائیں۔'),'soft');else if(st.listening)msg(L('Listening…','سن رہا ہے…'));
 if(st.p>=st.flat.length){msg(L('Surah complete ✓','سورت مکمل ✓'));stopMic()}draw()}
function showFix(b){const w=st.flat[b.i];const box=$('#rcFix');box.hidden=false;
 box.innerHTML=`<div class="rc-fh">${b.st==='skip'?L('Missed word','چھوٹا ہوا لفظ'):L('Check this word','یہ لفظ دیکھیں')} · ${st.n}:${w.a}</div><div class="ar rc-fw" dir="rtl" lang="ar">${esc(w.t)}</div>${w.tr?`<div class="rc-ft"><i>${esc(w.tr)}</i>${w.m?` · ${esc(w.m)}`:''}</div>`:''}
 <div class="bar"><button class="btn" id="rcPw">▶ ${L('Word','لفظ')}</button><button class="btn" id="rcPa">▶ ${L('Ayah','آیت')}</button><button class="btn" id="rcGo">${L('Continue','جاری رکھیں')}</button></div>`;
 msg(L('Listen to the correct word, then continue reciting.','درست لفظ سنیں، پھر تلاوت جاری رکھیں۔'),'warn');
 $('#rcPw').onclick=async()=>play(w.au||await st.ctx.ayahUrl(w.a));$('#rcPa').onclick=async()=>play(await st.ctx.ayahUrl(w.a));$('#rcGo').onclick=()=>{box.hidden=true;stopAudio();if(st.listening)msg(L('Listening…','سن رہا ہے…'))}}
let au=null;function stopAudio(){if(au){au.pause();au=null}if(st)st.hold=false}
function play(url){stopAudio();if(!url)return;st.hold=true;st.buf=[];st.voiced=0;au=new Audio(url);const done=()=>{if(st){st.hold=false;st.buf=[];st.voiced=0}};au.onended=done;au.onerror=done;au.play().catch(done)}
// test hooks (automation only): feed recognized text without a model or microphone
if(navigator.webdriver)window.__recite={commit:t=>handle({kind:'commit',seq:st.seq},t),partial:t=>handle({kind:'partial',seq:st.seq},t),state:()=>st&&{p:st.p,marks:{...st.marks}}};
