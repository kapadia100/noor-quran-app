// Hadith Audio: listen to the TRANSLATION of a hadith (English or Urdu only), picked by book / chapter / hadith number.
// Uses the phone's own voices (hadith-tts.js). The Arabic text is never read aloud and is not even shown here.
import*as H from'./hadith-tts.js';
const TX={en:{title:'Hadith Audio',lang:'Translation language',book:'Book',chapter:'Chapter',num:'Hadith number',go:'Go',play:'Play',pause:'Pause',resume:'Resume',stop:'Stop',next:'Next',prev:'Previous',cont:'Play through the whole chapter',speed:'Speed',
  intro:'Pick a language, a book and a chapter, or jump to a hadith number, then press Play. Only the translation is read, never the Arabic.',
  noVoice:l=>`No ${l} voice is installed on this device, so it cannot be played. Add one in your phone's speech or language settings, then open this page again.`,
  silent:'Nothing played: your device did not speak. Check the volume and the silent switch.',
  noTr:l=>`No ${l} translation for this hadith`,skipped:(n,l)=>`${n} hadith${n===1?'':'s'} in this chapter ${n===1?'has':'have'} no ${l} translation and ${n===1?'is':'are'} skipped.`,
  unavailable:l=>`${l} not available`,notFound:n=>`Hadith ${n} was not found.`,missingJump:(n,l)=>`Hadith ${n} has no ${l} translation.`,
  done:'End of the chapter.',loading:'Loading…',err:'Could not load. Check your connection.',nowOf:(a,b)=>`${a} of ${b}`,empty:'This chapter has no hadith with a translation in this language.',hadith:'Hadith',noneTr:'No translation to play'},
 ur:{title:'حدیث آڈیو',lang:'ترجمے کی زبان',book:'کتاب',chapter:'باب',num:'حدیث نمبر',go:'جائیں',play:'سنیں',pause:'وقفہ',resume:'جاری رکھیں',stop:'بند',next:'اگلی',prev:'پچھلی',cont:'پورا باب مسلسل سنیں',speed:'رفتار',
  intro:'زبان، کتاب اور باب چنیں، یا حدیث نمبر پر جائیں، پھر سنیں دبائیں۔ صرف ترجمہ پڑھا جائے گا، عربی کبھی نہیں۔',
  noVoice:l=>`اس آلے پر ${l} کی آواز موجود نہیں، اس لیے چلانا ممکن نہیں۔ اپنے فون کی اسپیچ یا زبان کی ترتیبات میں آواز شامل کریں، پھر یہ صفحہ دوبارہ کھولیں۔`,
  silent:'آواز نہیں چلی: آپ کے آلے نے آواز نہیں دی۔ والیوم اور سائلنٹ سوئچ دیکھیں۔',
  noTr:l=>`اس حدیث کا ${l} ترجمہ موجود نہیں`,skipped:(n,l)=>`اس باب کی ${n} احادیث کا ${l} ترجمہ موجود نہیں، انہیں چھوڑ دیا جائے گا۔`,
  unavailable:l=>`${l} دستیاب نہیں`,notFound:n=>`حدیث ${n} نہیں ملی۔`,missingJump:(n,l)=>`حدیث ${n} کا ${l} ترجمہ موجود نہیں۔`,
  done:'باب ختم ہوا۔',loading:'لوڈ ہو رہا ہے…',err:'لوڈ نہیں ہو سکا۔',nowOf:(a,b)=>`${a} از ${b}`,empty:'اس باب میں اس زبان کا ترجمہ رکھنے والی کوئی حدیث نہیں۔',hadith:'حدیث',noneTr:'چلانے کے لیے ترجمہ موجود نہیں'}};
const LANGS=['eng','urd'];
const LSK='qsHadithAudio';
const pref=()=>{try{const p={lang:'eng',rate:1,cont:true,...JSON.parse(localStorage.getItem(LSK)||'{}')};if(!LANGS.includes(p.lang))p.lang='eng';return p}catch{return{lang:'eng',rate:1,cont:true}}};
const savePref=p=>{try{localStorage.setItem(LSK,JSON.stringify(p))}catch{/* ignore */}};
const IC={play:'<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M7 4.5v15l12-7.5z" fill="currentColor"/></svg>',pause:'<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M6 4h4v16H6zM14 4h4v16h-4z" fill="currentColor"/></svg>',stop:'<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M6 6h12v12H6z" fill="currentColor"/></svg>',
 next:'<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M6 5l9 7-9 7zM17 5h2.5v14H17z" fill="currentColor"/></svg>',prev:'<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M18 5l-9 7 9 7zM4.5 5H7v14H4.5z" fill="currentColor"/></svg>'};
let off=[];
/** Stops speech and unhooks the page (called by the router on every navigation). */
export function leave(){H.stop();off.forEach(f=>f());off=[]}
/**
 * Renders the Audio page into `root`.
 * deps: {j, HAD, BASE, esc, ui, L2, names(code,ui,short), loadMalik, getMalik(), setTitle, hsRef(book,h)}
 */
export async function render(root,deps,{book:b0='',sec:s0='',n:n0=''}={}){
 const {j,HAD,BASE,esc,ui,L2,names}=deps,t=TX[ui]||TX.en,P=pref();
 root.innerHTML=`<p class="muted c">${t.loading}</p>`;
 let eds,info;try{[eds,info]=await Promise.all([j(HAD+'/editions.json'),j(HAD+'/info.json')])}catch{root.innerHTML=`<p class="card">${t.err}</p>`;return}
 if(!root.isConnected)return;
 const has=(book,l)=>!!eds[book]?.collection.some(c=>c.name===`${l}-${book}`);
 const books=Object.keys(L2.HCOL).filter(k=>eds[k]);
 const S={lang:P.lang,book:books.includes(b0)?b0:'bukhari',sec:'',items:[],idx:-1,rate:P.rate,cont:P.cont,msg:'',busy:false};
 if(!books.includes(S.book))S.book=books[0];
 if(!has(S.book,S.lang)){S.book=books.find(k=>has(k,S.lang))||S.book}
 const lname=l=>names(l==='eng'?'eng':'urd',ui,true);
 const bname=k=>ui==='ur'?L2.HCOL[k][1]:L2.HCOL[k][0];
 const secs=book=>Object.entries(info[book]?.metadata.sections||{}).filter(([k,v])=>k!=='0'&&v);
 root.innerHTML=`<section class="ha" dir="${ui==='ur'?'rtl':'ltr'}">
 <p class="muted ha-intro">${t.intro}</p>
 <div class="card ha-pick">
  <div class="ha-row"><span class="ha-lab" id="haLangL">${t.lang}</span><div class="seg ha-lang" role="radiogroup" aria-labelledby="haLangL">${LANGS.map(l=>`<button type="button" role="radio" class="btn ${l===S.lang?'on':'ghost'}" data-lang="${l}" aria-checked="${l===S.lang}">${esc(lname(l))}</button>`).join('')}</div></div>
  <label class="ha-row"><span class="ha-lab">${t.book}</span><select id="haBook" aria-label="${t.book}"></select></label>
  <label class="ha-row"><span class="ha-lab">${t.chapter}</span><select id="haSec" aria-label="${t.chapter}"></select></label>
  <div class="ha-row"><label class="ha-lab" for="haNum">${t.num}</label><span class="ha-jump"><input class="inp" id="haNum" inputmode="numeric" aria-label="${t.num}" placeholder="#"><button type="button" class="btn" id="haGo">${t.go}</button></span></div>
 </div>
 <div class="card ha-now" id="haNow"><p class="ha-ref" id="haRef" aria-live="polite"></p>
  <div class="ha-ctl" role="group"><button type="button" class="ha-c" id="haPrev" aria-label="${t.prev}">${IC.prev}<span>${t.prev}</span></button><button type="button" class="ha-c ha-main" id="haPlay" aria-label="${t.play}">${IC.play}<span>${t.play}</span></button><button type="button" class="ha-c" id="haStop" aria-label="${t.stop}">${IC.stop}<span>${t.stop}</span></button><button type="button" class="ha-c" id="haNext" aria-label="${t.next}">${IC.next}<span>${t.next}</span></button></div>
  <div class="ha-row ha-opts"><label><input type="checkbox" id="haCont" ${S.cont?'checked':''}> ${t.cont}</label><label>${t.speed} <select id="haRate" aria-label="${t.speed}">${[0.8,1,1.2].map(r=>`<option value="${r}" ${r===S.rate?'selected':''}>${r}×</option>`).join('')}</select></label></div>
  <p class="muted" id="haMsg" role="status"></p></div>
 <div id="haList"></div></section>`;
 const q=s=>root.querySelector(s),list=q('#haList');
 let voices=[],voice=null;
 const msg=s=>{S.msg=s;q('#haMsg').textContent=s;q('#haMsg').hidden=!s};
 const fillBooks=()=>{q('#haBook').innerHTML=books.map(k=>{const ok=has(k,S.lang);return`<option value="${k}" ${k===S.book?'selected':''} ${ok?'':'disabled'}>${esc(bname(k))}${ok?'':' — '+esc(t.unavailable(lname(S.lang)))}</option>`}).join('')};
 const fillSecs=()=>{q('#haSec').innerHTML=secs(S.book).map(([k,v])=>`<option value="${k}" ${k===S.sec?'selected':''}>${k}. ${esc(v)}</option>`).join('')};
 const refOf=h=>{const mr=S.book==='malik'?L2.malikRef(deps.getMalik(),h):'';const no=L2.hadithIntl(S.book,h)||String(h.hadithnumber);return mr?`${L2.HCOL.malik[ui==='ur'?1:0]}, ${mr}`:`${L2.HCOL[S.book]?.[ui==='ur'?1:0]||S.book} ${no}`};
 const ready=i=>S.items[i]&&S.items[i].text;
 const nextOk=(i,d)=>{for(let n=i+d;n>=0&&n<S.items.length;n+=d)if(ready(n))return n;return -1};
 const paintList=()=>{
  const miss=S.items.filter(x=>!x.text).length;
  list.innerHTML=(miss?`<p class="card muted ha-skip" id="haSkip">${esc(t.skipped(miss,lname(S.lang)))}</p>`:'')+(S.items.length&&miss===S.items.length?`<p class="card">${t.empty}</p>`:'')+S.items.map((x,i)=>`<article class="card ha-it ${x.text?'':'ha-miss'}" data-i="${i}" ${x.text?'tabindex="0" role="button"':''} aria-label="${esc(x.ref)}"><div class="tools"><span class="badge">${esc(x.ref)}</span>${x.text?'':`<small class="muted ha-nt">${esc(t.noTr(lname(S.lang)))}</small>`}</div>${x.text?`<p class="tr" lang="${S.lang==='urd'?'ur':'en'}" dir="${S.lang==='urd'?'rtl':'ltr'}">${esc(x.text)}</p>`:''}</article>`).join('');
  paintNow()};
 const st=()=>{const s=H.info();return s.id&&s.id.startsWith('ha:')?s:{id:null,state:'idle'}};
 const paintNow=()=>{
  const s=st(),cur=S.items[S.idx],playing=s.state==='playing'||s.state==='starting';
  q('#haRef').textContent=cur?`${cur.ref} · ${t.nowOf(S.items.slice(0,S.idx+1).filter(x=>x.text).length||'', S.items.filter(x=>x.text).length)}`:t.noneTr;
  const pb=q('#haPlay'),lab=playing?t.pause:s.state==='paused'?t.resume:t.play;pb.innerHTML=(playing?IC.pause:IC.play)+`<span>${lab}</span>`;pb.setAttribute('aria-label',lab);pb.dataset.st=s.state;
  const can=!!voice&&S.items.some(x=>x.text);
  pb.disabled=!can;q('#haStop').disabled=!(s.state!=='idle');q('#haPrev').disabled=!can||nextOk(S.idx,-1)<0;q('#haNext').disabled=!can||nextOk(S.idx,1)<0;
  list.querySelectorAll('.ha-it').forEach(el=>el.classList.toggle('ha-on',+el.dataset.i===S.idx));
  list.querySelectorAll('.ha-it').forEach(el=>el.setAttribute('aria-current',+el.dataset.i===S.idx&&s.state!=='idle'?'true':'false'))};
 const idOf=i=>`ha:${S.book}:${S.sec}:${i}`;
 const speak=i=>{const x=S.items[i];if(!x||!x.text||!voice)return false;S.idx=i;msg('');
  const ok=H.play({id:idOf(i),text:x.text,lang:S.lang,voice,rate:S.rate,onEnd:()=>{
   if(!root.isConnected)return;if(!S.cont){paintNow();return}
   const n=nextOk(i,1);if(n>=0){speak(n);scroll(n)}else{msg(t.done);paintNow()}}});
  paintNow();return ok};
 const scroll=i=>list.querySelector(`.ha-it[data-i="${i}"]`)?.scrollIntoView?.({block:'center',behavior:'smooth'});
 const loadSec=async(sec,focusNum)=>{
  H.stop();S.sec=String(sec);S.busy=true;S.items=[];S.idx=-1;msg('');list.innerHTML=`<p class="muted c">${t.loading}</p>`;fillSecs();paintNow();
  const ed=`${S.lang}-${S.book}`;
  const [d,a]=await Promise.all([j(`${HAD}/editions/${ed}/sections/${sec}.min.json`).catch(()=>null),j(`${HAD}/editions/ara-${S.book}/sections/${sec}.min.json`).catch(()=>null)]);
  if(!root.isConnected)return;S.busy=false;
  if(!d&&!a){list.innerHTML=`<p class="card">${t.err}</p>`;return}
  // The Arabic list only supplies the full set of hadith numbers, so a hadith missing from the translation is shown as missing, never dropped. Its text is not used or shown.
  const tm=new Map((d?.hadiths||[]).map(h=>[String(h.hadithnumber),h])),order=a?.hadiths?.length?a.hadiths:(d?.hadiths||[]);
  S.items=order.map(h=>{const th=tm.get(String(h.hadithnumber));const base=th||h;return{n:h.hadithnumber,ref:refOf({...base,hadithnumber:h.hadithnumber,arabicnumber:h.arabicnumber??base.arabicnumber}),text:th&&(th.text||'').trim()?th.text.trim():''}});
  S.idx=S.items.findIndex(x=>x.text);
  if(focusNum!==undefined&&focusNum!==null){const k=S.items.findIndex(x=>String(x.n)===String(focusNum));if(k>=0)S.idx=k}
  paintList();if(focusNum!==undefined&&focusNum!==null)scroll(S.idx)};
 const hnOf=async raw=>{const s=String(raw).trim().toLowerCase();if(!s)return null;
  if(S.book==='malik'){await deps.loadMalik('malik');const M=deps.getMalik()||{};const [x,y]=s.split('/');const e=Object.entries(M).find(([,r])=>y?(r[0]==+x&&r[1]==+y):r[2]==+x);return e?e[0]:null}
  if(S.book==='muslim'){const map=await j(BASE+'offline/x/muslim-map.json').catch(()=>({}));return map[s]??null}
  return /^\d+(\.\d+)?$/.test(s)?s:null};
 const secOf=async hn=>{const sd=info[S.book]?.metadata.section_details||{};const n=Math.floor(+hn);
  for(const [k,v] of Object.entries(sd)){if(k!=='0'&&n>=v.hadithnumber_first&&n<=v.hadithnumber_last)return k}
  const d=await j(`${HAD}/editions/ara-${S.book}/${Math.floor(+hn)}.min.json`).catch(()=>null);return d?Object.keys(d.metadata?.section||{}).find(k=>k!=='0')||null:null};
 const jump=async raw=>{
  const hn=await hnOf(raw);if(hn===null){msg(t.notFound(raw));return}
  const sec=await secOf(hn);if(!sec){msg(t.notFound(raw));return}
  await loadSec(sec,hn);q('#haSec').value=String(sec);
  const k=S.items.findIndex(x=>String(x.n)===String(hn));
  if(k<0){msg(t.notFound(raw));return}
  S.idx=k;if(!S.items[k].text){msg(t.missingJump(raw,lname(S.lang)));const n=nextOk(k,1);if(n>=0)S.idx=n}paintList();scroll(S.idx)};
 const needVoice=()=>{voice=H.supported()?H.pickVoice(voices,S.lang):null;
  if(!H.supported()||!voice)msg(t.noVoice(lname(S.lang)));else if(S.msg===t.noVoice(lname(S.lang)))msg('')};
 const setLang=async l=>{S.lang=l;savePref({...pref(),lang:l});
  root.querySelectorAll('[data-lang]').forEach(b=>{const on=b.dataset.lang===l;b.classList.toggle('on',on);b.classList.toggle('ghost',!on);b.setAttribute('aria-checked',on)});
  const pb=S.book;if(!has(S.book,l))S.book=books.find(k=>has(k,l))||S.book;if(S.book!==pb)S.sec='';
  fillBooks();needVoice();
  const keep=S.sec?S.items[S.idx]?.n:undefined;await loadSec(S.sec||secs(S.book)[0]?.[0]||'1',keep);needVoice()};
 // wiring
 root.querySelectorAll('[data-lang]').forEach(b=>b.onclick=()=>{if(b.dataset.lang!==S.lang)setLang(b.dataset.lang)});
 q('#haBook').onchange=e=>{S.book=e.target.value;S.sec='';fillSecs();loadSec(secs(S.book)[0]?.[0]||'1')};
 q('#haSec').onchange=e=>loadSec(e.target.value);
 const go=()=>{const v=q('#haNum').value.trim();if(v)jump(v)};
 q('#haGo').onclick=go;q('#haNum').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();go()}};
 q('#haRate').onchange=e=>{S.rate=+e.target.value||1;savePref({...pref(),rate:S.rate});H.setRate(S.rate)};
 q('#haCont').onchange=e=>{S.cont=e.target.checked;savePref({...pref(),cont:S.cont})};
 q('#haPlay').onclick=()=>{const s=st();if(s.state==='playing'||s.state==='starting')H.pause();else if(s.state==='paused')H.resume();else{let i=S.idx;if(!ready(i))i=nextOk(i,1)>=0?nextOk(i,1):nextOk(i,-1);if(i>=0)speak(i)}};
 q('#haStop').onclick=()=>{H.stop();msg('');paintNow()};
 const step=d=>{const n=nextOk(S.idx,d);if(n<0)return;const s=st();if(s.state!=='idle')speak(n);else{S.idx=n;paintNow()}scroll(n)};
 q('#haNext').onclick=()=>step(1);q('#haPrev').onclick=()=>step(-1);
 list.addEventListener('click',e=>{const el=e.target.closest('.ha-it');if(!el||el.classList.contains('ha-miss'))return;speak(+el.dataset.i)});
 list.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const el=e.target.closest('.ha-it');if(!el||el.classList.contains('ha-miss'))return;e.preventDefault();speak(+el.dataset.i)});
 off.push(H.onChange(()=>root.isConnected&&paintNow()),H.onError((w,id)=>{if(root.isConnected&&String(id||'').startsWith('ha:'))msg(t.silent)}));
 fillBooks();fillSecs();
 voices=await H.voicesReady();if(!root.isConnected)return;needVoice();
 const first=S.book===b0&&s0?String(s0):(secs(S.book)[0]?.[0]||'1');
 if(n0){const hn=await hnOf(n0);const sec=hn!==null?await secOf(hn):null;if(sec){await loadSec(sec,hn);q('#haSec').value=String(sec);return}}
 await loadSec(first)}
