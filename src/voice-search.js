// v96 (t257u): header mic = Voice Search. Tap → speak a word/phrase (اردو / عربي / English chip) → "Search in Quran or Hadith?"
// (tap a gold button or say it) → results from the app's own data. The mic is held only while a recogniser is listening
// and is aborted right after every result, on close, on navigation and when the app goes to the background.
import {norm,parseChoice,searchAyahs,dictLookup,isArabicScript,SR_LANG} from './voice-core.js';
import {ayahText,esc} from './lib.js';
let C=null,rec=null,ov=null;
export const supported=()=>!!(window.SpeechRecognition||window.webkitSpeechRecognition);
const tt=(e,u)=>C.S.ui==='ur'?u:e;
/** Stop and drop the recogniser so the OS mic indicator turns off. */
export function release(){const r=rec;rec=null;if(r){try{r.onresult=r.onend=r.onerror=null;r.abort()}catch{/* already stopped */}}document.body.classList.remove('vs-on');const b=ov?.querySelector('#vsMic');b?.classList.remove('on')}
function listen(lang,onPartial){return new Promise(res=>{release();const R=window.SpeechRecognition||window.webkitSpeechRecognition;if(!R)return res({err:'unsupported'});
 let r;try{r=new R()}catch{return res({err:'unsupported'})}rec=r;r.lang=SR_LANG[lang]||'en-US';r.interimResults=true;r.continuous=false;r.maxAlternatives=1;
 let txt='',done=false;const fin=o=>{if(done)return;done=true;clearTimeout(to);release();res(o)};const to=setTimeout(()=>fin({text:txt}),9000);
 r.onresult=e=>{txt=[...e.results].map(x=>x[0].transcript).join(' ').trim();onPartial?.(txt);if([...e.results].every(x=>x.isFinal))fin({text:txt})};
 r.onerror=e=>fin({text:txt,err:e.error});r.onend=()=>fin({text:txt});
 try{r.start();document.body.classList.add('vs-on');ov?.querySelector('#vsMic')?.classList.add('on')}catch{fin({err:'start'})}})}
const LANGS=[['ur','اردو'],['ar','عربي'],['en','English']];
const lang=()=>localStorage.getItem('qsVsLang')||(C.S.ui==='ur'?'ur':'en');
export function close(){release();ov?.remove();ov=null;document.removeEventListener('visibilitychange',onVis)}
const onVis=()=>{if(document.hidden)release()};
/** Open the Voice Search panel (from the header mic). */
export function open(ctx){C=ctx;close();ov=document.createElement('div');ov.id='vsOv';ov.className='vs-ov';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-label',tt('Voice search','آواز سے تلاش'));
 const L=lang();ov.innerHTML=`<div class="vs-card" dir="${C.S.ui==='ur'?'rtl':'ltr'}"><div class="vs-hd"><b>${tt('Voice search','آواز سے تلاش')}</b><button class="vs-x" id="vsClose" aria-label="${tt('Close','بند کریں')}">×</button></div>
 <div class="vs-chips" role="radiogroup" aria-label="${tt('Language you will speak','بولنے کی زبان')}">${LANGS.map(([k,n])=>`<button role="radio" class="vs-chip${k===L?' on':''}" aria-checked="${k===L}" data-l="${k}" lang="${k}">${n}</button>`).join('')}</div>
 <button class="vs-mic" id="vsMic" aria-label="${tt('Tap and speak','دبائیں اور بولیں')}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M8.5 21h7"/></svg></button>
 <p class="vs-st" id="vsSt" role="status">${supported()?tt('Tap the mic and say a word or phrase','مائیک دبائیں اور کوئی لفظ یا جملہ بولیں'):tt('Voice input is not available in this browser. Type your word below.','اس براؤزر میں آواز سے تلاش دستیاب نہیں۔ نیچے لفظ لکھیں۔')}</p>
 <form id="vsF" class="vs-f"><input class="inp" id="vsQ" dir="auto" autocomplete="off" aria-label="${tt('Word or phrase','لفظ یا جملہ')}" placeholder="${tt('Heard / type a word…','سنا گیا / لفظ لکھیں…')}"></form>
 <div class="vs-ask" id="vsAsk" hidden><p>${tt('Search in Quran or Hadith?','قرآن میں تلاش کریں یا حدیث میں؟')}</p><div class="vs-two"><button class="vs-gold" id="vsQuran">${tt('Quran','قرآن')}</button><button class="vs-gold" id="vsHadith">${tt('Hadith','حدیث')}</button></div><button class="vs-say" id="vsSay">${tt('…or say “Quran” / “Hadith”','…یا بولیں “قرآن” / “حدیث”')}</button></div>
 <a class="vs-link" href="#/recite" id="vsRecite">${tt('Recite & Learn (Quran Live) →','تلاوت اور سیکھیں (قرآن لائیو) ←')}</a></div>`;
 document.body.append(ov);document.addEventListener('visibilitychange',onVis);
 const $=s=>ov.querySelector(s),st=$('#vsSt'),q=$('#vsQ'),ask=$('#vsAsk');
 const ready=()=>{ask.hidden=!q.value.trim()};q.oninput=ready;
 const go=w=>{const v=q.value.trim();if(!v)return;const l=lang();close();location.hash=w==='quran'?`#/vq/${l}/${encodeURIComponent(v)}`:`#/hsearch/bukhari/${encodeURIComponent(v)}/${l}`};
 $('#vsF').onsubmit=e=>{e.preventDefault();ready();if(q.value.trim())$('#vsQuran').focus()};
 $('#vsQuran').onclick=()=>go('quran');$('#vsHadith').onclick=()=>go('hadith');$('#vsClose').onclick=close;$('#vsRecite').onclick=close;
 ov.addEventListener('click',e=>{if(e.target===ov)close()});ov.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
 ov.querySelectorAll('.vs-chip').forEach(b=>b.onclick=()=>{release();localStorage.setItem('qsVsLang',b.dataset.l);ov.querySelectorAll('.vs-chip').forEach(x=>{x.classList.toggle('on',x===b);x.setAttribute('aria-checked',x===b)})});
 const errMsg=e=>e==='not-allowed'||e==='service-not-allowed'?tt('Microphone permission is off. Allow it, or type below.','مائیک کی اجازت بند ہے۔ اجازت دیں یا نیچے لکھیں۔'):e==='unsupported'?tt('Voice input is not available in this browser. Type your word below.','اس براؤزر میں آواز سے تلاش دستیاب نہیں۔ نیچے لفظ لکھیں۔'):e==='network'?tt('Voice input needs internet. Type your word below.','آواز سے تلاش کے لیے انٹرنیٹ چاہیے۔ نیچے لکھیں۔'):tt('Didn’t catch that — try again or type.','سمجھ نہیں آیا — دوبارہ بولیں یا لکھیں۔');
 const askVoice=async()=>{st.textContent=tt('Listening… say “Quran” or “Hadith”','سن رہا ہے… “قرآن” یا “حدیث” بولیں');const r=await listen(C.S.ui==='ur'||lang()!=='en'?'ur':'en');if(!ov)return;const c=parseChoice(r.text||'');if(c)go(c);else st.textContent=tt('Tap Quran or Hadith','قرآن یا حدیث دبائیں')};
 $('#vsSay').onclick=askVoice;if(!supported())$('#vsSay').hidden=true;
 $('#vsMic').onclick=async()=>{if(rec){release();return}if(!supported()){st.textContent=errMsg('unsupported');q.focus();return}
  st.textContent=tt('Listening…','سن رہا ہے…');const r=await listen(lang(),p=>{q.value=p});if(!ov)return;
  if(r.text){q.value=r.text;ready();st.innerHTML=`${tt('Heard:','سنا گیا:')} <b dir="auto">${esc(r.text)}</b>`;const c=parseChoice(r.text);if(c&&r.text.trim().split(/\s+/).length===1){/* the word itself is “Quran”/“Hadith”: still ask */}
   askVoice()}else{st.textContent=errMsg(r.err);if(r.err)q.focus()}};
 if(supported())$('#vsMic').focus();else q.focus();
 return ov}
const OFFE={ur:'ur.jalandhry',en:'en.sahih'};
const loadAll=ed=>Promise.all(Array.from({length:114},(_,i)=>C.j(`${C.OFF}s/${ed}/${i+1}.json`)));
/** Quran results page: #/vq/<lang>/<query> */
export async function quranPage(ctx,l,q){C=ctx;const app=C.app();const ui=C.S.ui==='ur'?'ur':'en';C.setTitle(tt('Voice search · Quran','آواز سے تلاش · قرآن'));
 if(!q){location.replace('#/');return}app.innerHTML=`<div class="vs-res"><p class="vs-q"><span>${tt('Searching Quran for','قرآن میں تلاش:')}</span> <b dir="auto">${esc(q)}</b></p><p class="muted" id="vqm">${tt('Searching…','تلاش ہو رہی ہے…')}</p><div id="vqd"></div><div id="vqr"></div></div>`;const root=app;
 const ar=isArabicScript(q);const trEd=l==='ur'||(ar&&l!=='ar')?'ur.jalandhry':'en.sahih';
 const [AR,TRS,TRU,list,dict]=await Promise.all([loadAll('ar'),l==='ar'?null:loadAll(trEd),loadAll(OFFE[ui]),C.surahs(),C.j(C.OFF+'x/dict.json').catch(()=>null)]);if(C.app()!==root)return;
 const A=ar?searchAyahs(q,{ar:AR},'ar',1e6):{count:0,hits:[]},B=TRS?searchAyahs(q,{tr:TRS},'tr',1e6):{count:0,hits:[]};
 const seen=new Set(),hits=[...A.hits,...B.hits].filter(h=>{const k=h.s*1000+h.a;if(seen.has(k))return false;seen.add(k);return true}).sort((x,y)=>x.s-y.s||x.a-y.a);
 const w=dict&&dictLookup(q,dict.words);
 root.querySelector('#vqd').innerHTML=w?`<a class="card vs-dict" href="#/dict/${w.r}"><span class="ar" dir="rtl" lang="ar">${esc(w.h)}</span><span class="vs-dm"><b>${esc(ui==='ur'?w.u:w.e)}</b><small>${esc(w.t)} · ${tt(`${w.nt.toLocaleString()} times in ${w.na.toLocaleString()} ayahs`,`${w.na.toLocaleString()} آیات میں ${w.nt.toLocaleString()} بار`)}</small></span></a>`:'';
 const SHOW=100;root.querySelector('#vqm').textContent=hits.length?tt(`${hits.length} ayahs found${hits.length>SHOW?` · showing first ${SHOW}`:''}`,`${hits.length} آیات ملیں${hits.length>SHOW?` · پہلی ${SHOW}`:''}`):tt('No ayahs found. Try another word or language.','کوئی آیت نہیں ملی۔ کوئی اور لفظ یا زبان آزمائیں۔');
 root.querySelector('#vqr').innerHTML=hits.slice(0,SHOW).map(({s,a})=>{const m=list[s-1];return `<a class="card vs-hit" href="#/surah/${s}/${a}"><span class="badge">${esc(ui==='ur'?m.name:m.englishName)} ${s}:${a}</span><p class="ar" dir="rtl" lang="ar">${esc(ayahText(s,a,AR[s-1][a-1]))}</p><p dir="auto" class="vs-tr">${esc(TRU[s-1][a-1])}</p></a>`}).join('')
  +`<p class="c"><a class="btn ghost" href="#/hsearch/bukhari/${encodeURIComponent(q)}/${l}">${tt('Search Hadith instead','حدیث میں تلاش کریں')}</a></p>`;
 return {count:hits.length,norm:norm(q)}}
