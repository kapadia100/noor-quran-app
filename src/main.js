import './style.css';
import * as PR from './prayer.js';
import {surahMatch,JUZ,JUZN,ayahText,parseRef,validSurah,validJuz,juzRanges,nextPos,clampAdj,highlight,turn,AYAH_COUNTS} from './lib.js';
const API='https://api.alquran.cloud/v1', HAD='https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1';
const $=s=>document.querySelector(s);let app=$('#app');
const LS={get:(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},set:(k,v)=>localStorage.setItem(k,JSON.stringify(v))};
const S=Object.assign({trans:'en.sahih',reciter:'ar.alafasy',tafsir:'ar.muyassar',ui:'en',dark:matchMedia('(prefers-color-scheme: dark)').matches,hlang:'eng',size:30,continuous:true,autoNext:true,surahAudio:false},LS.get('settings',{}));
const save=()=>LS.set('settings',S);
const T={en:{quran:'Quran',hadith:'Hadith',search:'Search',bookmarks:'Bookmarks',prayer:'Prayer',qibla:'Qibla',settings:'Settings',filter:'Search surah…',ayahs:'ayahs',translation:'Translation',reciter:'Reciter',tafsir:'Tafsir',lastRead:'Continue reading',none:'Nothing yet',play:'Play surah',lang:'Hadith language',size:'Arabic font size',q:'Search the Quran…',edition:'Search in',loading:'Loading…',err:'Could not load. Check your connection.',results:'results',books:'Books',uiLang:'App language',dark:'Dark mode',offlineTr:'Offline: showing the built-in English translation. Connect to load the selected translation.',cont:'Continuous play (auto-advance ayahs)',autoNext:'Continue into next surah',surahAudio:'Whole-surah audio files (best for locked screen, no ayah highlight)'},
 ur:{quran:'قرآن',hadith:'حدیث',search:'تلاش',bookmarks:'نشانیاں',prayer:'نماز',qibla:'قبلہ',settings:'ترتیبات',filter:'سورت تلاش کریں…',ayahs:'آیات',translation:'ترجمہ',reciter:'قاری',tafsir:'تفسیر',lastRead:'پڑھنا جاری رکھیں',none:'ابھی کچھ نہیں',play:'سورت سنیں',lang:'حدیث کی زبان',size:'عربی فونٹ سائز',q:'قرآن میں تلاش کریں…',edition:'تلاش بذریعہ',loading:'لوڈ ہو رہا ہے…',err:'لوڈ نہیں ہو سکا۔',results:'نتائج',books:'کتب',uiLang:'ایپ کی زبان',dark:'ڈارک موڈ',offlineTr:'آف لائن: بلٹ اِن انگریزی ترجمہ دکھایا جا رہا ہے۔',cont:'مسلسل تلاوت',autoNext:'اگلی سورت جاری رکھیں',surahAudio:'پوری سورت کی آڈیو فائل (لاک اسکرین کے لیے بہتر)'}};
const t=k=>T[S.ui][k]||k;
import {esc} from './lib.js';
const mem={};
async function j(url){if(mem[url])return mem[url];const r=await fetch(url);if(!r.ok)throw new Error(r.status);const d=await r.json();return mem[url]=d.data??d}
const surahs=()=>j(import.meta.env.BASE_URL+'offline/surahs.json').catch(()=>j(API+'/surah'));
// Edition lists: live API, fall back to the offline-bundled editions so screens still work with no network.
async function editions(type){try{return await j(`${API}/edition?type=${type}`)}catch{if(type==='translation'){const l=await j(import.meta.env.BASE_URL+'offline/translations.json');return l.filter(e=>['en.sahih','ur.jalandhry'].includes(e.identifier))}return []}}
async function audioEds(){try{return await j(API+'/edition?format=audio&type=versebyverse')}catch{return [{identifier:S.reciter,language:'ar',englishName:S.reciterName||S.reciter}]}}
const loading=()=>app.innerHTML=`<p class="muted c">${t('loading')}</p>`;
function applyUI(){document.documentElement.dataset.theme=S.dark?'dark':'light';document.documentElement.lang=S.ui;document.documentElement.dir=S.ui==='ur'?'rtl':'ltr';
 document.querySelectorAll('[data-t]').forEach(e=>e.textContent=t(e.dataset.t));$('#lang').textContent=S.ui==='en'?'اردو':'EN';document.documentElement.style.setProperty('--ar',S.size+'px')}
$('#theme').onclick=()=>{S.dark=!S.dark;save();applyUI()};
$('#lang').onclick=()=>{S.ui=S.ui==='en'?'ur':'en';save();applyUI();route()};
$('#back').onclick=()=>history.back();
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>location.hash=b.dataset.r);
$('#sheetClose').onclick=()=>$('#sheet').hidden=true;
$('#sheet').onclick=e=>{if(e.target.id==='sheet')$('#sheet').hidden=true};
const setTitle=s=>$('#title').textContent=s;
const opt=(list,sel)=>list.map(e=>`<option value="${e.identifier}" ${e.identifier===sel?'selected':''}>${esc(e.language.toUpperCase())} · ${esc(e.englishName)}${e.name&&e.name!==e.englishName?' — '+esc(e.name):''}</option>`).join('');

// ---------- Surah list ----------
async function home(tab){setTitle(t('quran'));loading();const list=await surahs();const lr=LS.get('lastRead');
 const nx=PR.next();app.innerHTML=`${dateCard(nx)}<div class="tabs"><a href="#/" class="${tab?'':'on'}">Surah</a><a href="#/juz" class="${tab?'on':''}">Juz / Para</a><a href="#/bookmarks">🔖 ${t('bookmarks')}</a></div>${tab?juzList():''}`;tick();if(tab)return;
 app.insertAdjacentHTML('beforeend',`${lr?`<a class="card hl" href="#/surah/${lr.s}/${lr.a}">▶ ${t('lastRead')}: ${esc(lr.name)} ${lr.s}:${lr.a}</a>`:''}
 <input id="f" class="inp" aria-label="${t('filter')}" placeholder="${t('filter')}"><ul class="list" id="sl"></ul>`);
 const draw=q=>{q=q.toLowerCase();$('#sl').innerHTML=list.filter(s=>surahMatch(s,q)).map(s=>`<li><a href="#/surah/${s.number}"><b class="num">${s.number}</b><span><b>${esc(s.englishName)}</b><small>${esc(s.englishNameTranslation)} · ${s.numberOfAyahs} ${t('ayahs')} · ${s.revelationType}</small></span><span class="ar sm">${esc(s.name)}</span></a></li>`).join('')};
 draw('');$('#f').oninput=e=>draw(e.target.value)}


// ---------- verified text corrections (Tanzil 1.1 / quran.com agree) ----------
function juzList(){return `<ul class="list">${JUZ.map((r,i)=>`<li><a href="#/juz/${i+1}"><b class="num">${i+1}</b><span><b>Juz ${i+1} · ${JUZN[i]}</b><small>Starts ${r[0]}:${r[1]}${JUZ[i+1]?` · ends before ${JUZ[i+1][0]}:${JUZ[i+1][1]}`:' · ends 114:6'}</small></span><span class="ar">پارہ ${(i+1).toLocaleString('ar-EG')}</span></a></li>`).join('')}</ul>`}
async function juzReader(n){if(!validJuz(n)){location.hash='#/juz';return}loading();setTitle('Juz '+n);const [AR,list,tj]=await Promise.all([arabic(),surahs(),transJuz(n)]);
 const rs=juzRanges(n),total=rs.reduce((x,[,f,t])=>x+t-f+1,0),rtl=tj.edition.direction==='rtl',isUr=tj.edition.language==='ur';
 app.innerHTML=`<div class="head"><div class="ar big">الجزء ${n.toLocaleString('ar-EG')}</div><small>Juz ${n} · ${JUZN[n-1]} · ${total} ${t('ayahs')}</small></div>${tj.fallback?`<p class="card muted">${t('offlineTr')}</p>`:''}`+rs.map(([sn,f,to],k)=>{const m=list[sn-1];let h=`<a class="card hl" href="#/surah/${sn}/${f}"><b>${sn}. ${esc(m.englishName)}</b> <span class="ar">${esc(m.name)}</span></a>${f===1&&sn!==1&&sn!==9?'<div class="ar bism c">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>':''}`;
 for(let a=f;a<=to;a++)h+=`<article class="ayah"><div class="tools"><a class="badge" href="#/surah/${sn}/${a}">${sn}:${a}</a></div><p class="ar" dir="rtl" lang="ar">${esc(ayahText(sn,a,AR[sn-1][a-1]))} <span class="end">﴿${a.toLocaleString('ar-EG')}﴾</span></p><p class="tr ${isUr?'ur':''}" dir="${rtl?'rtl':'ltr'}">${esc(tj.parts[k].texts[a-1]??'')}</p></article>`;return h}).join('')+
 `<div class="pager">${n>1?`<a class="btn" href="#/juz/${n-1}">‹ Juz ${n-1}</a>`:'<span></span>'}${n<30?`<a class="btn" href="#/juz/${n+1}">Juz ${n+1} ›</a>`:''}</div>`;scrollTo(0,0)}

// ---------- Dates, prayer times, qibla ----------
const pn=k=>PR.PNAME[k][S.ui==='ur'?1:0];
function dateCard(nx){return `<div class="card datecard"><div><b class="hij">${PR.hijri(new Date(),S.ui)}</b><small>${PR.greg(new Date(),S.ui)}</small></div>${nx?`<a href="#/prayer" class="nextp"><small>${S.ui==='ur'?'اگلی نماز':'Next prayer'}</small><b>${pn(nx.key)} ${PR.fmt12(nx.time)}</b><span class="cd" data-at="${+nx.time}"></span></a>`:''}</div>`}
let tickT;function tick(){clearInterval(tickT);const f=()=>{const els=document.querySelectorAll('.cd');if(!els.length)return clearInterval(tickT);els.forEach(e=>{let ms=+e.dataset.at-Date.now();if(ms<0){route();return}const h=Math.floor(ms/36e5),m=Math.floor(ms%36e5/6e4),sec=Math.floor(ms%6e4/1e3);e.textContent=`−${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`})};f();tickT=setInterval(f,1000)}
function prayer(){setTitle(S.ui==='ur'?'اوقاتِ نماز':'Prayer Times');const P=PR.P,pt=PR.times(),nx=PR.next();
 app.innerHTML=`${dateCard(nx)}<div class="card"><b>📍 ${esc(P.city)}</b> <small class="muted">${P.lat}, ${P.lng} · ${P.tz}</small><div class="bar"><button class="btn" id="gps">📡 ${S.ui==='ur'?'میری لوکیشن':'Use GPS'}</button><select id="city" aria-label="City"><option value="">${S.ui==='ur'?'شہر منتخب کریں':'Choose city…'}</option>${PR.CITIES.map(c=>`<option ${c[0]===P.city?'selected':''}>${c[0]}</option>`).join('')}</select></div><small id="gmsg" class="muted"></small></div>
 <ul class="list ptimes">${PR.PRAYERS.map(k=>`<li class="${nx?.key===k?'on':''}"><span><b>${pn(k)}</b></span><span class="t">${PR.fmt12(pt[k])}</span>${k==='sunrise'?'<span></span>':`<label class="sw" title="Alert"><input type="checkbox" data-al="${k}" ${P.alerts[k]?'checked':''}>🔔</label>`}</li>`).join('')}</ul>
 <div class="form"><label>${S.ui==='ur'?'طریقۂ حساب':'Calculation method'}<select id="meth">${Object.entries(PR.METHODS).map(([k,v])=>`<option value="${k}" ${k===P.method?'selected':''}>${v}</option>`).join('')}</select></label>
 <label>${S.ui==='ur'?'عصر (فقہ)':'Asr juristic method'}<select id="madh"><option value="Hanafi">Hanafi (later Asr)</option><option value="Shafi" ${P.madhab==='Shafi'?'selected':''}>Shafi'i / Maliki / Hanbali</option></select></label>
 <label><input type="checkbox" id="adh" ${P.adhan?'checked':''}> ${S.ui==='ur'?'اذان کی آواز':'Adhan sound with alerts'}</label>
 <label>${S.ui==='ur'?'ہجری تاریخ میں تبدیلی':'Hijri date adjustment'} <span><button class="btn" id="hm">−1</button> <b id="hv">${P.hijriAdj>0?'+':''}${P.hijriAdj}</b> <button class="btn" id="hp">+1</button></span></label>
 <button class="btn" id="sched">🔔 ${S.ui==='ur'?'الرٹس فعال کریں':'Enable / refresh prayer alerts'} (${P.days} days)</button><small id="smsg" class="muted"></small></div>`;tick();
 const re=async()=>{PR.saveP();prayer();const r=await PR.schedule().catch(e=>({ok:false,reason:e.message}));const m=$('#smsg');if(m)m.textContent=r.ok?`✓ ${r.count} alerts scheduled (${r.mode})`:'Alerts: '+r.reason};
 $('#gps').onclick=async()=>{$('#gmsg').textContent='Locating…';try{await PR.locate();P.method=P.method||'Karachi';re()}catch(e){$('#gmsg').textContent='GPS unavailable ('+(e.message||e.code)+'). Choose your city instead.'}};
 $('#city').onchange=e=>{if(e.target.value){PR.setCity(e.target.value);re()}};$('#meth').onchange=e=>{P.method=e.target.value;re()};$('#madh').onchange=e=>{P.madhab=e.target.value;re()};
 $('#adh').onchange=e=>{P.adhan=e.target.checked;re()};$('#hm').onclick=()=>{P.hijriAdj=clampAdj(P.hijriAdj-1);PR.saveP();prayer()};$('#hp').onclick=()=>{P.hijriAdj=clampAdj(P.hijriAdj+1);PR.saveP();prayer()};
 app.querySelectorAll('[data-al]').forEach(c=>c.onchange=()=>{P.alerts[c.dataset.al]=c.checked;re()});$('#sched').onclick=re}
function qibla(){setTitle(S.ui==='ur'?'قبلہ':'Qibla');const P=PR.P,q=PR.qibla();
 app.innerHTML=`<div class="card c"><b>📍 ${esc(P.city)}</b><br><small class="muted">${P.lat}, ${P.lng}</small></div><div class="compass"><div class="dial" id="dial"><span class="n">N</span><span class="e">E</span><span class="s">S</span><span class="w">W</span><div class="needle" style="transform:rotate(${q}deg)"><span>🕋</span></div></div></div>
 <div class="c"><div class="deg">${q.toFixed(1)}°</div><small class="muted">${S.ui==='ur'?'شمال سے گھڑی کی سمت میں قبلہ کا زاویہ':'Qibla bearing from True North (clockwise)'}</small><p id="hd" class="muted">${S.ui==='ur'?'کمپاس کے لیے فون کو سیدھا رکھیں':'Hold your phone flat. Compass needs a device with a magnetometer.'}</p><button class="btn" id="cmp">🧭 ${S.ui==='ur'?'کمپاس شروع کریں':'Start compass'}</button> <a class="btn" href="#/prayer">📍 ${S.ui==='ur'?'لوکیشن بدلیں':'Change location'}</a></div>`;
 const on=e=>{let h=e.webkitCompassHeading??(e.absolute||e.type==='deviceorientationabsolute'?(360-e.alpha)%360:null);if(h==null)return;const d=$('#dial');if(!d)return off();d.style.transform=`rotate(${-h}deg)`;const diff=turn(q,h);$('#hd').textContent=`Heading ${h.toFixed(0)}° · ${Math.abs(diff)<5?'✅ Facing Qibla':(diff>0?'turn right ':'turn left ')+Math.abs(diff).toFixed(0)+'°'}`};
 const off=()=>{removeEventListener('deviceorientationabsolute',on);removeEventListener('deviceorientation',on)};
 $('#cmp').onclick=async()=>{if(!window.DeviceOrientationEvent){$('#hd').textContent='Compass not supported on this device. Use the bearing above.';return}try{if(DeviceOrientationEvent.requestPermission&&await DeviceOrientationEvent.requestPermission()!=='granted'){$('#hd').textContent='Motion permission denied. Enable it in Settings › Safari › Motion & Orientation.';return}}catch{$('#hd').textContent='Motion permission was not granted.';return}off();addEventListener('ondeviceorientationabsolute' in window?'deviceorientationabsolute':'deviceorientation',on)}}

// ---------- Reader + audio ----------
// One persistent <audio> element (required for iOS to keep playing on auto-advance / locked screen),
// plus a second element only used to preload the next file.
const audio=new Audio();audio.preload='auto';const pre=new Audio();pre.preload='auto';
let cur=null,errs=0;window.__audio=audio;
const urlsFor=async s=>(await j(`${API}/surah/${s}/${S.reciter}`)).ayahs.map(a=>a.audio);
const surahUrl=(s,br)=>`https://cdn.islamic.network/quran/audio-surah/${br}/${S.reciter}/${s}.mp3`;
async function surahName(s){try{return (await surahs())[s-1].englishName}catch{return 'Surah '+s}}
function playerUI(){const p=$('#player');p.hidden=!cur;if(!cur)return;$('#pPlay').textContent=audio.paused?'▶':'⏸';$('#pPlay').setAttribute('aria-label',audio.paused?'Play':'Pause');
 $('#pInfo').textContent=`${cur.name} ${cur.s}${cur.whole?'':':'+(cur.i+1)}`;markPlaying()}
function markPlaying(){document.querySelectorAll('.ayah.playing').forEach(e=>e.classList.remove('playing'));if(!cur||cur.whole)return;
 if(!location.hash.match(new RegExp('^#/surah/'+cur.s+'(/|$)')))return;const el=document.getElementById('a'+(cur.i+1));if(el){el.classList.add('playing');if(!audio.paused)el.scrollIntoView({block:'center',behavior:'smooth'})}}
function media(){if(!('mediaSession' in navigator)||!cur)return;try{navigator.mediaSession.metadata=new MediaMetadata({title:`${cur.name} ${cur.s}${cur.whole?'':':'+(cur.i+1)}`,artist:S.reciterName||S.reciter,album:'Noor Quran',artwork:[{src:import.meta.env.BASE_URL+'icon-512.png',sizes:'512x512',type:'image/png'}]})}catch{}}
if('mediaSession' in navigator){const ms=navigator.mediaSession,h=(a,f)=>{try{ms.setActionHandler(a,f)}catch{}};
 h('play',()=>{audio.play().catch(()=>{});playerUI()});h('pause',()=>{audio.pause();playerUI()});h('nexttrack',()=>advance(true));h('previoustrack',()=>prev())}
async function playPos(s,i,whole=S.surahAudio){if(!validSurah(s))return stop();const name=await surahName(s);errs=whole?errs:0;
 if(whole){cur={s,i:0,name,whole:true,br:cur?.br||128};audio.src=surahUrl(s,cur.br)}
 else{let urls;try{urls=await urlsFor(s)}catch{toast(t('err'));return stop()}if(!urls[i])return stop();cur={s,i,name,urls};audio.src=urls[i];
  const n=nextPos(s,i);if(n&&n.s===s)pre.src=urls[n.i];else if(n&&S.autoNext)urlsFor(n.s).then(u=>pre.src=u[0]).catch(()=>{})}
 try{await audio.play()}catch(e){if(e.name==='NotAllowedError'){toast('Tap ▶ to start audio')}}playerUI();media()}
function advance(manual){if(!cur)return;if(cur.whole){if(S.autoNext&&cur.s<114||manual)return playPos(cur.s+1,0,true);return stop()}
 if(!S.continuous&&!manual)return playerUI();const n=nextPos(cur.s,cur.i);if(!n)return stop();
 if(n.s!==cur.s){if(!S.autoNext&&!manual)return stop();const viewing=location.hash.match(new RegExp('^#/surah/'+cur.s+'(/|$)'));playPos(n.s,n.i).then(()=>{if(viewing)location.hash=`#/surah/${n.s}`})}else playPos(n.s,n.i)}
function prev(){if(!cur)return;if(cur.whole)return playPos(Math.max(1,cur.s-1),0,true);if(cur.i>0)return playPos(cur.s,cur.i-1);if(cur.s>1)playPos(cur.s-1,AYAH_COUNTS[cur.s-2]-1)}
function stop(){audio.pause();cur=null;playerUI();if('mediaSession' in navigator)navigator.mediaSession.playbackState='none'}
audio.onended=()=>advance(false);
audio.onplay=()=>{if('mediaSession' in navigator)navigator.mediaSession.playbackState='playing';playerUI()};audio.onpause=()=>{if('mediaSession' in navigator)navigator.mediaSession.playbackState='paused';playerUI()};
audio.onerror=()=>{if(!cur||!audio.src)return;if(cur.whole){if(cur.br===128){cur.br=64;audio.src=surahUrl(cur.s,64);audio.play().catch(()=>{});return}toast('Whole-surah audio unavailable for this reciter; playing ayah by ayah');return playPos(cur.s,0,false)}
 if(++errs>3){toast(t('err'));return stop()}advance(true)};
$('#pPlay').onclick=()=>{if(audio.paused){audio.play().catch(()=>{})}else audio.pause()};
$('#pNext').onclick=()=>advance(true);$('#pPrev').onclick=prev;$('#pClose').onclick=stop;
function toast(m){let e=$('#toast');if(!e){e=document.createElement('div');e.id='toast';e.setAttribute('role','status');document.body.append(e)}e.textContent=m;e.hidden=false;clearTimeout(e._t);e._t=setTimeout(()=>e.hidden=true,3500)}

const OFF=import.meta.env.BASE_URL+'offline/',BUNDLED=['en.sahih','ur.jalandhry'];
async function arabic(){return j(OFF+'ar.json')}
/** Translation for surah n: bundled offline editions first, then API, then bundled English fallback. */
async function transFor(n,ed=S.trans){if(BUNDLED.includes(ed)){const d=await j(OFF+ed+'.json');return {edition:d.edition,texts:d.ayahs[n-1]}}
 try{const d=await j(`${API}/surah/${n}/${ed}`);return {edition:d.edition,texts:d.ayahs.map(a=>a.text)}}catch{const d=await j(OFF+'en.sahih.json');return {edition:d.edition,texts:d.ayahs[n-1],fallback:true}}}
async function transJuz(n){const rs=juzRanges(n);const parts=await Promise.all(rs.map(([s])=>transFor(s)));return {edition:parts[0].edition,fallback:parts.some(p=>p.fallback),parts}}

async function reader(n,start){if(!validSurah(n)){location.hash='#/';return}loading();
 const [AR,tr,trs,recs,list]=await Promise.all([arabic(),transFor(n),editions('translation'),audioEds(),surahs()]);const meta=list[n-1];
 setTitle(`${n}. ${meta.englishName}`);const bm=LS.get('bookmarks',[]);const rtl=tr.edition.direction==='rtl';const isUr=tr.edition.language==='ur';
 const txts=AR[n-1].map((x,i)=>ayahText(n,i+1,x));
 app.innerHTML=`<div class="bar"><select id="tr" aria-label="${t('translation')}">${opt(trs,S.trans)}</select><select id="rc" aria-label="${t('reciter')}">${opt(recs,S.reciter)}</select><button class="btn" id="playAll">▶ ${t('play')}</button></div>
 ${tr.fallback?`<p class="card muted">${t('offlineTr')}</p>`:''}
 <div class="head"><div class="ar big">${esc(meta.name)}</div><small>${esc(meta.englishNameTranslation)} · ${meta.numberOfAyahs} ${t('ayahs')}</small>${n!=1&&n!=9?'<div class="ar bism">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>':''}</div>
 ${txts.map((txt,i)=>{const ref=`${n}:${i+1}`;
 return `<article class="ayah" id="a${i+1}"><div class="tools"><span class="badge">${ref}</span><button data-play="${i}" aria-label="Play from ${ref}">▶</button><button data-taf="${ref}" aria-label="${t('tafsir')} ${ref}">📘</button><button data-bm="${ref}" aria-label="Bookmark ${ref}">${bm.some(b=>b.ref===ref)?'★':'☆'}</button><button data-cp="${i}" aria-label="Copy ${ref}">⧉</button></div>
 <p class="ar" dir="rtl" lang="ar">${esc(txt)} <span class="end">﴿${(i+1).toLocaleString('ar-EG')}﴾</span></p><p class="tr ${isUr?'ur':''}" dir="${rtl?'rtl':'ltr'}" lang="${esc(tr.edition.language)}">${esc(tr.texts[i]??'')}</p></article>`}).join('')}
 <div class="pager">${n>1?`<a class="btn" href="#/surah/${n-1}">‹ ${n-1}</a>`:'<span></span>'}${n<114?`<a class="btn" href="#/surah/${n+1}">${n+1} ›</a>`:''}</div>`;
 $('#tr').onchange=e=>{S.trans=e.target.value;save();reader(n,lastVisible(n))};
 $('#rc').onchange=e=>{S.reciter=e.target.value;S.reciterName=e.target.selectedOptions[0].textContent;save();const was=cur&&!audio.paused?cur:null;stop();if(was)playPos(was.s,was.i);reader(n,lastVisible(n))};
 $('#playAll').onclick=()=>playPos(n,0);
 app.onclick=e=>{const b=e.target.closest('button');if(!b)return;
  if(b.dataset.play)playPos(n,+b.dataset.play,false);
  if(b.dataset.taf)tafsir(b.dataset.taf);
  if(b.dataset.bm){let l=LS.get('bookmarks',[]);const r=b.dataset.bm;if(l.some(x=>x.ref===r)){l=l.filter(x=>x.ref!==r);b.textContent='☆'}else{l.unshift({ref:r,name:meta.englishName,text:(tr.texts[r.split(':')[1]-1]||'').slice(0,120)});b.textContent='★'}LS.set('bookmarks',l)}
  if(b.dataset.cp){const i=+b.dataset.cp;navigator.clipboard?.writeText(`${txts[i]}\n${tr.texts[i]}\n(${n}:${i+1})`).then(()=>toast('Copied'),()=>{})}};
 if(start){document.getElementById('a'+start)?.scrollIntoView({block:'start'})}else scrollTo(0,0);markPlaying();LS.set('lastRead',{s:n,a:+start||1,name:meta.englishName});
 const io=new IntersectionObserver(es=>es.forEach(x=>{if(x.isIntersecting&&location.hash.startsWith('#/surah/'+n))LS.set('lastRead',{s:n,a:+x.target.id.slice(1),name:meta.englishName})}),{rootMargin:'-40% 0px -55% 0px'});
 document.querySelectorAll('.ayah').forEach(el=>io.observe(el))}
const lastVisible=n=>{const l=LS.get('lastRead',{});return l.s===n?l.a:undefined};
async function tafsir(ref){$('#sheet').hidden=false;const body=$('#sheetBody');body.innerHTML=t('loading');
 let eds;try{eds=await editions('tafsir')}catch{eds=[]}if(!eds.length){body.textContent=t('err');return}const draw=async()=>{body.innerHTML=`<h3>${t('tafsir')} ${ref}</h3><select id="tf" aria-label="${t('tafsir')}">${opt(eds,S.tafsir)}</select><div id="tfx" class="muted">${t('loading')}</div>`;
 $('#tf').onchange=e=>{S.tafsir=e.target.value;save();draw()};
 try{const d=await j(`${API}/ayah/${ref}/${S.tafsir}`);$('#tfx').className='taf';$('#tfx').dir=d.edition.direction||'rtl';$('#tfx').textContent=d.text}catch{$('#tfx').textContent=t('err')}};draw()}

// ---------- Hadith ----------
async function hadithHome(){setTitle(t('hadith'));loading();const [eds,info]=await Promise.all([j(HAD+'/editions.json'),j(HAD+'/info.json')]);
 const langs=[...new Set(Object.values(eds).flatMap(b=>b.collection.map(c=>c.name.split('-')[0])))];
 app.innerHTML=`<label class="bar">${t('lang')} <select id="hl" aria-label="Hadith language">${langs.map(l=>`<option ${l===S.hlang?'selected':''}>${l}</option>`).join('')}</select></label><ul class="list">${Object.entries(eds).map(([k,b])=>{const has=b.collection.some(c=>c.name.startsWith(S.hlang+'-'));return `<li><a href="#/hadith/${k}"><span><b>${esc(b.name)}</b><small>${Object.keys(info[k]?.metadata.sections||{}).length-1} ${t('books')} · ${b.collection.map(c=>c.language).filter((v,i,a)=>a.indexOf(v)===i).join(', ')}${has?'':' · ('+S.hlang+' n/a)'}</small></span></a></li>`}).join('')}</ul>`;
 $('#hl').onchange=e=>{S.hlang=e.target.value;save();hadithHome()}}
async function pickEd(book){const eds=await j(HAD+'/editions.json');const c=eds[book].collection;return (c.find(x=>x.name===S.hlang+'-'+book)||c.find(x=>x.name==='eng-'+book)||c[0]).name}
async function hadithBook(book){loading();const info=await j(HAD+'/info.json');const m=info[book].metadata;setTitle(m.name);
 app.innerHTML=`<ul class="list">${Object.entries(m.sections).filter(([k,v])=>k!=='0'&&v).map(([k,v])=>`<li><a href="#/hadith/${book}/${k}"><b class="num">${k}</b><span><b>${esc(v)}</b><small>${m.section_details?.[k]?`#${m.section_details[k].hadithnumber_first}–${m.section_details[k].hadithnumber_last}`:''}</small></span></a></li>`).join('')}</ul>`;scrollTo(0,0)}
async function hadithSection(book,sec){loading();const ed=await pickEd(book);const ara=ed.startsWith('ara-')?null:(await j(HAD+'/editions.json'))[book].collection.find(c=>c.name==='ara-'+book);
 const [d,a]=await Promise.all([j(`${HAD}/editions/${ed}/sections/${sec}.min.json`),ara?j(`${HAD}/editions/ara-${book}/sections/${sec}.min.json`).catch(()=>null):null]);
 setTitle(Object.values(d.metadata.section)[0]||d.metadata.name);const amap=new Map((a?.hadiths||[]).map(h=>[h.hadithnumber,h.text]));const rtl=/^(ara|urd|fas)/.test(ed);
 app.innerHTML=`<p class="muted">${esc(d.metadata.name)} · ${ed}</p>${d.hadiths.map(h=>`<article class="ayah"><div class="tools"><span class="badge">#${h.hadithnumber}</span>${(h.grades||[]).slice(0,2).map(g=>`<small class="muted">${esc(g.grade)} (${esc(g.name)})</small>`).join(' ')}</div>${amap.get(h.hadithnumber)?`<p class="ar sm2" dir="rtl">${esc(amap.get(h.hadithnumber))}</p>`:''}<p class="tr" dir="${rtl?'rtl':'ltr'}">${esc(h.text)}</p></article>`).join('')}`;scrollTo(0,0)}

// ---------- Search ----------
async function search(q=''){setTitle(t('search'));const trs=await editions('translation');
 app.innerHTML=`<form id="sf" class="bar"><input class="inp" id="q" aria-label="${t('q')}" value="${esc(q)}" placeholder="${t('q')}"><select id="se" aria-label="${t('edition')}"><option value="quran-simple-clean">AR · Arabic text</option>${opt(trs,S.searchEd||S.trans)}</select><button class="btn">🔍</button></form><div id="sr"></div>`;
 $('#sf').onsubmit=e=>{e.preventDefault();S.searchEd=$('#se').value;save();run()};if(S.searchEd==='quran-simple-clean')$('#se').value='quran-simple-clean';
 const run=async()=>{const v=$('#q').value.trim();if(!v)return;history.replaceState(null,'','#/search/'+encodeURIComponent(v));$('#sr').innerHTML=t('loading');
  // also allow direct ref "2:255"
  const ref=parseRef(v);if(ref){location.hash=`#/surah/${ref.s}${ref.a?'/'+ref.a:''}`;return}if(/^\d+([:.\s]\d+)?$/.test(v)){$('#sr').innerHTML=`<p class="muted">Invalid reference. Surah 1–114, ayah within the surah.</p>`;return}
  try{const r=await fetch(`${API}/search/${encodeURIComponent(v)}/all/${$('#se').value}`).then(r=>r.json());if(r.code===404||typeof r.data==='string')r.data={count:0,matches:[]};const ms=r.data?.matches||[];
   $('#sr').innerHTML=`<p class="muted">${r.data?.count||0} ${t('results')}</p>`+ms.slice(0,300).map(x=>`<a class="card" href="#/surah/${x.surah.number}/${x.numberInSurah}"><span class="badge">${x.surah.englishName} ${x.surah.number}:${x.numberInSurah}</span><p dir="auto">${highlight(x.text,v)}</p></a>`).join('')}catch{$('#sr').textContent=t('err')}};
 if(q)run()}

function bookmarks(){setTitle(t('bookmarks'));const l=LS.get('bookmarks',[]);app.innerHTML=l.length?l.map(b=>`<a class="card" href="#/surah/${b.ref.replace(':','/')}"><span class="badge">${esc(b.name)} ${b.ref}</span><p>${esc(b.text)}…</p></a>`).join(''):`<p class="muted c">${t('none')}</p>`}
async function settings(){setTitle(t('settings'));const [trs,recs,tfs]=await Promise.all([editions('translation'),audioEds(),editions('tafsir')]);
 app.innerHTML=`<div class="form"><label>${t('uiLang')}<select id="s_ui"><option value="en">English</option><option value="ur" ${S.ui==='ur'?'selected':''}>اردو</option></select></label>
 <label>${t('translation')} (${trs.length})<select id="s_trans">${opt(trs,S.trans)}</select></label><label>${t('reciter')}<select id="s_reciter">${opt(recs,S.reciter)}</select></label><label>${t('tafsir')}<select id="s_tafsir">${opt(tfs,S.tafsir)}</select></label>
 <label>${t('size')} <input type="range" min="20" max="48" id="s_size" value="${S.size}"></label><label><input type="checkbox" id="s_dark" ${S.dark?'checked':''}> ${t('dark')}</label><label><input type="checkbox" id="s_cont" ${S.continuous?'checked':''}> ${t('cont')}</label><label><input type="checkbox" id="s_next" ${S.autoNext?'checked':''}> ${t('autoNext')}</label><label><input type="checkbox" id="s_sa" ${S.surahAudio?'checked':''}> ${t('surahAudio')}</label>
 <p class="muted">Data: AlQuran.cloud (Tanzil text), fawazahmed0/hadith-api. Fonts: Amiri Quran, Noto Nastaliq Urdu.</p></div>`;
 ['ui','trans','reciter','tafsir'].forEach(k=>$('#s_'+k).onchange=e=>{S[k]=e.target.value;save();applyUI();if(k==='ui')settings()});
 $('#s_size').oninput=e=>{S.size=+e.target.value;save();applyUI()};$('#s_dark').onchange=e=>{S.dark=e.target.checked;save();applyUI()};[['cont','continuous'],['next','autoNext'],['sa','surahAudio']].forEach(([id,k])=>$('#s_'+id).onchange=e=>{S[k]=e.target.checked;save()})}

// Each navigation renders into a fresh container, so a slow, stale render (e.g. a surah still loading) can never overwrite the newer screen.
async function route(){$('#sheet').hidden=true;const v=app=document.createElement('div');$('#app').replaceChildren(v);const p=location.hash.replace(/^#\/?/,'').split('/').map(decodeURIComponent);
 $('#back').style.visibility=p[0]?'visible':'hidden';
 document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',('#/'+(['surah','juz'].includes(p[0])?'':p[0]))===b.dataset.r));
 try{if(p[0]==='surah')await reader(+p[1],p[2]);else if(p[0]==='hadith')p[2]?await hadithSection(p[1],p[2]):p[1]?await hadithBook(p[1]):await hadithHome();
  else if(p[0]==='search')await search(p[1]||'');else if(p[0]==='bookmarks')bookmarks();else if(p[0]==='prayer')prayer();else if(p[0]==='qibla')qibla();else if(p[0]==='juz')p[1]?await juzReader(+p[1]):await home('juz');else if(p[0]==='settings')await settings();else await home()}
 catch(e){if(v!==app)return;console.error(e);v.innerHTML=`<p class="muted c">${t('err')}</p><p class="c"><button class="btn" onclick="location.reload()">↻</button></p>`}}
addEventListener('hashchange',route);applyUI();route();
// Re-arm alerts on launch only if permission was already granted (no permission prompt without a user gesture).
if(Object.values(PR.P.alerts).some(Boolean)&&localStorage.getItem('prayer')&&(PR.isNative()||('Notification' in window&&Notification.permission==='granted')))PR.schedule().catch(()=>{});
if('serviceWorker' in navigator&&import.meta.env.PROD)addEventListener('load',()=>navigator.serviceWorker.register(import.meta.env.BASE_URL+'sw.js'));
