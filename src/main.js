import './style.css';
import * as PR from './prayer.js';
const API='https://api.alquran.cloud/v1', HAD='https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1';
const $=s=>document.querySelector(s), app=$('#app');
const LS={get:(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},set:(k,v)=>localStorage.setItem(k,JSON.stringify(v))};
const S=Object.assign({trans:'en.sahih',reciter:'ar.alafasy',tafsir:'ar.muyassar',ui:'en',dark:matchMedia('(prefers-color-scheme: dark)').matches,hlang:'eng',size:30},LS.get('settings',{}));
const save=()=>LS.set('settings',S);
const T={en:{quran:'Quran',hadith:'Hadith',search:'Search',bookmarks:'Bookmarks',prayer:'Prayer',qibla:'Qibla',settings:'Settings',filter:'Search surah…',ayahs:'ayahs',translation:'Translation',reciter:'Reciter',tafsir:'Tafsir',lastRead:'Continue reading',none:'Nothing yet',play:'Play surah',lang:'Hadith language',size:'Arabic font size',q:'Search the Quran…',edition:'Search in',loading:'Loading…',err:'Could not load. Check your connection.',results:'results',books:'Books',uiLang:'App language',dark:'Dark mode'},
 ur:{quran:'قرآن',hadith:'حدیث',search:'تلاش',bookmarks:'نشانیاں',prayer:'نماز',qibla:'قبلہ',settings:'ترتیبات',filter:'سورت تلاش کریں…',ayahs:'آیات',translation:'ترجمہ',reciter:'قاری',tafsir:'تفسیر',lastRead:'پڑھنا جاری رکھیں',none:'ابھی کچھ نہیں',play:'سورت سنیں',lang:'حدیث کی زبان',size:'عربی فونٹ سائز',q:'قرآن میں تلاش کریں…',edition:'تلاش بذریعہ',loading:'لوڈ ہو رہا ہے…',err:'لوڈ نہیں ہو سکا۔',results:'نتائج',books:'کتب',uiLang:'ایپ کی زبان',dark:'ڈارک موڈ'}};
const t=k=>T[S.ui][k]||k;
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const mem={};
async function j(url){if(mem[url])return mem[url];const r=await fetch(url);if(!r.ok)throw new Error(r.status);const d=await r.json();return mem[url]=d.data??d}
// Optional local open-data bundle (copied to /data by scripts/copy-data). Falls back to live API.
async function local(path,fallback){try{const r=await fetch(import.meta.env.BASE_URL+'data/'+path);if(r.ok&&r.headers.get('content-type')?.includes('json'))return await r.json()}catch{}return j(fallback)}
const surahs=()=>local('surahs.json',API+'/surah');
const editions=type=>j(`${API}/edition?type=${type}`+(type==='versebyverse'?'':''));
const audioEds=()=>j(API+'/edition?format=audio&type=versebyverse');
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
 <input id="f" class="inp" placeholder="${t('filter')}"><ul class="list" id="sl"></ul>`);
 const draw=q=>{q=q.toLowerCase();$('#sl').innerHTML=list.filter(s=>!q||(s.number+' '+s.englishName+' '+s.englishNameTranslation+' '+s.name).toLowerCase().includes(q)).map(s=>`<li><a href="#/surah/${s.number}"><b class="num">${s.number}</b><span><b>${esc(s.englishName)}</b><small>${esc(s.englishNameTranslation)} · ${s.numberOfAyahs} ${t('ayahs')} · ${s.revelationType}</small></span><span class="ar sm">${esc(s.name)}</span></a></li>`).join('')};
 draw('');$('#f').oninput=e=>draw(e.target.value)}


// ---------- verified text corrections (Tanzil 1.1 / quran.com agree) ----------
const FIX={"2:181": "فَمَنۢ بَدَّلَهُۥ بَعْدَ مَا سَمِعَهُۥ فَإِنَّمَآ إِثْمُهُۥ عَلَى ٱلَّذِينَ يُبَدِّلُونَهُۥٓ ۚ إِنَّ ٱللَّهَ سَمِيعٌ عَلِيمٌ", "8:6": "يُجَـٰدِلُونَكَ فِى ٱلْحَقِّ بَعْدَ مَا تَبَيَّنَ كَأَنَّمَا يُسَاقُونَ إِلَى ٱلْمَوْتِ وَهُمْ يَنظُرُونَ", "12:39": "يَـٰصَـٰحِبَىِ ٱلسِّجْنِ ءَأَرْبَابٌ مُّتَفَرِّقُونَ خَيْرٌ أَمِ ٱللَّهُ ٱلْوَٰحِدُ ٱلْقَهَّارُ", "12:41": "يَـٰصَـٰحِبَىِ ٱلسِّجْنِ أَمَّآ أَحَدُكُمَا فَيَسْقِى رَبَّهُۥ خَمْرًا ۖ وَأَمَّا ٱلْـَٔاخَرُ فَيُصْلَبُ فَتَأْكُلُ ٱلطَّيْرُ مِن رَّأْسِهِۦ ۚ قُضِىَ ٱلْأَمْرُ ٱلَّذِى فِيهِ تَسْتَفْتِيَانِ", "13:37": "وَكَذَٰلِكَ أَنزَلْنَـٰهُ حُكْمًا عَرَبِيًّا ۚ وَلَئِنِ ٱتَّبَعْتَ أَهْوَآءَهُم بَعْدَ مَا جَآءَكَ مِنَ ٱلْعِلْمِ مَا لَكَ مِنَ ٱللَّهِ مِن وَلِىٍّ وَلَا وَاقٍ"};
const stripB=x=>{x=x.replace(/^\uFEFF/,'');const w=x.split(' ');const bare=y=>(y||'').replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g,'');return bare(w[0])==='بسم'&&bare(w[1])==='ٱلله'&&w.length>4?w.slice(4).join(' '):x};
const JUZ=[[1,1],[2,142],[2,253],[3,93],[4,24],[4,148],[5,82],[6,111],[7,88],[8,41],[9,93],[11,6],[12,53],[15,1],[17,1],[18,75],[21,1],[23,1],[25,21],[27,56],[29,46],[33,31],[36,28],[39,32],[41,47],[46,1],[51,31],[58,1],[67,1],[78,1]];
const JUZN=['Alif Lam Meem','Sayaqool','Tilkal Rusul','Lan Tana Loo','Wal Mohsanat','La Yuhibbullah','Wa Iza Samiu','Wa Lau Annana','Qalal Malao','Wa A\'lamu','Yatazeroon','Wa Mamin Da\'abat','Wa Ma Ubrioo','Rubama','Subhanallazi','Qal Alam','Aqtarabo','Qadd Aflaha','Wa Qalallazina','A\'man Khalaq','Utlu Ma Oohi','Wa Manyaqnut','Wa Mali','Faman Azlam','Elahe Yuruddo','Ha\'a Meem','Qala Fama Khatbukum','Qadd Sami Allah','Tabarakallazi','Amma Yatasa\'aloon'];
function juzList(){return `<ul class="list">${JUZ.map((r,i)=>`<li><a href="#/juz/${i+1}"><b class="num">${i+1}</b><span><b>Juz ${i+1} · ${JUZN[i]}</b><small>Starts ${r[0]}:${r[1]}${JUZ[i+1]?` · ends before ${JUZ[i+1][0]}:${JUZ[i+1][1]}`:' · ends 114:6'}</small></span><span class="ar">پارہ ${(i+1).toLocaleString('ar-EG')}</span></a></li>`).join('')}</ul>`}
async function juzReader(n){loading();setTitle('Juz '+n);const [ar,tr]=await Promise.all([j(`${API}/juz/${n}/quran-uthmani`),j(`${API}/juz/${n}/${S.trans}`)]);let cur=0;
 app.innerHTML=`<div class="head"><div class="ar big">الجزء ${n.toLocaleString('ar-EG')}</div><small>Juz ${n} · ${JUZN[n-1]} · ${ar.ayahs.length} ${t('ayahs')}</small></div>`+ar.ayahs.map((a,i)=>{const sn=a.surah.number,ref=`${sn}:${a.numberInSurah}`;let h='';
 if(sn!==cur){cur=sn;h=`<a class="card hl" href="#/surah/${sn}/${a.numberInSurah}"><b>${sn}. ${esc(a.surah.englishName)}</b> <span class="ar">${esc(a.surah.name)}</span></a>${a.numberInSurah===1&&sn!==1&&sn!==9?'<div class="ar bism c">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>':''}`}
 const txt=FIX[ref]||(a.numberInSurah===1&&sn!==1?stripB(a.text):a.text);
 return h+`<article class="ayah"><div class="tools"><a class="badge" href="#/surah/${sn}/${a.numberInSurah}">${ref}</a></div><p class="ar" dir="rtl" lang="ar">${esc(txt)} <span class="end">﴿${a.numberInSurah.toLocaleString('ar-EG')}﴾</span></p><p class="tr" dir="${tr.edition.direction==='rtl'?'rtl':'ltr'}">${esc(tr.ayahs[i].text)}</p></article>`}).join('')+
 `<div class="pager">${n>1?`<a class="btn" href="#/juz/${n-1}">‹ Juz ${n-1}</a>`:'<span></span>'}${n<30?`<a class="btn" href="#/juz/${n+1}">Juz ${n+1} ›</a>`:''}</div>`;scrollTo(0,0)}

// ---------- Dates, prayer times, qibla ----------
const pn=k=>PR.PNAME[k][S.ui==='ur'?1:0];
function dateCard(nx){return `<div class="card datecard"><div><b class="hij">${PR.hijri(new Date(),S.ui)}</b><small>${PR.greg(new Date(),S.ui)}</small></div>${nx?`<a href="#/prayer" class="nextp"><small>${S.ui==='ur'?'اگلی نماز':'Next prayer'}</small><b>${pn(nx.key)} ${PR.fmt12(nx.time)}</b><span class="cd" data-at="${+nx.time}"></span></a>`:''}</div>`}
let tickT;function tick(){clearInterval(tickT);const f=()=>{const els=document.querySelectorAll('.cd');if(!els.length)return clearInterval(tickT);els.forEach(e=>{let ms=+e.dataset.at-Date.now();if(ms<0){route();return}const h=Math.floor(ms/36e5),m=Math.floor(ms%36e5/6e4),sec=Math.floor(ms%6e4/1e3);e.textContent=`−${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`})};f();tickT=setInterval(f,1000)}
function prayer(){setTitle(S.ui==='ur'?'اوقاتِ نماز':'Prayer Times');const P=PR.P,pt=PR.times(),nx=PR.next();
 app.innerHTML=`${dateCard(nx)}<div class="card"><b>📍 ${esc(P.city)}</b> <small class="muted">${P.lat}, ${P.lng} · ${P.tz}</small><div class="bar"><button class="btn" id="gps">📡 ${S.ui==='ur'?'میری لوکیشن':'Use GPS'}</button><select id="city"><option value="">${S.ui==='ur'?'شہر منتخب کریں':'Choose city…'}</option>${PR.CITIES.map(c=>`<option ${c[0]===P.city?'selected':''}>${c[0]}</option>`).join('')}</select></div><small id="gmsg" class="muted"></small></div>
 <ul class="list ptimes">${PR.PRAYERS.map(k=>`<li class="${nx?.key===k?'on':''}"><span><b>${pn(k)}</b></span><span class="t">${PR.fmt12(pt[k])}</span>${k==='sunrise'?'<span></span>':`<label class="sw" title="Alert"><input type="checkbox" data-al="${k}" ${P.alerts[k]?'checked':''}>🔔</label>`}</li>`).join('')}</ul>
 <div class="form"><label>${S.ui==='ur'?'طریقۂ حساب':'Calculation method'}<select id="meth">${Object.entries(PR.METHODS).map(([k,v])=>`<option value="${k}" ${k===P.method?'selected':''}>${v}</option>`).join('')}</select></label>
 <label>${S.ui==='ur'?'عصر (فقہ)':'Asr juristic method'}<select id="madh"><option value="Hanafi">Hanafi (later Asr)</option><option value="Shafi" ${P.madhab==='Shafi'?'selected':''}>Shafi'i / Maliki / Hanbali</option></select></label>
 <label><input type="checkbox" id="adh" ${P.adhan?'checked':''}> ${S.ui==='ur'?'اذان کی آواز':'Adhan sound with alerts'}</label>
 <label>${S.ui==='ur'?'ہجری تاریخ میں تبدیلی':'Hijri date adjustment'} <span><button class="btn" id="hm">−1</button> <b id="hv">${P.hijriAdj>0?'+':''}${P.hijriAdj}</b> <button class="btn" id="hp">+1</button></span></label>
 <button class="btn" id="sched">🔔 ${S.ui==='ur'?'الرٹس فعال کریں':'Enable / refresh prayer alerts'} (${P.days} days)</button><small id="smsg" class="muted"></small></div>`;tick();
 const re=async()=>{PR.saveP();prayer();const r=await PR.schedule().catch(e=>({ok:false,reason:e.message}));const m=$('#smsg');if(m)m.textContent=r.ok?`✓ ${r.count} alerts scheduled (${r.mode})`:'Alerts: '+r.reason};
 $('#gps').onclick=async()=>{$('#gmsg').textContent='Locating…';try{await PR.locate();P.method=P.method||'Karachi';re()}catch(e){$('#gmsg').textContent='GPS unavailable ('+(e.message||e.code)+'). Choose your city instead.'}};
 $('#city').onchange=e=>{if(e.target.value){PR.setCity(e.target.value);re()}};$('#meth').onchange=e=>{P.method=e.target.value;re()};$('#madh').onchange=e=>{P.madhab=e.target.value;re()};
 $('#adh').onchange=e=>{P.adhan=e.target.checked;re()};$('#hm').onclick=()=>{P.hijriAdj=Math.max(-2,P.hijriAdj-1);PR.saveP();prayer()};$('#hp').onclick=()=>{P.hijriAdj=Math.min(2,P.hijriAdj+1);PR.saveP();prayer()};
 app.querySelectorAll('[data-al]').forEach(c=>c.onchange=()=>{P.alerts[c.dataset.al]=c.checked;re()});$('#sched').onclick=re}
let orientH;function qibla(){setTitle(S.ui==='ur'?'قبلہ':'Qibla');const P=PR.P,q=PR.qibla();
 app.innerHTML=`<div class="card c"><b>📍 ${esc(P.city)}</b><br><small class="muted">${P.lat}, ${P.lng}</small></div><div class="compass"><div class="dial" id="dial"><span class="n">N</span><span class="e">E</span><span class="s">S</span><span class="w">W</span><div class="needle" style="transform:rotate(${q}deg)"><span>🕋</span></div></div></div>
 <div class="c"><div class="deg">${q.toFixed(1)}°</div><small class="muted">${S.ui==='ur'?'شمال سے گھڑی کی سمت میں قبلہ کا زاویہ':'Qibla bearing from True North (clockwise)'}</small><p id="hd" class="muted">${S.ui==='ur'?'کمپاس کے لیے فون کو سیدھا رکھیں':'Hold your phone flat. Compass needs a device with a magnetometer.'}</p><button class="btn" id="cmp">🧭 ${S.ui==='ur'?'کمپاس شروع کریں':'Start compass'}</button> <a class="btn" href="#/prayer">📍 ${S.ui==='ur'?'لوکیشن بدلیں':'Change location'}</a></div>`;
 const on=e=>{let h=e.webkitCompassHeading??(e.absolute||e.type==='deviceorientationabsolute'?(360-e.alpha)%360:null);if(h==null)return;const d=$('#dial');if(!d)return off();d.style.transform=`rotate(${-h}deg)`;const diff=((q-h+540)%360)-180;$('#hd').textContent=`Heading ${h.toFixed(0)}° · ${Math.abs(diff)<5?'✅ Facing Qibla':(diff>0?'turn right ':'turn left ')+Math.abs(diff).toFixed(0)+'°'}`};
 const off=()=>{removeEventListener('deviceorientationabsolute',on);removeEventListener('deviceorientation',on)};
 $('#cmp').onclick=async()=>{try{if(window.DeviceOrientationEvent?.requestPermission)await DeviceOrientationEvent.requestPermission()}catch{}off();addEventListener('ondeviceorientationabsolute' in window?'deviceorientationabsolute':'deviceorientation',on)}}

// ---------- Reader + audio ----------
const audio=new Audio();let queue=[],qi=0,qmeta='';
function playAt(i){qi=i;const it=queue[i];if(!it)return stop();audio.src=it.url;audio.play().catch(()=>{});$('#player').hidden=false;$('#pPlay').textContent='⏸';$('#pInfo').textContent=qmeta+' '+it.ref;
 document.querySelectorAll('.ayah.playing').forEach(e=>e.classList.remove('playing'));const el=document.getElementById('a'+it.ref.split(':')[1]);if(el&&location.hash.includes('/surah/'+it.ref.split(':')[0])){el.classList.add('playing');el.scrollIntoView({block:'center',behavior:'smooth'})}}
function stop(){audio.pause();$('#player').hidden=true;document.querySelectorAll('.ayah.playing').forEach(e=>e.classList.remove('playing'))}
audio.onended=()=>{if(queue.continuous)playAt(qi+1);else{ $('#pPlay').textContent='▶'}};
$('#pPlay').onclick=()=>{if(audio.paused){audio.play();$('#pPlay').textContent='⏸'}else{audio.pause();$('#pPlay').textContent='▶'}};
$('#pNext').onclick=()=>playAt(qi+1);$('#pPrev').onclick=()=>playAt(Math.max(0,qi-1));$('#pClose').onclick=stop;
window.__audio=audio;

async function reader(n,start){loading();
 const [d,trs,recs]=await Promise.all([j(`${API}/surah/${n}/editions/quran-uthmani,${S.trans},${S.reciter}`),editions('translation'),audioEds()]);
 const [ar,tr,au]=d;setTitle(`${n}. ${ar.englishName}`);
 const bm=LS.get('bookmarks',[]);const rtl=tr.edition.direction==='rtl';
 app.innerHTML=`<div class="bar"><select id="tr" aria-label="${t('translation')}">${opt(trs,S.trans)}</select><select id="rc" aria-label="${t('reciter')}">${opt(recs,S.reciter)}</select><button class="btn" id="playAll">▶ ${t('play')}</button></div>
 <div class="head"><div class="ar big">${esc(ar.name)}</div><small>${esc(ar.englishNameTranslation)} · ${ar.numberOfAyahs} ${t('ayahs')}</small>${n!=1&&n!=9?'<div class="ar bism">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>':''}</div>
 ${ar.ayahs.map((a,i)=>{let txt=FIX[`${n}:${a.numberInSurah}`]||a.text;if(n!=1&&i===0)txt=stripB(txt);const ref=`${n}:${a.numberInSurah}`;
 return `<article class="ayah" id="a${a.numberInSurah}"><div class="tools"><span class="badge">${ref}</span><button data-play="${i}" title="Play">▶</button><button data-taf="${ref}" title="${t('tafsir')}">📘</button><button data-bm="${ref}" title="Bookmark">${bm.some(b=>b.ref===ref)?'★':'☆'}</button><button data-cp="${i}" title="Copy">⧉</button></div>
 <p class="ar" dir="rtl" lang="ar">${esc(txt)} <span class="end">﴿${a.numberInSurah.toLocaleString('ar-EG')}﴾</span></p><p class="tr ${tr.edition.language==='ur'?'ur':''}" dir="${rtl?'rtl':'ltr'}">${esc(tr.ayahs[i].text)}</p></article>`}).join('')}
 <div class="pager">${n>1?`<a class="btn" href="#/surah/${n-1}">‹ ${n-1}</a>`:'<span></span>'}${n<114?`<a class="btn" href="#/surah/${+n+1}">${+n+1} ›</a>`:''}</div>`;
 $('#tr').onchange=e=>{S.trans=e.target.value;save();reader(n,lastVisible())};
 $('#rc').onchange=e=>{S.reciter=e.target.value;save();stop();reader(n,lastVisible())};
 const mk=cont=>{queue=au.ayahs.map(a=>({url:a.audio,ref:`${n}:${a.numberInSurah}`}));queue.continuous=cont;qmeta=ar.englishName};
 $('#playAll').onclick=()=>{mk(true);playAt(0)};
 app.onclick=e=>{const b=e.target.closest('button');if(!b)return;
  if(b.dataset.play){mk(false);playAt(+b.dataset.play)}
  if(b.dataset.taf)tafsir(b.dataset.taf);
  if(b.dataset.bm){let l=LS.get('bookmarks',[]);const r=b.dataset.bm;if(l.some(x=>x.ref===r)){l=l.filter(x=>x.ref!==r);b.textContent='☆'}else{l.unshift({ref:r,name:ar.englishName,text:tr.ayahs[r.split(':')[1]-1].text.slice(0,120)});b.textContent='★'}LS.set('bookmarks',l)}
  if(b.dataset.cp){const i=+b.dataset.cp;navigator.clipboard?.writeText(`${ar.ayahs[i].text}\n${tr.ayahs[i].text}\n(${n}:${i+1})`)}};
 if(start){document.getElementById('a'+start)?.scrollIntoView({block:'start'})}else scrollTo(0,0);
 const io=new IntersectionObserver(es=>es.forEach(x=>{if(x.isIntersecting)LS.set('lastRead',{s:n,a:+x.target.id.slice(1),name:ar.englishName})}),{rootMargin:'-40% 0px -55% 0px'});
 document.querySelectorAll('.ayah').forEach(el=>io.observe(el))}
const lastVisible=()=>LS.get('lastRead',{}).a;
async function tafsir(ref){$('#sheet').hidden=false;const body=$('#sheetBody');body.innerHTML=t('loading');
 const eds=await editions('tafsir');const draw=async()=>{body.innerHTML=`<h3>${t('tafsir')} ${ref}</h3><select id="tf">${opt(eds,S.tafsir)}</select><div id="tfx" class="muted">${t('loading')}</div>`;
 $('#tf').onchange=e=>{S.tafsir=e.target.value;save();draw()};
 try{const d=await j(`${API}/ayah/${ref}/${S.tafsir}`);$('#tfx').className='taf';$('#tfx').dir=d.edition.direction||'rtl';$('#tfx').textContent=d.text}catch{$('#tfx').textContent=t('err')}};draw()}

// ---------- Hadith ----------
async function hadithHome(){setTitle(t('hadith'));loading();const [eds,info]=await Promise.all([j(HAD+'/editions.json'),j(HAD+'/info.json')]);
 const langs=[...new Set(Object.values(eds).flatMap(b=>b.collection.map(c=>c.name.split('-')[0])))];
 app.innerHTML=`<label class="bar">${t('lang')} <select id="hl">${langs.map(l=>`<option ${l===S.hlang?'selected':''}>${l}</option>`)}</select></label><ul class="list">${Object.entries(eds).map(([k,b])=>{const has=b.collection.some(c=>c.name.startsWith(S.hlang+'-'));return `<li><a href="#/hadith/${k}"><span><b>${esc(b.name)}</b><small>${Object.keys(info[k]?.metadata.sections||{}).length-1} ${t('books')} · ${b.collection.map(c=>c.language).filter((v,i,a)=>a.indexOf(v)===i).join(', ')}${has?'':' · ('+S.hlang+' n/a)'}</small></span></a></li>`}).join('')}</ul>`;
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
 app.innerHTML=`<form id="sf" class="bar"><input class="inp" id="q" value="${esc(q)}" placeholder="${t('q')}"><select id="se"><option value="quran-simple-clean">AR · Arabic text</option>${opt(trs,S.searchEd||S.trans)}</select><button class="btn">🔍</button></form><div id="sr"></div>`;
 $('#sf').onsubmit=e=>{e.preventDefault();S.searchEd=$('#se').value;save();run()};if(S.searchEd==='quran-simple-clean')$('#se').value='quran-simple-clean';
 const run=async()=>{const v=$('#q').value.trim();if(!v)return;history.replaceState(null,'','#/search/'+encodeURIComponent(v));$('#sr').innerHTML=t('loading');
  // also allow direct ref "2:255"
  const m=v.match(/^(\d{1,3})(?::(\d{1,3}))?$/);if(m){location.hash=`#/surah/${m[1]}${m[2]?'/'+m[2]:''}`;return}
  try{const r=await fetch(`${API}/search/${encodeURIComponent(v)}/all/${$('#se').value}`).then(r=>r.json());const ms=r.data?.matches||[];
   $('#sr').innerHTML=`<p class="muted">${r.data?.count||0} ${t('results')}</p>`+ms.slice(0,300).map(x=>`<a class="card" href="#/surah/${x.surah.number}/${x.numberInSurah}"><span class="badge">${x.surah.englishName} ${x.surah.number}:${x.numberInSurah}</span><p dir="auto">${esc(x.text).replace(new RegExp(v.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi'),s=>`<mark>${s}</mark>`)}</p></a>`).join('')}catch{$('#sr').textContent=t('err')}};
 if(q)run()}

function bookmarks(){setTitle(t('bookmarks'));const l=LS.get('bookmarks',[]);app.innerHTML=l.length?l.map(b=>`<a class="card" href="#/surah/${b.ref.replace(':','/')}"><span class="badge">${esc(b.name)} ${b.ref}</span><p>${esc(b.text)}…</p></a>`).join(''):`<p class="muted c">${t('none')}</p>`}
async function settings(){setTitle(t('settings'));const [trs,recs,tfs]=await Promise.all([editions('translation'),audioEds(),editions('tafsir')]);
 app.innerHTML=`<div class="form"><label>${t('uiLang')}<select id="s_ui"><option value="en">English</option><option value="ur" ${S.ui==='ur'?'selected':''}>اردو</option></select></label>
 <label>${t('translation')} (${trs.length})<select id="s_trans">${opt(trs,S.trans)}</select></label><label>${t('reciter')}<select id="s_reciter">${opt(recs,S.reciter)}</select></label><label>${t('tafsir')}<select id="s_tafsir">${opt(tfs,S.tafsir)}</select></label>
 <label>${t('size')} <input type="range" min="20" max="48" id="s_size" value="${S.size}"></label><label><input type="checkbox" id="s_dark" ${S.dark?'checked':''}> ${t('dark')}</label>
 <p class="muted">Data: AlQuran.cloud (Tanzil text), fawazahmed0/hadith-api. Fonts: Amiri Quran, Noto Nastaliq Urdu.</p></div>`;
 ['ui','trans','reciter','tafsir'].forEach(k=>$('#s_'+k).onchange=e=>{S[k]=e.target.value;save();applyUI();if(k==='ui')settings()});
 $('#s_size').oninput=e=>{S.size=+e.target.value;save();applyUI()};$('#s_dark').onchange=e=>{S.dark=e.target.checked;save();applyUI()}}

async function route(){$('#sheet').hidden=true;const p=location.hash.replace(/^#\/?/,'').split('/').map(decodeURIComponent);app.onclick=null;
 $('#back').style.visibility=p[0]?'visible':'hidden';
 document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',('#/'+(['surah','juz'].includes(p[0])?'':p[0]))===b.dataset.r));
 try{if(p[0]==='surah')await reader(+p[1],p[2]);else if(p[0]==='hadith')p[2]?await hadithSection(p[1],p[2]):p[1]?await hadithBook(p[1]):await hadithHome();
  else if(p[0]==='search')await search(p[1]||'');else if(p[0]==='bookmarks')bookmarks();else if(p[0]==='prayer')prayer();else if(p[0]==='qibla')qibla();else if(p[0]==='juz')p[1]?await juzReader(+p[1]):await home('juz');else if(p[0]==='settings')await settings();else await home()}
 catch(e){console.error(e);app.innerHTML=`<p class="muted c">${t('err')}</p><p class="c"><button class="btn" onclick="location.reload()">↻</button></p>`}}
addEventListener('hashchange',route);applyUI();route();
if(Object.values(PR.P.alerts).some(Boolean)&&localStorage.getItem('prayer'))PR.schedule().catch(()=>{});
if('serviceWorker' in navigator&&import.meta.env.PROD)addEventListener('load',()=>navigator.serviceWorker.register(import.meta.env.BASE_URL+'sw.js'));
