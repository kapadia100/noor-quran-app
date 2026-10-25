// Qaida screens: lesson list, lessons (tap-to-hear), hear-and-repeat practice with self-rating, and links to the live tutor on real surahs.
// Honest scope: the speech model is Quran-trained and cannot reliably recognise isolated letters or syllables (measured), so letters, vowels and
// words here are self-rated; checked reading happens on real ayahs in the live tutor.
import * as D from './qaida-data.js';
import * as M from './madani-data.js';
import {esc} from './lib.js';
import {createLive,modelCached,releaseModel} from './qaida-live.js';
/** The two courses share this engine. n = Noorani (the original Qaida), m = Madani. Each has its own lessons and its own saved progress. */
export const COURSES={
 n:{id:'n',key:'qsQaida',LESSONS:D.LESSONS,RULES:D.RULES,TUTOR:D.TUTOR,WORDS:D.WORDS,en:'Noorani Qaida',ur:'نورانی قاعدہ',href:'#/qaida/n',hero:'ا ب ت',
  intro:['Learn to read Arabic: letters, vowels, then real Quran words.','عربی پڑھنا سیکھیں: حروف، حرکات، پھر قرآن کے اصل الفاظ۔']},
 m:{id:'m',key:'qsQaidaM',LESSONS:M.LESSONS,RULES:M.RULES,TUTOR:M.TUTOR,WORDS:M.WORDS,en:'Madani Qaida',ur:'مدنی قاعدہ',href:'#/qaida/m',hero:'بَ بِ بُ',
  intro:['22 lessons: letters and vowels, tajweed rules with real Quran words, then the prayer.','22 اسباق: حروف اور حرکات، اصل قرآنی الفاظ کے ساتھ تجوید کے احکام، پھر نماز۔']},
};
export const PICK_KEY='qsQaidaPick';
const crOf=les=>les.course==='m'?COURSES.m:COURSES.n;
const WS=les=>crOf(les).WORDS[les.words];
const load=cr=>{try{const o=JSON.parse(localStorage.getItem(cr.key));return o&&o.lessons?o:{lessons:{}}}catch{return{lessons:{}}}};
const save=(cr,o)=>{try{localStorage.setItem(cr.key,JSON.stringify(o))}catch{/* storage full: progress is optional */}};
const lastPick=()=>{try{const v=localStorage.getItem(PICK_KEY);return v==='n'||v==='m'?v:null}catch{return null}};
const setPick=id=>{try{localStorage.setItem(PICK_KEY,id)}catch{/* optional */}};
const playU=u=>u.includes('|')?playSeq(u.split('|')):play(u);
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
 if(les.kind==='drill')return M.drillRows().map(r=>({key:r.key,big:r.cells.map(c=>c.c).join('  '),tr:r.cells.map(c=>c.s).join(' · '),sub:'',urls:r.cells.map(c=>c.u)}));
 if(les.words)return WS(les).map(w=>({key:'w'+w.k,big:w.t,tr:w.tr,sub:'',mean:[w.e,w.u],urls:w.au.split('|'),alt:les.stop?M.stopForm(w.t):''}));
 return [];
}
export const countOf=les=>itemsOf(les).length;
const gotOf=(P,id)=>Object.keys(P.lessons[id]?.got||{});
const doneN=(P,les)=>{const keys=new Set(itemsOf(les).map(x=>x.key));return gotOf(P,les.id).filter(k=>keys.has(k)).length};

/** Routes: #/qaida = chooser; #/qaida/n|m = lesson list; #/qaida/n|m/<lesson>; old links #/qaida/<lesson> still open the Noorani lesson. */
export async function qaidaPage(C,tt,ur,I,a,b){
 stop();
 if(!a){C.setTitle(tt('Qaida','قاعدہ'));return chooser(C,tt,I)}
 let cr,les;
 if(COURSES[a]){cr=COURSES[a];les=b?cr.LESSONS.find(x=>x.id===b):null}
 else{les=D.LESSONS.find(x=>x.id===a);cr=les?COURSES.n:null}
 if(!cr){C.setTitle(tt('Qaida','قاعدہ'));return chooser(C,tt,I)}
 setPick(cr.id);C.setTitle(tt(cr.en,cr.ur));
 if(!les)return list(C,tt,I,cr);
 return lesson(C,tt,ur,I,les);
}
const switchChip=tt=>`<a class="q-sw" id="qSwitch" href="#/qaida"><span aria-hidden="true">⇄</span> ${tt('Switch Qaida','قاعدہ بدلیں')}</a>`;
const courseProg=cr=>{const P=load(cr);let all=0,got=0;for(const les of cr.LESSONS){all+=countOf(les);got+=doneN(P,les)}return{all,got}};

/** First screen of the Qaida: choose Madani or Noorani. The last choice is remembered and marked. */
function chooser(C,tt,I){
 const last=lastPick();
 const card=(cr,icon)=>{const {all,got}=courseProg(cr);
  return `<a class="tutor-card q-choice${last===cr.id?' q-last':''}" href="${cr.href}" id="qc${cr.id==='m'?'Madani':'Noorani'}" data-course="${cr.id}"><span class="ti">${I.icon(icon)}</span><div><b>${tt(cr.en,cr.ur)}</b><small>${tt(...cr.intro)}</small><small class="q-cp">${got?tt(`${got} of ${all} items learned`,`${all} میں سے ${got} یاد`):tt(`${cr.LESSONS.length} lessons`,`${cr.LESSONS.length} اسباق`)}${last===cr.id?' · '+tt('last used','آخری بار')+' ✓':''}</small></div><span class="go">›</span></a>`};
 C.app().innerHTML=`<section class="dsec q-wrap" id="qChoose"><div class="q-hero"><span class="ar q-hero-ar" dir="rtl" lang="ar">ا ب ت</span><div><b>${tt('Choose your Qaida','اپنا قاعدہ چنیں')}</b><small>${tt('Both teach you to read Arabic. Your progress is kept separately for each.','دونوں عربی پڑھنا سکھاتے ہیں۔ ہر ایک کی ترقی الگ محفوظ رہتی ہے۔')}</small></div></div>
 ${card(COURSES.m,'madani')}${card(COURSES.n,'letters')}</section>`;
 C.app().querySelectorAll('.q-choice').forEach(a=>a.addEventListener('click',()=>setPick(a.dataset.course))); // remembered at the tap, before the lesson list has loaded
}

function list(C,tt,I,cr){
 const P=load(cr);let all=0,got=0;
 const rows=cr.LESSONS.map(les=>{const n=countOf(les),g=doneN(P,les);all+=n;got+=g;const done=n&&g>=n;
  return `<a class="q-row${done?' done':''}" href="#/qaida/${cr.id}/${les.id}" data-l="${les.id}"><span class="q-n">${done?'✓':les.n}</span><span class="mt"><b>${tt(les.en,les.ur)}</b><small>${tt(...les.sub)}</small></span><span class="q-p">${n?`${g}/${n}`:''}</span><span class="go">›</span></a>`}).join('');
 C.app().innerHTML=`<section class="dsec q-wrap" data-course="${cr.id}"><div class="q-hero"><span class="ar q-hero-ar" dir="rtl" lang="ar">${cr.hero}</span><div><b>${tt(cr.en,cr.ur)}</b><small>${tt(...cr.intro)}</small></div>${switchChip(tt)}</div>
 <div class="q-bar"><i style="width:${all?Math.round(100*got/all):0}%"></i></div><p class="muted q-sub">${tt(`${got} of ${all} items learned`,`${all} میں سے ${got} یاد`)}</p>
 ${rows}
 <div class="card q-note"><b>${tt('How checking works','جانچ کیسے ہوتی ہے')}</b><p>${tt('Tap any letter, vowel or word to hear it. Tap Start reading live and read in order: every item you read turns green. For letters and syllables the app follows your voice (it knows you spoke, not what you said), so those are not graded. For real words, the app also checks the word on your phone: ✓ means confirmed, grey means not confirmed (not a mistake). Each lesson also links to a real surah where the tutor checks your reading word by word.','کسی بھی حرف، حرکت یا لفظ کو دبا کر سنیں۔ لائیو پڑھنا شروع کریں دبائیں اور ترتیب سے پڑھیں: جو چیز پڑھیں وہ سبز ہوتی جاتی ہے۔ حروف اور مقطع کے لیے ایپ آپ کی آواز کے ساتھ چلتی ہے (اسے معلوم ہوتا ہے کہ آپ نے بولا، یہ نہیں کہ کیا بولا)، اس لیے ان کی جانچ نہیں ہوتی۔ اصل الفاظ کو ایپ فون پر جانچتی بھی ہے: ✓ کا مطلب تصدیق، سرمئی کا مطلب تصدیق نہیں (غلطی نہیں)۔ ہر سبق ایک اصل سورت سے بھی جڑا ہے جہاں ٹیوٹر لفظ بہ لفظ آپ کی تلاوت جانچتا ہے۔')}</p></div></section>`}


/** Start card of one live section: a big green mic button with a LIVE badge. along = follow-along by voice; check = words checked on the phone. */
function liveBar(kind,sel,tt,top){const al=kind==='along',dl=!al&&!modelCached();
 return `<div class="q-lb${top?' q-lb-top':''}"><span class="q-badge">● ${tt('LIVE','لائیو')}</span><button class="btn q-lbtn" data-live="${kind}" data-sel="${sel}"><span aria-hidden="true">🎙</span> ${al?tt('Start reading live','لائیو پڑھنا شروع کریں'):tt('Start reading live (checked)','لائیو پڑھنا شروع کریں (جانچ کے ساتھ)')}</button><small class="muted">${al?tt('Each item turns green as you read it. Letters and syllables are tracked by your voice, not graded.','پڑھتے ہی ہر چیز سبز ہوتی جاتی ہے۔ حروف اور مقطع آواز سے ٹریک ہوتے ہیں، ان کی جانچ نہیں ہوتی۔'):tt('Each word is checked on your phone and turns green with ✓ when confirmed. Grey is “not confirmed”, not a mistake.','ہر لفظ فون پر جانچا جاتا ہے اور تصدیق پر ✓ کے ساتھ سبز ہوتا ہے۔ سرمئی کا مطلب “تصدیق نہیں”، غلطی نہیں۔')}${dl?' '+tt('First time: a one-off ~19 MB download.','پہلی بار: ایک بار تقریباً 19 MB ڈاؤن لوڈ۔'):''}</small></div>`}
function wordsHtml(les,tt,top){const ws=WS(les);
  return `${top?'':liveBar('check','.q-word',tt)}<div class="q-words">${ws.map(w=>`<button class="q-word" data-u="${esc(w.au)}"><span class="ar" dir="rtl" lang="ar">${esc(w.t)}</span><span class="mt"><b>${esc(w.tr)}</b><small>${esc(tt(w.e,w.u))}</small>${w.g&&M.TAGS[w.g]?`<small class="q-tag">${esc(tt(...M.TAGS[w.g]))}</small>`:''}${les.stop?`<small class="q-stop">${tt('Stop:','وقف:')} <span class="ar" dir="rtl" lang="ar">${esc(M.stopForm(w.t))}</span></small>`:''}</span><span class="q-sp" aria-hidden="true">🔊</span></button>`).join('')}</div>
  <p class="muted q-sub">${tt('These are real words from short surahs, with their recorded word audio.','یہ چھوٹی سورتوں کے اصل الفاظ ہیں، ان کی ریکارڈ شدہ آواز کے ساتھ۔')}</p>${les.course==='m'&&les.live!=='along'?`<p class="muted q-sub q-tjnote">${tt('The live check confirms the letters of each word. It cannot hear tajweed (madd length, ghunna, qalqalah): listen to the recording and compare.','لائیو جانچ ہر لفظ کے حروف کی تصدیق کرتی ہے۔ وہ تجوید (مد کی لمبائی، غنّہ، قلقلہ) نہیں سنتی: ریکارڈنگ سنیں اور موازنہ کریں۔')}</p>`:''}`}
/** The lesson's main live section: [kind, selector]. */
const mainLive=les=>les.kind==='letters'?['along','.q-tile']:les.kind==='marks'||les.kind==='drill'?['along','.q-cell']:les.kind==='joined'||les.kind==='salah'?null:les.words?[les.live||'check','.q-word']:null;
let I_ICON=()=>'';
function body(les,tt){
 if(les.kind==='letters')return `<div class="q-grid">${L.map((l,i)=>`<button class="q-tile" data-u="${D.clipOf(i,'a')}" data-i="${i}" aria-label="${esc(l.en)}"><span class="ar" dir="rtl" lang="ar">${l.c}</span><b>${esc(tt(l.en,l.ur))}</b><small>${esc(l.tr)}</small></button>`).join('')}</div>
  <p class="muted q-sub">${tt('Each tap plays the letter with a short “a” (fatḥa), the way the Qaida teaches it. Alif is heard as أَ. The hamza ء sounds the same as أَ.','ہر دباؤ پر حرف زبر کے ساتھ سنائی دیتا ہے، جیسا قاعدہ میں سکھایا جاتا ہے۔ الف أَ کی صورت میں سنائی دیتا ہے۔ ہمزہ ء کی آواز أَ جیسی ہے۔')}</p>`;
 if(les.kind==='marks'){const hd=les.keys.map(k=>`<span><b class="ar" dir="rtl">${D.MARKS[k].m==='\u064E'?'بَ':D.MARKS[k].m==='\u0650'?'بِ':D.MARKS[k].m==='\u064F'?'بُ':'ب'+D.MARKS[k].m}</b><small>${tt(D.MARKS[k].en,D.MARKS[k].ur)}</small></span>`).join('');
  return `<div class="q-marks"><div class="q-mh"><span></span>${hd}</div>${D.ROW_IDX.map(i=>`<div class="q-mr" data-i="${i}"><span class="q-ln">${esc(tt(L[i].en,L[i].ur))}</span>${les.keys.map(k=>`<button class="q-cell" data-u="${D.clipOf(i,k)}"><span class="ar" dir="rtl" lang="ar">${D.rowLetter(i,k)+D.MARKS[k].m}</span><small>${esc(D.sound(L[i],k))}</small></button>`).join('')}</div>`).join('')}</div>
  <p class="muted q-sub">${tt('The hamza row is left out: it sounds the same as the أ row. The sounds are recordings of one speaker.','ہمزہ کی قطار شامل نہیں: اس کی آواز أ والی قطار جیسی ہے۔ آوازیں ایک قاری کی ریکارڈنگ ہیں۔')}</p>${les.words?wordsHtml(les,tt):''}`}
 if(les.kind==='joined'){const ex=[['ب ي ت','بيت',['house','گھر']],['ك ت ا ب','كتاب',['book','کتاب']],['ر ب','رب',['Lord','رب']],['م ن','من',['from','سے']]];
  return `<div class="q-forms"><div class="q-fh"><span></span><b>${tt('Alone','اکیلا')}</b><b>${tt('Start','شروع')}</b><b>${tt('Middle','درمیان')}</b><b>${tt('End','آخر')}</b></div>${L.map((l,i)=>{const f=D.forms(l.c);return `<button class="q-fr" data-u="${D.clipOf(i,'a')}"><span class="q-ln ar" dir="rtl">${l.c}</span><span class="ar" dir="rtl" lang="ar">${f.iso}</span><span class="ar${f.nj?' same':''}" dir="rtl" lang="ar">${f.ini}</span><span class="ar${f.nj?' same':''}" dir="rtl" lang="ar">${f.med}</span><span class="ar" dir="rtl" lang="ar">${f.fin}</span></button>`}).join('')}</div>
  <p class="muted q-sub">${tt('Faded shapes: ا د ذ ر ز و (and the hamza ء) never join to the next letter, so at the start they look like the “alone” shape and in the middle like the “end” shape.','مدھم شکلیں: ا د ذ ر ز و (اور ہمزہ ء) اگلے حرف سے نہیں جڑتے، اس لیے شروع میں “اکیلے” جیسے اور درمیان میں “آخر” جیسے دکھتے ہیں۔')}</p>
  <div class="card"><b>${tt('Building words','لفظ بنانا')}</b>${ex.map(([a,b,m])=>`<div class="q-ex"><span class="ar" dir="rtl" lang="ar">${a}</span><i>＝</i><span class="ar q-exw" dir="rtl" lang="ar">${b}</span><small>${tt(...m)}</small></div>`).join('')}</div>`}
 if(les.kind==='drill'){let last='';
  return `<div class="q-drill">${M.drillRows().map(r=>{const h=r.sub!==last?`<h3 class="q-dh">${r.sub==='alike'?tt('Look-alike sounds','ملتی جلتی آوازیں'):tt('Mixed rows','ملی جلی قطاریں')}</h3>`:'';last=r.sub;
   return `${h}<div class="q-dr" dir="rtl" data-d="${r.key}">${r.cells.map(c=>`<button class="q-cell" data-u="${c.u}"><span class="ar" dir="rtl" lang="ar">${c.c}</span><small>${esc(c.s)}</small></button>`).join('')}</div>`}).join('')}</div>
  <p class="muted q-sub">${tt('Each row is read from right to left. Tap a letter to hear it, or read the whole row live.','ہر قطار دائیں سے بائیں پڑھی جاتی ہے۔ حرف دبا کر سنیں، یا پوری قطار لائیو پڑھیں۔')}</p>`}
 if(les.kind==='salah')return `<p class="muted q-sub q-salnote">${tt('These phrases are typed for reading practice. They have no recording and no live check, so please learn them with a teacher. The Quran parts below open in the live tutor.','یہ الفاظ پڑھنے کی مشق کے لیے لکھے گئے ہیں۔ ان کی ریکارڈنگ اور لائیو جانچ نہیں ہے، اس لیے انہیں استاد سے سیکھیں۔ نیچے قرآنی حصے لائیو ٹیوٹر میں کھلتے ہیں۔')}</p><div class="q-salah">${M.SALAH.map(x=>`<div class="card q-ph" data-ph="${x.id}"><div class="ar q-ph-ar" dir="rtl" lang="ar">${esc(x.ar)}</div><b>${esc(x.tr)}</b><small class="muted">${esc(tt(x.e,x.u))}</small></div>`).join('')}</div>
  <h3 class="q-dh">${tt('Quran in the prayer: read with the tutor','نماز میں قرآن: ٹیوٹر کے ساتھ پڑھیں')}</h3>${M.SALAH_SURAHS.map(([n,en,u])=>`<a class="tutor-card q-tutor" href="#/recite/${n}/1" data-surah="${n}"><span class="ti">${I_ICON('tutor')}</span><div><b>${tt('Surah '+en,'سورۃ '+u)}</b><small>${tt('Checked word by word','لفظ بہ لفظ جانچ')}</small></div><span class="go">›</span></a>`).join('')}`;
 if(les.words)return wordsHtml(les,tt,true)+(les.signs?`<div class="card q-signs"><b>${tt('Stop signs','وقف کی علامات')}</b>${M.SIGNS.map(([m,e,u])=>`<div class="q-sg"><span class="ar" dir="rtl" lang="ar">\u0640${m}</span><small>${tt(e,u)}</small></div>`).join('')}</div>`:'');
 return '';
}

function lesson(C,tt,ur,I,les){
 const cr=crOf(les),P=load(cr),n=countOf(les),g=doneN(P,les),tu=cr.TUTOR[les.id];
 const rule=cr.RULES[les.id]?.[0];I_ICON=k=>I.icon(k);
 C.setTitle(tt(les.en,les.ur));
 C.app().innerHTML=`<section class="dsec q-wrap" data-lesson="${les.id}" data-course="${cr.id}"><div class="q-top"><a class="q-back" href="${cr.href}">‹ ${tt('All lessons','تمام اسباق')}</a>${switchChip(tt)}</div>
  <div class="q-lh"><h2 class="h3">${les.n}. ${tt(les.en,les.ur)}</h2>${n?`<span class="q-p" id="qProg">${g}/${n}</span>`:''}</div>
  ${mainLive(les)?liveBar(...mainLive(les),tt,true):''}
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
  if(live&&live.slots.includes(b)){live.tap(live.slots.indexOf(b));return}
  b.classList.add('on');playU(b.dataset.u).then(()=>b.classList.remove('on'))});
 window.addEventListener('hashchange',()=>live?.stop(),{once:true});
 const pr=root.querySelector('#qaPrac');if(pr)pr.onclick=()=>practice(C,tt,ur,I,les,root);
}

// ---- live reading: follow-along (voice) and checked words ----
const LMSG=tt=>({warm:tt('Calibrating the room… stay quiet for a moment','کمرے کی آواز ناپ رہا ہے… ذرا خاموش رہیں'),listen:tt('Listening — read the first one now','سن رہا ہے — اب پہلا پڑھیں'),hear:tt('Hearing you…','آپ کو سن رہا ہے…'),stopped:tt('Stopped','رک گیا'),
 quiet:tt('I cannot hear you clearly. Hold the phone closer and read a little louder. Watch the level bar: it must cross the line.','آپ کی آواز صاف نہیں آ رہی۔ فون قریب کریں اور ذرا بلند پڑھیں۔ لیول بار دیکھیں: اسے لائن پار کرنی چاہیے۔'),
 dead:tt('The microphone looks silent. Check that the phone is not muted by a call or another app, then tap Start again.','مائیک خاموش لگ رہا ہے۔ دیکھیں کہ کال یا کوئی اور ایپ مائیک روکے ہوئے تو نہیں، پھر دوبارہ شروع کریں۔'),
 suspended:tt('Safari did not start the microphone. Tap Start again (tap it once, directly).','Safari نے مائیک شروع نہیں کیا۔ شروع دوبارہ دبائیں (ایک بار سیدھا)۔'),
 interrupted:tt('The microphone was interrupted (a call or another app). Tap Start again.','مائیک رک گیا (کال یا کوئی اور ایپ)۔ شروع دوبارہ دبائیں۔'),
 nomic:tt('No microphone is available here. Open the app directly in Safari or Chrome.','یہاں مائیک دستیاب نہیں۔ ایپ کو براہِ راست Safari یا Chrome میں کھولیں۔'),denied:tt('Microphone permission is off. Allow it in the browser settings, then try again.','مائیک کی اجازت بند ہے۔ براؤزر کی سیٹنگ میں اجازت دے کر دوبارہ کوشش کریں۔'),
 vad:tt('Could not load the voice detector (it is part of the app). Reload the app once while online, then try again. Read-along will not run without it, so noise is never counted as reading.','آواز پہچاننے والا لوڈ نہیں ہو سکا (یہ ایپ کا حصہ ہے)۔ ایک بار آن لائن ایپ دوبارہ کھولیں۔ اس کے بغیر ساتھ ساتھ پڑھنا نہیں چلے گا تاکہ شور کبھی پڑھائی نہ گنا جائے۔'),
 busy:tt('The microphone is busy. Close other apps or calls that use it, then try again.','مائیک مصروف ہے۔ جو ایپ یا کال اسے استعمال کر رہی ہو بند کر کے دوبارہ کوشش کریں۔'),
 model:tt('Could not load the word checker (needs internet once). Switched to read-along, which works offline.','الفاظ جانچنے والا لوڈ نہیں ہو سکا (ایک بار انٹرنیٹ چاہیے)۔ ساتھ ساتھ پڑھنے پر آ گیا، جو بغیر انٹرنیٹ چلتا ہے۔')});
function liveUI(tt,les,root,kind,sel,reg,note){
 const slots=[...root.querySelectorAll(sel)],check=kind==='check',M=LMSG(tt);const lp=root.querySelector('#qLp');
 const words=check?WS(les).map(w=>w.t):null;
 const keys=check?WS(les).map(w=>'w'+w.k):null;
 const bars=[...root.querySelectorAll('.q-lb')];bars.forEach(b=>{b.hidden=true});
 const clear=()=>slots.forEach(el=>el.classList.remove('q-fa','q-pend','q-cur','q-ok','q-nc'));
 const paint=n=>{lp.classList.toggle('q-run',n>0);slots.forEach((el,i)=>{el.classList.toggle(check?'q-pend':'q-fa',i<n);el.classList.toggle('q-cur',i===n)});const c=slots[Math.min(n,slots.length-1)];
  if(c&&!matchMedia('(prefers-reduced-motion: reduce)').matches)c.scrollIntoView({block:'center',behavior:'smooth'});else c?.scrollIntoView({block:'center'})};
 const head=()=>`<div class="q-lh2"><b><span class="q-badge">● ${tt('LIVE','لائیو')}</span> ${check?tt('Checked reading','جانچ کے ساتھ پڑھنا'):tt('Read along','ساتھ ساتھ پڑھنا')}</b><span class="q-ltag ${check?'chk':'fol'}">${check?tt('words checked','الفاظ کی جانچ'):tt('tracked by voice','آواز سے ٹریک')}</span></div>
  <p class="muted q-ldesc">${check?tt('Each word you read lights up green with ✓ when it is confirmed. Grey = not confirmed: the model often cannot pick out a single word, so grey is not a mistake. Tap a grey word to hear it.','ہر پڑھا ہوا لفظ تصدیق ہونے پر ✓ کے ساتھ سبز ہوتا ہے۔ سرمئی = تصدیق نہیں ہوئی: ماڈل اکیلے لفظ کو اکثر نہیں پہچانتا، اس لیے سرمئی غلطی نہیں۔ سرمئی لفظ دبا کر سنیں۔'):tt('Each item lights up green as you read it. Letters and syllables are tracked by your voice, not graded: the app hears that you spoke, not what you said. Tap an item to say where you are.','ہر چیز پڑھتے ہی سبز ہوتی جاتی ہے۔ حروف اور مقطع آواز سے ٹریک ہوتے ہیں، ان کی جانچ نہیں ہوتی: ایپ سنتی ہے کہ آپ نے بولا، یہ نہیں کہ کیا بولا۔ اپنی جگہ بتانے کے لیے کسی چیز کو دبائیں۔')}</p>`;
 lp.hidden=false;lp.innerHTML=`${head()}${note?`<p class="q-lwarn">${note}</p>`:''}<div class="rc-chip q-lchip" id="qlChip"><i></i><span></span></div>
  <div class="q-meter" aria-hidden="true"><i id="qlLv"></i><b id="qlTr"></b></div><div class="q-dbg muted" id="qlDbg" aria-label="${tt('Microphone level','مائیک لیول')}">— dB</div>
  <div class="bar"><button class="btn" id="qlStop">${tt('Stop','روکیں')}</button><button class="btn ghost" id="qlHear">🔊 ${tt('Hear it','سنیں')}</button></div><div id="qlSum"></div>`;
 const chip=(k,t)=>{const c=lp.querySelector('#qlChip');if(c){c.className='rc-chip q-lchip '+k;c.querySelector('span').textContent=t}};
 const urlOf=i=>slots[i]?.dataset.u;
 const playHold=async u=>{if(!u)return;L.hold(true);try{await playU(u)}finally{setTimeout(()=>L.hold(false),250)}};
 let sumDone=false;
 const lastNc=()=>{const g=L.grades;let k=-1;for(const i of Object.keys(g))if(g[i]==='nc')k=Math.max(k,+i);return k};
 const H={slots,jump:i=>L.jump(i),stop:()=>{L.stop()},tap:i=>{const el=slots[i];if(check&&el?.classList.contains('q-nc')){playHold(urlOf(i));return}L.jump(i)}};
 const summary=()=>{if(sumDone)return;sumDone=true;const n=L.pos,g=L.grades;const ok=Object.values(g).filter(v=>v==='ok').length;
  if(check&&ok){const cr=crOf(les),P=load(cr),e=P.lessons[les.id]??={got:{},sessions:0};const ts=Date.now();Object.entries(g).forEach(([i,v])=>{if(v==='ok')e.got[keys[i]]=ts});e.last=ts;save(cr,P);const pr=root.querySelector('#qProg');if(pr)pr.textContent=`${doneN(P,les)}/${countOf(les)}`}
  const sm=lp.querySelector('#qlSum');if(!sm)return;
  const ncs=Object.keys(g).filter(i=>g[i]==='nc').map(Number);
  sm.innerHTML=`<div class="q-lsum">${check?`<b>${tt(`${ok} of ${slots.length} confirmed`,`${slots.length} میں سے ${ok} کی تصدیق ہوئی`)}</b><p class="muted">${tt('The rest were not confirmed, which is not the same as wrong. Tap one to hear it, or use Hear & repeat to rate yourself.','باقی کی تصدیق نہیں ہوئی، یہ غلط ہونے کے برابر نہیں۔ سننے کے لیے دبائیں، یا سنیں اور دہرائیں سے خود کو جانچیں۔')}</p>${ncs.length?`<div class="q-chips">${ncs.map(i=>`<button class="q-ch2" data-i="${i}"><span class="ar" dir="rtl" lang="ar">${esc(words[i])}</span> 🔊</button>`).join('')}</div>`:''}`:`<b>${tt(`Followed ${n} of ${slots.length}`,`${slots.length} میں سے ${n} پر ساتھ چلا`)}</b><p class="muted">${tt('This followed your voice only. It did not grade your reading: rate yourself with Hear & repeat.','یہ صرف آپ کی آواز کے ساتھ چلا۔ اس نے آپ کی تلاوت نہیں جانچی: سنیں اور دہرائیں سے خود کو جانچیں۔')}</p>`}
   <div class="bar"><button class="btn" id="qlAgain">${tt('Read again','دوبارہ پڑھیں')}</button></div></div>`;
  sm.querySelectorAll('.q-ch2').forEach(b=>{b.onclick=()=>playU(urlOf(+b.dataset.i))});
  sm.querySelector('#qlAgain').onclick=()=>{clear();liveUI(tt,les,root,kind,sel,reg)}};
 const L=createLive({mode:check?'check':'along',n:slots.length,words,
  onPos:n=>paint(n),onGrade:(i,v)=>{const el=slots[i];if(!el)return;el.classList.remove('q-ok','q-nc');el.classList.add(v==='ok'?'q-ok':'q-nc');if(v==='ok'){try{navigator.vibrate?.(8)}catch{/* no haptics */}}},
  onStatus:k=>{if(k==='stopped'){reg(null);chip('ready',M.stopped);summary();lp.querySelector('#qlStop')?.remove();lp.querySelector('#qlHear')?.remove();bars.forEach(b=>{b.hidden=false});if(check)releaseModel();return}
   chip(k==='hear'?'hear':k==='quiet'||k==='dead'||k==='suspended'?'warn':'listen',M[k]||'')},
  onLevel:(v,i)=>{const e=lp.querySelector('#qlLv');if(!e)return;e.style.transform=`scaleX(${v.toFixed(3)})`;if(i){const tr=lp.querySelector('#qlTr');if(tr)tr.style.insetInlineStart=`${(100*Math.max(0,Math.min(1,(i.trig+80)/60))).toFixed(1)}%`;
    const d=lp.querySelector('#qlDbg');if(d)d.textContent=`${tt('mic','مائیک')} ${Math.round(i.db)} dB · ${tt('line','لائن')} ${Math.round(i.trig)} dB · ${tt('room','کمرہ')} ${Math.round(i.floor)} dB · ${tt('heard','سنا')} ${i.items}`}},
  onProgress:p=>chip('load',tt(`Downloading the word checker… ${p}%`,`الفاظ جانچنے والا ڈاؤن لوڈ ہو رہا ہے… ${p}%`)),
  onDone:()=>{try{navigator.vibrate?.([20,40,20])}catch{/* no haptics */}L.stop()}});
 clear();paint(0);
 lp.querySelector('#qlStop').onclick=()=>L.stop();
 lp.querySelector('#qlHear').onclick=()=>{const k=lastNc();playHold(urlOf(k>=0?k:Math.min(L.pos,slots.length-1)))};
 const go=async()=>{chip('listen',check&&!modelCached()&&!window.__qFake?tt('Downloading the word checker once (about 19 MB)…','الفاظ جانچنے والا ایک بار ڈاؤن لوڈ ہو رہا ہے (تقریباً 19 MB)…'):M.warm);
  const r=await L.start();if(r.ok)return;reg(null);
  if(r.err==='model'&&check){bars.forEach(b=>{b.hidden=false});lp.hidden=true;liveUI(tt,les,root,'along',sel,reg,M.model);return}
  chip('warn',M[r.err]||M.denied);bars.forEach(b=>{b.hidden=false})};
 if(navigator.webdriver)window.__qlive=L;
 reg(H);go();
 return H}

// ---- hear & repeat with self-rating ----
function practice(C,tt,ur,I,les,root){
 const cr=crOf(les),P=load(cr),all=itemsOf(les),have=new Set(gotOf(P,les.id));
 let todo=all.filter(x=>!have.has(x.key));const SESSION=les.kind==='marks'?7:les.kind==='letters'?10:8;
 if(!todo.length)todo=all.slice();
 const q=todo.slice(0,SESSION).map(x=>({...x,tries:0}));const total=q.length;let got=0;const rated=[];
 const host=root.querySelector('#qBody');root.querySelector('#qaPrac').parentNode.hidden=true;const tc=root.querySelector('.q-tutor');if(tc)tc.hidden=true;
 const show=()=>{const it=q[0];
  if(!it){return finish()}
  host.innerHTML=`<div class="q-prac" id="qPrac"><div class="q-pp"><i style="width:${Math.round(100*got/total)}%"></i></div><small class="muted">${tt(`Learned ${got} of ${total}`,`${total} میں سے ${got} یاد`)}</small>
   <div class="q-big ar" dir="rtl" lang="ar" id="qBig">${esc(it.big)}</div>${it.alt?`<div class="q-big ar q-alt" dir="rtl" lang="ar">${esc(it.alt)}</div><small class="muted">${tt('Stopping form','وقف کی صورت')}</small>`:''}<div class="q-tr">${esc(it.tr)}</div>${it.sub?`<small class="muted">${esc(it.sub)}</small>`:''}${it.mean?`<small class="muted">${esc(tt(it.mean[0],it.mean[1]))}</small>`:''}
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
 const finish=()=>{stop();const P2=load(cr);const e=P2.lessons[les.id]??={got:{},sessions:0};const ts=Date.now();rated.forEach(k=>e.got[k]=ts);e.sessions++;e.last=ts;save(cr,P2);
  const n=countOf(les),g=doneN(P2,les);
  host.innerHTML=`<div class="card q-done" id="qDone"><b>${g>=n?tt('Lesson complete!','سبق مکمل!'):tt('Well done!','شاباش!')}</b><p>${tt(`You marked ${rated.length} of ${total} as learned. ${g} of ${n} in this lesson.`,`آپ نے ${total} میں سے ${rated.length} یاد کیے۔ اس سبق میں ${n} میں سے ${g}۔`)}</p>
   ${total_missed.length?`<p class="muted">${tt('The ones you missed will come back next time.','جو رہ گئے وہ اگلی بار دوبارہ آئیں گے۔')}</p>`:''}
   <div class="bar"><button class="btn" id="qMore">${tt('Practice more','مزید مشق')}</button><a class="btn ghost" href="${cr.href}">${tt('All lessons','تمام اسباق')}</a></div></div>`;
  host.querySelector('#qMore').onclick=()=>lesson(C,tt,ur,I,les);};
 show();
}
