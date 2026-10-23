// "Recite & Learn" live tutor. Lazy-loaded only when opened.
// A small speech model runs on-device in a Web Worker and is re-run every ~250 ms on the last few seconds of audio;
// the tracker (recite-live.js) highlights each expected word the moment it is heard. Audio never leaves the phone.
import {norm} from './recite-core.js';
import {Tracker,GOP_CFG} from './recite-live.js';
import * as PG from './progress.js';
import * as TJ from './tj-rules.js';
import {Resampler,Conditioner} from './audio-front.js';
import {esc} from './lib.js';
import * as I from './icons.js';
import {weakKey,weakLoad,weakSave,recMiss,recFix,recReviewFail,attempt,syllables,syllWeights,syllAt,estimateSlice,letters,ENCOURAGE,ESCALATE_AT} from './coach.js';
import {TIPS,SHADDA_TIP,PLAIN_TIP,hardOf,trickyIn,hasShadda} from './tajweed.js';
const SILENT='data:audio/wav;base64,UklGRrQBAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YZABAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA';
const MODEL_BASE='https://kapadia100.github.io/noor-quran-app/models/',MB=19;
const SR=16000,FLAT_MAX=400;
// Quality levels trade how often the audio is re-checked (battery / heat) for how quickly words light up. All use the same on-device model.
const QUAL={fast:{hop:400,win:8,gop:{...GOP_CFG,on:false}},balanced:{hop:250,win:10,gop:GOP_CFG},accurate:{hop:180,win:12,gop:{...GOP_CFG,red:-2,sim:-3.5}}};
const qPref=()=>{const v=localStorage.getItem('qsQuality');return v==='fast'||v==='balanced'||v==='accurate'?v:'auto'};
const qLevel=()=>{const p=qPref();return p==='auto'?(st?.autoQ||'balanced'):p};
const Q=()=>QUAL[qLevel()];
const PREF={mode:'follow'};
const buzz=p=>{try{if(localStorage.getItem('qsHaptic')!=='0')navigator.vibrate?.(p)}catch{/* not supported (iPhone Safari) */}};
let worker=null,ready=false,panel=null,st=null;
const $=s=>panel.querySelector(s);
const ur=()=>document.documentElement.lang==='ur';
const rcOnbOn=()=>localStorage.getItem('qsRcOnb')!=='1'&&(!navigator.webdriver||!!localStorage.getItem('qsRcOnbTest'));
const L=(en,u)=>ur()?u:en;
function getWorker(){if(!worker){worker=new Worker((import.meta.env.BASE_URL||'/')+'recite-worker.js',{type:'module'});worker.onmessage=onMsg}return worker}
function onMsg(e){const m=e.data;
 if(m.type==='progress'&&st){const p=m.total?Math.min(99,Math.round(100*m.loaded/m.total)):0;$('#rcBar').style.width=p+'%';chip('load',L(`Downloading tutor… ${p}%`,`ٹیوٹر ڈاؤن لوڈ ہو رہا ہے… ${p}%`))}
 if(m.type==='ready'){ready=true;localStorage.setItem('qsCtc','1');if(st){$('#rcDl').hidden=true;$('#rcBar').parentNode.hidden=true;$('#rcMic').disabled=false;chip('ready',readyMsg())}}
 if(m.type==='error'){window.__reciteErr=m.message;if(st){if(!ready){$('#rcDl').disabled=false;$('#rcDl').hidden=false;$('#rcBar').parentNode.hidden=true}chip('warn',L('Could not load the tutor. Check your connection and try again.','ٹیوٹر لوڈ نہیں ہو سکا۔ انٹرنیٹ چیک کریں۔'))}}
 if(m.type==='run'&&st){st.busy=false;const job=st.job;st.job=null;st.decMs=st.decMs?st.decMs*0.7+m.ms*0.3:m.ms;if(job&&job.gen===st.gen)result(job,m.words,m.ms,m.lp?{lp:m.lp,T:m.T}:null)}}
const readyMsg=()=>st?.drill?L('Ready — tap the mic. You will hear each word, then repeat it.','تیار — مائیک دبائیں۔ ہر لفظ سنیں، پھر دہرائیں۔'):L('Ready — tap the mic and recite','تیار — مائیک دبائیں اور پڑھیں');
function chip(kind,text){if(!panel)return;const c=$('#rcChip');c.className='rc-chip '+kind;c.querySelector('span').textContent=text}

/** Spaced-repetition review of saved weak words (items from the weak store). */
export function review(items,ctx){if(ctx.gc)ctx.gc('feature-recite-review');open(0,1,{...ctx,txts:[],review:items})}

/** Open the panel for surah n starting at ayah a. ctx: {words, txts, ayahUrl(a), event} */
export function open(n,a,ctx){close();st={n,ctx,flat:[],gen:1,idc:0,chunks:[],end:0,cut:0,lastVoice:-9,floor:0.004,lvl:0,busy:false,listening:false,hold:false,sent:0,lineA:0,miss:{},coach:null,queue:[],flagged:{},fixed:{},skipped:{},weak:weakLoad(),player:null,coachEvt:false,pronEvt:false,helpEvt:false,helping:false,hseq:0,progAt:0,sig:'',stuckDone:false,helpI:-1,drill:ctx.review?{items:ctx.review,idx:0,fixes:0,skips:0,review:true}:null,nudge:0,mode:ctx.review?'follow':PREF.mode,hint:{},first:{},hintN:0,t0:Date.now(),snap:{ok:0,bad:0,unc:0},nRun:0,P:PG.load(),rate:+localStorage.getItem('qsRate')||1,startA:a};
 for(let i=a;!ctx.review&&i<=Math.min(ctx.txts.length,ctx.to||1e9)&&st.flat.length<FLAT_MAX;i++){const w=ctx.words?.[i];const list=w?w.map(x=>({t:x.t,tr:x.tr,m:x.m,au:x.au})):ctx.txts[i-1].split(/\s+/).filter(x=>norm(x)).map(t=>({t}));
  list.forEach((x,k)=>st.flat.push({...x,a:i,k,n:norm(x.t)}))}
 st.flat=st.flat.filter(x=>x.n);st.T=new Tracker(st.flat.map(x=>x.n));st.T.cfg=Q().gop;st.rangeA=a;st.rangeB=st.flat.length?st.flat[st.flat.length-1].a:a;
 panel=document.createElement('section');panel.id='recite';panel.className='recite';panel.setAttribute('aria-label','Recite and Learn');
 panel.innerHTML=`<div class="rc-h"><span class="rc-ic">${I.icon('tutor')}</span><div class="rc-t"><b>${L('Recite & Learn','تلاوت اور سیکھیں')}</b><small>${L('Live tutor','لائیو ٹیوٹر')} · <span class="rc-ref"></span></small></div><button class="rc-x" aria-label="Close">✕</button></div>
 <button class="rc-optb" id="rcOptB" aria-expanded="false" aria-controls="rcOpt"><span id="rcOptS"></span><i aria-hidden="true">⚙</i></button>
 <div class="rc-ocard" id="rcOpt" hidden></div>
 <div class="rc-onb" id="rcOnb" hidden></div>
 <div class="rc-line ar" dir="rtl" lang="ar" id="rcLine"></div>
 <div class="rc-tjk" id="rcTjk" hidden></div>
 <div class="rc-tjc" id="rcTjc" hidden></div>
 <div class="rc-nudge" id="rcNudge" hidden></div>
 <div class="rc-help" id="rcHelpCard" hidden></div>
 <div class="rc-fix" id="rcFix" hidden></div>
 <div class="rc-sum" id="rcSum" hidden></div>
 <div class="rc-prog" hidden><div id="rcBar"></div></div>
 <div class="rc-chip" id="rcChip"><i></i><span></span></div>
 <div class="rc-lv" aria-hidden="true"><i id="rcLv"></i></div>
 <div class="rc-key"><span class="k-ok">${L('Correct','درست')}</span><span class="k-unc">${L('Unclear','غیر واضح')}</span><span class="k-bad">${L('Check','دیکھیں')}</span></div>
 <div class="bar rc-ctl"><button class="btn" id="rcDl" hidden>${L(`Download tutor (~${MB} MB, once)`,`ٹیوٹر ڈاؤن لوڈ کریں (~${MB} MB، ایک بار)`)}</button><button class="rc-mic" id="rcMic" disabled aria-label="Microphone">${I.icon('mic')}<span>${L('Start','شروع')}</span></button><button class="btn rc-hb" id="rcHint" hidden></button><button class="btn rc-hb" id="rcHelp" aria-label="${L('Help, I am stuck','مدد، میں اٹک گیا')}">❓ ${L('Help · I’m stuck','مدد · اٹک گیا')}</button></div>
 <p class="rc-note muted">${L('Checks your words as you recite, not full tajweed. Your voice stays on your phone.','یہ الفاظ چیک کرتا ہے، مکمل تجوید نہیں۔ آپ کی آواز فون سے باہر نہیں جاتی۔')}</p>`;
 document.body.append(panel);$('.rc-x').onclick=close;wireExtras();paint();
 $('#rcHelp').onclick=()=>{unlockAudio();helpTap()};
$('#rcMic').onclick=async()=>{if(st.listening){stopMic();endOrSummary();return}await startMic();if(!st||!st.listening)return;if(st.coach&&!st.coach.done)listen();else if(st.drill)drillNext();else if(st.mode==='lr')lrPlay(true)};
 if(st.drill){$('#rcLine').hidden=true;$('.rc-ref').textContent=L('Review','دہرائی');$('.rc-key').hidden=true}
 $('#rcDl').onclick=()=>{$('#rcDl').disabled=true;$('#rcBar').parentNode.hidden=false;load()};
 st.timer=setInterval(tick,100);
 if(window.__reciteFake){ready=true;$('#rcMic').disabled=false;chip('ready','Ready');return}
 if(ready){$('#rcMic').disabled=false;chip('ready',readyMsg())}
 else if(localStorage.getItem('qsCtc')){$('#rcBar').parentNode.hidden=false;chip('load',L('Preparing tutor…','ٹیوٹر تیار ہو رہا ہے…'));load()}
 else{$('#rcDl').hidden=false;chip('info',L('First use downloads a small tutor once. After that it works from your phone.','پہلی بار ایک چھوٹا ٹیوٹر ڈاؤن لوڈ ہوگا، پھر یہ فون پر ہی چلے گا۔'))}}
function load(){getWorker().postMessage({type:'load',base:localStorage.getItem('qsAsrBase')||MODEL_BASE})}
/** Forget the in-memory worker/model (used after the downloaded model is deleted from the More tab). */
export function resetModel(){try{worker?.terminate()}catch{/* ignore */}worker=null;ready=false}
export function close(){if(!st)return;logNow();document.removeEventListener('visibilitychange',onVis);pt++;try{st.player?.pause()}catch{/* ignore */}stopMic();clearInterval(st.timer);clearTimeout(st.nudge);clearTimeout(st.coach?.to);st.hseq++;panel?.remove();panel=null;st=null;document.querySelectorAll('.ayah.reciting').forEach(e=>e.classList.remove('reciting'))}

// ---------- word line ----------
function wordClass(i){const T=st.T,m=T.marks[i];if(m)return 'rc-'+m+(st.fx?.[i]?' rc-fx':'');if(T.prov[i])return 'rc-live';return ''}
function paint(){if(!st||!panel||st.drill)return;const T=st.T,fl=st.flat;const ci=st.listening?Math.min(T.cursor,fl.length-1):T.p;const cur=fl[ci];
 if(!cur){$('#rcLine').innerHTML=`<span class="rc-done">✓ ${L('Surah complete','سورت مکمل')}</span>`;return}
 if(st.lineA!==cur.a){st.lineA=cur.a;$('.rc-ref').textContent=`${st.n}:${cur.a}`;
  $('#rcLine').innerHTML=fl.map((x,i)=>[x,i]).filter(([y])=>y.a===cur.a).map(([,i])=>`<span class="rc-w" data-i="${i}">${wordInner(i)}</span>`).join(' ');tjLegend();
  document.querySelectorAll('.ayah.reciting').forEach(e=>e.classList.remove('reciting'));const el=document.getElementById('a'+cur.a);if(el){el.classList.add('reciting');el.scrollIntoView({block:'center',behavior:'smooth'})}}
 for(const s of panel.querySelectorAll('.rc-w')){const i=+s.dataset.i;const c=wordClass(i)+(i===ci&&!T.marks[i]&&!T.prov[i]?' rc-cur':'')+(i===st.helpI?' rc-hl':'');const h=wordInner(i);if(s.dataset.c!==c||s.dataset.h!==h){if(s.dataset.h!==h){s.dataset.h=h;s.innerHTML=h}s.dataset.c=c;s.className='rc-w '+c+(revealed(i)?'':' rc-hid')}}}

// ---------- microphone ----------
async function startMic(){if(st.listening)return;st.ctx.event?.();unlockAudio();
 if(window.__reciteFake){st.listening=true;armStuck(window.__stuckFirst??1500);micUI();return}
 if(!navigator.mediaDevices?.getUserMedia){chip('warn',L('This browser cannot use the microphone here. Open the app directly in Safari or Chrome (not inside another app).','یہاں یہ براؤزر مائیک استعمال نہیں کر سکتا۔ ایپ کو براہِ راست Safari یا Chrome میں کھولیں (کسی اور ایپ کے اندر نہیں)۔'));return}
 let stream;const gum=a=>navigator.mediaDevices.getUserMedia({audio:a});
 try{try{stream=await gum({echoCancellation:true,noiseSuppression:true,autoGainControl:true,channelCount:1})}catch(e){if(e&&e.name==='OverconstrainedError')stream=await gum(true);else throw e}}
 catch(e){const n=e&&e.name;chip('warn',n==='NotFoundError'||n==='DevicesNotFoundError'?L('No microphone found on this device.','اس ڈیوائس پر مائیک نہیں ملا۔'):n==='NotReadableError'||n==='TrackStartError'?L('The microphone is busy — close other apps or calls that use it, then tap the mic again.','مائیک مصروف ہے — اسے استعمال کرنے والی دوسری ایپس یا کالز بند کریں، پھر دوبارہ مائیک دبائیں۔'):L('Microphone permission is needed. On iPhone: tap the aA button in Safari › Website Settings › Microphone › Allow (or Settings › Safari › Microphone). Then tap the mic again.','مائیک کی اجازت درکار ہے۔ آئی فون پر: Safari میں aA › ویب سائٹ سیٹنگز › مائیک › اجازت دیں (یا Settings › Safari › Microphone)۔ پھر دوبارہ مائیک دبائیں۔'));return}
 const AC=window.AudioContext||window.webkitAudioContext;const ac=new AC();await ac.resume().catch(()=>{});
 const src=ac.createMediaStreamSource(stream),proc=ac.createScriptProcessor(4096,1,1);const rs=new Resampler(ac.sampleRate,SR),cond=new Conditioner();
 st.mic={stream,ac,src,proc};
 ac.onstatechange=()=>{if(st&&st.mic&&st.mic.ac===ac&&ac.state!=='running'&&st.listening){stopMic();chip('warn',L('The microphone was interrupted (a call or another app). Tap the mic to continue.','مائیک رک گیا (کال یا کوئی اور ایپ)۔ جاری رکھنے کے لیے مائیک دبائیں۔'))}};
 proc.onaudioprocess=e=>{if(!st||!st.listening)return;ingest(cond.process(rs.push(e.inputBuffer.getChannelData(0))))};
 src.connect(proc);proc.connect(ac.destination);st.listening=true;armStuck(1500);micUI();
 try{navigator.wakeLock?.request('screen').then(l=>{if(st&&st.listening)st.wl=l;else l.release()}).catch(()=>{})}catch{/* optional */}}
function stopMic(){if(!st)return;try{st.wl?.release()}catch{/* ignore */}st.wl=null;if(st.mic){try{st.mic.proc.disconnect();st.mic.src.disconnect();st.mic.stream.getTracks().forEach(t=>t.stop());st.mic.ac.close()}catch{/* ignore */}st.mic=null}
 st.listening=false;st.lvl=0;if(panel){micUI();paint()}}
function micUI(){const b=$('#rcMic');b.classList.toggle('on',st.listening);b.querySelector('span').textContent=st.listening?L('Stop','روکیں'):L('Start','شروع');b.setAttribute('aria-pressed',st.listening);
 if(st.listening)chip('listen',L('Listening — start reciting','سن رہا ہے — پڑھنا شروع کریں'));else if(ready)chip('ready',L('Paused — tap the mic to continue','رکا ہوا — جاری رکھنے کے لیے مائیک دبائیں'));paint()}
/** Append 16 kHz mono samples; track level + voice activity; keep only the audio the tracker can still need. */
function ingest(o){if(st.hold||!o.length)return;let e=0;for(let i=0;i<o.length;i++)e+=o[i]*o[i];const rms=Math.sqrt(e/o.length);const thr=Math.max(0.01,st.floor*2.5);
 st.chunks.push({s:st.end,a:o});st.end+=o.length;const t=st.end/SR;
 if(rms>thr){st.lastVoice=t;if(st.coach)st.coach.voiced=true}else st.floor=st.floor*0.97+rms*0.03;
 st.lvl=Math.max(Math.min(1,rms*9),st.lvl*0.8);
 const keep=Math.min(st.T.winStart,t-Q().win,st.cut/SR)-1;while(st.chunks.length>1&&(st.chunks[0].s+st.chunks[0].a.length)/SR<keep)st.chunks.shift()}
function slice(t0,t1){const s0=Math.max(0,Math.floor(t0*SR)),s1=Math.min(st.end,Math.floor(t1*SR));if(s1<=s0)return new Float32Array(0);const out=new Float32Array(s1-s0);
 for(const c of st.chunks){const a=Math.max(c.s,s0),b=Math.min(c.s+c.a.length,s1);if(b>a)out.set(c.a.subarray(a-c.s,b-c.s),a-s0)}return out}
function tick(){if(!st||!panel)return;const t=st.end/SR;
 // level meter + state chip
 const lv=st.listening?st.lvl:0;$('#rcLv').style.transform=`scaleX(${lv.toFixed(3)})`;$('#rcMic').style.setProperty('--lv',lv.toFixed(3));st.lvl*=0.85;
 if(st.listening&&!st.hold&&!st.fixOpen){const hearing=t-st.lastVoice<0.5;if(hearing!==st.hearing){st.hearing=hearing;chip(hearing?'hear':'listen',hearing?L('Hearing you…','آپ کو سن رہا ہے…'):L('Listening — start reciting','سن رہا ہے — پڑھنا شروع کریں'))}}
 stuckTick(t);
 if(!st.listening||st.busy||st.hold||!ready||window.__reciteFake)return;
 const now=performance.now();if(now-st.sent<Q().hop)return;if(t-st.lastVoice>2.2)return; // nothing new to hear
 const s0=Math.max(st.T.winStart,st.cut/SR,t-Q().win);if(t-s0<0.5)return;
 const audio=slice(s0,t);st.sent=now;st.busy=true;const job={id:++st.idc,gen:st.gen,off:s0,t,at:now};st.job=job;getWorker().postMessage({type:'run',id:job.id,audio},[audio.buffer])}

// ---------- tracking ----------
function result(job,ws,ms,aux){autoQ(ms);const H=ws.map(x=>({w:norm(x.s),t0:job.off+x.t0,t1:job.off+x.t1})).filter(x=>x.w);
 if(st.coach){coachEval(H.map(x=>x.w),job.t-st.lastVoice>=0.7&&st.coach.voiced);return}
 if(navigator.webdriver)(window.__rlog??=[]).push({t:Math.round(performance.now()),aud:job.t,ms,h:H.map(x=>x.w).join(' ')});
 step(H,job.t,aux)}
function step(H,t,aux){const before=new Set(Object.keys(st.T.prov));const ev=st.T.update(H,t,aux);
 if(navigator.webdriver)for(const k of Object.keys(st.T.prov))if(!before.has(k))(window.__rgreen??=[]).push({i:+k,wall:Math.round(performance.now()),aud:t});
 for(const e of ev){if(e.type==='lock')st.first[e.i]=e.st;if(e.st==='bad')flag(e.i,e.kind,e.heard);else if(e.st==='unc'&&!st.coach)nudge(e.i)}
 paint();if(st.mode==='lr'&&st.listening&&!st.coach&&!st.drill){const c=st.flat[Math.min(st.T.cursor,st.flat.length-1)];if(c&&c.a!==st.lrA&&st.T.p<st.flat.length)lrPlay()}
 if(st.T.p>=st.flat.length&&!st.coach&&!st.queue.length){buzz([20,40,20,40,80]);chip('ok',L(st.rangeB>=st.ctx.txts.length?'Surah complete ✓':'Range complete ✓',st.rangeB>=st.ctx.txts.length?'سورت مکمل ✓':'حصہ مکمل ✓'));stopMic();paint();showSummary(true)}}
// ---------- coach: hear it, say it again; escalate after repeated misses ----------
const SYL_RATE=0.6;
function targetOf(i){const f=st.flat[i],sa=st.flat.filter(x=>x.a===f.a),pos=sa.indexOf(f),lo=Math.max(0,pos-2),hi=Math.min(sa.length-1,pos+2);
 return {key:weakKey(st.n,f.a,f.k),sn:st.n,a:f.a,k:f.k,t:f.t,nw:f.n,tr:f.tr,m:f.m,au:f.au,ph:sa.slice(lo,hi+1).map(x=>({t:x.t,au:x.au})),pi:pos-lo,cn:sa.map(x=>x.n.length),ci:pos,i}}
function pl(){if(!st.player){st.player=new Audio();st.player.preload='auto';st.player.playsInline=true;st.player.setAttribute('playsinline','')}return st.player}
/** iPhone only lets audio start from a gesture: the mic tap "unlocks" one shared player that is reused afterwards. */
function unlockAudio(){if(window.__reciteFake)return;try{const p=pl();p.muted=true;p.src=SILENT;const r=p.play();const un=()=>{if(p.src===SILENT)p.pause();p.muted=false};r&&r.then(un).catch(()=>{p.muted=false})}catch{/* ignore */}}
let pt=0;
function playPart(url,o={}){return new Promise(res=>{const tok=++pt;let done=false,iv=0,to=0,from=0,end=Infinity;const p=pl();
 const fin=r=>{if(done)return;done=true;clearInterval(iv);clearTimeout(to);p.onended=p.onerror=p.onloadedmetadata=null;if(r!=='end'){try{p.pause()}catch{/* ignore */}}res(r)};
 if(window.__reciteFake){(window.__rplays??=[]).push({url,rate:o.rate||1,tag:o.tag});if(window.__rnoword&&o.tag==='word')return fin('error');Promise.resolve().then(()=>fin('end'));return}
 if(!url)return fin('error');
 p.onerror=()=>fin('error');p.onended=()=>fin('end');
 p.onloadedmetadata=()=>{clearTimeout(to);try{if(o.slice)[from,end]=estimateSlice(o.slice.cn,o.slice.i0,o.slice.i1,p.duration||0,o.slice.pad);
  if(from>0.01)p.currentTime=from;p.muted=false;p.volume=1;p.playbackRate=o.rate||1;p.preservesPitch=true;p.webkitPreservesPitch=true;
  const pr=p.play();if(pr)pr.catch(e=>fin(e&&e.name==='NotAllowedError'?'blocked':'error'));
  iv=setInterval(()=>{if(tok!==pt||!st)return fin('cancel');const e2=Math.min(end,p.duration||end);o.onTick?.((p.currentTime-from)/Math.max(0.05,e2-from));if(p.currentTime>=e2-0.03)fin('end')},40)}catch{fin('error')}};
 p.src=url;p.load();to=setTimeout(()=>fin('error'),8000)})}
async function playWord(t,o={}){const r=await playPart(t.au,{...o,tag:'word'});if(r!=='error')return r;
 const u=await st.ctx.ayahUrl?.(t.a,t.sn);return u?playPart(u,{...o,tag:'slice',slice:{cn:t.cn,i0:t.ci,i1:t.ci,pad:0.25}}):r}
async function playPhrase(t,onWord){const ph=t.ph||[];
 if(ph.length&&ph.every(x=>x.au)){for(let j=0;j<ph.length;j++){onWord?.(j);const r=await playPart(ph[j].au,{tag:'phrase'});if(r==='cancel'||r==='blocked')return r;if(r==='error')break;if(j===ph.length-1)return 'end'}onWord?.(-1)}
 const u=await st.ctx.ayahUrl?.(t.a,t.sn);const lo=t.ci-t.pi;return u?playPart(u,{tag:'phrase-slice',slice:{cn:t.cn,i0:lo,i1:lo+Math.max(ph.length,1)-1,pad:0.15}}):'error'}
function flag(i,kind,heard=''){const t=targetOf(i);(st.kinds??={})[kind]=(st.kinds[kind]||0)+1;buzz([30,40,30]);try{PG.addMistake(st.P,{ts:Date.now(),sn:st.n,a:t.a,t:t.t,nw:t.nw,type:kind,heard});PG.save(st.P)}catch{/* ignore */}st.flagged[t.key]=t;st.miss[t.key]=(st.miss[t.key]||0)+1;recMiss(st.weak,t);weakSave(st.weak);
 if(st.coach)st.queue.push({t,kind});else coachStart(t,'bad',kind)}
function nudge(i){(st.kinds??={}).unclear=(st.kinds.unclear||0)+1;const t=targetOf(i),el=$('#rcNudge');el.hidden=false;
 el.innerHTML=`<span class="ar" dir="rtl" lang="ar">${esc(t.t)}</span><span>${L('Not clear — say it again?','واضح نہیں — دوبارہ کہیں؟')}</span><button class="btn" id="nRep">${L('Repeat','دہرائیں')}</button>`;
 $('#nRep').onclick=()=>coachStart(t,'unc');clearTimeout(st.nudge);st.nudge=setTimeout(hideNudge,7000)}
function hideNudge(){clearTimeout(st?.nudge);if(panel)$('#rcNudge').hidden=true}
function setSay(text,cls=''){const e=panel&&$('#rcSay');if(e){e.textContent=text;e.className='rc-say '+cls}}
function coachStart(t,kind,why){st.gen++;st.hold=true;st.fixOpen=true;hideNudge();hideHelp();$('#rcSum').hidden=true;
 const c=st.coach={t,kind,why,tries:0,esc:false,voiced:false,seq:0,done:false,sy:syllables(t.t)};c.sw=syllWeights(c.sy);
 if(!st.coachEvt){st.coachEvt=true;st.ctx.gc?.('feature-recite-coach')}
 const box=$('#rcFix');box.hidden=false;box.className='rc-fix rc-coach'+(kind==='unc'?' soft':'');
 const head=kind==='bad'?(why==='skip'?L('Skipped word','لفظ چھوٹ گیا'):L('Different word heard — let’s fix it','دوسرا لفظ سنائی دیا — آئیں درست کریں')):kind==='unc'?L('Say it once more','ایک بار پھر کہیں'):L('Practice','مشق');
 box.innerHTML=`<div class="rc-fh">${head} · ${t.sn}:${t.a}</div><div class="ar rc-bigw" dir="rtl" lang="ar">${esc(t.t)}</div>
 <div class="rc-syl ar" id="rcSyl" dir="rtl" lang="ar" hidden>${c.sy.map(s=>`<span>${esc(s)}</span>`).join('')}</div>
<div class="rc-let ar" id="rcLet" dir="rtl" lang="ar" hidden>${letters(t.t).map(u=>`<span class="${hardOf(u)?'hard':''}">${esc(u)}</span>`).join('')}</div>
 ${t.tr?`<div class="rc-ft"><i>${esc(t.tr)}</i>${t.m?` · ${esc(t.m)}`:''}</div>`:''}
 <div class="rc-phr ar" id="rcPhr" dir="rtl" lang="ar" hidden>${(t.ph||[]).map((x,j)=>`<span class="${j===t.pi?'me':''}">${esc(x.t)}</span>`).join(' ')}</div>
 <div class="rc-say" id="rcSay" role="status" aria-live="polite"></div>
 <div class="bar rc-cb"><button class="btn" id="cHear">▶ ${L('Hear','سنیں')}</button><button class="btn" id="cSlow">${L('Slow','آہستہ')}</button><button class="btn" id="cPhr">${L('In phrase','جملے میں')}</button><button class="btn ghost" id="cSkip">${L('Skip for now','ابھی چھوڑیں')}</button></div>
<div class="rc-tips" id="rcTips" hidden></div>`;
 $('#cHear').onclick=()=>act('hear');$('#cSlow').onclick=()=>act('slow');$('#cPhr').onclick=()=>act('phrase');$('#cSkip').onclick=coachSkip;
 const esc2=kind==='bad'&&(st.miss[t.key]||0)>=ESCALATE_AT;
 if(esc2){c.esc=true;act('pron',L('Let’s practise just the sound of this word.','آئیں صرف اس لفظ کی آواز کی مشق کریں۔'))}else act('hear',kind==='drill'?L('Listen…','سنیں…'):L('Listen to the correct word…','درست لفظ سنیں…'))}
function hl(f){const r=panel&&$('#rcSyl');if(!r||!st.coach)return;const k=f<0?-1:syllAt(st.coach.sw,f);[...r.children].forEach((e,i)=>e.classList.toggle('on',i===k))}
function showSyl(){const r=$('#rcSyl');if(r)r.hidden=false;$('#rcFix')?.classList.add('syl')}
/** Pronunciation-only drill view: syllables + letters with harakat, transliteration, and plain makhraj tips for the tricky letters. */
function showPron(){const c=st.coach;showSyl();$('#rcFix').classList.add('pron');const l=$('#rcLet');if(l)l.hidden=false;const el=$('#rcTips');if(!el||!c)return;
 const u=ur()?1:0,tl=trickyIn(c.t.t),h=tl.map(b=>{const x=TIPS[b];return `<div class="rc-tip"><span class="ar rc-tl" dir="rtl" lang="ar">${b}</span><div><b>${esc(x.n[u])}</b> · <small>${esc(x.p[u])}</small><p>${esc(x.e[u])}</p></div></div>`});
 if(hasShadda(c.t.t))h.push(`<div class="rc-tip"><span class="ar rc-tl" dir="rtl" lang="ar">◌ّ</span><div><p>${esc(SHADDA_TIP[u])}</p></div></div>`);
 if(!h.length)h.push(`<div class="rc-tip"><span class="rc-tl">✓</span><div><p>${esc(PLAIN_TIP[u])}</p></div></div>`);
 el.innerHTML=`<div class="rc-tips-h">${L('Sound tips','آواز کے مشورے')}</div>${h.join('')}`;el.hidden=false}
function showPhrase(){const r=$('#rcPhr');if(r)r.hidden=false}
function hlPhrase(j){const r=panel&&$('#rcPhr');if(r)[...r.children].forEach((e,i)=>e.classList.toggle('cur',i===j))}
/** One coaching action: play (cancelling anything else), then go back to listening for his repeat. */
async function act(kind,pre){const c=st.coach;if(!c||c.done)return;const my=++c.seq,t=c.t;st.hold=true;c.voiced=false;pt++;try{pl().pause()}catch{/* ignore */}
 const gone=()=>!st||st.coach!==c||c.done||c.seq!==my;let r='end';
 chip('hear',L('Playing…','چل رہا ہے…'));if(pre)setSay(pre,'play');else setSay(L('Listen…','سنیں…'),'play');
 if(kind==='hear')r=await playWord(t);
 else if(kind==='slow'){showSyl();r=await playWord(t,{rate:SYL_RATE,onTick:hl});hl(-1)}
 else if(kind==='phrase'){showPhrase();r=await playPhrase(t,hlPhrase);hlPhrase(-1)}
 else if(kind==='pron'){showPron();c.pron=true;if(!st.pronEvt){st.pronEvt=true;st.ctx.gc?.('feature-recite-pronounce')}
  setSay(L('Slowly — watch each part.','آہستہ — ہر حصے کو دیکھیں۔'),'play');r=await playWord(t,{rate:SYL_RATE,onTick:hl});hl(-1);if(gone())return;
  if(r!=='blocked'){setSay(L('Now at normal speed.','اب عام رفتار سے۔'),'play');r=await playWord(t)}}
 if(gone())return;
 if(r==='blocked')setSay(L('Tap ▶ Hear to listen, then say the word.','سننے کے لیے ▶ دبائیں، پھر لفظ کہیں۔'),'play');
 listen(r==='blocked'?null:(kind==='pron'?L('Now you try — take your time.','اب آپ کوشش کریں — آرام سے۔'):null))}
function listen(msg){const c=st.coach;if(!c)return;c.voiced=false;st.gen++;st.cut=st.end;st.hold=false;setSay(msg||L('Now repeat the word','اب اس لفظ کو دہرائیں'),'say');chip('listen',L('Listening — repeat the word','سن رہا ہے — لفظ دہرائیں'))}
/** Judge a repeat attempt. Success is instant; a miss only counts after he stopped speaking AND the heard word is clearly different. */
function coachEval(heard,ended){const c=st.coach;if(!c||c.done||st.hold)return;const r=attempt(c.t.nw,heard);
 if(r.v==='ok')return coachWin();
 if(!ended)return;c.voiced=false;st.cut=st.end;st.gen++;
 if(r.v==='none')return setSay(L('I did not catch that — say the word again.','سمجھ نہیں آیا — لفظ دوبارہ کہیں۔'),'say');
 if(r.v==='close')return setSay(L('Close — try once more.','قریب ہے — ایک بار اور۔'),'say');
 if(c.kind==='unc')return setSay(L('Try once more, or tap Skip.','ایک بار اور کوشش کریں یا چھوڑ دیں۔'),'say');
 c.tries++;const k=c.t.key;st.miss[k]=(st.miss[k]||0)+1;recMiss(st.weak,c.t);weakSave(st.weak);
 const enc=ENCOURAGE[(c.tries-1)%ENCOURAGE.length],msg=L(enc[0],enc[1]);
 if(st.miss[k]>=ESCALATE_AT&&!c.esc){c.esc=true;act('pron',L('Let’s practise just the sound of this word.','آئیں صرف اس لفظ کی آواز کی مشق کریں۔'))}else act(c.esc&&c.tries%2?'pron':'hear',msg)}
function coachWin(){const c=st.coach;if(!c||c.done)return;c.done=true;pt++;try{pl().pause()}catch{/* ignore */}st.hold=true;const k=c.t.key,t=c.t;
 if(c.kind==='bad'){st.fixed[k]=t;if(st.weak[k])recFix(st.weak,k);if(st.T.marks[t.i]==='bad'){st.T.marks[t.i]='ok';(st.fx??={})[t.i]=1}}
 else if(c.kind==='drill'){st.fixed[k]=t;st.drill.fixes++;if(st.weak[k]){if(st.drill.review)recFix(st.weak,k,Date.now(),true);else recFix(st.weak,k)}}
 weakSave(st.weak);buzz(25);setSay(L('✓ Well done!','✓ شاباش!'),'win');$('#rcFix').classList.add('win');chip('ok',L('Correct','درست'));paint();
 c.to=setTimeout(coachEnd,window.__reciteFake?0:1000)}
function coachSkip(){const c=st.coach;if(!c||c.done)return;c.done=true;pt++;try{pl().pause()}catch{/* ignore */}clearTimeout(c.to);const k=c.t.key;
 if(c.kind==='bad'||c.kind==='drill'){st.skipped[k]=c.t;if(st.weak[k]){st.weak[k].skips=(st.weak[k].skips||0)+1;if(c.kind==='drill'&&st.drill.review)recReviewFail(st.weak,k);weakSave(st.weak)}}
 if(st.drill)st.drill.skips++;coachEnd()}
function coachEnd(){if(!st||!st.coach)return;st.coach=null;st.fixOpen=false;st.gen++;const box=$('#rcFix');box.hidden=true;box.classList.remove('win');
 if(st.drill)return drillNext();
 const q=st.queue.shift();if(q)return coachStart(q.t,'bad',q.kind);
 st.hold=false;st.cut=st.end;armStuck(1500);paint();if(st.listening)chip('listen',L('Continue from the next word.','اگلے لفظ سے جاری رکھیں۔'));else if(ready)chip('ready',readyMsg())}
// ---------- stuck help: gentle, never a miss ----------
const STUCK_MS=3500,sleep=ms=>new Promise(r=>setTimeout(r,ms));
function armStuck(extra=0){if(!st)return;st.progAt=performance.now()+extra;st.stuckDone=false;st.sig=sigOf()}
const sigOf=()=>`${st.T.cursor}:${Object.keys(st.T.prov).length}:${Object.keys(st.T.marks).length}`;
/** Called every 100 ms: progress re-arms; a quiet stall of ~3.5 s plays the expected word once. */
function stuckTick(t){if(!st.listening||st.hold||st.coach||st.fixOpen||st.helping||st.drill)return;const now=performance.now(),g=sigOf();
 if(g!==st.sig){st.sig=g;st.progAt=now;st.stuckDone=false;if(st.helpI>=0)hideHelp();return}
 if(st.stuckDone||!ready&&!window.__reciteFake)return;
 if(now-st.progAt>=(window.__stuckMs||STUCK_MS)&&t-st.lastVoice>0.8&&!st.busy&&$('#rcSum').hidden)stuckHelp('auto')}
function hideHelp(){if(!st)return;st.hseq++;st.helping=false;st.helpI=-1;if(panel){$('#rcHelpCard').hidden=true;paint()}}
function helpTap(){if(!st)return;if(st.coach&&!st.coach.done){act('hear');return}if(st.drill||!$('#rcSum').hidden)return;stuckHelp('tap')}
async function stuckHelp(src){if(!st||st.coach||st.helping||st.T.cursor>=st.flat.length)return;const i=st.T.cursor,t=targetOf(i),my=++st.hseq;
 st.helping=true;st.stuckDone=true;st.helpI=i;if(st.mode==='memory'||st.mode==='test'){st.hint[i]=2;st.hintN++}hideNudge();if(!st.helpEvt){st.helpEvt=true;st.ctx.gc?.('feature-recite-stuck')}
 const card=$('#rcHelpCard');card.hidden=false;
 card.innerHTML=`<button class="rc-hx" id="hX" aria-label="Close">✕</button><div class="rc-hh">${src==='tap'?L('Here is the next word','اگلا لفظ یہ ہے'):L('Stuck? Here is the next word','اٹک گئے؟ اگلا لفظ یہ ہے')}</div><div class="ar rc-hw" dir="rtl" lang="ar">${esc(t.t)}</div>${t.tr?`<div class="rc-ft"><i>${esc(t.tr)}</i>${t.m?` · ${esc(t.m)}`:''}</div>`:''}<div class="rc-hs" id="hS" role="status" aria-live="polite"></div><div class="bar"><button class="btn" id="hHear">▶ ${L('Hear again','دوبارہ سنیں')}</button></div>`;
 $('#hX').onclick=()=>{hideHelp();pt++;try{pl().pause()}catch{/* ignore */}st.hold=false};$('#hHear').onclick=()=>{unlockAudio();st.helping=false;stuckHelp('tap')};
 const say=x=>{const e=panel&&$('#hS');if(e)e.textContent=x};
 paint();st.hold=true;pt++;try{pl().pause()}catch{/* ignore */}chip('hear',L('Playing the next word…','اگلا لفظ چل رہا ہے…'));say(L('Listen…','سنیں…'));
 const r=await playWord(t);if(!st||st.hseq!==my)return;
 if(r==='blocked')say(L('Tap ▶ to hear it, then say it.','سننے کے لیے ▶ دبائیں، پھر کہیں۔'));else say(L('Now say it — I am listening.','اب آپ کہیں — میں سن رہا ہوں۔'));
 if(!window.__reciteFake)await sleep(350);if(!st||st.hseq!==my)return;
 st.helping=false;st.hold=false;st.progAt=performance.now();if(st.listening)chip('listen',L('Listening — say the word','سن رہا ہے — لفظ کہیں'))}
// ---------- practice drill + end-of-session summary ----------
function drillNext(){const d=st.drill;if(!d)return;if(d.idx>=d.items.length){stopMic();showSummary(true);return}
 const e=d.items[d.idx++];$('.rc-ref').textContent=`${d.idx}/${d.items.length}`;
 coachStart({...e,nw:e.nw||norm(e.t),ph:e.ph||[],cn:e.cn||[],ci:e.ci||0,pi:e.pi||0},'drill')}
function endOrSummary(){if(!st||st.coach)return;if(st.drill){if(st.drill.idx>0)showSummary(false);return}if(Object.keys(st.flagged).length)showSummary(false)}
function sumExtra(d){if(d||!st.first)return '';let ok=0,n=0;for(const [k,v] of Object.entries(st.first)){n++;if(v==='ok'&&!st.hint[+k])ok++}if(!n)return '';const K=st.kinds||{},bits=[];
 if(K.skip)bits.push(L(`Skipped ${K.skip}`,`چھوٹے ${K.skip}`));if(K.wrong)bits.push(L(`Different word ${K.wrong}`,`دوسرا لفظ ${K.wrong}`));if(K.unclear)bits.push(L(`Not clear ${K.unclear}`,`غیر واضح ${K.unclear}`));
 let sk='';try{const S=PG.streak(st.P);if(S.cur>0)sk=`<span class="rc-str">🔥 ${L(`${S.cur}-day streak`,`${S.cur} دن کا سلسلہ`)}</span>`}catch{/* ignore */}
 const sc=st.mode==='memory'||st.mode==='test'?`<div class="rc-score"><b>${Math.round(100*ok/n)}%</b><span>${st.mode==='test'?L('Test score','آزمائش کا اسکور'):L('From memory','یاد سے')}${st.hintN?` · ${L(`${st.hintN} hints`,`${st.hintN} اشارے`)}`:''}</span></div>`:'';
 return `${sc}<div class="rc-types">${bits.join(' · ')}${bits.length&&sk?' · ':''}${sk}</div>`}
function showSummary(final){logNow();hideNudge();hideHelp();const box=$('#rcSum');box.hidden=false;$('#rcFix').hidden=true;const d=st.drill;
 const fl=Object.values(st.flagged).sort((a,b)=>(st.fixed[a.key]?1:0)-(st.fixed[b.key]?1:0)),list=d?d.items:fl,ok=Object.values(st.T.marks).filter(m=>m==='ok').length;
 const fixed=d?d.fixes:Object.keys(st.fixed).length,todo=d?d.items.filter(x=>!st.fixed[x.key]).length:fl.filter(x=>!st.fixed[x.key]).length;
 box.innerHTML=`<div class="rc-sh"><b>${d?L('Practice finished','مشق مکمل'):final?L('Surah complete 🎉','سورت مکمل 🎉'):L('Session summary','سیشن کا خلاصہ')}</b></div>
 ${sumExtra(d)}<div class="rc-stats">${d?'':`<span class="g"><b>${ok}</b>${L('correct','درست')}</span>`}<span class="g"><b>${fixed}</b>${L('fixed','درست کیے')}</span><span class="r"><b>${todo}</b>${L('to practice','مشق باقی')}</span></div>
 ${list.length?`<div class="rc-wl-h">${L('Words to practice','مشق کے الفاظ')}</div><div class="rc-wl">${list.map(x=>`<button class="rc-wi${st.fixed[x.key]?' fx':''}" data-k="${esc(x.key)}"><span class="ar" dir="rtl" lang="ar">${esc(x.t)}</span><small>${esc(x.m||x.tr||'')}</small><i>${st.fixed[x.key]?'✓':'•'}</i></button>`).join('')}</div>`:`<p class="rc-ft">${L('No mistakes — well recited!','کوئی غلطی نہیں — ماشاءاللہ!')}</p>`}
 <p class="rc-note muted">${list.length?L('Saved to your weak words. Review them any time from Home.','کمزور الفاظ میں محفوظ ہو گئے۔ ہوم سے کبھی بھی دہرائیں۔'):''}</p>
 <div class="bar rc-sb">${list.length?`<button class="btn" id="sAgain">${L('Practice again','دوبارہ مشق')}</button>`:''}${st.flat.length&&!final?`<button class="btn" id="sGo">${L('Keep reciting','جاری رکھیں')}</button>`:''}<button class="btn ghost" id="sX">${L('Close','بند')}</button></div>`;
 box.querySelectorAll('.rc-wi').forEach(b=>b.onclick=()=>{const x=list.find(y=>y.key===b.dataset.k);if(x){st.coach=null;playWord({...x,cn:x.cn||[],ci:x.ci||0})}});
 const again=$('#sAgain');if(again)again.onclick=async()=>{const items=list.slice().sort((a,b)=>(st.fixed[a.key]?1:0)-(st.fixed[b.key]?1:0));st.drill={items,idx:0,fixes:0,skips:0,review:!!d?.review};st.fixed={};box.hidden=true;$('#rcLine').hidden=true;
  if(!st.listening)await startMic();if(st.listening)drillNext()};
 const go=$('#sGo');if(go)go.onclick=()=>{box.hidden=true;st.drill=null;st.hold=false;st.cut=st.end;$('#rcLine').hidden=false;st.lineA=0;paint();startMic().then(()=>armStuck(1500))};
 $('#sX').onclick=close}
// ---------- practice modes, hints, tajweed colours, options, progress ----------
const MODES=[['follow','Follow','ساتھ پڑھیں','Text visible; words light up as you read.','متن نظر آتا ہے؛ پڑھتے ہی الفاظ روشن ہوتے ہیں۔'],
 ['memory','Memory','یادداشت','Text hidden. Recite from memory. Hint shows the first letter, then the word.','متن چھپا ہے۔ یاد سے پڑھیں۔ اشارہ پہلا حرف، پھر لفظ دکھاتا ہے۔'],
 ['test','Test me','آزمائش','Text hidden, no first-letter hints. You get a score at the end.','متن چھپا، کوئی اشارہ نہیں۔ آخر میں اسکور ملے گا۔'],
 ['lr','Listen & repeat','سنیں اور دہرائیں','Hear each ayah, then recite it. Moves ayah by ayah.','ہر آیت سنیں، پھر پڑھیں۔ آیت بہ آیت آگے بڑھتا ہے۔']];
const QINFO={auto:['Auto','خودکار','Picks Fast or Balanced for your phone.','آپ کے فون کے مطابق خود چنتا ہے۔'],fast:['Fast','تیز','Checks less often. Saves battery on older phones.','کم بار چیک کرتا ہے۔ پرانے فون کی بیٹری بچاتا ہے۔'],balanced:['Balanced','متوازن','Recommended.','تجویز کردہ۔'],accurate:['Accurate','درست','Checks more often and is stricter on look-alike words. Uses more battery.','زیادہ بار چیک کرتا ہے اور ملتے جلتے الفاظ پر سخت ہے۔ بیٹری زیادہ لگتی ہے۔']};
const hiddenMode=()=>!!st&&(st.mode==='memory'||st.mode==='test');
function revealed(i){if(!hiddenMode())return true;const T=st.T;return !!(T.marks[i]||T.prov[i]||i<T.p||st.hint[i]===2)}
function tjHtml(i){const x=st.flat[i],sg=st.tjOn&&st.tj&&st.tj[i];if(!sg)return esc(x.t);return sg.map(g=>g.r<0?esc(g.s):`<span class="tj" data-r="${g.r}" style="--tj:${TJ.colorOf(g.r)}">${esc(g.s)}</span>`).join('')}
function wordInner(i){const x=st.flat[i];if(revealed(i))return tjHtml(i);if(st.hint[i]===1)return `<span class="rc-hn">${esc(x.n[0]||'')}…</span>`;return `<span class="rc-ph">${'•'.repeat(Math.max(2,Math.min(6,x.n.length)))}</span>`}
const blindUI=()=>{document.body.classList.toggle('rc-blind',hiddenMode())};
async function loadTj(){const n=st.n;if(!n||st.ctx.review)return;try{const base=import.meta.env.BASE_URL||'/';
 const [ra,rt]=await Promise.all([fetch(`${base}offline/s/ar/${n}.json`).then(r=>r.json()),fetch(`${base}offline/tj/${n}.json`).then(r=>r.json())]);if(!st||st.n!==n)return;
 const by={};st.flat.forEach((x,i)=>(by[x.a]??=[]).push(i));const out={};
 for(const a of Object.keys(by)){const raw=ra[a-1],fl=rt[a-1];if(!raw||!fl||!fl.length)continue;const idx=by[a];const sg=TJ.align(raw,fl,idx.map(i=>st.flat[i].n),norm);if(sg)idx.forEach((i,k)=>{out[i]=sg[k]})}
 st.tj=out;st.lineA=0;paint()}catch{/* offline without the data: plain text */}}
function tjLegend(){const k=$('#rcTjk');if(!k)return;const cur=st.flat[Math.min(st.T.cursor,st.flat.length-1)];const has=st.tjOn&&st.tj&&cur&&!hiddenMode()&&st.flat.some((x,i)=>x.a===cur.a&&st.tj[i]&&st.tj[i].some(g=>g.r>=0));
 k.hidden=!has;if(!has){$('#rcTjc').hidden=true;return}k.innerHTML=TJ.legend(ur()).map(g=>`<span><i style="background:${g.color}"></i>${esc(g.name)}</span>`).join('')+`<small>${L('Tap a coloured letter','رنگین حرف دبائیں')}</small>`}
function tjTap(e){const t=e.target.closest('.tj');const c=$('#rcTjc');if(!t){c.hidden=true;return}const r=TJ.info(+t.dataset.r,ur());if(!r)return;
 c.hidden=false;c.innerHTML=`<i style="background:${r.color}"></i><div><b>${esc(r.name)}</b> <small>· ${esc(r.gname)}</small><p>${esc(r.text)}</p><small class="muted">${L('Colours show the standard rule; the tutor does not grade tajweed.','رنگ معیاری قاعدہ دکھاتے ہیں؛ ٹیوٹر تجوید کی جانچ نہیں کرتا۔')}</small></div>`}
function hintTap(){if(!st||!hiddenMode()||st.mode==='test')return;const i=st.T.cursor;if(i>=st.flat.length)return;st.hint[i]=Math.min(2,(st.hint[i]||0)+1);st.hintN++;buzz(10);paint()}
function setMode(m){PREF.mode=m;st.mode=m;st.lrA=0;st.lrTok=(st.lrTok||0)+1;pt++;try{pl().pause()}catch{/* ignore */}st.hold=false;st.lineA=0;modeUI();paint()}
function modeUI(){const h=$('#rcHint');h.hidden=st.mode!=='memory'&&st.mode!=='lr';h.textContent=st.mode==='lr'?'▶ '+L('Hear ayah','آیت سنیں'):'💡 '+L('Hint','اشارہ');
 $('#rcOptS').textContent=optSummary();blindUI();$('.rc-key').hidden=!!st.drill}
const optSummary=()=>{const m=MODES.find(x=>x[0]===st.mode);return `${L(m[1],m[2])} · ${st.n}:${st.rangeA}${st.rangeB>st.rangeA?'–'+st.rangeB:''}`};
function optsHtml(){const tot=st.ctx.txts.length,q=qPref(),eff=qLevel();
 const ao=(sel)=>{let h='';for(let k=1;k<=tot;k++)h+=`<option value="${k}"${k===sel?' selected':''}>${k}</option>`;return h};
 const rates=[0.75,1,1.25].map(r=>`<button class="rc-chp${st.rate===r?' on':''}" data-rate="${r}">${r}×</button>`).join('');
 return `<div class="rc-og"><b>${L('Practice mode','مشق کا انداز')}</b><div class="rc-mod">${MODES.map(m=>`<button class="rc-md${st.mode===m[0]?' on':''}" data-md="${m[0]}" aria-pressed="${st.mode===m[0]}"><b>${L(m[1],m[2])}</b><small>${L(m[3],m[4])}</small></button>`).join('')}</div></div>
 <div class="rc-og"><b>${L('Choose ayahs','آیات منتخب کریں')}</b><div class="rc-rg"><label>${L('From','از')}<select id="oFrom">${ao(st.rangeA)}</select></label><label>${L('To','تا')}<select id="oTo">${ao(st.rangeB)}</select></label><button class="btn" id="oGo">${L('Apply','لاگو')}</button></div></div>
 <div class="rc-og"><b>${L('Hear the model recitation','نمونہ تلاوت سنیں')}</b><div class="rc-rg"><span class="muted">${L('Speed','رفتار')}</span><div class="rc-sp">${rates}</div></div><div class="rc-abw ar" id="oAbw" dir="rtl" lang="ar"></div>
  <div class="bar"><button class="btn" id="abP">▶ ${L('Play','چلائیں')}</button><button class="btn" id="abL">⟲ ${L('Loop A–B','A–B دہرائیں')}</button><button class="btn ghost" id="abS">■</button></div><small class="muted" id="abH">${L('Tap a first word (A), then a last word (B). Loop repeats that part.','پہلا لفظ (A) پھر آخری لفظ (B) دبائیں۔ لوپ اسی حصے کو دہراتا ہے۔')}</small></div>
 <div class="rc-og"><b>${L('Quality','معیار')}</b><div class="rc-sp">${['auto','fast','balanced','accurate'].map(k=>`<button class="rc-chp${q===k?' on':''}" data-q="${k}">${L(QINFO[k][0],QINFO[k][1])}</button>`).join('')}</div><small class="muted">${L(QINFO[q][2],QINFO[q][3])}${q==='auto'?' '+L(`Now: ${QINFO[eff][0]}.`,`ابھی: ${QINFO[eff][1]}۔`):''}</small></div>
 <div class="rc-og"><div class="rc-sp"><button class="rc-chp${st.tjOn?' on':''}" id="oTj">${L('Tajweed colours','تجوید کے رنگ')}</button><button class="rc-chp${localStorage.getItem('qsHaptic')!=='0'?' on':''}" id="oHap">${L('Vibration','وائبریشن')}</button><button class="rc-chp" id="oTips">${L('Tips','مشورے')}</button><a class="rc-chp" href="#/progress" id="oProg">${L('My progress','میری پیش رفت')}</a></div></div>`}
function wireExtras(){const o=$('#rcOpt');st.tjOn=localStorage.getItem('qsTj')!=='0';st.abSel=[null,null];
 if(!st.autoQ){st.autoQ=(navigator.deviceMemory||8)<=2?'fast':'balanced';navigator.getBattery?.().then(b=>{if(st&&!b.charging&&b.level<0.2&&qPref()==='auto'){st.autoQ='fast';st.T.cfg=Q().gop}}).catch(()=>{})}
 document.addEventListener('visibilitychange',onVis);
 $('#rcOptB').onclick=()=>{const open=o.hidden;o.hidden=!open;$('#rcOptB').setAttribute('aria-expanded',open);if(open){o.innerHTML=optsHtml();abWords()}};
 o.onclick=e=>{const b=e.target.closest('button,a');if(!b)return;
  if(b.dataset.md){setMode(b.dataset.md);o.innerHTML=optsHtml();abWords();return}
  if(b.dataset.rate){st.rate=+b.dataset.rate;localStorage.setItem('qsRate',st.rate);o.innerHTML=optsHtml();abWords();return}
  if(b.dataset.q){localStorage.setItem('qsQuality',b.dataset.q);st.T.cfg=Q().gop;o.innerHTML=optsHtml();abWords();return}
  if(b.id==='oTj'){st.tjOn=!st.tjOn;localStorage.setItem('qsTj',st.tjOn?'1':'0');st.lineA=0;o.innerHTML=optsHtml();abWords();paint();return}
  if(b.id==='oHap'){localStorage.setItem('qsHaptic',localStorage.getItem('qsHaptic')==='0'?'1':'0');buzz(15);o.innerHTML=optsHtml();abWords();return}
  if(b.id==='oTips'){onbShow();o.hidden=true;$('#rcOptB').setAttribute('aria-expanded','false');return}
  if(b.id==='oProg'){close();return}
  if(b.id==='oGo'){let f=+$('#oFrom').value,t=+$('#oTo').value;if(t<f)[f,t]=[t,f];const {n,ctx}=st;PREF.mode=st.mode;open(n,f,{...ctx,to:t});return}
  if(b.dataset.j!==undefined){abPick(+b.dataset.j);return}
  if(b.id==='abP')abPlay(false);else if(b.id==='abL')abPlay(true);else if(b.id==='abS')abStop()};
 $('#rcLine').onclick=tjTap;$('#rcHint').onclick=()=>{unlockAudio();if(st.mode==='lr'){st.lrA=0;lrPlay(true)}else hintTap()};
 modeUI();loadTj();if(rcOnbOn())onbShow()}
function onVis(){if(document.hidden&&st&&st.listening){stopMic();chip('info',L('Paused while the app was in the background — tap the mic to continue.','ایپ پس منظر میں گئی تو رک گیا — جاری رکھنے کے لیے مائیک دبائیں۔'))}}
function onbShow(){const el=$('#rcOnb');el.hidden=false;
 el.innerHTML=`<b>${L('Before you start','شروع کرنے سے پہلے')}</b><ol><li>${L('Use a quiet room. Hold the phone about a hand’s length from your mouth.','پرسکون جگہ چنیں۔ فون کو منہ سے ایک بالشت کے فاصلے پر رکھیں۔')}</li><li>${L('Tap the mic and allow microphone access. If you chose “Don’t Allow” on iPhone: aA › Website Settings › Microphone, or Settings › Safari › Microphone.','مائیک دبائیں اور اجازت دیں۔ اگر آئی فون پر “Don’t Allow” چنا تھا: aA › Website Settings › Microphone، یا Settings › Safari › Microphone۔')}</li><li>${L('Recite at a steady pace. Words turn green; a red word opens a short lesson with the correct audio.','یکساں رفتار سے پڑھیں۔ الفاظ سبز ہوتے ہیں؛ سرخ لفظ پر درست آواز کے ساتھ مختصر سبق کھلتا ہے۔')}</li><li>${L('Your voice stays on your phone. This checks which words you said, not full tajweed — a teacher is still best for that.','آپ کی آواز فون پر ہی رہتی ہے۔ یہ الفاظ چیک کرتا ہے، مکمل تجوید نہیں — اس کے لیے استاد بہتر ہے۔')}</li></ol><button class="btn" id="onbOk">${L('Got it','سمجھ گیا')}</button>`;
 $('#onbOk').onclick=()=>{localStorage.setItem('qsRcOnb','1');el.hidden=true}}
// listen-then-repeat: play the ayah, then listen for the recitation
async function lrPlay(force){if(!st||st.coach||st.drill||st.mode!=='lr'||!st.flat.length)return;const i=Math.min(st.T.cursor,st.flat.length-1),a=st.flat[i].a;if(!force&&st.lrA===a)return;st.lrA=a;const my=st.lrTok=(st.lrTok||0)+1;
 st.hold=true;pt++;try{pl().pause()}catch{/* ignore */}hideNudge();chip('hear',L(`Listen — ayah ${a}`,`سنیں — آیت ${a}`));
 const u=await st.ctx.ayahUrl?.(a,st.n);let r='error';if(u||window.__reciteFake)r=await playPart(u,{tag:'ayah',rate:st.rate});
 if(!st||st.lrTok!==my||st.coach)return;
 st.hold=false;st.cut=st.end;st.gen++;armStuck(1500);
 if(r==='error'||r==='blocked')chip('warn',L('Could not play the audio — recite from the text.','آواز نہیں چل سکی — متن سے پڑھیں۔'));else if(st.listening)chip('listen',L('Now you recite','اب آپ پڑھیں'))}
// model audio: play an ayah or loop a part (A–B) at a chosen speed
function abAyah(){const c=st.flat[Math.min(st.T.cursor,st.flat.length-1)];return c?c.a:st.rangeA}
function abWords(){const el=panel&&panel.querySelector('#oAbw');if(!el)return;const a=abAyah(),sel=st.abSel;
 el.innerHTML=st.flat.map((x,i)=>[x,i]).filter(([x])=>x.a===a).map(([x,i])=>{const lo=sel[0],hi=sel[1]??sel[0],on=lo!=null&&i>=Math.min(lo,hi)&&i<=Math.max(lo,hi);return `<button class="rc-abx${on?' on':''}" data-j="${i}">${esc(x.t)}</button>`}).join(' ')}
function abPick(i){const s=st.abSel;if(s[0]==null||s[1]!=null){st.abSel=[i,null]}else st.abSel=[Math.min(s[0],i),Math.max(s[0],i)];abWords()}
function abStop(){if(!st)return;st.abTok=(st.abTok||0)+1;pt++;try{pl().pause()}catch{/* ignore */}const h=$('#abH');if(h)h.textContent=''}
async function abPlay(loop){if(!st)return;unlockAudio();if(st.listening){stopMic();endOrSummary()}abStop();const my=st.abTok;const a=abAyah(),ids=st.flat.map((x,i)=>i).filter(i=>st.flat[i].a===a);
 const sel=st.abSel,lo=sel[0]!=null?ids.indexOf(Math.min(sel[0],sel[1]??sel[0])):0,hi=sel[0]!=null?ids.indexOf(Math.max(sel[0],sel[1]??sel[0])):ids.length-1;
 const u=await st.ctx.ayahUrl?.(a,st.n);if(!st||st.abTok!==my)return;const h=$('#abH');if(!u&&!window.__reciteFake){if(h)h.textContent=L('Audio is not available right now.','آواز ابھی دستیاب نہیں۔');return}
 const whole=lo<=0&&hi>=ids.length-1,cn=ids.map(i=>st.flat[i].n.length);
 for(let k=0;k<(loop?30:1);k++){if(h)h.textContent=loop?L(`Loop ${k+1}`,`دہرائی ${k+1}`):L('Playing…','چل رہا ہے…');
  const r=await playPart(u,{tag:'ab',rate:st.rate,slice:whole?null:{cn,i0:Math.max(0,lo),i1:Math.max(0,hi),pad:0.12}});if(!st||st.abTok!==my||r==='cancel'||r==='blocked'||r==='error'){if(r==='blocked'&&h)h.textContent=L('Tap ▶ again to allow sound.','آواز کے لیے دوبارہ ▶ دبائیں۔');return}
  if(loop)await sleep(window.__reciteFake?0:350)}
 if(h)h.textContent=''}
function autoQ(ms){if(!st||qPref()!=='auto')return;st.msAvg=st.msAvg?st.msAvg*0.8+ms*0.2:ms;st.nRun++;if(st.nRun>=4&&st.msAvg>200&&st.autoQ!=='fast'){st.autoQ='fast';st.T.cfg=Q().gop}}
/** Save this session's first-attempt results (words fixed after a coaching lesson still count as first-attempt misses). */
function logNow(){if(!st||st.drill||st.ctx.review||!st.first)return;let ok=0,bad=0,unc=0;const seen=[];
 for(const [k,v] of Object.entries(st.first)){const i=+k;if(v==='ok'&&!st.hint[i])ok++;else if(v==='bad')bad++;else unc++;if(!st.seen?.[i]&&(v==='ok'||v==='bad')){(st.seen??={})[i]=1;seen.push(st.flat[i].n)}}
 const d={ok:ok-st.snap.ok,bad:bad-st.snap.bad,unc:unc-st.snap.unc};if(d.ok+d.bad+d.unc<3)return;st.snap={ok,bad,unc};
 try{PG.logSession(st.P,{ts:Date.now(),sn:st.n,from:st.rangeA,to:st.rangeB,mode:st.mode,...d,hints:st.hintN,sec:(Date.now()-st.t0)/1000});PG.addSeen(st.P,seen);PG.save(st.P);st.hintN=0;st.t0=Date.now()}catch{/* ignore */}}
// test hooks (automation only)
if(navigator.webdriver){
 window.__recite={feed:(text,reps=3)=>{const w=text.split(/\s+/).map(norm).filter(Boolean);for(let r=0;r<reps;r++){const b=Math.max(0,st.T.lockedEnd)+0.1;step(w.map((x,i)=>({w:x,t0:b+i*0.4,t1:b+i*0.4+0.3})),b+w.length*0.4)}},say:(text,ended=true)=>coachEval(text.split(/\s+/).map(norm).filter(Boolean),ended),skip:()=>coachSkip(),state:()=>st&&{p:st.T.p,cursor:st.T.cursor,marks:{...st.T.marks},prov:{...st.T.prov},coach:st.coach&&{kind:st.coach.kind,key:st.coach.t.key,esc:st.coach.esc,pron:!!st.coach.pron,tries:st.coach.tries,done:st.coach.done,word:st.coach.t.t},miss:{...st.miss},mode:st.mode,hint:{...st.hint},first:{...st.first},tj:st.tj&&Object.keys(st.tj).length,tjN:st.n,tjCov:st.tj&&(()=>{const by={};st.flat.forEach((x,i)=>(by[x.a]??=[]).push(i));let cov=0;const miss=[];for(const a of Object.keys(by)){if(by[a].every(i=>st.tj[i]))cov+=by[a].length;else miss.push(a)}return{words:st.flat.length,cov,ay:miss.length,miss}})(),hold:st.hold,helping:st.helping,stuckDone:st.stuckDone,helpI:st.helpI,drill:st.drill&&{idx:st.drill.idx,n:st.drill.items.length,fixes:st.drill.fixes,skips:st.drill.skips}}};
 // feed 16 kHz audio through the real ingest/decode path in real time (no microphone needed)
 window.__reciteStream=(a,speed=1)=>new Promise(res=>{st.listening=true;micUI();const step=Math.round(SR*0.04);let i=0;const iv=setInterval(()=>{if(!st){clearInterval(iv);return res()}ingest(Float32Array.from(a.subarray(i,i+step)));i+=step;if(i>=a.length){ingest(new Float32Array(step));if(st.end/SR>a.length/SR+2.6){clearInterval(iv);res()}}},40/speed)});
}
