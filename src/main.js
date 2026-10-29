import './fonts.css';import './style.css';import './sakina.css';
import{langName,edLang,orderLangs,langRank}from './hadith-lang.js';
import*as HL from './hadith-listen.js';
import*as HA from './hadith-audio.js';
import*as PK from './pickers.js';
import * as PR from './prayer.js';
import {hifzNext,surahMatch,JUZ,JUZN,ayahText,parseRef,validSurah,validJuz,juzRanges,nextPos,clampAdj,highlight,turn,AYAH_COUNTS,TRANS_AUDIO,AUDIO_MODES,ayahClips} from './lib.js';
const API='https://api.alquran.cloud/v1', HAD='https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1';
const $=s=>document.querySelector(s);let app=$('#app');
const LS={get:(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},set:(k,v)=>localStorage.setItem(k,JSON.stringify(v))};
const S=Object.assign({trans:'en.sahih',reciter:'ar.alafasy',tafsir:'ar.muyassar',ui:'en',dark:true,hlang:'eng',size:30,continuous:true,autoNext:true,surahAudio:false,amode:'ar',talang:'ur'},LS.get('settings',{}));delete S.hifzHide;
const save=()=>LS.set('settings',S);
const T={en:{home:'Home',ibadat:'Ibadat',duas:'Duas',more:'More',quran:'Quran',hadith:'Hadith',search:'Search',bookmarks:'Bookmarks',prayer:'Prayer',qibla:'Qibla',settings:'Settings',filter:'Search surah…',ayahs:'ayahs',translation:'Translation',tlang:'Translation language',translator:'Translator',reciter:'Reciter',tafsir:'Tafsir',lastRead:'Continue reading',none:'Nothing yet',play:'Play surah',lang:'Hadith language',size:'Arabic font size',q:'Search the Quran…',edition:'Search in',loading:'Loading…',err:'Could not load. Check your connection.',results:'results',books:'Books',uiLang:'App language',dark:'Dark mode',offlineTr:'Offline: showing the built-in English translation. Connect to load the selected translation.',cont:'Continuous play (auto-advance ayahs)',autoNext:'Continue into next surah',surahAudio:'Whole-surah audio files (best for locked screen, no ayah highlight)'},
 ur:{home:'ہوم',ibadat:'عبادات',duas:'دعائیں',more:'مزید',quran:'قرآن',hadith:'حدیث',search:'تلاش',bookmarks:'نشانیاں',prayer:'نماز',qibla:'قبلہ',settings:'ترتیبات',filter:'سورت تلاش کریں…',ayahs:'آیات',translation:'ترجمہ',tlang:'ترجمے کی زبان',translator:'مترجم',reciter:'قاری',tafsir:'تفسیر',lastRead:'پڑھنا جاری رکھیں',none:'ابھی کچھ نہیں',play:'سورت سنیں',lang:'حدیث کی زبان',size:'عربی فونٹ سائز',q:'قرآن میں تلاش کریں…',edition:'تلاش بذریعہ',loading:'لوڈ ہو رہا ہے…',err:'لوڈ نہیں ہو سکا۔',results:'نتائج',books:'کتب',uiLang:'ایپ کی زبان',dark:'ڈارک موڈ',offlineTr:'آف لائن: بلٹ اِن انگریزی ترجمہ دکھایا جا رہا ہے۔',cont:'مسلسل تلاوت',autoNext:'اگلی سورت جاری رکھیں',surahAudio:'پوری سورت کی آڈیو فائل (لاک اسکرین کے لیے بہتر)'}};
const t=k=>T[S.ui][k]||k;
import {esc} from './lib.js';
import {dateKey,msToMidnight,gregText} from './dates.js';
import * as TJ from './tj-rules.js';
import * as F from './features.js';
import {icon} from './icons.js';
import * as GC from './analytics.js';
import {weakLoad,weakSave,weakAll,dueItems} from './coach.js';
const I_=icon;
document.querySelectorAll('[data-i]').forEach(b=>b.insertAdjacentHTML('afterbegin',icon(b.dataset.i)));
import * as L2 from './lib.js';
const mem={};
async function j(url){if(mem[url])return mem[url];const r=await fetch(url);if(!r.ok)throw new Error(r.status);const d=await r.json();return mem[url]=d.data??d}
const surahs=()=>j(import.meta.env.BASE_URL+'offline/surahs.json').catch(()=>j(API+'/surah'));
// Edition lists: live API, fall back to the offline-bundled editions so screens still work with no network.
async function editions(type){try{return await j(`${API}/edition?type=${type}`)}catch{if(type==='translation'){const l=await j(import.meta.env.BASE_URL+'offline/translations.json');return l.filter(e=>['en.sahih','ur.jalandhry','ur.kanzuliman'].includes(e.identifier))}return []}}
async function audioEds(){try{return await j(API+'/edition?format=audio&type=versebyverse')}catch{return [{identifier:S.reciter,language:'ar',englishName:S.reciterName||S.reciter}]}}
const loading=()=>app.innerHTML=`<p class="muted c">${t('loading')}</p>`;
function applyUI(){document.documentElement.dataset.theme=S.dark?'dark':'light';{const m=document.querySelector('meta[name=theme-color]');if(m)m.content=S.dark?'#1B2118':'#F6F0E2'}document.documentElement.lang=S.ui;document.documentElement.dir=S.ui==='ur'?'rtl':'ltr';
 document.querySelectorAll('[data-t]').forEach(e=>e.textContent=t(e.dataset.t));$('#lang').textContent=S.ui==='en'?'اردو':'EN';$('#tutor').setAttribute('aria-label',S.ui==='ur'?'تلاوت اور سیکھیں':'Recite & Learn');document.documentElement.style.setProperty('--ar',S.size+'px')}
const thIc=()=>{$('#theme').innerHTML=icon(S.dark?'sun':'moon')};$('#theme').onclick=()=>{S.dark=!S.dark;save();applyUI();thIc()};thIc();
$('#tutor').onclick=()=>{location.hash='#/recite'};$('#lang').onclick=()=>{S.ui=S.ui==='en'?'ur':'en';save();applyUI();route()};
$('#back').onclick=()=>history.back();
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>location.hash=b.dataset.r);
$('#sheetClose').onclick=()=>$('#sheet').hidden=true;
$('#sheet').onclick=e=>{if(e.target.id==='sheet')$('#sheet').hidden=true};
const setTitle=s=>$('#title').textContent=s;
const opt=(list,sel,order=true)=>(order?orderLangs(list,e=>e.language,e=>e.englishName||e.identifier):list).map(e=>`<option value="${e.identifier}" ${e.identifier===sel?'selected':''}>${esc(langName(e.language,S.ui,true))} · ${esc(PK.translatorLabel(e,S.ui))}</option>`).join('');

// ---------- Surah list ----------
async function home(tab){setTitle(t('quran'));loading();const list=await surahs();const lr=LS.get('lastRead');
 const nx=PR.next();app.innerHTML=`${dateCard(nx)}<div class="tabs"><a href="#/quran" class="${tab?'':'on'}">Surah</a><a href="#/mushaf">${I_('mushaf')} Mushaf</a><a href="#/juz" class="${tab?'on':''}">Juz / Para</a><a href="#/bookmarks">${I_('bookmarks')} ${t('bookmarks')}</a></div>${tab?juzList():''}`;tick();if(tab)return;
 app.insertAdjacentHTML('beforeend',`${lr?`<a class="card hl" href="#/surah/${lr.s}/${lr.a}">▶ ${t('lastRead')}: ${esc(lr.name)} ${lr.s}:${lr.a}</a>`:''}
 <input id="f" class="inp" aria-label="${t('filter')}" placeholder="${t('filter')}"><ul class="list" id="sl"></ul>`);
 const draw=q=>{q=q.toLowerCase();$('#sl').innerHTML=list.filter(s=>surahMatch(s,q)).map(s=>`<li><a href="#/surah/${s.number}"><b class="num">${s.number}</b><span><b>${esc(s.englishName)}</b><small>${esc(s.englishNameTranslation)} · ${s.numberOfAyahs} ${t('ayahs')} · ${s.revelationType}</small></span><span class="ar sm">${esc(s.name)}</span></a></li>`).join('')};
 draw('');$('#f').oninput=e=>draw(e.target.value)}


// ---------- Recite & Learn (live tutor) entry page ----------
async function tutorPage(){const ur=S.ui==='ur';setTitle(ur?'تلاوت اور سیکھیں':'Recite & Learn');loading();const list=await surahs();const lr=LS.get('lastRead');
 app.innerHTML=`<div class="tutor-card" style="cursor:default"><span class="ti">${I_('tutor')}</span><div><b>${ur?'تلاوت اور سیکھیں':'Recite & Learn'}</b><small>${ur?'سورت منتخب کریں، مائیک دبائیں اور پڑھیں۔ ہر لفظ بولتے ہی سبز ہو جاتا ہے؛ غلطی ہو تو درست لفظ سنیں اور آگے بڑھیں۔':'Pick a surah, tap the mic and recite. Each word lights up the moment you say it; if one is wrong or missed, hear the right one and carry on.'}</small></div></div>
 ${weakAll(weakLoad()).length?`<a class="card hl" href="#/recite/review">★ ${ur?'کمزور الفاظ کی دہرائی':'Review weak words'} (${weakAll(weakLoad()).length})</a>`:''}
 ${lr?`<a class="card hl" href="#/recite/${lr.s}/${lr.a}">▶ ${ur?'جاری رکھیں':'Continue'}: ${esc(lr.name)} ${lr.s}:${lr.a}</a>`:''}
 <input id="f" class="inp" aria-label="${t('filter')}" placeholder="${t('filter')}"><ul class="list" id="sl"></ul>`;
 const draw=q=>{q=q.toLowerCase();$('#sl').innerHTML=list.filter(s=>surahMatch(s,q)).map(s=>`<li><a href="#/recite/${s.number}"><b class="num">${s.number}</b><span><b>${esc(s.englishName)}</b><small>${esc(s.englishNameTranslation)} · ${s.numberOfAyahs} ${t('ayahs')}</small></span><span class="ar sm">${esc(s.name)}</span></a></li>`).join('')};draw('');$('#f').oninput=e=>draw(e.target.value)}

/** Start the weak-word practice drill directly (used by the More tab). */
async function weakDrill(){const W=weakLoad(),all=weakAll(W),due=dueItems(W);if(!all.length)return;try{const R=await import('./recite.js');RC=R;R.review((due.length?due:all).slice(0,20),{ayahUrl:(a,sn)=>arUrls(sn).then(u=>u[a-1]).catch(()=>null),event:()=>GC.event('feature-recite'),gc:GC.event})}catch{toast(t('err'))}}
async function weakPage(){const ur=S.ui==='ur';setTitle(ur?'کمزور الفاظ':'Weak words');const W=weakLoad(),all=weakAll(W),due=dueItems(W),now=Date.now();
 const when=e=>{const d=(e.due||0)-now;return d<=0?(ur?'اب':'due now'):d<864e5?(ur?'آج':'today'):(ur?`${Math.ceil(d/864e5)} دن`:`in ${Math.ceil(d/864e5)}d`)};
 app.innerHTML=`<div class="tutor-card" style="cursor:default"><span class="ti">${I_('tutor')}</span><div><b>${ur?'کمزور الفاظ':'Weak words'}</b><small>${ur?'جن الفاظ میں غلطی ہوئی، انہیں وقفے وقفے سے دہرائیں۔':'Words you missed come back at spaced intervals until you have them.'}</small></div></div>
 ${all.length?`<button class="btn" id="wRev" style="width:100%;margin:8px 0">▶ ${due.length?(ur?`دہرائی شروع کریں (${due.length})`:`Start review (${due.length} due)`):(ur?'سب کی مشق کریں':'Practice all')}</button>
 <ul class="list" id="wl">${all.map(e=>`<li class="row"><a style="flex:1;display:flex;gap:10px;align-items:center;min-width:0" href="#/recite/${e.sn}/${e.a}"><b class="num">${e.sn}:${e.a}</b><span><b class="ar sm" dir="rtl">${esc(e.t)}</b><small>${esc(e.m||e.tr||'')} · ${ur?'غلطیاں':'misses'} ${e.miss||1} · ${when(e)}</small></span></a><button class="wx" data-k="${esc(e.key)}" aria-label="${ur?'ہٹائیں':'Remove'}">✕</button></li>`).join('')}</ul>`:`<p class="muted" style="text-align:center;margin:24px 0">${ur?'ابھی کوئی کمزور لفظ نہیں۔ تلاوت کریں — جو لفظ غلط ہوں گے یہاں آئیں گے۔':'No weak words yet. Recite — any word you miss will show up here.'}</p>`}`;
 app.querySelectorAll('.wx').forEach(b=>b.onclick=e=>{e.preventDefault();const W2=weakLoad();delete W2[b.dataset.k];weakSave(W2);weakPage()});
 const rv=$('#wRev');if(rv)rv.onclick=async()=>{rv.disabled=true;try{const R=await import('./recite.js');RC=R;R.review((due.length?due:all).slice(0,20),{ayahUrl:(a,sn)=>arUrls(sn).then(u=>u[a-1]).catch(()=>null),event:()=>GC.event('feature-recite'),gc:GC.event})}catch{toast(t('err'))}finally{rv.disabled=false}}}

// ---------- verified text corrections (Tanzil 1.1 / quran.com agree) ----------
function juzList(){return `<ul class="list">${JUZ.map((r,i)=>`<li><a href="#/juz/${i+1}"><b class="num">${i+1}</b><span><b>Juz ${i+1} · ${JUZN[i]}</b><small>Starts ${r[0]}:${r[1]}${JUZ[i+1]?` · ends before ${JUZ[i+1][0]}:${JUZ[i+1][1]}`:' · ends 114:6'}</small></span><span class="ar">پارہ ${(i+1).toLocaleString('ar-EG')}</span></a></li>`).join('')}</ul>`}
async function juzReader(n){if(!validJuz(n)){location.hash='#/juz';return}loading();setTitle('Juz '+n);const [AR,list,tj]=await Promise.all([arabic(juzRanges(n).map(r=>r[0])),surahs(),transJuz(n)]);
 const rs=juzRanges(n),total=rs.reduce((x,[,f,t])=>x+t-f+1,0),rtl=tj.edition.direction==='rtl',isUr=tj.edition.language==='ur';
 app.innerHTML=`<div class="head"><div class="ar big">الجزء ${n.toLocaleString('ar-EG')}</div><small>Juz ${n} · ${JUZN[n-1]} · ${total} ${t('ayahs')}</small></div>${tj.fallback?`<p class="card muted">${t('offlineTr')}</p>`:''}`+rs.map(([sn,f,to],k)=>{const m=list[sn-1];let h=`<a class="card hl" href="#/surah/${sn}/${f}"><b>${sn}. ${esc(m.englishName)}</b> <span class="ar">${esc(m.name)}</span></a>${f===1&&sn!==1&&sn!==9?'<div class="ar bism c">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>':''}`;
 for(let a=f;a<=to;a++)h+=`<article class="ayah"><div class="tools"><a class="badge" href="#/surah/${sn}/${a}">${sn}:${a}</a></div><p class="ar" dir="rtl" lang="ar">${esc(ayahText(sn,a,AR[sn-1][a-1]))} <span class="end">﴿${a.toLocaleString('ar-EG')}﴾</span></p><p class="tr ${isUr?'ur':''}" dir="${rtl?'rtl':'ltr'}">${esc(tj.parts[k].texts[a-1]??'')}</p></article>`;return h}).join('')+
 `<div class="pager">${n>1?`<a class="btn" href="#/juz/${n-1}">‹ Juz ${n-1}</a>`:'<span></span>'}${n<30?`<a class="btn" href="#/juz/${n+1}">Juz ${n+1} ›</a>`:''}</div>`;document.getElementById('app').scrollTo(0,0)}

// ---------- Dates, prayer times, qibla ----------
const pn=k=>PR.PNAME[k][S.ui==='ur'?1:0];
function dateCard(nx){return `<div class="card datecard"><div><b class="hij" data-hij>${PR.hijri(new Date(),S.ui)}</b><small data-greg>${PR.greg(new Date(),S.ui)}</small></div>${nx?`<a href="#/prayer" class="nextp"><small>${S.ui==='ur'?'اگلی نماز':'Next prayer'}</small><b>${pn(nx.key)} ${PR.fmt12(nx.time)}</b><span class="cd" data-at="${+nx.time}"></span></a>`:''}</div>`}
let tickT;function tick(){clearInterval(tickT);const f=()=>{const els=document.querySelectorAll('.cd');if(!els.length)return clearInterval(tickT);document.querySelectorAll('.pc-bar').forEach(b=>{const f=+b.dataset.from,a=+b.dataset.at,w=Math.max(0,Math.min(100,100*(Date.now()-f)/(a-f)));b.firstElementChild.style.setProperty('--w',w.toFixed(1)+'%')});els.forEach(e=>{let ms=+e.dataset.at-Date.now();if(ms<0){route();return}const h=Math.floor(ms/36e5),m=Math.floor(ms%36e5/6e4),sec=Math.floor(ms%6e4/1e3);e.textContent=`${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`})};f();tickT=setInterval(f,1000)}
function prayer(){setTitle(S.ui==='ur'?'اوقاتِ نماز':'Prayer Times');const P=PR.P,pt=PR.times(),nx=PR.next();
 app.innerHTML=`${dateCard(nx)}<div class="card"><b>${I_('pin')} ${esc(P.city)}</b> <small class="muted">${P.lat}, ${P.lng} · ${P.tz}</small><div class="bar"><button class="btn" id="gps">${I_('gps')} ${S.ui==='ur'?'میری لوکیشن':'Use GPS'}</button><select id="city" aria-label="City"><option value="">${S.ui==='ur'?'شہر منتخب کریں':'Choose city…'}</option>${PR.CITIES.map(c=>`<option ${c[0]===P.city?'selected':''}>${c[0]}</option>`).join('')}</select></div><small id="gmsg" class="muted"></small></div>
 <ul class="list ptimes">${PR.PRAYERS.map(k=>`<li class="${nx?.key===k?'on':''}"><span><b>${pn(k)}</b></span><span class="t">${PR.fmt12(pt[k])}</span>${k==='sunrise'?'<span></span>':`<label class="sw" title="Alert"><input type="checkbox" data-al="${k}" ${P.alerts[k]?'checked':''}>${I_('bell')}</label>`}</li>`).join('')}</ul>
 <div class="form"><label>${S.ui==='ur'?'طریقۂ حساب':'Calculation method'}<select id="meth">${Object.entries(PR.METHODS).map(([k,v])=>`<option value="${k}" ${k===P.method?'selected':''}>${v}</option>`).join('')}</select></label>
 <label>${S.ui==='ur'?'عصر (فقہ)':'Asr juristic method'}<select id="madh"><option value="Hanafi">Hanafi (later Asr)</option><option value="Shafi" ${P.madhab==='Shafi'?'selected':''}>Shafi'i / Maliki / Hanbali</option></select></label>
 <label><input type="checkbox" id="adh" ${P.adhan?'checked':''}> ${S.ui==='ur'?'اذان کی آواز':'Adhan sound with alerts'}</label>
 <label>${S.ui==='ur'?'ہجری تاریخ میں تبدیلی':'Hijri date adjustment'} <span><button class="btn" id="hm">−1</button> <b id="hv">${P.hijriAdj>0?'+':''}${P.hijriAdj}</b> <button class="btn" id="hp">+1</button></span></label>
 <button class="btn" id="sched">${I_('bell')} ${S.ui==='ur'?'الرٹس فعال کریں':'Enable / refresh prayer alerts'} (${P.days} days)</button><small id="smsg" class="muted"></small></div>`;tick();
 const re=async()=>{PR.saveP();prayer();const r=await PR.schedule().catch(e=>({ok:false,reason:e.message}));const m=$('#smsg');if(m)m.textContent=r.ok?`✓ ${r.count} alerts scheduled (${r.mode})`:'Alerts: '+r.reason};
 $('#gps').onclick=async()=>{$('#gmsg').textContent='Locating…';try{await PR.locate();P.method=P.method||'Karachi';re()}catch(e){$('#gmsg').textContent='GPS unavailable ('+(e.message||e.code)+'). Choose your city instead.'}};
 $('#city').onchange=e=>{if(e.target.value){PR.setCity(e.target.value);re()}};$('#meth').onchange=e=>{P.method=e.target.value;re()};$('#madh').onchange=e=>{P.madhab=e.target.value;re()};
 $('#adh').onchange=e=>{P.adhan=e.target.checked;re()};$('#hm').onclick=()=>{P.hijriAdj=clampAdj(P.hijriAdj-1);PR.saveP();prayer()};$('#hp').onclick=()=>{P.hijriAdj=clampAdj(P.hijriAdj+1);PR.saveP();prayer()};
 app.querySelectorAll('[data-al]').forEach(c=>c.onchange=()=>{P.alerts[c.dataset.al]=c.checked;re()});$('#sched').onclick=re}
function qibla(){setTitle(S.ui==='ur'?'قبلہ فائنڈر':'Qibla Finder');const P=PR.P,q=PR.qibla();
 app.innerHTML=`<div class="card c"><b>${I_('pin')} ${esc(P.city)}</b><br><small class="muted">${P.lat}, ${P.lng}</small></div><div class="compass"><div class="dial" id="dial"><span class="n">N</span><span class="e">E</span><span class="s">S</span><span class="w">W</span><div class="needle" style="transform:rotate(${q}deg)"><span>${I_('kaaba')}</span></div></div></div>
 <div class="c"><div class="deg">${q.toFixed(1)}°</div><small class="muted">${S.ui==='ur'?'شمال سے گھڑی کی سمت میں قبلہ کا زاویہ':'Qibla bearing from True North (clockwise)'}</small><p id="hd" class="muted">${S.ui==='ur'?'کمپاس کے لیے فون کو سیدھا رکھیں':'Hold your phone flat. Compass needs a device with a magnetometer.'}</p><button class="btn" id="cmp">${I_('qibla')} ${S.ui==='ur'?'کمپاس شروع کریں':'Start compass'}</button> <a class="btn" href="#/prayer">${I_('pin')} ${S.ui==='ur'?'لوکیشن بدلیں':'Change location'}</a></div>`;
 const on=e=>{let h=e.webkitCompassHeading??(e.absolute||e.type==='deviceorientationabsolute'?(360-e.alpha)%360:null);if(h==null)return;const d=$('#dial');if(!d)return off();d.style.transform=`rotate(${-h}deg)`;const diff=turn(q,h);$('#hd').textContent=`Heading ${h.toFixed(0)}° · ${Math.abs(diff)<5?'✓ Facing Qibla':(diff>0?'turn right ':'turn left ')+Math.abs(diff).toFixed(0)+'°'}`};
 const off=()=>{removeEventListener('deviceorientationabsolute',on);removeEventListener('deviceorientation',on)};
 $('#cmp').onclick=async()=>{if(!window.DeviceOrientationEvent){$('#hd').textContent='Compass not supported on this device. Use the bearing above.';return}try{if(DeviceOrientationEvent.requestPermission&&await DeviceOrientationEvent.requestPermission()!=='granted'){$('#hd').textContent='Motion permission denied. Enable it in Settings › Safari › Motion & Orientation.';return}}catch{$('#hd').textContent='Motion permission was not granted.';return}off();addEventListener('ondeviceorientationabsolute' in window?'deviceorientationabsolute':'deviceorientation',on)}}

// ---------- Reader + audio ----------
// One persistent <audio> element (required for iOS to keep playing on auto-advance / locked screen),
// plus a second element only used to preload the next file.
const audio=new Audio();audio.preload='auto';const pre=new Audio();pre.preload='auto';
let cur=null,errs=0,oneShot=false;window.__audio=audio;
const arUrls=async s=>(await j(`${API}/surah/${s}/${S.reciter}`)).ayahs.map(a=>a.audio);
/** Per-ayah clip lists for the current audio mode (Arabic / translation / both). */
const urlsFor=async s=>{const n=AYAH_COUNTS[s-1];let ar=[];if(S.amode!=='tr'){try{ar=await arUrls(s)}catch(e){if(S.amode==='ar')throw e}}
 return Array.from({length:n},(_,i)=>ayahClips(S.amode,ar[i],S.talang,s,i+1))};
const isWhole=w=>w&&S.amode==='ar';
function setClip(){const c=cur.urls[cur.i][cur.part];audio.src=cur.altOn?c.alt:c.u}
const surahUrl=(s,br)=>`https://cdn.islamic.network/quran/audio-surah/${br}/${S.reciter}/${s}.mp3`;
async function surahName(s){try{return (await surahs())[s-1].englishName}catch{return 'Surah '+s}}
function playerUI(){const p=$('#player');p.hidden=!cur||!!cur.quiet;if(!cur)return;$('#pPlay').textContent=audio.paused?'▶':'⏸';$('#pPlay').setAttribute('aria-label',audio.paused?'Play':'Pause');
 $('#pInfo').textContent=cur.clip?cur.name:`${cur.name} ${cur.s}${cur.whole?'':':'+(cur.i+1)}`+(hifzCfg&&hifzPos?` · 🔁 ${hifzPos.c+1}/${hifzCfg.each}${hifzCfg.range>1?' · R'+(hifzPos.r+1)+'/'+hifzCfg.range:''}`:'');markPlaying()}
function markPlaying(){document.querySelectorAll('.ayah.playing').forEach(e=>e.classList.remove('playing'));if(!cur||cur.whole)return;
 if(!location.hash.match(new RegExp('^#/surah/'+cur.s+'(/|$)')))return;window.__ensureAyah?.(cur.i+1);const el=document.getElementById('a'+(cur.i+1));if(el){el.classList.add('playing');if(!audio.paused)el.scrollIntoView({block:'center',behavior:'smooth'})}}
function media(){if(!('mediaSession' in navigator)||!cur)return;try{navigator.mediaSession.metadata=new MediaMetadata({title:`${cur.name} ${cur.s}${cur.whole?'':':'+(cur.i+1)}`,artist:S.reciterName||S.reciter,album:'Quran Safar',artwork:[{src:import.meta.env.BASE_URL+'icon-512.png',sizes:'512x512',type:'image/png'}]})}catch{}}
function msHandlers(){if(!('mediaSession' in navigator))return;const ms=navigator.mediaSession,h=(a,f)=>{try{ms.setActionHandler(a,f)}catch{}};
 h('play',()=>{audio.play().catch(()=>{});playerUI()});h('pause',()=>{audio.pause();playerUI()});h('nexttrack',()=>advance(true));h('previoustrack',()=>prev())}
msHandlers();
// One sound at a time across the app: the Qaida player (qaida-play.js) and this player tell each other when they start.
addEventListener('qs:audio',e=>{if((e.detail==='qaida'||e.detail==='hadith'||e.detail==='ruqyah'||e.detail==='janazah')&&!audio.paused)audio.pause()});addEventListener('qs:media-restore',msHandlers);
async function playPos(s,i,whole=S.surahAudio){whole=isWhole(whole);if(!validSurah(s))return stop();const name=await surahName(s);errs=whole?errs:0;
 if(whole){cur={s,i:0,name,whole:true,br:cur?.br||128};audio.src=surahUrl(s,cur.br)}
 else{let urls;try{urls=await urlsFor(s)}catch{toast(t('err'));return stop()}if(!urls[i])return stop();cur={s,i,name,urls,part:0};setClip();
  const n=nextPos(s,i);if(n&&n.s===s)pre.src=urls[n.i][0].u;else if(n&&S.autoNext)urlsFor(n.s).then(u=>pre.src=u[0][0].u).catch(()=>{})}
 try{await audio.play()}catch(e){if(e.name==='NotAllowedError'){toast('Tap ▶ to start audio')}}playerUI();media()}
function advance(manual){if(!cur)return;
 if(hifzCfg&&!manual&&!cur.whole&&cur.s===hifzCfg.s){const nx=hifzNextPos();if(!nx){hifzCfg=null;toast(S.ui==='ur'?'حفظ سیشن مکمل':'Hifz session complete ✓');audio.pause();return playerUI()}return playPos(hifzCfg.s,nx-1,false)}if(cur.whole){if(S.autoNext&&cur.s<114||manual)return playPos(cur.s+1,0,true);return stop()}
 if(!S.continuous&&!manual)return playerUI();const n=nextPos(cur.s,cur.i);if(!n)return stop();
 if(n.s!==cur.s){if(!S.autoNext&&!manual)return stop();const viewing=location.hash.match(new RegExp('^#/surah/'+cur.s+'(/|$)'));playPos(n.s,n.i).then(()=>{if(viewing&&!document.getElementById('recite'))location.hash=`#/surah/${n.s}`})}else playPos(n.s,n.i)}
function prev(){if(!cur)return;if(cur.whole)return playPos(Math.max(1,cur.s-1),0,true);if(cur.i>0)return playPos(cur.s,cur.i-1);if(cur.s>1)playPos(cur.s-1,AYAH_COUNTS[cur.s-2]-1)}
function stop(){audio.pause();cur=null;hifzCfg=null;playerUI();if('mediaSession' in navigator)navigator.mediaSession.playbackState='none'}
audio.onended=()=>{if(oneShot){oneShot=false;cur=null;return playerUI()}if(cur&&!cur.whole&&cur.urls&&cur.part+1<cur.urls[cur.i].length){cur.part++;cur.altOn=false;setClip();audio.play().catch(()=>{});return}advance(false)};
/** Play a single clip (dua / word audio) through the same player. */
function playUrl(url,label,quiet){hifzCfg=null;oneShot=true;cur={s:0,i:0,name:label||'Audio',whole:true,clip:true,quiet:!!quiet};audio.src=url;audio.play().catch(()=>{});if(!quiet)playerUI()}
const hifzNextPos=()=>{const p=hifzNext(hifzCfg,hifzPos);hifzPos=p;return p?p.a:null};
audio.onplay=()=>{dispatchEvent(new CustomEvent('qs:audio',{detail:'app'}));if('mediaSession' in navigator)navigator.mediaSession.playbackState='playing';playerUI()};audio.onpause=()=>{if('mediaSession' in navigator)navigator.mediaSession.playbackState='paused';playerUI()};
audio.onerror=()=>{if(!cur||!audio.src)return;if(cur.whole){if(cur.br===128){cur.br=64;audio.src=surahUrl(cur.s,64);audio.play().catch(()=>{});return}toast('Whole-surah audio unavailable for this reciter; playing ayah by ayah');return playPos(cur.s,0,false)}
 const c=cur.urls?.[cur.i]?.[cur.part];if(c&&c.alt&&!cur.altOn){cur.altOn=true;setClip();audio.play().catch(()=>{});return}
 if(++errs>3){toast(t('err'));return stop()}if(cur.urls&&cur.part+1<cur.urls[cur.i].length){cur.part++;cur.altOn=false;setClip();audio.play().catch(()=>{});return}advance(true)};
$('#pPlay').onclick=()=>{if(audio.paused){audio.play().catch(()=>{})}else audio.pause()};
$('#pNext').onclick=()=>advance(true);$('#pPrev').onclick=prev;$('#pClose').onclick=stop;
function toast(m){let e=$('#toast');if(!e){e=document.createElement('div');e.id='toast';e.setAttribute('role','status');document.body.append(e)}e.textContent=m;e.hidden=false;clearTimeout(e._t);e._t=setTimeout(()=>e.hidden=true,3500)}

const OFF=import.meta.env.BASE_URL+'offline/',BUNDLED=['en.sahih','ur.jalandhry','ur.kanzuliman'];
/** Bundled Uthmani text, loaded per surah (small files = fast first paint). Returns sparse array AR[s-1]. */
async function arabic(list=[]){const A=[];await Promise.all([...new Set(list)].map(async s=>{A[s-1]=await j(OFF+'s/ar/'+s+'.json')}));return A}
/** Translation for surah n: bundled offline editions first, then API, then bundled English fallback. */
const bundledTr=async(n,ed)=>{const [m,t]=await Promise.all([j(OFF+'ed.json'),j(OFF+`s/${ed}/${n}.json`)]);return {edition:m[ed],texts:t}};
async function transFor(n,ed=S.trans){if(BUNDLED.includes(ed))return bundledTr(n,ed);
 try{const d=await j(`${API}/surah/${n}/${ed}`);return {edition:d.edition,texts:d.ayahs.map(a=>a.text)}}catch{return {...await bundledTr(n,'en.sahih'),fallback:true}}}
async function transJuz(n){const rs=juzRanges(n);const parts=await Promise.all(rs.map(([s])=>transFor(s)));return {edition:parts[0].edition,fallback:parts.some(p=>p.fallback),parts}}

// Long surahs render progressively (CHUNK ayahs at a time, more appended as you scroll) so Al-Baqara opens instantly.
let RC=null,AUTOT=false,AUTOH=null;addEventListener('hashchange',()=>RC?.close());
const CHUNK=30;let hifzCfg=null,hifzPos=null;
// v3.6.4: a Hifz session is [#/hifztest selection] -> [#/surah/N/from + full-screen Hifz overlay]; leaving it (X, summary, Back) always returns to the selection.
// Moving on to the next surah replaces the session entry, so it never stacks reader pages or exposes the reader.
function startHifzTest(c){if(cur)stop();AUTOH=c;const tgt=`#/surah/${c.s}/${c.from}`;
 if(history.state?.hz===1&&document.getElementById('recite'))return location.replace(tgt);
 if(!location.hash.startsWith('#/hifztest'))try{history.pushState(null,'','#/hifztest')}catch{/* ignore */}
 location.hash=tgt}
const exitHifz=()=>{if(history.state?.hz===1)history.back();else location.replace('#/hifztest')};
function startHifz(c){hifzCfg=c;hifzPos={a:c.from,c:0,r:0};S.continuous=true;playPos(c.s,c.from-1,false);toast(S.ui==='ur'?'حفظ سیشن شروع':`Hifz: ${c.s}:${c.from}-${c.to} · ×${c.each} each · range ×${c.range}`)}
async function reader(n,start){if(!validSurah(n)){location.hash='#/quran';return}loading();F.markRead();
 const [AR,tr,trs,recs,list]=await Promise.all([arabic([n]),transFor(n),editions('translation'),audioEds(),surahs()]);const meta=list[n-1];
 setTitle(`${n}. ${meta.englishName}`);const bm=LS.get('bookmarks',[]);let notes=F.getNotes();const tlang=PK.langOfEdition(trs,S.trans);const rtl=tr.edition.direction==='rtl';const isUr=tr.edition.language==='ur';
 const txts=AR[n-1].map((x,i)=>ayahText(n,i+1,x));let words=null,tjd=null;const view=app;const tjOn=()=>localStorage.getItem('qsTjR')==='1';
 const one=i=>{const ref=`${n}:${i+1}`;const w=words?.[i+1];
  return `<article class="ayah ${F.isMemorised(ref)?'mem':''}" id="a${i+1}"><div class="tools"><span class="badge">${ref}</span><button data-play="${i}" aria-label="Play from ${ref}">▶</button><button data-taf="${ref}" aria-label="${t('tafsir')} ${ref}">${I_('tafsir')}</button><button data-bm="${ref}" aria-label="Bookmark ${ref}">${bm.some(b=>b.ref===ref)?'★':'☆'}</button><button data-note="${ref}" aria-label="Note ${ref}" class="${notes[ref]?'has':''}">${I_('notes')}</button><button data-share="${i}" aria-label="Share ${ref}">${I_('share')}</button><button data-mem="${ref}" aria-label="Memorised ${ref}">${F.isMemorised(ref)?'🧠':'○'}</button><button data-cp="${i}" aria-label="Copy ${ref}">⧉</button></div>
  <p class="ar" dir="rtl" lang="ar">${w?w.map((x,k)=>`<span class="w" data-w="${i+1}.${k}">${esc(x.t)}</span>`).join(' '):(tjOn()&&tjd&&tjd[i]?TJ.segHtml(tjd[i],esc):esc(txts[i]))} <span class="end">﴿${(i+1).toLocaleString('ar-EG')}﴾</span></p><p class="tr ${isUr?'ur':''}" dir="${rtl?'rtl':'ltr'}" lang="${esc(tr.edition.language)}">${esc(tr.texts[i]??'')}</p>${notes[ref]?`<p class="note">${I_('notes')} ${esc(notes[ref].text)}</p>`:''}</article>`};
 const ur=S.ui==='ur';
 app.innerHTML=`<button class="tutorbar" id="recT">${I_('tutor')}<span>${ur?'تلاوت اور سیکھیں':'Recite & Learn'}<small>${ur?'لائیو ٹیوٹر — الفاظ خود روشن ہوں':'Live tutor — words light up as you recite'}</small></span><svg class="ic chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>
 <div class="rtool"><div class="rcard rsel"><label><span>${t('tlang')}</span><select id="trL" aria-label="${t('tlang')}">${PK.langOptions(PK.transLangs(trs),tlang,S.ui)}</select></label><label><span>${t('translator')}</span><select id="tr" aria-label="${t('translator')}">${PK.translatorOptions(trs,tlang,S.trans,S.ui)}</select></label><label><span>${t('reciter')}</span><select id="rc" aria-label="${t('reciter')}">${PK.reciterOptions(recs,S.reciter,S.ui)}</select></label></div>
 <div class="rtiles" role="group" aria-label="${ur?'ٹولز':'Tools'}"><button class="tile" id="playAll" aria-label="${t('play')}">${I_('play')}<b>${ur?'سورت سنیں':'Play surah'}</b></button><button class="tile ${S.wbw?'on':''}" id="wbwT" aria-pressed="${!!S.wbw}">${I_('letters')}<b>${ur?'لفظ بہ لفظ':'Word by word'}</b></button><button class="tile ${tjOn()?'on':''}" id="tjT" aria-pressed="${tjOn()}">${I_('letters')}<b>${ur?'تجوید کے رنگ':'Tajweed colours'}</b></button></div>
 <div class="rcard rctl">${audioBar('r')}</div></div>
 ${tr.fallback?`<p class="card muted">${t('offlineTr')}</p>`:''}
 <div class="head"><div class="ar big">${esc(meta.name)}</div><small>${esc(meta.englishNameTranslation)} · ${meta.numberOfAyahs} ${t('ayahs')}</small>${n!=1&&n!=9?'<div class="ar bism">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>':''}</div>
 <div class="rtk" id="rtk" hidden></div><div id="ays" class="${S.hifzHide?'hide-ar':''}"></div><div id="more" class="muted c"></div>
 <div class="pager">${n>1?`<a class="btn" href="#/surah/${n-1}">‹ ${n-1}</a>`:'<span></span>'}${n<114?`<a class="btn" href="#/surah/${n+1}">${n+1} ›</a>`:''}</div>`;
 let shown=0;const box=$('#ays');const io=new IntersectionObserver(es=>es.forEach(x=>{if(x.isIntersecting&&location.hash.startsWith('#/surah/'+n))LS.set('lastRead',{s:n,a:+x.target.id.slice(1),name:meta.englishName})}),{rootMargin:'-40% 0px -55% 0px'});
 const ensure=upto=>{if(view!==app)return;upto=Math.min(txts.length,upto);if(upto<=shown)return;let h='';for(let i=shown;i<upto;i++)h+=one(i);box.insertAdjacentHTML('beforeend',h);for(let i=shown;i<upto;i++)io.observe(document.getElementById('a'+(i+1)));shown=upto;$('#more').textContent=shown<txts.length?t('loading'):''};
 window.__ensureAyah=i=>{if(location.hash.match(new RegExp('^#/surah/'+n+'(/|$)')))ensure(i+CHUNK)};
 ensure(Math.max(CHUNK,(+start||0)+10));
 const sentinel=new IntersectionObserver(es=>{if(es[0].isIntersecting)ensure(shown+CHUNK)},{rootMargin:'1200px 0px'});sentinel.observe($('#more'));
 const redraw=()=>{const keep=shown;box.innerHTML='';shown=0;ensure(keep);markPlaying()};
 $('#tr').onchange=e=>{S.trans=e.target.value;save();reader(n,lastVisible(n))};
 $('#trL').onchange=e=>{S.trans=PK.defaultTranslator(trs,e.target.value)||S.trans;save();reader(n,lastVisible(n))};
 $('#rc').onchange=e=>{S.reciter=e.target.value;S.reciterName=e.target.selectedOptions[0].dataset.en||e.target.selectedOptions[0].textContent;save();const was=cur&&!audio.paused?cur:null;stop();if(was)playPos(was.s,was.i);reader(n,lastVisible(n))};
 $('#playAll').onclick=()=>{hifzCfg=null;playPos(n,0)};bindAudioBar('r');
 const loadW=async()=>{try{words=await F.wbw(n);redraw();tjLeg()}catch{S.wbw=false;save();$('#wbwT').classList.remove('on');toast(S.ui==='ur'?'لفظ بہ لفظ کے لیے انٹرنیٹ درکار ہے':'Word-by-word needs an internet connection')}};
 $('#wbwT').onclick=e=>{S.wbw=!S.wbw;save();e.currentTarget.classList.toggle('on',S.wbw);e.currentTarget.setAttribute('aria-pressed',S.wbw);if(S.wbw)loadW();else{words=null;redraw();tjOn()&&!tjd?loadTjR():tjLeg()}};
 S.hifzHide=false;save(); // v3.7.3: Hide text is set only by the Hifz page and applies to the surah it opens (no toggle in the tools row)
 const tjLeg=()=>{const k=$('#rtk');const on=tjOn()&&!words;k.hidden=!on;k.innerHTML=on?TJ.legend(ur).map(g=>`<span><i style="background:${g.color}"></i>${esc(g.name)}</span>`).join('')+`<small style="width:100%;text-align:center" class="muted">${ur?'رنگین حرف دبائیں':'Tap a coloured letter'}</small>`:''};
 const loadTjR=async()=>{try{if(!tjd){const f=await j(OFF+'tj/'+n+'.json');tjd=txts.map((tx,i)=>TJ.ayahSegs(AR[n-1][i],tx,f[i]))}}catch{tjOn()&&toast(ur?'تجوید ڈیٹا لوڈ نہیں ہو سکا':'Tajweed data could not be loaded')}redraw();tjLeg()};
 $('#tjT').onclick=e=>{const on=!tjOn();localStorage.setItem('qsTjR',on?'1':'0');e.currentTarget.classList.toggle('on',on);e.currentTarget.setAttribute('aria-pressed',on);if(on&&!words)loadTjR();else{redraw();tjLeg()}};
 if(tjOn())loadTjR();
 if(S.wbw)loadW();
 $('#recT').onclick=async()=>{const b=$('#recT');b.disabled=true;try{if(cur)stop();const [R,w]=await Promise.all([import('./recite.js'),words?Promise.resolve(words):F.wbw(n).catch(()=>null)]);RC=R;
  R.open(n,lastVisible(n)||+start||1,{words:w,txts,snames:list,ayahUrl:(a,sn=n)=>arUrls(sn).then(u=>u[a-1]).catch(()=>null),event:()=>GC.event('feature-recite'),gc:GC.event})}catch{toast(t('err'))}finally{b.disabled=false}};
 if(AUTOT){AUTOT=false;$('#recT').click()}
 if(AUTOH&&AUTOH.s===n){const H=AUTOH;AUTOH=null;try{history.replaceState({...(history.state||{}),hz:1},'')}catch{/* ignore */}(async()=>{try{const hzTr=S.ui==='ur'&&tr.edition?.language!=='ur'?await bundledTr(n,'ur.jalandhry').catch(()=>null):null;const [R,w]=await Promise.all([import('./recite.js'),words?Promise.resolve(words):F.wbw(n).catch(()=>null)]);RC=R;
  R.open(n,H.from,{words:w,txts,to:H.to,hifz:true,exit:exitHifz,snames:list,showTr:H.showTr,auto:H.auto,hs:H.hs||undefined,next:H.next||[],onNext:([s2,f2,t2],rest,hs)=>startHifzTest({...H,s:s2,from:f2,to:t2,next:rest,hs}),trOf:a=>(hzTr?.texts||tr.texts)[a-1]||'',ayahUrl:(a,sn=n)=>arUrls(sn).then(u=>u[a-1]).catch(()=>null),event:()=>GC.event('feature-recite'),gc:GC.event})}catch{toast(t('err'))}})()}
 app.onclick=e=>{const tjEl=e.target.closest('.tj');if(tjEl){const r=TJ.info(+tjEl.dataset.r,ur);if(r){let tip=$('#wtip');if(!tip){tip=document.createElement('div');tip.id='wtip';tip.setAttribute('role','status');document.body.append(tip)}tip.innerHTML=`<b style="color:${r.color}">${esc(r.name)}</b><br>${esc(r.text)}`;tip.hidden=false;clearTimeout(tip._t);tip._t=setTimeout(()=>tip.hidden=true,6000)}return}
  const wEl=e.target.closest('.w');if(wEl&&words){const [a,k]=wEl.dataset.w.split('.').map(Number);const w=words[a][k];document.querySelectorAll('.w.on').forEach(x=>x.classList.remove('on'));wEl.classList.add('on');
   let tip=$('#wtip');if(!tip){tip=document.createElement('div');tip.id='wtip';tip.setAttribute('role','status');document.body.append(tip)}tip.innerHTML=`<span class="ar">${esc(w.t)}</span> <i>${esc(w.tr)}</i><br><b>${esc(w.m)}</b>`;tip.hidden=false;tip.dataset.k=wEl.dataset.w;clearTimeout(tip._t);tip._t=setTimeout(()=>tip.hidden=true,6000);if(w.au)playUrl(w.au,'',true);F.dictRank(n,a,k+1).then(r=>{if(r&&!tip.hidden&&tip.dataset.k===wEl.dataset.w)tip.insertAdjacentHTML('beforeend',`<br><a class="dlink" href="#/dict/${r}">📖 ${S.ui==='ur'?'ڈکشنری میں دیکھیں':'See in dictionary'} ›</a>`)}).catch(()=>{});return}
  const arP=e.target.closest('.hide-ar .ar');if(arP){arP.classList.toggle('peek');return}
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.play){hifzCfg=null;playPos(n,+b.dataset.play,false)}
  if(b.dataset.taf)tafsir(b.dataset.taf);
  if(b.dataset.note)F.editNote(b.dataset.note,()=>{notes=F.getNotes();const a=+b.dataset.note.split(':')[1];const el=document.getElementById('a'+a);if(el){el.outerHTML=one(a-1);io.observe(document.getElementById('a'+a))}});
  if(b.dataset.share)F.shareAyah(n,+b.dataset.share+1);
  if(b.dataset.mem){const on=F.toggleMemorised(b.dataset.mem);b.textContent=on?'🧠':'○';b.closest('.ayah').classList.toggle('mem',on)}
  if(b.dataset.bm){let l=LS.get('bookmarks',[]);const r=b.dataset.bm;if(l.some(x=>x.ref===r)){l=l.filter(x=>x.ref!==r);b.textContent='☆'}else{l.unshift({ref:r,name:meta.englishName,text:(tr.texts[r.split(':')[1]-1]||'').slice(0,120)});b.textContent='★'}LS.set('bookmarks',l)}
  if(b.dataset.cp){const i=+b.dataset.cp;navigator.clipboard?.writeText(`${txts[i]}\n${tr.texts[i]}\n(${n}:${i+1})`).then(()=>toast('Copied'),()=>{})}};
 if(start){const go=()=>{if(view===app)document.getElementById('a'+start)?.scrollIntoView({block:'start'})};go();document.fonts?.ready.then(go);setTimeout(go,400)}else document.getElementById('app').scrollTo(0,0);markPlaying();LS.set('lastRead',{s:n,a:+start||1,name:meta.englishName})}
async function scheduleAotd(){if(!S.aotd)return PR.setReminders('aotd',[]);const days=PR.dailyAt(S.aotdT||'07:00',7);const [AR,list]=await Promise.all([arabic(days.map(d=>L2.ayahOfDay(d).s)),surahs()]);return PR.setReminders('aotd',days.map(at=>{const {s,a}=L2.ayahOfDay(at);return {at,title:(S.ui==='ur'?'آج کی آیت · ':'Ayah of the day · ')+list[s-1].englishName+' '+s+':'+a,body:ayahText(s,a,AR[s-1][a-1]).slice(0,180)}})).catch(e=>({ok:false,reason:e.message}))}
const lastVisible=n=>{const l=LS.get('lastRead',{});return l.s===n?l.a:undefined};
async function tafsir(ref){$('#sheet').hidden=false;const body=$('#sheetBody');body.innerHTML=t('loading');
 let eds;try{eds=await editions('tafsir')}catch{eds=[]}if(!eds.length){body.textContent=t('err');return}const draw=async()=>{body.innerHTML=`<h3>${t('tafsir')} ${ref}</h3><select id="tf" aria-label="${t('tafsir')}">${opt(eds,S.tafsir)}</select><div id="tfx" class="muted">${t('loading')}</div>`;
 $('#tf').onchange=e=>{S.tafsir=e.target.value;save();draw()};
 try{const d=await j(`${API}/ayah/${ref}/${S.tafsir}`);$('#tfx').className='taf';$('#tfx').dir=d.edition.direction||'rtl';$('#tfx').textContent=d.text}catch{$('#tfx').textContent=t('err')}};draw()}

// ---------- Hadith ----------
async function hadithHome(){setTitle(t('hadith'));loading();const [eds,info]=await Promise.all([j(HAD+'/editions.json'),j(HAD+'/info.json')]);
 const keep=Object.keys(L2.HCOL).filter(k=>eds[k]);const langs=orderLangs([...new Set(keep.flatMap(k=>eds[k].collection.map(c=>c.name.split('-')[0])))]);
 app.innerHTML=hsBar()+`<label class="bar">${t('lang')} <select id="hl" aria-label="Hadith language">${langs.map(l=>`<option value="${l}" ${l===S.hlang?'selected':''}>${esc(langName(l,S.ui))}</option>`).join('')}</select></label><ul class="list">${keep.map(k=>[k,eds[k]]).map(([k,b])=>{const has=b.collection.some(c=>c.name.startsWith(S.hlang+'-'));return `<li><a href="#/hadith/${k}"><span><b>${esc(b.name)}</b><small>${Object.keys(info[k]?.metadata.sections||{}).length-1} ${t('books')} · ${orderLangs(b.collection.map(c=>edLang(c.name)).filter((v,i,a)=>a.indexOf(v)===i)).map(l=>esc(langName(l,S.ui,true))).join(', ')}${has?'':' · ('+esc(langName(S.hlang,S.ui,true))+(S.ui==='ur'?' دستیاب نہیں':' not available')+')'}</small></span></a></li>`}).join('')}</ul>`;
 bindHs();$('#hl').onchange=e=>{S.hlang=e.target.value;save();hadithHome()}}
async function hadithBook(book){if(!L2.hasBook(book)){location.replace('#/hadith');return}loading();const info=await j(HAD+'/info.json');const m=info[book].metadata;setTitle(m.name);
 app.innerHTML=`<ul class="list">${Object.entries(m.sections).filter(([k,v])=>k!=='0'&&v).map(([k,v])=>`<li><a href="#/hadith/${book}/${k}"><b class="num">${k}</b><span><b>${esc(v)}</b><small>${m.section_details?.[k]?`#${m.section_details[k].hadithnumber_first}–${m.section_details[k].hadithnumber_last}`:''}</small></span></a></li>`).join('')}</ul>`;document.getElementById('app').scrollTo(0,0)}
const HURS={};const hurOf=book=>HURS[book]??=j(import.meta.env.BASE_URL+'offline/x/hur/'+book+'.json').catch(()=>({}));
const autoLbl=()=>S.ui==='ur'?'انگریزی سے خودکار ترجمہ':'Auto-translated from English';
const RTLL=l=>/^(ara|urd|fas)/.test(l);
/** Languages a hadith can be read in: Arabic, Urdu, English, plus the language picked on the Hadith home when it is another one. */
const rdLangs=()=>{const b=['ara','urd','eng'];return b.includes(S.hlang)?b:[...b,S.hlang]};
const edsOf=async book=>{const eds=await j(HAD+'/editions.json');const c=eds[book].collection.map(x=>x.name);return rdLangs().filter(l=>c.includes(l+'-'+book))};
const selLang=(ks,pref)=>ks.includes(pref||S.hlang)?(pref||S.hlang):ks.includes('eng')?'eng':ks[0];
/** One row per hadith: `h` carries the numbers/grades, `tx` the text per language ({text,auto?} or null when there is none). A hadith with no official Urdu gets the build-time machine translation from English, flagged auto, kept in its own data. Nothing is invented. */
async function rowsFrom(book,L,maps,order){const A=L.includes('urd')?await hurOf(book):{};
 return order.map(n=>{const k=String(n);let meta=null;const tx={};
  for(const l of L){const h=maps[l]?.get(k);if(h&&(!meta||l==='eng'))meta=h;const s=(h?.text||'').trim();tx[l]=s?{text:s}:l==='urd'&&A[k]?{text:A[k],auto:true}:null}
  return{n:k,h:meta||{hadithnumber:+k},tx}})}
const arHl=(text,q)=>{const strip=s=>s.toLowerCase().replace(/[\u064b-\u0652\u0670\u0640]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ک/g,'ك').replace(/ی/g,'ي');const V={'ا':'[اأإآٱ]','ي':'[يىی]','ك':'[كک]'};const re=new RegExp([...strip(q)].map(c=>(V[c]||c.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'))).join('[\\u064b-\\u0652\\u0670\\u0640]*'),'g');let o='',l=0;text.replace(re,(m,off)=>{o+=esc(text.slice(l,off))+'<mark>'+esc(m)+'</mark>';l=off+m.length;return m});return o+esc(text.slice(l))};
const selRow=(ks,sel)=>`<div class="seg hd-sel" role="radiogroup" aria-label="${S.ui==='ur'?'متن کی زبان':'Text language'}">${ks.map(l=>`<button type="button" role="radio" class="btn ${l===sel?'on':'ghost'}" data-sl="${l}" aria-checked="${l===sel}">${esc(langName(l,S.ui,true))}</button>`).join('')}</div>`;
/** Chooses the text shown on every card of the screen (Arabic / Urdu / English ...) and remembers it. */
function bindSel(){app.querySelectorAll('[data-sl]').forEach(b=>b.onclick=()=>{const l=b.dataset.sl;S.hlang=l;save();
 app.querySelectorAll('article.hd').forEach(c=>{if(!c.querySelector(`.hd-t[data-l="${l}"]`)||c.dataset.sel===l)return;c.dataset.sel=l;
  c.querySelectorAll('.hd-t').forEach(p=>{p.hidden=p.dataset.l!==l});c.querySelectorAll('[data-sl]').forEach(x=>{const on=x.dataset.sl===l;x.classList.toggle('on',on);x.classList.toggle('ghost',!on);x.setAttribute('aria-checked',on)});
  c.dispatchEvent(new CustomEvent('hd-sel',{bubbles:true}))})})}
// One hadith card: international number, grades, a row to pick Arabic / Urdu / English, the picked text with its speaker, share. In lists the card opens the full reader.
function hcard(book,row,url,{q='',sel='',open=false,big=false,arq=false}={}){const h=row.h,no=L2.hadithIntl(book,h)||String(h.hadithnumber);const ref=`${L2.HCOL[book]?.[0]||book} ${no}`;
 const ks=Object.keys(row.tx),cur=selLang(ks,sel);
 const pan=ks.map(l=>{const x=row.tx[l],nm=langName(l,S.ui,true);
  if(!x)return `<div class="hd-t" data-l="${l}" data-miss="1" ${l===cur?'':'hidden'}><p class="hd-miss muted">${l==='ara'?(S.ui==='ur'?'اس حدیث کا عربی متن موجود نہیں':'No Arabic text for this hadith'):S.ui==='ur'?`اس حدیث کا ${esc(nm)} ترجمہ موجود نہیں`:`No ${esc(nm)} translation for this hadith`}</p></div>`;
  const ar=l==='ara';return `<div class="hd-t" data-l="${l}" ${x.auto?'data-auto="1"':''} ${l===cur?'':'hidden'}><p class="${ar?'ar sm2':'tr'}" dir="${RTLL(l)?'rtl':'ltr'}">${ar?(arq?arHl(x.text,q):esc(x.text)):highlight(x.text,arq?'':q)}</p>${x.auto?`<small class="hd-auto">${autoLbl()}</small>`:''}</div>`}).join('');
 const sh=l=>row.tx[l]?.text?row.tx[l].text+(row.tx[l].auto?` (${autoLbl()})`:''):'';const shl=cur!=='ara'&&row.tx[cur]?cur:row.tx.eng?'eng':ks.find(l=>l!=='ara'&&row.tx[l])||'';
 return `<article class="ayah hd ${big?'hd-big':''}" data-no="${esc(no)}" data-sel="${cur}"><div class="tools"><span class="badge" title="International number">${esc(ref)}</span>${(h.grades||[]).slice(0,2).map(g=>`<small class="muted">${esc(g.grade)} (${esc(g.name)})</small>`).join(' ')}<span class="grow"></span>${F.shareBtn({ar:row.tx.ara?.text||'',tr:shl?sh(shl):'',ref,url})}</div>${selRow(ks,cur)}<div class="hd-body"><div class="hd-ctl"></div><div class="hd-tx">${pan}</div></div><small class="hd-nv muted" hidden></small><div class="hd-foot"><small class="muted">${S.ui==='ur'?'کتاب':'Book'} ${h.reference?.book??''}, ${S.ui==='ur'?'حدیث':'Hadith'} ${h.reference?.hadith??''}</small>${open?`<a class="hd-open" href="#/hadith/${book}/n/${esc(no)}" aria-label="${S.ui==='ur'?'پوری حدیث کھولیں':'Open this hadith'}" title="${S.ui==='ur'?'کھولیں':'Open'}"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></a>`:''}</div></article>`}
const hsBar=(book='',val='')=>`<form class="card hsf" id="hsf"><input class="inp" id="hsq" value="${esc(val)}" aria-label="Hadith search" placeholder="${S.ui==='ur'?'مثلاً بخاری 1 · مسلم 2564 · یا کوئی لفظ':'e.g. Bukhari 1 · Muslim 2564 · or a keyword'}"><div class="bar"><select id="hsb" aria-label="Collection">${Object.entries(L2.HCOL).map(([k,v])=>`<option value="${k}" ${k===book?'selected':''}>${S.ui==='ur'?v[1]:v[0]}</option>`).join('')}</select><input class="inp" id="hsn" inputmode="numeric" aria-label="Hadith number" placeholder="#" style="max-width:110px"><button class="btn">${icon('search')} ${S.ui==='ur'?'تلاش':'Go'}</button></div></form><a class="btn ha-entry" id="haEntry" href="#/haudio/${book}">${icon('headphones')} ${S.ui==='ur'?'حدیث آڈیو':'Hadith Audio'}</a>`;
function bindHs(){$('#hsf').onsubmit=e=>{e.preventDefault();const q=$('#hsq').value.trim(),b=$('#hsb').value,n=$('#hsn').value.trim();
 if(n)return location.hash=`#/hadith/${b}/n/${encodeURIComponent(n)}`;const r=L2.parseHadithRef(q);if(r)return location.hash=`#/hadith/${r.book}/n/${r.n}`;if(q)location.hash=`#/hsearch/${b}/${encodeURIComponent(q)}`}}
async function hadithNo(book,no){if(!L2.hasBook(book)){location.replace('#/hadith');return}loading();const root=app;let hn;if(book==='muslim'){const map=await j(import.meta.env.BASE_URL+'offline/x/muslim-map.json');hn=map[String(no).toLowerCase()];if(!hn){app.innerHTML=hsBar(book)+`<p class="card">${S.ui==='ur'?'یہ نمبر نہیں ملا':'Number not found'}: Muslim ${esc(no)}</p>`;bindHs();return}}
 else{const m=String(no).match(/^(\d+)([a-z])?$/i);if(!m){app.innerHTML=hsBar(book)+`<p class="card">${t('err')}</p>`;bindHs();return}hn=m[1]}
 const L=await edsOf(book);const D=await Promise.all(L.map(l=>j(`${HAD}/editions/${l}-${book}/${hn}.min.json`).catch(()=>null)));
 const maps={};let md=null,key='';L.forEach((l,i)=>{const hh=D[i]?.hadiths?.[0];maps[l]=new Map(hh?[[String(hh.hadithnumber),hh]]:[]);if(hh&&(!md||l==='eng')){md=D[i].metadata}if(hh&&!key)key=String(hh.hadithnumber)});
 setTitle(`${L2.HCOL[book]?.[S.ui==='ur'?1:0]||book} ${no}`);if(!md){app.innerHTML=hsBar(book)+`<p class="card">${S.ui==='ur'?'یہ نمبر نہیں ملا':'Number not found'}: ${esc(no)}</p>`;bindHs();return}
 const rows=await rowsFrom(book,L,maps,[key]);const sec=Object.keys(md.section||{})[0];
 // Chapter pager (3 / 7): the hadiths of this chapter, in order.
 let pg=null;if(sec!==undefined){try{const pl=L.includes('ara')?'ara':L[0];const s=await j(`${HAD}/editions/${pl}-${book}/sections/${sec}.min.json`);const hs=s.hadiths||[];const i=hs.findIndex(x=>String(x.hadithnumber)===key);
  if(i>=0){const rn=x=>L2.hadithIntl(book,x)||String(x.hadithnumber);pg={i,n:hs.length,prev:i>0?`#/hadith/${book}/n/${rn(hs[i-1])}`:'',next:i<hs.length-1?`#/hadith/${book}/n/${rn(hs[i+1])}`:''}}}catch{/* no pager */}}
 const arw=S.ui==='ur'?['پچھلی حدیث','اگلی حدیث']:['Previous hadith','Next hadith'];
 const pager=pg?`<div role="navigation" class="hd-pager" aria-label="${S.ui==='ur'?'اس باب کی احادیث':'Hadiths in this chapter'}">${pg.prev?`<a class="btn ghost" id="hdPrev" href="${pg.prev}" aria-label="${arw[0]}">‹</a>`:`<span class="btn ghost" aria-disabled="true" id="hdPrev">‹</span>`}<b class="hd-ct" id="hdCt" dir="ltr">${pg.i+1} / ${pg.n}</b>${pg.next?`<a class="btn ghost" id="hdNext" href="${pg.next}" aria-label="${arw[1]}">›</a>`:`<span class="btn ghost" aria-disabled="true" id="hdNext">›</span>`}</div>`:'';
 app.innerHTML=HL.listenBar(S.ui)+(sec?`<a class="btn ghost" href="#/hadith/${book}/${sec}">${esc(md.section[sec]||'')} →</a>`:'')+rows.map(r=>hcard(book,r,F.siteUrl(`#/hadith/${book}/n/${no}`),{big:true})).join('')+pager+(pg?'<div class="hd-sp"></div>':'');bindSel();document.getElementById('app').scrollTo(0,0);HL.mount(root,{ui:S.ui,nextHash:pg?pg.next:(book==='muslim'?'':`#/hadith/${book}/n/${+hn+1}`)}).catch(()=>{})}
const fullEd={};const getFull=n=>fullEd[n]??=j(`${HAD}/editions/${n}.min.json`);
async function hadithAudio(book,sec,n){if(!L2.hasBook(book)){book='';sec='';n=''}setTitle(S.ui==='ur'?'حدیث آڈیو':'Hadith Audio');const root=app;await HA.render(root,{j,HAD,BASE:import.meta.env.BASE_URL,esc,ui:S.ui,L2,names:langName},{book,sec,n}).catch(()=>{root.innerHTML=`<p class="card">${t('err')}</p>`})}
async function hadithSearch(book,q){if(!L2.hasBook(book)){location.replace('#/hadith');return}const root=app;setTitle(S.ui==='ur'?'حدیث تلاش':'Hadith search');const r=L2.parseHadithRef(q);if(r){location.replace(`#/hadith/${r.book}/n/${r.n}`);return}
 app.innerHTML=hsBar(book,q)+HL.listenBar(S.ui)+`<p class="muted" id="hsm">${t('loading')}</p><div id="hsr"></div>`;bindHs();const isAr=/[\u0600-\u06ff]/.test(q);const L=await edsOf(book);
 const sed=isAr?'ara':(L.includes(S.hlang)&&S.hlang!=='ara'?S.hlang:'eng');
 let D;try{D=await getFull(sed+'-'+book)}catch{$('#hsm').textContent=t('err');return}const strip=s=>s.toLowerCase().replace(/[\u064b-\u0652\u0670\u0640]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ک/g,'ك').replace(/ی/g,'ي');const nq=strip(q);
 const hits=D.hadiths.filter(h=>h.text&&strip(h.text).includes(nq));const show=hits.slice(0,60);
 const others=await Promise.all(L.map(l=>l===sed?D:getFull(l+'-'+book).catch(()=>null)));const maps={};L.forEach((l,i)=>{maps[l]=new Map((others[i]?.hadiths||[]).map(h=>[String(h.hadithnumber),h]))});
 const rows=await rowsFrom(book,L,maps,show.map(h=>String(h.hadithnumber)));
 $('#hsm').textContent=`${hits.length} ${t('results')}${hits.length>60?' · '+(S.ui==='ur'?'پہلے 60':'showing first 60'):''} · ${D.metadata.name}`;
 $('#hsr').innerHTML=rows.map(r=>hcard(book,r,F.siteUrl(`#/hadith/${book}/n/${L2.hadithIntl(book,r.h)||r.h.hadithnumber}`),{q,sel:sed,open:true,arq:isAr})).join('');bindSel();HL.mount(root,{ui:S.ui}).catch(()=>{})}
async function hadithSection(book,sec){if(!L2.hasBook(book)){location.replace('#/hadith');return}loading();const root=app;const L=await edsOf(book);
 const D=await Promise.all(L.map(l=>j(`${HAD}/editions/${l}-${book}/sections/${sec}.min.json`).catch(()=>null)));const ok=D.find(Boolean);if(!ok)throw new Error('section');
 const maps={};L.forEach((l,i)=>{maps[l]=new Map((D[i]?.hadiths||[]).map(h=>[String(h.hadithnumber),h]))});const base=D[L.indexOf('ara')]||ok;
 setTitle(Object.values(ok.metadata.section)[0]||ok.metadata.name);const rows=await rowsFrom(book,L,maps,base.hadiths.map(h=>String(h.hadithnumber)));
 app.innerHTML=`<p class="muted">${esc(ok.metadata.name)}</p>${HL.listenBar(S.ui)}${rows.map(r=>hcard(book,r,F.siteUrl(`#/hadith/${book}/n/${L2.hadithIntl(book,r.h)||r.h.hadithnumber}`),{open:true})).join('')}`;bindSel();document.getElementById('app').scrollTo(0,0);HL.mount(root,{ui:S.ui,nextHash:/^\d+$/.test(sec)?`#/hadith/${book}/${+sec+1}`:''}).catch(()=>{})}

// ---------- Search ----------
async function search(q=''){setTitle(t('search'));const trs=await editions('translation');
 app.innerHTML=`<form id="sf" class="bar"><input class="inp" id="q" aria-label="${t('q')}" value="${esc(q)}" placeholder="${t('q')}"><select id="se" aria-label="${t('edition')}">${opt(trs.filter(e=>langRank(e.language)<2),S.searchEd||S.trans)}<option value="quran-simple-clean">AR · Arabic text</option>${opt(trs.filter(e=>langRank(e.language)>=2),S.searchEd||S.trans)}</select><button class="btn">${I_('search')}</button></form><div id="sr"></div>`;
 $('#sf').onsubmit=e=>{e.preventDefault();S.searchEd=$('#se').value;save();run()};if(S.searchEd==='quran-simple-clean')$('#se').value='quran-simple-clean';
 const run=async()=>{const v=$('#q').value.trim();if(!v)return;history.replaceState(null,'','#/search/'+encodeURIComponent(v));$('#sr').innerHTML=t('loading');
  // also allow direct ref "2:255"
  const ref=parseRef(v);if(ref){location.hash=`#/surah/${ref.s}${ref.a?'/'+ref.a:''}`;return}if(/^\d+([:.\s]\d+)?$/.test(v)){$('#sr').innerHTML=`<p class="muted">Invalid reference. Surah 1–114, ayah within the surah.</p>`;return}
  try{const r=await fetch(`${API}/search/${encodeURIComponent(v)}/all/${$('#se').value}`).then(r=>r.json());if(r.code===404||typeof r.data==='string')r.data={count:0,matches:[]};const ms=r.data?.matches||[];
   $('#sr').innerHTML=`<p class="muted">${r.data?.count||0} ${t('results')}</p>`+ms.slice(0,300).map(x=>`<a class="card" href="#/surah/${x.surah.number}/${x.numberInSurah}"><span class="badge">${x.surah.englishName} ${x.surah.number}:${x.numberInSurah}</span><p dir="auto">${highlight(x.text,v)}</p></a>`).join('')}catch{$('#sr').textContent=t('err')}};
 if(q)run()}

function bookmarks(){setTitle(t('bookmarks'));const l=LS.get('bookmarks',[]);app.innerHTML=l.length?l.map(b=>`<a class="card" href="#/surah/${b.ref.replace(':','/')}"><span class="badge">${esc(b.name)} ${b.ref}</span><p>${esc(b.text)}…</p></a>`).join(''):`<p class="muted c">${t('none')}</p>`}
function audioBar(p){const u=S.ui==='ur';const show=S.amode!=='ar';
 return `<div class="bar abar" id="${p}_abar"><label>${u?'آڈیو':'Audio'}<select id="${p}_am" aria-label="Audio mode">${AUDIO_MODES.map(([v,e,ur])=>`<option value="${v}" ${S.amode===v?'selected':''}>${u?ur:e}</option>`).join('')}</select></label>
 <label id="${p}_talW" ${show?'':'hidden'}>${u?'ترجمہ آڈیو زبان':'Translation audio'}<select id="${p}_tal" aria-label="Translation audio language">${TRANS_AUDIO.map(v=>`<option value="${v.id}" ${S.talang===v.id?'selected':''}>${u?v.ur:v.en}</option>`).join('')}</select></label></div>`}
function bindAudioBar(p){const re=()=>{const was=cur&&!cur.clip&&!audio.paused?cur:null;if(was){stop();playPos(was.s,was.i)}};
 $('#'+p+'_am').onchange=e=>{S.amode=e.target.value;save();$('#'+p+'_talW').hidden=S.amode==='ar';re()};
 $('#'+p+'_tal').onchange=e=>{S.talang=e.target.value;save();re()}}
async function settings(){setTitle(t('settings'));const [trs,recs,tfs]=await Promise.all([editions('translation'),audioEds(),editions('tafsir')]);
 app.innerHTML=`<div class="form"><label>${t('uiLang')}<select id="s_ui"><option value="en">English</option><option value="ur" ${S.ui==='ur'?'selected':''}>اردو</option></select></label>
 <label>${t('tlang')}<select id="s_tlang">${PK.langOptions(PK.transLangs(trs),PK.langOfEdition(trs,S.trans),S.ui)}</select></label><label>${t('translator')}<select id="s_trans">${PK.translatorOptions(trs,PK.langOfEdition(trs,S.trans),S.trans,S.ui)}</select></label><label>${t('reciter')}<select id="s_reciter">${PK.reciterOptions(recs,S.reciter,S.ui)}</select></label><label>${t('tafsir')}<select id="s_tafsir">${opt(tfs,S.tafsir)}</select></label>
 ${audioBar('s')}<label>${t('size')} <input type="range" min="20" max="48" id="s_size" value="${S.size}"></label><label><input type="checkbox" id="s_dark" ${S.dark?'checked':''}> ${t('dark')}</label><label><input type="checkbox" id="s_cont" ${S.continuous?'checked':''}> ${t('cont')}</label><label><input type="checkbox" id="s_next" ${S.autoNext?'checked':''}> ${t('autoNext')}</label><label><input type="checkbox" id="s_sa" ${S.surahAudio?'checked':''}> ${t('surahAudio')}</label>
 <label>${S.ui==='ur'?'مصحف رسم الخط':'Mushaf script'}<select id="s_script"><option value="uthmani">Uthmani</option><option value="indopak" ${S.script==='indopak'?'selected':''}>Indo-Pak</option></select></label>
 <label>${S.ui==='ur'?'لفظ بہ لفظ زبان':'Word-by-word language'}<select id="s_wbwLang"><option value="">Auto</option>${orderLangs(['en','ur','hi','bn','id','tr']).map(v=>`<option value="${v}" ${S.wbwLang===v?'selected':''}>${esc(langName(v,S.ui))}</option>`).join('')}</select></label>
 <label><input type="checkbox" id="s_aotd" ${S.aotd?'checked':''}> ${S.ui==='ur'?'روزانہ آیت کی اطلاع':'Daily ayah-of-the-day notification'} <input type="time" id="s_aotdT" value="${S.aotdT||'07:00'}" aria-label="Time"></label><small id="aMsg" class="muted"></small>
 
 <p class="muted">Android home-screen widget: on the roadmap (native work).</p></div>`;
 bindAudioBar('s');['script','wbwLang'].forEach(k=>$('#s_'+k).onchange=e=>{S[k]=e.target.value;save()});
 const aot=async()=>{S.aotd=$('#s_aotd').checked;S.aotdT=$('#s_aotdT').value||'07:00';save();const r=await scheduleAotd();$('#aMsg').textContent=r.ok?`✓ ${r.count}`:r.reason};$('#s_aotd').onchange=aot;$('#s_aotdT').onchange=aot;
 ['ui','trans','reciter','tafsir'].forEach(k=>$('#s_'+k).onchange=e=>{S[k]=e.target.value;if(k==='reciter')S.reciterName=e.target.selectedOptions[0].dataset.en||'';save();applyUI();if(k==='ui')settings()});
 $('#s_tlang').onchange=e=>{S.trans=PK.defaultTranslator(trs,e.target.value)||S.trans;save();settings()};
 $('#s_size').oninput=e=>{S.size=+e.target.value;save();applyUI()};$('#s_dark').onchange=e=>{S.dark=e.target.checked;save();applyUI()};[['cont','continuous'],['next','autoNext'],['sa','surahAudio']].forEach(([id,k])=>$('#s_'+id).onchange=e=>{S[k]=e.target.checked;save()})}

// Each navigation renders into a fresh container, so a slow, stale render (e.g. a surah still loading) can never overwrite the newer screen.
async function route(){HL.leave();HA.leave();if(window.__rq)F.ruqyahLeave();if(window.__jz)F.janazahLeave();$('#sheet').hidden=true;try{GC.route(location.hash.replace(/^#\/?/,'').split('/'))}catch{/* analytics never breaks the app */}document.body.classList.remove('is-home');const v=app=document.createElement('div');$('#app').replaceChildren(v);const p=location.hash.replace(/^#\/?/,'').split('/').map(decodeURIComponent);
 $('#back').style.visibility=p[0]?'visible':'hidden';
 const sec={hsearch:'hadith',haudio:'hadith',surah:'quran',juz:'quran',mushaf:'quran',search:'quran',bookmarks:'quran',notes:'quran',khatam:'quran',hifz:'quran',hifztest:'more',recite:'quran',progress:'more',qaida:'more',dict:'more',ruqyah:'more',janazah:'more',prayer:'ibadat',qibla:'ibadat',tracker:'ibadat',ramadan:'ibadat',calendar:'ibadat',tasbeeh:'ibadat',duas:'ibadat',zakat:'ibadat',mosques:'ibadat',names:'ibadat'}[p[0]]??p[0];document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',('#/'+sec)===b.dataset.r||(!sec&&b.dataset.r==='#/')));
 const FR={janazah:F.janazah,qaida:()=>F.qaida(p[1],p[2]),quran:()=>home(),more:F.more,ibadat:F.ibadat,help:F.help,tasbeeh:F.tasbeeh,duas:()=>F.duas(p[1]||undefined,p[2]),names:F.names,tracker:F.tracker,khatam:F.khatam,mushaf:()=>F.mushaf(p[1]),notes:F.notes,calendar:()=>F.calendar(p[1]||0),ramadan:F.ramadan,zakat:F.zakat,mosques:F.mosques,hifz:F.hifz,hifztest:()=>F.hifzTest(p[1]),progress:F.progress,dict:()=>F.dict(p[1],p[2]),ruqyah:F.ruqyah};
 try{document.body.classList.remove('enter');void document.body.offsetWidth;document.body.classList.add('enter');if(FR[p[0]])await FR[p[0]]();else if(p[0]==='recite')p[1]==='review'?await weakPage():p[1]?(AUTOT=true,await reader(+p[1],p[2])):await tutorPage();else if(p[0]==='surah')await reader(+p[1],p[2]);else if(p[0]==='haudio')await hadithAudio(p[1],p[2],p[3]);else if(p[0]==='hsearch')await hadithSearch(p[1]||'bukhari',p[2]||'');else if(p[0]==='hadith')p[2]==='n'?await hadithNo(p[1],p[3]):p[2]?await hadithSection(p[1],p[2]):p[1]?await hadithBook(p[1]):await hadithHome();
  else if(p[0]==='search')await search(p[1]||'');else if(p[0]==='bookmarks')bookmarks();else if(p[0]==='prayer')prayer();else if(p[0]==='qibla')qibla();else if(p[0]==='juz')p[1]?await juzReader(+p[1]):await home('juz');else if(p[0]==='settings'){await settings();app.insertAdjacentHTML('beforeend',`<p class="ver" id="ver">Quran Safar v${__APP_VERSION__}</p>`)}else await F.dashboard()}
 catch(e){if(v!==app)return;console.error(e);v.innerHTML=`<p class="muted c">${t('err')}</p><p class="c"><button class="btn" onclick="location.reload()">↻</button></p>`}}
F.init({app:()=>app,S,save,t,setTitle,loading,toast,weakDrill,resetModel:()=>RC?.resetModel?.(),j,arabic,transFor,surahs,dateCard,tick,pn,playUrl,startHifz,startHifzTest});
addEventListener('hashchange',route);applyUI();route();
// v3.6.2 dates: refresh on app resume and at local midnight so the shown date is always today's (device clock + timezone).
let shownDay=dateKey(),midT=null;
function refreshDates(){const k=dateKey(),changed=k!==shownDay;shownDay=k;const now=new Date();
 document.querySelectorAll('[data-hij]').forEach(e=>{const h=PR.hijri(now,S.ui);e.textContent=h;e.hidden=!h;const sep=e.nextElementSibling;if(sep?.hasAttribute('data-hijsep'))sep.hidden=!h});
 document.querySelectorAll('[data-greg]').forEach(e=>{e.textContent=e.dataset.greg==='short'?gregText(now,S.ui,{weekday:'short',day:true,month:'short',year:true}):PR.greg(now,S.ui)});
 if(changed&&!document.getElementById('recite')&&/^#?\/?(calendar(\/-?\d+)?|ramadan|prayer|tracker)?\/?$/.test(location.hash))route()}
function armMidnight(){clearTimeout(midT);midT=setTimeout(()=>{refreshDates();armMidnight()},msToMidnight()+500)}
['visibilitychange','pageshow','focus','resume'].forEach(ev=>addEventListener(ev,()=>{if(!document.hidden){refreshDates();armMidnight()}}));
armMidnight();setInterval(()=>{if(!document.hidden&&dateKey()!==shownDay)refreshDates()},30000);
if(S.aotd&&(PR.isNative()||('Notification' in window&&Notification.permission==='granted')))scheduleAotd();
// Re-arm alerts on launch only if permission was already granted (no permission prompt without a user gesture).
if(Object.values(PR.P.alerts).some(Boolean)&&localStorage.getItem('prayer')&&(PR.isNative()||('Notification' in window&&Notification.permission==='granted')))PR.schedule().catch(()=>{});
if('serviceWorker' in navigator&&import.meta.env.PROD){const had=!!navigator.serviceWorker.controller;let reloaded=false;
 navigator.serviceWorker.addEventListener('controllerchange',()=>{if(had&&!reloaded){reloaded=true;location.reload()}});
 addEventListener('load',()=>navigator.serviceWorker.register(import.meta.env.BASE_URL+'sw.js',{updateViaCache:'none'}).then(r=>{r.update();document.addEventListener('visibilitychange',()=>{if(!document.hidden)r.update()})}))}
// iOS keyboard: hide nav while typing so it can't be pushed up by the keyboard
const isField=e=>e&&e.matches?.('input:not([type=checkbox]):not([type=radio]):not([type=range]),textarea,select');
document.addEventListener('focusin',e=>{if(isField(e.target))document.body.classList.add('kb')});document.addEventListener('focusout',()=>setTimeout(()=>{if(!isField(document.activeElement))document.body.classList.remove('kb')},50));
export const VERSION=__APP_VERSION__;
// Debug overlay: tap the version line 5× (More/Settings) to show real viewport numbers the user can screenshot.
let dbgTaps=0,dbgT;document.addEventListener('click',e=>{if(!e.target.closest('#ver'))return;clearTimeout(dbgT);dbgT=setTimeout(()=>dbgTaps=0,1500);if(++dbgTaps>=5){dbgTaps=0;showDebug()}});
export function showDebug(){document.getElementById('dbg')?.remove();const mk=c=>{const d=document.createElement('div');d.className=c;document.body.append(d);return d};const p=[mk('vh-probe'),mk('lvh-probe'),mk('svh-probe'),mk('sa-probe')];
 const sa=getComputedStyle(p[3]),r=q=>Math.round(document.querySelector(q)?.getBoundingClientRect().bottom??-1),vv=window.visualViewport;
 const mode=['standalone','fullscreen','minimal-ui','browser'].find(m=>matchMedia(`(display-mode: ${m})`).matches)||'?';
 const txt=`Quran Safar v${__APP_VERSION__}\ndisplay-mode: ${mode}  navigator.standalone: ${navigator.standalone}\ninnerHeight: ${innerHeight}  innerWidth: ${innerWidth}\nvisualViewport: ${vv?Math.round(vv.height)+' (offsetTop '+Math.round(vv.offsetTop)+')':'n/a'}\nscreen: ${screen.width}x${screen.height}  avail: ${screen.availHeight}  dpr: ${devicePixelRatio}\ndocEl.clientHeight: ${document.documentElement.clientHeight}  body.bottom: ${r('body')}\n100vh: ${Math.round(p[0].offsetHeight)}  100lvh: ${Math.round(p[1].offsetHeight)}  100svh: ${Math.round(p[2].offsetHeight)}\nsafe-area t/r/b/l: ${sa.paddingTop} ${sa.paddingRight} ${sa.paddingBottom} ${sa.paddingLeft}\nnav.bottom: ${r('nav')}  app.bottom: ${r('#app')}  header.bottom: ${r('header')}\nUA: ${navigator.userAgent}`;
 p.forEach(x=>x.remove());const d=document.createElement('div');d.id='dbg';d.innerHTML='<button>✕</button>';d.append(document.createTextNode(txt));d.querySelector('button').onclick=()=>d.remove();document.body.append(d);return txt}
// Small "Install app" banner in iOS Safari (not installed yet).
{const ua=navigator.userAgent,iOS=/iPhone|iPad|iPod/.test(ua)||(/Macintosh/.test(ua)&&navigator.maxTouchPoints>1),saf=/Safari\//.test(ua)&&!/CriOS|FxiOS|EdgiOS|OPiOS|GSA\/|FBAN|FBAV|Instagram|WhatsApp|Grok/.test(ua);
 const sa=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
 if(iOS&&saf&&!sa&&!localStorage.getItem('instBanner')){const b=document.createElement('div');b.id='instBanner';b.innerHTML=`<img src="${import.meta.env.BASE_URL}icon-192.png" alt="" width="36" height="36"><span><b>${S.ui==='ur'?'قرآن سفر انسٹال کریں':'Install Quran Safar'}</b><small>${S.ui==='ur'?'ہوم اسکرین پر شامل کریں':'Add it to your Home Screen'}</small></span><a class="btn" href="${import.meta.env.BASE_URL}install/">${S.ui==='ur'?'طریقہ':'How'}</a><button aria-label="Dismiss">✕</button>`;b.querySelector('button').onclick=()=>{localStorage.setItem('instBanner','1');b.remove()};document.body.append(b)}}
GC.startup();
// v2.4.1: shell is position:fixed inset:0 in CSS — never sized from JS (iOS standalone under-reports innerHeight).
