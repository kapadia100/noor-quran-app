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
const ayahWords=(sm,ur,tt)=>{const ws=sm[3].split(' ');
 return `<p class="ar dc-ay" dir="rtl" lang="ar">${ws.map((x,i)=>i===sm[2]-1?`<button class="dc-hw" data-au="${esc(sm[6])}" aria-label="${tt('Hear this word','یہ لفظ سنیں')}">${esc(x)}</button>`:esc(x)).join(' ')}</p>`};

export async function dictPage(C,tt,ur,I,a,b){
 C.setTitle(tt('Quran Dictionary','قرآن ڈکشنری'));C.app().onclick=null;au?.pause?.();
 let D;try{D=await data(C)}catch{C.app().innerHTML=`<section class="dsec"><div class="card"><p>${tt('The dictionary could not be loaded. Please try again.','ڈکشنری لوڈ نہیں ہو سکی۔ دوبارہ کوشش کریں۔')}</p></div></section>`;return}
 const P=load();
 if(a==='quiz')return quiz(C,tt,ur,I,D,P,b);
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
  return `<a class="dc-row${k?' known':''}" href="#/dict/${w.r}" data-r="${w.r}"><span class="dc-n">${w.r}</span><span class="ar dc-ar" dir="rtl" lang="ar">${esc(w.h)}</span><span class="mt"><b>${esc(w.t)}</b><small>${esc(meaning(w,ur()))}</small></span><span class="dc-c">${w.n.toLocaleString()}×</span><span class="dc-k" aria-label="${k?tt('Known','معلوم'):''}">${k?'✓':e?.s?'★':''}</span></a>`}).join('')}
function list(C,tt,ur,I,D,P){
 const cv=K.coverage(D.words,P.w,D.total),due=K.dueCount(P.w),nS=Object.values(P.w).filter(e=>e.s).length;
 const lvLab=(i)=>{const [a,b]=K.LEVELS[i-1];const c=D.cov.find(x=>x[0]===b);return `<bdi dir="ltr">${a}–${b}${c?` · ${c[2]}%`:''}</bdi>`};
 const chip=(on,attr,txt)=>`<button class="dc-chip${on?' on':''}" ${attr} aria-pressed="${on?'true':'false'}">${txt}</button>`;
 C.app().innerHTML=`<section class="dsec dc-wrap">
 <div class="q-hero"><span class="ar q-hero-ar" dir="rtl" lang="ar">قُرْآن</span><div><b>${tt('Quran Dictionary','قرآن ڈکشنری')}</b><small>${tt(`The ${D.words.length} most frequent words of the Quran`,`قرآن کے ${D.words.length} سب سے زیادہ آنے والے الفاظ`)}</small></div></div>
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
function entry(C,tt,ur,I,D,P,r){
 const w=D.words[r-1],e=P.w[r],U=ur(),k=K.isKnown(e);
 const nav=(d)=>{const n=r+d;return n>=1&&n<=D.words.length?`<a class="dc-nv" href="#/dict/${n}" aria-label="${d<0?tt('Previous word','پچھلا لفظ'):tt('Next word','اگلا لفظ')}">${d<0?'‹':'›'}</a>`:'<span class="dc-nv off"></span>'};
 const pct=D.cov.find(c=>c[0]>=r)?.[2];
 C.app().innerHTML=`<section class="dsec dc-wrap dc-entry" data-r="${r}">
 <div class="dc-top"><a class="btn ghost" href="#/dict">‹ ${tt('Dictionary','ڈکشنری')}</a><span class="dc-nav">${nav(-1)}<small>${r} / ${D.words.length}</small>${nav(1)}</span></div>
 <div class="card dc-big"><button class="dc-hear" id="dcHear" data-au="${esc(w.s[0][6])}" aria-label="${tt('Hear the word','لفظ سنیں')}"><span class="ar dc-word" dir="rtl" lang="ar">${esc(w.h)}</span><span class="dc-sp" aria-hidden="true">🔊</span></button>
  <b class="dc-tr">${esc(w.t)}</b>
  <p class="dc-mn">${esc(meaning(w,U))}</p><p class="dc-mn2 muted" ${U?'':'dir="rtl"'}>${esc(meaning(w,!U))}</p></div>
 <div class="dc-facts"><div><small>${tt('Root','مادہ')}</small><b class="ar" dir="rtl" lang="ar">${w.rt?esc(w.rt):'—'}</b></div><div><small>${tt('Appears','تعداد')}</small><b>${w.n.toLocaleString()}×</b></div><div><small>${tt('Rank','درجہ')}</small><b>#${r}</b></div><div><small>${tt('Type','قسم')}</small><b>${esc(K.posLabel(w.p,U))}</b></div></div>
 <p class="muted dc-note">${tt(`Appears ${w.n.toLocaleString()} times, in all its forms (<bdi dir="ltr">${(100*w.n/D.total).toFixed(2)}%</bdi> of the Quran’s words). Knowing the first ${D.cov.find(c=>c[0]>=r)?.[0]} words covers <bdi dir="ltr">${pct}%</bdi>.`,`یہ لفظ اپنی تمام شکلوں میں ${w.n.toLocaleString()} بار آیا ہے (قرآن کے الفاظ کا <bdi dir="ltr">${(100*w.n/D.total).toFixed(2)}%</bdi>)۔ پہلے ${D.cov.find(c=>c[0]>=r)?.[0]} الفاظ جاننے سے <bdi dir="ltr">${pct}%</bdi> سمجھ آتا ہے۔`)}</p>
 <div class="bar dc-act"><button class="btn${k?'':' ghost'}" id="dcKnow" aria-pressed="${k}">${k?'✓ '+tt('Known','معلوم'):tt('I know this word','مجھے یہ لفظ آتا ہے')}</button><button class="btn${e?.s?'':' ghost'}" id="dcStar" aria-pressed="${!!e?.s}">${e?.s?'★ '+tt('In practice list','مشق کی فہرست میں'):'☆ '+tt('Add to practice list','مشق کی فہرست میں شامل کریں')}</button></div>
 <h2 class="h3">${tt('In the Quran','قرآن میں')}</h2>
 ${w.s.map(s=>`<div class="card dc-ex"><small class="muted">${s[0]}:${s[1]}</small>${ayahWords(s,U,tt)}<p class="tr" dir="${U?'rtl':'ltr'}">${esc(U?s[5]:s[4])}</p><a class="dc-open" href="#/surah/${s[0]}/${s[1]}">${tt('Open this ayah','یہ آیت کھولیں')} ›</a></div>`).join('')}
 <p class="muted dc-note">${tt('Tap the word or any highlighted word to hear it. The highlighted word may appear in a different grammatical form from the headword above.','لفظ یا نمایاں لفظ دبا کر سنیں۔ نمایاں لفظ اوپر کے لفظ سے مختلف گرامر کی شکل میں ہو سکتا ہے۔')}</p></section>`;
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
  app.innerHTML=`<section class="dsec dc-wrap">${head}<div class="card dc-fc" id="dcCard"><button class="dc-hear" data-au="${esc(sm[6])}" aria-label="${tt('Hear the word','لفظ سنیں')}"><span class="ar dc-word" dir="rtl" lang="ar">${esc(w.h)}</span><span class="dc-sp" aria-hidden="true">🔊</span></button>
  ${f?`<b class="dc-tr">${esc(w.t)}</b><p class="dc-mn">${esc(meaning(w,U))}</p><p class="dc-mn2 muted" ${U?'':'dir="rtl"'}>${esc(meaning(w,!U))}</p><small class="muted">${tt('Root','مادہ')}: <span class="ar" dir="rtl" lang="ar">${esc(w.rt||'—')}</span> · ${w.n.toLocaleString()}×</small>${ayahWords(sm,U,tt)}`:`<button class="btn" id="dcFlip">${tt('Show meaning','معنی دکھائیں')}</button>`}</div>
  ${f?`<div class="bar dc-ans"><button class="btn ghost" id="dcNo">✗ ${tt('Not yet','ابھی نہیں')}</button><button class="btn" id="dcYes">✓ ${tt('I knew it','مجھے آتا تھا')}</button></div>`:''}</section>`;
  app.onclick=ev=>{const h=ev.target.closest('[data-au]');if(h){playWord(C,tt,h.dataset.au);return}
   if(ev.target.closest('#dcFlip')){Q.flip=true;step(C,tt,ur,I,D);return}
   const y=ev.target.closest('#dcYes'),no=ev.target.closest('#dcNo');if(y||no)answer(C,tt,ur,I,D,r,!!y)};
 }else{
  const {rev,opts}=Q.opts[Q.i],pk=Q.pick;
  const label=o=>rev?`<span class="ar" dir="rtl" lang="ar">${esc(o.h)}</span>`:esc(K.brief(meaning(o,U)));
  app.innerHTML=`<section class="dsec dc-wrap">${head}<div class="card dc-fc">${rev?`<small class="muted">${tt('Which Arabic word means…','کون سا عربی لفظ اس معنی کا ہے…')}</small><p class="dc-mn" id="dcQ">${esc(K.brief(meaning(w,U)))}</p>`:`<button class="dc-hear" data-au="${esc(w.s[0][6])}" aria-label="${tt('Hear the word','لفظ سنیں')}"><span class="ar dc-word" dir="rtl" lang="ar">${esc(w.h)}</span><span class="dc-sp" aria-hidden="true">🔊</span></button><small class="muted">${tt('What does it mean?','اس کا کیا مطلب ہے؟')}</small>`}</div>
  <div class="dc-opts" id="dcOpts">${opts.map(o=>`<button class="dc-opt${pk?(o.r===r?' ok':o.r===pk?' bad':''):''}" data-r="${o.r}" ${pk?'disabled':''}>${label(o)}</button>`).join('')}</div>
  ${pk?`<p class="dc-fb" role="status">${pk===r?'✓ '+tt('Correct','درست'):'✗ '+tt('Not quite: ','درست نہیں: ')+(pk===r?'':esc(meaning(w,U)))}</p><div class="bar"><button class="btn" id="dcNext">${Q.i+1>=n?tt('Finish','مکمل'):tt('Next','اگلا')} ›</button></div>`:''}</section>`;
  app.onclick=ev=>{const h=ev.target.closest('[data-au]');if(h){playWord(C,tt,h.dataset.au);return}
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
