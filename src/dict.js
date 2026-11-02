// Quran Dictionary (More tab): the 500 most frequent words of the Quran, covering ~81% of all word occurrences.
// Data is a precomputed offline JSON (public/offline/x/dict.json); progress lives in localStorage (qsDict).
import {esc} from './lib.js';
import * as K from './dict-core.js';
const KEY='qsDict';
const base=()=>import.meta.env.BASE_URL||'/';
const WD=()=>typeof navigator!=='undefined'&&navigator.webdriver;
const load=()=>{try{const o=JSON.parse(localStorage.getItem(KEY));return o&&o.w?o:{v:1,w:{}}}catch{return{v:1,w:{}}}};
const save=o=>{try{localStorage.setItem(KEY,JSON.stringify(o))}catch{/* storage full: progress is optional */}};
let DATA=null,IDX=null;
const V={q:'',lv:0,sort:'f',flt:'all'};
let Q=null,au=null;

async function data(C){if(!DATA){const d=await C.j(base()+'offline/x/dict.json');d.idx=d.words.map(K.indexOf);DATA=d}return DATA}

// ---- word audio: fetched once and kept in the Cache API so it plays offline afterwards ----
async function playWord(C,tt,path){
 const url='https://audio.qurancdn.com/'+path;
 if(WD()){(window.__qplays??=[]).push(url);return true}
 try{au?.pause()}catch{/* ignore */}
 let src=url;
 try{const c=await caches.open('qs-dict-audio');let r=await c.match(url);if(!r){const f=await fetch(url);if(!f.ok)throw new Error('x');await c.put(url,f.clone());r=f}src=URL.createObjectURL(await r.blob())}catch{/* fall back to streaming */}
 try{au=new Audio(src);await au.play();return true}catch{C.toast(tt('Word audio needs internet the first time','لفظ کی آواز کے لیے پہلی بار انٹرنیٹ درکار ہے'));return false}}

/** Reader helper: dictionary rank of word `w` (1-based) of ayah s:a, or 0. */
export async function rankOf(C,s,a,w){
 try{IDX??=await C.j(base()+'offline/x/dict-idx.json')}catch{return 0}
 const str=IDX[s];if(!str)return 0;
 const m=new RegExp(`(?:^|;)${a}:([^;]*)`).exec(str);if(!m)return 0;
 for(const p of m[1].split(',')){const [k,r]=p.split('.');if(+k===w)return +r}
 return 0}

const meaning=(w,ur)=>ur?w.u:w.e;
/** Exact ayah text with app token `ti` (0-based, split on spaces) highlighted. */
export const hiAyah=(txt,ti,cls='dc-hl')=>txt.split(' ').map((x,i)=>i===ti?`<mark class="${cls}">${esc(x)}</mark>`:esc(x)).join(' ');
export async function dictPage(C,tt,ur,I,a,b){
 C.setTitle(tt('Quran Dictionary','قرآن ڈکشنری'));C.app().onclick=null;au?.pause?.();BKH?.();BKH=null;
 let D;try{D=await data(C)}catch{C.app().innerHTML=`<section class="dsec"><div class="card"><p>${tt('The dictionary could not be loaded. Please try again.','ڈکشنری لوڈ نہیں ہو سکی۔ دوبارہ کوشش کریں۔')}</p></div></section>`;return}
 const P=load();
 if(a==='quiz')return quiz(C,tt,ur,I,D,P,b);
 if(a==='book')return book(C,tt,ur,I,D,b);
 if(a&&/^\d+$/.test(a)&&D.words[+a-1])return entry(C,tt,ur,I,D,P,+a);
 return list(C,tt,ur,I,D,P)}

// ---------------- list ----------------
function filtered(D,P){
 let ids=K.search(D.words,D.idx,V.q);
 const lv=V.lv?K.LEVELS[V.lv-1]:null;
 if(lv)ids=ids.filter(i=>D.words[i].r>=lv[0]&&D.words[i].r<=lv[1]);
 const st=r=>P.w[r];
 if(V.flt==='known')ids=ids.filter(i=>K.isKnown(st(D.words[i].r)));
 else if(V.flt==='learning')ids=ids.filter(i=>!K.isKnown(st(D.words[i].r)));
 else if(V.flt==='star')ids=ids.filter(i=>st(D.words[i].r)?.s);
 if(V.sort==='l')ids=[...ids].sort((x,y)=>D.words[y].r-D.words[x].r);
 else if(V.sort==='u')ids=[...ids].sort((x,y)=>(K.isKnown(st(D.words[x].r))?1:0)-(K.isKnown(st(D.words[y].r))?1:0)||D.words[x].r-D.words[y].r);
 return ids}
function rows(D,P,tt,ur){const ids=filtered(D,P);
 if(!ids.length)return `<p class="muted dc-empty" id="dcEmpty">${V.flt==='star'&&!V.q?tt('Your practice list is empty. Open a word and tap “Add to practice list”.','آپ کی مشق کی فہرست خالی ہے۔ کوئی لفظ کھولیں اور “مشق کی فہرست میں شامل کریں” دبائیں۔'):tt('No word matches. Try the Arabic with or without harakat, English, Urdu or transliteration.','کوئی لفظ نہیں ملا۔ عربی (حرکات کے ساتھ یا بغیر)، انگریزی، اردو یا تلفظ لکھ کر دیکھیں۔')}</p>`;
 return ids.map(i=>{const w=D.words[i],e=P.w[w.r],k=K.isKnown(e);
  return `<a class="dc-row${k?' known':''}" href="#/dict/${w.r}" data-r="${w.r}"><span class="dc-n">${w.r}</span><span class="ar dc-ar" dir="rtl" lang="ar">${esc(w.h)}</span><span class="mt"><b>${esc(w.t)}</b><small>${esc(meaning(w,ur()))}</small></span><span class="dc-c">${w.nt.toLocaleString()}×</span><span class="dc-k" aria-label="${k?tt('Known','معلوم'):''}">${k?'✓':e?.s?'★':''}</span></a>`}).join('')}
function list(C,tt,ur,I,D,P){
 const cv=K.coverage(D.words,P.w,D.total),due=K.dueCount(P.w),nS=Object.values(P.w).filter(e=>e.s).length;
 const lvLab=(i)=>{const [a,b]=K.LEVELS[i-1];const c=D.cov.find(x=>x[0]===b);return `<bdi dir="ltr">${a}–${b}${c?` · ${c[2]}%`:''}</bdi>`};
 const chip=(on,attr,txt)=>`<button class="dc-chip${on?' on':''}" ${attr} aria-pressed="${on?'true':'false'}">${txt}</button>`;
 C.app().innerHTML=`<section class="dsec dc-wrap">
 <div class="q-hero"><span class="ar q-hero-ar" dir="rtl" lang="ar">قُرْآن</span><div><b>${tt('Quran Dictionary','قرآن ڈکشنری')}</b><small>${tt(`The ${D.words.length} most frequent words of the Quran`,`قرآن کے ${D.words.length} سب سے زیادہ آنے والے الفاظ`)}</small></div></div>
 ${views(tt,'list')}
 <div class="card dc-prog" id="dcProg"><div class="dc-pr"><b class="dc-pct" id="dcPct"><bdi dir="ltr">${cv.pct}%</bdi></b><span>${tt('of the Quran’s words understood','قرآن کے الفاظ کا فہم')}<small class="muted"> ${tt(`${cv.words} of ${D.words.length} words known`,`${D.words.length} میں سے ${cv.words} الفاظ معلوم`)}</small></span></div>
  <div class="q-bar"><i style="width:${Math.min(100,cv.pct/D.cov[D.cov.length-1][2]*100)}%"></i></div>
  <small class="muted">${tt(`All ${D.words.length} words together make up <bdi dir="ltr">${D.cov[D.cov.length-1][2]}%</bdi> of the Quran’s ${D.total.toLocaleString()} words (every repeat counted). The first 100 alone cover <bdi dir="ltr">${D.cov[1][2]}%</bdi>.`,`یہ سب ${D.words.length} الفاظ مل کر قرآن کے ${D.total.toLocaleString()} الفاظ کا <bdi dir="ltr">${D.cov[D.cov.length-1][2]}%</bdi> بنتے ہیں (ہر تکرار شمار)۔ پہلے 100 ہی <bdi dir="ltr">${D.cov[1][2]}%</bdi> ہیں۔`)}</small>
  <div class="bar"><a class="btn" id="dcPractice" href="#/dict/quiz">${I.icon('play')} ${tt('Practise','مشق')}${due?` · ${tt(`${due} due`,`${due} باقی`)}`:''}</a></div></div>
 <input class="dc-q" id="dcQ" type="search" inputmode="search" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${tt('Search Arabic, English, اردو…','تلاش: عربی، English، اردو…')}" aria-label="${tt('Search the dictionary','ڈکشنری میں تلاش')}" value="${esc(V.q)}">
 <div class="dc-chips" id="dcLv" role="group" aria-label="${tt('Level','درجہ')}">${chip(!V.lv,'data-lv="0"',tt('All','سب'))}${K.LEVELS.map((_,i)=>chip(V.lv===i+1,`data-lv="${i+1}"`,lvLab(i+1))).join('')}</div>
 <div class="dc-chips" id="dcFl" role="group" aria-label="${tt('Filter','فلٹر')}">${chip(V.flt==='all','data-f="all"',tt('All','سب'))}${chip(V.flt==='learning','data-f="learning"',tt('Learning','سیکھ رہے'))}${chip(V.flt==='known','data-f="known"',tt('Known','معلوم'))}${chip(V.flt==='star','data-f="star"',`★ ${tt('Practice list','مشق کی فہرست')} (${nS})`)}</div>
 <label class="dc-sort">${tt('Sort','ترتیب')} <select id="dcSort"><option value="f"${V.sort==='f'?' selected':''}>${tt('Most frequent first','زیادہ آنے والے پہلے')}</option><option value="l"${V.sort==='l'?' selected':''}>${tt('Least frequent first','کم آنے والے پہلے')}</option><option value="u"${V.sort==='u'?' selected':''}>${tt('Not known first','نامعلوم پہلے')}</option></select></label>
 <p class="muted dc-cnt" id="dcCnt" role="status" aria-live="polite"></p>
 <div id="dcList" class="dc-list"></div></section>`;
 const draw=()=>{const n=filtered(D,P).length;document.getElementById('dcList').innerHTML=rows(D,P,tt,ur);document.getElementById('dcCnt').textContent=tt(`${n} words`,`${n} الفاظ`)};
 draw();
 const app=C.app();
 app.querySelector('#dcQ').oninput=e=>{V.q=e.target.value;draw()};
 app.querySelector('#dcSort').onchange=e=>{V.sort=e.target.value;draw()};
 app.querySelector('#dcLv').onclick=e=>{const b=e.target.closest('[data-lv]');if(!b)return;V.lv=+b.dataset.lv;app.querySelectorAll('#dcLv .dc-chip').forEach(x=>{const on=+x.dataset.lv===V.lv;x.classList.toggle('on',on);x.setAttribute('aria-pressed',on)});draw()};
 app.querySelector('#dcFl').onclick=e=>{const b=e.target.closest('[data-f]');if(!b)return;V.flt=b.dataset.f;app.querySelectorAll('#dcFl .dc-chip').forEach(x=>{const on=x.dataset.f===V.flt;x.classList.toggle('on',on);x.setAttribute('aria-pressed',on)});draw()}}

// ---------------- entry ----------------
/** The word sheet (number, word = meaning, ayah count, two examples). ids=false for book pages, where several sheets share the DOM. */
function sheet(w,r,tt,U,ids){return `<article class="card dc-sheet${ids?'':' bk-sheet'}"${ids?' id="dcSheet"':''}><div class="dc-frame">
  <p class="dc-no"><span>${tt('No.','نمبر')}: <bdi dir="ltr">${r}</bdi></span></p>
  <div class="dc-lm" aria-hidden="true"><span>${tt('Word','لفظ')}</span><i>⟷</i><span>${tt('Meaning','معنی')}</span></div>
  <div class="dc-eq"><button class="dc-hear"${ids?' id="dcHear"':''} data-au="${esc(w.s[0][6])}" aria-label="${tt('Hear the word','لفظ سنیں')}"><span class="ar dc-word" dir="rtl" lang="ar">${esc(w.h)}</span></button><b class="dc-eqs" aria-hidden="true">=</b><span class="dc-mns"><span class="dc-mn" dir="rtl" lang="ur">${esc(w.u)}</span>${U?'':`<span class="dc-mn dc-en" dir="ltr" lang="en">${esc(w.e)}</span>`}</span></div>
  <small class="dc-tr">${esc(w.t)}</small>
  <div class="dc-orn" aria-hidden="true"></div>
  <p class="dc-cnt2"${ids?' id="dcCount"':''} data-na="${w.na}">${tt(`This word occurs in <b>${w.na.toLocaleString()}</b> ayahs of the Quran`,`یہ لفظ قرآنِ کریم کی <b>${w.na.toLocaleString()}</b> آیات میں آتا ہے`)}</p>
  <small class="dc-basis muted">${tt('Counted once per ayah, in any of its forms, including with attached prefixes or suffixes.','ہر آیت ایک بار شمار، لفظ کی کسی بھی شکل میں، سابقے یا لاحقے کے ساتھ بھی۔')}</small>
  <h2 class="dc-misl"><span>${tt('For example','مثلاً')}</span></h2>
  <ol class="dc-exs">${w.x.map((x,i)=>{const sm=w.s[i];return `<li><a class="dc-ex2" href="#/surah/${x[0]}/${x[1]}" data-s="${x[0]}" data-a="${x[1]}" aria-label="${tt(`Open ayah ${x[0]}:${x[1]} in the reader`,`آیت ${x[0]}:${x[1]} پڑھنے کے لیے کھولیں`)}"><p class="ar dc-ay" dir="rtl" lang="ar">${hiAyah(sm[3],x[2])}</p><p class="tr" dir="${U?'rtl':'ltr'}">${esc(U?sm[5]:sm[4])}</p><span class="dc-ref"><bdi dir="ltr">[${x[0]}:${x[1]}]</bdi></span></a></li>`}).join('')}</ol>
 </div></article>`}
function entry(C,tt,ur,I,D,P,r){
 const w=D.words[r-1],e=P.w[r],U=ur(),k=K.isKnown(e);
 const nav=(d)=>{const n=r+d;return n>=1&&n<=D.words.length?`<a class="dc-nv" href="#/dict/${n}" aria-label="${d<0?tt('Previous word','پچھلا لفظ'):tt('Next word','اگلا لفظ')}">${d<0?'‹':'›'}</a>`:'<span class="dc-nv off"></span>'};
 const pct=D.cov.find(c=>c[0]>=r)?.[2];
 C.app().innerHTML=`<section class="dsec dc-wrap dc-entry" data-r="${r}">
 <div class="dc-top"><a class="btn ghost" href="#/dict">‹ ${tt('Dictionary','ڈکشنری')}</a><a class="btn ghost dc-tobook" id="dcToBook" href="#/dict/book/${r}">${tt('Book','کتاب')}</a><span class="dc-nav">${nav(-1)}<small>${r} / ${D.words.length}</small>${nav(1)}</span></div>
 ${sheet(w,r,tt,U,true)}
 <div class="dc-facts"><div><small>${tt('Root','مادہ')}</small><b class="ar" dir="rtl" lang="ar">${w.rt?esc(w.rt):'—'}</b></div><div><small>${tt('Appears','تعداد')}</small><b>${w.nt.toLocaleString()}×</b></div><div><small>${tt('Rank','درجہ')}</small><b>#${r}</b></div><div><small>${tt('Type','قسم')}</small><b>${esc(K.posLabel(w.p,U))}</b></div></div>
 <div class="bar dc-act"><button class="btn${k?'':' ghost'}" id="dcKnow" aria-pressed="${k}">${k?'✓ '+tt('Known','معلوم'):tt('I know this word','مجھے یہ لفظ آتا ہے')}</button><button class="btn${e?.s?'':' ghost'}" id="dcStar" aria-pressed="${!!e?.s}">${e?.s?'★ '+tt('In practice list','مشق کی فہرست میں'):'☆ '+tt('Add to practice list','مشق کی فہرست میں شامل کریں')}</button></div>
 <p class="muted dc-note">${tt(`In all its forms the word appears ${w.nt.toLocaleString()} times in ${w.na.toLocaleString()} ayahs. Knowing the first ${D.cov.find(c=>c[0]>=r)?.[0]} words covers <bdi dir="ltr">${pct}%</bdi>. Tap the word to hear it; tap an example to open it in the reader.`,`یہ لفظ اپنی تمام شکلوں میں ${w.na.toLocaleString()} آیات میں ${w.nt.toLocaleString()} بار آیا ہے۔ پہلے ${D.cov.find(c=>c[0]>=r)?.[0]} الفاظ جاننے سے <bdi dir="ltr">${pct}%</bdi> سمجھ آتا ہے۔ لفظ دبا کر سنیں؛ مثال دبا کر آیت کھولیں۔`)}</p></section>`;
 const app=C.app();
 app.onclick=ev=>{const h=ev.target.closest('[data-au]');if(h)playWord(C,tt,h.dataset.au)};
 app.querySelector('#dcKnow').onclick=()=>{const p=load();p.w[r]=K.markKnown(p.w[r],!K.isKnown(p.w[r]));save(p);entry(C,tt,ur,I,D,p,r)};
 app.querySelector('#dcStar').onclick=()=>{const p=load();const o={...(p.w[r]||{})};o.s=!o.s;if(!o.s&&!o.l&&!o.k)delete p.w[r];else p.w[r]=o;save(p);entry(C,tt,ur,I,D,p,r)}}

// ---------------- practice: flashcards and multiple choice, spaced repetition ----------------
function quiz(C,tt,ur,I,D,P,mode){
 const nS=Object.values(P.w).filter(e=>e.s).length,due=K.dueCount(P.w);
 if(mode!=='cards'&&mode!=='mc'&&mode!=='cards-star'&&mode!=='mc-star'){
  C.app().innerHTML=`<section class="dsec dc-wrap"><div class="dc-top"><a class="btn ghost" href="#/dict">‹ ${tt('Dictionary','ڈکشنری')}</a></div>
  <div class="q-hero"><span class="ar q-hero-ar" dir="rtl" lang="ar">مشق</span><div><b>${tt('Practise words','الفاظ کی مشق')}</b><small>${tt('10 words a session: due reviews first, then new words, most frequent first.','ہر نشست میں 10 الفاظ: پہلے دہرائی، پھر نئے الفاظ، زیادہ آنے والے پہلے۔')}</small></div></div>
  <p class="muted">${tt(`${due} due for review now`,`${due} ابھی دہرائی کے لیے تیار`)}</p>
  <a class="dc-mode" href="#/dict/quiz/cards" id="dcCards"><b>${tt('Flashcards','فلیش کارڈز')}</b><small>${tt('See the Arabic, recall the meaning, flip, and say if you knew it.','عربی دیکھیں، معنی یاد کریں، پلٹیں، اور بتائیں کہ آتا تھا یا نہیں۔')}</small></a>
  <a class="dc-mode" href="#/dict/quiz/mc" id="dcMc"><b>${tt('Quiz','کوئز')}</b><small>${tt('Choose the right meaning (or the right Arabic word) from four options.','چار میں سے درست معنی (یا درست عربی لفظ) چنیں۔')}</small></a>
  ${nS?`<a class="dc-mode" href="#/dict/quiz/cards-star"><b>★ ${tt('Practice list only','صرف مشق کی فہرست')}</b><small>${tt(`${nS} words you added`,`آپ کے شامل کردہ ${nS} الفاظ`)}</small></a>`:''}</section>`;return}
 const star=mode.endsWith('-star'),kind=mode.startsWith('mc')?'mc':'cards';
 const only=star?new Set(Object.entries(P.w).filter(([,e])=>e.s).map(([r])=>+r)):null;
 Q={list:K.buildSession(D.words,P.w,Date.now(),10,only),i:0,right:0,flip:false,kind,star,pick:null,res:[]};
 if(!Q.list.length){C.app().innerHTML=`<section class="dsec dc-wrap"><div class="dc-top"><a class="btn ghost" href="#/dict">‹ ${tt('Dictionary','ڈکشنری')}</a></div><div class="card"><p>${tt('Nothing to practise right now. Come back later for your reviews.','ابھی مشق کے لیے کچھ نہیں۔ دہرائی کے لیے بعد میں آئیں۔')}</p></div></section>`;return}
 Q.opts=Q.list.map((r,i)=>{const w=D.words[r-1];return {rev:i%2===1,opts:K.options(D.words,w,ur()?'ur':'en')}});
 step(C,tt,ur,I,D)}
function step(C,tt,ur,I,D){
 const app=C.app();
 if(Q.i>=Q.list.length)return summary(C,tt,ur,I,D);
 const r=Q.list[Q.i],w=D.words[r-1],U=ur(),n=Q.list.length;
 const head=`<div class="dc-top"><a class="btn ghost" href="#/dict/quiz">‹ ${tt('Back','واپس')}</a><small class="dc-pg" id="dcPg">${Q.i+1} / ${n}</small></div><div class="q-bar"><i style="width:${100*Q.i/n}%"></i></div>`;
 if(Q.kind==='cards'){
  const f=Q.flip,sm=w.s[0];
  app.innerHTML=`<section class="dsec dc-wrap">${head}<div class="card dc-fc" id="dcCard"><div class="dc-hear dc-nohear"><span class="ar dc-word" dir="rtl" lang="ar">${esc(w.h)}</span></div>
  ${f?`<b class="dc-tr">${esc(w.t)}</b><p class="dc-mn">${esc(meaning(w,U))}</p><p class="dc-mn2 muted" ${U?'':'dir="rtl"'}>${esc(meaning(w,!U))}</p><small class="muted">${tt('Root','مادہ')}: <span class="ar" dir="rtl" lang="ar">${esc(w.rt||'—')}</span> · ${w.nt.toLocaleString()}×</small><p class="ar dc-ay" dir="rtl" lang="ar">${hiAyah(sm[3],w.x[0][2],'dc-hw dc-nohear')}</p>`:`<button class="btn" id="dcFlip">${tt('Show meaning','معنی دکھائیں')}</button>`}</div>
  ${f?`<div class="bar dc-ans"><button class="btn ghost" id="dcNo">✗ ${tt('Not yet','ابھی نہیں')}</button><button class="btn" id="dcYes">✓ ${tt('I knew it','مجھے آتا تھا')}</button></div>`:''}</section>`;
  app.onclick=ev=>{
   if(ev.target.closest('#dcFlip')){Q.flip=true;step(C,tt,ur,I,D);return}
   const y=ev.target.closest('#dcYes'),no=ev.target.closest('#dcNo');if(y||no)answer(C,tt,ur,I,D,r,!!y)};
 }else{
  const {rev,opts}=Q.opts[Q.i],pk=Q.pick;
  const label=o=>rev?`<span class="ar" dir="rtl" lang="ar">${esc(o.h)}</span>`:esc(K.brief(meaning(o,U)));
  app.innerHTML=`<section class="dsec dc-wrap">${head}<div class="card dc-fc">${rev?`<small class="muted">${tt('Which Arabic word means…','کون سا عربی لفظ اس معنی کا ہے…')}</small><p class="dc-mn" id="dcQ">${esc(K.brief(meaning(w,U)))}</p>`:`<div class="dc-hear dc-nohear"><span class="ar dc-word" dir="rtl" lang="ar">${esc(w.h)}</span></div><small class="muted">${tt('What does it mean?','اس کا کیا مطلب ہے؟')}</small>`}</div>
  <div class="dc-opts" id="dcOpts">${opts.map(o=>`<button class="dc-opt${pk?(o.r===r?' ok':o.r===pk?' bad':''):''}" data-r="${o.r}" ${pk?'disabled':''}>${label(o)}</button>`).join('')}</div>
  ${pk?`<p class="dc-fb" role="status">${pk===r?'✓ '+tt('Correct','درست'):'✗ '+tt('Not quite: ','درست نہیں: ')+(pk===r?'':esc(meaning(w,U)))}</p><div class="bar"><button class="btn" id="dcNext">${Q.i+1>=n?tt('Finish','مکمل'):tt('Next','اگلا')} ›</button></div>`:''}</section>`;
  app.onclick=ev=>{
   const o=ev.target.closest('.dc-opt');if(o&&!Q.pick){Q.pick=+o.dataset.r;const p=load();p.w[r]=K.grade(p.w[r],Q.pick===r);save(p);Q.res.push(Q.pick===r);if(Q.pick===r)Q.right++;step(C,tt,ur,I,D);return}
   if(ev.target.closest('#dcNext')){Q.i++;Q.pick=null;step(C,tt,ur,I,D)}}}}
function answer(C,tt,ur,I,D,r,ok){const p=load();p.w[r]=K.grade(p.w[r],ok);save(p);Q.res.push(ok);if(ok)Q.right++;Q.i++;Q.flip=false;step(C,tt,ur,I,D)}
function summary(C,tt,ur,I,D){
 const P=load(),cv=K.coverage(D.words,P.w,D.total),n=Q.list.length,miss=Q.list.filter((_,i)=>Q.res[i]===false);
 C.app().innerHTML=`<section class="dsec dc-wrap"><div class="card dc-sum" id="dcSum"><b class="dc-pct">${Q.right} / ${n}</b><p>${tt('right this session','اس نشست میں درست')}</p>
 <p>${tt(`You now know ${cv.words} words — <bdi dir="ltr">${cv.pct}%</bdi> of the Quran’s words.`,`اب آپ ${cv.words} الفاظ جانتے ہیں — قرآن کے الفاظ کا <bdi dir="ltr">${cv.pct}%</bdi>۔`)}</p>
 ${miss.length?`<small class="muted">${tt('To review soon:','جلد دہرائیں:')}</small><div class="dc-miss">${miss.map(r=>`<a class="dc-pill" href="#/dict/${r}"><span class="ar" dir="rtl" lang="ar">${esc(D.words[r-1].h)}</span> ${esc(K.brief(meaning(D.words[r-1],ur())))}</a>`).join('')}</div>`:''}
 <div class="bar"><button class="btn" id="dcAgain">${tt('Practise again','دوبارہ مشق')}</button><a class="btn ghost" href="#/dict">${tt('Dictionary','ڈکشنری')}</a></div></div></section>`;
 const mode=Q.kind+(Q.star?'-star':'');Q=null;
 C.app().querySelector('#dcAgain').onclick=()=>quiz(C,tt,ur,I,D,load(),mode)}

// ---------------- book: the word sheets as pages with a 3D page turn ----------------
/** List / Book switch shown on the dictionary screens. */
const views=(tt,cur)=>`<div class="dc-view" role="group" aria-label="${tt('View','انداز')}"><a id="dcViewList" href="#/dict" class="${cur==='list'?'on':''}" aria-current="${cur==='list'?'page':'false'}">☰ ${tt('List','فہرست')}</a><a id="dcViewBook" href="#/dict/book" class="${cur==='book'?'on':''}" aria-current="${cur==='book'?'page':'false'}">❦ ${tt('Book','کتاب')}</a></div>`;
const BKEY='qsDictBook';
export const bookLast=n=>{try{const v=+localStorage.getItem(BKEY);return v>=1&&v<=n?v:1}catch{return 1}};
/** First page of the view that shows word x: in a two-page spread pages go 1–2, 3–4, … */
export const spreadStart=(x,two)=>two?(x%2?x:x-1):x;
/** Physical turn: does the moving page travel right→left? LTR next and RTL previous do. */
export const turnsLeft=(dir,rtl)=>(dir>0)!==rtl;
let BKH=null; // listeners of the open book, removed when it re-renders or the route changes
function book(C,tt,ur,I,D,b){
 BKH?.();BKH=null;
 const N=D.words.length,U=ur(),rtl=U,app=C.app();app.onclick=null;
 const mqS=matchMedia('(min-width: 900px) and (orientation: landscape)'),mqR=matchMedia('(prefers-reduced-motion: reduce)');
 let two=mqS.matches,r=spreadStart(Math.min(N,Math.max(1,+b||bookLast(N))),two),busy=false;
 app.innerHTML=`<section class="dsec dc-wrap dc-bookv">
 ${views(tt,'book')}
 <form class="bk-bar" id="bkJump" role="search"><input class="dc-q" id="bkQ" type="search" inputmode="search" autocomplete="off" spellcheck="false" placeholder="${tt('Go to word no. or search…','لفظ نمبر یا تلاش…')}" aria-label="${tt('Go to a word by number or search','نمبر یا تلاش سے لفظ پر جائیں')}"><button class="btn ghost" id="bkGo">${tt('Go','جائیں')}</button></form>
 <div class="bk-book${two?' two':''}${rtl?' rtl':''}" id="bkBook" dir="ltr" aria-roledescription="${tt('book','کتاب')}">
  <div class="bk-stage" id="bkStage"></div>
  <button class="bk-edge bk-el" id="bkL" aria-label="${rtl?tt('Next page','اگلا صفحہ'):tt('Previous page','پچھلا صفحہ')}">‹</button>
  <button class="bk-edge bk-er" id="bkR" aria-label="${rtl?tt('Previous page','پچھلا صفحہ'):tt('Next page','اگلا صفحہ')}">›</button>
 </div>
 <p class="bk-ind" id="bkInd" role="status" aria-live="polite"></p>
 <p class="muted bk-hint">${tt('Swipe or tap the page edge to turn. Tap the word to hear it; tap an example to open it.','صفحہ پلٹنے کے لیے سوائپ کریں یا کنارہ دبائیں۔ لفظ دبا کر سنیں؛ مثال دبا کر آیت کھولیں۔')}</p></section>`;
 const bk=app.querySelector('#bkBook'),st=app.querySelector('#bkStage'),ind=app.querySelector('#bkInd');
 const page=x=>x<1||x>N?`<div class="bk-page bk-blank" aria-hidden="true"></div>`:`<div class="bk-page" data-r="${x}"><div class="bk-in">${sheet(D.words[x-1],x,tt,U,false)}<p class="bk-pn"><bdi dir="ltr">${x}</bdi></p></div></div>`;
 const pair=x=>rtl?[x+1,x]:[x,x+1]; // [left, right] of a spread
 const slot=(pos,x)=>`<div class="bk-slot bk-${pos}">${page(x)}</div>`;
 const fit=()=>{if(!bk.isConnected){BKH?.();return}const nav=document.querySelector('body > nav'),top=st.getBoundingClientRect().top+scrollY;st.style.height=Math.max(420,innerHeight-top-(nav?nav.offsetHeight:0)-14)+'px'};
 const rest=()=>{
  st.innerHTML=two?slot('l',pair(r)[0])+slot('r',pair(r)[1]):slot('one',r);
  const last=two?Math.min(N,r+1):r;
  ind.innerHTML=`${tt('Page','صفحہ')} <bdi dir="ltr">${two&&last>r?`${r}–${last}`:r} / ${N}</bdi>`;
  bk.dataset.r=r;app.querySelector('#bkL').disabled=rtl?r+(two?2:1)>N:r<=1;app.querySelector('#bkR').disabled=rtl?r<=1:r+(two?2:1)>N;
  try{localStorage.setItem(BKEY,String(r))}catch{/* optional */}
  try{history.replaceState(history.state,'','#/dict/book/'+r)}catch{/* optional */}};
 // Builds the turning leaf for a flip of `dir` (+1 next, -1 previous); returns set(p) for progress 0..1, or null at either end.
 const start=dir=>{
  const step=two?2:1,t=r+dir*step;if(t<1||t>N)return null;
  const L=turnsLeft(dir,rtl);let leafPos,front,back,under,a0,a1,origin;
  if(two){const [cl,cr]=pair(r),[nl,nr]=pair(t);
   if(L){leafPos='r';front=cr;back=nl;under=slot('l',cl)+slot('r',nr);origin='left';a0=0;a1=-180}
   else{leafPos='l';front=cl;back=nr;under=slot('l',nl)+slot('r',cr);origin='right';a0=0;a1=180}}
  else{const sg=rtl?1:-1;leafPos='one';origin=rtl?'right':'left';
   if(dir>0){front=r;back=0;under=slot('one',t);a0=0;a1=sg*180}else{front=t;back=0;under=slot('one',r);a0=sg*180;a1=0}}
  const sc=st.querySelector('.bk-in')?.scrollTop||0;
  st.innerHTML=under+`<i class="bk-cast bk-cast-${leafPos}"></i><div class="bk-leaf bk-${leafPos}" style="transform-origin:${origin} center"><div class="bk-face bk-front">${page(front)}<i class="bk-sh"></i></div><div class="bk-face bk-back">${back?page(back):'<div class="bk-page bk-blank"></div>'}<i class="bk-sh"></i></div></div>`;
  if(dir>0&&!two){const f=st.querySelector('.bk-front .bk-in');if(f)f.scrollTop=sc}
  const leaf=st.querySelector('.bk-leaf'),sh=st.querySelectorAll('.bk-sh'),cast=st.querySelector('.bk-cast');
  return {t,set(p){const a=a0+(a1-a0)*p,s=Math.sin(Math.abs(a)/180*Math.PI);leaf.style.transform=`rotateY(${a}deg)`;sh.forEach(e=>e.style.opacity=(s*.55).toFixed(3));cast.style.opacity=(s*.6).toFixed(3)}}};
 const ease=x=>x<.5?2*x*x:1-(-2*x+2)**2/2;
 const animate=(f,p0,p1,done)=>{const ms=Math.max(120,620*Math.abs(p1-p0)),t0=performance.now();
  const tick=now=>{if(!st.isConnected)return;const k=Math.min(1,(now-t0)/ms);f.set(p0+(p1-p0)*ease(k));if(k<1)requestAnimationFrame(tick);else done()};requestAnimationFrame(tick)};
 const go=(t,how)=>{t=spreadStart(Math.min(N,Math.max(1,t)),two);if(t===r||busy)return;
  if(how==='fade'||mqR.matches||Math.abs(t-r)>(two?2:1)){busy=true;st.classList.add('bk-fade');setTimeout(()=>{r=t;rest();st.classList.remove('bk-fade');busy=false},mqR.matches?120:180);return}
  flip(t>r?1:-1)};
 const flip=dir=>{if(busy)return;if(mqR.matches){const t=r+dir*(two?2:1);if(t>=1&&t<=N)go(t,'fade');return}
  const f=start(dir);if(!f)return;busy=true;f.set(0);animate(f,0,1,()=>{r=f.t;rest();busy=false})};
 const byEdge=right=>flip(turnsLeft(1,rtl)===right?1:-1); // the right edge turns the page leftwards
 app.querySelector('#bkL').onclick=()=>byEdge(false);app.querySelector('#bkR').onclick=()=>byEdge(true);
 // swipe: the page follows the finger; let go past 30% (or flick) to finish the turn
 let g=null,eat=false,px=null;
 st.addEventListener('pointerdown',e=>{px=e.clientX;if(busy||e.button>0)return;g={x:e.clientX,y:e.clientY,t:performance.now(),f:null,id:e.pointerId}});
 st.addEventListener('pointermove',e=>{if(!g||e.pointerId!==g.id)return;const dx=e.clientX-g.x,dy=e.clientY-g.y;
  if(!g.f){if(Math.abs(dx)<12||Math.abs(dx)<Math.abs(dy)*1.2){if(Math.abs(dy)>14)g=null;return}
   if(mqR.matches){g.fade=true;return}
   const dir=dx<0?(turnsLeft(1,rtl)?1:-1):(turnsLeft(1,rtl)?-1:1);g.f=start(dir);if(!g.f){g=null;return}busy=true;try{st.setPointerCapture(e.pointerId)}catch{/* */}}
  if(g.f){g.p=Math.min(1,Math.max(0,Math.abs(dx)/(st.clientWidth*(two?.5:.85))));g.f.set(g.p)}});
 const up=e=>{if(!g||e.pointerId!==g.id)return;const G=g;g=null;const dx=e.clientX-G.x;
  if(Math.abs(dx)>8)eat=true;
  if(G.fade&&e.type==='pointerup'){const dir=dx<0?(turnsLeft(1,rtl)?1:-1):(turnsLeft(1,rtl)?-1:1);flip(dir);return}
  if(!G.f)return;const v=Math.abs(dx)/Math.max(1,performance.now()-G.t),ok=e.type==='pointerup'&&(G.p>.3||v>.5&&G.p>.08);
  animate(G.f,G.p||0,ok?1:0,()=>{if(ok)r=G.f.t;rest();busy=false})};
 st.addEventListener('pointerup',up);st.addEventListener('pointercancel',up);
 st.addEventListener('click',e=>{const moved=px!=null&&Math.abs(e.clientX-px)>8;px=null;if(eat||moved){eat=false;e.preventDefault();e.stopPropagation();return}
  const h=e.target.closest('[data-au]');if(h){e.preventDefault();playWord(C,tt,h.dataset.au);return}
  if(e.target.closest('a,button,input'))return;
  const b=st.getBoundingClientRect(),x=(e.clientX-b.left)/b.width;if(x<.2)byEdge(false);else if(x>.8)byEdge(true)},true);
 app.querySelector('#bkJump').onsubmit=e=>{e.preventDefault();const q=app.querySelector('#bkQ').value.trim();if(!q)return;
  let t=/^\d+$/.test(q)?+q:0;if(!t){const i=K.search(D.words,D.idx,q)[0];t=i!=null?D.words[i].r:0}
  if(!t||t>N){C.toast(tt('No word matches.','کوئی لفظ نہیں ملا۔'));return}
  app.querySelector('#bkQ').blur();go(t,'fade')};
 const key=e=>{if(!bk.isConnected){BKH?.();return}if(e.target.closest?.('input,textarea,select'))return;
  if(e.key==='ArrowLeft')byEdge(false);else if(e.key==='ArrowRight')byEdge(true)};
 const mq=()=>{if(!bk.isConnected){BKH?.();return}two=mqS.matches;bk.classList.toggle('two',two);r=spreadStart(r,two);fit();rest()};
 document.addEventListener('keydown',key);addEventListener('resize',fit);mqS.addEventListener?.('change',mq);
 BKH=()=>{document.removeEventListener('keydown',key);removeEventListener('resize',fit);mqS.removeEventListener?.('change',mq)};
 fit();rest()}
