// Qaida screens: lesson list, lessons (tap-to-hear), hear-and-repeat practice with self-rating, and links to the live tutor on real surahs.
// Honest scope: the speech model is Quran-trained and cannot reliably recognise isolated letters or syllables (measured), so letters, vowels and
// words here are self-rated; checked reading happens on real ayahs in the live tutor.
import * as D from './qaida-data.js';
import {esc} from './lib.js';
import {createLive,modelCached,releaseModel} from './qaida-live.js';
const KEY='qsQaida';
const load=()=>{try{const o=JSON.parse(localStorage.getItem(KEY));return o&&o.lessons?o:{lessons:{}}}catch{return{lessons:{}}}};
const save=o=>{try{localStorage.setItem(KEY,JSON.stringify(o))}catch{/* storage full: progress is optional */}};
const base=()=>import.meta.env.BASE_URL||'/';
const WD=()=>typeof navigator!=='undefined'&&navigator.webdriver;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

// ---- audio: one player; local clips go through fetch() so they are cached for offline use ----
let au=null,gen=0;const blobs=new Map();
async function srcOf(u){if(/^https?:/.test(u))return u;if(blobs.has(u))return blobs.get(u);const r=await fetch(base()+u);if(!r.ok)throw new Error('audio');const b=URL.createObjectURL(await r.blob());blobs.set(u,b);return b}
export function stop(){gen++;try{au?.pause()}catch{/* ignore */}au=null}
async function one(u,my){try{au?.pause()}catch{/* ignore */}
 if(WD()){(window.__qplays??=[]).push(u);await sleep(5);return my===gen}
 try{const s=await srcOf(u);if(my!==gen)return false;const a=au=new Audio(s);await new Promise((res,rej)=>{a.onended=res;a.onerror=rej;a.play().catch(rej)});return my===gen}catch{return false}}
/** Plays one url; resolves true when it ended, false when interrupted or failed. */
export const play=u=>one(u,++gen);
export async function playSeq(urls,gap=350){const my=++gen;for(let i=0;i<urls.length;i++){if(!await one(urls[i],my))return false;if(i<urls.length-1)await sleep(gap);if(my!==gen)return false}return true}

// ---- items of each lesson (what is counted for progress and used by practice) ----
const L=D.LETTERS;
export function itemsOf(les){
 if(les.kind==='letters')return L.map((l,i)=>({key:'l'+i,big:l.c,tr:l.tr,sub:`${l.en} · ${l.ur}`,urls:[D.clipOf(i,'a')]}));
 if(les.kind==='marks')return D.ROW_IDX.map(i=>({key:les.id+'r'+i,big:les.keys.map(k=>D.rowLetter(i,k)+D.MARKS[k].m).join('  '),tr:les.keys.map(k=>D.sound(L[i],k)).join(' · '),sub:`${L[i].en} · ${L[i].ur}`,urls:les.keys.map(k=>D.clipOf(i,k))}));
 if(les.words)return D.WORDS[les.words].map(w=>({key:'w'+w.k,big:w.t,tr:w.tr,sub:'',mean:[w.e,w.u],urls:[w.au]}));
 return [];
}
export const countOf=les=>itemsOf(les).length;
const gotOf=(P,id)=>Object.keys(P.lessons[id]?.got||{});
const doneN=(P,les)=>{const keys=new Set(itemsOf(les).map(x=>x.key));return gotOf(P,les.id).filter(k=>keys.has(k)).length};

export async function qaidaPage(C,tt,ur,I,id){
 C.setTitle(tt('Noorani Qaida','نورانی قاعدہ'));stop();
 const les=D.LESSONS.find(x=>x.id===id);
 if(!les)return list(C,tt);
 return lesson(C,tt,ur,I,les);
}

function list(C,tt){
 const P=load();let all=0,got=0;
 const rows=D.LESSONS.map(les=>{const n=countOf(les),g=doneN(P,les);all+=n;got+=g;const done=n&&g>=n;
  return `<a class="q-row${done?' done':''}" href="#/qaida/${les.id}" data-l="${les.id}"><span class="q-n">${done?'✓':les.n}</span><span class="mt"><b>${tt(les.en,les.ur)}</b><small>${tt(...les.sub)}</small></span><span class="q-p">${n?`${g}/${n}`:''}</span><span class="go">›</span></a>`}).join('');
 C.app().innerHTML=`<section class="dsec q-wrap"><div class="q-hero"><span class="ar q-hero-ar" dir="rtl" lang="ar">ا ب ت</span><div><b>${tt('Noorani Qaida','نورانی قاعدہ')}</b><small>${tt('Learn to read Arabic: letters, vowels, then real Quran words.','عربی پڑھنا سیکھیں: حروف، حرکات، پھر قرآن کے اصل الفاظ۔')}</small></div></div>
 <div class="q-bar"><i style="width:${all?Math.round(100*got/all):0}%"></i></div><p class="muted q-sub">${tt(`${got} of ${all} items learned`,`${all} میں سے ${got} یاد`)}</p>
 ${rows}
 <div class="card q-note"><b>${tt('How checking works','جانچ کیسے ہوتی ہے')}</b><p>${tt('Tap any letter, vowel or word to hear it. Then say it out loud and rate yourself. The live tutor is built for the Quran and cannot reliably tell single letters or syllables apart (we measured it), so it is not used for those. Each lesson links to a real surah where the tutor checks your reading word by word.','کسی بھی حرف، حرکت یا لفظ کو دبا کر سنیں۔ پھر بلند آواز سے پڑھیں اور خود کو جانچیں۔ لائیو ٹیوٹر قرآن کے لیے بنا ہے اور اکیلے حروف یا چھوٹے ٹکڑوں کو قابلِ اعتماد طور پر نہیں پہچان سکتا (ہم نے ناپا ہے)، اس لیے وہاں استعمال نہیں ہوتا۔ ہر سبق ایک اصل سورت سے جڑا ہے جہاں ٹیوٹر لفظ بہ لفظ آپ کی تلاوت جانچتا ہے۔')}</p></div></section>`}


/** Start button of one live section. along = follow-along (not graded); check = words checked on the phone. */
function liveBar(kind,sel,tt){const al=kind==='along';
 return `<div class="q-lb"><button class="btn ghost q-lbtn" data-live="${kind}" data-sel="${sel}"><span aria-hidden="true">🎤</span> ${al?tt('Read along','ساتھ ساتھ پڑھیں'):tt('Read & check','پڑھیں اور جانچیں')}</button><small class="muted">${al?tt('Highlights as you read. Follows your pace only; does not check what you said.','پڑھتے ہوئے نشان آگے بڑھتا ہے۔ صرف آپ کی رفتار دیکھتا ہے، یہ نہیں جانچتا کہ کیا پڑھا۔'):tt('Each word is checked on your phone. “Not confirmed” is not a mistake.','ہر لفظ فون پر جانچا جاتا ہے۔ “تصدیق نہیں ہوئی” کا مطلب غلطی نہیں۔')}</small></div>`}
function wordsHtml(les,tt){const ws=D.WORDS[les.words];
  return `${liveBar('check','.q-word',tt)}<div class="q-words">${ws.map(w=>`<button class="q-word" data-u="${esc(w.au)}"><span class="ar" dir="rtl" lang="ar">${esc(w.t)}</span><span class="mt"><b>${esc(w.tr)}</b><small>${esc(tt(w.e,w.u))}</small></span><span class="q-sp" aria-hidden="true">🔊</span></button>`).join('')}</div>
  <p class="muted q-sub">${tt('These are real words from short surahs, with their recorded word audio.','یہ چھوٹی سورتوں کے اصل الفاظ ہیں، ان کی ریکارڈ شدہ آواز کے ساتھ۔')}</p>`}
function body(les,tt){
 if(les.kind==='letters')return `${liveBar('along','.q-tile',tt)}<div class="q-grid">${L.map((l,i)=>`<button class="q-tile" data-u="${D.clipOf(i,'a')}" data-i="${i}" aria-label="${esc(l.en)}"><span class="ar" dir="rtl" lang="ar">${l.c}</span><b>${esc(tt(l.en,l.ur))}</b><small>${esc(l.tr)}</small></button>`).join('')}</div>
  <p class="muted q-sub">${tt('Each tap plays the letter with a short “a” (fatḥa), the way the Qaida teaches it. Alif is heard as أَ. The hamza ء sounds the same as أَ.','ہر دباؤ پر حرف زبر کے ساتھ سنائی دیتا ہے، جیسا قاعدہ میں سکھایا جاتا ہے۔ الف أَ کی صورت میں سنائی دیتا ہے۔ ہمزہ ء کی آواز أَ جیسی ہے۔')}</p>`;
 if(les.kind==='marks'){const hd=les.keys.map(k=>`<span><b class="ar" dir="rtl">${D.MARKS[k].m==='\u064E'?'بَ':D.MARKS[k].m==='\u0650'?'بِ':D.MARKS[k].m==='\u064F'?'بُ':'ب'+D.MARKS[k].m}</b><small>${tt(D.MARKS[k].en,D.MARKS[k].ur)}</small></span>`).join('');
  return `${liveBar('along','.q-cell',tt)}<div class="q-marks"><div class="q-mh"><span></span>${hd}</div>${D.ROW_IDX.map(i=>`<div class="q-mr" data-i="${i}"><span class="q-ln">${esc(tt(L[i].en,L[i].ur))}</span>${les.keys.map(k=>`<button class="q-cell" data-u="${D.clipOf(i,k)}"><span class="ar" dir="rtl" lang="ar">${D.rowLetter(i,k)+D.MARKS[k].m}</span><small>${esc(D.sound(L[i],k))}</small></button>`).join('')}</div>`).join('')}</div>
  <p class="muted q-sub">${tt('The hamza row is left out: it sounds the same as the أ row. The sounds are recordings of one speaker.','ہمزہ کی قطار شامل نہیں: اس کی آواز أ والی قطار جیسی ہے۔ آوازیں ایک قاری کی ریکارڈنگ ہیں۔')}</p>${les.words?wordsHtml(les,tt):''}`}
 if(les.kind==='joined'){const ex=[['ب ي ت','بيت',['house','گھر']],['ك ت ا ب','كتاب',['book','کتاب']],['ر ب','رب',['Lord','رب']],['م ن','من',['from','سے']]];
  return `<div class="q-forms"><div class="q-fh"><span></span><b>${tt('Alone','اکیلا')}</b><b>${tt('Start','شروع')}</b><b>${tt('Middle','درمیان')}</b><b>${tt('End','آخر')}</b></div>${L.map((l,i)=>{const f=D.forms(l.c);return `<button class="q-fr" data-u="${D.clipOf(i,'a')}"><span class="q-ln ar" dir="rtl">${l.c}</span><span class="ar" dir="rtl" lang="ar">${f.iso}</span><span class="ar${f.nj?' same':''}" dir="rtl" lang="ar">${f.ini}</span><span class="ar${f.nj?' same':''}" dir="rtl" lang="ar">${f.med}</span><span class="ar" dir="rtl" lang="ar">${f.fin}</span></button>`}).join('')}</div>
  <p class="muted q-sub">${tt('Faded shapes: ا د ذ ر ز و (and the hamza ء) never join to the next letter, so at the start they look like the “alone” shape and in the middle like the “end” shape.','مدھم شکلیں: ا د ذ ر ز و (اور ہمزہ ء) اگلے حرف سے نہیں جڑتے، اس لیے شروع میں “اکیلے” جیسے اور درمیان میں “آخر” جیسے دکھتے ہیں۔')}</p>
  <div class="card"><b>${tt('Building words','لفظ بنانا')}</b>${ex.map(([a,b,m])=>`<div class="q-ex"><span class="ar" dir="rtl" lang="ar">${a}</span><i>＝</i><span class="ar q-exw" dir="rtl" lang="ar">${b}</span><small>${tt(...m)}</small></div>`).join('')}</div>`}
 if(les.words)return wordsHtml(les,tt);
 return '';
}

function lesson(C,tt,ur,I,les){
 const P=load(),n=countOf(les),g=doneN(P,les),tu=D.TUTOR[les.id];
 const rule=D.RULES[les.id]?.[0];
 C.setTitle(tt(les.en,les.ur));
 C.app().innerHTML=`<section class="dsec q-wrap" data-lesson="${les.id}"><a class="q-back" href="#/qaida">‹ ${tt('All lessons','تمام اسباق')}</a>
  <div class="q-lh"><h2 class="h3">${les.n}. ${tt(les.en,les.ur)}</h2>${n?`<span class="q-p" id="qProg">${g}/${n}</span>`:''}</div>
  ${rule?`<div class="card q-rule"><p>${tt(rule[0],rule[1])}</p></div>`:''}
  <div class="card q-lp" id="qLp" hidden aria-live="polite"></div>
  <div id="qBody">${body(les,tt)}</div>
  ${n?`<div class="bar"><button class="btn" id="qaPrac">${I.icon('play')} ${tt('Hear & repeat','سنیں اور دہرائیں')}</button></div>`:''}
  ${tu?`<a class="tutor-card q-tutor" href="#/recite/${tu[0]}/1" id="qaTutor"><span class="ti">${I.icon('tutor')}</span><div><b>${tt('Read a real surah with the tutor','اصل سورت ٹیوٹر کے ساتھ پڑھیں')}</b><small>${tt(`Surah ${tu[1]}: checked word by word`,`سورۃ ${tu[2]}: لفظ بہ لفظ جانچ`)}</small></div><span class="go">›</span></a>`:''}
  </section>`;
 const root=C.app();
 let live=null;
 root.querySelector('.q-wrap').addEventListener('click',e=>{
  const lb=e.target.closest('.q-lbtn');if(lb){live?.stop();live=liveUI(tt,les,root,lb.dataset.live,lb.dataset.sel,h=>{live=h});return}
  const b=e.target.closest('[data-u]');if(!b)return;
  if(live&&live.slots.includes(b)){live.jump(live.slots.indexOf(b));return}
  b.classList.add('on');play(b.dataset.u).then(()=>b.classList.remove('on'))});
 window.addEventListener('hashchange',()=>live?.stop(),{once:true});
 const pr=root.querySelector('#qaPrac');if(pr)pr.onclick=()=>practice(C,tt,ur,I,les,root);
}

// ---- live reading: follow-along (pace) and checked words ----
const LMSG=tt=>({warm:tt('Get ready…','تیار ہو جائیں…'),listen:tt('Listening — read the first one','سن رہا ہے — پہلا پڑھیں'),hear:tt('Hearing you…','آپ کو سن رہا ہے…'),stopped:tt('Stopped','رک گیا'),interrupted:tt('The microphone was interrupted (a call or another app). Tap Read again.','مائیک رک گیا (کال یا کوئی اور ایپ)۔ دوبارہ پڑھیں دبائیں۔'),
 nomic:tt('No microphone is available here. Open the app directly in Safari or Chrome.','یہاں مائیک دستیاب نہیں۔ ایپ کو براہِ راست Safari یا Chrome میں کھولیں۔'),denied:tt('Microphone permission is off. Allow it in the browser settings, then try again.','مائیک کی اجازت بند ہے۔ براؤزر کی سیٹنگ میں اجازت دے کر دوبارہ کوشش کریں۔'),
 busy:tt('The microphone is busy. Close other apps or calls that use it, then try again.','مائیک مصروف ہے۔ جو ایپ یا کال اسے استعمال کر رہی ہو بند کر کے دوبارہ کوشش کریں۔'),model:tt('Could not load the tutor. Check your connection and try again.','ٹیوٹر لوڈ نہیں ہو سکا۔ انٹرنیٹ چیک کریں۔')});
function liveUI(tt,les,root,kind,sel,reg){
 const slots=[...root.querySelectorAll(sel)],check=kind==='check',M=LMSG(tt);const lp=root.querySelector('#qLp');
 const words=check?D.WORDS[les.words].map(w=>w.t):null;
 const keys=check?D.WORDS[les.words].map(w=>'w'+w.k):null;
 const clear=()=>slots.forEach(el=>el.classList.remove('q-fa','q-cur','q-ok','q-nc'));
 const paint=n=>{slots.forEach((el,i)=>{el.classList.toggle('q-fa',i<n);el.classList.toggle('q-cur',i===n)});const c=slots[Math.min(n,slots.length-1)];
  if(c&&!matchMedia('(prefers-reduced-motion: reduce)').matches)c.scrollIntoView({block:'center',behavior:'smooth'});else c?.scrollIntoView({block:'center'})};
 const head=()=>`<div class="q-lh2"><b>${check?tt('Checked reading','جانچ کے ساتھ پڑھنا'):tt('Follow-along','ساتھ ساتھ پڑھنا')}</b><span class="q-ltag ${check?'chk':'fol'}">${check?tt('words checked','الفاظ کی جانچ'):tt('not checked','جانچ نہیں')}</span></div>
  <p class="muted q-ldesc">${check?tt('Each word you read is checked on your phone. Green = confirmed. Grey = not confirmed: the model often cannot recognise a single word, so this is not a mistake.','ہر پڑھا ہوا لفظ فون پر جانچا جاتا ہے۔ سبز = تصدیق ہوئی۔ سرمئی = تصدیق نہیں ہوئی: ماڈل اکیلے لفظ کو اکثر پہچان نہیں پاتا، اس لیے یہ غلطی نہیں۔'):tt('The highlight moves each time you say something. It only follows your pace and does not know what you said. Tap an item to say where you are.','جب آپ کچھ بولتے ہیں تو نشان آگے بڑھتا ہے۔ یہ صرف آپ کی رفتار دیکھتا ہے، یہ نہیں جانتا کہ آپ نے کیا کہا۔ اپنی جگہ بتانے کے لیے کسی چیز کو دبائیں۔')}</p>`;
 lp.hidden=false;lp.innerHTML=`${head()}<div class="rc-chip q-lchip" id="qlChip"><i></i><span></span></div><div class="rc-lv" aria-hidden="true"><i id="qlLv"></i></div>
  <div class="bar"><button class="btn" id="qlStop">${tt('Stop','روکیں')}</button></div><div id="qlSum"></div>`;
 const chip=(k,t)=>{const c=lp.querySelector('#qlChip');if(c){c.className='rc-chip q-lchip '+k;c.querySelector('span').textContent=t}};
 let sumDone=false;const H={slots,jump:i=>L.jump(i),stop:()=>{L.stop()}};
 const summary=()=>{if(sumDone)return;sumDone=true;const n=L.pos,g=L.grades;const ok=Object.values(g).filter(v=>v==='ok').length;
  if(check&&ok){const P=load(),e=P.lessons[les.id]??={got:{},sessions:0};const ts=Date.now();Object.entries(g).forEach(([i,v])=>{if(v==='ok')e.got[keys[i]]=ts});e.last=ts;save(P);const pr=root.querySelector('#qProg');if(pr)pr.textContent=`${doneN(P,les)}/${countOf(les)}`}
  const sm=lp.querySelector('#qlSum');if(!sm)return;
  sm.innerHTML=`<div class="q-lsum">${check?`<b>${tt(`${ok} of ${slots.length} confirmed`,`${slots.length} میں سے ${ok} کی تصدیق ہوئی`)}</b><p class="muted">${tt('The rest were followed by your pace but not confirmed. Use Hear & repeat to rate yourself on those.','باقی آپ کی رفتار سے چلتے رہے مگر ان کی تصدیق نہیں ہوئی۔ ان کے لیے سنیں اور دہرائیں سے خود کو جانچیں۔')}</p>`:`<b>${tt(`Followed ${n} of ${slots.length}`,`${slots.length} میں سے ${n} پر ساتھ چلا`)}</b><p class="muted">${tt('This only followed your pace. It did not check your reading: rate yourself with Hear & repeat.','یہ صرف آپ کی رفتار کے ساتھ چلا۔ اس نے آپ کی تلاوت نہیں جانچی: سنیں اور دہرائیں سے خود کو جانچیں۔')}</p>`}
   <div class="bar"><button class="btn" id="qlAgain">${tt('Read again','دوبارہ پڑھیں')}</button></div></div>`;
  sm.querySelector('#qlAgain').onclick=()=>{clear();liveUI(tt,les,root,kind,sel,reg)}};
 const L=createLive({mode:check?'check':'along',n:slots.length,words,
  onPos:n=>paint(n),onGrade:(i,v)=>{const el=slots[i];if(!el)return;el.classList.remove('q-ok','q-nc');el.classList.add(v==='ok'?'q-ok':'q-nc');if(v==='ok'){try{navigator.vibrate?.(8)}catch{/* no haptics */}}},
  onStatus:k=>{if(k==='stopped'){reg(null);chip('ready',M.stopped);summary();lp.querySelector('#qlStop')?.remove();if(check)releaseModel();return}chip(k==='hear'?'hear':'listen',M[k]||'')},
  onLevel:v=>{const e=lp.querySelector('#qlLv');if(e)e.style.transform=`scaleX(${v.toFixed(3)})`},
  onProgress:p=>chip('load',tt(`Downloading tutor… ${p}%`,`ٹیوٹر ڈاؤن لوڈ ہو رہا ہے… ${p}%`)),
  onDone:()=>{try{navigator.vibrate?.([20,40,20])}catch{/* no haptics */}L.stop()}});
 clear();paint(0);
 lp.querySelector('#qlStop').onclick=()=>L.stop();
 const go=async()=>{if(check&&!modelCached()&&!window.__qFake){const b=document.createElement('div');b.className='bar';b.innerHTML=`<button class="btn" id="qlDl">${tt('Download tutor (~19 MB, once)','ٹیوٹر ڈاؤن لوڈ کریں (~19 MB، ایک بار)')}</button>`;chip('info',tt('Checking words needs a small tutor, downloaded once. Follow-along works without it.','الفاظ جانچنے کے لیے ایک چھوٹا ٹیوٹر چاہیے، ایک بار ڈاؤن لوڈ ہوگا۔ ساتھ ساتھ پڑھنا اس کے بغیر بھی چلتا ہے۔'));lp.insertBefore(b,lp.querySelector('.bar'));
   await new Promise(res=>{b.querySelector('#qlDl').onclick=()=>{b.remove();res()};H.stop=()=>{b.remove();res();L.stop()}})}
  chip('listen',M.warm);const r=await L.start();if(!r.ok){chip('warn',M[r.err]||M.denied);reg(null)}};
 if(navigator.webdriver)window.__qlive=L;
 reg(H);go();
 return H}

// ---- hear & repeat with self-rating ----
function practice(C,tt,ur,I,les,root){
 const P=load(),all=itemsOf(les),have=new Set(gotOf(P,les.id));
 let todo=all.filter(x=>!have.has(x.key));const SESSION=les.kind==='marks'?7:les.kind==='letters'?10:8;
 if(!todo.length)todo=all.slice();
 const q=todo.slice(0,SESSION).map(x=>({...x,tries:0}));const total=q.length;let got=0;const rated=[];
 const host=root.querySelector('#qBody');root.querySelector('#qaPrac').parentNode.hidden=true;const tc=root.querySelector('.q-tutor');if(tc)tc.hidden=true;
 const show=()=>{const it=q[0];
  if(!it){return finish()}
  host.innerHTML=`<div class="q-prac" id="qPrac"><div class="q-pp"><i style="width:${Math.round(100*got/total)}%"></i></div><small class="muted">${tt(`Learned ${got} of ${total}`,`${total} میں سے ${got} یاد`)}</small>
   <div class="q-big ar" dir="rtl" lang="ar" id="qBig">${esc(it.big)}</div><div class="q-tr">${esc(it.tr)}</div>${it.sub?`<small class="muted">${esc(it.sub)}</small>`:''}${it.mean?`<small class="muted">${esc(tt(it.mean[0],it.mean[1]))}</small>`:''}
   <div class="bar"><button class="btn" id="qpHear">🔊 ${tt('Hear','سنیں')}</button></div>
   <p class="muted" id="qpAsk" hidden>${tt('Now say it out loud, then rate yourself honestly.','اب بلند آواز سے پڑھیں، پھر ایمانداری سے خود کو جانچیں۔')}</p>
   <div class="bar" id="qpRate" hidden><button class="btn" id="qpGot">✓ ${tt('I said it right','ٹھیک پڑھا')}</button><button class="btn ghost" id="qpAgain">↻ ${tt('Again','دوبارہ')}</button></div>
   <div class="bar"><button class="btn ghost" id="qpStop">${tt('Stop','بند کریں')}</button></div></div>`;
  const hear=async()=>{host.querySelector('#qpHear').disabled=true;await playSeq(it.urls);const h=host.querySelector('#qpHear');if(h){h.disabled=false;host.querySelector('#qpAsk').hidden=false;host.querySelector('#qpRate').hidden=false}};
  host.querySelector('#qpHear').onclick=hear;
  host.querySelector('#qpGot').onclick=()=>{stop();q.shift();got++;rated.push(it.key);try{navigator.vibrate?.(15)}catch{/* no haptics */}show()};
  host.querySelector('#qpAgain').onclick=()=>{stop();it.tries++;q.shift();if(it.tries<2)q.push(it);else total_missed.push(it.key);show()};
  host.querySelector('#qpStop').onclick=()=>finish();
  hear()};
 const total_missed=[];
 const finish=()=>{stop();const P2=load();const e=P2.lessons[les.id]??={got:{},sessions:0};const ts=Date.now();rated.forEach(k=>e.got[k]=ts);e.sessions++;e.last=ts;save(P2);
  const n=countOf(les),g=doneN(P2,les);
  host.innerHTML=`<div class="card q-done" id="qDone"><b>${g>=n?tt('Lesson complete!','سبق مکمل!'):tt('Well done!','شاباش!')}</b><p>${tt(`You marked ${rated.length} of ${total} as learned. ${g} of ${n} in this lesson.`,`آپ نے ${total} میں سے ${rated.length} یاد کیے۔ اس سبق میں ${n} میں سے ${g}۔`)}</p>
   ${total_missed.length?`<p class="muted">${tt('The ones you missed will come back next time.','جو رہ گئے وہ اگلی بار دوبارہ آئیں گے۔')}</p>`:''}
   <div class="bar"><button class="btn" id="qMore">${tt('Practice more','مزید مشق')}</button><a class="btn ghost" href="#/qaida">${tt('All lessons','تمام اسباق')}</a></div></div>`;
  host.querySelector('#qMore').onclick=()=>lesson(C,tt,ur,I,les);};
 show();
}
