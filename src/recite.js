// "Recite & Learn" live tutor. Lazy-loaded only when opened.
// A small speech model runs on-device in a Web Worker and is re-run every ~250 ms on the last few seconds of audio;
// the tracker (recite-live.js) highlights each expected word the moment it is heard. Audio never leaves the phone.
import {norm} from './recite-core.js';
import {Tracker} from './recite-live.js';
import {esc} from './lib.js';
import * as I from './icons.js';
import {weakKey,weakLoad,weakSave,recMiss,recFix,recReviewFail,attempt,syllables,syllWeights,syllAt,estimateSlice,letters,ENCOURAGE,ESCALATE_AT} from './coach.js';
import {TIPS,SHADDA_TIP,PLAIN_TIP,hardOf,trickyIn,hasShadda} from './tajweed.js';
const SILENT='data:audio/wav;base64,UklGRrQBAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YZABAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA';
const MODEL_BASE='https://kapadia100.github.io/noor-quran-app/models/',MB=19;
const SR=16000,HOP_MS=250,MAXWIN=10,FLAT_MAX=400;
let worker=null,ready=false,panel=null,st=null;
const $=s=>panel.querySelector(s);
const ur=()=>document.documentElement.lang==='ur';
const L=(en,u)=>ur()?u:en;
function getWorker(){if(!worker){worker=new Worker((import.meta.env.BASE_URL||'/')+'recite-worker.js',{type:'module'});worker.onmessage=onMsg}return worker}
function onMsg(e){const m=e.data;
 if(m.type==='progress'&&st){const p=m.total?Math.min(99,Math.round(100*m.loaded/m.total)):0;$('#rcBar').style.width=p+'%';chip('load',L(`Downloading tutor… ${p}%`,`ٹیوٹر ڈاؤن لوڈ ہو رہا ہے… ${p}%`))}
 if(m.type==='ready'){ready=true;localStorage.setItem('qsCtc','1');if(st){$('#rcDl').hidden=true;$('#rcBar').parentNode.hidden=true;$('#rcMic').disabled=false;chip('ready',readyMsg())}}
 if(m.type==='error'){window.__reciteErr=m.message;if(st){if(!ready){$('#rcDl').disabled=false;$('#rcDl').hidden=false;$('#rcBar').parentNode.hidden=true}chip('warn',L('Could not load the tutor. Check your connection and try again.','ٹیوٹر لوڈ نہیں ہو سکا۔ انٹرنیٹ چیک کریں۔'))}}
 if(m.type==='run'&&st){st.busy=false;const job=st.job;st.job=null;st.decMs=st.decMs?st.decMs*0.7+m.ms*0.3:m.ms;if(job&&job.gen===st.gen)result(job,m.words,m.ms)}}
const readyMsg=()=>st?.drill?L('Ready — tap the mic. You will hear each word, then repeat it.','تیار — مائیک دبائیں۔ ہر لفظ سنیں، پھر دہرائیں۔'):L('Ready — tap the mic and recite','تیار — مائیک دبائیں اور پڑھیں');
function chip(kind,text){if(!panel)return;const c=$('#rcChip');c.className='rc-chip '+kind;c.querySelector('span').textContent=text}

/** Spaced-repetition review of saved weak words (items from the weak store). */
export function review(items,ctx){if(ctx.gc)ctx.gc('feature-recite-review');open(0,1,{...ctx,txts:[],review:items})}

/** Open the panel for surah n starting at ayah a. ctx: {words, txts, ayahUrl(a), event} */
export function open(n,a,ctx){close();st={n,ctx,flat:[],gen:1,idc:0,chunks:[],end:0,cut:0,lastVoice:-9,floor:0.004,lvl:0,busy:false,listening:false,hold:false,sent:0,lineA:0,miss:{},coach:null,queue:[],flagged:{},fixed:{},skipped:{},weak:weakLoad(),player:null,coachEvt:false,pronEvt:false,helpEvt:false,helping:false,hseq:0,progAt:0,sig:'',stuckDone:false,helpI:-1,drill:ctx.review?{items:ctx.review,idx:0,fixes:0,skips:0,review:true}:null,nudge:0};
 for(let i=a;!ctx.review&&i<=ctx.txts.length&&st.flat.length<FLAT_MAX;i++){const w=ctx.words?.[i];const list=w?w.map(x=>({t:x.t,tr:x.tr,m:x.m,au:x.au})):ctx.txts[i-1].split(/\s+/).filter(x=>norm(x)).map(t=>({t}));
  list.forEach((x,k)=>st.flat.push({...x,a:i,k,n:norm(x.t)}))}
 st.flat=st.flat.filter(x=>x.n);st.T=new Tracker(st.flat.map(x=>x.n));
 panel=document.createElement('section');panel.id='recite';panel.className='recite';panel.setAttribute('aria-label','Recite and Learn');
 panel.innerHTML=`<div class="rc-h"><span class="rc-ic">${I.icon('tutor')}</span><div class="rc-t"><b>${L('Recite & Learn','تلاوت اور سیکھیں')}</b><small>${L('Live tutor','لائیو ٹیوٹر')} · <span class="rc-ref"></span></small></div><button class="rc-x" aria-label="Close">✕</button></div>
 <div class="rc-line ar" dir="rtl" lang="ar" id="rcLine"></div>
 <div class="rc-nudge" id="rcNudge" hidden></div>
 <div class="rc-help" id="rcHelpCard" hidden></div>
 <div class="rc-fix" id="rcFix" hidden></div>
 <div class="rc-sum" id="rcSum" hidden></div>
 <div class="rc-prog" hidden><div id="rcBar"></div></div>
 <div class="rc-chip" id="rcChip"><i></i><span></span></div>
 <div class="rc-lv" aria-hidden="true"><i id="rcLv"></i></div>
 <div class="rc-key"><span class="k-ok">${L('Correct','درست')}</span><span class="k-unc">${L('Unclear','غیر واضح')}</span><span class="k-bad">${L('Check','دیکھیں')}</span></div>
 <div class="bar rc-ctl"><button class="btn" id="rcDl" hidden>${L(`Download tutor (~${MB} MB, once)`,`ٹیوٹر ڈاؤن لوڈ کریں (~${MB} MB، ایک بار)`)}</button><button class="rc-mic" id="rcMic" disabled aria-label="Microphone">${I.icon('mic')}<span>${L('Start','شروع')}</span></button><button class="btn rc-hb" id="rcHelp" aria-label="${L('Help, I am stuck','مدد، میں اٹک گیا')}">❓ ${L('Help · I’m stuck','مدد · اٹک گیا')}</button></div>
 <p class="rc-note muted">${L('Checks your words as you recite, not full tajweed. Your voice stays on your phone.','یہ الفاظ چیک کرتا ہے، مکمل تجوید نہیں۔ آپ کی آواز فون سے باہر نہیں جاتی۔')}</p>`;
 document.body.append(panel);$('.rc-x').onclick=close;paint();
 $('#rcHelp').onclick=()=>{unlockAudio();helpTap()};
$('#rcMic').onclick=async()=>{if(st.listening){stopMic();endOrSummary();return}await startMic();if(!st||!st.listening)return;if(st.coach&&!st.coach.done)listen();else if(st.drill)drillNext()};
 if(st.drill){$('#rcLine').hidden=true;$('.rc-ref').textContent=L('Review','دہرائی');$('.rc-key').hidden=true}
 $('#rcDl').onclick=()=>{$('#rcDl').disabled=true;$('#rcBar').parentNode.hidden=false;load()};
 st.timer=setInterval(tick,100);
 if(window.__reciteFake){ready=true;$('#rcMic').disabled=false;chip('ready','Ready');return}
 if(ready){$('#rcMic').disabled=false;chip('ready',readyMsg())}
 else if(localStorage.getItem('qsCtc')){$('#rcBar').parentNode.hidden=false;chip('load',L('Preparing tutor…','ٹیوٹر تیار ہو رہا ہے…'));load()}
 else{$('#rcDl').hidden=false;chip('info',L('First use downloads a small tutor once. After that it works from your phone.','پہلی بار ایک چھوٹا ٹیوٹر ڈاؤن لوڈ ہوگا، پھر یہ فون پر ہی چلے گا۔'))}}
function load(){getWorker().postMessage({type:'load',base:localStorage.getItem('qsAsrBase')||MODEL_BASE})}
export function close(){if(!st)return;pt++;try{st.player?.pause()}catch{/* ignore */}stopMic();clearInterval(st.timer);clearTimeout(st.nudge);clearTimeout(st.coach?.to);st.hseq++;panel?.remove();panel=null;st=null;document.querySelectorAll('.ayah.reciting').forEach(e=>e.classList.remove('reciting'))}

// ---------- word line ----------
function wordClass(i){const T=st.T,m=T.marks[i];if(m)return 'rc-'+m+(st.fx?.[i]?' rc-fx':'');if(T.prov[i])return 'rc-live';return ''}
function paint(){if(!st||!panel||st.drill)return;const T=st.T,fl=st.flat;const ci=st.listening?Math.min(T.cursor,fl.length-1):T.p;const cur=fl[ci];
 if(!cur){$('#rcLine').innerHTML=`<span class="rc-done">✓ ${L('Surah complete','سورت مکمل')}</span>`;return}
 if(st.lineA!==cur.a){st.lineA=cur.a;$('.rc-ref').textContent=`${st.n}:${cur.a}`;
  $('#rcLine').innerHTML=fl.map((x,i)=>[x,i]).filter(([x])=>x.a===cur.a).map(([x,i])=>`<span class="rc-w" data-i="${i}">${esc(x.t)}</span>`).join(' ');
  document.querySelectorAll('.ayah.reciting').forEach(e=>e.classList.remove('reciting'));const el=document.getElementById('a'+cur.a);if(el){el.classList.add('reciting');el.scrollIntoView({block:'center',behavior:'smooth'})}}
 for(const s of panel.querySelectorAll('.rc-w')){const i=+s.dataset.i;const c=wordClass(i)+(i===ci&&!T.marks[i]&&!T.prov[i]?' rc-cur':'')+(i===st.helpI?' rc-hl':'');if(s.dataset.c!==c){s.dataset.c=c;s.className='rc-w '+c}}}

// ---------- microphone ----------
async function startMic(){if(st.listening)return;st.ctx.event?.();unlockAudio();
 if(window.__reciteFake){st.listening=true;armStuck(window.__stuckFirst??1500);micUI();return}
 let stream;try{stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true,channelCount:1}})}
 catch{chip('warn',L('Microphone permission is needed. On iPhone: Settings › Safari › Microphone (or allow when asked).','مائیک کی اجازت درکار ہے۔'));return}
 const AC=window.AudioContext||window.webkitAudioContext;const ac=new AC();await ac.resume().catch(()=>{});
 const src=ac.createMediaStreamSource(stream),proc=ac.createScriptProcessor(2048,1,1);const ratio=ac.sampleRate/SR;
 st.mic={stream,ac,src,proc};
 proc.onaudioprocess=e=>{if(!st||!st.listening)return;const x=e.inputBuffer.getChannelData(0);const n=Math.floor(x.length/ratio),o=new Float32Array(n),w=Math.max(1,Math.round(ratio));
  for(let i=0;i<n;i++){const p=Math.floor(i*ratio);let s=0,c=0;for(let k=0;k<w&&p+k<x.length;k++){s+=x[p+k];c++}o[i]=c?s/c:0}ingest(o)};
 src.connect(proc);proc.connect(ac.destination);st.listening=true;armStuck(1500);micUI()}
function stopMic(){if(!st)return;if(st.mic){try{st.mic.proc.disconnect();st.mic.src.disconnect();st.mic.stream.getTracks().forEach(t=>t.stop());st.mic.ac.close()}catch{/* ignore */}st.mic=null}
 st.listening=false;st.lvl=0;if(panel){micUI();paint()}}
function micUI(){const b=$('#rcMic');b.classList.toggle('on',st.listening);b.querySelector('span').textContent=st.listening?L('Stop','روکیں'):L('Start','شروع');b.setAttribute('aria-pressed',st.listening);
 if(st.listening)chip('listen',L('Listening — start reciting','سن رہا ہے — پڑھنا شروع کریں'));else if(ready)chip('ready',L('Paused — tap the mic to continue','رکا ہوا — جاری رکھنے کے لیے مائیک دبائیں'));paint()}
/** Append 16 kHz mono samples; track level + voice activity; keep only the audio the tracker can still need. */
function ingest(o){if(st.hold)return;let e=0;for(let i=0;i<o.length;i++)e+=o[i]*o[i];const rms=Math.sqrt(e/o.length);const thr=Math.max(0.01,st.floor*2.5);
 st.chunks.push({s:st.end,a:o});st.end+=o.length;const t=st.end/SR;
 if(rms>thr){st.lastVoice=t;if(st.coach)st.coach.voiced=true}else st.floor=st.floor*0.97+rms*0.03;
 st.lvl=Math.max(Math.min(1,rms*9),st.lvl*0.8);
 const keep=Math.min(st.T.winStart,t-MAXWIN,st.cut/SR)-1;while(st.chunks.length>1&&(st.chunks[0].s+st.chunks[0].a.length)/SR<keep)st.chunks.shift()}
function slice(t0,t1){const s0=Math.max(0,Math.floor(t0*SR)),s1=Math.min(st.end,Math.floor(t1*SR));if(s1<=s0)return new Float32Array(0);const out=new Float32Array(s1-s0);
 for(const c of st.chunks){const a=Math.max(c.s,s0),b=Math.min(c.s+c.a.length,s1);if(b>a)out.set(c.a.subarray(a-c.s,b-c.s),a-s0)}return out}
function tick(){if(!st||!panel)return;const t=st.end/SR;
 // level meter + state chip
 const lv=st.listening?st.lvl:0;$('#rcLv').style.transform=`scaleX(${lv.toFixed(3)})`;$('#rcMic').style.setProperty('--lv',lv.toFixed(3));st.lvl*=0.85;
 if(st.listening&&!st.hold&&!st.fixOpen){const hearing=t-st.lastVoice<0.5;if(hearing!==st.hearing){st.hearing=hearing;chip(hearing?'hear':'listen',hearing?L('Hearing you…','آپ کو سن رہا ہے…'):L('Listening — start reciting','سن رہا ہے — پڑھنا شروع کریں'))}}
 stuckTick(t);
 if(!st.listening||st.busy||st.hold||!ready||window.__reciteFake)return;
 const now=performance.now();if(now-st.sent<HOP_MS)return;if(t-st.lastVoice>2.2)return; // nothing new to hear
 const s0=Math.max(st.T.winStart,st.cut/SR,t-MAXWIN);if(t-s0<0.5)return;
 const audio=slice(s0,t);st.sent=now;st.busy=true;const job={id:++st.idc,gen:st.gen,off:s0,t,at:now};st.job=job;getWorker().postMessage({type:'run',id:job.id,audio},[audio.buffer])}

// ---------- tracking ----------
function result(job,ws,ms){const H=ws.map(x=>({w:norm(x.s),t0:job.off+x.t0,t1:job.off+x.t1})).filter(x=>x.w);
 if(st.coach){coachEval(H.map(x=>x.w),job.t-st.lastVoice>=0.7&&st.coach.voiced);return}
 if(navigator.webdriver)(window.__rlog??=[]).push({t:Math.round(performance.now()),aud:job.t,ms,h:H.map(x=>x.w).join(' ')});
 step(H,job.t)}
function step(H,t){const before=new Set(Object.keys(st.T.prov));const ev=st.T.update(H,t);
 if(navigator.webdriver)for(const k of Object.keys(st.T.prov))if(!before.has(k))(window.__rgreen??=[]).push({i:+k,wall:Math.round(performance.now()),aud:t});
 for(const e of ev){if(e.st==='bad')flag(e.i,e.kind);else if(e.st==='unc'&&!st.coach)nudge(e.i)}
 paint();
 if(st.T.p>=st.flat.length&&!st.coach&&!st.queue.length){chip('ok',L('Surah complete ✓','سورت مکمل ✓'));stopMic();paint();showSummary(true)}}
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
function flag(i,kind){const t=targetOf(i);st.flagged[t.key]=t;st.miss[t.key]=(st.miss[t.key]||0)+1;recMiss(st.weak,t);weakSave(st.weak);
 if(st.coach)st.queue.push({t,kind});else coachStart(t,'bad',kind)}
function nudge(i){const t=targetOf(i),el=$('#rcNudge');el.hidden=false;
 el.innerHTML=`<span class="ar" dir="rtl" lang="ar">${esc(t.t)}</span><span>${L('Not clear — say it again?','واضح نہیں — دوبارہ کہیں؟')}</span><button class="btn" id="nRep">${L('Repeat','دہرائیں')}</button>`;
 $('#nRep').onclick=()=>coachStart(t,'unc');clearTimeout(st.nudge);st.nudge=setTimeout(hideNudge,7000)}
function hideNudge(){clearTimeout(st?.nudge);if(panel)$('#rcNudge').hidden=true}
function setSay(text,cls=''){const e=panel&&$('#rcSay');if(e){e.textContent=text;e.className='rc-say '+cls}}
function coachStart(t,kind,why){st.gen++;st.hold=true;st.fixOpen=true;hideNudge();hideHelp();$('#rcSum').hidden=true;
 const c=st.coach={t,kind,why,tries:0,esc:false,voiced:false,seq:0,done:false,sy:syllables(t.t)};c.sw=syllWeights(c.sy);
 if(!st.coachEvt){st.coachEvt=true;st.ctx.gc?.('feature-recite-coach')}
 const box=$('#rcFix');box.hidden=false;box.className='rc-fix rc-coach'+(kind==='unc'?' soft':'');
 const head=kind==='bad'?(why==='skip'?L('Missed word','چھوٹا ہوا لفظ'):L('Let’s fix this word','آئیں اس لفظ کو درست کریں')):kind==='unc'?L('Say it once more','ایک بار پھر کہیں'):L('Practice','مشق');
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
 weakSave(st.weak);setSay(L('✓ Well done!','✓ شاباش!'),'win');$('#rcFix').classList.add('win');chip('ok',L('Correct','درست'));paint();
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
 st.helping=true;st.stuckDone=true;st.helpI=i;hideNudge();if(!st.helpEvt){st.helpEvt=true;st.ctx.gc?.('feature-recite-stuck')}
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
function showSummary(final){hideNudge();hideHelp();const box=$('#rcSum');box.hidden=false;$('#rcFix').hidden=true;const d=st.drill;
 const fl=Object.values(st.flagged).sort((a,b)=>(st.fixed[a.key]?1:0)-(st.fixed[b.key]?1:0)),list=d?d.items:fl,ok=Object.values(st.T.marks).filter(m=>m==='ok').length;
 const fixed=d?d.fixes:Object.keys(st.fixed).length,todo=d?d.items.filter(x=>!st.fixed[x.key]).length:fl.filter(x=>!st.fixed[x.key]).length;
 box.innerHTML=`<div class="rc-sh"><b>${d?L('Practice finished','مشق مکمل'):final?L('Surah complete 🎉','سورت مکمل 🎉'):L('Session summary','سیشن کا خلاصہ')}</b></div>
 <div class="rc-stats">${d?'':`<span class="g"><b>${ok}</b>${L('correct','درست')}</span>`}<span class="g"><b>${fixed}</b>${L('fixed','درست کیے')}</span><span class="r"><b>${todo}</b>${L('to practice','مشق باقی')}</span></div>
 ${list.length?`<div class="rc-wl-h">${L('Words to practice','مشق کے الفاظ')}</div><div class="rc-wl">${list.map(x=>`<button class="rc-wi${st.fixed[x.key]?' fx':''}" data-k="${esc(x.key)}"><span class="ar" dir="rtl" lang="ar">${esc(x.t)}</span><small>${esc(x.m||x.tr||'')}</small><i>${st.fixed[x.key]?'✓':'•'}</i></button>`).join('')}</div>`:`<p class="rc-ft">${L('No mistakes — well recited!','کوئی غلطی نہیں — ماشاءاللہ!')}</p>`}
 <p class="rc-note muted">${list.length?L('Saved to your weak words. Review them any time from Home.','کمزور الفاظ میں محفوظ ہو گئے۔ ہوم سے کبھی بھی دہرائیں۔'):''}</p>
 <div class="bar rc-sb">${list.length?`<button class="btn" id="sAgain">${L('Practice again','دوبارہ مشق')}</button>`:''}${st.flat.length&&!final?`<button class="btn" id="sGo">${L('Keep reciting','جاری رکھیں')}</button>`:''}<button class="btn ghost" id="sX">${L('Close','بند')}</button></div>`;
 box.querySelectorAll('.rc-wi').forEach(b=>b.onclick=()=>{const x=list.find(y=>y.key===b.dataset.k);if(x){st.coach=null;playWord({...x,cn:x.cn||[],ci:x.ci||0})}});
 const again=$('#sAgain');if(again)again.onclick=async()=>{const items=list.slice().sort((a,b)=>(st.fixed[a.key]?1:0)-(st.fixed[b.key]?1:0));st.drill={items,idx:0,fixes:0,skips:0,review:!!d?.review};st.fixed={};box.hidden=true;$('#rcLine').hidden=true;
  if(!st.listening)await startMic();if(st.listening)drillNext()};
 const go=$('#sGo');if(go)go.onclick=()=>{box.hidden=true;st.drill=null;st.hold=false;st.cut=st.end;$('#rcLine').hidden=false;st.lineA=0;paint();startMic().then(()=>armStuck(1500))};
 $('#sX').onclick=close}
// test hooks (automation only)
if(navigator.webdriver){
 window.__recite={feed:(text,reps=3)=>{const w=text.split(/\s+/).map(norm).filter(Boolean);for(let r=0;r<reps;r++){const b=Math.max(0,st.T.lockedEnd)+0.1;step(w.map((x,i)=>({w:x,t0:b+i*0.4,t1:b+i*0.4+0.3})),b+w.length*0.4)}},say:(text,ended=true)=>coachEval(text.split(/\s+/).map(norm).filter(Boolean),ended),skip:()=>coachSkip(),state:()=>st&&{p:st.T.p,cursor:st.T.cursor,marks:{...st.T.marks},prov:{...st.T.prov},coach:st.coach&&{kind:st.coach.kind,key:st.coach.t.key,esc:st.coach.esc,pron:!!st.coach.pron,tries:st.coach.tries,done:st.coach.done,word:st.coach.t.t},miss:{...st.miss},hold:st.hold,helping:st.helping,stuckDone:st.stuckDone,helpI:st.helpI,drill:st.drill&&{idx:st.drill.idx,n:st.drill.items.length,fixes:st.drill.fixes,skips:st.drill.skips}}};
 // feed 16 kHz audio through the real ingest/decode path in real time (no microphone needed)
 window.__reciteStream=(a,speed=1)=>new Promise(res=>{st.listening=true;micUI();const step=Math.round(SR*0.04);let i=0;const iv=setInterval(()=>{if(!st){clearInterval(iv);return res()}ingest(Float32Array.from(a.subarray(i,i+step)));i+=step;if(i>=a.length){ingest(new Float32Array(step));if(st.end/SR>a.length/SR+2.6){clearInterval(iv);res()}}},40/speed)});
}
